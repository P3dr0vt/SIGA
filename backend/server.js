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

function normalizarOrigem(valor) {
  if (typeof valor !== 'string' || !valor.trim()) return null;
  try {
    return new URL(valor.trim()).origin;
  } catch {
    return null;
  }
}

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(normalizarOrigem).filter(Boolean);
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
    if (!origin || allowedOrigins.includes(normalizarOrigem(origin))) return callback(null, true);
    const error = new Error('Origem nao autorizada.');
    error.code = 'ORIGIN_NOT_ALLOWED';
    return callback(error);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
}));
app.use((error, req, res, next) => {
  if (error.code === 'ORIGIN_NOT_ALLOWED') {
    return res.status(403).json({ erro: 'Origem nao autorizada.' });
  }
  return next(error);
});
app.use(express.json({ limit: '32kb' }));
app.use(express.urlencoded({ extended: false, limit: '32kb' }));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rotas da API
app.get('/api/health', async (req, res) => {
  const ausentes = [];
  if (!process.env.DATABASE_URL) ausentes.push('DATABASE_URL');
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) ausentes.push('JWT_SECRET');
  if (ausentes.length > 0) {
    return res.status(503).json({ status: 'configuracao_pendente', variaveis: ausentes });
  }
  try {
    const [rows] = await db.execute(`
      SELECT
        to_regclass('public.usuarios') AS usuarios,
        COUNT(*) FILTER (
          WHERE column_name IN (
            'id_usuario', 'email', 'senha', 'nome', 'perfil', 'primeiro_acesso',
            'ativo', 'tentativas_login', 'bloqueado_ate', 'token_version',
            'senha_alterada_em', 'id_instrutor_vinculado'
          )
        )::integer AS colunas_seguranca
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'usuarios'
    `);
    if (!rows[0] || !rows[0].usuarios) {
      return res.status(503).json({ status: 'schema_pendente' });
    }
    if (rows[0].colunas_seguranca !== 12) {
      return res.status(503).json({ status: 'schema_desatualizado' });
    }
    return res.json({ status: 'ok', banco: 'conectado', schema: 'pronto' });
  } catch (error) {
    const categorias = {
      '28P01': 'credenciais_do_banco',
      '3D000': 'banco_inexistente',
      ENOTFOUND: 'endereco_do_banco',
      ECONNREFUSED: 'conexao_recusada',
      ETIMEDOUT: 'tempo_de_conexao',
      INVALID_SSL_CA: 'configuracao_certificado_tls',
      SELF_SIGNED_CERT_IN_CHAIN: 'certificado_tls',
      DEPTH_ZERO_SELF_SIGNED_CERT: 'certificado_tls',
      UNABLE_TO_VERIFY_LEAF_SIGNATURE: 'certificado_tls'
    };
    console.error('Falha no health check do banco:', error);
    return res.status(503).json({ status: 'banco_indisponivel', categoria: categorias[error.code] || 'conexao' });
  }
});

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

function iniciarServidor() {
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
