const API_BASE = '/api';
let alocacoes = [];
let todosInstrutores = [];
let todasSalas = [];
let todasTurmas = [];
let modoRemover = false;
let alocacaoEditando = null;
let transferenciaPendente = null;

const usuarioAtual = () => JSON.parse(localStorage.getItem('gera_usuario')) || {};

document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('gera_token')) {
    window.location.href = '../login.html';
    return;
  }
  carregarDados();
  setInterval(carregarDados, 30000);
  
  // Verificar se ha transferencia para abrir
  const transferenciaPendentePara = localStorage.getItem('transferencia_para_abrir');
  if (transferenciaPendentePara) {
    try {
      const transferencia = JSON.parse(transferenciaPendentePara);
      localStorage.removeItem('transferencia_para_abrir');
      // Aguardar um pouco para garantir que tudo foi carregado
      setTimeout(() => {
        abrirModalAceitarTransferencia(transferencia);
      }, 500);
    } catch (e) {
      console.error('Erro ao abrir transferencia armazenada:', e);
    }
  }
});

async function carregarDados() {
  const token = localStorage.getItem('gera_token');

  try {
    const [alocRes, instRes, salaRes, turRes] = await Promise.all([
      fetch(`${API_BASE}/alocacoes`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_BASE}/instrutores`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_BASE}/salas`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_BASE}/turmas`, { headers: { 'Authorization': `Bearer ${token}` } })
    ]);

    todosInstrutores = await instRes.json();
    todasSalas = await salaRes.json();
    todasTurmas = await turRes.json();
    alocacoes = await alocRes.json();

    renderizar();
    preencherSelect('selInstrutor', todosInstrutores, 'id_instrutor', 'nome');
    preencherSelect('selTurmaTransferencia', todasTurmas, 'id_turma', 'nome');
  } catch (e) {
    console.error('Erro ao carregar dados:', e);
    alert('Erro ao carregar dados. Verifique o servidor.');
  }
}

function renderizar() {
  const container = document.getElementById('listaAlocacoes');
  const usuario = usuarioAtual();
  container.innerHTML = '';
  container.className = modoRemover ? 'modo-remover' : '';

  // Filtrar alocações: instrutores veem apenas suas, admins veem todas
  let alocacoesExibir = alocacoes;
  if (usuario.perfil === 'instrutor') {
    alocacoesExibir = alocacoes.filter(a => Number(a.id_instrutor) === Number(usuario.id_instrutor));
  }

  if (alocacoesExibir.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#888;padding:30px;">Nenhuma alocação cadastrada.</p>';
    return;
  }

  alocacoesExibir.forEach(a => {
    const card = document.createElement('div');
    card.className = 'aloc-card';
    card.title = modoRemover ? 'Clique para remover' : 'Clique para transferir esta alocação';
    card.onclick = () => modoRemover ? removerAlocacao(a.id_alocacao) : abrirModalTransferencia(a);

    const dataIni = formatarData(a.data_inicio);
    const dataFim = formatarData(a.data_fim);
    const instrutorClasse = a.criado_por_perfil === 'admin' ? 'instrutor-sublinhado' : '';
    const podeEditar = usuario.perfil === 'admin' || Number(a.id_instrutor) === Number(usuario.id_instrutor);

    card.innerHTML = `
      <div class="aloc-info">
        <span class="${instrutorClasse}"><b>${a.instrutor_nome}</b></span> — Sala <b>${a.sala_nome}</b> (${a.bloco})<br>
        Turma: ${a.turma_nome} &nbsp;|&nbsp; Turno: <strong>${a.turno}</strong>
        <div class="aloc-datas"><i class="bi bi-calendar-event"></i> ${dataIni} até ${dataFim}</div>
        ${podeEditar ? '<small style="color:#1a4a9f;">Clique para transferir</small>' : ''}
      </div>
      <div class="btn-remover-item"><i class="bi bi-dash"></i></div>
    `;
    container.appendChild(card);
  });
}

function formatarData(dataStr) {
  if (!dataStr) return 'Data não informada';
  try {
    const partes = dataStr.split('T')[0].split('-');
    if (partes.length !== 3) return 'Data inválida';
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  } catch (e) {
    return 'Data inválida';
  }
}

function toggleModoRemover() {
  modoRemover = !modoRemover;
  const btn = document.getElementById('btnModoRemover');
  btn.classList.toggle('ativo');
  btn.innerHTML = modoRemover
    ? '<i class="bi bi-check-lg"></i> Concluir'
    : '<i class="bi bi-trash"></i> Remover';
  renderizar();
}

async function removerAlocacao(id) {
  if (!confirm('Deseja remover esta alocação?')) return;
  try {
    const res = await fetch(`${API_BASE}/alocacoes/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('gera_token')}` }
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.erro || 'Erro ao remover.');
    }
    carregarDados();
  } catch (e) {
    alert('Erro ao remover.');
  }
}

function validarConflitos() {
  const id_instrutor = document.getElementById('selInstrutor').value;
  const data_inicio = document.getElementById('dataInicio').value;
  const data_fim = document.getElementById('dataFim').value;
  const msg = document.getElementById('msgConflito');
  const btn = document.getElementById('btnSalvar');

  msg.style.display = 'none';
  btn.disabled = false;
  btn.style.opacity = '1';

  if (!id_instrutor || !data_inicio || !data_fim) return;
  if (data_inicio > data_fim) {
    msg.textContent = 'A data de início não pode ser posterior à data de fim.';
    msg.style.display = 'block';
    btn.disabled = true;
    btn.style.opacity = '0.5';
    return;
  }

  // Validar se as datas estão dentro da alocação original
  if (alocacaoEditando) {
    if (data_inicio < alocacaoEditando.data_inicio.split('T')[0] || 
        data_fim > alocacaoEditando.data_fim.split('T')[0]) {
      msg.textContent = 'As datas de transferência devem estar dentro do período da alocação original.';
      msg.style.display = 'block';
      btn.disabled = true;
      btn.style.opacity = '0.5';
      return;
    }
  }

  // Para transferência, validar se o novo instrutor tem conflito nas datas selecionadas
  let mensagemConflito = '';
  if (alocacaoEditando) {
    const turno = alocacaoEditando.turno;
    
    for (const a of alocacoes) {
      if (Number(a.id_alocacao) === Number(alocacaoEditando.id_alocacao)) continue;
      
      const sobrepoe = (data_inicio <= a.data_fim && data_fim >= a.data_inicio);
      
      // Verificar se o novo instrutor já tem alocação neste período e turno
      if (sobrepoe && a.turno === turno && String(a.id_instrutor) === String(id_instrutor)) {
        mensagemConflito = `Este instrutor já tem uma alocação na sala "${a.sala_nome}" neste período.`;
        break;
      }
    }
  }

  if (mensagemConflito) {
    msg.textContent = mensagemConflito;
    msg.style.display = 'block';
    btn.disabled = true;
    btn.style.opacity = '0.5';
  }
}

async function salvarAlocacao() {
  if (!alocacaoEditando) {
    alert('Nenhuma alocação selecionada para transferência.');
    return;
  }

  const id_instrutor = document.getElementById('selInstrutor').value;
  const data_inicio = document.getElementById('dataInicio').value;
  const data_fim = document.getElementById('dataFim').value;

  if (!id_instrutor || !data_inicio || !data_fim) {
    alert('Preencha todos os campos.');
    return;
  }

  try {
    const body = {
      id_alocacao: alocacaoEditando.id_alocacao,
      id_instrutor_destino: id_instrutor,
      data_inicio_transferencia: data_inicio,
      data_fim_transferencia: data_fim
    };

    const res = await fetch(`${API_BASE}/transferencias`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('gera_token')}`
      },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      fecharModal();
      alert('Solicitação de transferência enviada com sucesso!');
      carregarDados();
    } else {
      const err = await res.json();
      alert(err.erro || 'Erro ao criar solicitação de transferência.');
    }
  } catch (e) {
    alert('Erro de conexão. Verifique o servidor.');
  }
}

