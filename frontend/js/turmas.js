// SIGA - Turmas JavaScript
const API_BASE = '/api';
let turmas = [];
let modoRemover = false;

document.addEventListener('DOMContentLoaded', () => {
  verificarAutenticacao();
  carregarTurmas();
});

function verificarAutenticacao() {
  const usuario = JSON.parse(localStorage.getItem('gera_usuario')) || {};
  if (!localStorage.getItem('gera_token')) window.location.href = '../login.html';
  if (usuario.perfil !== 'admin') {
    const btnAdicionar = document.querySelector('.btn-adicionar');
    const btnRemover = document.getElementById('btnModoRemover');
    if (btnAdicionar) btnAdicionar.style.display = 'none';
    if (btnRemover) btnRemover.style.display = 'none';
  }
}

async function carregarTurmas() {
  const loadingMsg = document.getElementById('loadingMsg');
  try {
    const response = await fetch(`${API_BASE}/turmas`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('gera_token')}` }
    });
    turmas = await response.json();
    loadingMsg.style.display = 'none';
    renderizar(turmas);
  } catch (e) { loadingMsg.textContent = 'Erro ao carregar.'; }
}

function renderizar(lista) {
  const container = document.getElementById('listaTurmas');
  container.innerHTML = '';
  container.className = 'lista-grid' + (modoRemover ? ' modo-remover' : '');

  lista.forEach(turma => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.onclick = () => modoRemover ? removerTurma(turma.id_turma) : null;
    
    // Mapear turno para ícone e cor
    const turnoInfo = {
      'Manhã': { icon: 'bi-sun-fill', cor: '#FFD700' },
      'Tarde': { icon: 'bi-cloud-sun', cor: '#FF8C00' },
      'Noite': { icon: 'bi-moon-stars', cor: '#4B0082' }
    };
    const info = turnoInfo[turma.turno] || turnoInfo['Manhã'];
    
    card.innerHTML = `
      <div class="btn-remover-item"><i class="bi bi-dash"></i></div>
      <i class="bi bi-people-fill"></i>
      <div class="turma-nome">${turma.nome}</div>
      <div style="font-size: 0.75rem; color: #666; margin-top: 8px; display: flex; align-items: center; gap: 4px;">
        <i class="bi ${info.icon}" style="color: ${info.cor}; font-size: 0.9rem;"></i>
        <span>${turma.turno}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

function pesquisarTurmas() {
  const termo = document.getElementById('campoPesquisa').value.toLowerCase();
  renderizar(turmas.filter(t => t.nome.toLowerCase().includes(termo)));
}

function toggleModoRemover() {
  const usuario = JSON.parse(localStorage.getItem('gera_usuario')) || {};
  if (usuario.perfil !== 'admin') return alert('Apenas administradores podem remover turmas.');
  modoRemover = !modoRemover;
  const btn = document.getElementById('btnModoRemover');
  btn.classList.toggle('ativo');
  btn.innerHTML = modoRemover ? '<i class="bi bi-check-lg"></i> Concluir' : '<i class="bi bi-trash"></i> Remover';
  renderizar(turmas);
}

async function removerTurma(id) {
  const usuario = JSON.parse(localStorage.getItem('gera_usuario')) || {};
  if (usuario.perfil !== 'admin') return alert('Apenas administradores podem remover turmas.');
  if (!confirm('Deseja remover esta turma?')) return;
  await fetch(`${API_BASE}/turmas/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('gera_token')}` }
  });
  carregarTurmas();
}

function abrirModalAdicionar() {
  const usuario = JSON.parse(localStorage.getItem('gera_usuario')) || {};
  if (usuario.perfil !== 'admin') return alert('Apenas administradores podem criar turmas.');
  document.getElementById('nomeTurma').value = '';
  document.getElementById('turnoTurma').value = 'Manhã';
  document.getElementById('modalAdicionar').style.display = 'flex';
}

function fecharModal(id) { 
  document.getElementById(id).style.display = 'none'; 
}

async function adicionarTurma() {
  const usuario = JSON.parse(localStorage.getItem('gera_usuario')) || {};
  if (usuario.perfil !== 'admin') return alert('Apenas administradores podem criar turmas.');
  
  const nome = document.getElementById('nomeTurma').value.trim();
  const turno = document.getElementById('turnoTurma').value;
  
  if (!nome) {
    return alert('Por favor, informe o nome da turma.');
  }
  
  const res = await fetch(`${API_BASE}/turmas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('gera_token')}`
    },
    body: JSON.stringify({ nome, turno })
  });
  
  if (res.ok) {
    fecharModal('modalAdicionar');
    carregarTurmas();
  } else {
    const err = await res.json();
    alert(err.erro || 'Erro ao adicionar turma.');
  }
}
