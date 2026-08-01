# `--text-faint` 使用箇所の監査と移行先

仕様書 `cross-product-ui-library-spec.md` §0.7 運用ルール1 で `--text-faint` は**廃止**が
確定した。「テキストと呼びながら基準を緩める」のが誤りで、実体は**役割が混ざっていた**
ことだったため、用途ごとに4つのトークンへ分離する。

本書は Phase A-1 の追加作業「Ibuki の既存 `--text-faint` 使用箇所を全て監査し、
どれに該当するか振り分ける」の成果物である。

- 調査対象: `Ibuki-Code-v2` HEAD `565ecb7e6d5ec38560e967718978cb6c9f3ad728`
- 調査日: 2026-07-29
- 検出件数: **57 箇所**（定義 8 / 本番コード 18 / プロトタイプ 22 / ドキュメント 1 ほか）

> **機械置換はしない。** 同じ `--text-faint` でも、意味のある文字か純装飾かで移行先が
> 変わる。本書は「どこを、何に、なぜ」を確定させるための一覧であり、置換そのものは
> Phase C（すらすらスタジオ）／Phase E（Ibuki 本番置換）で該当箇所を実際に開いて行う。

---

## 0. 移行先の4トークン（§0.7）

| 移行先           | 用途                                                     | 基準                                               | Light     | Dark / Deep-dark |
| ---------------- | -------------------------------------------------------- | -------------------------------------------------- | --------- | ---------------- |
| `fg.muted`       | 補助テキスト・軸ラベルなど**読ませる**もの               | **4.5:1**（WCAG 1.4.3）                            | birch/600 | birch/300        |
| `fg.decorative`  | 純装飾（区切り記号、装飾的な図形、`aria-hidden` の飾り） | 3:1（WCAG 1.4.11）。**意味のある文字には使用禁止** | birch/400 | birch/400        |
| `fg.placeholder` | 入力欄のプレースホルダー                                 | 3:1                                                | birch/400 | birch/400        |
| `fg.disabled`    | 無効状態                                                 | 規定なし（無効であること自体が情報）               | birch/300 | birch/500        |

**振り分けの判定基準（迷ったときの順序）**

1. `aria-hidden` が付いている／隣に同じ意味のテキストがある → `fg.decorative`
2. 入力欄の未入力時の見本 → `fg.placeholder`
3. `disabled` 状態の表現 → `fg.disabled`
4. **上記以外はすべて `fg.muted`**（読ませるものは 4.5:1 を満たす）

旧 `--text-faint` は Light で birch/400 相当だった。`fg.muted` へ移すと**文字が濃くなる**。
これは意図した変更であり、「薄すぎて読めなかったものが読めるようになる」のが目的である。

---

## 1. 移行の仕組み（なぜ alias に `--text-faint` を出力しないか）

`src/styles/alias-ibuki.css`（generator 出力）は `--text-faint` を**意図的に定義しない**。

- 定義してしまうと、未監査の箇所がそのまま動き続け、移行が永久に終わらない
- 定義しなければ `color: var(--text-faint)` は計算値の時点で無効となり、color は
  **親から継承**される。つまり**画面は壊れないが見た目が明らかに変わる**ため、
  取りこぼしがレビューで目に見えて分かる

移行完了の判定は `grep -rn "text-faint"` がゼロになることで行う。

---

## 2. 本番コード（18 箇所 / 12 ファイル）

### 2.1 `fg.muted` へ（読ませるテキスト）— 14 箇所

