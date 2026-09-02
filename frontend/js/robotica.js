// GERA - Robótica JavaScript
const API_BASE = '/api';
let todasAlocacoes = [];
let todasSalasRobotica = [];
let dataSelecionada = null;

const turnos = ['Manhã', 'Tarde', 'Noite'];
const idsTurno = { 'Manhã': 'Manha', 'Tarde': 'Tarde', 'Noite': 'Noite' };
const usuarioAtual = () => JSON.parse(localStorage.getItem('gera_usuario')) || {};

document.addEventListener('DOMContentLoaded', () => {
  const usuario = usuarioAtual();
  if (!usuario || !localStorage.getItem('gera_token')) {
    window.location.href = '../login.html';
    return;
  }
  
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

  atualizarData();
  carregarDados();

  // Auto-reload dos dados a cada 5 segundos
  setInterval(carregarDados, 5000);

  const inputData = document.getElementById('btnSelecionarData');
  if (inputData) {
    inputData.addEventListener('change', function () {
      if (this.value) {
        dataSelecionada = new Date(this.value + 'T00:00:00');
        atualizarData();
        renderizar();
      }
    });
  }
});

function atualizarData() {
  const usuario = usuarioAtual();
  // Modo TV sempre mostra hoje
  const data = (usuario.perfil === 'tv' || !dataSelecionada) ? new Date() : new Date(dataSelecionada);
  
  const opcoes = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const el = document.getElementById('dataAtual');
  if (el) {
    const txt = data.toLocaleDateString('pt-BR', opcoes);
    el.innerHTML = txt.charAt(0).toUpperCase() + txt.slice(1);
  }
  const input = document.getElementById('btnSelecionarData');
  if (input) {
    if (usuario.perfil === 'tv') {
      input.style.display = 'none';
    } else {
      input.value = data.toISOString().split('T')[0];
    }
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
    atualizarData();
    renderizar();
    fecharModalData();
  }
}

