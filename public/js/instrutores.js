// SIGA - Instrutores JavaScript (Versão Final)
const API_BASE = '/api';
let instrutores = [];
let modoRemover = false;

document.addEventListener('DOMContentLoaded', () => {
  verificarAutenticacao();
  carregarInstrutores();
});

function verificarAutenticacao() {
  const usuario = JSON.parse(localStorage.getItem('gera_usuario'));
  if (!usuario || !localStorage.getItem('gera_token')) {
    window.location.href = '../login.html';
    return;
  }

  if (usuario.perfil !== 'admin') {
    const btnAdicionar = document.querySelector('.btn-adicionar');
    const btnRemover = document.getElementById('btnModoRemover');
    if (btnAdicionar) btnAdicionar.style.display = 'none';
    if (btnRemover) btnRemover.style.display = 'none';
  }
}

async function carregarInstrutores() {
  const loadingMsg = document.getElementById('loadingMsg');
  try {
    const response = await fetch(`${API_BASE}/instrutores`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('gera_token')}` }
    });
    instrutores = await response.json();
    if (loadingMsg) loadingMsg.style.display = 'none';
    renderizar();
  } catch (e) { if (loadingMsg) loadingMsg.textContent = 'Erro ao carregar.'; }
}

function renderizar() {
  const container = document.getElementById('listaInstrutores');
  if (!container) return;
  container.innerHTML = '';
  container.className = 'lista-grid' + (modoRemover ? ' modo-remover' : '');

  instrutores.forEach(inst => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.onclick = () => modoRemover ? removerInstrutor(inst.id_instrutor) : null;
    card.innerHTML = `
      <div class="btn-remover-item"><i class="bi bi-dash"></i></div>
      <i class="bi bi-person-badge" style="font-size: 2rem; color: #1a4a9f;"></i>
      <div class="item-info" style="text-align: center; margin-top: 10px;">
        <div class="nome-instrutor" style="font-weight: bold;">${inst.nome}</div>
        <div class="matricula-instrutor" style="font-size: 0.8rem; color: #666;">Matrícula: ${inst.matricula}</div>
      </div>
    `;
    container.appendChild(card);
  });
}

function toggleModoRemover() {
  modoRemover = !modoRemover;
  const btn = document.getElementById('btnModoRemover');
  btn.classList.toggle('ativo');
  btn.innerHTML = modoRemover ? '<i class="bi bi-check-lg"></i> Concluir' : '<i class="bi bi-trash"></i> Remover';
  renderizar();
}

async function removerInstrutor(id) {
  if (!confirm('Deseja realmente remover este instrutor?')) return;
  try {
    await fetch(`${API_BASE}/instrutores/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('gera_token')}` }
    });
    carregarInstrutores();
  } catch (e) { alert('Erro ao remover.'); }
}

function abrirModalAdicionar() {
  const usuario = JSON.parse(localStorage.getItem('gera_usuario'));
  if (!usuario || usuario.perfil !== 'admin') return alert('Apenas administradores podem criar instrutores.');
  document.getElementById('nomeInstrutor').value = '';
  document.getElementById('matriculaInstrutor').value = '';
  document.getElementById('modalAdicionar').style.display = 'flex';
}

function fecharModal(id) { document.getElementById(id).style.display = 'none'; }

async function adicionarInstrutor() {
  const nome = document.getElementById('nomeInstrutor').value.trim();
  const matricula = document.getElementById('matriculaInstrutor').value.trim();
  if (!nome) return alert('Preencha o nome do instrutor.');
  if (matricula && !/^[0-9]+$/.test(matricula)) return alert('A matrícula deve conter apenas números.');

  try {
    const response = await fetch(`${API_BASE}/instrutores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('gera_token')}`
      },
      body: JSON.stringify({ nome, matricula })
    });
    
    const data = await response.json();
    if (response.ok) {
      fecharModal('modalAdicionar');
      carregarInstrutores();
    } else {
      alert(data.erro || 'Erro ao salvar.');
    }
  } catch (e) { alert('Erro ao salvar.'); }
}

