# @kedama-design/core 段2 設計記録

- 指示書: 無知総研「けだまポータル共通UI 段2 指示書」（2026-11-18）
- 段2の目的: けだまカレンダーが、最初から core を npm から取り込んで使えるようにする。受け持つのは core の側だけ
- 引き継ぎ: [`stage2-handoff.md`](./stage2-handoff.md)

## 1. 決まったこと（yuuki）

| 日    | 決まり                                                                                                                         |
| ----- | ------------------------------------------------------------------------------------------------------------------------------ |
| 11-17 | 段2の指示書は指示役が案を書く。段2は core の側だけを受け持つ（けだまカレンダーのリポジトリと M0 は、けだまカレンダーの指揮役） |
| 11-17 | core の渡し方は npm の公開のレジストリ（けだまカレンダーの詳細設計 9章5番の答え）                                              |
| 11-18 | 外枠（AppShell）の CSS は core に足し、0.2.0 として出す                                                                        |
| 11-18 | 最初は今の 0.1.0 をすぐ出す                                                                                                    |
| 11-18 | 公開は当面 yuuki が手で行う。npm の鍵をどこにも預けない                                                                        |

## 2. 作業の順番

| 順  | 中身                                                                            | 担当            | 状態                     |
| --- | ------------------------------------------------------------------------------- | --------------- | ------------------------ |
| 1   | 公開の前の点検、公開の手順書、CHANGELOG、けだまカレンダー向けの使い方、引き継ぎ | 指示役（文書）  | 済み（PR #4）            |
| 2   | 0.1.0 を npm に公開                                                             | yuuki           | 未                       |
| 3   | 公開したものを外から取り込んで確かめる（npm・pnpm・Vite）                       | 指示役          | 未                       |
| 4   | 外枠の CSS を core に足す（設計案 → Codex → 実装 → テスト・見本・撮影 → Codex） | 実装担当・Codex | 済み（完了前の確認 2回） |
| 5   | 0.2.0 を npm に公開                                                             | yuuki           | 未                       |

## 3. 公開の前の点検（2026-11-18、main = b440a8b）

Node 22.22.1、npm 10.9.4。

| 確かめたこと                           | 結果                                                                                                        |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `npm test`                             | 104 件すべて通過                                                                                            |
| `npm run verify:pack`                  | すべて通過                                                                                                  |
| `npm publish --dry-run`                | 通過。`registry.npmjs.org`・公開（public）・タグ `latest` に出す設定。20 ファイル、33.7 kB（展開 138.6 kB） |
| npm に同じ名前のパッケージがあるか     | ない（`registry.npmjs.org/@kedama-design%2fcore` は 404）                                                   |
| 組織 `kedama-design` が npm で取れるか | 外からは確かめられなかった（組織のページはボットよけで 403）。yuuki が組織を作るときに分かる                |

入る 20 ファイル: `LICENSE`、`README.md`、`package.json`、`guidelines/tokens/tokens.json`、`guidelines/icons/*.svg`（8）、`ui/` の 8 ファイル（tokens.css・base.css・components.css・motion.js・toast.js・drawer.js・dateinput.js・icons.js）。

`CHANGELOG.md` は npm に入らない（`files` に無い）。変更の記録は GitHub で読む。入れると `verify:pack` とパッケージのテストの「配る物」の一覧を変える必要があり、段2の範囲では変えない。

## 4. この枝で変えたもの

- `core/README.md`: 公開の状況の書き方（段1の「公開していません」を、CHANGELOG を見る形に）、けだまカレンダー向けの使い方の節、公開の手順を yuuki が1人で進められる形に、版の約束に CHANGELOG を足した
- `core/CHANGELOG.md`: 新規。0.1.0（未公開）
- `core/docs/stage2-handoff.md`: 新規。けだまカレンダーの指揮役への引き継ぎ
- `core/docs/stage2-log.md`: この記録
- 部品の CSS・JS、テスト、`package.json` は変えていない

## 5. Codex の確認（作業1、2026-11-18、medium）

文書だけの変更なので medium。全文は指示役の scratchpad の review-s2prep-result.md。

| 種類  | 内容                                                                                                       | 対応                                                                                                                                                                                                                                                     |
| ----- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 指摘1 | npm の削除の条件が不正確（72時間をすぎても条件を満たせば消せる）                                           | 「上書きできない・消すには条件・同じ版の番号は再利用できない」に書き分け、npm の規則へのリンクを足した                                                                                                                                                   |
| 指摘2 | 2段階の認証の設定名が今の画面と違う。復旧コードの控えがない                                                | Account → Two-Factor Authentication → Enable 2FA → セキュリティキー、復旧コードを控える、公開のときは画面の案内に従う、に直した                                                                                                                          |
| 指摘3 | npm に入る README から、npm に入らない CHANGELOG へ相対リンクしている。引き継ぎの文書の 02_AppShell も同じ | リンクをやめ「リポジトリの `core/CHANGELOG.md`（npm には入れていない）」と書いた。出ている版は `npm view … versions` で分かると書いた。引き継ぎは「値は npm に入る、決まりの文書はリポジトリで読む」と分けた。リポジトリの URL は書かない（段1の決まり） |
| 改善  | main にいて未保存の変更がないことを確かめる                                                                | 採用（`git switch main`・`git pull`・`git status`）                                                                                                                                                                                                      |
| 改善  | `--dry-run` で見る項目を列挙。通っても権限までは分からない                                                 | 採用                                                                                                                                                                                                                                                     |
| 改善  | 公開の前に `npm whoami`                                                                                    | 採用                                                                                                                                                                                                                                                     |

Codex は README の例（`tsk-btn`・`tsk-btn--primary`・`tsk-btn--ghost`、`createToaster().show`、`openDrawer`）が実装と合うこと、`.css` を含む `exports` を Vite が解決できることを確かめた。Vite での実際の組み立ては、公開のあとの確かめ（作業3）で行う。

## 6. 外枠の設計（0.2.0）

指示役の設計案（第3版）の写し。元: 指示役の scratchpad の `core-stage2-shell-design.md`（設計案：@kedama-design/core 0.2.0 外枠（AppShell）（2026-11-18、指示役 Claude Opus、第3版））。
Codex の着手前の確認4回の全文は、同じ scratchpad の `review-shell-pre*-result.md`。

段2の指示書「やること 4」。

- yuuki 決定（11-18）: 外枠は core に足し 0.2.0 として出す／中くらいの幅でサイドバーは本文に重ねる／スマホの幅だけ上の行を 44px にする
- 第2版: Codex 着手前レビュー1回目（P1×4・P2×2・改善3）を反映
- 第3版: Codex 2回目（P1×4・P2×3・改善4）を受け、Fable の助言（同じ所で2回つまずいたため相談）で**仕組みを削って契約を狭めた**

### 根拠

- `core/guidelines/docs/02_AppShell.md`、`07_追加.md`、`06_画面パターン.md`
- `core/guidelines/mockups/Shell*.html`（色はすべて既存の `--ui-*` に対応。右パネルは本文の面の内側の右に浮いた面: `ShellEditor.html` 100–101 行）
- 値: `--ui-topbar-h` 40、`--ui-rail-w` 56、`--ui-rail-item` 40、`--ui-sidebar-w` 280、`--ui-panel-w` 340、`--ui-page-pad-x` 24、`--ui-radius-xl` 12、`--ui-radius-2xl` 16、`--ui-shadow-floating`
- 既存: `ui/drawer.js`（body 直下・keydown と focusin を capture・`restoreFocus`・退場 200ms・scrim 900／ドロワー 901）、`ui/toast.js`（body 直下・操作ボタンを持てる）、`ui/base.css`（`:modal` のスクロール止め）

### 作るもの・変えるもの

