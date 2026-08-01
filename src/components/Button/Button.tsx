import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';
import { Spinner } from '../Spinner';

/**
 * Button バリアントスタイル定義
 *
 * セマンティックトークンのみ使用（プリミティブ直参照禁止）。
 * Tailwind v4 の @theme で接続されたCSS変数経由。
 *
 * Calm UI: 控えめなホバー、穏やかなトランジション、
 * フォーカスリングは要素から離して柔らかく表示。
 */
const buttonVariants = cva(
  [
    // 共通ベーススタイル
    'inline-flex items-center justify-center gap-2',
    'font-medium whitespace-nowrap select-none',
    'transition-colors',
    'duration-[var(--primitive-duration-fast)]',
    'ease-[var(--primitive-easing-default)]',
    // フォーカスリング（Calm UI: 要素から離して柔らかく）
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus',
    // disabled共通
    'disabled:pointer-events-none disabled:opacity-[var(--primitive-opacity-disabled)]',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-accent-primary text-accent-primary-fg',
          'hover:bg-accent-primary-hover',
          'active:bg-accent-primary-active',
        ],
        secondary: [
          'bg-surface text-fg-default',
          'border border-border-default',
          'hover:bg-hover',
          'active:bg-subtle',
        ],
        ghost: ['bg-transparent text-fg-default', 'hover:bg-hover', 'active:bg-subtle'],
        // 破壊的アクションは accent.danger（アクションの面）を使う。
        // status.danger は「状態の表示」であり hover/active を持たない別カテゴリ。
        danger: [
          'bg-accent-danger text-accent-danger-fg',
          'hover:bg-accent-danger-hover',
          'active:bg-accent-danger-active',
        ],
      },
      size: {
        sm: 'h-8 px-3 text-sm rounded-sm',
        md: 'h-10 px-4 text-md rounded-sm',
        lg: 'h-12 px-6 text-lg rounded-sm',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

// ─── Types ──────────────────────────────────────────────

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariantProps {
  /** ローディング状態。trueの場合スピナーを表示しボタンを無効化する */
  loading?: boolean;
  /** ボタンの左側に表示するアイコン */
  iconLeft?: React.ReactNode;
  /** ボタンの右側に表示するアイコン */
  iconRight?: React.ReactNode;
}

// ─── Component ──────────────────────────────────────────

/**
 * Button コンポーネント
 *
 * Kedama Design System の基本アクションコンポーネント。
 * 4つのバリアント × 3つのサイズ。
 *
 * - primary: 主要アクション（1画面に原則1つ — Calm UI）
 * - secondary: 副次アクション
 * - ghost: テキストリンク的なアクション
 * - danger: 破壊的アクション（削除など）
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md">保存する</Button>
 * <Button variant="secondary" iconLeft={<PlusIcon />}>追加</Button>
 * <Button variant="danger" loading>削除中…</Button>
 * ```
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      disabled,
      iconLeft,
      iconRight,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={isDisabled}
        aria-disabled={isDisabled || undefined}
        aria-busy={loading || undefined}
        {...props}
      >
        {/* 待機状態は button 自身の aria-busy が伝えるため、装飾として置く */}
        {loading ? <Spinner decorative /> : iconLeft}
        {children}
        {!loading && iconRight}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { buttonVariants };
