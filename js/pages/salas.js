import API from '../api.js';
import { openModal, confirmModal, toast } from '../components/modal.js';

const TURNO_LABEL = { manha: 'MANHÃ', tarde: 'TARDE', noite: 'NOITE' };

let _modoRemoverRegular  = false;
let _modoRemoverRobotica = false;

export function render(container) {
  _modoRemoverRegular  = false;
  _modoRemoverRobotica = false;
  _renderView(container);
}

/* ── View principal ─────────────────────────────────────────────── */
function _renderView(container) {
  const salas     = API.getSalas();
  const regulares = salas.filter(s => s.categoria !== 'robotica');
  const robotica  = salas.filter(s => s.categoria === 'robotica');

  container.innerHTML = `
    <div style="flex:1;overflow-y:auto;padding:24px 24px 32px;">

      <!-- SEÇÃO: SALAS REGULARES -->
      <div style="margin-bottom:32px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <span style="font-size:0.72rem;font-weight:800;letter-spacing:0.12em;color:#555;text-transform:uppercase;">Salas Regulares</span>
          <div style="display:flex;gap:8px;">
            <button id="btn-add-regular" style="
              display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:7px;
              background:#E8E8E8;border:none;cursor:pointer;color:#555;font-size:0.8rem;font-weight:600;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              Adicionar
            </button>
            <button id="btn-rem-regular" style="
              display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:7px;
              background:${_modoRemoverRegular ? '#0D3566' : '#E8E8E8'};border:none;cursor:pointer;
              color:${_modoRemoverRegular ? 'white' : '#555'};font-size:0.8rem;font-weight:600;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              ${_modoRemoverRegular ? 'Concluir' : 'Remover'}
            </button>
          </div>
        </div>
        <div id="grid-regular" style="
          background:#D8D8D8;border-radius:12px;padding:20px;
          display:grid;grid-template-columns:repeat(4,1fr);gap:10px;
          min-height:80px;
        "></div>
      </div>

      <!-- DIVISOR -->
      <div style="border-top:2px solid #D0D0D0;margin-bottom:32px;"></div>

      <!-- SEÇÃO: ROBÓTICA -->
      <div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:0.72rem;font-weight:800;letter-spacing:0.12em;color:#555;text-transform:uppercase;">Robótica</span>
            <span style="background:#1E6BB8;color:white;font-size:0.62rem;font-weight:700;padding:2px 8px;border-radius:10px;letter-spacing:0.06em;">UNIDADE</span>
          </div>
          <div style="display:flex;gap:8px;">
            <button id="btn-add-robotica" style="
              display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:7px;
              background:#E8E8E8;border:none;cursor:pointer;color:#555;font-size:0.8rem;font-weight:600;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              Adicionar
            </button>
            <button id="btn-rem-robotica" style="
              display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:7px;
              background:${_modoRemoverRobotica ? '#0D3566' : '#E8E8E8'};border:none;cursor:pointer;
              color:${_modoRemoverRobotica ? 'white' : '#555'};font-size:0.8rem;font-weight:600;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              ${_modoRemoverRobotica ? 'Concluir' : 'Remover'}
            </button>
          </div>
        </div>
        <div id="grid-robotica" style="
          background:#1D2F4A;border-radius:12px;padding:20px;
          display:grid;grid-template-columns:repeat(4,1fr);gap:10px;
          min-height:80px;
        "></div>
      </div>

    </div>
  `;

  _renderGrid(container, '#grid-regular',  regulares, false, _modoRemoverRegular);
  _renderGrid(container, '#grid-robotica', robotica,  true,  _modoRemoverRobotica);
  _bindEventos(container);
}

