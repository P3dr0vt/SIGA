import API from './api.js';
import Auth from './auth.js';
import { render as renderInstrutores } from './pages/instrutores.js';
import { render as renderSalas }      from './pages/salas.js';
import { render as renderTurmas }     from './pages/turmas.js';
import { openModal, closeModal, toast } from './components/modal.js';

Auth.exigirAuth();

const TURNOS = ['manha', 'tarde', 'noite'];
const TURNO_LABEL = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' };
const BLOCOS_ORDEM = ['A', 'B', 'C'];

let _turnoAtivo = 'manha';
let _viewAtiva  = 'main';
let _sidebarAberta = false;

const $ = id => document.getElementById(id);

/* ─── Bootstrap ────────────────────────────────────────────── */
async function init() {
  await API.init();
  _bindHeader();
  _bindSidebar();
  _bindTeclado();
  _setView('main');
}

/* ─── Header & turno buttons ────────────────────────────────── */
function _bindHeader() {
  // Botões de turno no sub-header
  document.querySelectorAll('.btn-turno').forEach(btn => {
    btn.addEventListener('click', () => {
      _turnoAtivo = btn.dataset.turno;
      _atualizarBotoesTurno();
      _renderBlocos();
    });
  });

  // TODOS
  $('btn-todos').addEventListener('click', () => {
    const todos = _turnoAtivo === 'todos';
    _turnoAtivo = todos ? 'manha' : 'todos';
    if (_turnoAtivo !== 'todos') {
      document.querySelector(`.btn-turno[data-turno="manha"]`).click();
    }
    _atualizarBotoesTurno();
    _renderBlocos();
  });

  // Abre TV em nova aba
  $('btn-abre-tv').addEventListener('click', () => window.open('tv.html', '_blank'));

  // Visão geral de status das salas
  $('btn-status').addEventListener('click', _abrirStatusGeral);

  // Logo volta para main
  $('logo-link').addEventListener('click', () => _setView('main'));

  // Logout
  $('btn-logout').addEventListener('click', () => Auth.logout());
}

function _atualizarBotoesTurno() {
  document.querySelectorAll('.btn-turno').forEach(btn => {
    btn.classList.toggle('ativo', btn.dataset.turno === _turnoAtivo);
  });

  const btnTodos = $('btn-todos');
  if (_turnoAtivo === 'todos') {
    btnTodos.style.background = 'white';
    btnTodos.style.color = '#0D3566';
    btnTodos.style.borderColor = 'white';
  } else {
    btnTodos.style.background = 'transparent';
    btnTodos.style.color = 'rgba(255,255,255,0.7)';
    btnTodos.style.borderColor = 'rgba(255,255,255,0.45)';
  }
}

/* ─── Sidebar ───────────────────────────────────────────────── */
function _bindSidebar() {
  $('btn-menu').addEventListener('click', _toggleSidebar);

  const nav = $('sidebar-nav');
  const itens = [
    { view: 'instrutores', label: 'INSTRUTORES', icone: _iconeInstrutores() },
    { view: 'salas',       label: 'SALAS',       icone: _iconeSalas()       },
    { view: 'turmas',      label: 'TURMAS',      icone: _iconeTurmas()      },
    { view: 'robotica',    label: 'ROBÓTICA',    icone: _iconeRobotica()    },
  ];

  nav.innerHTML = itens.map(item => `
    <button data-view="${item.view}" style="
      display:flex;align-items:center;gap:12px;
      padding:13px 16px;border-radius:8px;
      background:#2574C2;border:none;cursor:pointer;
      color:white;font-weight:800;font-size:0.88rem;letter-spacing:0.05em;text-align:left;
      width:100%;transition:background 0.15s;
    ">
      ${item.icone}
      <span>${item.label}</span>
    </button>`).join('');

  nav.querySelectorAll('button[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      _setView(btn.dataset.view);
      _fecharSidebar();
    });
  });
}

function _toggleSidebar() {
  _sidebarAberta ? _fecharSidebar() : _abrirSidebar();
}

function _abrirSidebar() {
  $('app-sidebar').style.transform = 'translateX(0)';
  _sidebarAberta = true;
  setTimeout(() => document.addEventListener('click', _clickFora), 10);
}

