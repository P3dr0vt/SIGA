const express = require('express');
const router = express.Router();
const db = require('../config/database');

function perfilUsuario(req) {
  return req.usuario && req.usuario.perfil ? req.usuario.perfil : 'instrutor';
}

function idInstrutorUsuario(req) {
  return req.usuario ? Number(req.usuario.id_instrutor) : null;
}

async function buscarAlocacao(id) {
  const [rows] = await db.execute('SELECT * FROM Alocacoes WHERE id_alocacao = ?', [id]);
  return rows[0] || null;
}

// Verifica se há conflito com laboratório que pode sobrepor sala
async function verificarConflitosLaboratorio({ id_instrutor, id_turma, turno, data_inicio, data_fim, tipo_sala }) {
  if (tipo_sala !== 'LABORATORIO') {
    return null; // Validação só aplica para laboratórios
  }

  const paramsBase = [turno, data_fim, data_inicio];

  // Buscar alocações conflitantes da mesma turma (independente do instrutor)
  const [confTurma] = await db.execute(`
    SELECT a.id_alocacao, a.id_turma, a.id_instrutor, s.nome AS sala_nome, s.tipo FROM Alocacoes a
    JOIN Salas s ON a.id_sala = s.id_sala
    WHERE a.id_turma = ? AND a.turno = ?
      AND a.data_inicio <= ? AND a.data_fim >= ?
  `, [id_turma, ...paramsBase]);

  if (confTurma.length === 0) {
    return null; // Sem conflito
  }

  // Se há conflito com a mesma turma, permitir substituição
  const conflito = confTurma[0];
  if (conflito.tipo === 'SALA') {
    // Conflito é com SALA: permitido substituir por LABORATORIO
    return { permitido: true, id_alocacao_para_editar: conflito.id_alocacao };
  } else {
    // Conflito é com LABORATORIO: bloqueado (mesma turma não pode estar em dois laboratórios)
    return { permitido: false, mensagem: `Esta turma já está alocada no laboratório "${conflito.sala_nome}" neste período e turno.` };
  }
}

// Validação de conflito de laboratório por sala (não por instrutor)
async function validarConflitosLaboratorioPorSala({ id_sala, turno, data_inicio, data_fim, id_alocacao = null }) {
  const paramsBase = [turno, data_fim, data_inicio];
  const ignorarAtual = id_alocacao ? ' AND id_alocacao <> ?' : '';
  const paramsIgnorar = id_alocacao ? [id_alocacao] : [];

  // Verificar se há alguma alocação no mesmo laboratório, turno e período
  const [confSala] = await db.execute(`
    SELECT a.id_alocacao, a.id_turma, t.nome AS turma_nome FROM Alocacoes a
    JOIN Turmas t ON a.id_turma = t.id_turma
    WHERE a.id_sala = ? AND a.turno = ?
      AND a.data_inicio <= ? AND a.data_fim >= ?${ignorarAtual}
  `, [id_sala, ...paramsBase, ...paramsIgnorar]);

  if (confSala.length > 0) {
    return `Este laboratório já está ocupado neste período e turno pela turma "${confSala[0].turma_nome}".`;
  }

  return null;
}

async function validarConflitos({ id_alocacao = null, id_instrutor, id_sala, id_turma, turno, data_inicio, data_fim, tipo_sala }) {
  const paramsBase = [turno, data_fim, data_inicio];
  const ignorarAtual = id_alocacao ? ' AND id_alocacao <> ?' : '';
  const paramsIgnorar = id_alocacao ? [id_alocacao] : [];

  // Para laboratórios, validar conflito por sala (não por instrutor)
  if (tipo_sala === 'LABORATORIO') {
    const conflito = await validarConflitosLaboratorioPorSala({ id_sala, turno, data_inicio, data_fim, id_alocacao });
    if (conflito) return conflito;
  } else {
    // Para salas normais, validar conflito por sala
    const [confSala] = await db.execute(`
      SELECT id_alocacao FROM Alocacoes
      WHERE id_sala = ? AND turno = ?
        AND data_inicio <= ? AND data_fim >= ?${ignorarAtual}
    `, [id_sala, ...paramsBase, ...paramsIgnorar]);

    if (confSala.length > 0) {
      return 'Esta sala já está ocupada neste período e turno.';
    }
  }

  // Validar conflito de instrutor (não pode estar em dois lugares ao mesmo tempo)
  const [confInst] = await db.execute(`
    SELECT a.id_alocacao, s.nome AS sala_nome, s.tipo FROM Alocacoes a
    JOIN Salas s ON a.id_sala = s.id_sala
    WHERE a.id_instrutor = ? AND a.turno = ?
      AND a.data_inicio <= ? AND a.data_fim >= ?${id_alocacao ? ' AND a.id_alocacao <> ?' : ''}
  `, [id_instrutor, ...paramsBase, ...paramsIgnorar]);

  if (confInst.length > 0) {
    return `Este instrutor já está alocado na sala "${confInst[0].sala_nome}" neste período e turno.`;
  }

  // Validar conflito de turma (não pode estar em dois lugares ao mesmo tempo)
  // EXCETO se for laboratório sobrepondo sala (já tratado em verificarConflitosLaboratorio)
  if (tipo_sala !== 'LABORATORIO') {
    const [confTurma] = await db.execute(`
      SELECT a.id_alocacao, s.nome AS sala_nome FROM Alocacoes a
      JOIN Salas s ON a.id_sala = s.id_sala
      WHERE a.id_turma = ? AND a.turno = ?
        AND a.data_inicio <= ? AND a.data_fim >= ?${id_alocacao ? ' AND a.id_alocacao <> ?' : ''}
    `, [id_turma, ...paramsBase, ...paramsIgnorar]);

    if (confTurma.length > 0) {
      return `Esta turma já está alocada na sala "${confTurma[0].sala_nome}" neste período e turno.`;
    }
  }

  return null;
}

