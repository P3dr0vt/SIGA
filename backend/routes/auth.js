const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const SECRET = process.env.JWT_SECRET;

function jwtSecret() {
  if (!SECRET || SECRET.length < 32) {
    const error = new Error('Autenticacao nao configurada.');
    error.code = 'JWT_NOT_CONFIGURED';
    throw error;
  }
  return SECRET;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DUMMY_HASH = '$2a$12$wIhIu91BMVNyfcv3Arz.U.WmB3xFJx0zKXlF8bXh4kPuFtQOFjVjG';

function normalizarEmail(valor) {
  if (typeof valor !== 'string') return null;
  const email = valor.includes('@') ? valor : `${valor}@senai.com`;
  const normalizado = email.toLowerCase().trim();
  return EMAIL_PATTERN.test(normalizado) && normalizado.length <= 254 ? normalizado : null;
}

function senhaForte(senha) {
  return typeof senha === 'string' && senha.length >= 10 && senha.length <= 128 &&
    /[a-z]/.test(senha) && /[A-Z]/.test(senha) && /\d/.test(senha) && /[^A-Za-z0-9]/.test(senha);
}

router.post('/login', async (req, res) => {
  const { senha } = req.body;
  const email = normalizarEmail(req.body.email);
  if (!email || typeof senha !== 'string' || senha.length > 128) {
    return res.status(400).json({ erro: 'E-mail e senha validos sao obrigatorios.' });
  }

  try {
    const [rows] = await db.execute(
      `SELECT id_usuario, email, senha, nome, perfil, primeiro_acesso,
              id_instrutor_vinculado, ativo, tentativas_login, bloqueado_ate, token_version
       FROM Usuarios WHERE email = ? LIMIT 1`,
      [email]
    );
    const usuario = rows[0];
    if (usuario && (!usuario.ativo || (usuario.bloqueado_ate && new Date(usuario.bloqueado_ate) > new Date()))) {
      return res.status(429).json({ erro: 'Conta temporariamente indisponivel. Tente mais tarde.' });
    }
    const hashArmazenado = usuario && /^\$2[aby]\$/.test(usuario.senha) ? usuario.senha : DUMMY_HASH;
    const senhaValida = await bcrypt.compare(senha, hashArmazenado);

    if (!usuario || !senhaValida) {
      if (usuario) {
        await db.execute(
          `UPDATE Usuarios
           SET tentativas_login = LEAST(tentativas_login + 1, 20),
               bloqueado_ate = CASE WHEN tentativas_login + 1 >= 5 THEN NOW() + INTERVAL '15 minutes' ELSE bloqueado_ate END
           WHERE id_usuario = ?`,
          [usuario.id_usuario]
        );
      }
      return res.status(401).json({ erro: 'E-mail/matricula ou senha incorretos.' });
    }

    await db.execute(
      'UPDATE Usuarios SET tentativas_login = 0, bloqueado_ate = NULL WHERE id_usuario = ?',
      [usuario.id_usuario]
    );

    if (usuario.primeiro_acesso === true) {
      const trocaToken = jwt.sign(
        { sub: usuario.id_usuario, ver: usuario.token_version, finalidade: 'primeiro_acesso' }, jwtSecret(),
        { expiresIn: '10m', issuer: 'gera', audience: 'gera-web' }
      );
      return res.json({ primeiro_acesso: true, troca_token: trocaToken, mensagem: 'Troca de senha obrigatoria.' });
    }

    const token = jwt.sign({
      id: usuario.id_usuario,
      perfil: usuario.perfil,
      nome: usuario.nome,
      id_instrutor: usuario.id_instrutor_vinculado,
      ver: usuario.token_version
    }, jwtSecret(), { expiresIn: process.env.JWT_EXPIRES_IN || '8h', issuer: 'gera', audience: 'gera-web' });

    return res.json({ token, usuario: {
      nome: usuario.nome, perfil: usuario.perfil,
      id_instrutor: usuario.id_instrutor_vinculado, email: usuario.email
    } });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
});

router.post('/trocar-senha', async (req, res) => {
  const { troca_token: trocaToken, novaSenha } = req.body;
  if (!trocaToken || !novaSenha) return res.status(400).json({ erro: 'Token e nova senha sao obrigatorios.' });
  if (!senhaForte(novaSenha)) {
    return res.status(400).json({ erro: 'Use 10 caracteres, com maiuscula, minuscula, numero e simbolo.' });
  }
  try {
    const payload = jwt.verify(trocaToken, jwtSecret(), { issuer: 'gera', audience: 'gera-web' });
    if (payload.finalidade !== 'primeiro_acesso') return res.status(403).json({ erro: 'Token de troca invalido.' });
    const hash = await bcrypt.hash(novaSenha, 12);
    const [result] = await db.execute(
      `UPDATE Usuarios SET senha = ?, primeiro_acesso = FALSE, senha_alterada_em = NOW(),
                           token_version = token_version + 1, tentativas_login = 0, bloqueado_ate = NULL
       WHERE id_usuario = ? AND primeiro_acesso = TRUE AND token_version = ?`,
      [hash, payload.sub, payload.ver]
    );
    if (result.affectedRows === 0) return res.status(403).json({ erro: 'Token ja utilizado ou invalido.' });
    return res.json({ mensagem: 'Senha alterada. Faca login novamente.' });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(403).json({ erro: 'Token de troca invalido ou expirado.' });
    }
    console.error('Erro ao trocar senha:', error);
    return res.status(500).json({ erro: 'Erro ao alterar senha.' });
  }
});

// Provisionamento inicial sem Node local. Remova ADMIN_BOOTSTRAP_TOKEN da Vercel apos o uso.
router.post('/bootstrap-admin', async (req, res) => {
  const configuredToken = process.env.ADMIN_BOOTSTRAP_TOKEN || '';
  const receivedToken = req.headers['x-bootstrap-token'] || '';
  if (configuredToken.length < 32 || typeof receivedToken !== 'string' || receivedToken.length !== configuredToken.length ||
      !crypto.timingSafeEqual(Buffer.from(receivedToken), Buffer.from(configuredToken))) {
    return res.status(404).json({ erro: 'Rota nao encontrada.' });
  }

  const email = normalizarEmail(req.body.email);
  const nome = typeof req.body.nome === 'string' ? req.body.nome.trim() : '';
  const senha = req.body.senha;
  if (!email || nome.length < 2 || nome.length > 255 || !senhaForte(senha)) {
    return res.status(400).json({ erro: 'Nome, e-mail ou senha fora da politica de seguranca.' });
  }

  try {
    const hash = await bcrypt.hash(senha, 12);
    await db.execute(
      `INSERT INTO Usuarios (email, senha, nome, perfil, primeiro_acesso, ativo, senha_alterada_em)
       VALUES (?, ?, ?, 'admin', FALSE, TRUE, NOW())
       ON CONFLICT (email) DO UPDATE SET senha = EXCLUDED.senha, nome = EXCLUDED.nome,
         perfil = 'admin', primeiro_acesso = FALSE, ativo = TRUE, tentativas_login = 0,
         bloqueado_ate = NULL, senha_alterada_em = NOW(), token_version = Usuarios.token_version + 1`,
      [email, hash, nome]
    );
    res.setHeader('Cache-Control', 'no-store');
    return res.status(201).json({ mensagem: 'Administrador provisionado. Remova ADMIN_BOOTSTRAP_TOKEN agora.' });
  } catch (error) {
    console.error('Erro no provisionamento inicial:', error);
    const categorias = {
      '28P01': 'credenciais_do_banco',
      '42P01': 'tabela_usuarios_ausente',
      '42703': 'schema_desatualizado',
      '42501': 'permissao_do_banco',
      '23502': 'coluna_obrigatoria',
      '23503': 'relacionamento_invalido',
      '23505': 'registro_duplicado',
      '23514': 'restricao_do_schema',
      ENOTFOUND: 'endereco_do_banco',
      ECONNREFUSED: 'conexao_recusada',
      ETIMEDOUT: 'tempo_de_conexao',
      INVALID_SSL_CA: 'configuracao_certificado_tls',
      SELF_SIGNED_CERT_IN_CHAIN: 'certificado_tls',
      DEPTH_ZERO_SELF_SIGNED_CERT: 'certificado_tls',
      UNABLE_TO_VERIFY_LEAF_SIGNATURE: 'certificado_tls'
    };
    return res.status(500).json({
      erro: 'Erro ao provisionar administrador.',
      categoria: categorias[error.code] || 'banco_de_dados'
    });
  }
});

// Gestao de administradores: disponivel somente para administradores autenticados.
router.get('/usuarios/administradores', autenticar, async (req, res) => {
  if (!req.usuario || req.usuario.perfil !== 'admin') {
    return res.status(403).json({ erro: 'Apenas administradores podem consultar esta lista.' });
  }
  try {
    const [rows] = await db.execute(
      `SELECT id_usuario, email, nome, ativo, primeiro_acesso
       FROM Usuarios WHERE perfil = 'admin' ORDER BY nome, email`
    );
    res.setHeader('Cache-Control', 'no-store');
    return res.json(rows);
  } catch (error) {
    console.error('Erro ao listar administradores:', error);
    return res.status(500).json({ erro: 'Erro ao listar administradores.' });
  }
});

router.post('/usuarios/administradores', autenticar, async (req, res) => {
  if (!req.usuario || req.usuario.perfil !== 'admin') {
    return res.status(403).json({ erro: 'Apenas administradores podem criar outra conta administrativa.' });
  }

  const email = normalizarEmail(req.body.email);
  const nome = typeof req.body.nome === 'string' ? req.body.nome.trim() : '';
  if (!email || nome.length < 2 || nome.length > 255) {
    return res.status(400).json({ erro: 'Informe um nome e um e-mail validos.' });
  }

  const senhaTemporaria = `${crypto.randomBytes(12).toString('base64url')}Aa1!`;
  try {
    const hash = await bcrypt.hash(senhaTemporaria, 12);
    const [result] = await db.execute(
      `INSERT INTO Usuarios (email, senha, nome, perfil, primeiro_acesso, ativo)
       VALUES (?, ?, ?, 'admin', TRUE, TRUE)
       RETURNING id_usuario`,
      [email, hash, nome]
    );
    res.setHeader('Cache-Control', 'no-store');
    return res.status(201).json({
      id_usuario: result.insertId,
      email,
      senha_temporaria: senhaTemporaria,
      mensagem: 'Administrador criado. A senha devera ser alterada no primeiro acesso.'
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ erro: 'Ja existe um usuario com este e-mail.' });
    }
    console.error('Erro ao criar administrador:', error);
    return res.status(500).json({ erro: 'Erro ao criar administrador.' });
  }
});