function _fecharSidebar() {
  $('app-sidebar').style.transform = 'translateX(100%)';
  _sidebarAberta = false;
  document.removeEventListener('click', _clickFora);
}

function _clickFora(e) {
  if (!$('app-sidebar').contains(e.target) && !$('btn-menu').contains(e.target)) {
    _fecharSidebar();
  }
}

/* ─── Navegação de Views ────────────────────────────────────── */
function _setView(view) {
  _viewAtiva = view;
  _fecharSidebar();

  const isMain = view === 'main';
  $('app-main').style.display    = isMain ? '' : 'none';
  $('app-content').style.display = isMain ? 'none' : 'flex';
  $('subheader-turno').style.display = isMain ? '' : 'none';

  _atualizarHeaderCenter();

  if (isMain) {
    _renderBlocos();
    return;
  }

  const content = $('app-content');
  content.innerHTML = '';
  content.style.flexDirection = 'row';
  content.style.overflow = 'hidden';

  if (view === 'instrutores') renderInstrutores(content);
  else if (view === 'salas')   renderSalas(content);
  else if (view === 'turmas')  renderTurmas(content);
  else if (view === 'robotica') _renderRobotica(content);
}

function _atualizarHeaderCenter() {
  const center = $('header-center');

  if (_viewAtiva === 'main') {
    center.innerHTML = '';
    return;
  }

  const config = {
    instrutores: { label: 'INSTRUTORES', icone: _iconeInstrutores() },
    salas:       { label: 'SALAS',       icone: _iconeSalas()       },
    turmas:      { label: 'TURMAS',      icone: _iconeTurmas()      },
    robotica:    { label: 'ROBÓTICA',    icone: _iconeRobotica()    },
  }[_viewAtiva] || {};

  center.innerHTML = `
    <button id="btn-voltar" style="
      background:white;border:none;border-radius:50%;
      width:34px;height:34px;cursor:pointer;
      display:flex;align-items:center;justify-content:center;flex-shrink:0;
    ">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0D3566" stroke-width="3">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>
    <div style="
      display:flex;align-items:center;gap:10px;
      background:#2574C2;border-radius:8px;padding:8px 18px;
    ">
      ${config.icone || ''}
      <span style="color:white;font-weight:800;font-size:0.92rem;letter-spacing:0.05em;">${config.label}</span>
    </div>`;

  center.querySelector('#btn-voltar').addEventListener('click', () => _setView('main'));
}

/* ─── Renderização dos Blocos ───────────────────────────────── */
function _renderBlocos() {
  const container = $('blocos-container');
  const alocsPorBloco = API.getAlocacoesPorBloco(_turnoAtivo);
  const frag = document.createDocumentFragment();

  BLOCOS_ORDEM.forEach(bloco => {
    const alocs = alocsPorBloco[bloco] || [];
    const section = document.createElement('div');
    section.style.marginBottom = '18px';

    // Header do bloco
    const bHeader = document.createElement('div');
    bHeader.style.cssText = 'background:#0D3566;border-radius:8px 8px 0 0;padding:9px 18px;';
    bHeader.innerHTML = `<span style="color:white;font-weight:800;font-size:0.88rem;letter-spacing:0.1em;">BLOCO ${bloco}</span>`;
    section.appendChild(bHeader);

    // Corpo — duas colunas lado a lado
    const corpo = document.createElement('div');
    corpo.style.cssText = 'background:white;border-radius:0 0 8px 8px;overflow:hidden;display:grid;grid-template-columns:1fr 1fr;';

    const metade = Math.ceil(alocs.length / 2);
    [alocs.slice(0, metade), alocs.slice(metade)].forEach(grupo => {
      corpo.appendChild(_criarSubTabela(grupo));
    });

    section.appendChild(corpo);
    frag.appendChild(section);
  });

  container.innerHTML = '';
  container.appendChild(frag);
}

