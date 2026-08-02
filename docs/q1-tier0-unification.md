# Q1 — Tier 0 コンポーネント統合の決定と実測

判断日: 2026-08-02 / Phase A-2 → Tier 0 統合

報告書 `codex-investigation-report.md` Q1 の「推奨方針」「未確定」に対する**確定版**。
食い違う場合は本書を正とする。

関連:

- `docs/codex-investigation-report.md` Q1 — 調査結果と推奨
- `docs/cross-product-ui-library-spec.md` §0.6（デザイン言語の統合方針）・§2.1.5（取り込み方針）・§4 Tier 0
- `docs/surasura-ui-benchmark-research.md` §9（ビジュアル原則）

---

## 0. 前提として解消したこと

仕様書が4箇所で参照していた「すらすらスタジオ ベンチマーク調査」の実体を
`docs/surasura-ui-benchmark-research.md` として取り込んだ（バイト単位で原典と同一）。
原典はスラスラスタジオ側の `.working/` 配下にあり、従来の探索から漏れていた。
§7.2 アプリシェル / §7.3 記事一覧 / §8 推奨コンポーネント構成 / §9 ビジュアル原則が
実在することを確認済み。Phase B の AppShell 設計はこれを直接参照できる。

---

## 1. 統合前の実態（報告書になかった事実）

報告書 Q1 は「Kedama 6部品 vs Ibuki」の比較として書かれているが、その後の
§2.1.5 の取り込みによって、リポジトリには **Button が2つ**存在していた。

| ファイル                           | 出自                   | 使われ方                                  |
| ---------------------------------- | ---------------------- | ----------------------------------------- |
| `src/components/Button/Button.tsx` | Kedama 製              | `src/index.ts` から公開                   |
| `src/components/ui/button.tsx`     | shadcn Base UI variant | `ui/sheet.tsx` / `ui/toast.tsx` が import |

同じ要素に2つの見た目（角丸 4px/16px、高さ 32-48/24-36、variant 名も別体系）が
並存する状態であり、本プロジェクトが解こうとしている「ずれ」そのものだった。

---

## 2. 決定

| #   | 論点                  | 決定                                                                                                                       | 根拠                                                                  |
| --- | --------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| D1  | Button の統合形       | **単一 Button へ統合**。Base UI の `render` ベースで作り直し、`ui/button.tsx` は削除。`sheet`/`toast` は統合 Button を参照 | §4 Tier 0「asChild→render」。2つの見た目の並存を解消する              |
| D2  | Button のサイズ体系   | **取り込み品準拠 24 / 28 / 32 / 36**（`xs` / `sm` / `default` / `lg`）＋ `icon-*`                                          | 取り込む Tier 2 ブロックが無調整で馴染むことを優先                    |
| D3  | Button の variant 名  | `primary` / `secondary` / `outline` / `ghost` / `danger`。既定は `primary`                                                 | Kedama を正とする報告書 Q1 推奨。`outline` は Ibuki から追加          |
| D4  | Badge の brand の扱い | **prop 名を `status` → `variant` へ改名**。値は `accent` として既に実装済み                                                | 「brand は状態ではなく分類」。`status="accent"` は分類として破綻      |
| D5  | Card の padding       | **24px**（root `py-6`/`gap-6`、各パート `px-6`）                                                                           | 現行 §0.6「スペーシング → shadcn が正」。経緯は下記                   |
| D6  | Card の影             | **影は持つ**。段は用途名 `shadow-raised` で参照（D7）                                                                      | §0.6 方針転換でエレベーションは shadcn が正。A-1 の削除判断は撤回済み |
| D7  | エレベーション        | **semantic に `elevation` を定義**。影なし＝操作部品／`raised`＝地の上に浮く面／`overlay`＝オーバーレイ                    | §3.3 の primitive → semantic → component を影にも適用                 |
| D8  | tailwind-merge        | **入れない**。競合そのものを禁じ、テストで担保する                                                                         | 実測で上流との挙動差ゼロ。設定の乖離が別の silent failure を生む      |

### D5 の経緯（16px → 24px・2026-08-02）

一度 16px にしたが差し戻した。16px の根拠は「§0.6 で『Ibuki が構成・レイアウトの正』と
決めたこと」だったが、**その条項は 2026-07-30 に撤回済み**だった（仕様書 §0.6 の
方針転換ブロックと、取り消し線の入った本文）。現行の既定ルールは
「見た目・構造・スペーシング・エレベーション・角丸 → **shadcn** が正」であり、
shadcn の Card は 24px を持つ。

