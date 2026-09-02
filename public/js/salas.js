// GERA - Salas JavaScript
const API_BASE = '/api';
let todasSalas = [];
let todasAlocacoes = [];
let todasTurmas = [];
let abaAtual = 'SALA';
let modoRemover = false;
let calendarioOcupadas = [];
let calendarioMesAtual = new Date();
let salaSelecionada = null;

document.addEventListener('DOMContentLoaded', () => {
  verificarAutenticacao();
  carregarDados();
});

function usuarioAtual() {
  return JSON.parse(localStorage.getItem('gera_usuario')) || {};
}

function verificarAutenticacao() {
  const usuario = usuarioAtual();
  if (!usuario || !localStorage.getItem('gera_token')) window.location.href = '../login.html';
  if (usuario.perfil === 'tv') window.location.href = '../index.html';

  if (usuario.perfil !== 'admin') {
    const btnAdd = document.querySelector('.btn-adicionar');
    const btnRem = document.getElementById('btnModoRemover');
    if (btnAdd) btnAdd.style.display = 'none';
    if (btnRem) btnRem.style.display = 'none';
    
    // Ocultar abas para instrutores
    const abasContainer = document.getElementById('abasContainer');
    if (abasContainer) abasContainer.style.display = 'none';
    
    // Forçar aba LABORATORIO para instrutores
    abaAtual = 'LABORATORIO';
  }
}

async function carregarDados() {
  const token = localStorage.getItem('gera_token');
  try {
    const [salasRes, alocRes, turmasRes] = await Promise.all([
      fetch(`${API_BASE}/salas`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_BASE}/alocacoes`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_BASE}/turmas`, { headers: { 'Authorization': `Bearer ${token}` } })
    ]);
    todasSalas = await salasRes.json();
    todasAlocacoes = await alocRes.json();
    todasTurmas = await turmasRes.json();
    
    const loadingMsg = document.getElementById('loadingMsg');
    if (loadingMsg) loadingMsg.style.display = 'none';
    
    renderizar();
  } catch (e) {
    console.error(e);
  }
}

function mudarAba(tipo) {
  abaAtual = tipo;
  document.querySelectorAll('.aba-btn').forEach(btn => {
    btn.classList.toggle('ativa', btn.textContent.includes(tipo === 'SALA' ? 'SALAS' : 'LABORATÓRIOS'));
  });
  fecharCalendarioEmbutido();
  renderizar();
}

