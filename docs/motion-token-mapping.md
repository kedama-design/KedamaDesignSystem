# モーショントークン割当表

shadcn/ui から取り込んだコンポーネントのモーションを Kedama トークンへ写像した記録。
**次に何かを取り込むときの基準**として使う。

判断日: 2026-08-01 / Phase A-2

関連:

- `src/tokens/primitive/motion.ts` — 値そのもの（duration / easing / spring / inertia）
- `src/tokens/semantic/motion.ts` — 用途（feedback-press / overlay-enter / drag-release 等）と実測の経緯
- `src/stories/ComputedStyleAudit.stories.tsx` — 解決値の実測ページ
- `docs/cross-product-ui-library-spec.md` §3.5 — モーション方針

---

## 1. 割当の原則

**数値の近さで対応させない。** 上流の数値（450ms / 300ms / 250ms / 200ms / 150ms）は
上流の都合で書かれたものであり、450→400、200→240 のように寄せると上流のノイズを
そのまま保存することになる。**各箇所が何をしているか**で選ぶ。

| その箇所がしていること             | duration         | easing                                 |
| ---------------------------------- | ---------------- | -------------------------------------- |
| ホバー、色や不透明度の変化         | `fast` (120ms)   | `default`                              |
| 開閉、タブ切替、フェード           | `normal` (240ms) | `default`（方向があれば enter / exit） |
| オーバーレイ、大きな面の出入り     | `slow` (400ms)   | 入り `enter` / 出 `exit`               |
| 指の直接操作（ドラッグ・スワイプ） | —                | —（`drag-release`。§4 を参照）         |

上流と体感が変わるのは想定どおり。上流のタイミングは Calm UI 向けに設計されたものではない。

「上流との差分を増やさない」制約とは競合しない。あの制約は**構造や挙動をフォークしない**
という意味であり、トークン置換は差分ではなく取り込みの目的そのもの（Kedama トークンで
再スタイルする）である。

### Tailwind 側の書き方

| 用途     | クラス                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------- |
| duration | `duration-fast` / `duration-normal` / `duration-slow`                                             |
| easing   | `ease-default` / `ease-enter` / `ease-exit`                                                       |
| 退出方向 | `ease-enter data-ending-style:ease-exit`（Base UI は退出中の要素に `data-ending-style` を立てる） |

⚠️ `duration-*` は `tailwind.css` の `@utility` で定義した独自ユーティリティ。
Tailwind v4 に duration のテーマ名前空間は存在せず、`@theme` に `--duration-*` を
書いても生成されない（実測で確認）。`--ease-*` は名前空間が存在する。

---

## 2. transition の割当（実施済み）

| ファイル        | 対象                    | 何をしているか                        | 上流                                                   | 割当                                        |
| --------------- | ----------------------- | ------------------------------------- | ------------------------------------------------------ | ------------------------------------------- |
| `ui/button.tsx` | `buttonVariants` ベース | ホバー・フォーカスの色／影            | `transition-all`（duration 未指定＝既定 150ms）        | `duration-fast ease-default`                |
| `ui/table.tsx`  | `TableRow`              | 行ホバーの背景色                      | `transition-colors`（既定 150ms）                      | `duration-fast ease-default`                |
| `ui/sheet.tsx`※ | `SheetOverlay`          | スクリムのフェード                    | `duration-150`                                         | `duration-slow ease-enter` + 出 `ease-exit` |
| `ui/sheet.tsx`※ | `SheetContent`          | パネルの出入り                        | `duration-200 ease-in-out`                             | `duration-slow ease-enter` + 出 `ease-exit` |
| `ui/drawer.tsx` | `DrawerOverlay`         | スクリムのフェード                    | `duration-450 ease-[cubic-bezier(0.32,0.72,0,1)]`      | `duration-slow ease-enter` + 出 `ease-exit` |
| `ui/drawer.tsx` | `DrawerSwipeHandle`     | ハンドルが消える／現れるフェード      | `duration-200`                                         | `duration-normal ease-default`              |
| `ui/drawer.tsx` | `DrawerPopup`           | ドロワーの出入り                      | `duration-450 ease-[cubic-bezier(0.22,1,0.36,1)]`      | `duration-slow ease-enter` + 出 `ease-exit` |
| `ui/drawer.tsx` | `DrawerContent`         | ネスト時の中身のフェード              | `duration-300 ease-[cubic-bezier(0.45,1.005,0,1.005)]` | `duration-normal ease-default`              |
| `ui/toast.tsx`  | `Toast`                 | トーストの出入り（transform/opacity） | `transform 500ms` / `opacity 500ms`                    | `duration.slow` + `easing.enter`            |
| `ui/toast.tsx`  | `Toast`                 | スタック展開時の height               | `height 150ms`                                         | `duration.normal` + `easing.default`        |
| `ui/toast.tsx`  | `ToastContent`          | 背面トーストのフェード                | `duration-250 ease-[cubic-bezier(0.22,1,0.36,1)]`      | `duration-normal ease-default`              |

