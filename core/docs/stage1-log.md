# @kedama-design/core 段1 設計記録

- 枝: `feat/core-stage1`（Orca の worktree。main = 263187c から）
- 実装担当: Claude Opus（Orca の worker）。指示役は別のセッション
- 結果の一覧は [`stage1-report.md`](./stage1-report.md)
- この記録に出てくるコミット（e26a738〜63c51bf の8つ）は手元の作業用コミット。公開の前に、手元のフォルダの場所を記録から消し、1つのコミット（98faca4）にまとめた（yuuki 決定 2026-11-14）。main への統合（PR #2、b3408a7）のあと、まとめる前の8つのコミットの枝は消した（yuuki 決定 2026-11-14）。記録の中のコミット番号は、その消した枝のもの

## 1. 設計（指示役の設計案の写し）

指示役の設計案（Codex 着手前レビューの反映 R1・R2・P1〜P5' を含む）を本文のまま写す。見出しの段だけ1つ下げた。
prettier（このファイルは prettier の対象）で表の空白がそろえられることがある。

## 設計案：@kedama-design/core 段1（2026-11-13、指示役 Claude Opus）

指示書: 無知総研「けだまポータル共通UI 段1 指示書」（2026-11-13）
計画: 無知総研「けだまポータル共通UI 集約計画」（2026-11-13）

リポジトリ: KedamaDesignSystem（main = 263187c）。作業は枝 `feat/core-stage1`（Orca の別 worktree、Dropbox の外）。

### 移す元（読むだけ。変更禁止）

- ガイドライン: `スラスラスタジオ/ui-guidelines`
  （README.md, docs/01〜07, tokens/tokens.json, tokens/tokens.css, icons/\*.svg 8, images/\_.png 6, mockups/\*.html 4）
- 部品: `登記議事録つくるさん/_dev/src/ui`
- テスト: 同 \_dev/test（部品に関わるもの: uitokens, uicss, uimotion, uiparts, ui8b の dateinput 部分 など）

### yuuki の決定（2026-11-13、この段で確定）

| #   | 項目               | 決定                                                                                                                                                                                                                                                          |
| --- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | ガイドラインの場所 | 上記 ui-guidelines。core/guidelines/ に**写す**（元は変えない）。以後 core 側が正                                                                                                                                                                             |
| D2  | パッケージ名       | `@kedama-design/core`                                                                                                                                                                                                                                         |
| D3  | 公開先             | npm の公開レジストリ（registry.npmjs.org, access public）。**この段では公開しない**。名前の確保・アカウントは yuuki                                                                                                                                           |
| D4  | リポジトリ         | 非公開のまま                                                                                                                                                                                                                                                  |
| D5  | notice.js          | **移さない**（登記の `src/reason.js` に依存し、製品の文言を含む）。「移さなかったもの」に載せる                                                                                                                                                               |
| D6  | 入力欄の枠         | `--ui-border-input: #8a8983` は tokens.css に**値として入れる**が、components.css の入力枠は**今の `--ui-border-high`（#d6d4cd）のまま**。ガイドライン（3:1）との食い違いとして記録                                                                           |
| D7  | 純白               | core でも `#ffffff` を使わない。`--ui-surface-page` と `--ui-action-secondary` は `#fffefc`。core/guidelines の tokens.json・tokens.css・docs/03 の表・icons/\*.svg（白い線 `#ffffff`）も `#fffefc` に直し、guidelines/README.md の決定の表に日付と理由を記録 |
| D8  | コミット           | 実装担当が作業枝にコミットしてよい。push・main 統合は yuuki                                                                                                                                                                                                   |
| 既  | 指示書の決定       | Calm UI はこの段で触らない／Apache-2.0／接頭辞 `tsk-` 不変／Sparkle は参考のみ                                                                                                                                                                                |

### 置き場所

```
core/
  package.json        name, version 0.1.0, type module, license Apache-2.0,
                      dependencies/devDependencies なし, sideEffects ["*.css"],
                      exports（各 CSS/JS/tokens.json/icons を個別に列挙）, files（下記の配る物だけ）,
                      publishConfig { registry: https://registry.npmjs.org, access: public },
                      scripts.test = node --test（Node 22 で動く書き方）
  LICENSE             Apache-2.0 全文
  README.md           使い方（CSS の読み込み順、JS、単一 HTML への取り込み）、公開の手順（実行しない）
  ui/                 tokens.css, base.css, components.css, motion.js, toast.js, drawer.js, dateinput.js, icons.js
                      （登記の src/ui と同じファイル名。段3で写し戻しやすくする）
  guidelines/         ガイドラインの写し（README, docs, tokens, icons, images, mockups）＋ SOURCE.json（元の各ファイルの sha256 と写した日）
  examples/index.html 全部品・全状態の見本（React/Tailwind なし。ui/ を相対で読む）
  test/*.test.mjs     node:test。依存なし
  docs/stage1-log.md  設計記録（決定・変更・検証・レビュー・未解決）
  docs/stage1-report.md 移さなかったもの＋理由、登記との値の差、DERIVED 表
```

npm に入れる物（files）: ui/, guidelines/tokens/tokens.json, guidelines/icons/, README.md, LICENSE。
guidelines の docs・images・mockups（社内向け記述を含む）は**入れない**。`npm pack --dry-run` で確認する。

### 値（core/ui/tokens.css）

- 出発点は登記の src/ui/tokens.css。名前は `--ui-*` のまま。:root は1つ。色の値を書いてよいのはこのファイルだけ
- 移さない（製品だけ）: `--ui-content-w` `--ui-list-w` `--ui-actionbar-h` `--ui-paper-preview-w` `--ui-paper-preview-min-h` `--ui-line-height-reading`
  - 注: `--ui-line-height-reading` 1.9 は guidelines docs/07 にも記述あり。指示書どおり移さず、報告に書く
- 足す: `--ui-border-input: #8a8983`（ガイドライン v1.1）
- 変える: `--ui-surface-page` `--ui-action-secondary` = `#fffefc`（D7）
- 主ボタン（自前の名前・自前の決め方。Sparkle の値は使わない）:
  - `--ui-action-primary-hover` = インク `#26251f` を白へ 12% 混ぜる = `#403f3a`
  - `--ui-action-primary-active` = インクを黒へ 25% 混ぜる = `#1d1c17`
  - 決め方: sRGB 8bit の各成分で `c + (255 - c) * t`（白へ）／`c * (1 - t)`（黒へ）。**0.5 は切り上げ**（Math.round）。偶数丸めだと active は `#1c1c17` になるため明記
- 正は core/guidelines/tokens/tokens.json。tokens.css の値が tokens.json と一致することをテストで確かめる（値はテストに書き写さず、両方を読んで比べる＝登記 uitokens と同じ考え方）
- ガイドラインに無い値・解釈した値は DERIVED 表（理由つき）に載せ、テストも同じ表を使う: `--ui-scrim`、hover/active（決め方つき）、`--ui-rail-item`（"40px（角丸10px）" の解釈）、`--ui-row-h`（"約44px"）、`--ui-control-h-md`（"32〜36px" から 36px）、`--ui-space-N` の名前付け など

### ガイドラインの写し（core/guidelines/）

- 元のファイルを sha256 つきで SOURCE.json に記録してから写す（.DS_Store は写さない）
- 写したあと直すもの（直したファイルは SOURCE.json に「直した」と理由を書く）:
  - tokens/tokens.css: 後半の「Sparkle Design への上書き案」の :root 塊を削除。冒頭コメントの Sparkle の説明も外す（経緯は README に残る）
  - tokens.json / tokens.css / docs/03 / icons/\*.svg: `#ffffff` → `#fffefc`（D7）。tokens.json の contrastOnWhite は #ffffff での値なので、その旨の注記を足す（値は消さない）
  - README.md: 決定の表に 2026-11-13 の D6・D7 と「正は KedamaDesignSystem/core に移った」を追記。「Sparkleに寄せる」前提の記述が残っていれば外す（使わなかった経緯は残してよい）
