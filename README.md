# Kedama Design System

社内業務システム・B2B SaaS 向けの React + TypeScript デザインシステム。

**Calm UI** — 穏やかで、確かなインターフェース。

## 設計哲学

優先順位: **Calm** > Accessible > Resilient > Consistent > Simple

業務で毎日長時間使うUIのために、派手さよりも疲れにくさ・分かりやすさを追求します。

## クイックスタート

### インストール

```bash
pnpm add @kedama-design/design-system
```

peer dependencies:

```bash
pnpm add react react-dom
```

### 基本的な使い方

```tsx
// CSS を読み込む（Tailwind + デザイントークン）
import '@kedama-design/design-system/styles';

// コンポーネントとトークンをインポート
import { Button, Badge, TextField, Card, Modal, Search } from '@kedama-design/design-system';

function App() {
  return (
    <Card>
      <Card.Header>
        <h2>お問い合わせ</h2>
      </Card.Header>
      <Card.Body>
        <TextField label="お名前" placeholder="山田 太郎" />
        <TextField label="検索" leadingIcon={<Search size={16} />} placeholder="キーワード…" />
      </Card.Body>
      <Card.Footer>
        <Button variant="ghost">キャンセル</Button>
        <Button variant="primary">送信する</Button>
      </Card.Footer>
    </Card>
  );
}
```

### ⚠️ CSS を読み込むと変わるグローバルな既定

`@kedama-design/design-system/styles` は、コンポーネントの外にも効く既定を 2 つ持ちます。
どちらも既存の画面に影響しうるので、導入時に確認してください。

#### 1. 全要素の既定ボーダー色

```css
/* 読み込むと、この規則が @layer base に入ります */
*,
*::before,
*::after {
  border-color: var(--color-border-default);
}
```

CSS の初期値は `border-color: currentColor`（＝文字色）で、デザインシステムとして
意図する既定ではありません。この規則が効くのは **`border-width` が設定されている
要素だけ**なので、影響を受けるのは「枠線の幅は指定したが色は指定していない」箇所に
限られます。そこはこれまで文字色の枠線が出ていた箇所です。

`@layer base` に置いてあるため、`border-border-strong` のような明示指定や、
消費側のレイヤなしスタイルは必ずこの既定に勝ちます。個別に戻したい場合は
その要素に色を明示してください。

#### 2. `prefers-reduced-motion` での transition / animation 停止

OS の「視差効果を減らす」が有効な環境では、全要素の `transition-duration` と
`animation-duration` を 0 に、`animation-iteration-count` を 1 にします。
個別コンポーネントに実装させず 1 箇所で担保する方針です。

動き自体が情報を担う部品（ローディング表示など）は、動きを止めるだけでなく
静的な代替表現へ切り替えてください。本パッケージの `Spinner` はそうしています。

### トークンのみ使う

コンポーネントを使わずトークン値だけ参照したい場合:

```tsx
import { semanticColors, spacing, fontSize } from '@kedama-design/design-system/tokens';

// TypeScript 定数として利用
const primaryColor = semanticColors.accent.primary; // '#315039'
const gap = spacing[16]; // '16px'
```

## フォントの扱い

**このパッケージはフォントを同梱しません。読み込みも行いません。**
フォントの調達と読み込みは**消費側プロダクトの責任**です。

パッケージが提供するのは `font-family` の**スタック定義**だけです
（`--primitive-font-family-heading` など）。実体が読み込まれていなければ、
スタックは system フォントへフォールバックします。

理由:

- フォントを同梱するとパッケージサイズが数MB単位で膨らむ
- ライセンス条件・配信方法（セルフホスト / CDN）はプロダクトごとに事情が異なる
- 消費側が既に同じ書体を読み込んでいる場合、二重取得になる

### 必要な3書体

| スタック                                    | 書体               | 用途                       |
| ------------------------------------------- | ------------------ | -------------------------- |
| `--primitive-font-family-heading`           | **DM Sans**        | 見出し・UI英語テキスト     |
| `--primitive-font-family-body` / `-numeric` | **Noto Sans JP**   | 日本語全般・桁を揃える数値 |
| `--primitive-font-family-mono`              | **Noto Sans Mono** | ログ・コード・ID           |

