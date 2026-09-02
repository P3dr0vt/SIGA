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

// Valida apenas se o instrutor está livre (para solicitação de transferência)
async function validarConflitosInstrutor({ id_instrutor, turno, data_inicio, data_fim }) {
  const paramsBase = [turno, data_fim, data_inicio];
  
  const [confInst] = await db.execute(`
    SELECT a.id_alocacao, s.nome AS sala_nome FROM Alocacoes a
    JOIN Salas s ON a.id_sala = s.id_sala
    WHERE a.id_instrutor = ? AND a.turno = ?
      AND a.data_inicio <= ? AND a.data_fim >= ?
  `, [id_instrutor, ...paramsBase]);

  if (confInst.length > 0) {
    return `Este instrutor já está alocado na sala "${confInst[0].sala_nome}" neste período e turno.`;
  }

  return null;
}

// Valida turma para aceitação de transferência
async function validarConflitosturma({ id_turma, id_sala, turno, data_inicio, data_fim, tipo_sala = 'SALA' }) {
  const paramsBase = [turno, data_fim, data_inicio];
  
  // Para laboratórios, buscar conflito apenas por turma (não por sala)
  if (tipo_sala === 'LABORATORIO') {
    const [confTurma] = await db.execute(`
      SELECT a.id_alocacao, s.nome AS sala_nome, s.tipo FROM Alocacoes a
      JOIN Salas s ON a.id_sala = s.id_sala
      WHERE a.id_turma = ? AND a.turno = ?
        AND a.data_inicio <= ? AND a.data_fim >= ?
    `, [id_turma, ...paramsBase]);

    if (confTurma.length > 0) {
      const conflito = confTurma[0];
      if (conflito.tipo === 'SALA') {
        // Permitido: pode substituir sala por laboratório
        return { permitido: true, id_alocacao_para_editar: conflito.id_alocacao };
      } else {
        // Bloqueado: já está em laboratório
        return `Esta turma já está alocada no laboratório "${conflito.sala_nome}" neste período e turno.`;
      }
    }
    return null;
  }
  
  // Para salas normais, validar conflito por sala
  const [confTurma] = await db.execute(`
    SELECT a.id_alocacao, s.nome AS sala_nome FROM Alocacoes a
    JOIN Salas s ON a.id_sala = s.id_sala
    WHERE a.id_turma = ? AND a.id_sala = ? AND a.turno = ?
      AND a.data_inicio <= ? AND a.data_fim >= ?
  `, [id_turma, id_sala, ...paramsBase]);

  if (confTurma.length > 0) {
    return `Esta turma já está alocada neste período e turno.`;
  }

  return null;
}

async function validarConflitos({ id_alocacao = null, id_instrutor, id_sala, id_turma, turno, data_inicio, data_fim, ignorarSala = false }) {
  const paramsBase = [turno, data_fim, data_inicio];
  const ignorarAtual = id_alocacao ? ' AND id_alocacao <> ?' : '';
  const paramsIgnorar = id_alocacao ? [id_alocacao] : [];

  // Não validar conflito de sala se for transferência (ignorarSala = true)
  if (!ignorarSala) {
    const [confSala] = await db.execute(`
      SELECT id_alocacao FROM Alocacoes
      WHERE id_sala = ? AND turno = ?
        AND data_inicio <= ? AND data_fim >= ?${ignorarAtual}
    `, [id_sala, ...paramsBase, ...paramsIgnorar]);

    if (confSala.length > 0) {
      return 'Esta sala já está ocupada neste período e turno.';
    }
  }

  const [confInst] = await db.execute(`
    SELECT a.id_alocacao, s.nome AS sala_nome FROM Alocacoes a
    JOIN Salas s ON a.id_sala = s.id_sala
    WHERE a.id_instrutor = ? AND a.turno = ?
      AND a.data_inicio <= ? AND a.data_fim >= ?${id_alocacao ? ' AND a.id_alocacao <> ?' : ''}
  `, [id_instrutor, ...paramsBase, ...paramsIgnorar]);

  if (confInst.length > 0) {
    return `Este instrutor já está alocado na sala "${confInst[0].sala_nome}" neste período e turno.`;
  }

  const [confTurma] = await db.execute(`
    SELECT a.id_alocacao, s.nome AS sala_nome FROM Alocacoes a
    JOIN Salas s ON a.id_sala = s.id_sala
    WHERE a.id_turma = ? AND a.id_sala = ? AND a.turno = ?
      AND a.data_inicio <= ? AND a.data_fim >= ?${id_alocacao ? ' AND a.id_alocacao <> ?' : ''}
  `, [id_turma, id_sala, ...paramsBase, ...paramsIgnorar]);

  if (confTurma.length > 0) {
    return `Esta turma já está alocada neste período e turno.`;
  }

  return null;
}

