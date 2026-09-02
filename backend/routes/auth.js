const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');

const SECRET = 'siga_secret_key_senai_2024';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  let { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
  }

  // Aceita matrícula pura (ex: "1001") convertendo para e-mail
  if (!email.includes('@')) {
    email = `${email}@senai.com`;
  }

  email = email.toLowerCase().trim();

  try {
    const [rows] = await db.execute('SELECT * FROM Usuarios WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ erro: 'E-mail/matrícula ou senha incorretos.' });
    }

    const usuario = rows[0];

    if (senha !== usuario.senha) {
      return res.status(401).json({ erro: 'E-mail/matrícula ou senha incorretos.' });
    }

    // Primeiro acesso: força troca de senha
    if (usuario.primeiro_acesso === 1) {
      return res.json({
        primeiro_acesso: true,
        email: usuario.email,
        mensagem: 'Troca de senha obrigatória no primeiro acesso.'
      });
    }

    // Sem expiresIn: o token não expira. O login (TV, kiosk, etc.) precisa
    // permanecer válido indefinidamente, sem cair sozinho após algumas horas.
    const token = jwt.sign(
      {
        id: usuario.id_usuario,
        perfil: usuario.perfil,
        nome: usuario.nome,
        id_instrutor: usuario.id_instrutor_vinculado
      },
      SECRET
    );

    res.json({
      token,
      usuario: {
        nome: usuario.nome,
        perfil: usuario.perfil,
        id_instrutor: usuario.id_instrutor_vinculado,
        email: usuario.email
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
});

// POST /api/auth/trocar-senha
router.post('/trocar-senha', async (req, res) => {
  const { email, novaSenha } = req.body;

  if (!email || !novaSenha) {
    return res.status(400).json({ erro: 'E-mail e nova senha são obrigatórios.' });
  }

  if (novaSenha.length < 4) {
    return res.status(400).json({ erro: 'A senha deve ter pelo menos 4 caracteres.' });
  }

  try {
    const [result] = await db.execute(
      'UPDATE Usuarios SET senha = ?, primeiro_acesso = 0 WHERE email = ?',
      [novaSenha, email.toLowerCase().trim()]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    res.json({ mensagem: 'Senha alterada com sucesso! Faça login com a nova senha.' });
  } catch (error) {
    console.error('Erro ao trocar senha:', error);
    res.status(500).json({ erro: 'Erro ao alterar senha.' });
  }
});

// Middleware de autenticação (exportado para uso nas rotas)
function autenticar(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Acesso negado. Token não fornecido.' });

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ erro: 'Token inválido ou expirado.' });
    req.usuario = user;
    next();
  });
}

module.exports = router;
module.exports.autenticar = autenticar;
