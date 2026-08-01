# Frontend Implementation Rules — Kedama Design System

コンポーネント実装時の規約。

## コンポーネント構成

新規コンポーネントは必ず以下の構成で作成する:

```
src/components/{Name}/
  {Name}.tsx          — コンポーネント本体
  {Name}.test.tsx     — テスト（Testing Library）
  index.ts            — re-export
src/stories/{Name}.stories.tsx  — Storybook ストーリー
```

作成後 `src/index.ts` に export を追加する。

## 既存コンポーネント

再利用を優先する。新規作成前に必ず確認:

| コンポーネント | 用途                                                                 |
| -------------- | -------------------------------------------------------------------- |
| `Button`       | ボタン（primary/secondary/ghost/danger バリアント、sm/md/lg サイズ） |
| `Badge`        | ステータスラベル                                                     |
| `TextField`    | テキスト入力                                                         |
| `Card`         | コンテナ                                                             |
| `Modal`        | ダイアログ                                                           |
| `Icon`         | Lucide アイコンラッパー                                              |

## スタイリング

- Tailwind v4 ユーティリティクラスを使用
- バリアント管理には `cva` (class-variance-authority) を使用
- クラス結合には `cn()` (`src/lib/cn.ts`) を使用
- IMPORTANT: プリミティブトークンの直接参照禁止。セマンティックトークン経由で参照する
- IMPORTANT: HEX 値のハードコード禁止

## Props 設計

- Props は最小限。デフォルト値で賄う
- boolean は肯定形（`disabled` not `isDisabled`）
- すべてのコンポーネントは `className` prop を受け取る

## アクセシビリティ

- セマンティック HTML + ARIA 属性を必須とする
- すべてのインタラクティブ要素はキーボード操作可能にする
- 必須状態: Default / Hover / Focus / Active / Disabled
- データ表示コンポーネントは Loading / Empty / Error の3状態を持つ

## テスト

- `@testing-library/react` + `@testing-library/jest-dom`
- jsdom 環境
- テストファイル: `src/components/{Name}/{Name}.test.tsx`

## Storybook

- ストーリーファイル: `src/stories/{Name}.stories.tsx`
- 日本語テキストサンプルを含める
- Figma のバリアント名とストーリー名を一致させる
