// GERA - Dashboard JavaScript (Versão 5 - Melhorada)
const API_BASE = '/api';

// Aplica larguras de coluna salvas assim que possível (evita "pulo" visual)
(function aplicarLargurasColunasSalvas() {
  try {
    const larguras = JSON.parse(localStorage.getItem('gera_col_widths') || 'null');
    if (larguras) {
      document.documentElement.style.setProperty('--col-w-instrutor', larguras.instrutor + '%');
      document.documentElement.style.setProperty('--col-w-sala', larguras.sala + '%');
      document.documentElement.style.setProperty('--col-w-turma', larguras.turma + '%');
    }
  } catch (e) {
    console.error('Erro ao aplicar larguras de coluna salvas:', e);
  }
})();
let turnoSelecionado = 'auto';
let todasAlocacoes = [];
let dataSelecionada = null; // Data selecionada pelo usuário, default hoje

document.addEventListener('DOMContentLoaded', function () {
  const usuario = JSON.parse(localStorage.getItem('gera_usuario'));
  if (!usuario) { window.location.href = 'login.html'; return; }

  // Perfil TV: menu sera filtrado no HTML
  
  // Desabilitar seletores para TV
  if (usuario.perfil === 'tv') {
    const dataDisplay = document.getElementById('dataDisplay');
    const turnoSelector = document.querySelector('.turno-selector-container');
    if (dataDisplay) {
      dataDisplay.style.pointerEvents = 'none';
      dataDisplay.style.opacity = '0.6';
    }
    if (turnoSelector) {
      turnoSelector.style.pointerEvents = 'none';
      turnoSelector.style.opacity = '0.6';
    }
  } else {
    // Ocultar botao de tela cheia para admin e instrutor
    const btnTelaCheia = document.getElementById('btnTelaCheia');
    if (btnTelaCheia) {
      btnTelaCheia.style.display = 'none';
    }
  }

  atualizarDataHora();
  // Atualizar a cada minuto para index.html, a cada 60 segundos para outras páginas
  const currentPage = window.location.pathname;
  const intervalo = (currentPage.includes('index.html') || currentPage === '/' || currentPage.endsWith('/')) ? 30000 : 60000;
  setInterval(atualizarDataHora, intervalo);

  definirTurnoAutomatico();
  carregarAlocacoes();
  carregarNotificacoes();

  // Reavaliar o turno automaticamente a cada minuto,
  // pra trocar de Manhã -> Tarde -> Noite sem precisar de F5
  setInterval(definirTurnoAutomatico, 60000);

  // Colunas redimensionáveis (arrastar como Excel/Notion)
  criarHandlesRedimensionamentoColunas();
  inicializarRedimensionamentoColunas();

  // Auto-reload das alocações e notificações a cada 5 segundos
  setInterval(() => {
    carregarAlocacoes();
    carregarNotificacoes();
  }, 5000);

  // Atualiza ao voltar para a aba
  window.addEventListener('focus', carregarAlocacoes);

  // Botão para selecionar data (agora habilitado para TV também)
  const btnSelecionarData = document.getElementById('btnSelecionarData');
  if (btnSelecionarData) {
    btnSelecionarData.addEventListener('change', function() {
      if (this.value) {
        dataSelecionada = new Date(this.value + 'T00:00:00');
        atualizarDataHora();
        renderizarAlocacoes(todasAlocacoes);
      }
    });
  }
});

function atualizarDataHora() {
  const agora = new Date();
  const opcoes = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const el = document.getElementById('dataAtual');
  if (!el) return;

  const dataParaMostrar = dataSelecionada || agora;
  const dataFormatada = dataParaMostrar.toLocaleDateString('pt-BR', opcoes);
  
  // Mostrar apenas data
  let textoCompleto = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
  el.textContent = textoCompleto;
  
  // Atualizar horario em elemento separado se existir
  const elHorario = document.getElementById('horarioAtual');
  if (elHorario) {
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');
    elHorario.textContent = `${horas}:${minutos}`;
  }

  // Atualizar o valor do input de data
  const inputData = document.getElementById('btnSelecionarData');
  if (inputData) {
    inputData.value = dataParaMostrar.toISOString().split('T')[0];
  }
}

function abrirDatePicker() {
  const modal = document.getElementById('modalSelecionarData');
  const inputModal = document.getElementById('inputDataModal');
  if (modal && inputModal) {
    const dataAtual = dataSelecionada || new Date();
    inputModal.value = dataAtual.toISOString().split('T')[0];
    modal.style.display = 'flex';
  }
}

