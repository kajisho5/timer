import * as ipc from './ipc';
import type { Numpad } from './numpad';

/** 両窓共通のキー操作。SPACE=開始/停止 ESC=リセット 0〜9=時間入力 ENTER=確定 */
export function installKeys(opts: { numpad: Numpad; isRunning: () => boolean; enabled?: () => boolean }) {
  const { numpad } = opts;
  document.addEventListener('keydown', e => {
    if (opts.enabled && !opts.enabled()) return;           // スプラッシュ中は無効
    const t = e.target as HTMLElement;
    if (t.closest && t.closest('input, select')) return;   // 入力欄ではショートカットを奪わない
    const running = opts.isRunning();
    if (numpad.isOpen()) {
      if (/^[0-9]$/.test(e.key)) { numpad.input(e.key); return; }
      if (e.key === 'Backspace') { numpad.del(); return; }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); numpad.commit(); return; }
      if (e.key === 'Escape') { numpad.close(); return; }
      return;
    }
    if (running) {
      if (e.key === ' ') { e.preventDefault(); void ipc.stop(); }
      return;
    }
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); void ipc.start(); return; }
    if (e.key === 'Escape') { void ipc.reset(); return; }
    if (/^[0-9]$/.test(e.key)) { openNumpad(numpad); numpad.input(e.key); }
  });
  // ボタンを押したあとフォーカスが残るとSPACEがボタンを再発火するので外す
  document.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest('button');
    if (b) b.blur();
  });
}

export function openNumpad(numpad: Numpad) {
  void ipc.flash('set');
  numpad.open();
}