| もの                          | 中身                                                                                                                                                                                                                    |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ui/shell.css`（新規）        | 外枠の CSS。`components.css` には入れない（登記へ同じ名前で写し戻すため）                                                                                                                                               |
| `ui/shell.js`（新規）         | 重ねて出すときの振る舞い                                                                                                                                                                                                |
| `ui/drawer.js`                | **`restoreFocus` だけ直す**: `focus()` のあと `doc.activeElement !== target` なら `fallbackFocus()` を試す（戻り先が隠れていたときの救い）。壊れていた場合にしか動きが変わらない。段3で登記へ写すときの差として記録する |
| `package.json`                | `exports` に `./shell.css`・`./shell.js`。`version` 0.2.0                                                                                                                                                               |
| `scripts/verify-pack.mjs`     | 配る物 20→22。配布物から `attachShell` を import して動かす                                                                                                                                                             |
| `scripts/single-html.mjs`     | JS に `shell.js`、CSS に `shell.css`（components の後ろ）                                                                                                                                                               |
| `test/`                       | 下の「確かめ方」。`parts.test.mjs` の固定のファイル一覧に2つ足す                                                                                                                                                        |
| `examples/shell.html`（新規） | 3つの幅 × 開閉 × ドロワー・トーストとの重なりを操作できる見本                                                                                                                                                           |
| `README.md`・`CHANGELOG.md`   | 使い方の節（契約と既知の制限）、0.2.0（未公開）                                                                                                                                                                         |

読み込む順: tokens → base → components → shell。

### HTML の形（使う側が書く）

```html
<div class="tsk-shell" data-sidebar="open" data-panel="closed" data-rail="shown">
  <header class="tsk-shell__topbar">
    <div class="tsk-shell__start">
      <span class="tsk-shell__history">（戻る・進む。narrow では隠す）</span>
      <button class="tsk-iconbtn" data-shell-toggle="sidebar" aria-label="サイドバー">…</button>
    </div>
    <nav class="tsk-shell__crumbs" aria-label="パンくず">…</nav>
    <div class="tsk-shell__end">
      （画面の操作）<button class="tsk-iconbtn" data-shell-toggle="panel" aria-label="右のパネル">
        …
      </button>
    </div>
  </header>
  <div class="tsk-shell__body">
    <div class="tsk-shell__side" aria-label="メニュー">
      <div class="tsk-shell__side-head">
        （narrow だけ出す。クライアントの切り替え・閉じるボタン [data-shell-close]）
      </div>
      <nav class="tsk-shell__rail" aria-label="アプリの切り替え">
        …（tsk-shell__app / __rail-sep / __rail-fill）
      </nav>
      <div class="tsk-shell__sidebar" aria-label="カレンダーのメニュー">
        <nav class="tsk-shell__nav" aria-label="画面">
          …（tsk-shell__nav-item[aria-current=page] / __nav-count）
        </nav>
        <p class="tsk-shell__nav-heading">最近の項目</p>
      </div>
    </div>
    <div class="tsk-shell__face">
      <main class="tsk-shell__page">…</main>
      <aside class="tsk-shell__panel" aria-label="詳細">
        …（閉じるボタン [data-shell-close] を置いてよい）
      </aside>
    </div>
  </div>