function fecharModalData() {
  const modal = document.getElementById('modalSelecionarData');
  if (modal) modal.style.display = 'none';
}

function confirmarDataModal() {
  const inputModal = document.getElementById('inputDataModal');
  if (inputModal && inputModal.value) {
    dataSelecionada = new Date(inputModal.value + 'T00:00:00');
    atualizarDataHora();
    renderizarAlocacoes(todasAlocacoes);
    fecharModalData();
  }
}

function definirTurnoAutomatico() {
  const agora = new Date();
  const horas = agora.getHours();
  const minutos = agora.getMinutes();
  const totalMinutos = horas * 60 + minutos;

  // Novos horários:
  // Manhã: 05:00 às 12:30 (300 a 750 min)
  // Tarde: 12:31 às 17:30 (751 a 1050 min)
  // Noite: 17:31 às 04:59 (1051 a 299 min do dia seguinte)

  let turnoAuto = 'Noite';
  if (totalMinutos >= 5 * 60 && totalMinutos <= 12 * 60 + 30) {
    turnoAuto = 'Manhã';
  } else if (totalMinutos > 12 * 60 + 30 && totalMinutos <= 17 * 60 + 30) {
    turnoAuto = 'Tarde';
  }

  selecionarTurno(turnoAuto);
}

function toggleTurnoDropdown() {
  const usuario = JSON.parse(localStorage.getItem('gera_usuario'));
  if (usuario && usuario.perfil === 'tv') return;
  document.getElementById('turnoDropdown').classList.toggle('show');
}

function selecionarTurno(turno) {
  turnoSelecionado = turno;
  const label = turno === 'TODOS' ? 'Todos os Turnos' : `Turno: ${turno}`;
  document.getElementById('turnoTextoBotao').textContent = label;

  // Mantém o badge de tela cheia sincronizado (o header, onde fica o seletor normal, some em tela cheia)
  const turnoTelaCheiaTexto = document.getElementById('turnoTelaCheiaTexto');
  if (turnoTelaCheiaTexto) turnoTelaCheiaTexto.textContent = label;

  const dropdown = document.getElementById('turnoDropdown');
  if (dropdown) dropdown.classList.remove('show');
  renderizarAlocacoes(todasAlocacoes);
}

// Se o token estiver inválido/expirado (401/403), o backend nunca vai responder
// corretamente e o dashboard fica "travado" mostrando nada (parece "failed to
// fetch"). Em vez de deixar isso acontecer silenciosamente, força um novo
// login automaticamente para o sistema se recuperar sozinho (importante para
// telas/TV sem ninguém para clicar em "sair" e entrar de novo).
function tratarRespostaAuth(response) {
  if (response.status === 401 || response.status === 403) {
    console.warn('Sessão inválida/expirada. Refazendo login automaticamente...');
    logout();
    return true;
  }
  return false;
}