function preencherSelect(id, itens, val, txt) {
  const s = document.getElementById(id);
  if (!s) return;
  s.innerHTML = '<option value="">-- Selecione --</option>' +
    itens.map(i => `<option value="${i[val]}">${i[txt]}</option>`).join('');
}

function prepararModalBase() {
  document.getElementById('msgConflito').style.display = 'none';
  document.getElementById('btnSalvar').disabled = false;
  document.getElementById('btnSalvar').style.opacity = '1';
  preencherSelect('selInstrutor', todosInstrutores, 'id_instrutor', 'nome');
}

function abrirModal() {
  const usuario = usuarioAtual();
  alocacaoEditando = null;
  prepararModalBase();

  const titulo = document.querySelector('#modalAlocacao .modal-titulo');
  if (titulo) titulo.textContent = 'Nova Alocação';
  document.getElementById('btnSalvar').textContent = 'SALVAR';

  document.getElementById('selInstrutor').value = '';
  document.getElementById('dataInicio').value = '';
  document.getElementById('dataFim').value = '';

  const selInst = document.getElementById('selInstrutor');
  if (usuario.perfil === 'instrutor') {
    selInst.value = usuario.id_instrutor;
    selInst.disabled = true;
  } else {
    selInst.disabled = false;
  }

  document.getElementById('modalAlocacao').style.display = 'flex';
}

