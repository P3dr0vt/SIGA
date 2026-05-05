let _modalEl = null;

function _criarOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'siga-modal-overlay';
  overlay.className = 'fixed inset-0 z-50 flex items-center justify-center';
  overlay.style.background = 'rgba(0,0,0,0.45)';
  document.body.appendChild(overlay);
  return overlay;
}

/**
 * Abre o modal genérico.
 * @param {Object} opts
 * @param {string}  [opts.titulo]       - Título no topo do card
 * @param {string}  [opts.preContent]   - HTML livre inserido entre título e campos
 * @param {Array}   [opts.campos]       - Campos do formulário
 * @param {Function} opts.onConfirm     - Callback com { name: value }
 * @param {string}  [opts.confirmLabel] - Label do botão (default "CONCLUIR")
 * @param {boolean} [opts.wide]         - Aumenta a largura máxima para 700px
 */
export function openModal({ titulo, preContent = '', campos = [], onConfirm, confirmLabel = 'CONCLUIR', wide = false }) {
  closeModal();

  const overlay = _criarOverlay();

  const box = document.createElement('div');
  box.style.cssText = `background:#1E6BB8;border-radius:12px;padding:28px 32px;min-width:420px;max-width:${wide ? '700px' : '560px'};width:90%;max-height:90vh;overflow-y:auto;`;

  let html = '';
  if (titulo) {
    html += `<div style="background:white;border-radius:8px;text-align:center;padding:10px 20px;margin-bottom:20px;">
               <span style="color:#1E6BB8;font-weight:700;font-size:1.1rem;">${titulo}</span>
             </div>`;
  }

  // Conteúdo livre (ex: tabela de status de ocupação)
  if (preContent) html += preContent;

  campos.forEach(campo => {
    if (campo.type === 'select') {
      html += `<div style="margin-bottom:16px;">
        <div style="font-size:0.7rem;color:rgba(255,255,255,0.85);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.05em;">${campo.label}</div>
        <select name="${campo.name}" style="width:100%;padding:10px 14px;background:#1557A0;border:1.5px solid rgba(255,255,255,0.5);border-radius:8px;color:white;font-size:0.9rem;outline:none;">
          <option value="">Selecione...</option>
          ${campo.opcoes.map(o =>
            `<option value="${o.value}" ${o.disabled ? 'disabled style="color:#9ca3af;"' : ''}>${o.label}</option>`
          ).join('')}
        </select>
      </div>`;
    } else {
      html += `<div style="position:relative;margin-bottom:16px;">
        <label style="position:absolute;top:-8px;left:12px;background:#1E6BB8;padding:0 6px;font-size:0.72rem;color:rgba(255,255,255,0.85);">${campo.label}</label>
        <input type="${campo.type || 'text'}" name="${campo.name}" placeholder="${campo.placeholder || ''}"
          style="width:100%;padding:12px 14px;background:transparent;border:1.5px solid rgba(255,255,255,0.6);border-radius:8px;color:white;font-size:0.95rem;outline:none;box-sizing:border-box;"
          autocomplete="off" />
      </div>`;
    }
  });

  html += `<button id="modal-confirm"
    style="width:100%;padding:13px;background:#0D3566;border:none;border-radius:8px;color:white;font-weight:700;font-size:0.95rem;letter-spacing:0.08em;cursor:pointer;margin-top:4px;">
    ${confirmLabel}
  </button>`;

  box.innerHTML = html;
  overlay.appendChild(box);
  _modalEl = overlay;

  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal();
  });

  box.querySelector('#modal-confirm').addEventListener('click', () => {
    const dados = {};
    box.querySelectorAll('input, select').forEach(el => {
      dados[el.name] = el.value.trim();
    });
    if (onConfirm(dados) !== false) closeModal();
  });

  const primeiroInput = box.querySelector('input:not([disabled]), select:not([disabled])');
  if (primeiroInput) primeiroInput.focus();
}

export function closeModal() {
  if (_modalEl) {
    _modalEl.remove();
    _modalEl = null;
  }
}

/**
 * Toast de notificação flutuante no canto inferior direito.
 * @param {string} msg  - Mensagem a exibir
 * @param {'info'|'success'|'warning'|'error'} tipo
 */
export function toast(msg, tipo = 'info') {
  const cores = { info: '#1E6BB8', success: '#16A34A', warning: '#D97706', error: '#DC2626' };

  if (!document.querySelector('#siga-toast-style')) {
    const s = document.createElement('style');
    s.id = 'siga-toast-style';
    s.textContent = `
      @keyframes siga-slide-in  { from { transform:translateX(110%); opacity:0 } to { transform:translateX(0); opacity:1 } }
      @keyframes siga-slide-out { from { opacity:1 } to { transform:translateX(110%); opacity:0 } }
    `;
    document.head.appendChild(s);
  }

  const el = document.createElement('div');
  el.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:9999;
    background:${cores[tipo] ?? cores.info};color:white;
    padding:12px 20px;border-radius:8px;font-size:0.85rem;font-weight:500;
    max-width:380px;box-shadow:0 4px 18px rgba(0,0,0,0.3);line-height:1.4;
    animation:siga-slide-in 0.3s ease;
  `;
  el.textContent = msg;
  document.body.appendChild(el);

  setTimeout(() => {
    el.style.animation = 'siga-slide-out 0.35s ease forwards';
    setTimeout(() => el.remove(), 350);
  }, 3800);
}

export function confirmModal(mensagem) {
  return new Promise(resolve => {
    closeModal();
    const overlay = _criarOverlay();
    const box = document.createElement('div');
    box.style.cssText = 'background:#1E6BB8;border-radius:12px;padding:28px 32px;min-width:360px;text-align:center;';
    box.innerHTML = `
      <p style="color:white;font-size:1rem;margin-bottom:24px;">${mensagem}</p>
      <div style="display:flex;gap:12px;justify-content:center;">
        <button id="modal-nao" style="flex:1;padding:11px;background:#8A9BB0;border:none;border-radius:8px;color:white;font-weight:700;cursor:pointer;">Cancelar</button>
        <button id="modal-sim" style="flex:1;padding:11px;background:#0D3566;border:none;border-radius:8px;color:white;font-weight:700;cursor:pointer;">Confirmar</button>
      </div>`;
    overlay.appendChild(box);
    _modalEl = overlay;
    box.querySelector('#modal-sim').onclick = () => { closeModal(); resolve(true); };
    box.querySelector('#modal-nao').onclick = () => { closeModal(); resolve(false); };
  });
}
