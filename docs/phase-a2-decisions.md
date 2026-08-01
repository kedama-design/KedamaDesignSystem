# Phase A-2 — 面・スクリム・ブラーの決定

判断日: 2026-08-01（ユーザー判断・すべて反映済み）

Phase A-2（shadcn/ui の Base UI 版を取り込み、Kedama トークンで再スタイルし、
Calm UI 原則に照らして調整する）で決めた3件を、理由込みで記録する。

いずれも Storybook で実画面を描画し、スクリーンショットを見て決めた。
判断に使った画像は `docs/screenshots/` にある。

関連:

- `docs/phase-a1-token-decisions.md` §6 — Dark surface の保留（本書で決着）
- `docs/motion-token-mapping.md` — 同じ Phase のモーション割当
- `src/stories/DarkSurfaceRealistic.stories.tsx` / `ScrimComparison.stories.tsx` — 判断に使ったページ

---

## 1. Dark surface — birch/700（既定のまま）

`bg.surface` を birch/700（既定）と birch/800（`data-surface="alt"`）のどちらにするか。
報告書 Q7 が「本文階調の余地を優先して birch/800 へ下げる」案を出しており、A-1 では
「プロトタイプ作成時に実画面で決める」として保留していた。

**決定: birch/700 を既定として確定。** birch/800 は `data-surface="alt"` として残す。

### 根拠

単色の面を並べた比較（`Dark Surface Comparison`）では決め手が出なかったため、実部品を
1画面に載せたページ（`Dark Surface Realistic`）を作って判断した。実部品を載せると差が
はっきり出た。700 ではカード・テーブル・アコーディオンがそれぞれ面として立ち、
サイドバー → ページ → サーフェスの3層が一目で読める。800 では面がほぼ消え、区切りが
`border.muted` のヘアラインだけに載る。

800 を採らない理由は3つ。

1. **業務ダッシュボードの中心的な用途が「密なデータを走査する」ことで、面の分離は
   その塊分けを助ける。** 800 は塊が見えない
2. **§0.6 ルール1「surface は bg より1段階明るい」に従うのが 700。** 800 は例外扱いが要る
3. **800 ではスケルトンと `fg.muted` がほぼ地に沈む。** 700 の方がこれらの可読性が高い

報告書 Q7 が想定した「本文階調の余地」は、実画面では 700 でも十分に確保できていた。

### 残すもの

`darkSurfaceAlt` と `[data-theme='dark'][data-surface='alt']` はそのまま。より平坦な
見た目を好む場合の選択肢として機能する。両案ともコントラスト検証を通過済みなので、
切り替えてもテストは緑のまま。

### 画像

|                                           |                           |
| ----------------------------------------- | ------------------------- |
| `docs/screenshots/dark-realistic-700.png` | 実部品・birch/700（採用） |
| `docs/screenshots/dark-realistic-800.png` | 実部品・birch/800         |
| `docs/screenshots/dark-surface-700.png`   | 単色の面・birch/700       |
| `docs/screenshots/dark-surface-800.png`   | 単色の面・birch/800       |

---

## 2. スクリム — bg.scrim（birch/900 50%）に統一

取り込んだ Sheet / Drawer は上流の `bg-black/10` を使っており、`Modal` が使う
`bg.scrim`（birch/900 を 50%）と食い違っていた。

**決定: `bg.scrim` に一本化。`bg.scrim-subtle` は新設しない。**

### 根拠

判断を2段に分けた。

**(a) 純黒の除去は無条件。** Kedama は純白・純黒を定義しないと定めている以上、理由を
問わず除去対象。

**(b) 濃さは実画面で判断した。** 3案（`black 10%` / `birch/900 10%` / `bg.scrim 50%`）を
並べて分かったこと:

- **10% では純黒と birch/900 の区別が視覚的につかない。** つまり (a) の除去は見た目を
  1ミリも変えない。判断すべきは濃さだけだった
- **10% はモーダルとして機能していない。** Light では背面のリストがそのまま読め、Dark に
  至ってはほぼ何も起きていない。Sheet / Drawer は既定でモーダル（フォーカスを閉じ込め、
  背面を不活性化する）であり、遮断しておきながら見た目は「触れそう」なまま——
  **挙動と外観が食い違っている**
