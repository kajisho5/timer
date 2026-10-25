# LEQVIO TIMER（Tauri版）詳細設計書 v0.1

作成日 2026-10-25 / 状態：**確認待ち（実装はまだ始めていません）**

## 0. この設計書の元にしたもの（事実）
いま使っている「LEQVIO-TIMER-Portable.exe」（80MB）を展開して中身を読みました。
- 形式：Electron製（NSISという自己展開インストーラー形式）、version 1.0.0、作者 SEVENTHWELL
- 中身：index.html（1枚・約32KB）／main.js／フォント2つ／スプラッシュ画像2枚
- この設計書の機能・画面・動きは、すべてこのHTMLとmain.jsから起こしたもの。

読めていない部分：exe内のネイティブ部分（Electron本体）、Windows上での実機動作（ここはLinuxのため未確認）。

## 1. 要件
### 1-1. いまの機能（そのまま引き継ぐ）
1. **表示ウィンドウ**：白背景、16:9の黒枠（V-160HD等のPnP枠合わせ用）の中に大きく「MM:SS」。
2. **コントロールウィンドウ**（別窓 680×440）：残り時間／状態（STOP・RUN・OVERRUN）／開始・停止・リセット・時間セット／プリセット(2:00・20:00・30:00・40:00)／背景色／文字色／フォント／サイズ。
3. **カウントダウン専用**。0を過ぎたら符号なしでそのままカウントアップ表示（例 00:42）。黒枠の下（枠の外）に小さく「OVERRUN」を表示。コントロール側は赤字。
4. **時間入力**：数字キーを押すとテンキーが開く。4桁（分2＋秒2）。ENTER/SPACEで確定、BackSpaceで1桁削除、ESCで取消。
5. **キー操作**：SPACE=開始/停止、ESC=リセット、0〜9=時間入力、ENTER=確定。**どちらの窓が前面でも**効く。押したらコントロールのボタンが一瞬光る。
6. 動作中は時間セット不可。
7. 桁は固定幅（カウント中に位置がズレない）。
8. 起動後、コントロールが自動で開く。表示ウィンドウを閉じるとコントロールも一緒に閉じる。コントロールを閉じたら表示側に「コントロールを再表示」ボタン。開いている間は右上に緑の点滅。
9. 右下に薄いクレジット「LEQVIO TIMER / produced by SEVENTHWELL」。
10. スプラッシュ（起動時2.1秒のLEQVIOロゴ画面）。

### 1-2. 変える点（提案。不要なら外せます）
| # | 内容 | 理由 |
|---|---|---|
| A | フォントを**exeに同梱**（今はGoogle Fontsをネット経由で読む） | 会場がオフラインだと標準フォントに落ちる。時間表示は数字と「:」だけなので、必要な文字だけに切り出して軽くできる |
| B | 設定（色・フォント・サイズ・最後のプリセット）を**保存**して次回起動時に復元 | 今は毎回初期値に戻る |
| C | タイマーの正本を**Rust側**に置き、両窓は表示するだけ | 窓同士の「親子の直接呼び出し」をやめ、片方が固まっても時間が狂わない |
| D | 起動のたびにインストール不要の**1ファイル**で配る | 今は80MBの展開型 |

### 1-3. 確認したい点（回答がなければ ★ の既定で進めます）
1. スプラッシュ画面と「LEQVIO」の名前・ロゴ：★そのまま残す（忠実な作り直し）／外して汎用版にする
2. 変更点A・B・Cを入れてよいか：★入れる
3. Mona Lisa 2フォントのライセンス：**不明**（商用利用の可否を確認できていません）。★そのまま同梱するが、配布する場合は要確認

## 2. 技術選定（Tauri指定への妥当性確認）
| | **Tauri 2（おすすめ）** | Electron（今） | Wails(Go) |
|---|---|---|---|
| 動作の軽さ | 軽い（OS標準のWebView2を使う） | 重い（Chromium同梱） | 軽い |
| 配布サイズ | 小さい（目安 数MB〜十数MB。※推測、実測は実装後） | 80MB | 小さい |
| 作りやすさ | Rust少し＋画面はWeb | 簡単 | Go＋Web |
| 対応OS | Win/Mac/Linux | 同左 | 同左 |
| 将来性 | 公式が活発（2026-10-21にも更新） | 安定 | Tauriより小さい |
| AIでの書きやすさ | 良い | 非常に良い | 普通 |

**結論：Tauri 2で進める。** ご指定どおりで問題なし。理由：80MB→大幅縮小、OS標準のWebView2は Windows 10(1803以降)・11に最初から入っている（公式 https://v2.tauri.app/start/prerequisites/ ）。