### 読み込み例（Google Fonts）

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Noto+Sans+JP:wght@400;500;700&family=Noto+Sans+Mono:wght@400&display=swap"
/>
```

> **数値の桁揃えに関する注意**：`DM Sans` は OpenType の `tnum` フィーチャを持たず、
> 数字がプロポーショナル幅です。`font-variant-numeric: tabular-nums` を当てても揃いません。
> **桁を揃えたい数値を heading フォントで組まないでください。**
> `numeric-sm` / `numeric-md` / `numeric-xl`（`fontFamily.numeric` ＝ Noto Sans JP ベース）を
> 使ってください。Storybook の `Foundations/Numeric Alignment` で実際の差を確認できます。

Storybook（`pnpm dev`）は上記3書体を preview で読み込んでいますが、これは
**トークンを目視レビューするための Storybook 専用の措置**であり、
パッケージの成果物には含まれません。

## コンポーネント

| コンポーネント | 説明                                                |
| -------------- | --------------------------------------------------- |
| **Button**     | primary / secondary / ghost / danger × sm / md / lg |
| **Badge**      | 5ステータス × subtle / solid                        |
| **TextField**  | ラベル・ヘルプテキスト・エラー・アイコン対応        |
| **Card**       | Header / Body / Footer のコンパウンドコンポーネント |
| **Modal**      | `<dialog>` ベース、フォーカストラップ、Escape閉じ   |
| **Icon**       | Lucide React ベース、39種の業務アイコン             |

## デザイントークン

### カラーシステム

- OKLCH 色空間ベース、7色パレット × 11段階（25–900）
- 純白 `#FFFFFF` 不使用 — 最明色は birch/25 `#F8F7F4`
- プリミティブ → セマンティックの2層構造

### タイポグラフィ

- 調和数列スケール（Shiftbrain harmonic series、基数8、ベース16px）
- DM Sans（見出し・UI英語）/ Noto Sans JP（日本語）/ Noto Sans Mono（コード）

### Tailwind v4 統合

CSS-first config で全トークンが Tailwind ユーティリティとして利用可能:

```html
<div class="bg-surface text-fg-default p-4 rounded-md shadow-sm">
  <h2 class="font-heading text-2xl font-bold">見出し</h2>
  <p class="font-body text-md text-fg-muted">本文テキスト</p>
</div>
```

## 開発

### 必要環境

- Node.js 20+
- pnpm

### コマンド

```bash
pnpm install          # 依存パッケージのインストール
pnpm dev              # Storybook 開発サーバー (localhost:6006)
pnpm build            # ライブラリビルド (dist/)
pnpm test             # テスト実行
pnpm test:watch       # テスト（ウォッチモード）
pnpm typecheck        # TypeScript 型チェック
pnpm lint             # ESLint
pnpm format           # Prettier フォーマット
pnpm generate:tokens  # CSS 変数の再生成
```

### プロジェクト構造

```
src/
  tokens/           ← デザイントークン（TypeScript 定数）
    primitive/      ← 値そのもの（色HEX値、px値など）
    semantic/       ← 用途を意味する（fg.default, heading-2xl など）
  components/       ← UI コンポーネント
    Button/
    Badge/
    TextField/
    Card/
    Modal/
    Icon/
  styles/
    tailwind.css    ← Tailwind v4 @theme 設定
    tokens.css      ← 自動生成 CSS Custom Properties
  stories/          ← Storybook ストーリー
  lib/              ← 共通ユーティリティ
scripts/
  generate-css-tokens.ts  ← トークン → CSS 変数変換
tests/
  tokens.test.ts    ← トークン値・構造テスト
  contrast.test.ts  ← WCAG AA コントラスト比テスト
```

## Figma

Figma ファイル: `lwAJuBLldLYwHdsy1MXeEe`

- 88 + 35 Variables（Primitives / Semantics）
- 10 Text Styles

## ライセンス

UNLICENSED — 社内利用限定