| ファイル:行                                                | 現在の使われ方                                               | なぜ `fg.muted` か                                                              |
| ---------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `packages/ui/src/charts/waterfall.tsx:111`                 | `<g fontSize={9} fill="var(--text-faint)">` — 値ラベル       | 数値を読ませる。§0.7 が名指しで「軸ラベルなど読ませるものは 4.5:1」と定めた対象 |
| `packages/ui/src/charts/palette.ts:24`                     | `axisText: "var(--text-faint)"`                              | 同上。**チャート全体の軸文字色の定義元**なので、ここ1箇所の修正が広く効く       |
| `apps/web/.../sites/[siteId]/rank/rank-math.ts:70`         | `lost: "text-text-faint"`                                    | 順位が「圏外に落ちた」という**状態を伝える**色。意味を持つ                      |
| `apps/web/.../rank/rank-view.tsx:62`                       | `text-xs text-text-faint` — 「データなし」                   | Empty 状態の説明文。読ませる                                                    |
| `apps/web/.../rank/rank-view.tsx:101`                      | `text-[11px] text-text-faint` — メタ情報                     | 読ませる                                                                        |
| `apps/web/.../notifications/notifications-view.tsx:305`    | `text-[11px] text-text-faint`                                | 通知のメタ情報。読ませる                                                        |
| `apps/web/app/(marketing)/layout.tsx:89`                   | フッターのコピーライト                                       | 読ませる。11px と小さいぶん色は濃くする必要がある                               |
| `apps/web/components/shell/app-sidebar.tsx:53`             | `text-[10px] uppercase tracking-[0.05em]` — セクション見出し | 見出しラベル。10px + 大文字 + 字間広めで既に読みにくく、特に重要                |
| `apps/web/components/shell/app-header.tsx:33`              | `text-[11.5px]` — パンくず                                   | 現在位置を伝えるナビゲーション。読ませる                                        |
| `apps/web/app/(marketing)/pricing/pricing-content.tsx:100` | `text-[11px]` — 料金の注記                                   | 課金条件の注記。読めないと利用者の不利益になりうる                              |
| `apps/web/app/(marketing)/pricing/pricing-content.tsx:117` | `text-xs` — 中央の注記                                       | 同上                                                                            |
| `apps/web/components/report-detail/report-detail.tsx:94`   | `text-[11px]` — レポート脚注                                 | 読ませる                                                                        |
| `apps/web/components/report-detail/improve-tab.tsx:383`    | 「GSC 未連携」                                               | 連携状態を伝える。意味を持つ                                                    |
| `apps/web/components/report-detail/improve-tab.tsx:636`    | `text-[10px]` — 補足ラベル                                   | 読ませる                                                                        |

### 2.2 `fg.muted` へ（データとしての数値）— 1 箇所