- images/mockups は写すだけ（直さない。純白が写っているが参考資料）

### 部品（core/ui/）

- base.css, components.css, motion.js, toast.js, drawer.js, dateinput.js, icons.js を写す。**振る舞い・セレクタ・書式は変えない**（段3で登記の正規表現のテストがそのまま通るように。prettier もかけない）
- 直してよいのはコメントだけ: 製品の文脈（案件・役員・株主・会社マスタ・DADS・D-xx・段UI-x）を一般的な言葉に直す。出典は README に1か所でまとめる
- 帳票・配布物の上限など製品だけの規則が混じっていたら移さず、stage1-report.md に一覧で載せる。迷うものは移したうえで「要判断」として載せる
- notice.js は移さない（D5）。toast.js / drawer.js は notice.js を import していないことを確認する

### テスト（core/test/、node:test、依存なし）

- tokens: tokens.css と tokens.json の一致、SOURCE.json の sha256（直していない写しが元と同じ）、DERIVED 表、製品だけの6つが無いこと、純白が core のどこにも無いこと（examples と guidelines/images・mockups を除く）
- action: hover/active が決め方どおり、on-primary（#fffefc）とのコントラスト ≥ 4.5（WCAG の式で計算）
- contrast: 文字・状態色・border-input の、--ui-surface-page に対するコントラストを計算して表に出す（text-low ≥ 4.5 など。ガイドラインの数値と大きくずれないこと）
- css: クラスは `tsk-` で始まる、色の値は tokens.css だけ（components.css/base.css/JS に色の literal が無い）、使っている `--ui-*` がすべて tokens.css にある
- motion / toast / drawer / icons / dateinput: 登記の uimotion・uiparts・ui8b から部品だけの部分を移す（作り物の DOM はテストの中に持つ）
- 登記のテストの中の製品の部分（画面・帳票・reason.js）は移さない

### 既存パッケージを壊さないための設定（src/ には触らない）

- vitest.config.ts: test.exclude に `core/**`（configDefaults.exclude に足す）
- .prettierignore: `core/ui/` と `core/guidelines/`（理由: 段3で登記へ写し戻す・写しを変えない）。他の core のファイルは prettier に従う
- eslint.config.js: core の JS を lint できるならブラウザの globals で通す。無理なら ignores に入れて理由を記録
- tsconfig は src/scripts/tests だけなので変更不要
- ルートの package.json は変えない（files が dist だけなので core は既存の tarball に入らない）
- CI（ci.yml）: 「Core tests」の段を足す（`cd core && npm test`、Node 22.22.1）。release.yml は変えない（core を公開しない）

### 文書

- core/README.md（D3 の公開手順は「人が行う」として書く）
- CLAUDE.md と AGENTS.md に core の決まり: 依存を持ち込まない／色は core/ui/tokens.css だけ／正は core/guidelines（tokens.json）／純白は core でも使わない（#fffefc）／接頭辞 tsk-／Sparkle は土台にしない／部品を直すときは core を先に直して登記へ写す

### 完了の条件と証拠

1. core のテストが全部通る（出力を記録）
2. 既存の `pnpm lint` `pnpm format:check` `pnpm typecheck` `pnpm test` `pnpm build` が、着手前（main）と後で同じ結果
3. examples/index.html を簡易サーバで開き、React/Tailwind なしで全部品が表示される画面を撮る
4. `npm pack --dry-run`（core）で配る物を確認
5. stage1-report.md: 移さなかったもの＋理由、登記との値の差（見込み: hover, active, surface-page, action-secondary の4つ＋使わない値 border-input の追加）

### 捨てた代替案

- core をルートの pnpm workspace にする → ルートの install・lockfile に触れ、既存パッケージに波及するので見送り
- core/ui を prettier で整形 → 段3で登記の文字列ベースのテストが壊れうるので見送り
- core/src という名前 → ルートの src/ と紛らわしく、登記の src/ui と対応させるため ui/ にした

### 着手前レビュー（Codex、effort high、2026-11-13 13:55）の反映

判定: 「指摘2件を反映すれば着手可」。全文: review-pre-result.md（下記を設計案の一部とする）

#### 指摘（反映済み・必須）

- R1 純白の検査は「色として使う値」に限る: CSS の宣言値、tokens.json の色の値（`value` / `on` / `border` など色を持つ欄）、SVG の描画属性（fill/stroke/stop-color など）を検査する。説明・注記・変更記録・テスト自身の文字列は対象外。tokens.json に注記を足すなら `$note` のように色の走査が拾わない欄にする
- R2 ブラウザでの解決値を記録する（AGENTS.md「grep で判定しない、getComputedStyle で読む」）: examples に実測の仕組み（例: examples/audit.html か index.html の実測の節）を作り、少なくとも 主ボタンの通常・hover・active の背景、副ボタンの地、本文の面、入力・select の枠、状態アイコンの線（mark）の色 を getComputedStyle で読み、stage1-log.md に表で記録。hover・active は状態を強制する方法（クラスや :hover をまねる仕組みが部品に無ければ、テスト用に同じ規則を当てた要素で測る等、方法を記録）。D6 について「実際に使う border-high は面に対し約1.47:1、使わない border-input は約3.48:1」を実測値で記録する

#### 改善提案（採用）

- P1 ESLint: core を lint 対象に含める。uiparts 由来の `no-this-alias` 2件はテスト側を書き換えて解消するのが第一候補。無理なら `core/test/` に限ったルール例外（理由を記録）。core 全体の除外はしない
- P2 テストの切り出し: uimotion・uiparts は丸ごと。ui8b は 89〜110 行の dateinput の2テストだけ。uicss は帳票との衝突検査・製品のビルド・製品 CSS の走査を外す。「tsk- で始まる」は部品の基本クラスを対象にし、`is-*` 状態クラスと base.css の要素セレクタは許す（登記の uicss と同じ扱い）。テストの補助ファイルを作るなら `*.test.mjs` に当たらない名前にし、`node --test` の対象パターンを明示する
- P3 配布物からの確認: `npm pack` した tarball を一時ディレクトリに展開し、package.json の exports の行き先がすべて存在すること、tarball の中だけで JS の相対 import が解決すること（node で import してみる。DOM を触らない motion.js/icons.js/dateinput.js で可、toast/drawer は import が通ることだけ）をテスト化か記録
- P4 ライセンス: LICENSE は Apache-2.0 全文。各 CSS/JS の先頭に `SPDX-License-Identifier: Apache-2.0` の1行を付ける。**著作権者の名前と年は人が決める**ので、README に「著作権表示は未決（yuuki に確認）」と書き、勝手に名前を入れない。NOTICE は作らない（移す元に第三者の NOTICE が無いことを確認して記録）
- P5 コントラストの合否を数値で: 新しい面（#fffefc）に対し text-high/middle/low ≥ 4.5、status-\* ≥ 3.0、action on-primary と hover/active ≥ 4.5。ガイドラインの contrastOnWhite との差は ±0.05 以内（#ffffff 上で計算し直して照合）を別テストに。D6 の border-high（約1.47）と border-input（約3.48）は記録のみ
- P5' 差の記録: ガイドライン docs/07「prefers-reduced-motion では 0」に対し、部品は 200ms の透明度のフェード（toast.js 158行・drawer.js 18行）。段1では振る舞いを変えず、stage1-report.md の「ガイドラインとの差」に記録

## 2. 着手前の基準（main = 263187c、2026-11-13）

| コマンド            | 結果                                               |
| ------------------- | -------------------------------------------------- |
| `pnpm lint`         | 通過                                               |
| `pnpm format:check` | 通過（All matched files use Prettier code style!） |
| `pnpm typecheck`    | 通過                                               |
| `pnpm test`         | 通過（Test Files 27 passed / Tests 716 passed）    |
| `pnpm build`        | 通過（Tier 2 package boundary: clean）             |

移す元の sha256 は作業の前に記録した（6章）。

## 3. 判断と変更（実装中）

### 3.1 枝・コミット