// POST / - Criar uma solicitação de transferência
router.post('/', async (req, res) => {
  const { id_alocacao, id_instrutor_destino, data_inicio_transferencia, data_fim_transferencia } = req.body;

  if (!id_alocacao || !id_instrutor_destino || !data_inicio_transferencia || !data_fim_transferencia) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
  }

  if (perfilUsuario(req) === 'tv') {
    return res.status(403).json({ erro: 'O perfil de TV possui apenas permissão de visualização.' });
  }

  try {
    const alocacao = await buscarAlocacao(id_alocacao);
    if (!alocacao) {
      return res.status(404).json({ erro: 'Alocação não encontrada.' });
    }

    // Verificar se o usuário logado é o instrutor da alocação original
    if (perfilUsuario(req) === 'instrutor' && Number(alocacao.id_instrutor) !== idInstrutorUsuario(req)) {
      return res.status(403).json({ erro: 'Você só pode transferir suas próprias alocações.' });
    }

    // Validar se as datas de transferência estão dentro da alocação original
    // Usar comparação de strings (YYYY-MM-DD) para evitar problemas com timezone
    let dataInicioAloc = alocacao.data_inicio;
    let dataFimAloc = alocacao.data_fim;
    
    // Converter para string se for Date
    if (typeof dataInicioAloc === 'object') {
      dataInicioAloc = dataInicioAloc.toISOString().split('T')[0];
    } else if (typeof dataInicioAloc === 'string' && dataInicioAloc.includes('T')) {
      dataInicioAloc = dataInicioAloc.split('T')[0];
    }
    
    if (typeof dataFimAloc === 'object') {
      dataFimAloc = dataFimAloc.toISOString().split('T')[0];
    } else if (typeof dataFimAloc === 'string' && dataFimAloc.includes('T')) {
      dataFimAloc = dataFimAloc.split('T')[0];
    }
    
    if (data_inicio_transferencia < dataInicioAloc || data_fim_transferencia > dataFimAloc) {
      return res.status(400).json({ erro: 'As datas de transferência devem estar dentro do período da alocação original.' });
    }

    if (new Date(data_inicio_transferencia) > new Date(data_fim_transferencia)) {
      return res.status(400).json({ erro: 'A data de início não pode ser após a data de fim.' });
    }

    // Verificar se o instrutor destinatário já tem alocações neste período e turno
    // Na solicitação, valida apenas se o instrutor está livre (não valida turma)
    const conflito = await validarConflitosInstrutor({
      id_instrutor: id_instrutor_destino,
      turno: alocacao.turno,
      data_inicio: data_inicio_transferencia,
      data_fim: data_fim_transferencia
    });

    if (conflito) {
      return res.status(400).json({ erro: conflito });
    }

    // Criar a solicitação de transferência pendente
    await db.execute(
      `INSERT INTO Transferencias_Pendentes 
       (id_alocacao_original, id_instrutor_origem, id_instrutor_destino, data_inicio_transferencia, data_fim_transferencia, status)
       VALUES (?, ?, ?, ?, ?, 'pendente')`,
      [id_alocacao, alocacao.id_instrutor, id_instrutor_destino, data_inicio_transferencia, data_fim_transferencia]
    );

    // Criar notificação para o instrutor destinatário
    const [sala] = await db.execute('SELECT nome FROM Salas WHERE id_sala = ?', [alocacao.id_sala]);
    const [instrutor_origem] = await db.execute('SELECT nome FROM Instrutores WHERE id_instrutor = ?', [alocacao.id_instrutor]);
    const nomeSala = sala[0] ? sala[0].nome : 'uma sala';
    const nomeInstrutor = instrutor_origem[0] ? instrutor_origem[0].nome : 'um instrutor';
    
    const msg = `${nomeInstrutor} solicitou transferência de alocação na ${nomeSala} para o turno ${alocacao.turno}.`;
    await db.execute('INSERT INTO Notificacoes (id_instrutor, mensagem) VALUES (?, ?)', [id_instrutor_destino, msg]);

    res.status(201).json({ mensagem: 'Solicitação de transferência criada com sucesso!' });
  } catch (error) {
    console.error('Erro ao criar transferência:', error);
    res.status(500).json({ erro: error.message });
  }
});

