/** テンキー（表示窓・コントロール窓で共通） */
const HTML = `
<div id="numpad-box">
  <div id="numpad-preview"><span id="np-m">00</span><span class="sep">:</span><span id="np-s">00</span></div>
  <div id="numpad-grid">
    ${[7, 8, 9, 4, 5, 6, 1, 2, 3].map(n => `<div class="nk" data-d="${n}">${n}</div>`).join('')}
    <div class="nk zero" data-d="0">0</div>
    <div class="nk del" data-act="del">⌫</div>
    <div class="nk cancel" data-act="cancel">キャンセル</div>
    <div class="nk ok" style="grid-column:span 2" data-act="ok">▶ セット</div>
  </div>
</div>`;

export interface Numpad {
  open(): void; close(): void; isOpen(): boolean;
  input(d: string): void; del(): void; commit(): void;
}

export function createNumpad(onCommit: (sec: number) => void, onOpenChange?: (open: boolean) => void): Numpad {
  const overlay = document.createElement('div');
  overlay.id = 'numpad-overlay';
  overlay.innerHTML = HTML;
  document.body.appendChild(overlay);
  const m = overlay.querySelector('#np-m') as HTMLElement;
  const s = overlay.querySelector('#np-s') as HTMLElement;
  let buf = '';

  const preview = () => {
    const p = buf.padStart(4, '0');
    m.textContent = p.slice(0, 2); s.textContent = p.slice(2, 4);
  };
  const api: Numpad = {
    open() { buf = ''; preview(); overlay.classList.add('show'); onOpenChange?.(true); },
    close() { overlay.classList.remove('show'); onOpenChange?.(false); },
    isOpen: () => overlay.classList.contains('show'),
    input(d) { if (buf.length < 4) { buf += d; preview(); } },
    del() { buf = buf.slice(0, -1); preview(); },
    commit() {
      if (buf) {
        const p = buf.padStart(4, '0');
        onCommit(parseInt(p.slice(0, 2), 10) * 60 + parseInt(p.slice(2, 4), 10));
      }
      api.close();
    },
  };
  overlay.addEventListener('click', e => {
    const t = e.target as HTMLElement;
    if (t === overlay) { api.close(); return; }
    const k = t.closest('.nk') as HTMLElement | null;
    if (!k) return;
    if (k.dataset.d !== undefined) api.input(k.dataset.d);
    else if (k.dataset.act === 'del') api.del();
    else if (k.dataset.act === 'cancel') api.close();
    else if (k.dataset.act === 'ok') api.commit();
  });
  return api;
}
