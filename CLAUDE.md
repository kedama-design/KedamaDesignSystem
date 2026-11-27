# CLAUDE.md — Kedama Design System

Claude Code がこのリポジトリで作業する際のコンテキスト。

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

### 詳細ルール（`.claude/rules/` に分割）

- `.claude/rules/frontend.md` — コンポーネント実装規約、テスト、Storybook
- `.claude/rules/figma-design-system.md` — Figma MCP フロー、トークンマッピング

### core（`@kedama-design/core`。`core/`）

React 版（`src/`）とは別の、独立したパッケージ。共有の値（`--ui-*`）と、仕組みに依存しない部品
（素の CSS と ESM の JavaScript）。2026-11-13 の段1で作った（設計記録は `core/docs/stage1-log.md`）。
**残りの作業（段3・段4など）と進め方は `ROADMAP.md`**。

- **依存を持ち込まない**（実行時・開発時とも。React・Tailwind・Base UI・jsdom なども入れない。テストは `node --test` だけ）
- **色の値を書いてよいのは `core/ui/tokens.css` だけ**。ほかの CSS・JS は `var(--ui-*)` の名前だけ
- **正は `core/guidelines/`（値は `core/guidelines/tokens/tokens.json`）**。値を変えるときは tokens.json を先に直し、`core/ui/tokens.css` を合わせる（一致はテストが確かめる）
- **純白は core でも使わない**（最明は `#fffefc`）
- **class の接頭辞 `tsk-` は変えない**
- **Sparkle Design は土台にしない**（参考にとどめる）
- **部品を直すときは core を先に直し、登記議事録つくるさんへ写す**（`core/ui/` のファイル名は登記の `src/ui/` と同じ）
- `core/ui/`・`core/guidelines/` は prettier をかけない（`.prettierignore`）。部品の振る舞い・セレクタ・書式を変えるときは、登記の文字列ベースのテストに響くことを意識する
- core のテストは `cd core && npm test`（CI の「Core tests」）。ルートの vitest は `core/**` を外している
- 公開（npm publish）は人が判断する。エージェントは公開しない

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
  blocks/           ← Tier 2（レジストリ配布・npm では配らない）
    app-shell/      ← AppShell / AuthShell / AppTitleBar / SidebarNav / IconRail /
                      AppHeader / StatusBar / RightPane。registry.json の1アイテム。
                      src/index.ts から export しない
    data-table/     ← TanStack Table v8。registry.json の別アイテム。
                      src/index.ts から export しない
    command-palette/ ← cmdk。registry.json の別アイテム。
                       src/index.ts から export しない
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
core/               ← @kedama-design/core（独立したパッケージ。上の「core」の決まり）
  ui/               ← tokens.css（色の値はここだけ）・base.css・components.css・motion/toast/drawer/dateinput/icons.js
  guidelines/       ← 共通UIガイドラインの正（tokens.json が値の正）。SOURCE.json に写した元の sha256
  test/             ← node:test（依存なし）
  examples/         ← 全部品・全状態の見本と解決値の実測（配らない）
  docs/             ← 段1の設計記録・報告（配らない）
```
