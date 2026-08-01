# デザインシステム トークン管理パイプライン

## 現在地（2026-07-29）

> **重要な訂正**：本書の初版は「Figma を single source of truth とし、コードへの反映を
> 自動化する」と書いていたが、**そのパイプラインは一度も稼働していない**。
> Codex 調査（`docs/codex-investigation-report.md` Q3）で確認された事実は次のとおり。
>
> - `.github/workflows/` に workflow が無い
> - ルートに `tokens/` ディレクトリと Style Dictionary 設定が無い
> - `package.json` にあるのは自作の `generate:tokens` のみで、Style Dictionary 依存は無い
> - `src/tokens/` は通常の TypeScript ソースで、生成ヘッダを持たない
>
> **したがって現時点の single source of truth は Figma ではなくコード（`src/tokens/`）である。**
> 自動同期が動くまで「Figma が SoT」と表現しない。

| 層 | 状態 |
|---|---|
| `src/tokens/`（TypeScript） | **稼働中。現在の SoT** |
| `scripts/generate-css-tokens.ts` → `src/styles/*.css` | **稼働中**（`pnpm generate:tokens`） |
| Figma Variables | 存在するが**構造が古い**（§2 のギャップ参照） |
| Tokens Studio / Style Dictionary / GitHub Actions | **未導入** |
| Chromatic | 未導入（仕様書 §6：複数プロダクトが消費し始めてから再検討） |

---

## 1. 段階

```
[現在] Phase A-1 完了時点
  src/tokens/*.ts  ── 唯一の正
       └─ scripts/generate-css-tokens.ts
            ├─ src/styles/tokens.css        （プリミティブ + 3テーマのセマンティック）
            ├─ src/styles/alias-ibuki.css   （Ibuki 互換・var() 参照のみ）
            └─ src/styles/alias-shadcn.css  （shadcn 互換・var() 参照のみ）
                 └─ src/styles/tailwind.css の @theme が取り込む
                      └─ Storybook

[次] Figma へ構造を戻す（§2）— 手作業。コード → Figma の一方向

[将来] 自動同期を有効化（§4）— 稼働条件を満たしてから
```

**順序が逆であることが重要。** Figma を SoT にしたいなら、まず Figma 側に
**コードと同じ構造**が存在しなければならない。現状の Figma は A-1 で確定した構造を
持っていないため、いま Figma → コードの同期を有効化すると A-1 の成果が上書きで壊れる。

---

## 2. Phase A-1 で確定した構造を Figma へ反映する方針

### 2.1 規模のギャップ

| | Figma 現状（CLAUDE.md 記載） | A-1 完了後のコード | 差 |
|---|---|---|---|
| Primitives（Variables） | 88 | 色 77 ＋ 非色（spacing / radius / shadow / z-index / border-width / focus-ring / opacity / breakpoints / duration / easing / data-viz 非色） | 要拡張 |
| Semantics（Variables） | 35 | **71 変数 × 3 モード** | **約2倍、かつモードが 1 → 3** |
| Text Styles | 10 | **13** | ＋3（`numeric-sm` / `-md` / `-xl`） |

セマンティック 71 の内訳: `fg` 9 / `bg` 11 / `border` 7 / `accent` 13 / `status` 20 / `dataViz` 11。

### 2.2 コレクションとモードの設計

- **Primitives コレクション** — モードなし（単一）。値そのものを持つ層なのでテーマで変わらない
- **Semantics コレクション** — **モードを3つ持つ**：`light` / `dark` / `deep-dark`。
  Figma Variables の Modes 機能がテーマ切替にそのまま対応する。
  各変数は Primitives への **Variable Alias** として定義し、実値を直接持たせない
  （`docs/design-rules.md` 1.1「セマンティックトークンに直接値を書かない」の Figma 版）

**`dark-alt`（比較用の birch/800 案）はモードにしない。** これは Dark surface の既定値を
決めるための一時的な比較材料であり、決定後は片方が消える。Figma に持ち込むのは決定後の1つだけ。

### 2.3 命名の対応

コード側の CSS 変数名がそのまま Figma のパスに対応する。

| コード | Figma |
|---|---|
| `--primitive-color-birch-700` | `Primitives` / `color/birch/700` |
| `--color-fg-default` | `Semantics` / `color/fg/default` |
| `--color-bg-surface` | `Semantics` / `color/bg/surface` |
| `--color-data-viz-heatmap-max` | `Semantics` / `color/data-viz/heatmap/max` |
| `--typography-numeric-md-*` | Text Style `numeric/md` |

**エイリアス層（`--text` / `--foreground` 等）は Figma に持ち込まない。**
あれは消費側プロダクトのための互換層であって、デザインの語彙ではない。

### 2.4 Figma で表現できないもの

反映方針として最も重要なのはここ。**これらはコード側にしか存在できない**ため、
将来「Figma が SoT」を名乗る場合でも、この範囲は永久にコードが正になる。