function _criarSubTabela(alocs) {
  const wrap = document.createElement('div');

  // Cabeçalho: 3 colunas de dados + 1 coluna de ação (28px)
  const thead = document.createElement('div');
  thead.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr 28px;';
  [['INSTRUTOR (A)', 0], ['SALA', 1], ['TURMA', 2]].forEach(([label, i]) => {
    const th = document.createElement('div');
    th.style.cssText = `
      display:flex;align-items:center;gap:6px;
      background:#1E6BB8;padding:9px 12px;
      color:white;font-weight:700;font-size:0.77rem;letter-spacing:0.03em;
    `;
    th.innerHTML = `${_iconeColuna(i)}<span>${label}</span>`;
    thead.appendChild(th);
  });
  // Célula vazia no header da coluna de ação
  const thAcao = document.createElement('div');
  thAcao.style.cssText = 'background:#1E6BB8;';
  thead.appendChild(thAcao);
  wrap.appendChild(thead);

  // Linhas
  const tbody = document.createElement('div');
  if (alocs.length === 0) {
    const vazio = document.createElement('div');
    vazio.style.cssText = 'padding:14px 12px;color:#aaa;font-size:0.78rem;font-style:italic;background:#FAFAFA;';
    vazio.textContent = 'Sem alocações neste turno';
    tbody.appendChild(vazio);
  } else {
    alocs.forEach(aloc => {
      const row = document.createElement('div');
      row.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr 28px;border-top:1px solid #E8E8E8;';

      [aloc.instrutor.nome, aloc.sala.nome, aloc.turma.nome].forEach(val => {
        const cell = document.createElement('div');
        cell.style.cssText = 'padding:9px 12px;background:#EFEFEF;color:#3A3A3A;font-size:0.8rem;border-right:1px solid #E2E2E2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        cell.textContent = val;
        row.appendChild(cell);
      });

      // Botão × de desalocar
      const btnDel = document.createElement('button');
      btnDel.title = `Desalocar ${aloc.instrutor.nome} (${aloc.sala.nome} - ${TURNO_LABEL[aloc.turno] || aloc.turno})`;
      btnDel.style.cssText = `
        display:flex;align-items:center;justify-content:center;
        background:#EFEFEF;border:none;border-left:1px solid #E2E2E2;
        cursor:pointer;padding:0;color:#E53E3E;font-size:14px;font-weight:700;
        transition:background 0.15s;
      `;
      btnDel.innerHTML = `<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="#E53E3E" stroke-width="2.5" stroke-linecap="round"><line x1="2" y1="2" x2="12" y2="12"/><line x1="12" y1="2" x2="2" y2="12"/></svg>`;

      btnDel.addEventListener('mouseenter', () => btnDel.style.background = '#FEE2E2');
      btnDel.addEventListener('mouseleave', () => btnDel.style.background = '#EFEFEF');

      btnDel.addEventListener('click', () => {
        const removido = API.removeAlocacao(aloc.id);
        if (removido) {
          toast(
            `Desalocado: ${aloc.instrutor.nome} — ${aloc.sala.nome} (${TURNO_LABEL[aloc.turno] || aloc.turno}). Atualize o dados.json para persistir.`,
            'warning'
          );
          _renderBlocos();
        }
      });

      row.appendChild(btnDel);
      tbody.appendChild(row);
    });
  }
  wrap.appendChild(tbody);
  return wrap;
}