// GET / - Listar transferências pendentes do instrutor logado
router.get('/', async (req, res) => {
  if (!req.usuario || !req.usuario.id_instrutor) {
    return res.json([]);
  }

  try {
    const [rows] = await db.execute(`
      SELECT tp.*,
             a.id_sala, a.id_turma, a.turno, a.data_inicio AS aloc_data_inicio, a.data_fim AS aloc_data_fim,
             i_origem.nome AS instrutor_origem_nome,
             s.nome AS sala_nome,
             t.nome AS turma_nome
      FROM Transferencias_Pendentes tp
      JOIN Alocacoes a ON tp.id_alocacao_original = a.id_alocacao
      JOIN Instrutores i_origem ON tp.id_instrutor_origem = i_origem.id_instrutor
      JOIN Salas s ON a.id_sala = s.id_sala
      JOIN Turmas t ON a.id_turma = t.id_turma
      WHERE tp.id_instrutor_destino = ? AND tp.status = 'pendente'
      ORDER BY tp.data_criacao DESC
    `, [req.usuario.id_instrutor]);

    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar transferências:', error);
    res.status(500).json({ erro: error.message });
  }
});

// GET /:id - Obter detalhes de uma transferência específica
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT tp.*,
             a.id_sala, a.id_turma, a.turno, a.data_inicio AS aloc_data_inicio, a.data_fim AS aloc_data_fim,
             i_origem.nome AS instrutor_origem_nome,
             s.nome AS sala_nome,
             t.nome AS turma_nome
      FROM Transferencias_Pendentes tp
      JOIN Alocacoes a ON tp.id_alocacao_original = a.id_alocacao
      JOIN Instrutores i_origem ON tp.id_instrutor_origem = i_origem.id_instrutor
      JOIN Salas s ON a.id_sala = s.id_sala
      JOIN Turmas t ON a.id_turma = t.id_turma
      WHERE tp.id_transferencia = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Transferência não encontrada.' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar transferência:', error);
    res.status(500).json({ erro: error.message });
  }
});

