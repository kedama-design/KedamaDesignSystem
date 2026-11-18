# 変更の記録

`@kedama-design/core` の版ごとの変更。0.x の間は、使う側を壊す変更がありうる（README の「版の約束」）。
使う側を壊す変更は「**壊す変更**」と書く。

## 0.2.0（未公開）

外枠（AppShell）を足した（段2、2026-11-18）。設計は `docs/stage2-log.md` の「外枠の設計（0.2.0）」。

- 外枠の CSS: `ui/shell.css`（`@kedama-design/core/shell.css`）。読み込む順は tokens → base → components → shell。
  幅の段は wide（1200px〜）・mid（768〜1199px。サイドバー・右パネルは本文に重ねる）・narrow（〜767px。上の行 44px、
  列とサイドバーは左からの引き出し、右パネルは下からのシート）
- 外枠の JavaScript: `ui/shell.js`（`@kedama-design/core/shell.js`）の `attachShell`（`toggle`・`close`・`destroy`、
  wide の開閉を求めとして受ける `onRequest`）。重ねているあいだの `inert`・`role="dialog"`・Tab の折り返し・Esc・フォーカスの戻り先
- `drawer.js`: 閉じたときの戻り先（`opener`）が文書に残っていても隠れていて focus できないときは、`fallbackFocus` を試すようにした
  （今までは何もしなかった。戻り先へ戻れたときの動きは変わらない）
  - Tab の折り返しの候補は、ボタン・入力欄・リンク・`tabindex` が 0 以上の要素に加え、`tabindex` の無い編集欄（`contenteditable`）も含む。
    並びはブラウザと同じ（`tabindex` が正のものを値の小さい順に先、そのあと 0 と指定なしを文書の順）
  - narrow では、上の行と引き出しの先頭の文字のボタン（`tsk-btn`）も、見た目はそのまま押せる範囲を 44px にする
- `components.css`: ドロワーの見出しの右のチップ（`.tsk-drawer__badge`）が、空のとき（`hidden`）にも空の枠として出ていたのを直した
  （`.tsk-drawer__badge[hidden] { display: none; }`。0.1.0 から。**登記議事録つくるさんへ写すときの差**）
- 単一の HTML（`scripts/single-html.mjs`）に `shell.js`・`shell.css` を入れた（`kedamaCore.attachShell`）
- 配る物は 20 → 22 ファイル

## 0.1.0（未公開）

最初の版。共通UIガイドライン v1.0 の値と、登記議事録つくるさんの部品を移した（段1、2026-11-13〜14）。

- 値: `ui/tokens.css`（`--ui-*`）。正は `guidelines/tokens/tokens.json`（npm にも入れる）
- 部品の CSS: `ui/base.css`・`ui/components.css`（class は `tsk-`）
- 部品の JavaScript: `motion.js`（ばね）・`toast.js`（トースト）・`drawer.js`（ドロワー）・`dateinput.js`（日付の欄）・`icons.js`（アイコン）
- 状態のアイコンの SVG 8つ（`@kedama-design/core/icons/*.svg`）
- 登記議事録つくるさんの部品との違い: 主ボタンの hover・active の色、いちばん明るい面を `#fffefc` に、入力欄と選択の枠を濃く、重ねたときに枠の色を変えない