/* ─── View Robótica ─────────────────────────────────────────── */
function _renderRobotica(container) {
  const alocsPorTurno = API.getAlocacoesRobotica();
  const turnoLabels   = { manha: 'MANHÃ', tarde: 'TARDE', noite: 'NOITE' };

  container.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.style.cssText = 'padding:24px;flex:1;overflow-y:auto;';

  TURNOS.forEach(turno => {
    const alocs = alocsPorTurno[turno] || [];

    const section = document.createElement('div');
    section.style.cssText = 'margin-bottom:20px;max-width:680px;';

    // Header do turno
    const bHeader = document.createElement('div');
    bHeader.style.cssText = 'background:#0D3566;border-radius:8px 8px 0 0;padding:9px 18px;';
    bHeader.innerHTML = `<span style="color:white;font-weight:800;font-size:0.88rem;letter-spacing:0.1em;">${turnoLabels[turno]}</span>`;
    section.appendChild(bHeader);

    // Corpo
    const corpo = document.createElement('div');
    corpo.style.cssText = 'background:white;border-radius:0 0 8px 8px;overflow:hidden;';

    // Cabeçalho das colunas: 3 colunas + coluna de ação (28px)
    const thead = document.createElement('div');
    thead.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr 28px;';
    [['INSTRUTOR (A)', 0], ['SALA', 1], ['TURMA', 2]].forEach(([label, i]) => {
      const th = document.createElement('div');
      th.style.cssText = 'display:flex;align-items:center;gap:6px;background:#1E6BB8;padding:9px 12px;color:white;font-weight:700;font-size:0.77rem;';
      th.innerHTML = `${_iconeColuna(i)}<span>${label}</span>`;
      thead.appendChild(th);
    });
    const thAcao = document.createElement('div');
    thAcao.style.cssText = 'background:#1E6BB8;';
    thead.appendChild(thAcao);
    corpo.appendChild(thead);

    // Linhas
    if (alocs.length === 0) {
      const vazio = document.createElement('div');
      vazio.style.cssText = 'padding:14px;color:#aaa;font-size:0.8rem;font-style:italic;background:#FAFAFA;';
      vazio.textContent = 'Nenhum instrutor no Lab. Robótica neste turno.';
      corpo.appendChild(vazio);
    } else {
      alocs.forEach(aloc => {
        const row = document.createElement('div');
        row.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr 28px;border-top:1px solid #E8E8E8;';

        [aloc.instrutor.nome, aloc.sala.nome, aloc.turma.nome].forEach(val => {
          const cell = document.createElement('div');
          cell.style.cssText = 'padding:9px 12px;background:#EFEFEF;color:#3A3A3A;font-size:0.8rem;border-right:1px solid #E2E2E2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
          cell.textContent = val;
          row.appendChild(cell);
        });

        // Botão × de desalocar
        const btnDel = document.createElement('button');
        btnDel.title = `Desalocar ${aloc.instrutor.nome} (${aloc.sala.nome} — ${turnoLabels[turno]})`;
        btnDel.style.cssText = `
          display:flex;align-items:center;justify-content:center;
          background:#EFEFEF;border:none;border-left:1px solid #E2E2E2;
          cursor:pointer;padding:0;color:#E53E3E;font-size:14px;font-weight:700;
          transition:background 0.15s;
        `;
        btnDel.innerHTML = `<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="#E53E3E" stroke-width="2.5" stroke-linecap="round"><line x1="2" y1="2" x2="12" y2="12"/><line x1="12" y1="2" x2="2" y2="12"/></svg>`;

        btnDel.addEventListener('mouseenter', () => btnDel.style.background = '#FEE2E2');
        btnDel.addEventListener('mouseleave', () => btnDel.style.background = '#EFEFEF');

        btnDel.addEventListener('click', () => {
          const removido = API.removeAlocacao(aloc.id);
          if (removido) {
            toast(
              `Desalocado: ${aloc.instrutor.nome} — ${aloc.sala.nome} (${turnoLabels[turno]}). Atualize o dados.json para persistir.`,
              'warning'
            );
            _renderRobotica(container);
          }
        });

        row.appendChild(btnDel);
        corpo.appendChild(row);
      });
    }

    section.appendChild(corpo);
    wrap.appendChild(section);
  });

  container.appendChild(wrap);
}

/* ─── Teclado ───────────────────────────────────────────────── */
function _bindTeclado() {
  document.addEventListener('keydown', e => {
    if (_viewAtiva !== 'main') return;
    if (e.key === 'ArrowRight') _nextTurno(1);
    if (e.key === 'ArrowLeft')  _nextTurno(-1);
  });
}

function _nextTurno(dir) {
  const idx = TURNOS.indexOf(_turnoAtivo);
  _turnoAtivo = TURNOS[((idx === -1 ? 0 : idx) + dir + TURNOS.length) % TURNOS.length];
  _atualizarBotoesTurno();
  _renderBlocos();
}

