import API from '../api.js';
import { openModal, confirmModal } from '../components/modal.js';

let _modoRemover = false;
let _termoBusca = '';

export function render(container) {
  _modoRemover = false;
  _termoBusca = '';
  _renderView(container);
}

function _renderView(container) {
  const todas = API.getTurmas();
  const turmas = _termoBusca
    ? todas.filter(t => t.nome.toLowerCase().includes(_termoBusca.toLowerCase()))
    : todas;

  container.innerHTML = `
    <div class="p-6 flex-1 overflow-y-auto">
      <div id="grid-turmas" style="
        background:#D8D8D8;border-radius:12px;padding:24px;
        display:grid;grid-template-columns:repeat(4,1fr);gap:10px;
      "></div>
    </div>
    <div class="flex flex-col gap-3 justify-end p-4" style="min-width:160px;">
      <div style="position:relative;">
        <label style="position:absolute;top:-8px;left:10px;background:#f8f8f8;padding:0 4px;font-size:0.68rem;color:#888;">Pesquisar</label>
        <input id="input-busca-turma" type="text" placeholder="Nome da turma..."
          value="${_termoBusca}"
          style="width:100%;padding:9px 12px;border:1.5px solid #ccc;border-radius:8px;font-size:0.85rem;outline:none;background:white;box-sizing:border-box;color:#333;" />
      </div>
      <button id="btn-add-turma" style="
        display:flex;align-items:center;gap:8px;padding:10px 18px;border-radius:8px;
        background:#E8E8E8;border:none;cursor:pointer;color:#666;font-size:0.9rem;font-weight:500;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        Adicionar
      </button>
      <button id="btn-rem-turma" style="
        display:flex;align-items:center;gap:8px;padding:10px 18px;border-radius:8px;
        background:${_modoRemover ? '#0D3566' : '#E8E8E8'};border:none;cursor:pointer;
        color:${_modoRemover ? 'white' : '#666'};font-size:0.9rem;font-weight:500;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        ${_modoRemover ? 'Concluir' : 'Remover'}
      </button>
    </div>
  `;

  _renderGrid(container, turmas);
  _bindEventos(container);
}

function _renderGrid(container, turmas) {
  const grid = container.querySelector('#grid-turmas');
  const frag = document.createDocumentFragment();

  turmas.forEach(turma => {
    const btn = document.createElement('button');
    btn.dataset.id = turma.id;
    btn.style.cssText = `
      display:flex;align-items:center;justify-content:space-between;
      padding:12px 14px;border-radius:8px;
      background:#8A9BB0;border:none;cursor:pointer;
      color:white;font-weight:600;font-size:0.83rem;
      transition:background 0.15s;
    `;
    const icone = _modoRemover
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="#E57373" style="flex-shrink:0"><circle cx="12" cy="12" r="10" fill="#E57373"/><line x1="8" y1="12" x2="16" y2="12" stroke="white" stroke-width="2.5"/></svg>`
      : '';
    btn.innerHTML = `<span style="flex:1;text-align:left">${turma.nome}</span>${icone}`;
    frag.appendChild(btn);
  });

  grid.innerHTML = '';
  grid.appendChild(frag);
}

function _bindEventos(container) {
  container.querySelector('#input-busca-turma').addEventListener('input', e => {
    _termoBusca = e.target.value;
    const todas = API.getTurmas();
    const filtradas = _termoBusca
      ? todas.filter(t => t.nome.toLowerCase().includes(_termoBusca.toLowerCase()))
      : todas;
    _renderGrid(container, filtradas);
  });

  container.querySelector('#btn-add-turma').addEventListener('click', () => {
    openModal({
      campos: [{ name: 'nome', label: 'Turma', placeholder: 'Digite o nome da turma' }],
      confirmLabel: 'CONCLUIR',
      onConfirm: ({ nome }) => {
        if (!nome) return false;
        API.addTurma(nome);
        _renderView(container);
      }
    });
  });

  container.querySelector('#btn-rem-turma').addEventListener('click', () => {
    _modoRemover = !_modoRemover;
    _renderView(container);
  });

  container.querySelector('#grid-turmas').addEventListener('click', async e => {
    if (!_modoRemover) return;
    const btn = e.target.closest('button[data-id]');
    if (!btn) return;
    const nome = btn.querySelector('span').textContent;
    const ok = await confirmModal(`Remover turma <strong>${nome}</strong>?`);
    if (ok) { API.removeTurma(btn.dataset.id); _renderView(container); }
  });
}
