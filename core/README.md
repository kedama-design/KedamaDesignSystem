# @kedama-design/core

Kedama の**共有の値**（`--ui-*` の CSS 変数）と、**仕組みに依存しない部品**（素の CSS と ESM の JavaScript）。
React・Tailwind・Base UI などには依存しません。ビルドの道具も要りません。

- ライセンス: [Apache License 2.0](./LICENSE)。著作権表示は下の「ライセンス」の節
- **版の約束: 0.x の間は使う側を壊す変更がありうる。使う側は版を固定する**（下の「版の約束」）
- 値の正: [`guidelines/tokens/tokens.json`](./guidelines/tokens/tokens.json)（共通UIガイドライン）。`ui/tokens.css` はこれと一致することをテストで確かめている

> npm に出ている版は `npm view @kedama-design/core versions` で分かります。版ごとの変更は、リポジトリの `core/CHANGELOG.md` に書きます（npm には入れていません）。

## 中身

| ファイル              | 中身                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| `ui/tokens.css`       | 共有の値（色・書体・余白・角丸・寸法・影）。**色の値を書いてよいのはこのファイルだけ**                  |
| `ui/base.css`         | 画面の土台（書体・リンク・フォーカスの輪・小窓を開いたあいだのスクロール止め）                          |
| `ui/components.css`   | 部品の CSS。class はすべて `tsk-` で始まる                                                              |
| `ui/motion.js`        | 減衰ばねの計算（DOM に触らない純関数）                                                                  |
| `ui/toast.js`         | 右下のトースト（`createToaster`）                                                                       |
| `ui/drawer.js`        | 右のドロワー（`openDrawer`）                                                                            |
| `ui/dateinput.js`     | 文字の日付欄（`YYYY-MM-DD` に読む）                                                                     |
| `ui/icons.js`         | 状態のアイコンと線のアイコン（SVG の文字列と DOM の要素）                                               |
| `guidelines/`         | 共通UIガイドライン（文書・値・アイコン・画面の見本）。**npm には `tokens.json` と `icons/` だけ入れる** |
| `examples/index.html` | 全部品・全状態の見本と、解決値の実測（配らない）                                                        |
| `test/`               | `node --test` のテスト（配らない）                                                                      |
| `docs/`               | 段ごとの設計記録と報告（配らない）                                                                      |
| `CHANGELOG.md`        | 版ごとの変更と公開の状況（配らない）                                                                    |

## CSS の読み込み方

順番は **`tokens.css` → `base.css` → `components.css`**。自分の画面の CSS は `base.css` より後ろに置きます
（`base.css` は上書きされる側）。登記議事録つくるさんでは `tokens → base → 画面の CSS → components` の順です。

```html
<link rel="stylesheet" href="ui/tokens.css" />
<link rel="stylesheet" href="ui/base.css" />
<link rel="stylesheet" href="ui/components.css" />
```

- `components.css` は `tsk-` の class を付けた要素にだけ効きます（要素の名前だけの規則を持たない）
- `lang="ja"` を必ず付けてください（中華圏の字形にならないように）
- 明るい画面だけです（暗い画面の値は持っていません）

## JavaScript の使い方

ESM です。`toast.js`・`drawer.js` は同じフォルダの `motion.js`・`icons.js` を相対パスで読みます。

```html
<script type="module">
  import { createToaster } from './ui/toast.js';
  import { openDrawer } from './ui/drawer.js';

  const toaster = createToaster();
  toaster.show({ kind: 'success', title: '保存しました' });

  document.querySelector('#open').addEventListener('click', (e) => {
    openDrawer({ title: '詳細', opener: e.currentTarget, body: (el) => el.append('本文') });
  });
</script>
```

- 文字はすべて `textContent` で入れます（`innerHTML` を使わない）
- 「動きを減らす」設定（`prefers-reduced-motion: reduce`）では、ばねを使わず 200ms の透明度の変化で出し入れします
- `doc`・`win` を渡せます（テストでは作り物の DOM で動かしています）

### 互換用の口と、部品の中の文言

- `createToaster` の `toastClass` 引数は**互換用・将来削除**（登記議事録つくるさんの画面の古い選択子を通すため）
- `dateinput.js` の、ブラウザの日付の欄（`type="date"`）を同じ入口で扱う分岐は**互換用・将来削除**（文字の日付欄へ移しきるまで）
- 部品の中の文言（「閉じる」「エラー」「お知らせ」、日付の欄の見本「例 2026-04-01」と誤りの1行 など）は**日本語のみ**

## npm から使う（公開したあと）

```js
import '@kedama-design/core/tokens.css';
import '@kedama-design/core/base.css';
import '@kedama-design/core/components.css';
import { createToaster } from '@kedama-design/core/toast.js';
import { statusIconMarkup } from '@kedama-design/core/icons.js';
import tokens from '@kedama-design/core/tokens.json' with { type: 'json' };
```