補足:

- ※ `ui/sheet.tsx` は **2026-08-02 に廃止**した（Drawer が唯一の汎用エッジパネル。
  仕様書 §2.2）。上の2行は当時の割当の記録であり、現在このファイルは存在しない。
- `DrawerContent` の上流 easing `cubic-bezier(0.45, 1.005, 0, 1.005)` は制御点の y が 1 を
  超えており **overshoot を含む**。§3.5「オーバーレイの出入りは damped、overshoot 不可」に
  反するため、置換で解消された。
- `SheetContent` の上流 `ease-in-out` は Tailwind v4 の既定値 `cubic-bezier(0.4, 0, 0.2, 1)` で、
  Kedama の `easing.default` と偶然同値だった（実測）。見た目は同じでもトークン経由ではない。
- `Toast` はプロパティごとに duration が異なるため、任意値の一括指定 `[transition:…]` の
  形を残したまま値だけをトークン変数に置き換えている。

---

## 3. animation / @keyframes の全数調査

`animate-*` を使っている箇所と、対応する `@keyframes` の実在。

**調査方法は grep ではなく、ブラウザで描画して `getComputedStyle` と CSSOM を読む**
（`Foundations/Computed Style Audit` の §4）。`animation-name` は keyframes が無くても
宣言名を返すため、名前だけ見ても「クラスは生成されたが keyframes が無い」を見逃す。

| クラス                   | 使用箇所                                         | 取り込み直後      | 現在                                         |
| ------------------------ | ------------------------------------------------ | ----------------- | -------------------------------------------- |
| `animate-spin`           | `ui/spinner.tsx` / `Button.tsx` / `ui/toast.tsx` | ✅ Tailwind 組込  | ✅ `spin` / 1s                               |
| `animate-pulse`          | `ui/skeleton.tsx`（既定では未使用・opt-in）      | ✅ Tailwind 組込  | ✅ `pulse` / 2s                              |
| `animate-accordion-down` | `ui/accordion.tsx`                               | ❌ keyframes 不在 | ✅ `accordion-down` / 240ms + `easing.enter` |
| `animate-accordion-up`   | `ui/accordion.tsx`                               | ❌ keyframes 不在 | ✅ `accordion-up` / 240ms + `easing.exit`    |
| `animate-in`             | `Modal.tsx`                                      | ❌ 供給元なし     | 廃止 → `animate-overlay-enter`               |
| `fade-in`                | `Modal.tsx`                                      | ❌ 供給元なし     | 廃止 → `animate-overlay-enter`               |
| `zoom-in-95`             | `Modal.tsx`                                      | ❌ 供給元なし     | **再現しない**（下記）                       |

### なぜ2回同じことが起きたか

accordion と Modal で原因は同じである。**shadcn の `init` が CSS 側へ書き込むはずの定義
（keyframes・base レイヤ・依存パッケージ）が、`init` を回避して配置だけを取り込んだために
存在しない。** クラス名はコンポーネントのソースに入っているので grep では「使われている」と
見え、実際には `animation-name: none` に落ちる。

同じ原因で `@layer base` の `border-color` も落ちていた（色を書かない `border-*` が
currentColor ＝文字色になっていた）。3回目を防ぐため、取り込み時のチェックリストを §5 に置く。

### zoom を再現しない理由

95% → 100% の拡大は注意を引くための「ポップ」の表現であり、§3.5「オーバーレイの出入りは
damped、overshoot 不可」の趣旨から外れる。業務システムのモーダルには過剰で、フェードだけで
「出現した」ことは十分に伝わる。

### tw-animate-css を導入しない理由

10行程度の CSS で書けるものに依存を足す理由がない（§2.2「依存を先取りしない」）。
`--animate-overlay-enter` / `--animate-overlay-exit` は `tailwind.css` の `@theme` に
自前で定義してある。`overlay-exit` は現時点で未使用だが、primitive と同じく在庫として残す。

