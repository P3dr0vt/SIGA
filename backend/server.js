const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/database');

const auth = require('./routes/auth');
const instrutoresRoutes = require('./routes/instrutores');
const salasRoutes = require('./routes/salas');
const turmasRoutes = require('./routes/turmas');
const alocacoesRoutes = require('./routes/alocacoes');
const notificacoesRoutes = require('./routes/notificacoes');
const transferenciasRoutes = require('./routes/transferencias');

const app = express();
const PORT = process.env.PORT || 3000;
app.disable('x-powered-by');
app.set('trust proxy', 1);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map((item) => item.trim()).filter(Boolean);
const loginAttempts = new Map();

function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; font-src 'self' https://cdn.jsdelivr.net; script-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  next();
}

function limitarLogin(req, res, next) {
  const agora = Date.now();
  const chave = req.ip || req.socket.remoteAddress || 'desconhecido';
  const atual = loginAttempts.get(chave);
  const janela = 15 * 60 * 1000;
  if (!atual || agora - atual.inicio > janela) {
    loginAttempts.set(chave, { inicio: agora, tentativas: 1 });
    return next();
  }
  atual.tentativas += 1;
  if (atual.tentativas > 10) {
    res.setHeader('Retry-After', Math.ceil((janela - (agora - atual.inicio)) / 1000));
    return res.status(429).json({ erro: 'Muitas tentativas. Aguarde antes de tentar novamente.' });
  }
  return next();
}

// Middlewares
app.use(securityHeaders);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origem nao autorizada.'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
}));
app.use(express.json({ limit: '32kb' }));
app.use(express.urlencoded({ extended: false, limit: '32kb' }));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rotas da API
app.use('/api/auth/login', limitarLogin);
app.use('/api/auth', auth);
app.use('/api/instrutores', auth.autenticar, instrutoresRoutes);
app.use('/api/salas', auth.autenticar, salasRoutes);
app.use('/api/turmas', auth.autenticar, turmasRoutes);
app.use('/api/alocacoes', auth.autenticar, alocacoesRoutes);
app.use('/api/notificacoes', auth.autenticar, notificacoesRoutes);
app.use('/api/transferencias', auth.autenticar, transferenciasRoutes);

// Rota padrão: redireciona para o login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

async function garantirEstruturaBanco() {
  // Colunas na tabela Alocacoes
  const [colAloc] = await db.execute(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Alocacoes'
    AND COLUMN_NAME IN ('criado_por_perfil', 'criado_por_usuario')
  `);
  const exAloc = new Set(colAloc.map(c => c.COLUMN_NAME));
  if (!exAloc.has('criado_por_perfil')) {
    await db.execute("ALTER TABLE Alocacoes ADD COLUMN criado_por_perfil ENUM('admin', 'instrutor') NOT NULL DEFAULT 'admin'");
  }
  if (!exAloc.has('criado_por_usuario')) {
    await db.execute('ALTER TABLE Alocacoes ADD COLUMN criado_por_usuario INT NULL');
  }

  // Coluna tipo na tabela Salas
  const [colSalas] = await db.execute(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Salas'
    AND COLUMN_NAME = 'tipo'
  `);
  if (colSalas.length === 0) {
    await db.execute("ALTER TABLE Salas ADD COLUMN tipo ENUM('SALA', 'LABORATORIO') NOT NULL DEFAULT 'SALA'");
  }

  // Tabela de Notificacoes
  await db.execute(`
    CREATE TABLE IF NOT EXISTS Notificacoes (
      id_notificacao INT AUTO_INCREMENT PRIMARY KEY,
      id_instrutor INT NOT NULL,
      mensagem TEXT NOT NULL,
      lida TINYINT(1) DEFAULT 0,
      data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_notif_instrutor FOREIGN KEY (id_instrutor) 
          REFERENCES Instrutores(id_instrutor) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Tabela de Transferencias Pendentes
  await db.execute(`
    CREATE TABLE IF NOT EXISTS Transferencias_Pendentes (
      id_transferencia INT AUTO_INCREMENT PRIMARY KEY,
      id_alocacao_original INT NOT NULL,
      id_instrutor_origem INT NOT NULL,
      id_instrutor_destino INT NOT NULL,
      data_inicio_transferencia DATE NOT NULL,
      data_fim_transferencia DATE NOT NULL,
      status ENUM('pendente', 'aceita', 'rejeitada') NOT NULL DEFAULT 'pendente',
      data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_trans_aloc FOREIGN KEY (id_alocacao_original) 
          REFERENCES Alocacoes(id_alocacao) ON DELETE CASCADE,
      CONSTRAINT fk_trans_inst_origem FOREIGN KEY (id_instrutor_origem) 
          REFERENCES Instrutores(id_instrutor) ON DELETE CASCADE,
      CONSTRAINT fk_trans_inst_destino FOREIGN KEY (id_instrutor_destino) 
          REFERENCES Instrutores(id_instrutor) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function iniciarServidor() {
  try {
    await garantirEstruturaBanco();
  } catch (error) {
    console.error('Aviso: não foi possível validar/atualizar a estrutura do banco:', error.message);
  }

  app.listen(PORT, () => {
    console.log('==============================================');
    console.log('  GERA - Sistema Integrado de Gestão de Alocação');
    console.log('==============================================');
    console.log(`  Servidor rodando em: http://localhost:${PORT}`);
    console.log('  Pressione Ctrl+C para encerrar.');
    console.log('==============================================');
  });
}

if (require.main === module) iniciarServidor();

module.exports = app;