アイコンの SVG は `@kedama-design/core/icons/status-approved.svg` のように取り込めます（`package.json` の `exports` に列挙）。

## けだまカレンダー（pnpm・Vite・React）で使う

けだまカレンダーは、`packages/ui` を「core を取り込んで使う薄い層」にします。値や部品を `packages/ui` に持たず、足りないものは core に足します。

### 取り込む

```bash
cd packages/ui
pnpm add --save-exact @kedama-design/core@0.1.0   # 版を固定する（^ を付けない）
```

`packages/ui` の入口で、CSS をこの順に一度だけ読み込みます。画面ごとの CSS は `base.css` より後ろに置きます。

```ts
import '@kedama-design/core/tokens.css';
import '@kedama-design/core/base.css';
import '@kedama-design/core/components.css';
```

### React の部品で包むときの決まり

- class は core のもの（`tsk-` で始まる）をそのまま使う。同じ見た目を Tailwind や別の CSS で作り直さない
- 色・寸法の値を書かない。足りないときは `var(--ui-*)` を使い、それでも足りなければ core に足す
- トーストとドロワーは core の JavaScript（`createToaster`・`openDrawer`）を呼ぶ。React で作り直さない
- 包んだ部品の振る舞い（フォーカスの戻り先、Esc で閉じるなど）は core の JavaScript に任せる

例（ボタン。`tsk-btn` だけなら副ボタン、`tsk-btn--primary` で主ボタン、`tsk-btn--ghost` で枠なし）:

```tsx
type ButtonProps = React.ComponentProps<'button'> & { variant?: 'primary' | 'secondary' | 'ghost' };

export function Button({ variant = 'secondary', className, ...props }: ButtonProps) {
  const cls = ['tsk-btn', variant !== 'secondary' && `tsk-btn--${variant}`, className]
    .filter(Boolean)
    .join(' ');
  return <button type="button" className={cls} {...props} />;
}
```

### core を直したいとき

1. KedamaDesignSystem に、何が足りないか・なぜ要るかを伝える（けだまカレンダーの中で作らない）
2. core を直して新しい版を出す（作業用の枝 → 確認 → main → 人が npm に公開）
3. けだまカレンダーの `packages/ui` の版を上げる（`pnpm add --save-exact @kedama-design/core@<新しい版>`）。変更はリポジトリの `core/CHANGELOG.md` で確かめる

## 単一の HTML に取り込む（オフライン版など）

このリポジトリの `core/` で、依存なしのスクリプトを使います（node の標準だけ）。

```bash
cd core
node scripts/single-html.mjs js   > kedama-core.js     # ui の JS を1つにまとめた JS
node scripts/single-html.mjs html > kedama-core.html   # CSS と JS を中に入れた、1つで動く見本の HTML
```

- **CSS**: `ui/tokens.css`・`ui/base.css`・`ui/components.css` の中身を、この順に `<style>` の中へ貼ります
- **JavaScript**: `kedama-core.js` の中身を `<script>` の中へ貼ります（見本は `type` の無い `<script>` で、ブラウザで動くことを確かめた）。
  部品は `globalThis.kedamaCore` に入ります（例 `const { createToaster, openDrawer } = kedamaCore;`）。
  自分のコードは、その `<script>` より後ろに置きます
- `kedama-core.html` は、この形で作った見本です。これを出発点にしてもかまいません
- アイコンの SVG は `icons.js` が文字列か DOM で作るので、画像のファイルは要りません

**`import` の行を消して `export` の語を外し、ただ連結してはいけません。** モジュールの中だけの名前が重なり
（`toast.js` と `drawer.js` の `const EXIT_GAP`）、`SyntaxError: Identifier 'EXIT_GAP' has already been declared` になります。
スクリプトは、各モジュールを別のブロック `{ … }` に入れ、`import` の行を `const { … } = modules.<名前>;` に置き換えて、
名前が重ならないようにしています（部品の JS の中身は変えません。`test/single.test.mjs` が確かめる）。
バンドラ（例: esbuild の `--bundle`）を使っても1つにまとめられます（このリポジトリでは試していません）。

## 決まり

- **依存を持ち込まない**（実行時・開発時とも。テストも node の標準だけ）
- **色の値は `ui/tokens.css` だけ**。ほかの CSS・JS は `var(--ui-*)` の名前だけを使う
- **正は `guidelines/tokens/tokens.json`**。値を変えるときは tokens.json を先に直し、`ui/tokens.css` を合わせる
- **純白は使わない**。いちばん明るい面は `#fffefc`
- **class の接頭辞 `tsk-` は変えない**
- 他の部品集（Sparkle Design）は土台にしない（v1.0 のときに参考にした）
- **部品を直すときは core を先に直し、登記議事録つくるさんへ写す**（`ui/` のファイル名は登記の `src/ui/` と同じ）
- `ui/` と `guidelines/` は prettier をかけない（登記へ写し戻すとき・写しを変えないため。`.prettierignore`）

