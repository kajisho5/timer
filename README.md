# LEQVIO TIMER（Tauri版）
イベント用カウントダウンタイマー。表示窓とコントロール窓の2窓構成。produced by SEVENTHWELL

- 操作：SPACE=開始/停止　ESC=リセット　0〜9=時間入力　ENTER=確定　BackSpace=1桁削除
- 設定（色・フォント・サイズ）は自動保存（`%APPDATA%\jp.seventhwell.leqvio-timer\settings.json`）
- 動作条件：Windows 10(1803以降)/11（WebView2が入っていること）

## 作り方
- GitHub Actions：Actions →「build-windows」→ Run workflow → 完了後 Artifacts から exe を取得
- 手元：`npm install` → `npx tauri build --no-bundle`
- 構成：`src/`画面(TypeScript) `src-tauri/`タイマー本体(Rust)。タイマーの正本はRust側。
- フォント：Orbitron / Bebas Neue / Share Tech Mono / Noto Sans JP（いずれもOFL）と Mona Lisa（ライセンス未確認）を同梱
