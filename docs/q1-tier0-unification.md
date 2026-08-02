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
| D5  | Card の padding       | **16px**（root `py-4`/`gap-4`、各パート `px-4`）                                                                           | ユーザー判断。⚠️ 根拠に注記あり（下記）                               |
| D6  | Card の影             | **`shadow-sm` を維持**                                                                                                     | §0.6 方針転換でエレベーションは shadcn が正。A-1 の削除判断は撤回済み |

### ⚠️ D5 の根拠についての注記（2026-08-02 追記）

D5 は「§0.6 で『Ibuki が構成・レイアウト・挙動の正』と決めたことの帰結」として
指示されたが、**その §0.6 の条項は 2026-07-30 に撤回されている**
（仕様書 §0.6 の方針転換ブロック、および取り消し線の入った本文）。
現行の §0.6 の既定ルールでは「見た目・構造・スペーシング・エレベーション・角丸 →
**shadcn** が正」であり、shadcn の Card は padding 24px を持つ。
つまり現行ルールに素直に従えば 24px になる。

16px はユーザーの明示的な指示として採用し実装済みだが、**根拠は現行 §0.6 ではない**。
エレベーション方針の整理とあわせて、16px を維持するなら §0.6 の例外として
記録するのが筋（Calm UI が shadcn の既定と衝突する場合の判断は記録する、と
§0.6 自身が定めている）。

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

### Card

| 対象                | 実測値                                       | 判定 |
| ------------------- | -------------------------------------------- | ---- |
| root の上下 padding | 16px                                         | ✅   |
| root の row-gap     | 16px                                         | ✅   |
| root の左右 padding | 0px（各パートが持つ構造を維持）              | ✅   |
| 各パートの左右      | 16px                                         | ✅   |
| 影                  | rgba(0,0,0,0.04) 0 1px 8px（shadow.sm 維持） | ✅   |
| 角丸／面            | 8px ／ rgb(248,247,244)                      | ✅   |

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
