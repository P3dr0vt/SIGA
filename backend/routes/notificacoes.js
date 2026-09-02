const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Listar notificações do instrutor logado
router.get('/', async (req, res) => {
  if (!req.usuario || !req.usuario.id_instrutor) {
    return res.json([]);
  }
  try {
    const [rows] = await db.execute(
      'SELECT * FROM Notificacoes WHERE id_instrutor = ? AND lida = 0 ORDER BY data_criacao DESC',
      [req.usuario.id_instrutor]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Marcar como lida
router.put('/:id/lida', async (req, res) => {
  try {
    await db.execute(
      'UPDATE Notificacoes SET lida = 1 WHERE id_notificacao = ?',
      [req.params.id]
    );
    res.json({ mensagem: 'Notificação marcada como lida.' });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Deletar todas as notificações de um instrutor (para limpeza após aceitar/recusar transferência)
router.delete('/instrutor/:id_instrutor', async (req, res) => {
  try {
    await db.execute(
      'DELETE FROM Notificacoes WHERE id_instrutor = ?',
      [req.params.id_instrutor]
    );
    res.json({ mensagem: 'Notificações deletadas com sucesso.' });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

module.exports = router;
