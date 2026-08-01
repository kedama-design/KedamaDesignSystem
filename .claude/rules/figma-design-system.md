# Figma MCP Integration Rules — Kedama Design System

Figma デザインからコードを実装する際に必ず従うルール。

## Figma ファイル情報

- ファイルキー: `lwAJuBLldLYwHdsy1MXeEe`
- Primitives コレクション: 88 Variables
- Semantics コレクション: 35 Variables
- Text Styles: 10

## 必須フロー（スキップ禁止）

1. `get_design_context` で対象ノードの構造化データを取得
2. レスポンスが大きい・切り詰められた場合は `get_metadata` でノードマップを取得し、必要なノードだけ再取得
3. `get_screenshot` でビジュアルリファレンスを取得
4. 画面単位ではなく **コンポーネント単位** に分解して取得する（コンテキスト肥大化防止）
5. 取得した React+Tailwind 出力はリファレンスであり最終コードではない。本プロジェクトの規約に変換して実装する
6. 実装後は Figma スクリーンショットと比較して 1:1 の見た目を検証する

## Figma 変数 → CSS 変数マッピング

Figma のデザインで使われている変数名とコード側の CSS 変数の対応。
`get_variable_defs` で取得した Figma 変数は、以下のルールでコードに変換する。

### カラー

| Figma 変数パス             | CSS 変数                        | Tailwind クラス例       |
| -------------------------- | ------------------------------- | ----------------------- |
| `Primitives/primary/600`   | `--primitive-color-primary-600` | `bg-primary-600`        |
| `Primitives/birch/25`      | `--primitive-color-birch-25`    | `bg-birch-25`           |
| `Semantics/fg/default`     | `--color-fg-default`            | `text-fg-default`       |
| `Semantics/bg/surface`     | `--color-bg-surface`            | `bg-surface`            |
| `Semantics/bg/page`        | `--color-bg-page`               | `bg-page`               |
| `Semantics/border/default` | `--color-border-default`        | `border-border-default` |
| `Semantics/accent/primary` | `--color-accent-primary`        | `bg-accent-primary`     |
| `Semantics/status/danger`  | `--color-status-danger`         | `text-status-danger`    |

**変換ルール:**

- `Primitives/{palette}/{shade}` → CSS: `--primitive-color-{palette}-{shade}` → Tailwind: `{palette}-{shade}`
- `Semantics/{category}/{name}` → CSS: `--color-{category}-{name}` → Tailwind: セマンティック名参照（下記一覧）

### Tailwind セマンティックカラー一覧

**前景:** `text-fg-default`, `text-fg-muted`, `text-fg-placeholder`, `text-fg-disabled`, `text-fg-inverse`, `text-fg-link`, `text-fg-link-hover`

**背景:** `bg-page`, `bg-surface`, `bg-surface-raised`, `bg-subtle`, `bg-hover`, `bg-selected`, `bg-scrim`, `bg-inverse`, `bg-bg-disabled`

**ボーダー:** `border-border-default`, `border-border-strong`, `border-border-muted`, `border-border-active`, `border-border-focus`, `border-border-error`, `border-border-disabled`

**アクセント:** `bg-accent-primary`, `bg-accent-primary-hover`, `bg-accent-primary-active`, `bg-accent-primary-subtle`, `text-accent-primary-fg`

### タイポグラフィ

| Figma テキストスタイル | Tailwind クラス                                                          |
| ---------------------- | ------------------------------------------------------------------------ |
| `heading-2xl`          | `font-heading text-5xl font-bold leading-tight tracking-tight`           |
| `heading-xl`           | `font-heading text-4xl font-bold leading-tight tracking-tight`           |
| `heading-lg`           | `font-heading text-3xl font-medium leading-tight tracking-tight`         |
| `heading-md`           | `font-heading text-2xl font-medium leading-tight`                        |
| `heading-sm`           | `font-heading text-xl font-medium leading-tight`                         |
| `body-lg`              | `font-body text-lg`                                                      |
| `body-md`              | `font-body text-md`                                                      |
| `body-sm`              | `font-body text-sm`                                                      |
| `caption`              | `font-body text-xs leading-relaxed`                                      |
| `overline`             | `font-body text-2xs font-medium leading-relaxed tracking-wide uppercase` |

### スペーシング

| Figma 値 | Tailwind クラス    |
| -------- | ------------------ |
| `0`      | `p-0`, `gap-0`     |
| `2`      | `p-0.5`, `gap-0.5` |
| `4`      | `p-1`, `gap-1`     |
| `8`      | `p-2`, `gap-2`     |
| `12`     | `p-3`, `gap-3`     |
| `16`     | `p-4`, `gap-4`     |
| `24`     | `p-6`, `gap-6`     |
| `32`     | `p-8`, `gap-8`     |
| `40`     | `p-10`, `gap-10`   |
| `48`     | `p-12`, `gap-12`   |

### 角丸・シャドウ

| Figma              | Tailwind       |
| ------------------ | -------------- |
| `radius/none`      | `rounded-none` |
| `radius/sm` (4px)  | `rounded-sm`   |
| `radius/md` (8px)  | `rounded-md`   |
| `radius/lg` (16px) | `rounded-lg`   |
| `radius/full`      | `rounded-full` |
| `shadow/sm`        | `shadow-sm`    |
| `shadow/md`        | `shadow-md`    |
| `shadow/lg`        | `shadow-lg`    |

## 実装ルール

- IMPORTANT: Figma MCP 出力の HEX 値やハードコード値をそのまま使わない。必ず上記マッピングに従ってセマンティックトークン経由の Tailwind クラスに変換する
- IMPORTANT: 純白 `#FFFFFF` は不使用。最明色は `birch-25` (`#F8F7F4`)
- IMPORTANT: 新しいアイコンパッケージを追加しない。Lucide React を使用する
- Figma MCP がアセットの localhost ソースを返した場合はそのまま使用する
- 既存コンポーネント (`src/components/`) を確認し、再利用できるものは再利用する
- コンポーネントにないものだけ新規作成する

## Storybook 検証

実装後に Storybook (`pnpm dev` → localhost:6006) で検証する:

- サイズ、色、フォント、角丸、gap、テキスト内容を Figma と比較
- iframe URL: `http://localhost:6006/iframe.html?id={storyId}` で個別確認可能
