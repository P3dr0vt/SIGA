import API from './api.js';

const TURNOS = ['manha', 'tarde', 'noite'];
const TURNO_LABEL = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' };
const BLOCOS_ORDEM = ['A', 'B', 'C'];
const INTERVALO_AUTO = 20000;

let _turnoIdx = 0;
let _autoTimer = null;

async function init() {
  await API.init();
  _detectarTurnoInicial();
  _renderTudo();
  _bindControles();
  _iniciarAutoRotacao();
}

function _detectarTurnoInicial() {
  const hora = new Date().getHours();
  if (hora >= 6 && hora < 12) _turnoIdx = 0;
  else if (hora >= 12 && hora < 18) _turnoIdx = 1;
  else _turnoIdx = 2;
}

function _renderTudo() {
  _renderBlocos();
  _atualizarRodape();
}

function _renderBlocos() {
  const turno = TURNOS[_turnoIdx];
  const alocsPorBloco = API.getAlocacoesPorBloco(turno);
  const container = document.getElementById('tv-blocos');

  const frag = document.createDocumentFragment();

  BLOCOS_ORDEM.forEach(bloco => {
    const alocs = alocsPorBloco[bloco] || [];
    const section = document.createElement('div');
    section.style.marginBottom = '16px';

    const header = document.createElement('div');
    header.style.cssText = 'background:#0D3566;border-radius:6px 6px 0 0;padding:10px 20px;';
    header.innerHTML = `<span style="color:white;font-weight:900;font-size:1rem;letter-spacing:0.1em;">BLOCO ${bloco}</span>`;
    section.appendChild(header);

    const corpo = document.createElement('div');
    corpo.style.cssText = 'background:white;border-radius:0 0 6px 6px;overflow:hidden;display:grid;grid-template-columns:1fr 1fr;';

    const metade = Math.ceil(alocs.length / 2);
    [alocs.slice(0, metade), alocs.slice(metade)].forEach(grupo => {
      const col = document.createElement('div');

      const thead = document.createElement('div');
      thead.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr;';

      ['INSTRUTOR (A)', 'SALA', 'TURMA'].forEach((label, i) => {
        const th = document.createElement('div');
        th.style.cssText = `
          display:flex;align-items:center;gap:6px;
          background:#1E6BB8;padding:8px 14px;
          color:white;font-weight:700;font-size:0.82rem;letter-spacing:0.04em;
        `;
        th.innerHTML = `${_iconeCol(i)}<span>${label}</span>`;
        thead.appendChild(th);
      });
      col.appendChild(thead);

      grupo.forEach(aloc => {
        const row = document.createElement('div');
        row.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr;border-top:1px solid #E5E5E5;';
        [aloc.instrutor.nome, aloc.sala.nome, aloc.turma.nome].forEach(val => {
          const cell = document.createElement('div');
          cell.style.cssText = 'padding:9px 14px;background:#F0F0F0;color:#333;font-size:0.85rem;font-weight:500;border-right:1px solid #E0E0E0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
          cell.textContent = val;
          row.appendChild(cell);
        });
        col.appendChild(row);
      });

      corpo.appendChild(col);
    });

    section.appendChild(corpo);
    frag.appendChild(section);
  });

  container.innerHTML = '';
  container.appendChild(frag);
}

function _atualizarRodape() {
  document.getElementById('tv-turno-label').textContent = TURNO_LABEL[TURNOS[_turnoIdx]];

  const dots = document.querySelectorAll('.tv-dot');
  dots.forEach((d, i) => {
    d.style.background = i === _turnoIdx ? 'white' : 'rgba(255,255,255,0.3)';
  });
}

function _navegarTurno(dir) {
  _turnoIdx = (_turnoIdx + dir + TURNOS.length) % TURNOS.length;
  _reiniciarAutoRotacao();
  _renderTudo();
}

function _bindControles() {
  document.getElementById('btn-prev').addEventListener('click', () => _navegarTurno(-1));
  document.getElementById('btn-next').addEventListener('click', () => _navegarTurno(1));

  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') _navegarTurno(1);
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') _navegarTurno(-1);
    if (e.key === 'Escape') window.location.href = 'dashboard.html';
  });
}

function _iniciarAutoRotacao() {
  _autoTimer = setInterval(() => {
    _turnoIdx = (_turnoIdx + 1) % TURNOS.length;
    _renderTudo();
  }, INTERVALO_AUTO);
}

function _reiniciarAutoRotacao() {
  clearInterval(_autoTimer);
  _iniciarAutoRotacao();
}

function _iconeCol(i) {
  const icones = [
    `<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`,
    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>`,
    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/></svg>`
  ];
  return icones[i] || '';
}

init();
