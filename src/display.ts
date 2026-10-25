import './styles/fonts.css';
import './styles/base.css';
import './styles/splash.css';
import * as ipc from './ipc';
import { FONTS, fmt } from './format';
import { createNumpad, type Numpad } from './numpad';
import { installKeys, openNumpad } from './keys';
import type { Snapshot } from './types';

const $ = (id: string) => document.getElementById(id) as HTMLElement;
const timeEl = $('time'), frame = $('frame'), overrunLbl = $('overrun-label');
let snap: Snapshot | null = null;
let splashDone = false;
const bootAt = performance.now();

const numpad: Numpad = createNumpad(
  sec => { if (!snap?.running) void ipc.setTime(sec); },
  open => timeEl.classList.toggle('input-mode', open),
);

function render(s: Snapshot) {
  const st = s.style;
  timeEl.style.fontFamily = FONTS[st.font] ?? FONTS['System'];
  timeEl.style.fontSize = st.size + 'cqw';
  timeEl.style.color = st.fg;
  $('app').style.background = st.bg;
  document.body.style.background = st.bg;
  $('credit').style.color = st.fg;
  overrunLbl.style.color = st.fg;
  overrunLbl.classList.toggle('show', s.remaining < 0);
  // 1桁ずつ固定幅スロットに入れて描画（桁ズレ防止）
  timeEl.innerHTML = Array.from(fmt(s.remaining)).map(ch =>
    `<span class="ch${ch === ':' ? ' colon' : ''}">${ch}</span>`).join('');
  $('conn-dot').classList.toggle('linked', s.linked);
  refreshReopen();
}

function refreshReopen() {
  const show = !!snap && !snap.linked && performance.now() - bootAt > 3500;
  $('btn-reopen').classList.toggle('show', show);
}

timeEl.addEventListener('click', () => { if (!snap?.running) openNumpad(numpad); });
$('btn-reopen').addEventListener('click', () => { void ipc.openControl(); });
frame.addEventListener('dblclick', e => e.preventDefault());

installKeys({ numpad, isRunning: () => !!snap?.running, enabled: () => splashDone });

ipc.onState(s => { snap = s; render(s); });
setInterval(refreshReopen, 500);

// スプラッシュ：2.1秒後にフェードアウト開始、その0.65秒後に非表示
const splash = $('splash');
setTimeout(() => {
  splash.classList.add('fade-out');
  setTimeout(() => { splash.classList.add('done'); splashDone = true; }, 650);
}, 2100);

void ipc.getState().then(s => { snap = s; render(s); });
