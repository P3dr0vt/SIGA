const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');

// GET / - Listar todos
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM Instrutores ORDER BY nome');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// POST / - Adicionar Instrutor + gerar login
router.post('/', async (req, res) => {
  if (!req.usuario || req.usuario.perfil !== 'admin') {
    return res.status(403).json({ erro: 'Apenas administradores podem criar instrutores.' });
  }

  const { nome, matricula: matriculaEntrada } = req.body;
  if (!nome || nome.trim() === '') {
    return res.status(400).json({ erro: 'Nome é obrigatório.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    let matricula = matriculaEntrada ? String(matriculaEntrada).trim() : null;
    if (matricula) {
      if (!/^[0-9]+$/.test(matricula)) {
        return res.status(400).json({ erro: 'A matrícula deve conter apenas números.' });
      }
      const [existeMat] = await connection.execute('SELECT id_instrutor FROM Instrutores WHERE matricula = ?', [matricula]);
      if (existeMat.length > 0) {
        return res.status(400).json({ erro: 'Esta matrícula já está em uso.' });
      }
    }

    // Gera matrícula única quando não fornecida
    let tentativas = 0;
    while (!matricula && tentativas < 20) {
      matricula = String(Math.floor(1000 + Math.random() * 9000));
      const [existe] = await connection.execute('SELECT id_instrutor FROM Instrutores WHERE matricula = ?', [matricula]);
      if (existe.length === 0) break;
      matricula = null;
      tentativas++;
    }

    if (!matricula) {
      await connection.rollback();
      return res.status(500).json({ erro: 'Não foi possível gerar uma matrícula única. Tente novamente.' });
    }

    const [result] = await connection.execute(
      'INSERT INTO Instrutores (nome, matricula) VALUES (?, ?)',
      [nome.trim(), matricula]
    );
    const id_instrutor = result.insertId;

    const email = `${matricula}@senai.com`;
    const senhaPadrao = matricula; // Entregue uma unica vez ao administrador.
    const senhaHash = await bcrypt.hash(senhaPadrao, 12);

    const [emailExiste] = await connection.execute('SELECT id_usuario FROM Usuarios WHERE email = ?', [email]);
    if (emailExiste.length > 0) {
      await connection.rollback();
      return res.status(400).json({ erro: 'Conflito ao gerar credenciais. Tente novamente.' });
    }

    await connection.execute(
      'INSERT INTO Usuarios (email, senha, nome, perfil, primeiro_acesso, id_instrutor_vinculado) VALUES (?, ?, ?, ?, ?, ?)',
      [email, senhaHash, nome.trim(), 'instrutor', 1, id_instrutor]
    );

    await connection.commit();

    res.json({
      id: id_instrutor,
      mensagem: 'Instrutor criado com sucesso!',
      acesso: {
        matricula,
        email,
        senha: senhaPadrao,
        instrucao: 'O instrutor deve fazer login com a matrícula e será solicitado a criar uma nova senha.'
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao criar instrutor:', error);
    res.status(500).json({ erro: error.message });
  } finally {
    connection.release();
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  if (!req.usuario || req.usuario.perfil !== 'admin') {
    return res.status(403).json({ erro: 'Apenas administradores podem remover instrutores.' });
  }

  try {
    const [result] = await db.execute('DELETE FROM Instrutores WHERE id_instrutor = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ erro: 'Instrutor não encontrado.' });
    await db.execute('DELETE FROM Usuarios WHERE id_instrutor_vinculado = ?', [req.params.id]);
    res.json({ mensagem: 'Instrutor removido.' });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

module.exports = router;
