const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const SECRET = process.env.JWT_SECRET;
if (!SECRET || SECRET.length < 32) throw new Error('JWT_SECRET deve possuir pelo menos 32 caracteres.');

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
      'SELECT id_usuario, email, senha, nome, perfil, primeiro_acesso, id_instrutor_vinculado FROM Usuarios WHERE email = ? LIMIT 1',
      [email]
    );
    const usuario = rows[0];
    const hashArmazenado = usuario && /^\$2[aby]\$/.test(usuario.senha);
    const senhaValida = hashArmazenado
      ? await bcrypt.compare(senha, usuario.senha)
      : usuario ? senha === usuario.senha : await bcrypt.compare(senha, DUMMY_HASH);

    if (!usuario || !senhaValida) return res.status(401).json({ erro: 'E-mail/matricula ou senha incorretos.' });

    // Compatibilidade controlada: converte a senha legada em hash no primeiro login valido.
    if (!hashArmazenado) {
      const hash = await bcrypt.hash(senha, 12);
      await db.execute('UPDATE Usuarios SET senha = ? WHERE id_usuario = ?', [hash, usuario.id_usuario]);
    }

    if (usuario.primeiro_acesso === 1) {
      const trocaToken = jwt.sign(
        { sub: usuario.id_usuario, finalidade: 'primeiro_acesso' }, SECRET,
        { expiresIn: '10m', issuer: 'gera', audience: 'gera-web' }
      );
      return res.json({ primeiro_acesso: true, troca_token: trocaToken, mensagem: 'Troca de senha obrigatoria.' });
    }

    const token = jwt.sign({
      id: usuario.id_usuario,
      perfil: usuario.perfil,
      nome: usuario.nome,
      id_instrutor: usuario.id_instrutor_vinculado
    }, SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h', issuer: 'gera', audience: 'gera-web' });

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
    const payload = jwt.verify(trocaToken, SECRET, { issuer: 'gera', audience: 'gera-web' });
    if (payload.finalidade !== 'primeiro_acesso') return res.status(403).json({ erro: 'Token de troca invalido.' });
    const hash = await bcrypt.hash(novaSenha, 12);
    const [result] = await db.execute(
      'UPDATE Usuarios SET senha = ?, primeiro_acesso = 0 WHERE id_usuario = ? AND primeiro_acesso = 1',
      [hash, payload.sub]
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

function autenticar(req, res, next) {
  const match = /^Bearer\s+([^\s]+)$/i.exec(req.headers.authorization || '');
  if (!match) return res.status(401).json({ erro: 'Token nao fornecido.' });
  return jwt.verify(match[1], SECRET, { issuer: 'gera', audience: 'gera-web' }, (err, user) => {
    if (err) return res.status(403).json({ erro: 'Token invalido ou expirado.' });
    req.usuario = user;
    return next();
  });
}

module.exports = router;
module.exports.autenticar = autenticar;
