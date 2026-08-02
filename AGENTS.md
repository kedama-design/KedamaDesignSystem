# AGENTS.md — Kedama Design System

Codex がこのリポジトリで作業する際のコンテキスト。

## プロジェクト概要

社内業務システム・B2B SaaS 向けの React + TypeScript デザインシステム。
**Calm UI** — 穏やかで、確かなインターフェース。

## 重要なルール

### トークン

- `src/tokens/primitive/` の**既存の値**は読み取り専用（Phase 2 で確定した成果物）。
  ただしトークン層は凍結ではない。Phase A-1 で `motion`、2026-08-02 に
  `semantic/elevation.ts` を追加している。**新しい用途の追加は可**。既存の値の
  書き換えだけが禁止
- **プリミティブは在庫、セマンティックは約束**（`docs/design-rules.md` 1.1.1）。
  未参照のプリミティブを「未使用だから」と削除しないこと（`shadow.md`、
  `spring` プリセット、`backdropBlur` が該当）
- コンポーネントは必ず **セマンティックトークン経由** で色・サイズを参照する。プリミティブの直接参照は禁止
  （影も同様。`shadow-sm` / `shadow-lg` ではなく `shadow-raised` / `shadow-overlay` を使う）
- CSS 変数は `pnpm generate:tokens` で自動生成される（`src/styles/tokens.css`）。手動編集禁止。
  このファイルは `.gitignore` 済みなので、トークンを変更したら再生成する
- カラーシステムは OKLCH ベース。純白 `#FFFFFF` は不使用（最明色は birch/25 `#F8F7F4`）。
  **純黒も不使用**（最暗は `fg.default` = `#040302`）

### 検証

- **CSS 変数・ユーティリティの生成／解決を grep で判定しない。** 描画して
  `getComputedStyle` で読む（Storybook の `Foundations/Computed Style Audit`）。
  実際に逆向きの誤判定が2回出ている。詳細は `docs/design-rules.md` 3.5
- 「〜のはず」で次の作業に進まない

### 命名規則

- コンポーネント: PascalCase (`Button`, `TextField`)
- トークン: camelCase (`semanticColors`, `fontFamily`)
- CSS 変数: kebab-case (`--color-fg-default`, `--primitive-color-primary-600`)
- ファイル: PascalCase (コンポーネント), camelCase (トークン・ユーティリティ)

### 詳細ルール（`.claude/rules/` に分割）

エージェント名に関係なくこのディレクトリを読むこと（以前ここには `.Codex/rules/` と
書かれていたが、そのディレクトリは存在しない）。

- `.claude/rules/frontend.md` — コンポーネント実装規約、テスト、Storybook
- `.claude/rules/figma-design-system.md` — Figma MCP フロー、トークンマッピング

## 運用ルール（環境に起因するもの）

### git

**エージェントはコミット・push を行わない。ユーザーが自分の端末から行う。**
ブリッジ経由の git は identity が未設定で `.git` の権限も足りず、`index.lock` の
残骸を作る。変更はワーキングツリーに残したまま報告すること。

### node_modules

Dropbox の同期から除外してある（拡張属性）。ディレクトリを削除すると属性も消えるので、
`rm -rf node_modules` したら次を再実行する。

```bash
xattr -w com.dropbox.ignored 1 node_modules
```

`pnpm test` / `pnpm lint` が `ERR_MODULE_NOT_FOUND` で突然落ちたら、まず node_modules
配下の未実体化ファイルを疑うこと。**コード起因ではない。**
（`vitest.config.ts` の `maxWorkers` もこの制約への対処。理由はファイル内のコメント参照）

### 仕様書の編集

`docs/cross-product-ui-library-spec.md` は**複数の担当が編集している**。本文を変更した
場合（条項の撤回・取り消し線を含む）は、**必ず報告に含めること**。

実際に食い違いが1件発生している。2026-07-30 に §0.6 の「Ibuki が構成・レイアウトの正」
という条項が撤回されたが、その事実が共有されないまま、撤回済みの条項を根拠にした実装
（Card padding 16px）が入った。2026-08-02 に 24px へ差し戻している。

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
  tokens/           ← 既存の値は変更しない（用途の追加は可）
    primitive/      ← 値そのもの（HEX, px, rem）＝在庫
    semantic/       ← 用途（fg.default, heading-2xl, elevation.raised）＝約束
  components/       ← Kedama 製: Button, Badge, TextField, Card, Modal, Icon
    ui/             ← shadcn(Base UI variant) からの取り込み品（§2.1.5）
                      accordion, drawer, sheet, skeleton, spinner, table, toast
  styles/
    tailwind.css    ← @theme でトークンを Tailwind に接続。@layer base の既定値もここ
    tokens.css      ← 自動生成（編集禁止・gitignore 済み）
  stories/          ← Storybook ストーリー
    ComputedStyleAudit.stories.tsx ← 解決値を実測する検証ページ
  lib/cn.ts         ← clsx ラッパー（tailwind-merge は入れない判断。下記参照）
scripts/
  generate-css-tokens.ts  ← TS定数 → CSS Custom Properties
tests/
  tokens.test.ts            ← トークン値テスト
  contrast.test.ts          ← WCAG AA コントラスト比テスト
  darkVariant.test.ts       ← ダーク系テーマの検証
  elevation.test.ts         ← 段の割当と primitive 直参照の禁止
  componentCollision.test.ts ← 同じ役割の部品が2つ存在しないこと
  classConflict.test.ts     ← 同じ CSS プロパティを触るクラスの重なりを禁止
  setup.ts                  ← jest-dom セットアップ
```

**`cn()` は clsx のみで tailwind-merge を含まない**（`docs/proposal-tailwind-merge.md` で
見送りを判断）。したがって同じ CSS プロパティを触るクラスを重ねると、勝敗は class 属性の
順序ではなく**生成 CSS の順序**で決まる。競合を作らないこと。
`tests/classConflict.test.ts` が検出する。これが落ちたときが tailwind-merge を
再検討するタイミング。

## Imported Claude Cowork project instructions

Kedamaで開発するWebシステム・アプリで利用するデザインシステムを構築する。