- 枝名を `Kedama-Yuuki/core-stage1` → `feat/core-stage1` に直した（main には何もしていない）
- **食い違い**: AGENTS.md の「エージェントはコミット・push を行わない」と、決定 D8（作業枝へのコミットは可）。D8 は yuuki の新しい決定で、この worktree は Dropbox の外にあり AGENTS.md の理由（ブリッジ経由の git の問題）に当たらないので、D8 に従ってコミットした。push はしていない。AGENTS.md の書き方を直すかは報告の「人に決めてほしいこと」に載せた

### 3.2 ガイドラインの写し（core/guidelines）

- `.DS_Store` を除く 28 ファイルを写し、元の sha256 を `guidelines/SOURCE.json` の `files` に記録してから直した
- 直した6ファイル（`SOURCE.json` の `modified` に理由）: README.md、tokens/tokens.css、tokens/tokens.json、docs/03\_色と書体.md、icons/status-approved.svg、icons/publish-failed.svg
  - tokens.css: Sparkle Design への上書き案の `:root` を削除。冒頭のコメントを直した。`--ui-surface-page` を `#fffefc`
  - tokens.json: `surface.page`・`action.secondary.value` を `#fffefc`。`$note` に「contrastOnWhite は純白の地での値」と注記（R1。`$` で始まる欄は色の走査に入らない）
  - docs/03: 色の表の本文の面を `#fffefc`
  - icons: 白い線 `stroke` を `#fffefc`（白を持っていたのはこの2つだけ）。**埋め込みの C2PA の来歴情報（`<metadata>`）は残した**ので、その中のハッシュとはもう一致しない（報告の「人に決めてほしいこと」）
  - README: 決定の表に 2026-11-13 の4行（正の置き場所・純白・入力欄の枠の部品での扱い・他の部品集の扱い）。冒頭に「正は core/guidelines に移った」
- images・mockups は写しただけ（純白が写っているが参考資料）。docs/05 と README の「Sparkle Design は使わない」は経緯として残した

### 3.3 部品（core/ui）

- 登記の `_dev/src/ui/` から base.css・components.css・motion.js・toast.js・drawer.js・dateinput.js・icons.js を写した。notice.js は写していない（D5）
- 直したのはコメントと、各ファイルの1行目の SPDX の行だけ。**コメントを外したコードは登記と完全に同じ**であることを、ブロックコメントと行頭の `//` を外して比べて確認した（7ファイルとも一致。行数は SPDX の1行ぶんだけ増えた）。**2026-11-14 に components.css の入力・選択の枠を意図して変えた**ので、それ以降は components.css の4行（枠の2行・重ねたときの規則2行）が登記と違う（10章）
- 製品だけの規則は見つからなかった。製品寄りの5つを「要判断」として報告に載せた
- `ui/tokens.css` は登記の tokens.css を出発点に、製品だけの6つを除き、`--ui-border-input` を足し、hover・active・面・副ボタンの地を直した

### 3.4 テスト（core/test、node:test、依存なし）

