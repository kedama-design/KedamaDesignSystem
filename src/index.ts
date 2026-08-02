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
export {
  Button,
  buttonVariants,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
  type DeprecatedButtonVariant,
  type DeprecatedButtonSize,
} from './components/Button';
export { Badge, badgeVariants, type BadgeProps, type BadgeVariant } from './components/Badge';
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
// アイコン（Lucide React ベース）
export * from './components/Icon';

// テーマ（next-themes ベース。data-theme 方式・保存キー kedama-theme）
export {
  ThemeProvider,
  useTheme,
  THEMES,
  type ThemeProviderProps,
  type ThemeSetting,
  type UseThemeResult,
} from './components/ThemeProvider';
export { ThemeToggle, type ThemeToggleProps } from './components/ThemeToggle';
export { IconSwap, type IconSwapProps } from './components/IconSwap';

// ─── Tier 0 低層部品（shadcn/ui の Base UI variant から取り込み） ───
//
// ファイル名は上流との追随性のため小文字のまま。**公開シンボルは PascalCase**。
// `ui/` への深い import は非公開（消費側はこのルートからのみ使う）。
// ワイルドカード export は使わない。公開する対象をここで列挙し、
// 何が公開 API なのかをこのファイルだけで読めるようにする。
//
// Sheet は**公開しない**。Drawer が唯一の汎用エッジパネル（仕様書 §2.2）。

export { Skeleton } from './components/ui/skeleton';
export { Spinner, type SpinnerProps } from './components/ui/spinner';

export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from './components/ui/accordion';

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './components/ui/table';

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerSwipeHandle,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from './components/ui/drawer';

export {
  Toaster,
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  createToastManager,
  toast,
  useToastManager,
} from './components/ui/toast';

// ユーティリティ
export { cn } from './lib/cn';
