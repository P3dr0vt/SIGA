const STORAGE_KEY = 'siga_dados';

const API = (() => {
  let _cache = null;

  async function init() {
    // Sempre carrega do dados.json (servidor é a fonte de verdade)
    try {
      const res = await fetch('./dados.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      _cache = await res.json();
    } catch (e) {
      // Fallback: localStorage (modo offline / file://)
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        _cache = JSON.parse(stored);
        console.warn('[SIGA] Servidor indisponível — usando dados do navegador.');
      } else {
        _cache = { instrutores: [], salas: [], turmas: [], alocacoes: [] };
        console.error('[SIGA] Falha ao carregar dados. Execute via iniciar.bat');
      }
    }
  }

  function _persist() {
    // 1. Salva no localStorage (cache imediato)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_cache));

    // 2. Persiste no dados.json via servidor local (silencioso se offline)
    fetch('/salvar', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(_cache)
    }).catch(() => {
      // Sem servidor rodando — localStorage já garantiu os dados
    });
  }

  function getData() {
    return _cache;
  }

  function getInstrutores() {
    return [..._cache.instrutores].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }

  function getSalas() {
    return [..._cache.salas].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }

  function getTurmas() {
    return [..._cache.turmas].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }

  function getAlocacoesPorBloco(turno) {
    const alocacoes = turno === 'todos'
      ? _cache.alocacoes
      : _cache.alocacoes.filter(a => a.turno === turno);

    const mapa = {};
    for (const aloc of alocacoes) {
      const sala = _cache.salas.find(s => s.id === aloc.salaId);
      const instrutor = _cache.instrutores.find(i => i.id === aloc.instrutorId);
      const turma = _cache.turmas.find(t => t.id === aloc.turmaId);
      if (!sala || !instrutor || !turma) continue;

      const bloco = sala.bloco;
      if (!mapa[bloco]) mapa[bloco] = [];
      mapa[bloco].push({ ...aloc, sala, instrutor, turma });
    }
    return mapa;
  }

  function getAlocacoesRobotica() {
    const turnos = ['manha', 'tarde', 'noite'];
    const resultado = {};
    for (const turno of turnos) {
      resultado[turno] = _cache.alocacoes
        .filter(a => a.turno === turno)
        .map(a => {
          const sala = _cache.salas.find(s => s.id === a.salaId);
          const instrutor = _cache.instrutores.find(i => i.id === a.instrutorId);
          const turma = _cache.turmas.find(t => t.id === a.turmaId);
          return sala && instrutor && turma ? { ...a, sala, instrutor, turma } : null;
        })
        .filter(a => a && a.sala.categoria === 'robotica');
    }
    return resultado;
  }

  function addInstrutor(nome) {
    const id = 'i' + Date.now();
    _cache.instrutores.push({ id, nome: nome.trim() });
    _persist();
    return id;
  }

  function removeInstrutor(id) {
    _cache.instrutores = _cache.instrutores.filter(i => i.id !== id);
    _cache.alocacoes = _cache.alocacoes.filter(a => a.instrutorId !== id);
    _persist();
  }

  function addSala(nome, categoria = 'regular') {
    const id = 's' + Date.now();
    const bloco = _inferirBloco(nome);
    _cache.salas.push({ id, nome: nome.trim(), bloco, categoria });
    _persist();
    return id;
  }

  function _inferirBloco(nome) {
    const upper = nome.toUpperCase();
    if (upper.includes(' A')) return 'A';
    if (upper.includes(' B')) return 'B';
    if (upper.includes(' C')) return 'C';
    return 'A';
  }

  function removeSala(id) {
    _cache.salas = _cache.salas.filter(s => s.id !== id);
    _cache.alocacoes = _cache.alocacoes.filter(a => a.salaId !== id);
    _persist();
  }

  function editarAlocacaoSala(salaId, instrutorId, turno, turmaId) {
    _cache.alocacoes = _cache.alocacoes.filter(
      a => !(a.salaId === salaId && a.turno === turno)
    );
    if (instrutorId && turmaId) {
      _cache.alocacoes.push({
        id: 'a' + Date.now(),
        instrutorId, salaId, turmaId, turno
      });
    }
    _persist();
  }

  function addTurma(nome) {
    const id = 't' + Date.now();
    _cache.turmas.push({ id, nome: nome.trim() });
    _persist();
    return id;
  }

  function removeTurma(id) {
    _cache.turmas = _cache.turmas.filter(t => t.id !== id);
    _cache.alocacoes = _cache.alocacoes.filter(a => a.turmaId !== id);
    _persist();
  }

  // ── Novas funções: ocupação e status ──────────────────────────

  /**
   * Retorna o status de ocupação de uma sala por turno.
   * Cada turno é null (livre) ou { id, instrutor, turma }.
   */
  function getStatusSala(salaId) {
    const resultado = {};
    for (const turno of ['manha', 'tarde', 'noite']) {
      const aloc = _cache.alocacoes.find(a => a.salaId === salaId && a.turno === turno);
      if (aloc) {
        const instrutor = _cache.instrutores.find(i => i.id === aloc.instrutorId);
        const turma     = _cache.turmas.find(t => t.id === aloc.turmaId);
        resultado[turno] = {
          id:       aloc.id,
          instrutor: instrutor?.nome || '—',
          turma:     turma?.nome    || '—'
        };
      } else {
        resultado[turno] = null;
      }
    }
    return resultado;
  }

  /**
   * Remove uma alocação específica pelo seu id.
   * Retorna true se encontrou e removeu, false caso contrário.
   */
  function removeAlocacao(alocId) {
    const antes = _cache.alocacoes.length;
    _cache.alocacoes = _cache.alocacoes.filter(a => a.id !== alocId);
    if (_cache.alocacoes.length < antes) { _persist(); return true; }
    return false;
  }

  /**
   * Retorna todas as salas regulares com seu status de ocupação.
   * Usado pela visão geral de status.
   */
  function getStatusGeralSalas() {
    return getSalas()
      .filter(s => s.categoria !== 'robotica')
      .map(sala => ({ sala, status: getStatusSala(sala.id) }));
  }

  function resetDados() {
    localStorage.removeItem(STORAGE_KEY);
    _cache = null;
  }

  return {
    init,
    getData,
    getInstrutores,
    getSalas,
    getTurmas,
    getAlocacoesPorBloco,
    getAlocacoesRobotica,
    addInstrutor,
    removeInstrutor,
    addSala,
    removeSala,
    editarAlocacaoSala,
    addTurma,
    removeTurma,
    resetDados,
    getStatusSala,
    removeAlocacao,
    getStatusGeralSalas
  };
})();

export default API;