| ファイル                            | 件数の目安 | 中身                                                                                                                                                                                                                                                  |
| ----------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tokens.test.mjs`                   | 19         | 写しの sha256（直していないものは元と同じ・直したものは理由があり実際に違う）、ガイドラインとの一致、DERIVED、製品だけの6つが無い、純白を色として使わない（R1: CSS の宣言値・tokens.json の value/on/border・SVG の描画属性。検出の道具のテストつき） |
| `action.test.mjs`                   | 5          | hover・active が決め方どおり（値はテストに書かず tokens.css を読む）、on-primary とのコントラスト ≥ 4.5、丸め方（0.5 切り上げ）                                                                                                                       |
| `contrast.test.mjs`                 | 4          | P5: 本文の面に対し文字 ≥ 4.5・状態 ≥ 3.0、contrastOnWhite を純白で計算し直して ±0.05、D6 の比は記録だけ                                                                                                                                               |
| `css.test.mjs`                      | 7          | 色は tokens.css だけ、変数は tokens.css にある、components.css は .tsk- から（is-\* は可）、base.css は決まった6つの要素セレクタ、@import 等が無い、間隔の px の直書きの例外の表（部品の分を移した）                                                  |
| `motion.test.mjs`・`parts.test.mjs` | 45         | uimotion・uiparts を丸ごと移した（P2）。読む場所と、ESLint の `no-this-alias` に当たる2か所（`const self = this` → アロー関数で this、`for (let n = this; …)` → `[this]` から親へ）だけ変えた（P1。ルールの例外は作っていない）                       |
| `dateinput.test.mjs`                | 3          | ui8b の 89〜110 行の2テスト＋描き方の決まり1つ                                                                                                                                                                                                        |
| `package.test.mjs`                  | 9          | 依存が無い、exports の行き先が実在し files に入る、ui とアイコンがすべて exports にある、files は配る物だけ、LICENSE 全文、SPDX の行、著作権者を書かない・NOTICE を作らない                                                                           |

- 補助は `test/helpers.mjs`（`*.test.mjs` に当たらない）。`npm test` は `node --test test/*.test.mjs`（P2）
- DERIVED の表は `helpers.mjs` の1か所にあり、報告の表に名前が全部載っていることもテストする

### 3.5 パッケージ

- `core/package.json`: 名前 `@kedama-design/core`、0.1.0、ESM、Apache-2.0、依存なし、`sideEffects: ["*.css"]`、exports を個別に列挙（CSS 3・JS 5・tokens.json・アイコン 8・package.json）、publishConfig（registry.npmjs.org・public）
- **files の修正**: `npm pack` で確かめたところ、npm は README をどのフォルダでも必ず入れるため、**`guidelines/README.md`（社内向けの記述）が tarball に入っていた**。`files` に `!guidelines/README.md` を足して外した（P3 の確認で見つかった）
- `repository` は書いていない（リポジトリは非公開＝D4）
- LICENSE は apache.org の LICENSE-2.0.txt と同じもの（sha256 `cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30`。node_modules の中にあった同じ中身の写しから取った）。著作権者の名前は書いていない（P4）。移す元に第三者の NOTICE・LICENSE は無かった（`find` で確認）ので NOTICE は作らない
- `scripts/verify-pack.mjs`（`npm run verify:pack`）: P3 の確認をスクリプトにした（7章）

### 3.6 ルートの設定（src/・ルートの package.json・pnpm-lock.yaml・release.yml は変えていない）

- `vitest.config.ts`: `test.exclude` に `[...configDefaults.exclude, 'core/**']`（vitest の既定の include が `core/test/*.test.mjs` に当たるため）
- `.prettierignore`: `core/ui/`・`core/guidelines/`（理由のコメントつき）
- `eslint.config.js`: **変えていない**。core の JS（ui の5つ・test の9つ・scripts の1つ、計15）はいまの設定のまま lint され、エラー 0（P1。no-this-alias はテストの書き方で解消。ブラウザの globals は不要だった＝部品は `globalThis.document` を使う）
- `.github/workflows/ci.yml`: Test の後に「Core tests」（`working-directory: core`、`npm test`。Node は既存の 22.22.1）
- CLAUDE.md・AGENTS.md: 「core」の決まりの節と、ディレクトリ構造に core/ を足した

### 3.7 見本のページ（core/examples/index.html）

- `../ui/` の CSS と JS だけを相対で読む（React・Tailwind なし）。全部品・全状態を並べ、`?show=dialog|toasts|drawer` で重なる部品を開いた状態にできる
- hover・active・focus の見せ方（R2 の「状態を強制する方法」）: ページの JS が、読み込んだ base.css・components.css の規則のうち `:hover`・`:active`・`:focus-visible` を含むものを `document.styleSheets` から読み、その部分を `[data-force~="hover"]` などに読み替えた**同じ宣言の規則**を後ろに足す（20規則）。詳細度は `:hover` と属性セレクタで同じ。部品の CSS の写しを手で書かないので、測るのは実物の規則の宣言。限界: 足した規則は元より後ろに来るので、`:disabled` など同じ詳細度で後ろにある規則との勝ち負けは実物と違いうる（無効の要素には当てていない）
- 実物の hover・active との照合: Orca のブラウザで主ボタンに本当にマウスを重ねる・押すと、`:hover`／`:active` が true で地は `rgb(64, 63, 58)`／`rgb(29, 28, 23)`。読み替えた規則の実測と同じ

## 4. 検証

### 4.1 core のテスト

`cd core && npm test`（Node 22.22.1）: **92 件すべて通過**（suites 17。motion 10・parts 35・tokens 19・package 9・css 7・action 5・contrast 4・dateinput 3）。

### 4.2 解決値の実測（R2。getComputedStyle）

Orca の内蔵ブラウザ（Chrome 150）で `http://127.0.0.1:8931/examples/index.html`（`python3 -m http.server`）を開き、ページの実測の節が出した値（`window.__audit`）。期待は `getComputedStyle(document.documentElement).getPropertyValue('--ui-…')`。

| 測ったもの                         | 要素・性質                                    | 実測                 | 期待（トークン）                         | 結果 |
| ---------------------------------- | --------------------------------------------- | -------------------- | ---------------------------------------- | ---- |
| 主ボタン 通常の地                  | `#m-primary background-color`                 | `rgb(38, 37, 31)`    | `--ui-action-primary = #26251f`          | 一致 |
| 主ボタン 通常の文字                | `#m-primary color`                            | `rgb(255, 254, 252)` | `--ui-action-on-primary = #fffefc`       | 一致 |
| 主ボタン hover の地                | `#m-primary-hover background-color`           | `rgb(64, 63, 58)`    | `--ui-action-primary-hover = #403f3a`    | 一致 |
| 主ボタン hover の枠                | `#m-primary-hover border-top-color`           | `rgb(64, 63, 58)`    | `--ui-action-primary-hover = #403f3a`    | 一致 |
| 主ボタン active の地               | `#m-primary-active background-color`          | `rgb(29, 28, 23)`    | `--ui-action-primary-active = #1d1c17`   | 一致 |
| 主ボタン active の枠               | `#m-primary-active border-top-color`          | `rgb(29, 28, 23)`    | `--ui-action-primary-active = #1d1c17`   | 一致 |
| 副ボタンの地                       | `#m-secondary background-color`               | `rgb(255, 254, 252)` | `--ui-action-secondary = #fffefc`        | 一致 |
| 副ボタンの枠                       | `#m-secondary border-top-color`               | `rgb(214, 212, 205)` | `--ui-action-secondary-border = #d6d4cd` | 一致 |
| 本文の面（カード）                 | `#m-card background-color`                    | `rgb(255, 254, 252)` | `--ui-surface-page = #fffefc`            | 一致 |
| 本文の面（表の枠）                 | `#m-table background-color`                   | `rgb(255, 254, 252)` | `--ui-surface-page = #fffefc`            | 一致 |
| 本文の面（小窓）                   | `#m-dialog background-color`                  | `rgb(255, 254, 252)` | `--ui-surface-page = #fffefc`            | 一致 |
| 入力の地                           | `#m-input background-color`                   | `rgb(255, 254, 252)` | `--ui-surface-panel = #fffefc`           | 一致 |
| 入力の枠（D6: border-high のまま） | `#m-input border-top-color`                   | `rgb(214, 212, 205)` | `--ui-border-high = #d6d4cd`             | 一致 |
| 入力の枠 hover                     | `#m-input-hover border-top-color`             | `rgb(163, 162, 155)` | `--ui-text-disabled = #a3a29b`           | 一致 |
| 入力の枠 誤り                      | `#m-input-invalid border-top-color`           | `rgb(196, 71, 58)`   | `--ui-status-danger = #c4473a`           | 一致 |
| 選択の枠（D6: border-high のまま） | `#m-select border-top-color`                  | `rgb(214, 212, 205)` | `--ui-border-high = #d6d4cd`             | 一致 |
| 状態アイコン 完了の円              | `#m-status-success [data-part="fill"] fill`   | `rgb(63, 138, 90)`   | `--ui-status-success = #3f8a5a`          | 一致 |
| 状態アイコン 完了の線（mark）      | `#m-status-success [data-part="mark"] stroke` | `rgb(255, 254, 252)` | `--ui-surface-page = #fffefc`            | 一致 |
| 入力欄の枠の値（見本の箱）         | `#m-probe-input border-top-color`             | `rgb(138, 137, 131)` | `--ui-border-input = #8a8983`            | 一致 |

- 19 件すべて一致。読み替えた規則は 20 個。コンソールのエラーは 0
- **D6（実測の色どうしで計算）**: 入力の枠 `--ui-border-high` / 本文の面 = **1.47:1**、`--ui-border-input` / 本文の面 = **3.48:1**（border-input は部品が使っていないので、その値を当てた見本の箱で測った）。**2026-11-14 に入力・選択の枠を border-input に変えたので取り直した（10章）**
- 実物の hover・active（マウス）: 主ボタン hover `rgb(64, 63, 58)`、active `rgb(29, 28, 23)`（3.7 節）

### 4.3 スクリーンショット（core/docs/screenshots/）

| ファイル                           | 中身                                                                                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `01-parts-1.png`〜`01-parts-7.png` | 見本のページを上から順に（ボタン・入力・欄と日付・選択とチェック・状態のアイコン・チップと切り替え・カードと帯・表・手順・折りたたみ・小窓・実測の表） |
| `02-toasts.png`                    | トースト4種（エラー・完了・お知らせ・ボタンつき）                                                                                                      |
| `03-drawer.png`                    | ドロワー（見出し＋チップ・本文の欄・足もと）                                                                                                           |
| `04-dialog-modal.png`              | モーダルの小窓と覆い                                                                                                                                   |

- 撮り方: Orca の内蔵ブラウザ（`orca screenshot`）。Playwright の MCP は拡張が繋がらず使えなかった
- `orca full-screenshot` はこのページで上の部分を繰り返す画像になったので使わず、スクロールして画面ごとに撮った
- **このブラウザのタブは描画の合図（requestAnimationFrame）が1秒に約1回**だった（Orca の窓が前に無いため）。減衰ばねは1こま 0.032 秒で打ち切るので、止まるまで十数秒かかる。トースト・ドロワーは位置が 0 に止まったのを getComputedStyle で待ってから撮った（ドロワー 13 秒、トースト 17 秒）。部品の不具合ではない
- 動きを減らす設定（prefers-reduced-motion）の画面はこのブラウザで切り替えられず撮っていない（振る舞いは `parts.test.mjs` の作り物の DOM のテストで確認済み）

### 4.4 配布物からの確認（P3）

`npm run verify:pack`（`npm pack` → 一時ディレクトリに展開 → 中身・exports・パッケージ名での import）: **43 件すべて通過**。

- tarball: `kedama-design-core-0.1.0.tgz`、20 ファイル、33,863 bytes（展開 約 152 kB）
- 中身: package.json・README.md・LICENSE・ui の8ファイル・guidelines/tokens/tokens.json・guidelines/icons の8つ。docs・images・mockups・guidelines/README.md・test・examples・scripts は入っていない
- exports の 18 の行き先がすべて tarball にある
- tarball の中身だけを `node_modules/@kedama-design/core` に置き、`import('@kedama-design/core/motion.js')` などで読めた（motion・icons・dateinput は呼んで動作も確認、toast・drawer は相対 import を含めて読めた）。CSS・JSON・SVG を含む 17 の行き先を `import.meta.resolve` で解決できた
- 1回目は `guidelines/README.md` が余分に入っていて落ちた（3.5 節で直した）。そのときの一時ディレクトリ2つが OS の一時フォルダに残っている（`kedama-core-pack-QltmwM`・`kedama-core-pack-jLSN01`。リポジトリの外）

### 4.5 着手後の基準（手順0と同じ5つ）

| コマンド            | 着手前                         | 着手後                                                     |
| ------------------- | ------------------------------ | ---------------------------------------------------------- |
| `pnpm lint`         | 通過                           | 通過（core の15ファイルも lint されてエラー 0）            |
| `pnpm format:check` | 通過                           | 通過                                                       |
| `pnpm typecheck`    | 通過                           | 通過                                                       |
| `pnpm test`         | 27 files / 716 tests 通過      | 27 files / 716 tests 通過（core は vitest から外れている） |
| `pnpm build`        | 通過（package boundary clean） | 通過（package boundary clean）                             |

## 5. レビュー

- 着手前: Codex（effort high、2026-11-13 13:55）。指摘 R1・R2 と改善提案 P1〜P5' をすべて反映した（1章の末尾）
- 完了前: Codex（2026-11-13）。指摘3件・改善提案2件。対応は8章（全文は指示役の scratchpad の review-post-result.md）

## 6. 移す元を変えていない証拠（sha256）

作業の前（13:5x）と後（14:3x）に、移す元のフォルダ全体の sha256 を取って比べた（一覧は実装担当の scratchpad の `sha-*-before.txt`・`sha-*-after.txt`）。

- `スラスラスタジオ/ui-guidelines/`: 29 ファイル（.DS_Store を含む）。**前後で完全に同じ**。各ファイルの値は `guidelines/SOURCE.json` の `files`
- `Z-prj/登記議事録つくるさん/`（node_modules・.git を除く 9,789 ファイル）: 前後で違ったのは `CLAUDE.md` の1つだけ。これは**この作業ではなく**、登記のリポジトリのコミット `8e43872`（2026-11-13 14:09:55、「docs: 作り直し 段1 の受入を CLAUDE.md 6節に記録」）による変更。この作業で読んだ・写したファイル（下の表）は前後で同じ

| 読んだ・写したファイル（登記）       | sha256（前後で同じ）                                               |
| ------------------------------------ | ------------------------------------------------------------------ |
| `_dev/src/ui/base.css`               | `42bbc566115a99b3d34974bc8a63a5149debfc761913be3363721e58fa379cbe` |
| `_dev/src/ui/components.css`         | `8df57a760722a70aa90b91121e12c772063fa22871ab268e7b2ed607abfba6fe` |
| `_dev/src/ui/dateinput.js`           | `0d1d753c311ede88f47f60897cc8e406d45a7b56d92b9841303cbc27b5bfbf00` |
| `_dev/src/ui/drawer.js`              | `8605f2a682e8798f3d7119916fabbf7fd9c7cd81154210be53850c89203a33e6` |
| `_dev/src/ui/guidelines/SOURCE.json` | `da94b7e23d91fe4fee0dbd056b939c7c94ce562cb83808fdc3b140eb26983008` |
| `_dev/src/ui/guidelines/tokens.css`  | `eefaf2aeb03345156e2474be6a9954b5298cb29768130fd407fe36d325043975` |
| `_dev/src/ui/guidelines/tokens.json` | `36bdfa0118292ce81d2e67d8818e4620d159c117bb15ff11a600044f76e9b009` |
| `_dev/src/ui/icons.js`               | `8e60d9c9db729fc20de724b0501783604edf7a24200215ae06c0076cafdca522` |
| `_dev/src/ui/motion.js`              | `ea3cf19deb6428d3645936283f98a676c4f9ddee29cf544d6718b17949af4026` |
| `_dev/src/ui/notice.js`              | `53af7a9385f98e7d7ffd1ed4bc3b988f40cfecaad780b77d5502258c7f395b27` |
| `_dev/src/ui/toast.js`               | `7cb7e8a9e7a63e3a7840e6389507be2b78f1c1a2fb8b774ecc7337ae788cb09c` |
| `_dev/src/ui/tokens.css`             | `e5bd2293e653f58a62cad439146b1af53d02512be9b8ff985c8e7c727a912d00` |
| `_dev/test/ui8b.test.mjs`            | `cf1c0c42fd61bc9b315ecd16a31903d9e52d2e2d38ca413ebed72eea4aa44e6b` |
| `_dev/test/uicss.test.mjs`           | `4fb13484ba87365d840cee418cd8e3cf0301b748b525fad7c72d13a48694b558` |
| `_dev/test/uimotion.test.mjs`        | `879d6f7255ba02706162dfa982b038494f7ddc0fda8c9d9bc4946b92ec095de6` |
| `_dev/test/uiparts.test.mjs`         | `7cd3bb581123c1b676f0b8860518898990c01c9563921510b8797b98b30b1001` |
| `_dev/test/uitokens.test.mjs`        | `ba5ce9ec517506ac52577292590cd23b88d4e10d427eb26bffd28bb11a0d4c64` |

## 7. 未解決・残り

- 完了前のレビューの指摘への対応の確認（8章。指示役）
- push・main への統合（yuuki）
- 公開（npm publish）は人が判断する（手順は core/README.md）
- 報告の「人に決めてほしいこと」10項目

## 8. 完了前レビュー（Codex、2026-11-13）の指摘と対応

判定は「指摘3件の修正と再検証のあとに完了」。指示役の指示で、改善提案2件も採用した。

### 8.1 指摘（直すまで完了にしない）

| #   | 指摘                                                                                                                                                                                                         | 対応                                                                                                                                                                                                                                                                                                                                                            | 壊したら落ちることの確認                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | tokens.json と ui/tokens.css の照合に抜けがあった（角丸 sm〜2xl、外枠の topBarHeight・appRailWidth・sidebarWidth・rightPanelWidth が JSON と直接比べられておらず、ガイドラインの tokens.css 経由だけだった） | `test/helpers.mjs` の `fromJson` を `jsonChecks` に置き換えた。tokens.json の値の葉を**すべて JSON から直接読んで**照合する（色・書体・大きさ・太さ・余白・角丸・外枠・影）。照合しない葉は `JSON_LEAVES_ELSEWHERE` に理由つきで載せ（controlHeight.md は範囲、space.scale は 4 の倍数を検査）、どちらにも無い葉が増えると落ちる                                | テストの中で JSON を1か所ずつ壊す9通り（radius.sm を 7px、radius.2xl、topBarHeight を 41px、appRailWidth、sidebarWidth、rightPanelWidth、surface.page、space.values、elevation）が、すべて食い違いとして検出される。加えて、core の写しの tokens.json を実際に radius.sm 7px・topBarHeight 41px に書き換えて `node --test` を走らせ、照合のテストが落ちることを確かめた（どちらも 1 件の失敗）                                                                 |
| 2   | README の単一 HTML の手順（import・export を外して連結）は、toast.js と drawer.js の `const EXIT_GAP` が重なって SyntaxError になる                                                                          | 依存なしのスクリプト `scripts/single-html.mjs` を足した。各モジュールを別のブロック `{ … }` に入れ、import の行を `const { … } = modules.<名前>;` に置き換え、`'use strict'` の関数で包んで `globalThis.kedamaCore` に export を入れる。部品の JS の中身は変えない（`git diff` で ui/ は差分 0）。README の手順をこれに直し、ただ連結してはいけない理由も書いた | `test/single.test.mjs`（4件）: ただ連結すると `Identifier 'EXIT_GAP' has already been declared` になること、まとめた JS が構文として正しいこと、vm で動かすと5つのモジュールの export（33個）がすべて同じ名前で入り、motion・icons・dateinput は本物と同じ答えを返すこと、HTML が CSS を順に入れて外のファイルを読まないこと。**実際に `node scripts/single-html.mjs html` で1つの HTML（65 KB）を作り、Orca の内蔵ブラウザで開いて動くことを確かめた**（8.3） |
| 3   | R1 の純白の検査が、一重引用符の SVG 属性・style を見逃した（`stroke='#ffffff'` で通った）                                                                                                                    | `svgPaintValues` を、二重引用符・一重引用符・引用符なし（HTML の中の SVG）のどれでも読むようにした（属性と style の両方）                                                                                                                                                                                                                                       | テストで、属性（`stroke="…"`・`stroke='…'`・`fill=#fff`・`stop-color = 'white'`）と style（二重・一重）でそれぞれ純白を拾い、`#fffefc`・`stroke-width`・`data-fill`・metadata の中は拾わないことを確かめた。実物の status-approved.svg を `stroke='#ffffff'` に書き換えたものも拾う。core の写しのアイコンを実際に書き換えて走らせると、2件落ちる                                                                                                              |

### 8.2 改善提案（採用）

| #   | 提案                                                           | 対応                                                                                                                                              | 確認                                                                                                                   |
| --- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| a   | `--ui-scrim` の不透明度 0.10 も DERIVED の記録どおりか照合する | DERIVED の `--ui-scrim` に決め方（インク色の RGB の 0.10）を持たせ、決め方のテストで照合。覆いのテストでも不透明度が 0.1 であることを数で確かめる | テストの中で 0.99 にしたものが決め方と合わないこと。core の写しの tokens.css を実際に 0.99 にして走らせると、2件落ちる |
| b   | ci.yml の Core tests に `npm run verify:pack` を足す           | 「Core package check」の段を足した（`working-directory: core`、`npm run verify:pack`。公開はしない）                                              | ローカルで `npm run verify:pack` が43件すべて通る（20 ファイル・34,299 bytes）                                         |

報告（stage1-report.md）の DERIVED 表・照合の説明・「人に決めてほしいこと」の 9（CI の verify:pack。解決）も直した。

### 8.3 単一の HTML をブラウザで確かめた結果

`node scripts/single-html.mjs html` で作った `kedama-core.html` を、`python3 -m http.server` から Orca の内蔵ブラウザで開いた（ファイルは scratchpad に作り、リポジトリには入れていない）。

- 読み込み: `globalThis.kedamaCore` に 33 の名前、modules は motion・icons・dateinput・toast・drawer。`<link>` も `<script src>` も 0。コンソールのメッセージは最後まで 0
- 見た目: 主ボタンの地 `rgb(38, 37, 31)`。状態のアイコン8つが描かれる。日付の欄は「2026/9/8」を「読んだ値: 2026-09-08」と出す
- ドロワー: ボタンで開き、`role="dialog"`・`aria-modal="true"`・フォーカスが中へ移る・地 `rgb(255, 254, 252)`。Esc で閉じ、フォーカスは開いたボタンへ戻った
- トースト: ボタンで出て `role="status"`・題「保存しました」・地 `rgb(255, 254, 252)`。時間が来て消えた
- スクリーンショット: `docs/screenshots/05-single-html.png`（ドロワーを開いた状態）
- 気づいたこと: ドロワーを Esc で閉じた直後（出ていく動きのあいだ）は覆いが残っていて、そのあいだのクリックは覆いに当たる（部品の振る舞いどおり）

### 8.4 テストの件数が 92 と 93 で違った理由

- `npm test` は `node --test test/*.test.mjs` で、対象を `*.test.mjs` に限っている → 92 件（今は 98 件）
- 引数なしの `node --test`（core の中で実行）は Node の既定の探し方を使い、`**/test/**/*.mjs` も対象にする。そのため補助の **`test/helpers.mjs` もテストのファイルとして走り、テストを持たないファイルが1件として数えられる** → 93 件（今は 99 件）
- どちらも失敗は 0。数え方の違いだけで、テストの中身は同じ。正式な走らせ方は `npm test`（CI も同じ）

### 8.5 直したあとの検証（2026-11-13）

| コマンド                         | 結果                                                                                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `cd core && npm test`            | **98 件すべて通過**（suites 18。前回の 92 件から、置き換えた2件を引き、照合・抜け・壊すの3件、SVG の引用符の1件、単一の HTML の4件を足した） |
| `cd core && npm run verify:pack` | 43 件すべて通過（20 ファイル・34,299 bytes）                                                                                                 |
| `pnpm lint`                      | 通過（core の JS も含めてエラー 0）                                                                                                          |
| `pnpm format:check`              | 通過                                                                                                                                         |
| `pnpm typecheck`                 | 通過                                                                                                                                         |
| `pnpm test`                      | 通過（27 files / 716 tests。着手前と同じ）                                                                                                   |
| `pnpm build`                     | 通過（package boundary clean）                                                                                                               |

`core/ui/`・`core/guidelines/` は今回も変えていない（`git diff` で差分 0）。

## 9. 再レビュー（Codex、effort high、2026-11-14）と完了の判定

対象: 9c30afc（完了前レビューの指摘3件・改善提案2件への対応）。実施: 指示役が `codex exec --sandbox read-only` で依頼（1回目は標準入力の待ちで止まったため、標準入力を閉じてやり直した）。

- 指摘: なし。前回の3件は解消。Codex が前回の壊し方を再現し、テストが落ちることを確かめた（`radius.sm=7px`・`topBarHeight=41px` で各1件、`stroke='#ffffff'` で2件、scrim `0.99` で2件）
- 単一 HTML 化: 名前の衝突防止・import の置き換え・strict を確認。生成した JS で部品のテスト35件が通過（Codex の追加検証）
- CI: 追加は core の配布の検査だけで、既存の段への干渉なし
- Codex 側の再実行: Node 22.22.1 で core 98/98、lint・format:check・typecheck 通過。verify:pack とルートの test・build は読み取り専用の環境のため未再実行（実装担当の実行結果は 8.5）
- 改善提案「生成した単一 HTML の JS で、トースト・ドロワーの動きもテストに組み込む」: **段1では見送り**（指示役判断）。今は関数の存在の確認までで、動きは 8.3 のブラウザ確認と Codex の追加検証で通っている。段3で登記が単一 HTML で取り込むときに足す候補として残す
- 判定: **完了としてよい**（Codex）。指示役も同意。残るのは push と main への統合（yuuki）と、stage1-report.md 5章の「人に決めてほしいこと」

## 10. stage1-report.md 5章の決定（2026-11-14、yuuki）と変更

yuuki が 2026-11-14 に、助言役（Fable）の推奨をもとに、報告の5章の未決事項を決めた。実装担当がそれを反映した。報告の5章には、各項目に決定を書き込んだ。

### 10.1 決定と変更の一覧

| #   | 決定                                                                                                                                                                                                                                                                                                                                   | 変更したもの                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 著作権表示は `core/README.md` のライセンスの節に「Copyright 2026 Kedama Design」と書く（この1か所だけ）。NOTICE は作らない。SPDX の1行はそのまま                                                                                                                                                                                       | README に「ライセンス」の節を足した。冒頭の「著作権表示は未決」を消した。公開の手順の2も直した。`test/package.test.mjs` は、README に1回だけ・ライセンスの節にある・ui のファイルに著作権表示が無い・NOTICE が無いことを確かめる                                                                                                                                                                                                                                                                                                    |
| 2   | npm の名前とアカウントは yuuki が用意する                                                                                                                                                                                                                                                                                              | コードの変更はなし                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 3   | AGENTS.md の git の節を「作業用の枝へのコミットはエージェントが行う。push と main への統合は yuuki が行う」に直す                                                                                                                                                                                                                      | AGENTS.md の git の節（旧 70〜72 行）を書き換えた。昔のブリッジ経由の事情は経緯として1行残した                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 4   | 入力欄の枠（D6 の見直し）: `.tsk-input`・`.tsk-select__control` の枠を `var(--ui-border-input)` にする。重ねたときに枠の色を変える規則（`.tsk-input:hover`・`.tsk-select__control:hover`）は消し、重ねても枠は変えない。手順の番号の丸い枠（`.tsk-steps__number`）は `--ui-border-high` のまま。誤りの赤い枠とフォーカスの輪は変えない | `ui/components.css` の4行（枠の2行を変え、重ねたときの規則2行を消した）。`ui/tokens.css` の `--ui-border-input` のコメント。テスト・ガイドラインの README・報告・見本の実測・スクリーンショット（10.2〜10.4）                                                                                                                                                                                                                                                                                                                       |
| 5   | 動きを減らす設定: 部品は変えない。段3の後に、ガイドラインの文を「移動は0、透明度の変化は可」に直すか決める                                                                                                                                                                                                                             | 報告の3章・5章に記録（コードの変更はなし）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 6   | 色を直した `status-approved.svg`・`publish-failed.svg` から `<metadata>` の C2PA を取り除く。ほかの6つは残す                                                                                                                                                                                                                           | 2つの SVG から `<metadata>…</metadata>` と、使わなくなった `xmlns:c2pa` の宣言を取り除いた（status-approved.svg は 8,078 → 304 バイト、publish-failed.svg は 8,035 → 261 バイト。`wc -c` で測った。描く形と色は同じ）。`guidelines/SOURCE.json` の modified の理由を更新し、直したファイルのいまの sha256 を `modifiedSha256` に足した（`updatedAt: 2026-11-14`）。テストで、記録どおりのハッシュであること・2つに来歴情報が無く、ほかの6つは元のまま持つことを確かめる。ガイドラインの README の「純白を使わない」の行にも記録した |
| 7   | 記事本文の行の高さ 1.9 は core に持たない（使う製品が出るまで待つ）                                                                                                                                                                                                                                                                    | 報告の1章・3章・5章に記録（コードの変更はなし）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 8   | 「要判断」の5つはすべて残す。README に、`toastClass` の引数と dateinput の `type=date` の分岐は「互換用・将来削除」、部品の中の文言は「日本語のみ」と書く                                                                                                                                                                              | README の「JavaScript の使い方」に「互換用の口と、部品の中の文言」の節を足した                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 9   | package.json に repository 欄は書かない                                                                                                                                                                                                                                                                                                | 変更なし（報告に記録）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 10  | README に版の約束を書く:「0.x の間は使う側を壊す変更がありうる。使う側は版を固定する」                                                                                                                                                                                                                                                 | README の冒頭の箇条と「版の約束」の節（例 `"@kedama-design/core": "0.1.0"`、`^`・`~` を付けない）                                                                                                                                                                                                                                                                                                                                                                                                                                   |

### 10.2 入力欄の枠（4）のテストと、登記との差の記録

- `test/contrast.test.mjs`:
  - 入力・選択の枠が `--ui-border-input` で書かれていること。その値が本文の面・入力の地に対し 3.48:1、アプリの地に対し 3.19:1 で、どれも 3:1 以上であること（WCAG 1.4.11）
  - 入力・選択に `:hover` の規則が無いこと
  - 誤りの赤い枠と `:focus-visible` の輪が残り、手順の番号の丸い枠は `--ui-border-high` のままであること
  - D6 の比の記録（border-high 1.47、border-input 3.48）は残した
- 壊したら落ちることの確かめ: core の写しで、`.tsk-input` の枠を border-high に戻すと1件落ちた。`.tsk-select__control:hover` の規則を戻しても1件落ちた
- ガイドラインの README の決定の表: 「入力欄の枠（部品での扱い）」の行で、11-13 の決定を取り消し線にし、2026-11-14 の見直しを書いた
- 報告の2章（登記との差）: 部品の CSS の差として「入力・選択の枠」と「重ねたときの枠の色の変化」の2行を足した。重ねたときの色 `#a3a29b` は本文の面に対し 2.54:1 だった
- 報告の3章: D6 の行を「差は解消」に直した
- **core/ui は登記と同じ、という記録を直した**: 3.3 節、報告の1章、README の「出典」に、2026-11-14 に components.css の入力・選択の枠を意図して変えたこと（登記と違う4行）を書いた。それ以外のコードは登記と同じ。段3で登記へ写し戻す

