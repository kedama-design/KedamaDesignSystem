# 変更の記録

`@kedama-design/core` の版ごとの変更。0.x の間は、使う側を壊す変更がありうる（README の「版の約束」）。
使う側を壊す変更は「**壊す変更**」と書く。

## 0.1.0（未公開）

最初の版。共通UIガイドライン v1.0 の値と、登記議事録つくるさんの部品を移した（段1、2026-11-13〜14）。

- 値: `ui/tokens.css`（`--ui-*`）。正は `guidelines/tokens/tokens.json`（npm にも入れる）
- 部品の CSS: `ui/base.css`・`ui/components.css`（class は `tsk-`）
- 部品の JavaScript: `motion.js`（ばね）・`toast.js`（トースト）・`drawer.js`（ドロワー）・`dateinput.js`（日付の欄）・`icons.js`（アイコン）
- 状態のアイコンの SVG 8つ（`@kedama-design/core/icons/*.svg`）
- 登記議事録つくるさんの部品との違い: 主ボタンの hover・active の色、いちばん明るい面を `#fffefc` に、入力欄と選択の枠を濃く、重ねたときに枠の色を変えない
