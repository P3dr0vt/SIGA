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

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Rotas da API
app.use('/api/auth', auth);
app.use('/api/instrutores', auth.autenticar, instrutoresRoutes);
app.use('/api/salas', auth.autenticar, salasRoutes);
app.use('/api/turmas', auth.autenticar, turmasRoutes);
app.use('/api/alocacoes', auth.autenticar, alocacoesRoutes);
app.use('/api/notificacoes', auth.autenticar, notificacoesRoutes);
app.use('/api/transferencias', auth.autenticar, transferenciasRoutes);

// Rota padrão: redireciona para o login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'login.html'));
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

iniciarServidor();