/* ─── Visão Geral: Status das Salas ────────────────────────── */
function _abrirStatusGeral() {
  const dados = API.getStatusGeralSalas();
  const TURNOS_LABEL = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' };

  // Monta a tabela de status
  const linhasHTML = dados.map(({ sala, status }) => {
    const celulas = ['manha', 'tarde', 'noite'].map(turno => {
      const s     = status[turno];
      const livre = !s;
      return `
        <td style="
          padding:8px 12px;font-size:0.78rem;
          border-right:1px solid #E5E5E5;border-bottom:1px solid #E5E5E5;
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px;
          background:${livre ? '#F0FDF4' : '#FFFFFF'};
          color:${livre ? '#16A34A' : '#333'};
        " title="${livre ? 'LIVRE' : s.instrutor + ' / ' + s.turma}">
          ${livre
            ? `<span style="font-weight:700;display:flex;align-items:center;gap:4px;">
                 <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="#22C55E"/></svg>LIVRE
               </span>`
            : `<div style="font-weight:600;">${s.instrutor}</div>
               <div style="color:#888;font-size:0.71rem;margin-top:1px;">${s.turma}</div>`
          }
        </td>`;
    }).join('');

    return `
      <tr>
        <td style="padding:8px 12px;font-size:0.8rem;font-weight:700;color:#1E6BB8;background:#F8FAFF;border-right:2px solid #D0DFF5;border-bottom:1px solid #E5E5E5;white-space:nowrap;">
          ${sala.nome}
          <span style="font-size:0.65rem;font-weight:600;color:#94A3B8;margin-left:4px;">${sala.bloco}</span>
        </td>
        ${celulas}
      </tr>`;
  }).join('');

  // Conta estatísticas
  const totalSlots   = dados.length * 3;
  const totalOcupado = dados.reduce((acc, { status }) =>
    acc + ['manha','tarde','noite'].filter(t => status[t]).length, 0);
  const totalLivre   = totalSlots - totalOcupado;

  const preContent = `
    <div style="margin-bottom:16px;display:flex;gap:10px;flex-wrap:wrap;">
      <div style="flex:1;min-width:100px;background:rgba(0,0,0,0.2);border-radius:8px;padding:10px 14px;text-align:center;">
        <div style="color:white;font-weight:900;font-size:1.4rem;">${dados.length}</div>
        <div style="color:rgba(255,255,255,0.6);font-size:0.7rem;font-weight:600;">SALAS</div>
      </div>
      <div style="flex:1;min-width:100px;background:rgba(22,163,74,0.2);border:1px solid rgba(34,197,94,0.3);border-radius:8px;padding:10px 14px;text-align:center;">
        <div style="color:#86EFAC;font-weight:900;font-size:1.4rem;">${totalLivre}</div>
        <div style="color:rgba(255,255,255,0.6);font-size:0.7rem;font-weight:600;">LIVRES</div>
      </div>
      <div style="flex:1;min-width:100px;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:10px 14px;text-align:center;">
        <div style="color:#FCA5A5;font-weight:900;font-size:1.4rem;">${totalOcupado}</div>
        <div style="color:rgba(255,255,255,0.6);font-size:0.7rem;font-weight:600;">OCUPADOS</div>
      </div>
    </div>

    <div style="border-radius:8px;overflow:hidden;max-height:340px;overflow-y:auto;margin-bottom:4px;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="position:sticky;top:0;z-index:1;">
            <th style="padding:9px 12px;background:#0D3566;color:white;font-size:0.72rem;font-weight:800;text-align:left;letter-spacing:0.06em;white-space:nowrap;">SALA</th>
            ${['manha','tarde','noite'].map(t =>
              `<th style="padding:9px 12px;background:#1E6BB8;color:white;font-size:0.72rem;font-weight:800;text-align:left;letter-spacing:0.06em;">${TURNOS_LABEL[t].toUpperCase()}</th>`
            ).join('')}
          </tr>
        </thead>
        <tbody>${linhasHTML}</tbody>
      </table>
    </div>
  `;

  openModal({
    titulo: 'Status das Salas',
    preContent,
    campos: [],
    confirmLabel: 'FECHAR',
    wide: true,
    onConfirm: () => true
  });
}

/* ─── Ícones SVG ────────────────────────────────────────────── */
function _iconeInstrutores() {
  return `<svg width="17" height="17" viewBox="0 0 24 24" fill="white"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
}
function _iconeSalas() {
  return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>`;
}
function _iconeTurmas() {
  return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`;
}
function _iconeRobotica() {
  return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M9 11V7a3 3 0 0 1 6 0v4"/><circle cx="9" cy="16" r="1" fill="white"/><circle cx="15" cy="16" r="1" fill="white"/></svg>`;
}
function _iconeColuna(i) {
  return [
    `<svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`,
    `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>`,
    `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/></svg>`
  ][i] || '';
}

init();
