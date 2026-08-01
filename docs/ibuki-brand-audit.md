# `--brand` 使用箇所の監査と移行先

Ibuki には **success セマンティックが存在しない**。成功・完了・正常を表す色を
すべて `--brand`（ブランドの緑）で代用している。

このため「ブランド色」と「成功状態」が画面上で同じ色になり、
Kedama 側でトークンを分離しても**消費側が brand を流用し続ける限り画面は変わらない**。

本書は移行先を確定させるための一覧である。`docs/text-faint-audit.md` と同じ構造の課題。

- 調査対象: `Ibuki-Code-v2` HEAD `565ecb7e6d5ec38560e967718978cb6c9f3ad728`
- 調査日: 2026-07-31
- 検出件数

| 対象 | `--brand` | `--brand-600` | `--brand-soft` | `--text-brand` | 計 |
|---|---|---|---|---|---|
| プロトタイプ | 74 | 3 | 23 | 98 | **198** |
| 本番コード（apps/web ＋ packages/ui） | — | — | — | — | **70** |

> **機械置換はしない。** 同じ `--brand` でも、ブランドを指すのか成功状態を指すのかで
> 移行先が変わる。判定には文脈が要る。

---

## 0. なぜ発覚したか

新パレット適用後にプロトタイプの「改善タスク」画面を実測したところ、
**描画されている有彩色に success の緑が1つも無かった**。

| 実際に描画されていた色 | 正体 | 出現 |
|---|---|---|
| `#0E5537` | brand（primary/600） | bg 9 / fg 7 |
| `#54140E` | danger/700 | fg 8 / bg 4 |
| `#3C2B00` | warning/700 | bg 4 / fg 2 |
| success の緑 | — | **0** |

画面上で「対応中」が緑に見えていたのは、ブランド緑をそのまま使っていたため。

**仕様書 §0.6 の再配色マッピング表にも `--success` の行が無い。** Ibuki 側に
存在しないトークンなので当然だが、この欠落があると移行時に見落とされる（§8 参照）。

---

## 1. 移行先の3分類

| 分類 | 移行先 | 判定基準 |
|---|---|---|
| **A. ステータス** | `--success` 系（新設） | 「成功した」「完了した」「正常である」を伝えている。値や状態に応じて色が変わる |
| **B. ブランド／アクセント** | `--brand` のまま | 主要アクション、リンク、選択状態、ロゴ、アバター。状態ではなく「主役」を示す |
| **C. データ可視化** | `--chart-*` / `dataViz.emphasis-positive` | チャートの系列色。凡例・軸とセットで意味が決まる |

**判定に迷ったときの順序**

1. 値や状態によって色が切り替わるか → **A**
2. チャート・グラフの内部か → **C**
3. それ以外（常にこの色） → **B**

---

## 2. 新設した alias

`src/styles/alias-ibuki.css`（generator 出力）に追加済み。

```css
--success:        var(--color-status-success);
--success-bg:     var(--color-status-success-bg);
--success-border: var(--color-status-success-border);
--success-solid:  var(--color-status-success-solid);
```

Light では `--success` = `success/700`、`--success-solid` = `success/400`。
`--brand`（primary/600）との知覚差は **ΔE 0.226**（色覚 D 型でも 0.216）。
同じ段どうしなら 0.033 しかないため、**この段の対応関係を崩さないこと**。

---

## 3. A（ステータス）— `--success` へ移す

### 3.1 本番コード：決定的な箇所

| ファイル:行 | 現在のコード | なぜ A か |
|---|---|---|
| `apps/web/.../tasks/tasks-board.tsx:74` | `progress >= 100 ? "var(--brand)" : progress > 0 ? "var(--warning)" : "transparent"` | **進捗100%＝brand、進行中＝warning。** 値によって色が切り替わる完全なステータス表現。最も明確な証拠 |
| `apps/web/.../tasks/tasks-board.tsx:63` | `delta > 0 ? "text-text-brand" : "text-text-muted"` | 改善（プラス）を brand で表現。増減という**状態**に応じて切り替わる |
| `apps/web/.../tasks/tasks-board.tsx:377` | `<i className="… bg-brand" />`（凡例） | 上記の凡例。本体を移すなら凡例も揃える |
| `apps/web/.../settings/api-keys/api-keys-view.tsx:105` | `swap={<Check className="size-4 text-text-brand" />}` | **チェックマーク＝完了**。コピー成功のフィードバック |
| `apps/web/.../sites/[siteId]/share-settings.tsx:269` | 同上 | 同上 |
| `apps/web/.../sites/[siteId]/improve-tab.tsx:466` | 同上 | 同上 |

Check アイコンへの brand 着色は **4 箇所**、progress/完了判定は **3 箇所**。

### 3.2 プロトタイプ：クラス名が用途を明示している箇所

| 行 | セレクタ | なぜ A か |
|---|---|---|
| 149 | `.track > i.good{background:var(--brand)}` | **クラス名が `good`**。良好状態 |
| 293 | `.ob-dot.done{background:var(--brand)}` | **`done` ＝ 完了** |
| 1282 | `<i style="background:var(--brand)"></i>着手/完了` | **凡例テキストに「着手/完了」と明記** |
| 217 | `.statusbar .sb-dot{background:var(--brand)}` | ステータスバーの状態ドット |
| 228 | `.toast .tdot{background:var(--brand)}` | トーストの種別ドット。成功トーストなら A |
| 243 | `.progress > i{background:var(--brand)}` | 進捗バー。3.1 の `tasks-board.tsx:74` と同じ用途 |

