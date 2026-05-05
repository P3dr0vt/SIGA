import API from '../api.js';
import { openModal, confirmModal } from '../components/modal.js';

let _modoRemover = false;

export function render(container) {
  _modoRemover = false;
  _renderView(container);
}

function _renderView(container) {
  const instrutores = API.getInstrutores();

  container.innerHTML = `
    <div class="p-6 flex-1 overflow-y-auto">
      <div id="grid-instrutores" style="
        background:#D8D8D8;
        border-radius:12px;
        padding:24px;
        display:grid;
        grid-template-columns:repeat(3,1fr);
        gap:10px;
      "></div>
    </div>
    <div class="flex flex-col gap-3 justify-end p-4" style="min-width:160px;">
      <button id="btn-add-inst" style="
        display:flex;align-items:center;gap:8px;
        padding:10px 18px;border-radius:8px;
        background:${_modoRemover ? '#D8D8D8' : '#E8E8E8'};
        border:none;cursor:pointer;color:#666;font-size:0.9rem;font-weight:500;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        Adicionar
      </button>
      <button id="btn-rem-inst" style="
        display:flex;align-items:center;gap:8px;
        padding:10px 18px;border-radius:8px;
        background:${_modoRemover ? '#0D3566' : '#E8E8E8'};
        border:none;cursor:pointer;color:${_modoRemover ? 'white' : '#666'};font-size:0.9rem;font-weight:500;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        ${_modoRemover ? 'Concluir' : 'Remover'}
      </button>
    </div>
  `;

  _renderGrid(container, instrutores);
  _bindEventos(container);
}

function _renderGrid(container, instrutores) {
  const grid = container.querySelector('#grid-instrutores');
  const frag = document.createDocumentFragment();

  instrutores.forEach(inst => {
    const btn = document.createElement('button');
    btn.dataset.id = inst.id;
    btn.style.cssText = `
      display:flex;align-items:center;justify-content:${_modoRemover ? 'space-between' : 'center'};
      padding:12px 16px;border-radius:8px;
      background:#2574C2;border:none;cursor:pointer;
      color:white;font-weight:700;font-size:0.9rem;
      transition:background 0.15s;
    `;
    btn.innerHTML = `
      <span>${inst.nome}</span>
      ${_modoRemover ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="#E57373" style="flex-shrink:0"><circle cx="12" cy="12" r="10" fill="#E57373"/><line x1="8" y1="12" x2="16" y2="12" stroke="white" stroke-width="2.5"/></svg>` : ''}
    `;
    frag.appendChild(btn);
  });

  grid.innerHTML = '';
  grid.appendChild(frag);
}

function _bindEventos(container) {
  container.querySelector('#btn-add-inst').addEventListener('click', () => {
    openModal({
      titulo: null,
      campos: [{ name: 'nome', label: 'Nome', placeholder: 'Digite o nome', type: 'text' }],
      confirmLabel: 'CONCLUIR',
      onConfirm: ({ nome }) => {
        if (!nome) return false;
        API.addInstrutor(nome);
        _renderView(container);
      }
    });
  });

  container.querySelector('#btn-rem-inst').addEventListener('click', () => {
    _modoRemover = !_modoRemover;
    _renderView(container);
  });

  container.querySelector('#grid-instrutores').addEventListener('click', async e => {
    const btn = e.target.closest('button[data-id]');
    if (!btn || !_modoRemover) return;
    const nome = btn.querySelector('span').textContent;
    const ok = await confirmModal(`Remover instrutor(a) <strong>${nome}</strong>?`);
    if (ok) {
      API.removeInstrutor(btn.dataset.id);
      _renderView(container);
    }
  });
}