### 10.3 解決値の取り直し（getComputedStyle、2026-11-14）

見本のページ（`examples/index.html`）の実測の節を直した。入力・選択の枠の期待を `--ui-border-input` にした。重ねたときの入力・選択の枠と、手順の番号の丸い枠の行を足した（読み替えた規則は、:hover の規則が2つ減って 20 → 18）。Orca の内蔵ブラウザで取り直した結果、**21 件すべて一致**した。

| 測ったもの                                       | 要素・性質                                           | 実測                 | 期待（トークン）                           |
| ------------------------------------------------ | ---------------------------------------------------- | -------------------- | ------------------------------------------ |
| 入力の枠                                         | `#m-input` border-top-color                          | `rgb(138, 137, 131)` | `--ui-border-input` = `#8a8983`            |
| 入力の枠 hover（変えない。読み替えた規則で強制） | `#m-input-hover` border-top-color                    | `rgb(138, 137, 131)` | `--ui-border-input` = `#8a8983`            |
| 入力の枠 誤り                                    | `#m-input-invalid` border-top-color                  | `rgb(196, 71, 58)`   | `--ui-status-danger` = `#c4473a`           |
| 選択の枠                                         | `#m-select` border-top-color                         | `rgb(138, 137, 131)` | `--ui-border-input` = `#8a8983`            |
| 選択の枠 hover（変えない。読み替えた規則で強制） | `#m-select-hover` border-top-color                   | `rgb(138, 137, 131)` | `--ui-border-input` = `#8a8983`            |
| 手順の番号の丸い枠（入力欄ではない）             | `.tsk-steps__number`（4つ目の手順） border-top-color | `rgb(214, 212, 205)` | `--ui-border-high` = `#d6d4cd`             |
| 副ボタンの枠（変えていない）                     | `#m-secondary` border-top-color                      | `rgb(214, 212, 205)` | `--ui-action-secondary-border` = `#d6d4cd` |