> **294 行 `.ob-dot.cur` は要確認**：オンボーディングの「現在のステップ」を示す。
> 「成功」ではなく「いまここ」なので **B（選択状態）** が妥当だが、`.done` と並ぶため
> 色の対比設計として一緒に判断すること。

---

## 4. B（ブランド／アクセント）— `--brand` のまま

移行不要。ただし一部は**より適切なトークンがある**。

| 箇所 | 現在 | 推奨 |
|---|---|---|
| `improve-tab.tsx:114` / `site-diagnosis.tsx:269` ほか **11 箇所** | `text-text-brand hover:underline` | `--text-brand`（＝ `fg.link`）のままで正しい |
| `audit-logs-view.tsx:28` / `api-keys-view.tsx:22` ほか **4 箇所** | `focus:outline-[color-mix(in srgb,var(--brand) 30%,transparent)]` | **`--border-focus` へ。** フォーカスリング専用トークンがあり、色を混ぜる必要もない |
| プロトタイプ 66 | `.pb-logo` | ロゴ |
| プロトタイプ 86 / 88 | `.proto-nav a.on` | ナビの選択状態（`bg.selected` 相当） |
| プロトタイプ 98 / 99 | `.btn.brand` | プライマリボタン |
| プロトタイプ 123 | `.badge.brand` | ブランドバッジ |
| プロトタイプ 185 | `.side .org .av` | アバター |
| プロトタイプ 284 | `.step .num` | ステップ番号 |
| プロトタイプ 601 / 1385 | トグル ON | shadcn / Ibuki とも accent で表現 |
| `site-diagnosis.tsx:299` | `bg-brand-soft text-text-brand` | スコアバッジ |

---

## 5. C（データ可視化）— `--chart-*` へ移す

**プロトタイプの `--brand` 74 箇所のうち最も多いのがこの用途。**
`packages/ui/src/charts/` 配下だけで **29 箇所**が brand を参照している。

| ファイル | 内容 |
|---|---|
| `packages/ui/src/charts/trend-line.tsx:45,46,60` | エリアのグラデーションと線に `chartColors.brand` |
| `packages/ui/src/charts/timeline-row.tsx:83` | `state === "active" ? "bg-brand" : "bg-chart-1"` |
| `packages/ui/src/charts/palette.ts:5` | コメント「only the latest / highlighted / positive value takes the single brand green」 |

プロトタイプ側の該当行（抜粋）: 137（スパークライン）／396・869・1001（レーダー塗り）／
629・1821（エリアのグラデーション）／633・711・722・734・1434・1826（点）／
748・767・849–852・903・913（バー）／784・799（折れ線）／810・818（目盛り）／
827・834・1781–1785（比較バー）／1490・1499・1542（スパークライン）／
671–675・1295–1302（ガント / タイムライン）

**移行先は `dataViz.emphasis-positive`**（Kedama semantic）。Light では primary/600 と
同値なので**見た目は変わらない**が、意味の分離ができる。将来チャートの強調色だけを
変えたくなったときに、ブランド色を巻き添えにしなくて済む。

> `timeline-row.tsx:83` の `state === "active"` は用途が A に見えるが、44 行のコメントが
> 「緑 (brand) = 着手/完了, 灰 = 未着手」と書いており、**チャート内の系列色**として
> 設計されている。C として扱い、凡例とセットで判断する。

---

## 6. `--text-brand`（98 箇所）が最大の要注意

プロトタイプでの出現が最多。**リンク色と「成功の文字色」が混在している。**

- リンクとして使っている → `--text-brand`（`fg.link`）のまま
- 「+8」「改善」など**良い変化の数値**に使っている → `--success`
- チャートのラベル → `--chart-*`

`tasks-board.tsx:63`（`delta > 0 ? "text-text-brand"`）が後者の典型。
98 箇所すべてを開いて判定する必要があるが、**プロトタイプは廃止対象**（仕様書 §6）なので、
実際に直すのは本番コード側だけでよい。

---

## 7. 実施順序の推奨

1. **`packages/ui/src/charts/palette.ts` を最初に直す。** チャートの色定義元で、
   1 箇所の修正が広く効く（`text-faint` 監査の `palette.ts:24` と同じ構造）
2. **`tasks-board.tsx:74` と `:63`** を `--success` へ。最も明確なステータス誤用
3. **Check アイコン 4 箇所**を `--success` へ
4. **focus outline 4 箇所**を `--border-focus` へ（`color-mix` も不要になる）
5. `--text-brand` の残りを §6 の基準で1つずつ判定
6. 完了後、**「brand が値に応じて切り替わる箇所が無い」**ことを確認する。
   次の grep が空になれば A の移行は完了

```bash
grep -rnE '(>=|>|===)[^)]*var\(--brand\)|\?[^:]*"var\(--brand\)"' apps/web packages/ui
```

---

## 8. 仕様書側の修正（未実施）

`docs/cross-product-ui-library-spec.md` §0.6 の再配色マッピング表に
**`--success` の行が無い**。Ibuki に存在しないトークンだったためだが、
このままでは移行時に見落とされる。次の行を追加すべき。

| Ibuki CSS変数 | 旧値 | 新値（Kedama由来） | 出典 |
|---|---|---|---|
| （新規）`--success` | なし（`--brand` で代用） | `#143717` | success/700 |
| （新規）`--success-bg` | なし | `#D3FBD4` | success/50 |
| （新規）`--success-solid` | なし | `#0E9B2F` | success/400 |