---

## 3.5 例外 — slot-text 0.3.3 のレイアウト安定化処理

`RollingText`（`slot-text`）には、**公開 API から差し替えられない固定値**が1つある。
fork はせず、例外として記録する。

| 対象                           | 何をしているか       | 値                                              | 差し替え            |
| ------------------------------ | -------------------- | ----------------------------------------------- | ------------------- |
| `.char-face`（文字ロール本体） | 文字が転がる         | `transform` / **120ms** / `easing.default`      | 可（Kedama が固定） |
| `.char-slot`（幅の変化）       | 文字数が変わる時の幅 | `width` / **140ms** / `cubic-bezier(0.2,0,0,1)` | **不可**            |

幅側は slot-text 内部の `TUNING.width.minimumTransitionMs = 140` と
`resizeEasing` で動く。オプションに口が無いため、値を合わせるには fork するしかない。

**受け入れる理由**：これは表現ではなく**レイアウトが飛ぶのを防ぐ処理**である。
文字ロール本体（トークン準拠）とは役割が違う。20ms の差のために上流を分岐させると、
§2.1.5 が避けようとしている「取り込み品のフォーク」を自ら作ることになる。

**文字ロール本体のトークン準拠とは分けて扱う。** 上の表のとおり、ロール本体は
`value-change`（120ms / `easing.default`）に完全準拠していることを実測で確認済み。

---

## 4. 割り当てていない用途 — drag-release

`ui/drawer.tsx` の以下は**触っていない**。

- `data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)]`
- `data-swiping:duration-0` / `data-nested-drawer-swiping:duration-0`

これらは指の直接操作に連動して duration がスケールする箇所で、semantic の `drag-release`
にあたる。`drag-release` は **tween トラックを持たない**——CSS では現在速度を引き継げない
ため、この用途を CSS で実装してはならない（`semantic/motion.ts`）。

現状は上流の CSS 実装が残っている暫定状態である。Motion（`motion` パッケージ）は Drawer の
スワイプ等の直接操作部品まで導入を遅延する判断が出ており、そのときに `spring.directRelease` /
`inertia.directRelease` へ移す。

トークンを当てられないからといって tween トークンで代用しないこと。それは「約束していないもの」を
約束したことにしてしまう。

---

## 5. 取り込みチェックリスト

shadcn から新しくコンポーネントを取り込んだら、`Foundations/Computed Style Audit` に行を
足して**実測してから**完了とする。grep で判定しない。

0. **同じ役割の Kedama コンポーネントが既に無いか**を最初に確認する。
   **在る場合は、配置する前に統合方針を決める**（どちらを Tier 0 の正とするか、
   取り込み品を参照する箇所をどう差し替えるか）。配置してから考えると、
   同じ役割の部品が2つ並んだまま気づけない。
   実際に Button で起きた（Kedama 製と `ui/button.tsx` が角丸・高さ・variant 名の
   すべてで別体系のまま並存した。2026-08-02 に統合）。
   機械的な検出は `tests/componentCollision.test.ts` にある
   （`ui/<name>.tsx` と `components/<Name>/` の名前衝突で落ちる）。
   判断の記録は `docs/q1-tier0-unification.md`
1. `animate-*` を使っているか → §3 の表に行を足し、`@keyframes` の実在を CSSOM で確認する
2. `duration-*` / `ease-*` の直値が残っていないか → §1 の原則で用途別に割り当てる
3. 色を書いていない `border-*` があるか → `@layer base` の既定色が効いているか確認する
4. `data-starting-style` / `data-ending-style` を使っているか → 出入りで easing が切り替わるか確認する
5. 新しい色エイリアスを使っているか → Audit の表1・表2 に行を足す
6. `prefers-reduced-motion` で動きが消えたとき、**情報が失われないか**を確認する
   （消えて困るのは動きが情報を担っている部品だけ。`ui/spinner.tsx` が唯一の例）

---

## 6. 未解決

| 項目                           | 状態                                                                                                                                   |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Modal の退出アニメーション     | 未実装。`<dialog>` の close には `@starting-style` / `transition-behavior: allow-discrete` が要る。`--animate-overlay-exit` は定義済み |
| `drag-release` の CSS 暫定実装 | Motion 導入まで保留（§4）                                                                                                              |