// Redefinicao administrativa: a senha temporaria e exibida uma unica vez.
router.post('/usuarios/:id/resetar-senha', autenticar, async (req, res) => {
  if (!req.usuario || req.usuario.perfil !== 'admin') {
    return res.status(403).json({ erro: 'Apenas administradores podem redefinir senhas.' });
  }

  const idUsuario = Number(req.params.id);
  if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
    return res.status(400).json({ erro: 'Usuario invalido.' });
  }

  const senhaTemporaria = `${crypto.randomBytes(9).toString('base64url')}Aa1!`;
  try {
    const hash = await bcrypt.hash(senhaTemporaria, 12);
    const [result] = await db.execute(
      `UPDATE Usuarios SET senha = ?, primeiro_acesso = TRUE, senha_alterada_em = NOW(),
                           token_version = token_version + 1, tentativas_login = 0, bloqueado_ate = NULL
       WHERE id_usuario = ?`,
      [hash, idUsuario]
    );
    if (result.affectedRows === 0) return res.status(404).json({ erro: 'Usuario nao encontrado.' });
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ senha_temporaria: senhaTemporaria });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return res.status(500).json({ erro: 'Erro ao redefinir senha.' });
  }
});

async function autenticar(req, res, next) {
  const match = /^Bearer\s+([^\s]+)$/i.exec(req.headers.authorization || '');
  if (!match) return res.status(401).json({ erro: 'Token nao fornecido.' });
  try {
    const user = jwt.verify(match[1], jwtSecret(), { issuer: 'gera', audience: 'gera-web' });
    const [rows] = await db.execute(
      'SELECT ativo, token_version FROM Usuarios WHERE id_usuario = ? LIMIT 1',
      [user.id]
    );
    if (!rows[0] || !rows[0].ativo || rows[0].token_version !== user.ver) {
      return res.status(403).json({ erro: 'Sessao revogada.' });
    }
    req.usuario = user;
    return next();
  } catch (error) {
    return res.status(403).json({ erro: 'Token invalido ou expirado.' });
  }
}

module.exports = router;
module.exports.autenticar = autenticar;