| 対象 | 件数 | 理由 | 扱い |
|---|---|---|---|
| `spring` / `inertia`（primitive） | 5 | 物理演算のパラメータ組（`stiffness` / `damping` / `mass` / `power` / `timeConstant`）。Figma Variables に対応する型が無い | コードが正。Figma には注記のみ |
| `semanticMotion`（semantic） | 7 | 同上 | コードが正 |
| `bg.scrim` の `ColorMix` | 3テーマ分 | 「プリミティブ参照 ＋ アルファ合成」という**合成**は Variable Alias で表現できない。Figma に載せると実値（alpha 付き color）になり、プリミティブへの参照が切れる | Figma には実値で置き、**コードが正**と注記 |
| `fontVariantNumeric`（`tabular-nums`） | 3 | Figma の Text Style は OpenType feature を設定できるが、Variables としては表現できない | Text Style 側で再現し、コードが正 |

`duration` / `easing` は Figma Variables の number / string として持てるため反映対象に含める。

### 2.5 反映の手順（手作業・一方向）

1. Primitives を先に揃える（`docs/design-rules.md` 3.3 の順序厳守）
2. Semantics コレクションに3モードを作り、**すべて Primitives への Alias** で定義する
3. Text Styles を13に拡張（`numeric-*` 3件を追加し `tabular-nums` を設定）
4. §2.4 の対象は Figma 側に注記だけ置き、値の正はコードに残す
5. 反映後、**コードから再生成した CSS と Figma の値を突き合わせて差分ゼロを確認**する
   （この検証が通るまで §4 の自動化に進まない）

> Figma への書き込みには Figma MCP（`use_figma`）を使う。実行前に接続の認証が必要。

---

## 3. 目標とするパイプライン（自動化後）

```
Figma
  └─ Tokens Studio (Free Starter + Git Sync)
       └─ tokens.json → GitHub push
            └─ GitHub Actions (paths: tokens/**)
                 └─ Style Dictionary build
                      ├─ variables.css  (CSS Custom Properties)
                      └─ tokens.ts      (TypeScript 定数)
                           └─ Tailwind v4 @theme で CSS 変数を取り込み
                                └─ Storybook
                                     └─ Chromatic (Visual Regression)
```

Tokens Studio の Free Starter は1リポジトリ・1ブランチの制限がある。複数プロジェクトで
共有する段階になったら Pro プラン、または Figma Variables REST API への切り替えを検討する。

**Tokens Studio を継続採用するか、Figma API / MCP から独自生成するかは未確定**
（報告書 Q3 の未確定事項）。判断は §2 の手作業反映を終えてからで良い。

Tailwind v4 は CSS-first の設計であるため `tailwind.config.js` は生成しない。
`@theme` ディレクティブで CSS 変数を取り込む。

---

## 4. 自動同期を有効化する条件

次の4つが揃うまで、Figma → コードの自動反映は有効にしない。

1. **§2 の手作業反映が完了し、Figma とコードの差分がゼロであることを確認済み**
2. **生成物に生成ヘッダが付いている** — 実装済み（`tokens.css` / `alias-ibuki.css` / `alias-shadcn.css`）
3. **CI で `generate → git diff --exit-code` が回る** — 未実施（下記の注意点）
4. **同期方向が一方向に固定されている** — 双方向は衝突源になるため採らない（報告書 Q3）

> **条件3 の注意点**：現在 `src/styles/*.css` の3ファイルは `.gitignore` に入っており
> **追跡されていない**（ビルド時に毎回生成する方式）。このままでは
> `git diff --exit-code` による差分検出が成立しない。CI ゲートを入れるなら、
> 3ファイルを追跡対象へ変える判断が先に要る。
>
> なお A-1 時点では generator を2回実行して出力が同一（MD5 一致）であることを
> 確認済みで、冪等性そのものは担保されている。

### 権限と方向

Figma 側の更新権限をだれが持つか、同期をどちらの方向へ流すかは**未確定**（報告書 Q3）。
双方向同期は採らない。

---

## 5. 配布方式

> **訂正（2026-07-29）**：初版は「npm パッケージとしての公開は行わず、monorepo 内参照とする」
> としていたが、仕様書 `cross-product-ui-library-spec.md` §2.1 で
> **GitHub Packages による npm 配布**が決定した。パッケージ名は
> `@kedama-design/design-system`。本書の当該記述は無効。

- Tier 0（基礎プリミティブ）／data-viz トークン: npm パッケージ
- Tier 2（複合ブロック）: shadcn レジストリ形式でコピー配布

詳細は仕様書 §2.1 を参照。

---

## 6. フォントは配らない

パッケージはフォントを同梱せず、読み込みもしない。提供するのは `font-family` の
スタック定義だけで、実体の調達と読み込みは**消費側プロダクトの責任**。
詳細は README「フォントの扱い」を参照。

Storybook（`.storybook/preview.ts`）だけは3書体を Google Fonts から読み込むが、
これはトークンを目視レビューするための Storybook 専用の措置であり、
ビルド成果物には含まれない。
