const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Listar todas
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM Salas ORDER BY bloco, nome');
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar salas:', error);
    res.status(500).json({ erro: 'Erro ao listar salas.' });
  }
});

// Criar Sala
router.post('/', async (req, res) => {
  if (!req.usuario || req.usuario.perfil !== 'admin') {
    return res.status(403).json({ erro: 'Apenas administradores podem criar salas.' });
  }

  const { nome, bloco, tipo } = req.body;
  try {
    const [result] = await db.execute('INSERT INTO Salas (nome, bloco, tipo) VALUES (?, ?, ?) RETURNING id_sala', [nome, bloco, tipo || 'SALA']);
    res.status(201).json({ id: result.insertId, mensagem: 'Sala criada!' });
  } catch (error) {
    console.error('Erro ao criar sala:', error);
    res.status(500).json({ erro: 'Erro ao criar sala.' });
  }
});

// Remover Sala (O banco limpa as alocações via CASCADE)
router.delete('/:id', async (req, res) => {
  if (!req.usuario || req.usuario.perfil !== 'admin') {
    return res.status(403).json({ erro: 'Apenas administradores podem remover salas.' });
  }

  try {
    await db.execute('DELETE FROM Salas WHERE id_sala = ?', [req.params.id]);
    res.json({ mensagem: 'Sala removida com sucesso!' });
  } catch (error) {
    console.error('Erro ao remover sala:', error);
    res.status(500).json({ erro: 'Erro ao remover sala.' });
  }
});

module.exports = router;
