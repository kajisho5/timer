import './styles/fonts.css';
import './styles/base.css';
import './styles/control.css';
import * as ipc from './ipc';
import { fmt } from './format';
import { createNumpad, type Numpad } from './numpad';
import { installKeys, openNumpad } from './keys';
import type { FlashName, Snapshot } from './types';

const $ = (id: string) => document.getElementById(id) as HTMLElement;
let snap: Snapshot | null = null;

const numpad: Numpad = createNumpad(sec => { if (!snap?.running) void ipc.setTime(sec); });

// ---- ボタン ----
$('btnStart').addEventListener('click', () => void ipc.start());
$('btnStop').addEventListener('click', () => void ipc.stop());
$('btnReset').addEventListener('click', () => void ipc.reset());
$('btnSet').addEventListener('click', () => { if (!snap?.running) openNumpad(numpad); });
document.querySelectorAll<HTMLElement>('.pre').forEach(el =>
  el.addEventListener('click', () => void ipc.setPreset(parseInt(el.dataset.sec!, 10))));

// ---- 外観 ----
const cBg = $('cBg') as HTMLInputElement, cFg = $('cFg') as HTMLInputElement;
const selFont = $('selFont') as HTMLSelectElement, numSize = $('numSize') as HTMLInputElement;
function pushStyle() {
  const size = Math.min(60, Math.max(4, parseInt(numSize.value, 10) || 30));
  void ipc.setStyle({ font: selFont.value, size, bg: cBg.value, fg: cFg.value });
}
cBg.addEventListener('input', pushStyle);
cFg.addEventListener('input', pushStyle);
selFont.addEventListener('change', () => { pushStyle(); selFont.blur(); }); // 変更後もSPACEで操作できるように
numSize.addEventListener('input', pushStyle);
numSize.addEventListener('keydown', e => { if (e.key === 'Enter') numSize.blur(); });

// ---- 表示 ----
function render(s: Snapshot) {
  const rEl = $('cremain'), sEl = $('cstatus');
  rEl.textContent = fmt(s.remaining);
  rEl.style.color = s.overrun ? '#f66' : '#fff';
  const [txt, color, border] = s.overrun ? ['OVERRUN', '#f66', '#733']
    : s.running ? ['RUN', '#5c5', '#2d6a2d'] : ['STOP', '#777', '#333'];
  sEl.textContent = txt; sEl.style.color = color; sEl.style.borderColor = border;
  // 入力中の欄は上書きしない
  const st = s.style, a = document.activeElement;
  if (a !== cBg) cBg.value = st.bg;
  if (a !== cFg) cFg.value = st.fg;
  if (a !== selFont) selFont.value = st.font;
  if (a !== numSize) numSize.value = String(st.size);
}

const FLASH: Record<FlashName, string> = { start: 'btnStart', stop: 'btnStop', reset: 'btnReset', set: 'btnSet' };
function flashBtn(name: FlashName) {
  const el = $(FLASH[name]);
  el.classList.remove('pressed'); void el.offsetWidth; el.classList.add('pressed');
  setTimeout(() => el.classList.remove('pressed'), 220);
}

installKeys({ numpad, isRunning: () => !!snap?.running });
ipc.onState(s => { snap = s; render(s); });
ipc.onFlash(flashBtn);
void ipc.getState().then(s => { snap = s; render(s); });
