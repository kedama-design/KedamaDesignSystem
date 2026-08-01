# コントリビューションガイド

Kedama Design System にコンポーネントを追加・修正する際の手順です。

## 前提

- Node.js 20+
- pnpm
- `pnpm install` 済み

## コンポーネント追加手順

### 1. ディレクトリ作成

```bash
mkdir -p src/components/{ComponentName}
```

### 2. コンポーネント実装

`src/components/{ComponentName}/{ComponentName}.tsx`

```tsx
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';

const componentVariants = cva(
  // ベーススタイル（セマンティックトークンのみ使用）
  ['...'],
  {
    variants: {
      /* ... */
    },
    defaultVariants: {
      /* ... */
    },
  },
);

export interface ComponentNameProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof componentVariants> {
  // Props 定義
}

export function ComponentName({ className, ...props }: ComponentNameProps) {
  return <div className={cn(componentVariants({}), className)} {...props} />;
}

ComponentName.displayName = 'ComponentName';
```

**チェックリスト:**

- [ ] セマンティックトークンのみ使用（プリミティブ直参照禁止）
- [ ] `className` props を `cn()` でマージ
- [ ] `displayName` を設定
- [ ] TypeScript の型を export
- [ ] アクセシビリティ: 適切な HTML 要素、ARIA 属性、キーボード操作

### 3. barrel export

`src/components/{ComponentName}/index.ts`

```tsx
export { ComponentName, type ComponentNameProps } from './ComponentName';
```

### 4. テスト

`src/components/{ComponentName}/{ComponentName}.test.tsx`

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('renders', () => {
    render(<ComponentName>テスト</ComponentName>);
    expect(screen.getByText('テスト')).toBeInTheDocument();
  });
  // バリアント、状態、アクセシビリティのテストを追加
});
```

### 5. Storybook ストーリー

`src/stories/{ComponentName}.stories.tsx`

- 各バリアント・状態のストーリーを作成
- **日本語テキストサンプルを必ず含める**（日本語での表示確認のため）
- 実際の使用例ストーリーを1つ以上含める

### 6. エントリーポイントに追加

`src/index.ts` に export を追加:

```tsx
export { ComponentName, type ComponentNameProps } from './components/ComponentName';
```

### 7. 確認

```bash
pnpm test         # テスト通過
pnpm typecheck    # 型エラーなし
pnpm build        # ビルド成功
pnpm dev          # Storybook で表示確認
```

## コーディング規約

### スタイリング

- Tailwind v4 ユーティリティクラスを使用
- バリアント管理は `cva` (class-variance-authority)
- クラス結合は `cn()` (`src/lib/cn.ts`)
- 色・サイズは必ずセマンティックトークン経由

### 命名

| 対象                       | 規約                 | 例                              |
| -------------------------- | -------------------- | ------------------------------- |
| コンポーネント             | PascalCase           | `Button`, `TextField`           |
| Props 型                   | PascalCase + Props   | `ButtonProps`, `TextFieldProps` |
| バリアント定義             | camelCase + Variants | `buttonVariants`                |
| ファイル（コンポーネント） | PascalCase           | `Button.tsx`                    |
| ファイル（ユーティリティ） | camelCase            | `cn.ts`                         |

### アクセシビリティ

- インタラクティブ要素: Default / Hover / Focus / Active / Disabled の5状態
- フォーム要素: `label` と `input` を `id`/`htmlFor` で紐付け
- エラー: `aria-invalid` + `aria-describedby`
- 装飾アイコン: `aria-hidden="true"`
- 情報アイコン: `role="img"` + `aria-label`
- 色だけに依存しない（アイコン・テキストを併用）

### コミットメッセージ

```
Add {ComponentName} component

{簡潔な説明（日本語 or 英語）}
```

## トークンの変更

`src/tokens/` 内のファイルを変更した場合:

1. `pnpm generate:tokens` で CSS 変数を再生成
2. `pnpm test` でコントラスト比テストが通ることを確認
3. Figma Variables との同期が必要な場合は別途対応