- **本物のマウスで重ねたとき**: 入力（`:hover` が true）も選択（`:hover` が true）も、枠は `rgb(138, 137, 131)` のままだった
- 実測の色どうしの比: 入力の枠と本文の面 3.48:1、入力の枠と入力の地 3.48:1、選択の枠と本文の面 3.48:1
- ほかの14件（主ボタンの通常・hover・active、面、アイコンなど）は 4.2 節と同じ値で一致した。コンソールのメッセージは 0
- 単一の HTML（`node scripts/single-html.mjs html` で作り直したもの）でも、日付の欄の枠は `rgb(138, 137, 131)` だった

### 10.4 スクリーンショット（撮り直し、2026-11-14）

`core/docs/screenshots/` の全11枚を撮り直した。入力・選択を含むのは `01-parts-1`〜`3`、`02`〜`05` の背景と `05` の日付の欄で、実測の表は `01-parts-6`・`7`。撮り方は 4.3 節と同じで、トースト・ドロワーは位置が止まるのを待ってから撮った。

### 10.5 検証（2026-11-14）

| コマンド                         | 結果                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `cd core && npm test`            | **102 件すべて通過**（suites 18。98 件から、入力・選択の枠の2件、modifiedSha256 の1件、アイコンの来歴情報の1件を足した） |
| `cd core && npm run verify:pack` | 43 件すべて通過（20 ファイル・33,752 bytes。アイコン2つが小さくなった）                                                  |
| `pnpm lint`                      | 通過                                                                                                                     |
| `pnpm format:check`              | 通過                                                                                                                     |
| `pnpm typecheck`                 | 通過                                                                                                                     |
| `pnpm test`                      | 通過（27 files / 716 tests。着手前と同じ）                                                                               |
| `pnpm build`                     | 通過（package boundary clean）                                                                                           |

