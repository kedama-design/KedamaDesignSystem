# Kedama Design System — Claude Code 消費側コンテキスト

デザインシステムを利用するプロジェクトの CLAUDE.md に追記するテンプレート。

---

以下をそのままコピーして CLAUDE.md に貼り付けてください:

---

## デザインシステム

このプロジェクトは @kedama/design-system を使用する。
UIの実装時は、以下のソースファイルを参照して最新の定義に基づいて作業すること。

### ソースファイル参照先

デザインシステムのリポジトリ:
/Users/y.higashimori/Library/CloudStorage/Dropbox/100_Claude/Projects/active/KedamaDesignSystem

参照すべきファイル:

- 開発ルール・技術スタック: CLAUDE.md
- デザイン原則: docs/design-principles.md
- デザインルール（コンポーネント設計規約、命名規則、AI協業ルール）: docs/design-rules.md
- カラートークン（7色×11段階）: src/tokens/primitive/colors.ts
- セマンティックカラー（fg/bg/border/accent/status）: src/tokens/semantic/colors.ts
- タイポグラフィ（フォント、サイズスケール）: src/tokens/primitive/typography.ts
- セマンティックタイポグラフィ（heading/body/caption/overline）: src/tokens/semantic/typography.ts
- スペーシング（0〜96px、13段階）: src/tokens/primitive/spacing.ts
- レイアウト（ブレイクポイント、コンテンツ幅、コンテナパディング）: src/tokens/primitive/breakpoints.ts
- 角丸: src/tokens/primitive/radius.ts
- シャドウ: src/tokens/primitive/shadow.ts
- モーション（duration、easing）: src/tokens/primitive/motion.ts
- z-index（base〜toast、6段階）: src/tokens/primitive/zIndex.ts
- コンポーネント実装: src/components/ 配下の各ディレクトリ（Button, Badge, TextField, Card, Modal, Icon）

### セットアップ

CSSをアプリのエントリーポイントで読み込む:

```tsx
import '@kedama/design-system/styles';
```

### インポート

```tsx
import { Button, Badge, TextField, Card, Modal } from '@kedama/design-system';
import { Search, Plus, Trash2, Check, AlertTriangle } from '@kedama/design-system';
```

### スタイリングルール

- Tailwind v4 ユーティリティクラスを使用する
- 色はセマンティックトークン経由を優先する（text-fg-default, bg-surface, border-border-default）
- プリミティブパレット（bg-primary-600, text-birch-500）はセマンティックで表現できない場合のみ使用する
- HEXの直書きは禁止
- 純白 #FFFFFF は使わない
- アイコンは Lucide React を使用する（SVGの直書き禁止）

### デザイン原則

Calm UI: 穏やかで確かなインターフェース。
優先順位: Calm > Accessible > Resilient > Consistent > Simple

- 削除は常にdangerバリアント
- エラー状態には必ず「次に何をすればいいか」を提示する
- 色だけに依存しない（アイコン・テキストを併用）
- 余白を十分にとる。「詰め込まない」がCalmの核心