## テスト

```bash
cd core
npm test               # node --test test/*.test.mjs（Node 22）
npm run verify:pack    # npm pack の tarball を展開して、exports と import を確かめる（公開はしない）
```

見本のページ:

```bash
cd core && python3 -m http.server 8000
# http://localhost:8000/examples/index.html
```

## 出典（移した元）

- `guidelines/`: `スラスラスタジオ/ui-guidelines`（2026-11-13 に写した。元の各ファイルの sha256 と、写したあとに直したファイル・理由は `guidelines/SOURCE.json`）
- `ui/`: 登記議事録つくるさん `_dev/src/ui/`（2026-11-13 に写した。写したときは、振る舞い・セレクタ・書式は変えず、製品の文脈のコメントだけを直した）。
  **2026-11-14 に意図して変えたところ（登記と違う）**: 入力欄・選択の枠を `--ui-border-input` にし、重ねたとき（hover）に枠の色を変える規則を消した（`.tsk-input`・`.tsk-select__control`。D6 の見直し、yuuki）。段3で登記へ写し戻す
- `test/`: 登記議事録つくるさん `_dev/test/` の uitokens・uicss・uimotion・uiparts・ui8b（日付欄の部分）から、部品だけの部分を移した

## 公開の手順（人が行う。エージェントは公開しない）

**一度出した版の中身は上書きできません。** 消すこと（unpublish）には条件があり、消しても同じ版の番号は二度と使えません
（条件は [npm の削除の規則](https://docs.npmjs.com/policies/unpublish/)。出してから 72 時間をすぎると、ほかのパッケージに使われていない・ダウンロードが少ないなどの条件をすべて満たすときだけ消せます）。出す前の点検を省かないでください。

### 最初の1回だけ（アカウントと組織）

1. [npmjs.com](https://www.npmjs.com/signup) で、会社で管理するメールアドレスのアカウントを作る
2. **2段階の認証**を有効にする。右上のアイコン →「Account」→「Two-Factor Authentication」→「Enable 2FA」と進み、
   セキュリティキー（Mac の Touch ID など）を登録する（手順は [npm の案内](https://docs.npmjs.com/configuring-two-factor-authentication/)）。
   **表示される復旧コードは、会社の保管場所に控える**（なくすとアカウントに入れなくなる）
3. 右上のアイコンの「Add Organization」で、組織 **`kedama-design`** を作る（無料・公開のパッケージ用）。
   この名前が取れないときは、そこで止めて相談する（パッケージの名前を変える必要がある）
4. 自分のパソコンのターミナルで `npm login` を実行し、ブラウザでログインする

### 版を出すたび

1. リポジトリの **main** にいて、手元に保存していない変更がないことを確かめる（`npm publish` は手元のファイルをそのまま出す）
   ```bash
   git switch main
   git pull
   git status          # 「nothing to commit, working tree clean」と出ること
   ```
2. `npm whoami` で自分の名前が出ることを確かめる（出なければ `npm login` をやり直す）
3. `cd core` で、次の3つが通ることを確かめる
   ```bash
   npm test
   npm run verify:pack
   npm publish --dry-run    # 実際には出さない
   ```
   `--dry-run` の最後の数行で、次を見る: 名前 `@kedama-design/core`、出す版の番号、`total files` が 20 前後、
   `Publishing to https://registry.npmjs.org with tag latest and public access`。
   ここが通っても、ログインや組織の権限が正しいことまでは分からない（それは次の手順で分かる）
4. `npm publish` を実行する。2段階の認証を求められたら、画面の案内（ブラウザが開く・キーに触れる など）に従う。
   出し先と公開の設定は `package.json` の `publishConfig` に書いてある
5. `npm view @kedama-design/core version` で、出した版の番号が出ることを確かめる
6. `core/CHANGELOG.md` のその版の「未公開」を、公開した日に直す（エージェントに頼んでよい）
7. 出したことをエージェントに伝える。外から取り込んで確かめる（`docs/stage2-log.md` に記録する）

## 版の約束

- **0.x の間は、使う側を壊す変更がありうる**（class 名・引数・値の名前を変える・消すなど）
- **使う側は版を固定する**（例 `"@kedama-design/core": "0.1.0"`。`^` や `~` を付けない）
- 版ごとの変更は、リポジトリの `core/CHANGELOG.md`（npm には入れていない）。使う側を壊す変更は「壊す変更」と書く

## ライセンス

Copyright 2026 Kedama Design

[Apache License 2.0](./LICENSE) で配ります。各ファイルの1行目には `SPDX-License-Identifier: Apache-2.0` だけを付けています（著作権表示はこの節だけ。NOTICE は置きません）。