async function carregarAlocacoes() {
  try {
    const response = await fetch(`${API_BASE}/alocacoes`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('gera_token')}` }
    });
    if (tratarRespostaAuth(response)) return;
    if (!response.ok) throw new Error('Falha na requisição');
    todasAlocacoes = await response.json();
  } catch (error) {
    console.error('Erro ao carregar alocações:', error);
    todasAlocacoes = [];
  }

  const loading = document.getElementById('loadingMsg');
  if (loading) loading.style.display = 'none';
  renderizarAlocacoes(todasAlocacoes);
}

function renderizarAlocacoes(alocacoes) {
  const loading = document.getElementById('loadingMsg');
  if (loading) loading.style.display = 'none';

  const usuario = JSON.parse(localStorage.getItem('gera_usuario')) || {};
  // Modo TV sempre mostra hoje
  const dataFiltro = (usuario.perfil === 'tv' || !dataSelecionada) ? new Date() : new Date(dataSelecionada);
  dataFiltro.setHours(0, 0, 0, 0);

  const filtradas = alocacoes.filter(a => {
    // Na tela inicial, mostramos tudo exceto robótica
    if (a.bloco === 'ROBOTICA') return false;

    // Normalizar data da alocação (YYYY-MM-DD)
    const dataInicioStr = a.data_inicio.split('T')[0];
    const dataFimStr = a.data_fim.split('T')[0];
    const dataFiltroStr = dataFiltro.toISOString().split('T')[0];

    // Comparação direta de strings de data (mais segura para fuso horário)
    const estaNoIntervalo = dataFiltroStr >= dataInicioStr && dataFiltroStr <= dataFimStr;
    
    if (!estaNoIntervalo) return false;

    // Filtro de turno
    return turnoSelecionado === 'TODOS' ? true : a.turno === turnoSelecionado;
  });

  const blocos = { A: [], B: [], C: [] };
  filtradas.forEach(a => {
    if (blocos[a.bloco] !== undefined) blocos[a.bloco].push(a);
  });

  ['A', 'B', 'C'].forEach(letra => {
    const col1 = document.getElementById(`bloco${letra}-col1`);
    const col2 = document.getElementById(`bloco${letra}-col2`);
    if (!col1) return;

    col1.innerHTML = '';
    if (col2) col2.innerHTML = '';
    
    const itens = blocos[letra];

    if (itens.length === 0) {
      const mensagem = dataFiltro
        ? `Sem alocações em ${dataFiltro.toLocaleDateString('pt-BR')} neste bloco.`
        : 'Sem alocações.';
      col1.innerHTML = `<div class="dado-row-vazio">${mensagem}</div>`;
    } else {
      const metade = Math.ceil(itens.length / 2);
      itens.slice(0, metade).forEach(i => col1.appendChild(criarLinha(i)));
      if (col2) {
        itens.slice(metade).forEach(i => col2.appendChild(criarLinha(i)));
      }
    }
  });
}

function formatarDataParaExibicao(dataStr) {
  if (!dataStr) return 'Data não informada';
  try {
    // Pega apenas a parte YYYY-MM-DD se vier com T00:00:00.000Z
    const partes = dataStr.split('T')[0].split('-');
    if (partes.length !== 3) return 'Data inválida';
    // Retorna no formato DD/MM/YYYY
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  } catch (e) {
    return 'Data inválida';
  }
}

function criarLinha(i) {
  const usuario = JSON.parse(localStorage.getItem('gera_usuario')) || {};
  const div = document.createElement('div');
  div.className = 'dado-row';
  const turnoTag = turnoSelecionado === 'TODOS'
    ? `<span class="turno-tag turno-${i.turno.toLowerCase().replace('ã','a')}">${i.turno}</span>`
    : '';

  const instrutorClasse = i.criado_por_perfil === 'admin' ? 'instrutor-sublinhado' : '';

  div.innerHTML = `
    <div class="dado-cell"><strong><span class="${instrutorClasse}">${i.instrutor_nome}</span></strong></div>
    <div class="dado-cell"><strong>${i.sala_nome}</strong></div>
    <div class="dado-cell"><strong>${i.turma_nome}</strong> ${turnoTag}</div>
  `;
  return div;
}

function abrirMenu() {
  document.getElementById('menuLateral').classList.add('aberto');
  document.getElementById('menuOverlay').classList.add('aberto');
}

function fecharMenu() {
  document.getElementById('menuLateral').classList.remove('aberto');
  document.getElementById('menuOverlay').classList.remove('aberto');
}

function logout() {
  localStorage.removeItem('gera_token');
  localStorage.removeItem('gera_usuario');
  localStorage.removeItem('siga_token');
  localStorage.removeItem('siga_usuario');
  window.location.href = 'login.html';
}

async function carregarNotificacoes() {
  const usuario = JSON.parse(localStorage.getItem('gera_usuario'));
  if (!usuario || usuario.perfil !== 'instrutor') return;

  try {
    const [resNotif, resTransf] = await Promise.all([
      fetch(`${API_BASE}/notificacoes`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('gera_token')}` }
      }),
      fetch(`${API_BASE}/transferencias`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('gera_token')}` }
      })
    ]);

    if (tratarRespostaAuth(resNotif) || tratarRespostaAuth(resTransf)) return;

    const notifs = await resNotif.json();
    const transferencias = await resTransf.json();
    
    const container = document.getElementById('notifContainer');
    const badge = document.getElementById('notifBadge');
    const lista = document.getElementById('notifLista');
    
    if (notifs.length > 0 || transferencias.length > 0) {
      container.style.display = 'block';
      const totalNotif = notifs.length + transferencias.length;
      badge.textContent = totalNotif;
      
      let htmlNotif = '';
      
      // Notificações regulares
      htmlNotif += notifs.map(n => `
        <div class="notif-item" onclick="marcarLida(${n.id_notificacao})">
          ${n.mensagem}
          <div style="font-size:10px; color:#999; margin-top:4px;">${new Date(n.data_criacao).toLocaleString('pt-BR')}</div>
        </div>
      `).join('');
      
      // Transferências pendentes
      htmlNotif += transferencias.map(t => `
        <div class="notif-item" onclick="abrirTransferenciaDoModal(${t.id_transferencia})" style="cursor: pointer; background: #e7f3ff; border-left: 4px solid #1a4a9f;">
          <strong>Transferência de Alocação</strong><br>
          ${t.instrutor_origem_nome} solicita transferência na ${t.sala_nome}
          <div style="font-size:10px; color:#999; margin-top:4px;">${new Date(t.data_criacao).toLocaleString('pt-BR')}</div>
        </div>
      `).join('');
      
      lista.innerHTML = htmlNotif;
    } else {
      container.style.display = 'none';
    }
  } catch (e) {
    console.error('Erro ao carregar notificações:', e);
  }
}

async function abrirTransferenciaDoModal(id_transferencia) {
  try {
    const res = await fetch(`${API_BASE}/transferencias/${id_transferencia}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('gera_token')}` }
    });
    const transferencia = await res.json();
    
    // Fechar dropdown de notificacoes
    const notifDropdown = document.getElementById('notifDropdown');
    if (notifDropdown) {
      notifDropdown.classList.remove('show');
    }
    
    // Navegar para pagina de alocacoes se nao estiver la
    if (!window.location.pathname.includes('alocacoes')) {
      // Armazenar transferencia no localStorage para abrir apos navegacao
      localStorage.setItem('transferencia_para_abrir', JSON.stringify(transferencia));
      window.location.href = 'pages/alocacoes.html';
    } else {
      // Ja esta na pagina de alocacoes
      if (typeof abrirModalAceitarTransferencia === 'function') {
        abrirModalAceitarTransferencia(transferencia);
      }
    }
  } catch (e) {
    console.error('Erro ao abrir transferencia:', e);
    alert('Erro ao abrir transferencia.');
  }
}

function toggleNotificacoes() {
  document.getElementById('notifDropdown').classList.toggle('show');
}

async function marcarLida(id) {
  try {
    await fetch(`${API_BASE}/notificacoes/${id}/lida`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('gera_token')}` }
    });
    carregarNotificacoes();
  } catch (e) {
    console.error(e);
  }
}