function abrirModalTransferencia(alocacao) {
  const usuario = usuarioAtual();
  const podeEditar = usuario.perfil === 'admin' || Number(alocacao.id_instrutor) === Number(usuario.id_instrutor);
  if (!podeEditar) return;

  alocacaoEditando = alocacao;
  prepararModalBase();

  const titulo = document.querySelector('#modalAlocacao .modal-titulo');
  if (titulo) titulo.textContent = 'Transferir Alocação';
  document.getElementById('btnSalvar').textContent = 'TRANSFERIR';

  document.getElementById('selInstrutor').value = '';
  document.getElementById('dataInicio').value = alocacao.data_inicio.split('T')[0];
  document.getElementById('dataFim').value = alocacao.data_fim.split('T')[0];

  document.getElementById('selInstrutor').disabled = false;

  document.getElementById('modalAlocacao').style.display = 'flex';
}

function fecharModal() {
  alocacaoEditando = null;
  document.getElementById('modalAlocacao').style.display = 'none';
}

// Funções para modal de aceitar/rejeitar transferência
function abrirModalAceitarTransferencia(transferencia) {
  transferenciaPendente = transferencia;

  // Preencher informações da transferência
  document.getElementById('transferInfoInstrutor').textContent = transferencia.instrutor_origem_nome;
  document.getElementById('transferInfoSala').textContent = transferencia.sala_nome;
  document.getElementById('transferInfoTurno').textContent = transferencia.turno;
  
  const dataInicio = formatarData(transferencia.data_inicio_transferencia);
  const dataFim = formatarData(transferencia.data_fim_transferencia);
  document.getElementById('transferInfoPeriodo').textContent = `${dataInicio} até ${dataFim}`;

  // Limpar e preencher seletor de turma com filtro por turno
  document.getElementById('msgConflitTransferencia').style.display = 'none';
  document.getElementById('btnAceitar').disabled = false;
  document.getElementById('btnAceitar').style.opacity = '1';
  
  // Filtrar turmas pelo turno da transferencia
  const turmasDoTurno = todasTurmas.filter(t => t.turno === transferencia.turno);
  preencherSelect('selTurmaTransferencia', turmasDoTurno, 'id_turma', 'nome');
  document.getElementById('selTurmaTransferencia').value = '';

  document.getElementById('modalAceitarTransferencia').style.display = 'flex';
}