| ファイル:行                                             | 現在の使われ方                                                               | なぜ                                                                                                                                                                                                           |
| ------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/components/report-detail/improve-tab.tsx:697` | `<span className="text-text-faint">{item.before ?? "—"}</span>` — 改善前の値 | 「改善前 → 改善後」の**比較の片側**。薄いのは「古い値」を示す意図だが、**値そのものは読ませる必要がある**。色の濃淡だけで新旧を区別せず、ラベル（「現在」「改善後」）を併記すること（原則2: 色だけで伝えない） |

### 2.3 `fg.decorative` へ（純装飾）— 3 箇所

| ファイル:行                                           | 現在の使われ方                                                                     | なぜ `fg.decorative` か                                                                                   |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `apps/web/components/shell/org-switcher.tsx:30`       | `<span aria-hidden className="text-text-faint">`                                   | **`aria-hidden` が明示されている**。支援技術から隠された純粋な飾り。判定基準1に該当する唯一の確実なケース |
| `apps/web/components/shell/app-sidebar.tsx:80`        | `flex size-4 ... text-text-faint group-hover:text-text-light` — ナビ項目のアイコン | 隣に必ずテキストラベルがある冗長表現。アイコン単独で意味を担っていない                                    |
| `apps/web/components/states/permission-denied.tsx:21` | `bg-surface-200 text-lg text-text-faint` — 権限なし状態のアイコンチップ            | Empty/Error 状態の飾りアイコン。意味は隣接する説明文が担う                                                |

> **`app-sidebar.tsx:80` は要確認**：非アクティブなナビアイコンが `fg.decorative`（3:1）で
> 足りるかは、そのアイコンが「押せる場所」を示す唯一の手がかりになっていないかによる。
> ラベルが常に見えている前提が崩れる（アイコンレールへ折りたたむ等）なら WCAG 1.4.11 の
> 対象になるため `fg.muted` へ上げること。仕様書 §4.5 の `IconRail` を作る際に再判定する。

### 2.4 `fg.placeholder` / `fg.disabled` へ — **0 箇所**

本番コードに該当なし。`docs/planning/25_design_system.md:75` は `--text-faint` の用途を
「軸ラベル・プレースホルダ・無効」と説明しているが、**実際のコードではプレースホルダにも
無効状態にも `--text-faint` は使われていなかった**。文書上だけの用途であり、
分離時にこの2用途の記述は削除してよい。

---

## 3. プロトタイプ（22 箇所 / `docs/prototypes/ibuki_prototype.html`）

**このファイルは移行対象ではなく廃止対象。** 仕様書 §6 で単一HTMLプロトタイプは廃止し、
Storybook の composition story に置き換えることが決まっている。個別に置換せず、
Storybook で組み直す際に下表の分類を参照する。

| 行           | 使われ方                             | 移行先                                                                                       |
| ------------ | ------------------------------------ | -------------------------------------------------------------------------------------------- |
| 20 / 30 / 40 | 3テーマの `--text-faint` 定義本体    | 定義ごと削除                                                                                 |
| 87           | `.proto-nav a .dot` の背景           | `fg.decorative`                                                                              |
| 189          | `.side .org .cv`                     | `fg.muted`                                                                                   |
| 191          | `.side nav .sec`（セクション見出し） | `fg.muted`                                                                                   |
| 193          | `.side nav a .ic`（アイコン）        | `fg.decorative`                                                                              |
| 202          | `.apphead .crumb`（パンくず）        | `fg.muted`                                                                                   |
| 233          | `.toast .tx`（閉じる操作）           | `fg.muted`。**操作可能な要素なので装飾扱いにしないこと**                                     |
| 295          | `.ob-dot.todo` の文字色              | `fg.decorative`                                                                              |
| 482          | 区切りの「または」                   | `fg.muted`                                                                                   |
| 742 / 1822   | 目標線（`stroke-dasharray="4 4"`）   | `dataViz.axis-default` + `dataVizDash.reference`                                             |
| 749 / 1827   | 「目標 80」ラベル                    | `fg.muted`                                                                                   |
| 785          | 散布図の点（現在値）                 | `dataViz.categorical-neutral-previous`                                                       |
| 788 / 789    | 「現在」「改善後」ラベル             | `fg.muted`                                                                                   |
| 811 / 819    | 軸の目盛り線                         | `dataViz.axis-default`                                                                       |
| 854 / 870    | 軸ラベル群                           | `fg.muted`                                                                                   |
| 1110 / 1111  | 大きな現在値「46」と矢印「→」        | 数値は `fg.muted`、矢印は `fg.decorative`                                                    |
| 1772–1776    | 改善前スコア（5 行）                 | `fg.muted`（2.2 と同じ理由）                                                                 |
| 1933         | 「Powered by Ibuki」                 | `fg.muted`                                                                                   |
| 2025         | 「前月 34 → 今月 46」の前月値        | `fg.muted`                                                                                   |
| 2107         | レポート自動生成の注記               | `fg.muted`                                                                                   |
| 2248         | 404 の大きな数字                     | `fg.muted`（大サイズなので WCAG 上は 3:1 でも可だが、意味を持つ数字なので 4.5:1 側に寄せる） |

---

## 4. 定義側（8 箇所）— 削除する

| ファイル:行                                     | 内容                                                         | 対応                                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `tooling/tailwind/theme.css:37`                 | Light の `--text-faint: #b0b0b0`                             | 削除。`--text-light` / `--text-muted` は alias-ibuki.css が供給する                      |
| `tooling/tailwind/theme.css:107`                | Dark の `--text-faint: #6b6b6b`                              | 削除                                                                                     |
| `tooling/tailwind/theme.css:171`                | Deep-dark の `--text-faint: #5c5c5c`                         | 削除                                                                                     |
| `tooling/tailwind/theme.css:259`                | `--color-text-faint: var(--text-faint)`（Tailwind ブリッジ） | 削除。これを消すと `text-text-faint` クラス自体が消えるため、2章の未対応箇所が洗い出せる |
| `docs/planning/25_design_system.md:75`          | 「Text Faint（`#b0b0b0`）: 軸ラベル・プレースホルダ・無効」  | §0.7 の4分割に書き換え                                                                   |
| `docs/prototypes/ibuki_prototype.html:20/30/40` | 3テーマの定義                                                | 3章のとおりファイルごと廃止                                                              |

---

## 5. 実施順序の推奨

1. **`packages/ui/src/charts/palette.ts:24` を最初に直す。** チャートの軸文字色の定義元で、
   1箇所の修正が全チャートに効く。効果が最も大きい
2. `tooling/tailwind/theme.css:259` のブリッジを消す。`text-text-faint` クラスが消えるので、
   2章の未対応箇所がビルド／目視で洗い出せる
3. 2章の残りを、表の移行先どおりに1ファイルずつ直す
4. `grep -rn "text-faint"` がゼロになったら `tooling/tailwind/theme.css` の3定義を削除する
5. `apps/web` の a11y テスト（`test/a11y-e2e/a11y.spec.ts`）を**3テーマ全部**で回す。
   報告書 Q9 のとおり現行の Alfa ルールは WCAG 2.2 A/AA 紐づきのみ blocking なので、
   本文・placeholder・disabled・軸ラベル・コントロール境界の個別 fixture を
   追加してから判定する