async function carregarDados() {
  const token = localStorage.getItem('gera_token');
  try {
    const [alocRes, salasRes] = await Promise.all([
      fetch(`${API_BASE}/alocacoes`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_BASE}/salas`, { headers: { 'Authorization': `Bearer ${token}` } })
    ]);

    if (!alocRes.ok || !salasRes.ok) throw new Error('Falha ao carregar dados da robótica.');

    todasAlocacoes = await alocRes.json();
    const todasSalas = await salasRes.json();
    todasSalasRobotica = todasSalas.filter(s => s.bloco === 'ROBOTICA');
    renderizar();
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    turnos.forEach(turno => {
      const grid = document.getElementById(`robotica${idsTurno[turno]}-col1`);
      if (grid) grid.innerHTML = '<div class="dado-row-vazio">Erro ao carregar dados.</div>';
    });
  }
}

function renderizar() {
  const usuario = usuarioAtual();
  const dataFiltro = (usuario.perfil === 'tv' || !dataSelecionada) ? new Date() : new Date(dataSelecionada);
  dataFiltro.setHours(0, 0, 0, 0);
  const dataISO = dataFiltro.toISOString().split('T')[0];

  turnos.forEach(turno => {
    const container = document.getElementById(`robotica${idsTurno[turno]}-col1`);
    if (!container) return;
    container.innerHTML = '';

    // Filtrar alocações da robótica para este turno e data
    const alocacoesTurno = todasAlocacoes.filter(a => {
      if (a.bloco !== 'ROBOTICA') return false;
      if (a.turno !== turno) return false;
      
      const dataInicioStr = a.data_inicio.split('T')[0];
      const dataFimStr = a.data_fim.split('T')[0];
      return dataISO >= dataInicioStr && dataISO <= dataFimStr;
    });

    if (alocacoesTurno.length === 0) {
      // Se não houver alocações, deixa em branco conforme solicitado
      container.innerHTML = '<div class="dado-row-vazio" style="border:none; background:transparent; color:#999;">Nenhuma alocação para este turno.</div>';
    } else {
      alocacoesTurno.forEach(a => {
        container.appendChild(criarLinhaAlocacao(a, null, turno, usuario));
      });
    }
  });
}

// Função criarLinhaLivre removida conforme solicitação para mostrar apenas alocações existentes.

function formatarDataParaExibicao(dataStr) {
  if (!dataStr) return 'Data não informada';
  try {
    const partes = dataStr.split('T')[0].split('-');
    if (partes.length !== 3) return 'Data inválida';
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  } catch (e) {
    return 'Data inválida';
  }
}

function criarLinhaAlocacao(a, sala, turno, usuario) {
  const div = document.createElement('div');
  div.className = 'dado-row';
  div.title = 'Alocação existente neste dia e turno.';

  const dataIni = formatarDataParaExibicao(a.data_inicio);
  const dataFim = formatarDataParaExibicao(a.data_fim);
  const instrutorClasse = a.criado_por_perfil === 'admin' ? 'instrutor-sublinhado' : '';

  div.innerHTML = `
    <div class="dado-cell"><strong><span class="${instrutorClasse}">${a.instrutor_nome}</span></strong></div>
    <div class="dado-cell"><strong>${a.sala_nome || (sala ? sala.nome : 'Sala')}</strong><br><small>${turno}</small></div>
    <div class="dado-cell"><strong style="font-size: 1.1rem;">${a.turma_nome}</strong><br><small>${dataIni} até ${dataFim}</small></div>
  `;
  return div;
}

async function abrirModal(sala, alocAtual, turnoDefault = 'Manhã') {
  const usuario = usuarioAtual();
  document.getElementById('idSalaAlocacao').value = sala.id_sala;
  document.getElementById('tituloModal').textContent = `Alocar: ${sala.nome}`;

  const token = localStorage.getItem('gera_token');
  const [instRes, turRes] = await Promise.all([
    fetch(`${API_BASE}/instrutores`, { headers: { 'Authorization': `Bearer ${token}` } }),
    fetch(`${API_BASE}/turmas`, { headers: { 'Authorization': `Bearer ${token}` } })
  ]);

  preencherSelect('selInstrutor', await instRes.json(), 'id_instrutor', 'nome');
  preencherSelect('selTurma', await turRes.json(), 'id_turma', 'nome');

  const selInst = document.getElementById('selInstrutor');
  if (usuario.perfil === 'instrutor') {
    selInst.value = usuario.id_instrutor;
    selInst.disabled = true;
  } else {
    selInst.disabled = false;
  }

  const selTurno = document.getElementById('selTurno');
  selTurno.value = turnoDefault;

  const dataBase = (dataSelecionada ? new Date(dataSelecionada) : new Date()).toISOString().split('T')[0];
  document.getElementById('dataInicio').value = alocAtual ? alocAtual.data_inicio.split('T')[0] : dataBase;
  document.getElementById('dataFim').value = alocAtual ? alocAtual.data_fim.split('T')[0] : dataBase;
  if (alocAtual) {
    document.getElementById('selTurma').value = alocAtual.id_turma;
    document.getElementById('selInstrutor').value = alocAtual.id_instrutor;
  }

  document.getElementById('modalAlocacao').style.display = 'flex';
}

function preencherSelect(id, itens, val, txt) {
  const s = document.getElementById(id);
  s.innerHTML = '<option value="">-- Selecione --</option>' +
    itens.map(i => `<option value="${i[val]}">${i[txt]}</option>`).join('');
}

async function salvarAlocacao() {
  const body = {
    id_sala: document.getElementById('idSalaAlocacao').value,
    id_instrutor: document.getElementById('selInstrutor').value,
    id_turma: document.getElementById('selTurma').value,
    turno: document.getElementById('selTurno').value,
    data_inicio: document.getElementById('dataInicio').value,
    data_fim: document.getElementById('dataFim').value
  };

  if (!body.id_instrutor || !body.id_turma || !body.turno || !body.data_inicio || !body.data_fim) {
    alert('Preencha todos os campos.');
    return;
  }

  if (body.data_inicio > body.data_fim) {
    alert('A data de início não pode ser posterior à data de fim.');
    return;
  }

  // Validate that dates are not in the past (considering shift)
  const validacao = validarDataRetroativaPorTurno(body.data_inicio, body.turno);
  if (!validacao.valido) {
    alert(validacao.mensagem);
    return;
  }

  const token = localStorage.getItem('gera_token');
  const res = await fetch(`${API_BASE}/alocacoes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(body)
  });

  if (res.ok) {
    fecharModal('modalAlocacao');
    carregarDados();
  } else {
    const err = await res.json();
    alert(err.erro || 'Erro ao salvar.');
  }
}

function fecharModal(id) {
  document.getElementById(id).style.display = 'none';
}

// Filtrar menu para TV
function filtrarMenuTV() {
  const usuario = JSON.parse(localStorage.getItem('gera_usuario'));
  if (usuario && usuario.perfil === 'tv') {
    // Remover itens do menu que TV não pode acessar
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
document.addEventListener('DOMContentLoaded', filtrarMenuTV);