// GET / - Listar alocações com dados relacionados
router.get('/', async (req, res) => {
  try {
    const sql = `
      SELECT a.*,
             COALESCE(a.criado_por_perfil, 'admin') AS criado_por_perfil,
             i.nome AS instrutor_nome,
             s.nome AS sala_nome,
             s.bloco,
             t.nome AS turma_nome
      FROM Alocacoes a
      JOIN Instrutores i ON a.id_instrutor = i.id_instrutor
      JOIN Salas s ON a.id_sala = s.id_sala
      JOIN Turmas t ON a.id_turma = t.id_turma
      ORDER BY a.data_inicio DESC, a.turno, s.bloco, s.nome
    `;
    const [rows] = await db.execute(sql);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar alocações:', error);
    res.status(500).json({ erro: 'Erro ao listar alocacoes.' });
  }
});

// GET /ocupadas/:id_sala - Períodos ocupados de uma sala, com contexto para calendário
router.get('/ocupadas/:id_sala', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT a.id_alocacao, a.data_inicio, a.data_fim, a.turno,
             i.nome AS instrutor_nome, t.nome AS turma_nome
      FROM Alocacoes a
      JOIN Instrutores i ON a.id_instrutor = i.id_instrutor
      JOIN Turmas t ON a.id_turma = t.id_turma
      WHERE a.id_sala = ?
      ORDER BY a.data_inicio, a.turno
    `, [req.params.id_sala]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao consultar ocupacao.' });
  }
});

// POST / - Criar alocação com validação completa
router.post('/', async (req, res) => {
  const { id_instrutor, id_sala, id_turma, turno, data_inicio, data_fim } = req.body;

  if (!id_instrutor || !id_sala || !id_turma || !turno || !data_inicio || !data_fim) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
  }

  if (perfilUsuario(req) === 'tv') {
    return res.status(403).json({ erro: 'O perfil de TV possui apenas permissão de visualização.' });
  }

  if (perfilUsuario(req) === 'instrutor' && Number(id_instrutor) !== idInstrutorUsuario(req)) {
    return res.status(403).json({ erro: 'Instrutores só podem criar alocações para si mesmos.' });
  }

  if (new Date(data_inicio) > new Date(data_fim)) {
    return res.status(400).json({ erro: 'A data de início não pode ser após a data de fim.' });
  }

  try {
    // Buscar tipo da sala
    const [sala] = await db.execute('SELECT tipo FROM Salas WHERE id_sala = ?', [id_sala]);
    if (sala.length === 0) {
      return res.status(404).json({ erro: 'Sala não encontrada.' });
    }
    const tipo_sala = sala[0].tipo;

    // Verificar conflitos de laboratório
    const conflitosLab = await verificarConflitosLaboratorio({ id_instrutor, id_turma, turno, data_inicio, data_fim, tipo_sala });
    if (conflitosLab && !conflitosLab.permitido) {
      return res.status(400).json({ erro: conflitosLab.mensagem });
    }

    // Se há conflito permitido (laboratório sobrepõe sala), dividir a alocação antiga
    if (conflitosLab && conflitosLab.permitido) {
      const alocacaoAntiga = await buscarAlocacao(conflitosLab.id_alocacao_para_editar);
      
      // Converter datas para comparação
      const dataInicioNova = new Date(data_inicio);
      const dataFimNova = new Date(data_fim);
      const dataInicioAntiga = new Date(alocacaoAntiga.data_inicio);
      const dataFimAntiga = new Date(alocacaoAntiga.data_fim);
      
      // Deletar a alocação antiga
      await db.execute('DELETE FROM Alocacoes WHERE id_alocacao = ?', [conflitosLab.id_alocacao_para_editar]);
      
      // Criar parte antes da nova alocação (se houver)
      if (dataInicioAntiga < dataInicioNova) {
        const dataFimParte1 = new Date(dataInicioNova);
        dataFimParte1.setDate(dataFimParte1.getDate() - 1);
        const dataFimParte1Str = dataFimParte1.toISOString().split('T')[0];
        const dataInicioAntStr = dataInicioAntiga.toISOString().split('T')[0];
        
        await db.execute(
          `INSERT INTO Alocacoes
           (id_instrutor, id_sala, id_turma, turno, data_inicio, data_fim, criado_por_perfil, criado_por_usuario)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [alocacaoAntiga.id_instrutor, alocacaoAntiga.id_sala, alocacaoAntiga.id_turma, turno, dataInicioAntStr, dataFimParte1Str, perfilUsuario(req), req.usuario ? req.usuario.id : null]
        );
      }
      
      // Criar parte depois da nova alocação (se houver)
      if (dataFimAntiga > dataFimNova) {
        const dataInicioParte2 = new Date(dataFimNova);
        dataInicioParte2.setDate(dataInicioParte2.getDate() + 1);
        const dataInicioParte2Str = dataInicioParte2.toISOString().split('T')[0];
        const dataFimAntigaStr = dataFimAntiga.toISOString().split('T')[0];
        
        await db.execute(
          `INSERT INTO Alocacoes
           (id_instrutor, id_sala, id_turma, turno, data_inicio, data_fim, criado_por_perfil, criado_por_usuario)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [alocacaoAntiga.id_instrutor, alocacaoAntiga.id_sala, alocacaoAntiga.id_turma, turno, dataInicioParte2Str, dataFimAntigaStr, perfilUsuario(req), req.usuario ? req.usuario.id : null]
        );
      }
    }

    // Validação normal de conflitos (exceto para turma se for laboratório sobrepondo sala)
    const conflito = await validarConflitos({ id_instrutor, id_sala, id_turma, turno, data_inicio, data_fim, tipo_sala });
    if (conflito) return res.status(400).json({ erro: conflito });

    await db.execute(
      `INSERT INTO Alocacoes
       (id_instrutor, id_sala, id_turma, turno, data_inicio, data_fim, criado_por_perfil, criado_por_usuario)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_instrutor, id_sala, id_turma, turno, data_inicio, data_fim, perfilUsuario(req), req.usuario ? req.usuario.id : null]
    );

    res.status(201).json({ mensagem: 'Alocação realizada com sucesso!' });
  } catch (error) {
    console.error('Erro ao criar alocação:', error);
    res.status(500).json({ erro: 'Erro ao criar alocacao.' });
  }
});

