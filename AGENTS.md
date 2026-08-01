# AGENTS.md — Kedama Design System

Codex がこのリポジトリで作業する際のコンテキスト。

## プロジェクト概要

社内業務システム・B2B SaaS 向けの React + TypeScript デザインシステム。
**Calm UI** — 穏やかで、確かなインターフェース。

## 重要なルール

### トークン

- `src/tokens/` 内のファイルは **読み取り専用**。Phase 2 で確定した成果物
- コンポーネントは必ず **セマンティックトークン経由** で色・サイズを参照する。プリミティブの直接参照は禁止
- CSS 変数は `pnpm generate:tokens` で自動生成される（`src/styles/tokens.css`）。手動編集禁止
- カラーシステムは OKLCH ベース。純白 `#FFFFFF` は不使用（最明色は birch/25 `#F8F7F4`）

### 命名規則

- コンポーネント: PascalCase (`Button`, `TextField`)
- トークン: camelCase (`semanticColors`, `fontFamily`)
- CSS 変数: kebab-case (`--color-fg-default`, `--primitive-color-primary-600`)
- ファイル: PascalCase (コンポーネント), camelCase (トークン・ユーティリティ)

### 詳細ルール（`.Codex/rules/` に分割）

- `.Codex/rules/frontend.md` — コンポーネント実装規約、テスト、Storybook
- `.Codex/rules/figma-design-system.md` — Figma MCP フロー、トークンマッピング

## 設計哲学

原則の優先順位: **Calm > Accessible > Resilient > Consistent > Simple**

詳細は `docs/design-principles.md` と `docs/design-rules.md` を参照。

## 技術スタック

- React 19, TypeScript 6, Vite 6 (library mode)
- Tailwind CSS v4 (CSS-first config, `@theme` ディレクティブ)
- Storybook 8 (Vite builder)
- Vitest + Testing Library
- Lucide React (アイコン)
- class-variance-authority (バリアント管理)
- pnpm

## コマンド

```bash
pnpm dev              # Storybook (localhost:6006)
pnpm build            # ライブラリビルド
pnpm test             # テスト
pnpm typecheck        # 型チェック
pnpm lint             # ESLint
pnpm generate:tokens  # CSS 変数再生成
```

## Figma

ファイルキー: `lwAJuBLldLYwHdsy1MXeEe`

- Primitives コレクション: 88 Variables
- Semantics コレクション: 35 Variables
- 10 Text Styles

## ディレクトリ構造

```
src/
  tokens/           ← 読み取り専用。Phase 2 成果物
    primitive/      ← 値そのもの（HEX, px, rem）
    semantic/       ← 用途（fg.default, heading-2xl）
  components/       ← Button, Badge, TextField, Card, Modal, Icon
  styles/
    tailwind.css    ← @theme でトークンを Tailwind に接続
    tokens.css      ← 自動生成（編集禁止）
  stories/          ← Storybook ストーリー
  lib/cn.ts         ← clsx ラッパー
scripts/
  generate-css-tokens.ts  ← TS定数 → CSS Custom Properties
tests/
  tokens.test.ts    ← トークン値テスト
  contrast.test.ts  ← WCAG AA コントラスト比テスト
  setup.ts          ← jest-dom セットアップ
```

## Imported Claude Cowork project instructions

Kedamaで開発するWebシステム・アプリで利用するデザインシステムを構築する。