/* ── Grid de botões ──────────────────────────────────────────────── */
function _renderGrid(container, gridSelector, salas, isRobotica, modoRemover) {
  const grid = container.querySelector(gridSelector);
  const frag = document.createDocumentFragment();

  if (salas.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = `
      grid-column:1/-1;text-align:center;padding:20px;
      color:${isRobotica ? 'rgba(255,255,255,0.35)' : '#aaa'};font-size:0.82rem;
    `;
    empty.textContent = 'Nenhuma sala cadastrada.';
    frag.appendChild(empty);
    grid.appendChild(frag);
    return;
  }

  salas.forEach(sala => {
    const btn = document.createElement('button');
    btn.dataset.id = sala.id;
    btn.dataset.categoria = sala.categoria;

    const corBase  = isRobotica ? '#1E6BB8' : '#2574C2';
    const corHover = isRobotica ? '#1a5fa0' : '#1f63a8';

    if (!modoRemover) {
      const status  = API.getStatusSala(sala.id);
      const chips   = ['manha', 'tarde', 'noite'].map(t => {
        const livre = !status[t];
        return `<span style="
          font-size:0.62rem;font-weight:700;padding:1px 5px;border-radius:4px;
          background:${livre ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.2)'};
          color:${livre ? '#86EFAC' : 'rgba(255,255,255,0.75)'};
        ">${t[0].toUpperCase()}</span>`;
      }).join('');

      btn.style.cssText = `
        display:flex;flex-direction:column;align-items:flex-start;gap:6px;
        padding:12px 14px;border-radius:8px;
        background:${corBase};border:none;cursor:pointer;color:white;
        font-weight:700;font-size:0.85rem;
        transition:background 0.15s;width:100%;
      `;
      btn.innerHTML = `
        <div style="display:flex;align-items:center;gap:6px;width:100%;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" style="opacity:0.75;flex-shrink:0;">
            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>
          </svg>
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${sala.nome}</span>
        </div>
        <div style="display:flex;gap:4px;">${chips}</div>
      `;
      btn.addEventListener('mouseenter', () => { btn.style.background = corHover; });
      btn.addEventListener('mouseleave', () => { btn.style.background = corBase; });
    } else {
      btn.style.cssText = `
        display:flex;align-items:center;justify-content:space-between;
        padding:12px 14px;border-radius:8px;
        background:${corBase};border:none;cursor:pointer;color:white;
        font-weight:700;font-size:0.85rem;
        transition:background 0.15s;width:100%;
      `;
      btn.innerHTML = `
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">${sala.nome}</span>
        <svg width="20" height="20" viewBox="0 0 24 24" style="flex-shrink:0;margin-left:6px;">
          <circle cx="12" cy="12" r="10" fill="#E57373"/>
          <line x1="8" y1="12" x2="16" y2="12" stroke="white" stroke-width="2.5"/>
        </svg>
      `;
    }

    frag.appendChild(btn);
  });

  grid.innerHTML = '';
  grid.appendChild(frag);
}

/* ── Bind de eventos ─────────────────────────────────────────────── */
function _bindEventos(container) {

  // Adicionar Regular
  container.querySelector('#btn-add-regular').addEventListener('click', () => {
    openModal({
      campos: [{ name: 'nome', label: 'Nome da Sala', placeholder: 'Ex: Sala A1' }],
      confirmLabel: 'CONCLUIR',
      onConfirm: ({ nome }) => {
        if (!nome) return false;
        API.addSala(nome.trim(), 'regular');
        toast(`Sala "${nome}" adicionada.`, 'success');
        _renderView(container);
      }
    });
  });

  // Remover Regular toggle
  container.querySelector('#btn-rem-regular').addEventListener('click', () => {
    _modoRemoverRegular = !_modoRemoverRegular;
    _renderView(container);
  });

  // Adicionar Robótica
  container.querySelector('#btn-add-robotica').addEventListener('click', () => {
    openModal({
      campos: [{ name: 'nome', label: 'Nome da Sala (Robótica)', placeholder: 'Ex: Lab Robótica 1' }],
      confirmLabel: 'CONCLUIR',
      onConfirm: ({ nome }) => {
        if (!nome) return false;
        API.addSala(nome.trim(), 'robotica');
        toast(`Sala "${nome}" adicionada em Robótica.`, 'success');
        _renderView(container);
      }
    });
  });

  // Remover Robótica toggle
  container.querySelector('#btn-rem-robotica').addEventListener('click', () => {
    _modoRemoverRobotica = !_modoRemoverRobotica;
    _renderView(container);
  });

  // Clique nos grids (delegação)
  _bindGrid(container, '#grid-regular',  _modoRemoverRegular);
  _bindGrid(container, '#grid-robotica', _modoRemoverRobotica);
}

function _bindGrid(container, gridSelector, modoRemover) {
  container.querySelector(gridSelector).addEventListener('click', async e => {
    const btn = e.target.closest('button[data-id]');
    if (!btn) return;

    const salaId    = btn.dataset.id;
    const salaNome  = btn.querySelector('span').textContent.trim();

    if (modoRemover) {
      const ok = await confirmModal(`Remover sala <strong>${salaNome}</strong> e todas as suas alocações?`);
      if (ok) {
        API.removeSala(salaId);
        toast(`Sala "${salaNome}" removida.`, 'warning');
        _renderView(container);
      }
      return;
    }

    _abrirModalOcupacao(salaId, salaNome, container);
  });
}