// PUT /:id - Atualizar uma alocação (sem transferência)
router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const { id_instrutor, id_sala, id_turma, turno, data_inicio, data_fim } = req.body;

  if (!id_instrutor || !id_sala || !id_turma || !turno || !data_inicio || !data_fim) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
  }

  if (perfilUsuario(req) === 'tv') {
    return res.status(403).json({ erro: 'O perfil de TV possui apenas permissão de visualização.' });
  }

  if (new Date(data_inicio) > new Date(data_fim)) {
    return res.status(400).json({ erro: 'A data de início não pode ser após a data de fim.' });
  }

  try {
    const atual = await buscarAlocacao(id);
    if (!atual) return res.status(404).json({ erro: 'Alocação não encontrada.' });

    if (perfilUsuario(req) === 'instrutor' && Number(atual.id_instrutor) !== idInstrutorUsuario(req)) {
      return res.status(403).json({ erro: 'Instrutores só podem editar suas próprias alocações.' });
    }

    // Buscar tipo da sala
    const [sala] = await db.execute('SELECT tipo FROM Salas WHERE id_sala = ?', [id_sala]);
    const tipo_sala = sala[0].tipo;

    const conflito = await validarConflitos({ id_alocacao: id, id_instrutor, id_sala, id_turma, turno, data_inicio, data_fim, tipo_sala });
    if (conflito) return res.status(400).json({ erro: conflito });

    await db.execute(
      `UPDATE Alocacoes
       SET id_instrutor = ?, id_sala = ?, id_turma = ?, turno = ?, data_inicio = ?, data_fim = ?
       WHERE id_alocacao = ?`,
      [id_instrutor, id_sala, id_turma, turno, data_inicio, data_fim, id]
    );

    res.json({ mensagem: 'Alocação atualizada com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar alocação:', error);
    res.status(500).json({ erro: 'Erro ao atualizar alocacao.' });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  if (perfilUsuario(req) === 'tv') {
    return res.status(403).json({ erro: 'O perfil de TV possui apenas permissão de visualização.' });
  }

  try {
    const atual = await buscarAlocacao(req.params.id);
    if (!atual) return res.status(404).json({ erro: 'Alocação não encontrada.' });

    if (perfilUsuario(req) === 'instrutor' && Number(atual.id_instrutor) !== idInstrutorUsuario(req)) {
      return res.status(403).json({ erro: 'Instrutores só podem remover suas próprias alocações.' });
    }

    await db.execute('DELETE FROM Alocacoes WHERE id_alocacao = ?', [req.params.id]);
    res.json({ mensagem: 'Alocação removida.' });
  } catch (error) {
    console.error('Erro ao remover alocacao:', error);
    res.status(500).json({ erro: 'Erro ao remover alocacao.' });
  }
});

module.exports = router;