// Funções de Tela Cheia
function ativarTelaCheia() {
  document.body.classList.add('modo-tela-cheia');
  document.getElementById('btnTelaCheia').style.display = 'none';
  document.getElementById('btnSairTelaCheia').style.display = 'flex';
  
  // Ocultar apenas botoes de tela cheia e menu
  const btnMenu = document.querySelector('.header-controls .btn-icon:last-child');
  if (btnMenu) {
    btnMenu.style.display = 'none';
  }
  
  // Adicionar listener para ESC
  document.addEventListener('keydown', sairTelaCheiaPorESC);
}

function sairTelaCheia() {
  document.body.classList.remove('modo-tela-cheia');
  document.getElementById('btnTelaCheia').style.display = 'flex';
  document.getElementById('btnSairTelaCheia').style.display = 'none';
  
  // Restaurar botao de menu
  const btnMenu = document.querySelector('.header-controls .btn-icon:last-child');
  if (btnMenu) {
    btnMenu.style.display = 'flex';
  }
  
  // Remover listener de ESC
  document.removeEventListener('keydown', sairTelaCheiaPorESC);
}

function sairTelaCheiaPorESC(e) {
  if (e.key === 'Escape') {
    sairTelaCheia();
  }
}

// Filtrar menu para TV
function filtrarMenuTV() {
  const usuario = JSON.parse(localStorage.getItem('gera_usuario'));
  if (usuario && usuario.perfil === 'tv') {
    // Remover itens do menu que TV nao pode acessar
    const itemInstrutores = document.querySelector('.menu-item-instrutores');
    const itemSalas = document.querySelector('.menu-item-salas');
    const itemTurmas = document.querySelector('.menu-item-turmas');
    const itemAlocacoes = document.querySelector('.menu-item-alocacoes');
    
    if (itemInstrutores) itemInstrutores.remove();
    if (itemSalas) itemSalas.remove();
    if (itemTurmas) itemTurmas.remove();
    if (itemAlocacoes) itemAlocacoes.remove();
  }
}

// Chamar ao carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', filtrarMenuTV);
} else {
  filtrarMenuTV();
}

