export interface Style { font: string; size: number; bg: string; fg: string; }
export interface Snapshot {
  remaining: number;   // 残り秒（0を過ぎるとマイナス＝超過）
  total: number;
  running: boolean;
  overrun: boolean;
  linked: boolean;     // コントロール窓が開いているか
  style: Style;
}
export type FlashName = 'start' | 'stop' | 'reset' | 'set';