</div>
```

- 本文の面 `__face` が、本文 `__page` と右パネル `__panel` を包む（見本どおり右パネルは面の内側に浮く）
- サイドバーは `div`（中に `nav`）。重ねたときに `role="dialog"` を付けても `nav` が消えない
- `__side`・`__sidebar`・`__panel` には名前（`aria-label`）が要る（見本・テスト・README）
- 重ねものの中の閉じるボタンは `[data-shell-close]`（`shell.js` が click を1か所で受ける）
- 外枠にタブとステータスバーは置かない（02）。認証前の画面には外枠を着せない
- 覆い（`tsk-shell__scrim`）は `shell.js` が `__body` の中に足す

### 属性と持ち主

| 属性                                                                                 | 意味                                                                       | 書く人                                             | 保存     |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- | -------------------------------------------------- | -------- |
| `data-sidebar`・`data-panel`（`open\|closed`）                                       | wide での好み                                                              | **使う側**。`onRequest` が無いときは `shell.js`    | してよい |
| `data-rail`（`shown\|hidden`）                                                       | アプリが1つのとき列を隠す。**どの幅でも**隠す（narrow の引き出しの中でも） | 使う側                                             | —        |
| `data-mode`（`wide\|mid\|narrow`）                                                   | 今の幅の段                                                                 | `shell.js` だけ                                    | しない   |
| `data-overlay`（`none\|sidebar\|panel`）                                             | 重ねて出しているもの（同時に1つ）                                          | `shell.js` だけ                                    | しない   |
| 外枠の要素の `inert`・`role`・`aria-modal`・`tabindex`、開閉ボタンの `aria-expanded` | 読み上げとキーボード                                                       | **接続中は `shell.js` の持ち物**。使う側は書かない | —        |

#### 幅ごとの意味

| 段     | 幅（範囲の書き方）          | 上の行                 | アプリ切替の列    | サイドバー                                                | 右パネル                                    |
| ------ | --------------------------- | ---------------------- | ----------------- | --------------------------------------------------------- | ------------------------------------------- |
| wide   | `(width >= 1200px)`         | 40px                   | 表示              | `data-sidebar` で横に並ぶ                                 | `data-panel` で面の内側の右に並ぶ           |
| mid    | `(768px <= width < 1200px)` | 40px                   | 表示              | 普段は隠す。`data-overlay="sidebar"` で本文に重ねる       | 普段は隠す。`data-overlay="panel"` で重ねる |
| narrow | `(width < 768px)`           | **44px**（yuuki 決定） | `__side` ごと隠す | `data-overlay="sidebar"` で `__side` を左からの引き出しに | `data-overlay="panel"` で下からのシート     |

- mid・narrow では `data-sidebar`・`data-panel` を見ない
- 範囲の文字列は `shell.js` の定数 `SHELL_MEDIA` に持ち、`shell.css` の @media と一致することをテストで確かめる

#### toggle と onRequest（P1-1：状態を持たない）

```js
const shell = attachShell(root, { doc, win, onRequest });
shell.toggle('sidebar' | 'panel', opener?);
shell.close();
shell.destroy();   // 何度呼んでもよい
```

- wide で `toggle(t)`: **呼ばれた時点の DOM の逆を絶対値で**求める → `onRequest({ kind: 'preference', target: t, open, reason: 'toggle' })`。`onRequest` が無ければ `shell.js` が `data-<t>` を書く。`shell.js` は求めの控えを持たない
  - React の反映前に続けて押すと同じ求めが2回出るが、絶対値なので矛盾しない。README に「`open` をそのまま state に入れ、すぐ反映する」と書く
- mid・narrow で `toggle(t)`: `shell.js` が `data-overlay` をその場で書く。別のものが開いていれば閉じてから開く
- 幅が段をまたいだら（`matchMedia` の change）: その場で `data-mode` を書き、`data-overlay="none"` にし、`syncA11y()` を呼ぶ。遅れて届いた好みの反映は wide の並びを変えるだけで、重ねものは開かない

### つなぐ・外す（P1-2）

- `attachShell` はその場で `data-mode` を書き、`data-overlay="none"` から始め、`syncA11y()` を呼ぶ
- `MutationObserver` は `data-sidebar`・`data-panel`・`data-rail` だけを見て、変われば `syncA11y()`
- `destroy()`: 監視・`matchMedia`・keydown・click の委譲を外し、予約した処理を無効にし、`shell.js` が書いた属性（`data-mode`・`data-overlay`・上の表の読み上げ用の属性）と覆いを**取り除く**（控えて戻すことはしない。接続中は `shell.js` の持ち物と決めたため）。使う側の属性は変えない
- つなぐ→外す→つなぐ（React の StrictMode）がそのまま通る

### syncA11y()（毎回すべて計算する）

「段 × 重ねもの × 好み × `data-rail`」から、外枠の中の決まった7つの要素（topbar・`__side`・`__side-head`・`__rail`・`__sidebar`・`__page`・`__panel`）の `inert`・`role`・`aria-modal`・`tabindex` と、開閉ボタンの `aria-expanded` を計算して書く。

- **`inert` は外枠の中のこの7つだけ**。祖先はたどらず、body の子にも触らない。外枠の外は「上の層（ドロワー・ダイアログ）か、使う側の責任」と README に書く。覆いは対象外（押して閉じる）
- **ダイアログになる要素とその祖先には `inert` を付けない**。ダイアログの中の子孫に付けるのは、中で閉じている枝（`data-rail="hidden"` の列、narrow 以外の `__side-head`）だけ
- 閉じている領域は、重ねていないときも `inert`（退場の 200ms のあいだも Tab で入れない）
- ダイアログになる要素に `role="dialog"`・`aria-modal="true"`・`tabindex="-1"`
- `aria-expanded`: 接続中は常に今の開閉（wide は好み、mid・narrow は重ねもの）を `true`/`false` で書く

#### `inert` の割り当て表（○＝付ける、空＝付けない、R＝`data-rail="hidden"` のときだけ付ける）

| 段・重ねもの    | topbar | `__side` | `__side-head` | `__rail` | `__sidebar`                   | `__page` | `__panel`                   | ダイアログ  |
| --------------- | ------ | -------- | ------------- | -------- | ----------------------------- | -------- | --------------------------- | ----------- |
| wide・none      |        |          | ○             | R        | `data-sidebar="closed"` なら○ |          | `data-panel="closed"` なら○ | なし        |
| mid・none       |        |          | ○             | R        | ○                             |          | ○                           | なし        |
| mid・sidebar    | ○      |          | ○             | ○        |                               | ○        | ○                           | `__sidebar` |
| mid・panel      | ○      | ○        | ○             | ○        | ○                             | ○        |                             | `__panel`   |
| narrow・none    |        | ○        | ○             | ○        | ○                             |          | ○                           | なし        |
| narrow・sidebar | ○      |          |               | R        |                               | ○        | ○                           | `__side`    |
| narrow・panel   | ○      | ○        | ○             | ○        | ○                             | ○        |                             | `__panel`   |

- `__side` が○の行では、中の3つ（`__side-head`・`__rail`・`__sidebar`）にも○を付ける（`__side` を外したときに中が開かないよう、表のとおり個別にも書く）
- `__panel` の祖先 `__face` は7つに入っていないので、`__panel` がダイアログのときに操作不能にならない
- テストはこの表の全行 × `data-rail` の2通りを確かめる

| 段                    | ダイアログになる要素  | 名前              |
| --------------------- | --------------------- | ----------------- |
| mid・サイドバー       | `.tsk-shell__sidebar` | その `aria-label` |
| narrow・サイドバー    | `.tsk-shell__side`    | その `aria-label` |
| mid・narrow・右パネル | `.tsk-shell__panel`   | その `aria-label` |

### キーボードとフォーカス（P1-3・P1-4）

- **Tab で移れる候補**（`shell.js` の中の関数 `tabbablesIn(dialog)`）: `drawer.js` の `focusablesIn` の結果から、`tabIndex < 0` のもの、`closest('[inert]')` があるもの、**`matches(':disabled')` のもの（無効な `fieldset` の中の入力欄を含む）**、見えないもの（`getClientRects().length === 0` か、計算した `visibility` が `hidden`）を除いたもの。`drawer.js` の `focusablesIn` は変えない
  - **完了前の確認（Codex）で直した（節 8）**: 負のものは `tabIndex` のプロパティではなく **`tabindex` 属性**で見る（`tabindex` の無い編集欄は `tabIndex` が -1 を返すが Tab で移れるため）。候補に**編集できる領域の入口**（`contenteditable`）を足す。並びは**ブラウザと同じ**（`tabindex` が正のものを値の小さい順に先、そのあと 0 と指定なしを文書の順）にし、折り返しの先頭・末尾もこの並びで決める
- 開くとき: 候補の最初へ。候補が0件ならダイアログ要素そのものへ
- **Tab の循環**: ダイアログ要素に付けた keydown（bubble）で、毎回 `tabbablesIn` を取り直し、最後（またはダイアログ要素そのもの）で Tab なら最初へ、最初（またはダイアログ要素そのもの）で Shift+Tab なら最後へ折り返す。**候補が0件なら Tab・Shift+Tab を止めて（`preventDefault`）ダイアログ要素に留める**。フォーカスがドロワーにあるあいだはこの keydown が起きないので、止める・再開するの調停は要らない。focusin は捕まえない
- **Esc**: document の keydown（bubble）で受ける。動くのは `!event.defaultPrevented` かつ `activeElement` が重ねものの中か body のときだけ（ドロワーの中の Esc はドロワーが capture で先に処理する。`.tsk-drawer` の有無は見ない）
- 閉じるとき（Esc・覆い・`[data-shell-close]`・`toggle`・`close()`）: 戻り先へ「focus して、`activeElement` が変わったか確かめる」。順番は 開いたボタン → 同じ `data-shell-toggle` の別のボタン → `__page`（`tabindex="-1"`）
- 幅が変わって重ねものが閉じたとき: `activeElement` が外枠の中（閉じた領域の中を含む）なら上の順で戻す。外（ドロワーなど）なら動かさない
- ドロワーを閉じたときの戻り先が隠れている場合: `drawer.js` の直し（`fallbackFocus` を試す）で救う。外枠と一緒に使うときは `fallbackFocus: () => document.querySelector('.tsk-shell__page')` を渡す例を README と見本に書く。渡さなければ今の動きのまま（既知の制限として書く）
- 実装の前に、作り物の DOM が `focus()` で `activeElement` を更新するかを確かめる（しなければテスト用の作り物を直す）

#### 重ねているあいだのトースト（Codex 3回目 P2 の決定。指示役）

- **重ねものを開いているあいだは、操作ボタンつきのトーストを出さない**（使う側の決まり。README に書く）。重ねものはサイドバー・右パネルの一時的な表示で、そこで操作の要る知らせが出る場面は少ない
- 重ねているあいだに出たトーストは、目で見える知らせとしてだけ扱う。キーボード・読み上げで操作ボタンに届くことは保証しない（`aria-modal` のため外の内容を読まない支援技術がある）
- 操作の要る知らせは、重ねものを閉じてから出すか、画面の中（`tsk-msg` など）に置く
- 確かめ方の4は「重ねものの上でドロワーを出す → 操作でき、Esc はドロワー→重ねものの順」と「知らせだけのトーストが見える」に分ける

### 寸法と見た目

| 項目                    | 値                                                                                                                                              | 理由                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 上の行                  | wide・mid 40px（`--ui-topbar-h`）、narrow 44px                                                                                                  | 02／yuuki 決定（narrow の押せる範囲 44px）      |
| 上の行のボタン          | wide・mid 28px（`tsk-iconbtn`）。narrow は実寸 44×44px・間隔 0、戻る・進むは隠す                                                                | 07 の押せる範囲。重なり・上端の欠けを起こさない |
| サイドバーの行          | wide・mid 34px、narrow の引き出しの中 44px                                                                                                      | 見本／07                                        |
| アプリの項目            | 40px（`--ui-rail-item`）、narrow の引き出しの中 44px                                                                                            | 02／07                                          |
| narrow の引き出しの幅   | `min(336px, 100vw - 40px)`（列 56 + サイドバー 280。右に本文が少し見える）                                                                      | 02 の寸法の和                                   |
| narrow の下からのシート | 高さは中身に合わせ、上限 `80dvh`。上の角丸 16                                                                                                   | 07（下からのシート）                            |
| mid の重ねたサイドバー  | 幅 280、列の右から出す                                                                                                                          | 02                                              |
| mid の重ねた右パネル    | 幅 340、右から出す                                                                                                                              | 02                                              |
| 本文の面 `__face`       | 地 `--ui-surface-page`、枠 `--ui-border-middle`、角丸 12。外側の余白 右 8・下 8                                                                 | 見本 `ShellList.html`                           |
| 右パネル（wide）        | 面の内側の右の列 340（`--ui-panel-w`）。列の余白 12/12/12/0、中の面は角丸 16・`--ui-shadow-floating`・地 `--ui-surface-panel`。自分でスクロール | 見本 `ShellEditor.html`                         |
| 重なりの順              | 覆い 800・重ねもの 801（`tsk-scrim` 900 より下）                                                                                                | ドロワーを上に出すため                          |
| 動き                    | 開閉 200ms、`prefers-reduced-motion` では 0                                                                                                     | 07                                              |

tokens に無い数値は `shell.css` に書き、この表を stage2-log に写す（DERIVED と同じ考え方）。色は tokens だけ。

### パンくず（P2-7）

- `__start` に `min-width: var(--_lead)` を付ける（`--_lead` = 列の幅 + サイドバーの幅。段・開閉・`data-rail` の組み合わせで決まる既知の長さ）。`max()` は使わない
- **本文の面の中の文字の左端（面の左端 + 枠 1px + 24px）にそろえるのは「wide でサイドバーが開いているとき」だけ**と決める。mid・narrow・サイドバーを閉じたとき・`data-rail="hidden"` は、ボタン群の右に一定の間隔（12px）で置く
- 長いパンくずは省略（…）。見本で座標を実測する

### やらないこと

- クライアント切り替えのプルダウン・通知・探す（⌘K）の中身
- 本文の中のタブ（06）。暗い画面（07 で色が未決）
- 開閉の好みの保存（使う側）
- 外枠の外（body の他の子）を操作不能にすること（上の層か使う側の責任）

### 確かめ方

#### node のテスト（依存なし）

- `shell.css`: tokens 以外の色が無い、寸法が `--ui-*` を使う、@media が `SHELL_MEDIA` と一致、フォーカスの輪、`prefers-reduced-motion`、narrow の 44px（上の行・ボタン・行）
- `shell.js`（作り物の DOM）: 属性の持ち主の表どおり、`onRequest` の有無、wide の `toggle` が DOM の逆を絶対値で求める、`syncA11y()` の表（段 × 重ねもの × 好み × rail の全組み合わせで `inert`・`role`・`aria-expanded`）、幅をまたいだら `data-overlay="none"`、つなぐ→外す→つなぐ、`destroy()` の2回呼びと属性の取り除き、Tab の折り返し、Esc の条件、戻り先の順番
- `drawer.js`: 戻り先が隠れているとき `fallbackFocus` へ行く（新しいテスト）。既存のドロワーのテストがすべて通る
- 配布: `exports`、22 ファイル、配布物からの `attachShell`、単一HTMLで `kedamaCore.attachShell`

#### ブラウザでの確かめ（見本 `examples/shell.html`。Orca の内蔵ブラウザか Playwright の MCP。依存は増やさない）

1. 767↔768、1199↔1200 の往復（767.5・1199.5 も）で、隙間・重なりが無い
2. 重ねているあいだに幅を変える → 閉じ、`inert` が残らない
3. narrow の引き出しの中からドロワーを開き、mid へ幅を変えてからドロワーを閉じる → フォーカスが `__page` に来る
4. 重ねものの上でドロワーを出す → 操作でき、Esc はドロワー→重ねものの順。知らせだけのトーストが重ねものの上に見える
   4b. ダイアログの中の最初・最後の候補を隠したとき、候補が0件のときも、Tab が中に留まる
   4c. 先頭が無効な `fieldset` の中の入力欄・末尾が閉じるボタンのとき、末尾で Tab を押すと正しい先頭へ移る。候補がその無効な入力欄だけのときは0件として扱い、ダイアログ要素に留まる
5. つなぐ→外す→つなぐ（見本にボタン）
6. `onRequest` の反映を 300ms 遅らせ、反映の前・あいだ・後に続けて押す → 求めは絶対値で、最後は DOM と一致
7. 実際の Tab・Shift+Tab が重ねものの中で折り返し、背面へ行かない
8. narrow で上の行のボタンの端を押して正しいボタンが反応する（`elementFromPoint`）
9. 3つの幅（1440・1024・390）× 開閉を撮り、`getComputedStyle` で寸法とパンくずの座標を実測して表にする

#### 段1と同じ確認

`verify:pack`、単一HTMLへの組み立て、ルートの5つの確認、CI。

### 経緯

- Fable 助言1（11-18）: 案B、属性を分ける、`__side`、覆い、`data-rail`、3つの幅、yuuki への確認1問
- Codex 1回目（high）: 着手保留。P1×4・P2×2・改善3 → 第2版
- Codex 2回目（high）: 着手保留。P1×4（古い反映と控え、`inert` の範囲と後から足される要素、Tab の循環、幅変更後のドロワーの戻り先）・P2×3（`aria-expanded`、44px の重なり、パンくずの `max()`）・改善4
- Fable 助言2（11-18、2回つまずいたため）: `<dialog>` は不採用（top layer の外のドロワー・トーストが使えなくなる）、「ドロワーを開いたら重ねものを閉じる」も不採用。`inert` を外枠の中の7つに限り毎回計算、控えて戻すのをやめる、Tab は端で折り返す、Esc は activeElement で判定、`drawer.js` の `restoreFocus` だけ直す、求めは絶対値で状態を持たない、narrow は上の行 44px → 第3版
- yuuki 決定（11-18）: 中くらいの幅は重ねる、narrow の上の行は 44px
- Codex 3回目（high）: 着手保留。2回目の7件は解消5・一部2。P1×2（7要素を一律に扱うとダイアログ自身が操作不能、Tab の候補と0件の扱い）・P2×1（トーストの操作保証と aria-modal の矛盾）。改善提案なし → 第3版の追記: `inert` の割り当て表、`tabbablesIn` と0件の扱い、重ねているあいだの操作つきトーストは出さない決まり
- Codex 4回目（high）: 着手保留。3回目の3件は解消2・一部1。残る P1×1（無効な `fieldset` の中の入力欄が Tab の候補に残る）。新しい矛盾・改善提案なし → Codex の示したとおり `:disabled` を候補から除き、ブラウザでの確かめ 4c を足した。この1行の追記をもって着手する（指示役の判断。完了前のレビューで実装を確かめる）

## 7. 外枠の実装（0.2.0、2026-11-18、実装担当 Claude Opus）

枝 `feat/core-stage2-shell`（main = 381ffaf から）。Node 22.22.1、npm 10.9.4。

### 7.1 着手前の基準（main = 381ffaf）

| 確かめたこと          | 結果                        |
| --------------------- | --------------------------- |
| `pnpm lint`           | 通過                        |
| `pnpm format:check`   | 通過                        |
| `pnpm typecheck`      | 通過                        |
| `pnpm test`           | 通過（27 ファイル・716 件） |
| `pnpm build`          | 通過                        |
| `cd core && npm test` | 通過（104 件）              |
| `npm run verify:pack` | 通過（20 ファイル）         |

### 7.2 実装の前に確かめたこと（作り物の DOM の `focus()`）

`test/parts.test.mjs` の作り物の DOM は、`focus()` で**いつも** `activeElement` を変える（inert の中・隠れた要素・無効な要素でも移る）。
外枠は「focus して、`activeElement` が変わったか確かめる」ことで戻り先を選ぶので、この作り物では確かめられない。
そこで外枠の試験用に `test/fakedom.mjs` を新しく作った（ブラウザと同じく、inert の中・`display:none`・`hidden`・`visibility:hidden`・
無効な要素・無効な `fieldset` の中・フォーカスできない要素へは移らない。幅を変えられる `matchMedia`、手で流す `MutationObserver`、
`getComputedStyle` の `visibility` も持つ）。作り物そのものの動きは `test/shell.test.mjs` の最初のテストで確かめる。
`parts.test.mjs` の作り物は変えていない（既存のテストの前提を変えないため）。
ブラウザで実物も確かめた（7.6 の 3・4b・4c・7）。

### 7.3 作ったもの・変えたもの

| ファイル                                          | 中身                                                                                                                               |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `ui/shell.css`（新規）                            | 外枠の CSS。3つの幅の段、重ねもの、引き出し、下からのシート、44px、フォーカスの輪、動き                                            |
| `ui/shell.js`（新規）                             | `attachShell`（`toggle`・`close`・`destroy`、`onRequest`）、`SHELL_MEDIA`、`SHELL_TARGETS`                                         |
| `ui/drawer.js`                                    | `restoreFocus` だけ（5行）。戻り先が文書に残っていても focus できなかったら `fallbackFocus` を試す                                 |
| `package.json`                                    | `exports` に `./shell.css`・`./shell.js`。`version` 0.2.0                                                                          |
| `scripts/single-html.mjs`                         | JS の順に `shell`（drawer の後ろ）、CSS の順に `shell`（components の後ろ）                                                        |
| `scripts/verify-pack.mjs`                         | ui 10 ファイル・全部で 22 ファイル。配布物から `attachShell` を読み、小さな作り物の DOM につないで外すところまで動かす             |
| `test/shell.test.mjs`・`test/fakedom.mjs`（新規） | 外枠の振る舞いと CSS の決まり（下の 7.5）                                                                                          |
| `test/parts.test.mjs`                             | ドロワーの直しのテスト2件。静的な決まりのファイルの一覧に `shell.js`                                                               |
| `test/css.test.mjs`                               | 間隔の px の直書きの検査に `shell.css` を足した（例外なし）                                                                        |
| `test/single.test.mjs`                            | `kedamaCore.attachShell`・`SHELL_MEDIA`                                                                                            |
| `examples/shell.html`（新規）                     | 見本。つなぐ・外す、`onRequest`（無し・すぐ・300ms 遅らせる）、ドロワー・トースト、列を隠す、右パネルの中身の切り替え（4b・4c 用） |
| `README.md`・`CHANGELOG.md`                       | 外枠の節（HTML の形・幅の段・属性の持ち主・JavaScript・React・ドロワーとトースト・既知の制限）、0.2.0（未公開）                    |

`src/`・ルートの `package.json`・`pnpm-lock.yaml`・`release.yml` は変えていない（`git diff main` で確かめた）。既存の部品の CSS・JS は `drawer.js` の5行のほかは変えていない。

### 7.4 設計案から外れたところ・設計案に無かった判断

下の表の上から5つ（`data-switching`・`calc` の直書き・wide の閉じるボタンの求め・keydown を外枠に付けること・幅を変えたときの `body` からの戻り）は、
Codex の完了前の確認で妥当と判定され、**指示役が採用した**（2026-11-18）。

| 何を                                                         | どうしたか・理由                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **段をまたいだ直後の `data-switching`**（設計案に無い属性）  | ブラウザでの確かめ 1 で、mid → narrow に幅を変えた直後の 200ms、閉じる動き（引き出しが左へ出ていく）が本文の上に見えた。`shell.js` が段をまたいだときに外枠へ `data-switching` を2こまだけ付け、`shell.css` がそのあいだ開閉の動き（`transition-property`）を止める。`destroy` で予約を無効にして取り除く。直したあと、幅を変えて 80ms 後に測っても重なりは無い |
| パンくずの `--_lead`                                         | 変数を定義しない決まり（値は `tokens.css` だけ）に合わせ、`--_lead` を作らず、そろえる場合（wide・サイドバーが開いている・列がある）の規則に `calc(var(--ui-rail-w) + var(--ui-sidebar-w) - var(--ui-space-2))` を直接書いた。そろえるのはこの1通りだけなので、意味は設計案と同じ                                                                               |
| wide での `[data-shell-close]`                               | 設計案は重ねものの閉じるボタンとしてだけ書いていた。wide で右パネルの中の閉じるボタンを押したとき何も起きないのは困るので、wide では好みを閉じる求め `onRequest({ kind: 'preference', target, open: false, reason: 'close' })`（`onRequest` が無ければ `data-*` を書く）にした。`reason` に `'close'` が増えた                                                  |
| Tab の折り返しの keydown を付ける場所                        | ダイアログ要素ではなく外枠の要素に付け、「イベントの元がいまのダイアログの中か」を見る（ダイアログになる要素が段で変わるため）。bubble で受ける・focusin を捕まえない・ドロワーの中では起きない、は設計案と同じ                                                                                                                                                 |
| 幅が変わったときの戻り先で `body` を「外枠の中」と同じに扱う | 段をまたいだときにブラウザがフォーカスを `body` へ落としている場合があるので、`body` のときも戻す（外枠の外の要素＝ドロワーなどにあるときは動かさない、は設計案のまま）                                                                                                                                                                                         |
| wide でフォーカスのある領域を閉じたとき                      | サイドバーの中にフォーカスがあるままサイドバーを閉じた（wide の好み）・wide → mid で閉じた領域に入った、ときも、開閉ボタン → 本文の順で移す（設計案の「戻り先の順番」を同じに使った）                                                                                                                                                                           |
| 同じ外枠に2つつなぐ                                          | 2つ目の `attachShell` は理由つきで止める（先に `destroy`）                                                                                                                                                                                                                                                                                                      |
| `__side` の `box-sizing`                                     | narrow の引き出しが右の枠のぶん 337px になっていたので `border-box` にした（336px）                                                                                                                                                                                                                                                                             |

### 7.5 tokens に無い数値（DERIVED と同じ考え方）

色はすべて `var(--ui-*)`。下は `shell.css` に直接書いた数値と理由。間隔（margin・padding・gap など）の 3px 以上の直書きは無い（`css.test.mjs` が確かめる）。

| 値                                                          | 場所                                                                            | 理由                                                            |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `34px`                                                      | サイドバーの画面の行の高さ（wide・mid）                                         | 見本 `ShellList.html` の行。02 に値が無い                       |
| `44px`                                                      | narrow の上の行・上の行と引き出しの先頭の `tsk-iconbtn`・画面の行・アプリの項目 | 07「押せる範囲 スマホでは 44×44px」、yuuki 決定（上の行 44px）  |
| `0`（gap）                                                  | narrow の上の行のボタンの間隔                                                   | 44px の押せる範囲どうしを重ねない（Codex 2回目 P2）             |
| `min(var(--ui-rail-w) + var(--ui-sidebar-w), 100vw - 40px)` | narrow の引き出しの幅（336px）                                                  | 02 の寸法の和。右に本文が 40px 見える                           |
| `80dvh`                                                     | narrow の下からのシートの高さの上限                                             | 07「下からのシート」。全面にしない                              |
| `200ms`                                                     | 開閉の動き                                                                      | 07「200ms（開閉）」。動きを減らす設定では 0                     |
| `800`・`801`                                                | 覆い・重ねものの重なりの順                                                      | ドロワーの覆い（`tsk-scrim` 900）より下。ドロワーを上に出すため |
| `calc(var(--ui-panel-w) - var(--ui-space-3))`               | wide の右パネルの面の幅（328px）                                                | 見本 `ShellEditor.html`。列 340 の中に右 12 の余白              |
| `calc(1px + var(--ui-page-pad-x))`                          | パンくずの左の余白（そろえるとき）                                              | 本文の面の枠 1px + 本文の左右の余白 24px                        |
| `1px`                                                       | 枠、画面の行の間隔                                                              | 見本の値                                                        |
| `20px`・`16px`                                              | アプリの項目・画面の行のアイコンの大きさ                                        | 見本の値                                                        |
| `24px`                                                      | アプリ切替の列の区切り線の幅                                                    | 見本の値                                                        |
| `100vh`・`100dvh`                                           | 外枠の高さ                                                                      | 画面いっぱい（`dvh` を読めないブラウザは `vh`）                 |
| `1.6`                                                       | 行の高さ                                                                        | ドロワー・トーストと同じ                                        |

### 7.6 node のテスト（`cd core && npm test`）

206 件すべて通過（着手前 104 件 + ドロワー 2 件 + 外枠 100 件）。外枠のテスト（`test/shell.test.mjs`）:

- 作り物の DOM の確かめ（7.2）
- つなぐ: `data-mode`・`data-overlay="none"`・覆い・`__page` の `tabindex`。幅の段の文字列は端数の幅でも1つだけに当たる
- 属性の持ち主: `onRequest` の有無、wide の `toggle` は呼ばれた時点の DOM の逆を絶対値で（控えを持たない）、`MutationObserver` で計算し直す、wide の閉じるボタンは `reason: 'close'`
- **`inert` の割り当て表の全行 × `data-rail` 2通り × 好み 4通り（56 件）**: 7つの要素の `inert`、`role`・`aria-modal`・`tabindex`、`aria-expanded`。ダイアログとその祖先に `inert` が無い
- 重ねて出す・閉じる: 最初の候補へ、0件ならダイアログへ、入れ替え、覆い・閉じるボタン、戻り先の順番、外にフォーカスがあるときは動かさない、段をまたぐと閉じて表どおりに戻る
- 段をまたいだ直後の `data-switching`（付ける・2こまで外す・`destroy` で予約を無効に）
- Tab の折り返し: 端で折り返す、中ほどは止めない、隠れた・負の `tabindex`・inert の中を飛ばす、0件で留まる、無効な `fieldset`（4c と同じ2通り）、`data-rail="hidden"` の列を飛ばす
- Esc とドロワー: Esc の条件、ドロワー → 重ねものの順、ドロワーのあいだは外枠の Tab が動かない、**narrow の引き出しからドロワー → mid → 閉じると `__page`（確かめ 3 と同じ）**
- 外す・つなぎ直す: 属性・覆い・監視・イベントを取り除く、使う側の属性は残す、何度呼んでもよい、StrictMode と同じ順
- `shell.css`: `--ui-*` だけ・変数を定義しない・`.tsk-shell` から始まる・`@media` が `SHELL_MEDIA` と一致・寸法・narrow の 44px・フォーカスの輪・動きと動きを減らす設定・重なりの順・閉じた重ねものの `visibility`・パンくず

テストが本当に落ちることも確かめた: `ui/shell.js` を7通りに壊して（割り当て表の1か所、`:disabled` の除外、0件の扱い、戻り先の順番、Esc の条件、`destroy` の後始末、`visibility` の判定）、それぞれ 1〜8 件が落ちた。ドロワーの直しを外すと新しいテストが落ちた。

### 7.7 ブラウザでの確かめ（見本 `examples/shell.html`）

- 道具: **Orca の内蔵ブラウザ**（`orca viewport`・`orca keypress`・`orca eval`・`orca screenshot`）。Playwright の MCP は拡張がつながらず使えなかった。依存は増やしていない
- 見本は `cd core && python3 -m http.server` で開いた
- 内蔵ブラウザのタブは前面に無く、描画のこまが間引かれる（`requestAnimationFrame` が1秒に数回）。`matchMedia` の change はこまの中で届くので、測るときは `requestAnimationFrame` で数こま待った（待たずに測ると `data-mode` が1つ前の段に見える。実物の不具合ではない）
- 端数の幅（767.5・1199.5）は、窓の幅が整数しか取れないので、その幅の `iframe` の中で同じ見本を開いて測った

| #   | 確かめたこと                                                                                    | 手順                                                                                                                                                                        | 結果                                                                                                                                                                                                                                                                                                                        |
| --- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 767↔768、1199↔1200 の往復、767.5・1199.5 で隙間・重なりが無い                                   | 767→768→767→768→1199→1200→1199→1200→1440→1024→390→1024→1440 と変え、80ms 後に `data-mode`・列・サイドバー・面の左右・上の行の高さ・横のはみ出し・当たる `@media` の数を測る | **通過**（13 回すべて）。wide は列の右 = サイドバーの左 = 56、サイドバーの右 = 面の左 = 336、面の右 = 幅 − 8。mid は列の右 = 面の左 = 56。narrow は面 8〜幅−8、上の行 44px。767.5 は narrow、1199.5 は mid で、どちらも当たる段は1つ。最初は段をまたいだ直後に閉じる動きが重なって見えた → `data-switching` で直した（7.4） |
| 2   | 重ねているあいだに幅を変える → 閉じ、`inert` が残らない                                         | mid・narrow でサイドバー・右パネルを開き、別の段へ（7通り: 1024→390、1024→1440 ×2、390→1024、390→1440 ×2、1024→390）                                                        | **通過**（7通り）。`data-overlay="none"`、`inert` はその段の none の行と同じ、`role="dialog"`・`aria-modal` は0、覆いは隠れる、フォーカスは開閉ボタンへ                                                                                                                                                                     |
| 3   | narrow の引き出しの中からドロワーを開き、mid へ変えてから閉じる → `__page` へ                   | 390 で引き出しを開き、中の「ドロワーを開く」→ 1024 へ → 本物の Esc                                                                                                          | **通過**。幅を変えてもフォーカスはドロワーの中（動かさない）。閉じると戻り先（引き出しの中のボタン）が隠れているので `fallbackFocus` で `__page` へ                                                                                                                                                                         |
| 4   | 重ねものの上でドロワー → 操作でき、Esc はドロワー → 重ねもの。知らせだけのトーストが上に見える  | 1024 で右パネルを開き、中の「知らせを出す」「ドロワーを開く」→ 本物の文字入力 → 本物の Esc を2回                                                                            | **通過**。ドロワーの欄に「けだま」と入った。1回目の Esc でドロワーが閉じ、フォーカスは右パネルの中の開いたボタンへ。2回目で右パネルが閉じ、開閉ボタンへ。トーストはドロワーの上に見えた（`04-mid-panel-drawer-toast.png`）                                                                                                  |
| 4b  | 最初・最後の候補を隠したとき、0件のときも Tab が中に留まる                                      | 右パネルの中身を「最初と最後を隠す」（`display:none` と `visibility:hidden`）・「0件」に切り替え、本物の Tab・Shift+Tab                                                     | **通過**。末尾で Tab → 見える先頭へ、先頭で Shift+Tab → 見える末尾へ。0件では開くとパネルそのもの、Tab・Shift+Tab でもパネルに留まる                                                                                                                                                                                        |
| 4c  | 先頭が無効な `fieldset` の中の入力欄・末尾が閉じるボタン。無効な入力欄だけなら0件               | 右パネルの中身を「無効な fieldset」「無効な欄だけ」に切り替え、本物の Tab・Shift+Tab                                                                                        | **通過**。末尾の閉じるボタンで Tab → 正しい先頭（「状態を変える」）へ。無効な欄だけのときは開くとパネルそのもの、Tab・Shift+Tab でも留まる                                                                                                                                                                                  |
| 5   | つなぐ → 外す → つなぐ                                                                          | 1024 で右パネルを開いたまま「外す」→「つなぐ」→「外してつなぐ」を2回 → 開いて閉じる                                                                                         | **通過**。外すと `data-mode`・`data-overlay`・`inert`・`role`・`aria-expanded`・`tabindex`・覆いがすべて無くなり、使う側の `data-sidebar`・`data-panel`・`data-rail` は残る。つなぎ直すと覆いは1つ、開閉と戻り先も動く                                                                                                      |
| 6   | `onRequest` の反映を 300ms 遅らせ、反映の前・あいだ・後に押す → 求めは絶対値、最後は DOM と一致 | 1440 で「300ms 遅らせる」。反映の前に2回押す → 1回目の反映を `MutationObserver` で見た直後（2回目の反映の前）に押す → すべて反映したあとに押す                              | **通過**。求めは open・open（反映の前は DOM が閉じたまま）・closed（あいだ。DOM は開いていた）・open（後）。最後の DOM は最後の求めと一致。どの時点でも `aria-expanded` と右パネルの `inert` は DOM と一致。重ねものは開かない                                                                                              |
| 7   | 本物の Tab・Shift+Tab が重ねものの中で折り返し、背面へ行かない                                  | mid の右パネル（Tab 6 回・Shift+Tab 3 回）、mid のサイドバー（各 11 回）、narrow の引き出し（各 15 回）、narrow の引き出し・列を隠す（各 12 回）                            | **通過**。毎回フォーカスがダイアログの中にあった（外へ出たことは1度も無い）。1回目の試しでは同じ要素が続けて記録されたところがあった（キーの送り方の間合い。2回目はすべて1つずつ進んだ）                                                                                                                                    |
| 8   | narrow で上の行のボタンの端を押して正しいボタンが反応する（`elementFromPoint`）                 | 390 で上の行の `tsk-iconbtn` 2つと引き出しの閉じるボタンの、上・下・左・右の端（1px 内側）・中心・角の近く（3px 内側）                                                      | **通過**。すべて 44×44px（左のボタンは 0,0 から、右は 346,0 から）で、どの点も正しいボタン。角の 0.5px は角丸 6px の外なので当たらない（形のとおり）                                                                                                                                                                        |
| 9   | 3つの幅 × 開閉を撮り、寸法とパンくずの座標を実測                                                | 下の表                                                                                                                                                                      | **通過**                                                                                                                                                                                                                                                                                                                    |

確かめ 9 の実測（`getComputedStyle`・`getBoundingClientRect`。単位は px。矩形は [左, 上, 幅, 高さ]）:

| 画像（`docs/screenshots/stage2/`）      | 段・状態                   | 上の行・ボタン | 列・項目      | サイドバー      | 本文の面（角丸）               | 右パネル                     | パンくずの文字の左 / 本文の文字の左 |
| --------------------------------------- | -------------------------- | -------------- | ------------- | --------------- | ------------------------------ | ---------------------------- | ----------------------------------- |
| `09-1440-sidebar-open.png`              | wide・開・閉               | 40・28×28      | 56・40×40     | [56,40,280,852] | [336,40,1096,852]（0 12 12 0） | —                            | **361 / 361**（そろう）             |
| `09-1440-sidebar-panel-open.png`        | wide・開・開               | 40・28×28      | 56・40×40     | [56,40,280,852] | [336,40,1096,852]（0 12 12 0） | [1091,53,328,826]（16・影）  | **361 / 361**                       |
| `09-1440-sidebar-closed-panel-open.png` | wide・閉・開               | 40・28×28      | 56・40×40     | —               | [56,40,1376,852]（12）         | [1091,53,328,826]            | 112（ボタン群の右 100 + 12）/ 81    |
| `09-1440-rail-hidden.png`               | wide・列を隠す             | 40・28×28      | —             | [8,40,280,852]  | [288,40,1144,852]              | —                            | 112（+12）/ 313                     |
| `09-1024-none.png`                      | mid                        | 40・28×28      | 56・40×40     | —               | [56,40,960,720]（12）          | —                            | 112（+12）/ 81                      |
| `09-1024-overlay-sidebar.png`           | mid・サイドバーを重ねる    | 40・28×28      | 56・40×40     | [56,40,280,720] | [56,40,960,720]                | —                            | 112 / 81                            |
| `09-1024-overlay-panel.png`             | mid・右パネルを重ねる      | 40・28×28      | 56・40×40     | —               | [56,40,960,720]                | [663,53,340,694]（16・影）   | 112 / 81                            |
| `09-390-none.png`                       | narrow                     | **44・44×44**  | —             | —               | [8,44,374,792]（12）           | —                            | 56（44 + 12）/ 33、長いものは …     |
| `09-390-overlay-sidebar.png`            | narrow・引き出し（幅 336） | 44・44×44      | 56・**44×44** | [56,89,279,755] | [8,44,374,792]                 | —                            | 56 / 33                             |
| `09-390-overlay-panel.png`              | narrow・下からのシート     | 44・44×44      | —             | —               | [8,44,374,792]                 | [0,596,390,248]（16 16 0 0） | 56 / 33                             |

- 本文の面: 地 `rgb(255,254,252)`（`--ui-surface-page` #fffefc）、枠 1px `rgb(232,230,224)`（`--ui-border-middle`）、本文の左右と上の余白 24px
- wide の右パネル: 面の右（1431）から 12 内側、上は面の上 + 枠 1 + 12。mid の重ねた右パネルは幅 340。mid の重ねたサイドバーは列の右（56）から幅 280、下は 8 空く
- narrow の引き出しは 390 の幅で 336px、360 の幅で 320px（`100vw - 40px`）。画面の行は 44px
- 単一の HTML: 見本の外枠の HTML を `buildSingleHtml` で1つにまとめ、ブラウザで開いた。外のファイルを読まず（`<link>`・`<script src>` が0）、`kedamaCore.attachShell` でつながり、右パネルを開くと `role="dialog"` で中の最初のボタンへ、閉じると開閉ボタンへ戻った

### 7.8 配布物

- `npm run verify:pack`: すべて通過。**22 ファイル**（ui 10・アイコン 8・tokens.json・README・LICENSE・package.json）、47.7 kB。配布物から `attachShell` を読み、作り物の DOM につないで `data-mode`・`inert`・覆いを書き、`destroy` で取り除くことまで確かめた
- 公開はしていない（`npm publish`・タグ・push をしていない）

### 7.9 着手後の基準（手順0と同じ）

| 確かめたこと          | 着手前              | 着手後                      |
| --------------------- | ------------------- | --------------------------- |
| `pnpm lint`           | 通過                | 通過                        |
| `pnpm format:check`   | 通過                | 通過                        |
| `pnpm typecheck`      | 通過                | 通過                        |
| `pnpm test`           | 27 ファイル・716 件 | 27 ファイル・716 件（同じ） |
| `pnpm build`          | 通過                | 通過                        |
| `cd core && npm test` | 104 件              | 206 件                      |
| `npm run verify:pack` | 通過（20 ファイル） | 通過（22 ファイル）         |

### 7.10 見つけたこと・残り

- **既存のドロワーの見出しの右に、空のチップが見える**（0.1.0 から）。`drawer.js` は `badge` が空なら `hidden` にするが、`components.css` の `.tsk-drawer__badge { display: block; … }` が `hidden` の既定の `display: none` に勝つ（`04-mid-panel-drawer-toast.png` の右上に写っている）。→ 完了前の確認のあと、指示役の決定で 0.2.0 に別のコミットで直した（節 8）
- `stage2-handoff.md` は「外枠は 0.2.0 で出す予定」のまま（指示役の文書）
- 0.2.0 の公開は人が行う

## 8. 完了前の確認（Codex、high、2026-11-18）と対応

全文は指示役の scratchpad の `review-shell-post-result.md`。判定は差し戻し（指摘4件・改善提案2件）。設計案から外れた5つ（7.4）は妥当と判定された。
直し方は指示役が決めた。

### 8.1 指摘と対応

| 種類     | 内容                                                                                                                                                  | 対応（コミット）                                                                                                                                                                                                                                                                                                                                                |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 指摘1 P1 | `contenteditable` が Tab の候補から落ちる（`tabIndex < 0` で除いていた。`tabindex` の無い編集欄の `tabIndex` は -1）。作り物の DOM も編集欄へ移れない | `tabbablesIn` は `tabindex` **属性**が負のものだけを除き、編集できる領域の入口（`isContentEditable` で、親は編集できない要素）を候補に足した。`fakedom.mjs` に `isContentEditable` と編集欄へのフォーカス（`tabIndex` は -1 を返す）を足した。テスト2件（末尾が編集欄・`tabindex="-1"` の編集欄と編集欄の中の要素）。節 6 の設計の写しにも注を足した（f19c641） |
| 指摘2 P2 | 正の `tabindex` があると端の判定が文書の順とずれ、要素を飛ばす（A・`tabindex=1` の B・C で A から Shift+Tab）                                         | 契約で禁止せず、**ブラウザと同じ順**に並べる（正の値の小さい順が先、同じ値は文書の順、そのあと 0 と指定なしを文書の順。整数として読めない値は指定なし）。開いたときの最初・折り返しの先頭・末尾もこの順。テスト1件（A・B=1・C・D=2・E=読めない値）（f19c641）                                                                                                   |
| 指摘3 P2 | narrow の上の行の文字のボタン（`tsk-btn--sm`）が 28px のまま                                                                                          | `shell.css` の narrow で、上の行と引き出しの先頭の `tsk-btn` に `position: relative; min-width: 44px` と、高さ 44px の `::before`（縦の中央、左右は枠の 1px まで）を付けた。見た目（28px・枠・地）は変えず、押せる範囲だけが 44px。README の既知の制限から外した。テスト1件（f19c641）                                                                          |
| 指摘4 P2 | README の導入手順が `@0.1.0` を入れたあと 0.2.0 の `shell.css` を読む                                                                                 | 導入の例を `@0.2.0` にし、「外枠は 0.2.0 から。使うなら 0.2.0 以上」と書いた。版の約束の例も 0.2.0 にそろえた（f19c641）                                                                                                                                                                                                                                        |
| 改善1    | ドロワーの空のチップを 0.2.0 に別のコミットで直す                                                                                                     | **採用**。`components.css` に `.tsk-drawer__badge[hidden] { display: none; }` を足した（`display: block` の規則の後ろ）。テスト1件（`css.test.mjs`）。CHANGELOG に「登記議事録つくるさんへ写すときの差」と書いた（08a28b5）                                                                                                                                     |
| 改善2    | 作り物の DOM は通常の Tab の移動をしないので、今回の2つもブラウザで確かめる                                                                           | **採用**（8.2）                                                                                                                                                                                                                                                                                                                                                 |

既存の部品の CSS・JS で変えたのは、`drawer.js` の5行（段2の設計）と、`components.css` の上の1規則（改善1）だけ。
**登記議事録つくるさんへ写すときの差**は、この2つ（`drawer.js` の `restoreFocus`、`components.css` の `.tsk-drawer__badge[hidden]`）と、新しい `shell.css`・`shell.js`。

壊して確かめた: `tabbablesIn` を (1) `tabIndex` のプロパティで除く、(2) 並べ替えない、(3) 編集欄を候補に足さない、の3通りに戻すと、それぞれ 1〜2 件が落ちた。

### 8.2 ブラウザでの確かめ（Orca の内蔵ブラウザ、見本 `examples/shell.html`）

見本の右パネルの中身に「末尾が編集欄」「正の tabindex」を足した。

| 確かめたこと                                     | 手順                                                                                                                                                                             | 結果                                                                                                                                                                                                                                                                          |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 末尾が `tabindex` の無い編集欄のときの折り返し   | 1024 で右パネル（末尾が編集欄）を開き、編集欄で本物の Tab・Shift+Tab                                                                                                             | **通過**。編集欄の `tabIndex` は実物でも **-1**。編集欄で Tab → 先頭（「状態を変える」）、そこで Shift+Tab → 編集欄、もう一度 Shift+Tab → 閉じるボタン、Tab → 編集欄 → Tab → 先頭                                                                                             |
| 正の `tabindex` の順                             | 1024 で右パネル（A・`tabindex=1` の B・C）を開き、本物の Tab を4回、A から Shift+Tab を4回                                                                                       | **通過**。開くと B へ。Tab: B → A → C → B → A。A から Shift+Tab: B → C → A → B（A から B へ戻る。Codex の例のとおり飛ばさない）                                                                                                                                               |
| narrow の上の行・引き出しの先頭の文字のボタン    | 390 で「保存」（`tsk-btn--sm`）と引き出しの先頭のクライアントの切り替え（`tsk-btn--ghost`）の、押せる範囲の上・下・左・右の端（1px 内側）・左上・右下・中心を `elementFromPoint` | **通過**（直したあと）。「保存」は見た目 [298, 8, 48, 28] のまま、押せる範囲は y 0〜44。外の点（ボタンのすぐ左・右）は隣（`__end`・右パネルの開閉ボタン）に当たり、重ならない。最初の試しでは右下の 1px が外れた（`::before` が枠の内側だけだった）→ 左右を -1px にして直した |
| ドロワーの見出しの右のチップ（空・設定・再び空） | 1024 でドロワーを開く → `setBadge('見本')` → `setBadge('')`。`getComputedStyle` と撮影                                                                                           | **通過**。空: `hidden`・`display: none`・矩形なし・見出しの最大幅 100%。設定: `display: block`・幅 42px・見出しの最大幅 60%。再び空: 空と同じ。撮影 `10-drawer-badge-empty.png`・`10-drawer-badge-set.png`・`10-drawer-badge-cleared.png`                                     |
| 単一の HTML                                      | 見本の外枠を `buildSingleHtml` でまとめ直してブラウザで開く。右パネルの末尾に編集欄を足して Tab                                                                                  | **通過**。外のファイルを読まない、`kedamaCore.attachShell` でつながる、チップの直しの規則が入っている、編集欄で Tab → 先頭へ                                                                                                                                                  |

- 撮り直した画像: `09-390-none.png`・`09-390-overlay-sidebar.png`（文字のボタンの見た目が変わっていないこと）
- 確かめの途中、内蔵ブラウザが古い `components.css` を持ち続けていた（再読み込みでは取り直さなかった）。`<link>` の行き先に `?v=…` を付けて読み直してから測った。`shell.css`・`shell.js` は新しいものだった（測った値が直したあとの規則どおり）

### 8.3 直したあとの確かめ

| 確かめたこと          | 結果                                                      |
| --------------------- | --------------------------------------------------------- |
| `cd core && npm test` | 211 件すべて通過（206 → 外枠 +4・チップ +1）              |
| `npm run verify:pack` | 通過（22 ファイル、48.7 kB）                              |
| 単一の HTML           | node のテスト（`single.test.mjs`）とブラウザ（8.2）で通過 |
| `pnpm lint`           | 通過                                                      |
| `pnpm format:check`   | 通過                                                      |
| `pnpm typecheck`      | 通過                                                      |
| `pnpm test`           | 27 ファイル・716 件（着手前と同じ）                       |
| `pnpm build`          | 通過                                                      |

## 9. 完了前の確認の2回目（Fable が代行、2026-11-18）と対応

Codex が利用の上限に達した（11-19 11:24 まで）ため、決まり（yuuki 決定 2026-11-06）により**完了前の確認の2回目は Fable が代行した**。
判定: 1回目の指摘4件はすべて解消。チップの直しは最小で記録も適切。`::before` の範囲、並べ替えと除外の関係にも新しい不具合は無い。

| 種類                 | 内容                                                                                                            | 対応                                                                                                                                                                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 指摘1                | `CHANGELOG.md` の2項目（Tab の候補と並び、narrow の文字ボタン 44px）が `drawer.js` の子項目に見える字下げだった | Tab の候補と並びを `shell.js` の項目の下へ、文字ボタンの 44px を `shell.css` の項目の下へ移した                                                                                                                                        |
| 改善（指示役が採用） | README に「正の `tabindex` は勧めない」と書く                                                                   | 既知の制限に一文足した（折り返すのは端だけで途中はブラウザ任せ。外枠の外に先にフォーカスできる要素があるとそこへ出る）                                                                                                                 |
| 改善（指示役が採用） | `tabindex` 属性の読み方を HTML に寄せる                                                                         | 正規表現での判定をやめ、`parseInt` の結果が `NaN` かどうかで判定（前の空白と符号を読み、数字のあとの文字は無視。`"1abc"` は 1、`"x"` は指定なし）。テストに `tabindex="1abc"` の要素を足した（前の読み方に戻すと落ちることを確かめた） |
| 改善（指示役が採用） | `shell.css` の文字ボタンの 44px の注に前提を書く                                                                | 「上の行・引き出しの先頭の `tsk-btn` は横一列が前提（縦に並べると 44px の範囲が重なる）」と書いた                                                                                                                                      |
| 記録だけ             | `aria-hidden="true"` の枝の中の要素を Tab の候補から外している（`focusablesIn` と同じ）                         | 現状維持。`aria-hidden` の中にフォーカスできる要素を置くのは作る側の誤りにあたるため                                                                                                                                                   |

直したあとの確かめ: `cd core && npm test` 211 件すべて通過（件数は同じ。既存のテストに要素を1つ足した）、`npm run verify:pack` 通過（22 ファイル）、`pnpm lint`・`pnpm format:check` 通過。