`core/guidelines/` で、直したファイル以外（アイコン6つを含む）は元と同じ sha256 のまま（テストで確認）。

### 10.6 レビュー（Codex、2026-11-14）の指摘と対応

判定は「新しいテストの検出漏れ2件を直してから完了」。実装本体（10件の決定）は決定どおりで、`tokens.css` の2行はコメントで値は変わっていない、という確認だった。部品の CSS・JS は今回も変えていない（`git diff` で `core/ui/`・`core/guidelines/` は差分 0）。

| #   | 指摘                                                                                                                                                                                                             | 対応                                                                                                                                                                                                                                                                                                                                                                                                                                      | 壊したら落ちることの確認                                                                                                                                                                                                                                                                                                                                                                 |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 通常の入力欄のフォーカスの輪が壊れても検出できない（選択子に `.tsk-input:focus-visible` を含むかだけを見ていたので、誤りの状態の規則だけでも通った。共通の規則の `outline` を `none` にしても 102/102 が通った） | `test/contrast.test.mjs` に `focusRingProblems` を足した。(a) 条件の無い規則を書いた順にたどり、ちょうど `.tsk-input:focus-visible`・`.tsk-select__control:focus-visible` に当たる規則の `outline`・`outline-offset` の最後の値が、`2px solid var(--ui-text-high)`（2px・インク色）と正の px（外側）であること。(b) 入力・選択と `:focus-visible` を含む規則（誤りの状態や `@media` の中も含む）が `outline` を書くなら、同じ輪であること | テストの中で7通りに壊して、どれも検出されることを確かめる: 共通の規則の輪を none・1px・薄い色・内側（-2px）にする、後ろに `.tsk-input:focus-visible { outline: none; }` を足す、`@media` の中で選択欄の輪を 0 にする、選択欄の規則の輪を none にする。加えて、core の写しの components.css で共通の規則を実際に `outline: none` にして走らせると、1件落ちた                              |
| 2   | `@media` の中に戻した hover の枠の変更を見逃す（検査の前に `@media` を丸ごと外していたので、`@media (hover: hover)` の中に選択欄の古い hover の規則を戻しても通った）                                            | CSS の読み取りを `parseCss` に置き換えた。`@media`・`@supports` などの条件の中にも降り、その条件を記録する。`hoverBorderProblems` は、条件の有無にかかわらず、入力・選択に効く `:hover` の規則が `border*`・`outline*`・`box-shadow` を変えていれば問題にする                                                                                                                                                                             | テストの中で5通り（条件なし、`@media (hover: hover)` の中、`@supports` の中の `@media` の中、`.tsk-field .tsk-input:hover`、`box-shadow` で枠に見せるもの）を足して、どれも検出されることを確かめる。加えて、core の写しの components.css の末尾に `@media (hover: hover) { .tsk-select__control:hover { border-color: var(--ui-text-disabled); } }` を実際に足して走らせると、1件落ちた |