function renderizar() {
  const usuario = usuarioAtual();
  const container = document.getElementById('listaSalas');
  if (!container) return;
  container.innerHTML = '';
  container.className = 'lista-grid' + (modoRemover ? ' modo-remover' : '');

  const filtroData = document.getElementById('filtroMapaData');
  if (filtroData && !filtroData.value) {
    filtroData.value = new Date().toISOString().split('T')[0];
  }
  
  const dataISO = filtroData ? filtroData.value : new Date().toISOString().split('T')[0];
  const statusFiltro = document.getElementById('filtroMapaStatus') ? document.getElementById('filtroMapaStatus').value : 'TODOS';

  // Instructors can only see laboratories, admins can see both
  let tipoFiltro = abaAtual;
  if (usuario.perfil === 'instrutor' && abaAtual === 'SALA') {
    tipoFiltro = 'LABORATORIO';
  }

  let salasFiltradas = todasSalas.filter(s => s.tipo === tipoFiltro && s.bloco !== 'ROBOTICA');

  salasFiltradas.forEach(sala => {
    // Verificar ocupação M, T, N para a data do filtro
    const alocData = todasAlocacoes.filter(a => 
        Number(a.id_sala) === Number(sala.id_sala) && 
        dataISO >= a.data_inicio.split('T')[0] && 
        dataISO <= a.data_fim.split('T')[0]
    );

    const ocupM = alocData.some(a => a.turno === 'Manhã');
    const ocupT = alocData.some(a => a.turno === 'Tarde');
    const ocupN = alocData.some(a => a.turno === 'Noite');
    
    const estaOcupada = ocupM || ocupT || ocupN;

    // Aplicar filtro de status (Mapa de Calor)
    if (statusFiltro === 'LIVRE' && estaOcupada) return;
    if (statusFiltro === 'OCUPADO' && !estaOcupada) return;

    const card = document.createElement('div');
    card.className = 'item-card';

    if (salaSelecionada && salaSelecionada.id_sala === sala.id_sala) {
        card.style.boxShadow = '0 0 0 3px #1a4a9f';
    }
    
    card.onclick = () => modoRemover ? removerSala(sala.id_sala) : selecionarSala(sala);

    // Usar as variáveis de ocupação já calculadas acima
    // ocupM, ocupT, ocupN já estão disponíveis

    card.innerHTML = `
      <div class="btn-remover-item"><i class="bi bi-dash"></i></div>
      <i class="bi bi-calendar-check" style="position: absolute; left: 10px; top: 10px; color: #1a4a9f; font-size: 1.1rem;"></i>
      <div class="sala-info" style="text-align: center; margin-top: 10px;">
        <div class="sala-nome" style="font-weight: bold; font-size: 1.1rem;">${sala.nome}</div>
        <div class="sala-bloco" style="font-size: 0.8rem; color: #666;">Bloco ${sala.bloco}</div>
        <div class="indicadores-turno">
          <div class="turno-box ${ocupM ? 'turno-ocupado-vermelho' : 'turno-livre'}" title="Manhã" onclick="event.stopPropagation(); abrirCalendarioComTurno(${sala.id_sala}, 'Manhã')">M</div>
          <div class="turno-box ${ocupT ? 'turno-ocupado-vermelho' : 'turno-livre'}" title="Tarde" onclick="event.stopPropagation(); abrirCalendarioComTurno(${sala.id_sala}, 'Tarde')">T</div>
          <div class="turno-box ${ocupN ? 'turno-ocupado-vermelho' : 'turno-livre'}" title="Noite" onclick="event.stopPropagation(); abrirCalendarioComTurno(${sala.id_sala}, 'Noite')">N</div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

async function selecionarSala(sala) {
  salaSelecionada = sala;
  renderizar();
  
  const container = document.getElementById('containerCalendarioEmbutido');
  const titulo = document.getElementById('tituloCalendarioEmbutido');
  titulo.textContent = `Calendário de Ocupação: ${sala.nome}`;
  
  const token = localStorage.getItem('gera_token');
  const [instRes, ocupRes] = await Promise.all([
    fetch(`${API_BASE}/instrutores`, { headers: { 'Authorization': `Bearer ${token}` } }),
    fetch(`${API_BASE}/alocacoes/ocupadas/${sala.id_sala}`, { headers: { 'Authorization': `Bearer ${token}` } })
  ]);

  const instrutores = await instRes.json();
  calendarioOcupadas = await ocupRes.json();

  preencherSelect('selInstrutor', instrutores, 'id_instrutor', 'nome');
  
  const usuario = usuarioAtual();
  const selInst = document.getElementById('selInstrutor');
  if (usuario.perfil === 'instrutor') {
    selInst.value = usuario.id_instrutor;
    selInst.disabled = true;
  } else {
    selInst.disabled = false;
  }

  document.getElementById('idSalaAlocacao').value = sala.id_sala;
  document.getElementById('dataInicio').value = '';
  document.getElementById('dataFim').value = '';
  document.getElementById('selTurno').value = ''; // Sem turno padrão
  document.getElementById('selTurma').value = '';
  document.getElementById('selTurma').disabled = true;
  
  calendarioMesAtual = new Date();
  calendarioMesAtual.setDate(1);
  
  // Listener para ajustar o mês do calendário quando a data de início mudar
  const dataInicioInput = document.getElementById('dataInicio');
  dataInicioInput.addEventListener('change', function() {
    if (this.value) {
      const dataSelecionada = new Date(this.value + 'T00:00:00');
      calendarioMesAtual = new Date(dataSelecionada);
      calendarioMesAtual.setDate(1);
      renderizarCalendarioOcupacao();
    }
  });
  
  // Listener para filtrar turmas quando turno mudar
  const selTurno = document.getElementById('selTurno');
  selTurno.addEventListener('change', function() {
    filtrarTurmasPorTurno(this.value);
    renderizarCalendarioOcupacao();
  });
  
  container.style.display = 'block';
  configurarCalendario();
  
  // Scroll suave até o calendário
  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function fecharCalendarioEmbutido() {
  salaSelecionada = null;
  document.getElementById('containerCalendarioEmbutido').style.display = 'none';
  renderizar();
}

function configurarCalendario() {
  const dataInicio = document.getElementById('dataInicio');
  const dataFim = document.getElementById('dataFim');
  const turno = document.getElementById('selTurno');

  const validar = () => {
    renderizarCalendarioOcupacao();
  };

  dataFim.onchange = validar;

  renderizarCalendarioOcupacao();
}

function mudarMesCalendario(delta) {
  calendarioMesAtual.setMonth(calendarioMesAtual.getMonth() + delta);
  calendarioMesAtual.setDate(1);
  renderizarCalendarioOcupacao();
}

function renderizarCalendarioOcupacao() {
  const calendario = document.getElementById('calendarioOcupacao');
  if (!calendario) return;
  
  const turno = document.getElementById('selTurno').value;
  const inicioSelecionado = document.getElementById('dataInicio').value;
  const fimSelecionado = document.getElementById('dataFim').value;

  calendario.innerHTML = '';

  const ano = calendarioMesAtual.getFullYear();
  const mes = calendarioMesAtual.getMonth();
  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);
  const nomeMes = primeiroDia.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const wrapper = document.createElement('div');
  wrapper.className = 'calendario-mensal';
  wrapper.innerHTML = `
    <div class="calendario-nav">
      <button type="button" onclick="mudarMesCalendario(-1)"><i class="bi bi-chevron-left"></i></button>
      <strong>${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)}</strong>
      <button type="button" onclick="mudarMesCalendario(1)"><i class="bi bi-chevron-right"></i></button>
    </div>
    <div class="calendario-semana">
      <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
    </div>
    <div class="calendario-grid" id="calendarioGridMensal"></div>
    <div class="calendario-legenda">
        <span class="legenda-ocupado"></span> Ocupado (${turno}) &nbsp; 
        <span class="legenda-selecionado"></span> Selecionado
    </div>
  `;
  calendario.appendChild(wrapper);

  const grid = document.getElementById('calendarioGridMensal');
  for (let i = 0; i < primeiroDia.getDay(); i++) {
    const vazio = document.createElement('div');
    vazio.className = 'calendario-dia vazio';
    grid.appendChild(vazio);
  }

  for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
    const data = new Date(ano, mes, dia);
    const valor = data.toISOString().split('T')[0];
    
    const ocupacao = calendarioOcupadas.find(o => 
        o.turno === turno && 
        valor >= o.data_inicio.split('T')[0] && 
        valor <= o.data_fim.split('T')[0]
    );
    
    const selecionado = inicioSelecionado && fimSelecionado && valor >= inicioSelecionado && valor <= fimSelecionado;
    
    const diaEl = document.createElement('button');
    diaEl.type = 'button';
    diaEl.className = 'calendario-dia';
    if (ocupacao) diaEl.classList.add('ocupado');
    if (selecionado) diaEl.classList.add('selecionado');
    
    if (ocupacao) {
      diaEl.innerHTML = `<span>${dia}</span><span class="instrutor-nome">${ocupacao.instrutor_nome}</span>`;
    } else {
      diaEl.innerHTML = `<span>${dia}</span>`;
    }
    diaEl.onclick = () => selecionarDiaCalendario(valor);
    grid.appendChild(diaEl);
  }
}

function selecionarDiaCalendario(valor) {
  const dataInicio = document.getElementById('dataInicio');
  const dataFim = document.getElementById('dataFim');

  if (!dataInicio.value || (dataInicio.value && dataFim.value)) {
    dataInicio.value = valor;
    dataFim.value = '';
  } else if (valor < dataInicio.value) {
    dataFim.value = dataInicio.value;
    dataInicio.value = valor;
  } else {
    dataFim.value = valor;
  }

  renderizarCalendarioOcupacao();
}

function filtrarTurmasPorTurno(turno) {
  const turmasDoTurno = todasTurmas.filter(t => t.turno === turno);
  preencherSelect('selTurma', turmasDoTurno, 'id_turma', 'nome');
  document.getElementById('selTurma').disabled = false;
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

  // Validate that dates are not in the past (considering shift)
  const validacao = validarDataRetroativaPorTurno(body.data_inicio, body.turno);
  if (!validacao.valido) {
    alert(validacao.mensagem);
    return;
  }

  const res = await fetch(`${API_BASE}/alocacoes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('gera_token')}` },
    body: JSON.stringify(body)
  });

  if (res.ok) {
    alert('Alocação realizada com sucesso!');
    fecharCalendarioEmbutido();
    carregarDados();
  } else {
    const err = await res.json();
    alert(err.erro || 'Erro ao salvar.');
  }
}

function toggleModoRemover() {
  modoRemover = !modoRemover;
  const btn = document.getElementById('btnModoRemover');
  btn.classList.toggle('ativo');
  btn.innerHTML = modoRemover ? '<i class="bi bi-check-lg"></i> Concluir' : '<i class="bi bi-trash"></i> Remover';
  renderizar();
}

async function removerSala(id) {
  if (!confirm('Remover esta sala permanentemente?')) return;
  const res = await fetch(`${API_BASE}/salas/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('gera_token')}` }
  });
  if (res.ok) carregarDados();
  else alert('Erro ao remover.');
}

function abrirModalAdicionar() {
  document.getElementById('modalAdicionar').style.display = 'flex';
}

function fecharModal(id) {
  document.getElementById(id).style.display = 'none';
}

async function adicionarSala() {
  const nome = document.getElementById('nomeSala').value;
  const bloco = document.getElementById('blocoSala').value;
  const tipo = document.getElementById('tipoSala').value;
  
  if (!nome) return alert('Nome é obrigatório.');

  const res = await fetch(`${API_BASE}/salas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('gera_token')}` },
    body: JSON.stringify({ nome, bloco, tipo })
  });

  if (res.ok) {
    fecharModal('modalAdicionar');
    carregarDados();
  } else {
    alert('Erro ao adicionar sala.');
  }
}


// Função para abrir o calendário com turno pré-selecionado ao clicar em M, T ou N
async function abrirCalendarioComTurno(idSala, turno) {
  const sala = todasSalas.find(s => s.id_sala === idSala);
  if (!sala) return;
  
  // Chamar selecionarSala para abrir o calendário
  await selecionarSala(sala);
  
  // Definir o turno selecionado
  const selTurno = document.getElementById('selTurno');
  if (selTurno) {
    selTurno.value = turno;
    filtrarTurmasPorTurno(turno);
    renderizarCalendarioOcupacao();
  }
}