/* ── Modal de Ocupação ───────────────────────────────────────────── */
function _abrirModalOcupacao(salaId, salaNome, container) {
  const status       = API.getStatusSala(salaId);
  const turnosLivres = ['manha', 'tarde', 'noite'].filter(t => !status[t]);
  const instrutores  = API.getInstrutores();
  const turmas       = API.getTurmas();

  // Cards de status por turno
  const cardsHTML = ['manha', 'tarde', 'noite'].map(turno => {
    const s     = status[turno];
    const livre = !s;
    return `
      <div style="
        background:${livre ? 'rgba(22,163,74,0.15)' : 'rgba(13,53,102,0.55)'};
        border:2px solid ${livre ? '#22C55E' : 'rgba(255,255,255,0.12)'};
        border-radius:8px;padding:10px 12px;
      ">
        <div style="color:rgba(255,255,255,0.6);font-size:0.64rem;font-weight:800;letter-spacing:0.1em;margin-bottom:5px;">${TURNO_LABEL[turno]}</div>
        ${livre
          ? `<div style="color:#86EFAC;font-size:0.82rem;font-weight:700;display:flex;align-items:center;gap:4px;">
               <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="#22C55E"/></svg>LIVRE
             </div>`
          : `<div style="color:white;font-size:0.78rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${s.instrutor}">${s.instrutor}</div>
             <div style="color:rgba(255,255,255,0.5);font-size:0.69rem;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${s.turma}">${s.turma}</div>`
        }
      </div>`;
  }).join('');

  const secaoAlocar = turnosLivres.length > 0
    ? `<div style="border-top:1px solid rgba(255,255,255,0.18);padding-top:14px;margin-top:4px;margin-bottom:0;">
         <div style="color:rgba(255,255,255,0.7);font-size:0.68rem;font-weight:800;text-transform:uppercase;letter-spacing:0.09em;margin-bottom:12px;">Adicionar Alocação</div>
       </div>`
    : `<div style="background:rgba(0,0,0,0.2);border-radius:8px;padding:12px 14px;text-align:center;color:rgba(255,255,255,0.75);font-size:0.83rem;line-height:1.5;margin-top:4px;">
         Todos os turnos estão ocupados.<br>Use <strong style="color:white;">×</strong> na tabela para desalocar.
       </div>`;

  const preContent = `
    <div style="margin-bottom:18px;">
      <div style="color:rgba(255,255,255,0.65);font-size:0.67rem;font-weight:800;text-transform:uppercase;letter-spacing:0.09em;margin-bottom:8px;">Status dos Turnos</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">${cardsHTML}</div>
    </div>
    ${secaoAlocar}
  `;

  if (turnosLivres.length === 0) {
    openModal({ titulo: salaNome, preContent, campos: [], confirmLabel: 'FECHAR', onConfirm: () => true });
    return;
  }

  openModal({
    titulo: salaNome,
    preContent,
    campos: [
      {
        type: 'select', name: 'instrutorId', label: 'INSTRUTOR(A)',
        opcoes: instrutores.map(i => ({ value: i.id, label: i.nome }))
      },
      {
        type: 'select', name: 'turno', label: 'TURNO',
        opcoes: ['manha', 'tarde', 'noite'].map(t => ({
          value:    t,
          label:    status[t]
            ? `${TURNO_LABEL[t]} — ocupado (${status[t].instrutor})`
            : `${TURNO_LABEL[t]} — LIVRE`,
          disabled: !!status[t]
        }))
      },
      {
        type: 'select', name: 'turmaId', label: 'TURMA',
        opcoes: turmas.map(t => ({ value: t.id, label: t.nome }))
      }
    ],
    confirmLabel: 'CONFIRMAR ALOCAÇÃO',
    onConfirm: ({ instrutorId, turno, turmaId }) => {
      if (!instrutorId || !turno || !turmaId) {
        toast('Preencha todos os campos antes de confirmar.', 'warning');
        return false;
      }
      if (status[turno]) {
        toast('Este turno já está ocupado. Escolha um turno livre.', 'error');
        return false;
      }
      API.editarAlocacaoSala(salaId, instrutorId, turno, turmaId);
      toast(`${salaNome} alocada no turno ${TURNO_LABEL[turno]}.`, 'success');
      _renderView(container);
    }
  });
}