**画面側はReactを使わない**（素のTypeScript＋Vite）。画面が2枚・状態が小さいので、Reactを入れると重くなるだけのため。

### 2-1. バージョン（2026-10-25時点、公式レジストリで確認）
| 部品 | 版 | 根拠 |
|---|---|---|
| tauri（Rust） | 2.12.5（2026-10-21） | https://crates.io/crates/tauri |
| @tauri-apps/cli / api | 2.12.4 | https://www.npmjs.com/package/@tauri-apps/cli |
| Vite | 8.3.5 | https://www.npmjs.com/package/vite |
| TypeScript | 7.0.2 | https://www.npmjs.com/package/typescript |
| Rust | 1.97.0 | rustup stable |
食い違い：GitHubのリリースページには tauri 2.11.5 と載っていた（表示が古い可能性）。crates.io（公開元）の2.12.5を採用。
未確認：Vite 8とTypeScript 7の相性。実装の最初に確認し、問題があればTypeScriptを一つ前の系列に下げる（beta/RCは使わない）。

## 3. 画面構成
別紙SVG参照。窓は2つ。
| 窓 | ラベル | 大きさ | 内容 |
|---|---|---|---|
| 表示 | main | 1280×800（変更可） | 黒枠＋時間／OVERRUN／緑点滅／再表示ボタン／クレジット／テンキー重ね表示 |
| コントロール | control | 680×440 | 操作一式 |

SVG一覧：01 表示（動作中）／02 表示（超過・コントロール閉じた状態）／03 テンキー表示中／04 コントロール（動作中）／05 コントロール（超過）

## 4. 動き（状態管理）
**正本はRust側**。
```
状態 = { totalSec, remaining, running, startedAtMs, baseRemaining, settings }
```
- 開始：startedAt=現在のミリ秒、baseRemaining=remaining
- 200msごとに remaining = baseRemaining − floor((now − startedAt)/1000) を計算。変わったときだけ両窓へ通知（今の計算式と同じ。ズレが積み重ならない）
- 停止／リセット／プリセット／時間セット：状態を更新→両窓へ通知
- 窓側は通知を受けて描くだけ。キー入力・ボタンはRustの「命令」を呼ぶ

### 命令（窓→Rust）
`start` `stop` `reset` `set_time(sec)` `set_preset(sec)` `set_style(font,size,bg,fg)` `open_control` `get_state`
### 通知（Rust→両窓）
`timer-state`（remaining, running, overrun）／`style-changed`／`flash`（ボタン点灯用 start/stop/reset/set）／`control-linked`（true/false）

### 窓の寿命
- 起動時、表示窓を作り、コントロール窓を自動で開く（スプラッシュを残す場合は終了後）
- 表示窓を閉じる→アプリごと終了（コントロールも閉じる）
- コントロール窓を閉じる→終了しない。表示側に再表示ボタン、緑点滅は消灯

## 5. 部品の分け方・データ構造
- テンキー：表示窓とコントロール窓の**同じ部品**（今は2回コピーされている）
- 時間表示：固定幅スロット（数字0.62em・コロン0.34em）
- 設定の保存：アプリのデータフォルダにJSON（`settings.json`）。形：`{font,size,bg,fg}`

## 6. フォルダ構成
```
leqvio-timer/
├─ package.json / vite.config.ts / tsconfig.json
├─ index.html            … 表示窓
├─ control.html          … コントロール窓
├─ src/
│  ├─ display.ts  control.ts
│  ├─ numpad.ts           … 共通テンキー
│  ├─ keys.ts             … キー操作（両窓共通）
│  ├─ format.ts           … MM:SS整形
│  ├─ ipc.ts              … Rustとのやり取り
│  └─ styles/
├─ public/fonts/          … 数字と「:」だけに切り出したフォント
└─ src-tauri/
   ├─ Cargo.toml / tauri.conf.json / capabilities/
   ├─ icons/              … 今のicon.icoから作る
   └─ src/ main.rs  timer.rs  settings.rs  windows.rs
```

## 7. 作り方・動作確認（実装時）
- ビルド：**GitHub ActionsのWindowsランナー**で行い、exeを成果物として出す（Macも手元のWindowsも不要）。
- 確認：Linux上での画面確認と計時テストまでは私が実施。**Windows実機の動作は未確認のまま渡す**ので、最初の起動確認だけお願いする（手順は1つずつ書きます）。
- 配布：インストール不要の単体exe（WebView2が無い古いPC用の案内を同梱）。署名なしのため初回に警告が出る。

## 8. 範囲外
USB受信（Limitimer等）、ネット同期、カウントアップモード、警告色。