function fecharModalTransferencia() {
  transferenciaPendente = null;
  document.getElementById('modalAceitarTransferencia').style.display = 'none';
}

function validarConflitTransferencia() {
  const id_turma = document.getElementById('selTurmaTransferencia').value;
  const msg = document.getElementById('msgConflitTransferencia');
  const btn = document.getElementById('btnAceitar');

  msg.style.display = 'none';
  btn.disabled = false;
  btn.style.opacity = '1';

  if (!id_turma) return;

  if (!transferenciaPendente) return;

  // Verificar se a turma selecionada tem conflito
  let temConflito = false;
  const turno = transferenciaPendente.turno;
  const dataInicio = transferenciaPendente.data_inicio_transferencia;
  const dataFim = transferenciaPendente.data_fim_transferencia;
  const idSala = transferenciaPendente.id_sala;

  for (const a of alocacoes) {
    const sobrepoe = (dataInicio <= a.data_fim && dataFim >= a.data_inicio);
    
    if (sobrepoe && a.turno === turno && String(a.id_sala) === String(idSala) && String(a.id_turma) === String(id_turma)) {
      msg.textContent = `Esta turma já está alocada neste período e turno.`;
      msg.style.display = 'block';
      btn.disabled = true;
      btn.style.opacity = '0.5';
      temConflito = true;
      break;
    }
  }
}

async function aceitarTransferencia() {
  if (!transferenciaPendente) {
    alert('Nenhuma transferência selecionada.');
    return;
  }

  const id_turma = document.getElementById('selTurmaTransferencia').value;
  if (!id_turma) {
    alert('Selecione uma turma.');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/transferencias/${transferenciaPendente.id_transferencia}/aceitar`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('gera_token')}`
      },
      body: JSON.stringify({ id_turma_destino: id_turma })
    });

    if (res.ok) {
      // Limpar notificações dos instrutores envolvidos
      await limparNotificacoesTransferencia(transferenciaPendente.id_instrutor_origem, transferenciaPendente.id_instrutor_destino);
      fecharModalTransferencia();
      alert('Transferência aceita com sucesso!');
      carregarDados();
    } else {
      const err = await res.json();
      alert(err.erro || 'Erro ao aceitar transferência.');
    }
  } catch (e) {
    alert('Erro de conexão. Verifique o servidor.');
  }
}

async function rejeitarTransferencia() {
  if (!transferenciaPendente) {
    alert('Nenhuma transferência selecionada.');
    return;
  }

  if (!confirm('Deseja rejeitar esta transferência?')) return;

  try {
    const res = await fetch(`${API_BASE}/transferencias/${transferenciaPendente.id_transferencia}/rejeitar`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('gera_token')}`
      }
    });

    if (res.ok) {
      // Limpar notificações dos instrutores envolvidos
      await limparNotificacoesTransferencia(transferenciaPendente.id_instrutor_origem, transferenciaPendente.id_instrutor_destino);
      fecharModalTransferencia();
      alert('Transferência rejeitada.');
      carregarDados();
    } else {
      const err = await res.json();
      alert(err.erro || 'Erro ao rejeitar transferência.');
    }
  } catch (e) {
    alert('Erro de conexão. Verifique o servidor.');
  }
}

async function limparNotificacoesTransferencia(id_instrutor_origem, id_instrutor_destino) {
  try {
    const token = localStorage.getItem('gera_token');
    // Limpar notificações do instrutor que enviou a transferência
    await fetch(`${API_BASE}/notificacoes/instrutor/${id_instrutor_origem}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // Limpar notificações do instrutor que recebeu a transferência
    await fetch(`${API_BASE}/notificacoes/instrutor/${id_instrutor_destino}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  } catch (e) {
    console.error('Erro ao limpar notificações:', e);
  }
}
