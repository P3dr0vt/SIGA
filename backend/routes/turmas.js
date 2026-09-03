const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Mapeamento de turno: aceita com ou sem acento, salva sempre com acento
const TURNO_MAP = { 'Manha': 'Manhã', 'Manhã': 'Manhã', 'Tarde': 'Tarde', 'Noite': 'Noite' };

function normalizarTurno(turno) {
  return TURNO_MAP[turno] || null;
}

function exigirAdmin(req, res) {
  if (!req.usuario || req.usuario.perfil !== 'admin') {
    res.status(403).json({ erro: 'Apenas administradores podem realizar esta ação.' });
    return false;
  }
  return true;
}

// GET /api/turmas - Listar todas
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM Turmas ORDER BY turno, nome ASC');
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar turmas:', error);
    res.status(500).json({ erro: 'Erro ao buscar turmas.' });
  }
});

// GET /api/turmas/:id - Obter por ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM Turmas WHERE id_turma = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Turma não encontrada.' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar turma:', error);
    res.status(500).json({ erro: 'Erro ao buscar turma.' });
  }
});

// GET /api/turmas/turno/:turno - Listar turmas por turno
router.get('/turno/:turno', async (req, res) => {
  try {
    const turnoFinal = normalizarTurno(req.params.turno);
    if (!turnoFinal) {
      return res.status(400).json({ erro: 'Turno inválido.' });
    }
    const [rows] = await db.execute('SELECT * FROM Turmas WHERE turno = ? ORDER BY nome ASC', [turnoFinal]);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar turmas por turno:', error);
    res.status(500).json({ erro: 'Erro ao buscar turmas.' });
  }
});

// POST /api/turmas - Criar nova
router.post('/', async (req, res) => {
  if (!exigirAdmin(req, res)) return;

  const { nome, turno } = req.body;
  if (!nome || nome.trim() === '') {
    return res.status(400).json({ erro: 'O nome da turma é obrigatório.' });
  }
  const turnoFinal = normalizarTurno(turno);
  if (!turnoFinal) {
    return res.status(400).json({ erro: 'O turno é obrigatório e deve ser Manhã, Tarde ou Noite.' });
  }

  try {
    const [result] = await db.execute('INSERT INTO Turmas (nome, turno) VALUES (?, ?) RETURNING id_turma', [nome.trim(), turnoFinal]);
    res.status(201).json({ mensagem: 'Turma adicionada com sucesso.', id: result.insertId });
  } catch (error) {
    console.error('Erro ao criar turma:', error);
    if (error.code === '23505') {
      return res.status(400).json({ erro: 'Já existe uma turma com este nome neste turno.' });
    }
    res.status(500).json({ erro: 'Erro ao adicionar turma.' });
  }
});

// PUT /api/turmas/:id - Atualizar
router.put('/:id', async (req, res) => {
  if (!exigirAdmin(req, res)) return;

  const { nome, turno } = req.body;
  if (!nome || nome.trim() === '') {
    return res.status(400).json({ erro: 'O nome da turma é obrigatório.' });
  }
  const turnoFinal = normalizarTurno(turno);
  if (!turnoFinal) {
    return res.status(400).json({ erro: 'O turno é obrigatório e deve ser Manhã, Tarde ou Noite.' });
  }

  try {
    const [result] = await db.execute('UPDATE Turmas SET nome = ?, turno = ? WHERE id_turma = ?', [nome.trim(), turnoFinal, req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: 'Turma não encontrada.' });
    }
    res.json({ mensagem: 'Turma atualizada com sucesso.' });
  } catch (error) {
    console.error('Erro ao atualizar turma:', error);
    if (error.code === '23505') {
      return res.status(400).json({ erro: 'Já existe uma turma com este nome neste turno.' });
    }
    res.status(500).json({ erro: 'Erro ao atualizar turma.' });
  }
});

// DELETE /api/turmas/:id - Remover
router.delete('/:id', async (req, res) => {
  if (!exigirAdmin(req, res)) return;

  try {
    const [result] = await db.execute('DELETE FROM Turmas WHERE id_turma = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: 'Turma não encontrada.' });
    }
    res.json({ mensagem: 'Turma removida com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover turma:', error);
    res.status(500).json({ erro: 'Erro ao remover turma. Verifique se não há alocações vinculadas.' });
  }
});

module.exports = router;
