# けだまカレンダーへの引き継ぎ（共通UI 段2、2026-11-18）

けだまカレンダーの指揮役へ。KedamaDesignSystem の `core`（`@kedama-design/core`）を、けだまカレンダーの `packages/ui` から使うための取り決め。

## 決まったこと（yuuki）

| 項目                          | 決まり                                                                                   |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| 取り込み方（詳細設計 9章5番） | **npm の公開のレジストリから取り込む**（11-17）。写しとハッシュの照合は使わない          |
| 最初の版                      | **0.1.0**（値と部品。外枠はまだない）。公開は yuuki が手で行う（11-18）                  |
| 外枠（Codex 型の AppShell）   | **core に足した**（11-18 決定）。**0.2.0** に入る（公開は yuuki が手で行う）             |
| 版の固定                      | `pnpm add --save-exact`。`^` や `~` を付けない（0.x の間は小さな版でも中身が変わりうる） |

## 使い方

`core/README.md` の「けだまカレンダー（pnpm・Vite・React）で使う」の節を見てください。要点:

- `packages/ui` の入口で `tokens.css` → `base.css` → `components.css` の順に一度だけ読み込む
- React の部品は core の class（`tsk-`）を包むだけにする。色・寸法の値を書かない（`var(--ui-*)` だけ）
- トーストとドロワーは core の JavaScript（`createToaster`・`openDrawer`）を呼ぶ

## 外枠（0.2.0 から）

- 使い方は `core/README.md` の外枠の節（HTML の形、幅の段、属性の持ち主、`attachShell`、React での例、既知の制限）
- 土台（M0）の設定の画面は、`@kedama-design/core@0.2.0` の `shell.css`・`shell.js` で外枠を作る。けだまカレンダーの中で外枠の CSS を作らない（作ると部品が2か所になる）
- 0.2.0 の公開の前に外枠の作業へ入る必要があるときは、KedamaDesignSystem に時期を伝えてください
- 外枠の決まりの文書（`core/guidelines/docs/02_AppShell.md`・`07_追加.md`）と設計の記録（`core/docs/stage2-log.md`）は npm には入らないので、リポジトリで読む

## core を直したいとき

1. KedamaDesignSystem に、何が足りないか・なぜ要るかを伝える
2. KedamaDesignSystem で core を直し、新しい版を出す（作業用の枝 → Codex の確認 → main → yuuki が npm に公開）
3. `packages/ui` の版を上げる。変更はリポジトリの `core/CHANGELOG.md` で確かめる（npm には入らない）

## けだまカレンダーの側で書き足してほしいこと

- 詳細設計の 9章5番の答え（npm）と、8章の「core が間に合わない場合は写しとハッシュの照合」の扱い（使わないことになった）
- 書き足すのは、けだまカレンダーの指揮役か yuuki（KedamaDesignSystem の側からは、けだまカレンダーのフォルダに書き込まない）