例外として記録する道は採らなかった。2026-07-30 の方針転換は「細部で判断が毎回
止まる」ことを解消するために作られたものなので、Card padding だけ例外を切ると、
shadcn 由来の部品を取り込むたびに同じ問答が起きて転換の目的が失われる。
密度が問題になった場合は Card 単体の例外ではなく、システム全体の密度の問題として
扱う（compact バリアントの導入など）。実際に困るかは Phase C で分かる。

### 報告書の推奨から意図的に外した点

**Ibuki の `default` を別名にしない。** 報告書は `brand`/`default`/`destructive` を
deprecated alias にすることを推奨しているが、`default` だけは採用しなかった。

- Ibuki の `default` = 面＋境界線（＝ Kedama の `secondary` 相当）
- shadcn の `default` = 主要アクション（＝ Kedama の `primary` 相当）

同じ綴りが上流ごとに逆の意味を持つ。黙って片方へ寄せると、もう一方の取り込み品が
意図しない色で描画される。`brand`→`primary`、`destructive`→`danger` のみ別名とし、
`default` は移行時に `secondary` へ明示的に書き換える。

**Card の影は残した。** 報告書・Ibuki・ベンチマーク §9 の3つは「影なし」で一致するが、
**この論点は今回が初出ではない**。経緯は以下のとおり（2026-08-02 に確認）。

1. Phase A-1 の指示に「Card の `shadow-sm` を削除（Ibuki の影なしを採用）」が入っていた
2. その後 **2026-07-30 の §0.6 方針転換で明示的に撤回された**。仕様書 §0.6 に
   「**この転換で覆った A-1 の判断**：Card の `shadow-sm` 削除。shadcn の Card は
   `shadow-sm` を持つため復活させる」と記録されている
3. したがって A-1 の実装（`079bbda`）でも削除されず、`Card.test.tsx` には
   「shadcn の Card は shadow-sm を持つため Kedama も影を持つ」というコメント付きの
   アサーションが置かれた

つまり `shadow-sm` は**一度も削除されていない**（Card.tsx の全2コミットに存在する）。
今回の D6 は新しい判断ではなく、撤回済みの A-1 判断を蒸し返さなかっただけである。
現行 §0.6 の「エレベーションは shadcn が正」にも一致する。

### D7 エレベーション（2026-08-02 確定）

実測で出た形を規則として追認し、`src/tokens/semantic/elevation.ts` に定義した。

| 段        | 用途           | 対象                                   |
| --------- | -------------- | -------------------------------------- |
| 影なし    | 操作部品       | Button                                 |
| `raised`  | 地の上に浮く面 | Card                                   |
| `overlay` | オーバーレイ   | Modal / Sheet / Toast / 将来の Popover |

部品は用途名（`shadow-raised` / `shadow-overlay`）を使い、primitive の段
（`shadow-sm` / `md` / `lg`）を直接書かない。`tests/elevation.test.ts` が担保する。

**影の「色」は shadcn ではなく Kedama が決める。** §0.6 の「エレベーション →
shadcn が正」が決めるのは**段の有無と割当**であって色ではない。色はトークンの
領域であり、暖色（birch）のパレットには無機質な黒よりブランドカラーを混ぜた影が
合う。`overlay` は primary/600 を 12% 混ぜた Kedama 独自の値を使う。

`shadow.md` は未使用のまま残す（primitive は在庫、semantic は約束）。

なお「lg が2種類ある」件は、**実際には最初から1種類だった**。Modal も
`ui/sheet` / `ui/toast` も同じ `shadow-lg` ユーティリティを使っており、値は
どれも primitive の `shadow.lg`（ブランド色混ぜ）に解決していた。前回の報告で
「Modal は Kedama 独自、sheet/toast は取り込みそのまま」と書いたのは**出自**の
違いを指したもので、値の違いではない。紛らわしい書き方だった。

### D8 tailwind-merge を入れない（2026-08-02 確定）

提案は `docs/proposal-tailwind-merge.md`。見送りの理由は3つ。

1. 導入根拠だった「上流との黙ったフォーク」が、実測で成立していなかった
2. 唯一の競合は取り込み品ではなく自作の Button ghost 由来なので、依存を
   足さずに発生源を断てる
