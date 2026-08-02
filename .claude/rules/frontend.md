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

## 取り込み品（`src/components/ui/`）の例外

shadcn/ui（Base UI variant）から取り込んだ部品は、**ファイル名を小文字のまま**にする
（`ui/drawer.tsx` 等）。上流と同じ綴りにしておくと `shadcn diff` での棚卸しが効くため。
PascalCase のファイル名規約はここだけ適用しない。

ただし:

- **公開シンボルは PascalCase**（`Drawer`、`TableRow` など）
- **`ui/` への深い import は非公開**。消費側は `src/index.ts`（パッケージのルート）
  からのみ使う。公開対象はそこに**列挙**する（ワイルドカード export は使わない）
- 公開 API の面は `tests/publicApi.test.tsx` が固定する

## 既存コンポーネント

再利用を優先する。新規作成前に必ず確認:

| コンポーネント               | 用途                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `Button`                     | ボタン（primary/secondary/outline/ghost/danger、xs/sm/default/lg + icon 系） |
| `Badge`                      | ステータス・分類ラベル（`variant` 軸）                                       |
| `TextField`                  | テキスト入力                                                                 |
| `Card`                       | コンテナ                                                                     |
| `Modal`                      | ダイアログ（ネイティブ `<dialog>`）                                          |
| `Icon`                       | Lucide アイコンラッパー                                                      |
| `Skeleton` / `Spinner`       | 読み込み中（Skeleton は既定で静止）                                          |
| `Accordion` 一式             | 開閉（Base UI）                                                              |
| `Table` 一式                 | 表プリミティブ（TanStack 非依存。DataTable は Tier 2）                       |
| `Drawer` 一式                | **唯一の汎用エッジパネル**（Base UI）。Sheet は持たない                      |
| `Toast` 一式（`Toaster` 等） | 通知（Base UI）。Modal を開いている間は背後になる                            |

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
