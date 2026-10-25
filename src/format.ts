/** MM:SS（超過時は符号なしでそのままカウントアップ表示） */
export function fmt(sec: number): string {
  const abs = Math.abs(sec);
  return String(Math.floor(abs / 60)).padStart(2, '0') + ':' + String(abs % 60).padStart(2, '0');
}

export const FONTS: Record<string, string> = {
  'System': '-apple-system, "Segoe UI", "Hiragino Sans", "Yu Gothic", Arial, sans-serif',
  'Mona Lisa Recut': '"Mona Lisa Recut", serif',
  'Orbitron': '"Orbitron", monospace',
  'Bebas Neue': '"Bebas Neue", sans-serif',
  'Share Tech Mono': '"Share Tech Mono", monospace',
  'Noto Sans JP': '"Noto Sans JP", sans-serif',
  'monospace': 'monospace',
};