- **50% は Light で明確に遮断が伝わり、Dark でも地が暗いぶん重すぎない**

### なぜ2つ持たないか

濃さを2種類持つと「どちらを使うか」の判断が呼び出し側に発生する。これはモーションの
トラック選択で潰したのと同じ問題（`semantic/motion.ts`「トラックは選択肢ではない」）。

将来モーダルでないパネルが必要になったときに `bg.scrim-subtle` を、**使い分け規則と
セットで**足す。先には作らない。

### 画像

|                                            |                        |
| ------------------------------------------ | ---------------------- |
| `docs/screenshots/scrim-dark-no-blur.png`  | 3案・Dark（採用条件）  |
| `docs/screenshots/scrim-light-no-blur.png` | 3案・Light（採用条件） |
| `docs/screenshots/scrim-dark-blur8.png`    | 3案・Dark・blur 8px    |
| `docs/screenshots/scrim-light-blur8.png`   | 3案・Light・blur 8px   |

---

## 3. backdrop-filter: blur() — 既定オフ

`primitive/opacity.ts` は scrim と blur の併用を「推奨」と書いており、実装もそれに
従っていた。実測すると効いてはいたが、**強さが2種類**あった。

| 箇所                      | クラス                                           | 実測        |
| ------------------------- | ------------------------------------------------ | ----------- |
| Modal の `::backdrop`     | `backdrop-blur-[var(--primitive-backdrop-blur)]` | `blur(8px)` |
| Sheet / Drawer のスクリム | `supports-backdrop-filter:backdrop-blur-xs`      | `blur(4px)` |

**決定: 既定オフ。両方を外す。**

### 根拠

1. **50% 単独で目的を達している。** 実画像で比較したところ、blur が無くても背面が
   不活性であることは明確に伝わる。blur は必要な機能を追加するものではなく、
   「さらに読めなくする」だけだった
2. **全画面要素の `backdrop-filter` は GPU 負荷が高い。** 大きなテーブルを背面に持つ
   業務画面では体感の引っかかりになり得る。利用者の端末が高性能とは限らない前提では
   割に合わない

強さが2種類ある不整合も、どちらも外すことで同時に解消する。

### 検討過程での訂正（記録として残す）

当初「ベンチマーク §9 の『避ける』にガラス表現が入っており、blur の推奨と矛盾するの
ではないか」という論点が出た。**これは根拠にしていない。** 仕様書 439 行目が引用する
§9 の原則は「ニュートラルな背景・控えめな区切り・4〜8px の角丸・主要アクションのみ
アクセント・色だけで状態を伝えない」の5点で、ガラスへの言及がない。ベンチマーク文書
自体がリポジトリに無く原文を確認できないため、記憶からの引用として扱い、判断からは
外した。上記の2点だけで決めている。

### primitive は在庫として残す

`backdropBlur = '8px'` は削除しない。**現時点で semantic からの参照が無い**が、
primitive は在庫であり、使われない値があってよい（`spring` プリセットや Light テーマの
birch/900 と同じ扱い）。

⚠️ 将来 blur を使う判断が出た場合は、**必ず `--primitive-backdrop-blur` の単一値を
経由させること**。4px / 8px が用途ごとに散らばる状態には戻さない。

---

## 反映箇所

| 判断 | ファイル                                                                                          |
| ---- | ------------------------------------------------------------------------------------------------- |
| 1    | 変更なし（既定が既に birch/700）。`darkSurfaceAlt` も現状維持                                     |
| 2    | `src/components/ui/sheet.tsx` / `drawer.tsx` — `bg-black/10` → `bg-scrim`                         |
| 3    | `src/components/Modal/Modal.tsx` — `backdrop:backdrop-blur-[…]` を削除                            |
| 3    | `src/components/ui/sheet.tsx` / `drawer.tsx` — `supports-backdrop-filter:backdrop-blur-xs` を削除 |
| 3    | `src/tokens/primitive/opacity.ts` — 在庫である旨と再導入時の条件を明記                            |