3. `extendTailwindMerge` で独自 `duration-*` / `ease-*` を教える設定が要り、
   その設定がトークンから乖離すると静かに誤ってマージされる。silent failure を
   1つ減らすために別の silent failure を1つ増やす取引になる

代わりに行ったこと:

- **ghost から既定文字色を外した**（上流 shadcn の ghost と同形）。競合の発生源が消えた
- その結果 ghost の文字色は継承になり、実測で **純黒 `rgb(0,0,0)`** に落ちた。
  Kedama に純黒は存在しないため、原因である「`@layer base` に既定文字色が無い」
  ことを修正した（border-color と同種の欠落。§2.1.5 の注意書きにある3件と同類）。
  修正後は `rgb(4,3,2)` = `fg.default` に解決する
- `tests/classConflict.test.ts` で競合そのものを禁じた。Tailwind 本体の `compile()`
  で CSS を生成し、同じプロパティを2つのクラスが設定していたら落ちる。
  ghost に文字色を戻すと実際に落ちることを確認済み

---

## 3. 非推奨の別名（1 major の間だけ受け付ける）

| コンポーネント | 旧                      | 新                  | 注意                                        |
| -------------- | ----------------------- | ------------------- | ------------------------------------------- |
| Button         | `variant="brand"`       | `variant="primary"` | —                                           |
| Button         | `variant="destructive"` | `variant="danger"`  | —                                           |
| Button         | `size="md"`             | `size="default"`    | **寸法が 40px → 32px に変わる**。綴りは通る |
| Badge          | `status="…"`            | `variant="…"`       | 両方指定された場合は `variant` が勝つ       |

Ibuki Badge からの移行は別名を用意していない（明示的に書き換える）:
`neutral`→`default` / `brand`→`accent` / `warning`→`warning` / `destructive`→`danger`

---

## 4. 実測（getComputedStyle・Chrome/CDP）

クラス名の文字列一致ではなく、ブラウザが解決した値。

### Button

| 対象                                     | 実測値                                            | 判定 |
| ---------------------------------------- | ------------------------------------------------- | ---- |
| size `xs`/`sm`/`default`/`lg`            | 24 / 28 / 32 / 36 px                              | ✅   |
| `icon-xs`/`icon-sm`/`icon`/`icon-lg`     | 24 / 28 / 32 / 36 px（正方形）                    | ✅   |
| 角丸                                     | 4px（`rounded-sm`。ベンチマーク §9 の 4〜8px 内） | ✅   |
| `duration-fast`                          | 0.12s（`--primitive-duration-fast` = 120ms）      | ✅   |
| `ease-default`                           | cubic-bezier(0.4, 0, 0.2, 1)                      | ✅   |
| primary の面／文字                       | rgb(14,85,55) / rgb(248,247,244)（純白不使用）    | ✅   |
| `border-border-strong`                   | rgb(133,128,115) = `#858073`                      | ✅   |
| `bg-accent-danger`                       | rgb(134,19,11) = `#86130B`                        | ✅   |
| `[&_svg:not([class*='size-'])]:size-3.5` | svg が 14×14px に追従                             | ✅   |
| `aria-disabled:opacity-[…]`              | opacity 0.4 = `--primitive-opacity-disabled`      | ✅   |

後ろ2つは**生成されなければ静かに壊れる**種類の指定だったため個別に確認した。
前者が効かないと取り込み品のアイコンが既定 24px で描画され、後者が効かないと
`render` で非 button にしたときの無効表示が消える。

### Card（24px 差し戻し後・2026-08-02 再計測）

| 対象                | 実測値                                          | 判定 |
| ------------------- | ----------------------------------------------- | ---- |
| root の上下 padding | 24px                                            | ✅   |
| root の row-gap     | 24px                                            | ✅   |
| root の左右 padding | 0px（各パートが持つ構造を維持）                 | ✅   |
| 各パートの左右      | 24px                                            | ✅   |
| 影                  | rgba(0,0,0,0.04) 0 1px 8px（= `shadow-raised`） | ✅   |
| 角丸／面            | 8px ／ rgb(248,247,244)                         | ✅   |

### エレベーション（用途名の導入後）