改善提案（採用）: 10.1 の6の SVG の大きさは文字数だったので、`wc -c` で測ったバイト数に直した（status-approved.svg 8,078 → 304 バイト、publish-failed.svg 8,035 → 261 バイト）。日本語の `aria-label` の分だけ、文字数より大きい。

ほかに: 枠の色と 3:1 のテストも `parseCss` で読むようにした（条件の無い規則で、その選択子の `border` の最後の値を見る）。誤りの赤い枠と手順の番号の丸い枠の確認は、別のテストに分けた。

検証（2026-11-14）:

| コマンド                         | 結果                                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `cd core && npm test`            | **104 件すべて通過**（suites 18。前の1件を3件に分けた）                                                                                    |
| `cd core && npm run verify:pack` | 43 件すべて通過（20 ファイル・33,752 bytes）                                                                                               |
| `pnpm lint`                      | 通過                                                                                                                                       |
| `pnpm format:check`              | 通過。1回目は、SVG の大きさを直したときに表の列の幅が変わり、このファイルの整形が合わずに失敗した。prettier で整えて、もう一度流して通った |
| `pnpm typecheck`                 | 通過                                                                                                                                       |
| `pnpm test`                      | 通過（27 files / 716 tests。着手前と同じ）                                                                                                 |
| `pnpm build`                     | 通過（package boundary clean）                                                                                                             |

### 10.7 再レビュー（Codex、2026-11-14）の指摘と対応

10.6 の2件は直っていた、という確認だった（共通の規則を `outline: none` にしたとき、`@media` の中に hover の規則を戻したときに、それぞれ落ちる）。部品の CSS・JS と guidelines は今回も変えていない（`git diff` で差分 0）。

| #   | 指摘                                                                                                                                                                                                                               | 対応                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | 壊したら落ちることの確認                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `focusRingProblems` は `outline` と `outline-offset` しか見ていなかった。末尾に `.tsk-input:focus-visible { outline-style: none; }` を足したり、条件つきの規則に `outline-width: 0` を足したりすると、輪は消えるのにテストが通った | 輪を width・style・color・offset の状態として持ち、宣言を書いた順に当てるようにした（`applyOutline`）。`outline`（まとめ書き）は、書いていない部分を初期値（medium・none・currentcolor）に戻す（CSS の決まりどおり）。`outline-width`・`outline-style`・`outline-color`・`outline-offset` は、それぞれの部分だけを変える。`!important` は外して読む。(a) 条件の無い規則で、ちょうど `.tsk-input:focus-visible`・`.tsk-select__control:focus-visible` に当たるものを順に当てた**最後の輪**が、2px・solid・`var(--ui-text-high)`・正の px の offset であること。(b) 入力・選択と `:focus-visible` を含む規則（誤りの状態・`@media`・`@supports` の中も含む）が輪の部分を1つでも書くなら、その規則の中で当てた結果が同じ輪であること | テストの中で、個別の指定による7通りを足した。条件なしの `outline-style: none`・`outline-width: 1px`・`outline-color: var(--ui-border-low)`、`@media` の中の `outline-width: 0`、`@supports` の中の `outline-style: dashed`、`@media` の中の `outline-color: transparent !important`、選択欄の規則の中の `outline-style: hidden`。どれも検出される。逆に、書く順を変えただけのまとめ書き（`solid var(--ui-text-high) 2px`）や、同じ値の言い直しは問題にしないことも確かめる（誤検出の防止）。加えて、core の写しの components.css に Codex の2つの例（末尾の `.tsk-input:focus-visible { outline-style: none; }`、`@media (pointer: fine)` の中の `outline-width: 0`）を実際に足して走らせると、それぞれ1件落ちた |

改善提案（採用）: `parseCss` の注釈に、扱える書き方（コメント、条件の入れ子、選択子の並び）と扱えない書き方を書いた。扱えないのは次の5つ。

- かっこの中のカンマ（`:is(.a, .b)` など）。いまは css.test.mjs の「規則はすべて .tsk- の class から始まる」の規約テストがこの書き方を拒むので、実害は無い
- 文字列や `url( )` の中の `{ } ; ,`
- CSS の入れ子（`&`）
- 宣言を直接持つ at-rule（`@font-face` など）
- `;` で終わる at-rule（`@import` など）。次の規則を取り違えて落とす。components.css に `@import` が無いことは css.test.mjs が確かめている

検証（2026-11-14）:

| コマンド                         | 結果                                                                     |
| -------------------------------- | ------------------------------------------------------------------------ |
| `cd core && npm test`            | **104 件すべて通過**（件数は変わらない。輪のテストの中の確かめが増えた） |
| `cd core && npm run verify:pack` | 43 件すべて通過（20 ファイル・33,752 bytes）                             |
| `pnpm lint`                      | 通過                                                                     |
| `pnpm format:check`              | 通過                                                                     |
| `pnpm typecheck`                 | 通過                                                                     |
| `pnpm test`                      | 通過（27 files / 716 tests。着手前と同じ）                               |
| `pnpm build`                     | 通過（package boundary clean）                                           |

## 11. 11-14 の決定の反映へのレビューと完了の判定（指示役が記録）

Codex（effort high、`codex exec --sandbox read-only`）で、反映の変更分を3回レビューした。

| 回  | 対象    | 判定   | 内容                                                                                                                                                                           |
| --- | ------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | 2fe6fb6 | 不可   | 指摘2件（入力欄の輪が壊れても通る／`@media` の中の hover を見逃す）。改善提案1件（SVG の大きさが文字数になっている）。実装は決定どおりで、tokens.css の2行の変更はコメントだけ |
| 2   | 0ec6796 | 不可   | 指摘1件（`outline-style` などの個別の指定で輪を消されると見逃す）。改善提案1件（parseCss が扱える書き方を明記する）                                                            |
| 3   | 053bad8 | **可** | 指摘なし。前回の壊し方で落ちる、今の CSS を誤って落とさない、core/ui・core/guidelines は差分0                                                                                  |

3回目は「前回の指摘が直ったか」に範囲を絞って頼んだ（テストの検査を際限なく強くし続けないため。指示役の判断）。結果: core 104/104、verify:pack 43/43、ルートの5つは通過（実装担当の実行）。