// ===================== REDIMENSIONAMENTO DE COLUNAS =====================
// Injeta os handles de arraste nos cabeçalhos (INSTRUTOR|SALA e SALA|TURMA)
// de todas as tabelas do dashboard. A largura é controlada por variáveis
// CSS globais (--col-w-instrutor, --col-w-sala, --col-w-turma), então
// arrastar em qualquer tabela atualiza todas as outras ao mesmo tempo.
function criarHandlesRedimensionamentoColunas() {
  document.querySelectorAll('.col-header-row').forEach(row => {
    const instrutorCol = row.querySelector('.instrutor-col');
    const salaCol = row.querySelector('.sala-col');

    if (instrutorCol && !instrutorCol.querySelector('.col-resize-handle')) {
      const handle = document.createElement('div');
      handle.className = 'col-resize-handle';
      handle.dataset.tipo = 'instrutor-sala';
      instrutorCol.appendChild(handle);
    }

    if (salaCol && !salaCol.querySelector('.col-resize-handle')) {
      const handle = document.createElement('div');
      handle.className = 'col-resize-handle';
      handle.dataset.tipo = 'sala-turma';
      salaCol.appendChild(handle);
    }
  });
}

function inicializarRedimensionamentoColunas() {
  const LARGURA_MINIMA = 10; // % mínima por coluna

  let handleAtivo = null;
  let startX = 0;
  let containerWidth = 0;
  let startWInstrutor = 0;
  let startWSala = 0;
  let startWTurma = 0;

  function obterLargurasAtuais() {
    const estilo = getComputedStyle(document.documentElement);
    return {
      instrutor: parseFloat(estilo.getPropertyValue('--col-w-instrutor')) || 33.333,
      sala: parseFloat(estilo.getPropertyValue('--col-w-sala')) || 33.333,
      turma: parseFloat(estilo.getPropertyValue('--col-w-turma')) || 33.333
    };
  }

  function aplicarLarguras(instrutor, sala, turma) {
    document.documentElement.style.setProperty('--col-w-instrutor', instrutor + '%');
    document.documentElement.style.setProperty('--col-w-sala', sala + '%');
    document.documentElement.style.setProperty('--col-w-turma', turma + '%');
  }

  function salvarLarguras(instrutor, sala, turma) {
    localStorage.setItem('gera_col_widths', JSON.stringify({ instrutor, sala, turma }));
  }

  document.querySelectorAll('.col-resize-handle').forEach(handle => {
    handle.addEventListener('mousedown', function (e) {
      e.preventDefault();
      handleAtivo = handle;
      startX = e.clientX;

      const larguras = obterLargurasAtuais();
      startWInstrutor = larguras.instrutor;
      startWSala = larguras.sala;
      startWTurma = larguras.turma;

      const linhaHeader = handle.closest('.col-header-row');
      containerWidth = linhaHeader.getBoundingClientRect().width;

      handle.classList.add('resizing');
      document.body.classList.add('redimensionando-coluna');
    });
  });

  document.addEventListener('mousemove', function (e) {
    if (!handleAtivo || !containerWidth) return;

    const deltaX = e.clientX - startX;
    const deltaPercent = (deltaX / containerWidth) * 100;
    const tipo = handleAtivo.dataset.tipo;

    let novoInstrutor = startWInstrutor;
    let novoSala = startWSala;
    let novoTurma = startWTurma;

    if (tipo === 'instrutor-sala') {
      novoInstrutor = startWInstrutor + deltaPercent;
      novoSala = startWSala - deltaPercent;

      if (novoInstrutor < LARGURA_MINIMA) {
        novoSala -= (LARGURA_MINIMA - novoInstrutor);
        novoInstrutor = LARGURA_MINIMA;
      }
      if (novoSala < LARGURA_MINIMA) {
        novoInstrutor -= (LARGURA_MINIMA - novoSala);
        novoSala = LARGURA_MINIMA;
      }
    } else if (tipo === 'sala-turma') {
      novoSala = startWSala + deltaPercent;
      novoTurma = startWTurma - deltaPercent;

      if (novoSala < LARGURA_MINIMA) {
        novoTurma -= (LARGURA_MINIMA - novoSala);
        novoSala = LARGURA_MINIMA;
      }
      if (novoTurma < LARGURA_MINIMA) {
        novoSala -= (LARGURA_MINIMA - novoTurma);
        novoTurma = LARGURA_MINIMA;
      }
    }

    aplicarLarguras(novoInstrutor, novoSala, novoTurma);
  });

  document.addEventListener('mouseup', function () {
    if (!handleAtivo) return;

    const larguras = obterLargurasAtuais();
    salvarLarguras(larguras.instrutor, larguras.sala, larguras.turma);

    handleAtivo.classList.remove('resizing');
    handleAtivo = null;
    containerWidth = 0;
    document.body.classList.remove('redimensionando-coluna');
  });
}