| 対象                     | 実測値                                                                  | 判定 |
| ------------------------ | ----------------------------------------------------------------------- | ---- |
| `--elevation-raised`     | `0 1px 8px 0 rgba(0,0,0,0.04)`                                          | ✅   |
| `--elevation-overlay`    | `0 8px 32px -4px rgba(49,80,57,0.12), 0 4px 12px -2px rgba(0,0,0,0.03)` | ✅   |
| Card（`shadow-raised`)   | rgba(0,0,0,0.04) 0 1px 8px                                              | ✅   |
| Modal（`shadow-overlay`) | rgba(49,80,57,0.12) 0 8px 32px -4px ＋ rgba(0,0,0,0.03) 0 4px 12px -2px | ✅   |
| Button                   | `box-shadow: none`（フォーカスは `outline`。box-shadow を使わない）     | ✅   |

### Button ghost の文字色（既定色を外した影響）

| 状態                               | 実測 `color`   | 判定                         |
| ---------------------------------- | -------------- | ---------------------------- |
| 外した直後（`@layer base` 修正前)  | **rgb(0,0,0)** | ❌ 純黒。Kedama に存在しない |
| `@layer base` に既定文字色を追加後 | rgb(4,3,2)     | ✅ `fg.default` (`#040302`)  |

ghost 側に文字色を戻す道は採らなかった。戻すと取り込み品との競合が復活するため
（`tests/classConflict.test.ts` が検出する）。継承元である `body` の既定文字色が
欠けていたのが原因であり、そちらを直した。

### Badge `accent`

| 対象 | 実測値                                             | 判定 |
| ---- | -------------------------------------------------- | ---- |
| 面   | rgb(210,250,226) = `--color-accent-primary-subtle` | ✅   |
| 文字 | rgb(14,85,55) = `--color-accent-primary`           | ✅   |
| 比較 | `--color-status-success` = `#143717` と別値        | ✅   |

`accent` と `success` が実際に別の色を引いていることを確認した（「選択されている」と
「成功した」が同じ色にならない、という Q1 の要件）。

### Sheet の閉じるボタン（統合の要）

`ui/button.tsx` を削除して統合 Button に差し替えた箇所。一時ストーリーで描画して計測:

| 対象    | 実測値                                   | 判定 |
| ------- | ---------------------------------------- | ---- |
| ボタン  | 28×28px（`icon-sm`）、面は透明、角丸 4px | ✅   |
| `XIcon` | 14×14px（自動追従）                      | ✅   |

---

## 5. 無効化したリンクの扱い（Ibuki からの変更）

Ibuki は `asChild + disabled` を `inert` で塞いでいた。統合 Button では Base UI の
扱いに委ねる（`tabIndex={-1}` ＋ `aria-disabled` ＋ click / keydown / pointerdown の遮断）。

`inert` は要素をアクセシビリティツリーから外すため、同時に付けた `aria-disabled` が
読み上げられない。「無効だと分かる」ことを優先して Base UI の扱いを採った。
契約は `Button.test.tsx` で実測している（tab order から外れる・click で発火しない）。

---

## 6. 統合が不要だった部品

Ibuki `packages/ui/src/components/` に**対応部品が存在しない**ため、そのまま:

| Kedama      | Ibuki 側                                                         |
| ----------- | ---------------------------------------------------------------- |
| `TextField` | 無し（Input なし）                                               |
| `Modal`     | 無し（Dialog なし。`drawer.tsx` は Tier 0 の別項目 Drawer）      |
| `Icon`      | 無し（`icon-swap.tsx` はアイコン差し替えアニメーションで別用途） |

---

## 7. 積み残し

- **deprecated alias の除去 major version**（報告書 Q1 の未確定）は据え置き。
  最初の本番適用（すらすらスタジオ）が終わり、実際の移行コストが見えてから決める
- **`cn()` は clsx のみで tailwind-merge を含まない**。同じ CSS プロパティを触る
  ユーティリティが base と size/variant の両方にあると打ち消し合わず、生成 CSS の
  順序で勝敗が決まる。統合 Button では gap・高さ・余白・border 色・svg サイズを
  size/variant 側だけに寄せて回避した。消費側が `className` で寸法を上書きする
  ケースは同じ理由で確実に効くとは限らない。tailwind-merge の導入は本番依存の
  追加になるため、必要になった時点で用途・bundle 影響とあわせて提案する
- `ui/sheet.tsx` / `ui/toast.tsx` には常設のストーリーが無い。今回は一時ストーリーで
  計測して削除した。Q4（低層部品）で常設化するのが自然
