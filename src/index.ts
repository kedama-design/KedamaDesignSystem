/**
 * Kedama Design System — メインエントリーポイント
 *
 * トークン + CSS + コンポーネント（Phase 4以降）をすべてエクスポート。
 *
 * 使い方:
 *   import { Button, Badge, semanticColors } from '@kedama/design-system';
 *   import '@kedama/design-system/styles';
 */

// CSS（Tailwind + トークンCSS変数）
import './styles/tailwind.css';

// トークン re-export
export * from './tokens';

// コンポーネント
export { Button, buttonVariants, type ButtonProps } from './components/Button';
export { Badge, badgeVariants, type BadgeProps } from './components/Badge';
export { TextField, type TextFieldProps } from './components/TextField';
export {
  Card,
  // named exports が正規 API（報告書 Q1）。compound の Card.Header 等は互換のため残す
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  type CardProps,
  type CardHeaderProps,
  type CardTitleProps,
  type CardContentProps,
  type CardFooterProps,
  type CardBodyProps,
} from './components/Card';
export {
  Modal,
  type ModalProps,
  type ModalBodyProps,
  type ModalFooterProps,
} from './components/Modal';
export { Skeleton, skeletonVariants, type SkeletonProps } from './components/Skeleton';
export { Spinner, spinnerVariants, type SpinnerProps } from './components/Spinner';
// アイコン（Lucide React ベース）
export * from './components/Icon';

// ユーティリティ
export { cn } from './lib/cn';