// PUT /:id/aceitar - Aceitar uma transferência com seleção de turma
router.put('/:id/aceitar', async (req, res) => {
  const { id_turma_destino } = req.body;

  if (!id_turma_destino) {
    return res.status(400).json({ erro: 'Turma destino é obrigatória.' });
  }

  if (perfilUsuario(req) === 'tv') {
    return res.status(403).json({ erro: 'O perfil de TV possui apenas permissão de visualização.' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Buscar a transferência
    const [transferencias] = await connection.execute(
      'SELECT * FROM Transferencias_Pendentes WHERE id_transferencia = ?',
      [req.params.id]
    );

    if (transferencias.length === 0) {
      await connection.rollback();
      return res.status(404).json({ erro: 'Transferência não encontrada.' });
    }

    const transferencia = transferencias[0];

    // Verificar se o usuário logado é o instrutor destinatário
    if (perfilUsuario(req) === 'instrutor' && Number(transferencia.id_instrutor_destino) !== idInstrutorUsuario(req)) {
      await connection.rollback();
      return res.status(403).json({ erro: 'Você não tem permissão para aceitar esta transferência.' });
    }

    // Buscar a alocação original
    const [alocacoes] = await connection.execute(
      'SELECT * FROM Alocacoes WHERE id_alocacao = ?',
      [transferencia.id_alocacao_original]
    );

    if (alocacoes.length === 0) {
      await connection.rollback();
      return res.status(404).json({ erro: 'Alocação original não encontrada.' });
    }

    const alocacao = alocacoes[0];

    // Buscar tipo da sala
    const [sala] = await connection.execute('SELECT tipo FROM Salas WHERE id_sala = ?', [alocacao.id_sala]);
    const tipo_sala = sala[0] ? sala[0].tipo : 'SALA';

    // Se for laboratório, verificar se há conflito que pode ser sobreposto
    if (tipo_sala === 'LABORATORIO') {
      // Validar conflito de turma para laboratório (pode substituir sala)
      const conflito = await validarConflitosturma({
        id_turma: id_turma_destino,
        id_sala: alocacao.id_sala,
        turno: alocacao.turno,
        data_inicio: transferencia.data_inicio_transferencia,
        data_fim: transferencia.data_fim_transferencia,
        tipo_sala: 'LABORATORIO'
      });

      // Se conflito é um objeto com permitido=true, dividir a alocação antiga
      if (conflito && typeof conflito === 'object' && conflito.permitido) {
        const [alocacoesConflito] = await connection.execute('SELECT * FROM Alocacoes WHERE id_alocacao = ?', [conflito.id_alocacao_para_editar]);
        const alocConflito = alocacoesConflito[0];
        
        // Deletar a alocação antiga
        await connection.execute('DELETE FROM Alocacoes WHERE id_alocacao = ?', [conflito.id_alocacao_para_editar]);
        
        // Converter datas para comparação
        const dataInicioTransf = new Date(transferencia.data_inicio_transferencia);
        const dataFimTransf = new Date(transferencia.data_fim_transferencia);
        const dataInicioConf = new Date(alocConflito.data_inicio);
        const dataFimConf = new Date(alocConflito.data_fim);
        
        // Criar parte antes da transferência (se houver)
        if (dataInicioConf < dataInicioTransf) {
          const dataFimParte1 = new Date(dataInicioTransf);
          dataFimParte1.setDate(dataFimParte1.getDate() - 1);
          
          await connection.execute(
            `INSERT INTO Alocacoes
             (id_instrutor, id_sala, id_turma, turno, data_inicio, data_fim, criado_por_perfil, criado_por_usuario)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              alocConflito.id_instrutor,
              alocConflito.id_sala,
              alocConflito.id_turma,
              alocConflito.turno,
              alocConflito.data_inicio,
              dataFimParte1.toISOString().split('T')[0],
              alocConflito.criado_por_perfil,
              alocConflito.criado_por_usuario
            ]
          );
        }
        
        // Criar parte depois da transferência (se houver)
        if (dataFimConf > dataFimTransf) {
          const dataInicioParte2 = new Date(dataFimTransf);
          dataInicioParte2.setDate(dataInicioParte2.getDate() + 1);
          
          await connection.execute(
            `INSERT INTO Alocacoes
             (id_instrutor, id_sala, id_turma, turno, data_inicio, data_fim, criado_por_perfil, criado_por_usuario)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              alocConflito.id_instrutor,
              alocConflito.id_sala,
              alocConflito.id_turma,
              alocConflito.turno,
              dataInicioParte2.toISOString().split('T')[0],
              alocConflito.data_fim,
              alocConflito.criado_por_perfil,
              alocConflito.criado_por_usuario
            ]
          );
        }
      } else if (conflito && typeof conflito === 'string') {
        // Conflito é uma mensagem de erro
        await connection.rollback();
        return res.status(400).json({ erro: conflito });
      }
    } else {
      // Para salas normais, validar se a turma está livre
      const conflito = await validarConflitosturma({
        id_turma: id_turma_destino,
        id_sala: alocacao.id_sala,
        turno: alocacao.turno,
        data_inicio: transferencia.data_inicio_transferencia,
        data_fim: transferencia.data_fim_transferencia,
        tipo_sala: 'SALA'
      });

      if (conflito && typeof conflito === 'string') {
        await connection.rollback();
        return res.status(400).json({ erro: conflito });
      }
    }

    // Criar alocação para o instrutor destinatário
    await connection.execute(
      `INSERT INTO Alocacoes
       (id_instrutor, id_sala, id_turma, turno, data_inicio, data_fim, criado_por_perfil, criado_por_usuario)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transferencia.id_instrutor_destino,
        alocacao.id_sala,
        id_turma_destino,
        alocacao.turno,
        transferencia.data_inicio_transferencia,
        transferencia.data_fim_transferencia,
        perfilUsuario(req),
        req.usuario ? req.usuario.id : null
      ]
    );

    // Dividir a alocação original se necessário
    const dataInicio = new Date(transferencia.data_inicio_transferencia);
    const dataFim = new Date(transferencia.data_fim_transferencia);
    const alocDataInicio = new Date(alocacao.data_inicio);
    const alocDataFim = new Date(alocacao.data_fim);

    // Parte antes da transferência
    if (alocDataInicio < dataInicio) {
      const dataFimParte1 = new Date(dataInicio);
      dataFimParte1.setDate(dataFimParte1.getDate() - 1);
      
      await connection.execute(
        `INSERT INTO Alocacoes
         (id_instrutor, id_sala, id_turma, turno, data_inicio, data_fim, criado_por_perfil, criado_por_usuario)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          alocacao.id_instrutor,
          alocacao.id_sala,
          alocacao.id_turma,
          alocacao.turno,
          alocacao.data_inicio,
          dataFimParte1.toISOString().split('T')[0],
          alocacao.criado_por_perfil,
          alocacao.criado_por_usuario
        ]
      );
    }

    // Parte depois da transferência
    if (alocDataFim > dataFim) {
      const dataInicioParte2 = new Date(dataFim);
      dataInicioParte2.setDate(dataInicioParte2.getDate() + 1);
      
      await connection.execute(
        `INSERT INTO Alocacoes
         (id_instrutor, id_sala, id_turma, turno, data_inicio, data_fim, criado_por_perfil, criado_por_usuario)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          alocacao.id_instrutor,
          alocacao.id_sala,
          alocacao.id_turma,
          alocacao.turno,
          dataInicioParte2.toISOString().split('T')[0],
          alocacao.data_fim,
          alocacao.criado_por_perfil,
          alocacao.criado_por_usuario
        ]
      );
    }

    // Deletar a alocação original
    await connection.execute(
      'DELETE FROM Alocacoes WHERE id_alocacao = ?',
      [transferencia.id_alocacao_original]
    );

    // Atualizar status da transferência
    await connection.execute(
      'UPDATE Transferencias_Pendentes SET status = ? WHERE id_transferencia = ?',
      ['aceita', req.params.id]
    );

    // Criar notificação para o instrutor de origem informando aceitação
    const [salaInfo] = await connection.execute('SELECT nome FROM Salas WHERE id_sala = ?', [alocacao.id_sala]);
    const [turma] = await connection.execute('SELECT nome FROM Turmas WHERE id_turma = ?', [id_turma_destino]);
    const nomeSala = salaInfo[0] ? salaInfo[0].nome : 'uma sala';
    const nomeTurma = turma[0] ? turma[0].nome : 'uma turma';
    
    const msg = `Sua solicitação de transferência na ${nomeSala} foi aceita. A turma alocada é ${nomeTurma}.`;
    await connection.execute('INSERT INTO Notificacoes (id_instrutor, mensagem) VALUES (?, ?)', 
      [transferencia.id_instrutor_origem, msg]);

    await connection.commit();
    res.json({ mensagem: 'Transferência aceita com sucesso!' });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao aceitar transferência:', error);
    res.status(500).json({ erro: error.message });
  } finally {
    connection.release();
  }
});

// PUT /:id/rejeitar - Rejeitar uma transferência
router.put('/:id/rejeitar', async (req, res) => {
  if (perfilUsuario(req) === 'tv') {
    return res.status(403).json({ erro: 'O perfil de TV possui apenas permissão de visualização.' });
  }

  try {
    // Buscar a transferência
    const [transferencias] = await db.execute(
      'SELECT * FROM Transferencias_Pendentes WHERE id_transferencia = ?',
      [req.params.id]
    );

    if (transferencias.length === 0) {
      return res.status(404).json({ erro: 'Transferência não encontrada.' });
    }

    const transferencia = transferencias[0];

    // Verificar se o usuário logado é o instrutor destinatário
    if (perfilUsuario(req) === 'instrutor' && Number(transferencia.id_instrutor_destino) !== idInstrutorUsuario(req)) {
      return res.status(403).json({ erro: 'Você não tem permissão para rejeitar esta transferência.' });
    }

    // Atualizar status da transferência
    await db.execute(
      'UPDATE Transferencias_Pendentes SET status = ? WHERE id_transferencia = ?',
      ['rejeitada', req.params.id]
    );

    // Buscar dados para notificação
    const [alocacoes] = await db.execute(
      'SELECT * FROM Alocacoes WHERE id_alocacao = ?',
      [transferencia.id_alocacao_original]
    );

    if (alocacoes.length > 0) {
      const [sala] = await db.execute('SELECT nome FROM Salas WHERE id_sala = ?', [alocacoes[0].id_sala]);
      const nomeSala = sala[0] ? sala[0].nome : 'uma sala';
      
      const msg = `Sua solicitação de transferência na ${nomeSala} foi rejeitada.`;
      await db.execute('INSERT INTO Notificacoes (id_instrutor, mensagem) VALUES (?, ?)', 
        [transferencia.id_instrutor_origem, msg]);
    }

    res.json({ mensagem: 'Transferência rejeitada.' });
  } catch (error) {
    console.error('Erro ao rejeitar transferência:', error);
    res.status(500).json({ erro: error.message });
  }
});

module.exports = router;
