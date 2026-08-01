import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';

/**
 * Spinner バリアントスタイル定義
 *
 * 完了時刻を見積もれない処理の待機表示。進捗が分かる処理には
 * プログレスバーを使うこと（この部品では代替しない）。
 *
 * 回転は `motion-safe:` に限定する。`semantic/motion.ts` が
 * 「Spinner の連続回転は機能状態だが、reduced motion 時は静止アイコン＋
 * ラベルに切り替える」と定めているため、回転が止まっても意味が失われないよう
 * ラベルを常に持たせている。
 */
const spinnerVariants = cva(['motion-safe:animate-spin', 'text-current'], {
  variants: {
    size: {
      sm: 'size-3',
      md: 'size-4',
      lg: 'size-6',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// ─── Types ──────────────────────────────────────────────

type SpinnerVariantProps = VariantProps<typeof spinnerVariants>;

export interface SpinnerProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'>, SpinnerVariantProps {
  /** 待機中であることのラベル。視覚的には隠され、支援技術にのみ伝わる */
  label?: string;
  /**
   * 親要素が既に待機状態を伝えている場合に true にする。
   *
   * Button の `loading` のように、外側が `aria-busy` とラベルを持つ文脈では
   * スピナー自身が二重に読み上げると冗長になるため、装飾として扱う。
   */
  decorative?: boolean;
}

// ─── Component ──────────────────────────────────────────

/**
 * Spinner コンポーネント
 *
 * 完了時刻を見積もれない処理の待機表示。色は `currentColor` を継承するため、
 * 置いた文脈の文字色に自動で馴染む。
 *
 * @example
 * ```tsx
 * <Spinner />
 * <Spinner size="lg" label="保存しています" />
 * <Spinner decorative />        // 親が aria-busy を持つ場合
 * ```
 */
export const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ className, size, label = '読み込み中', decorative = false, ...props }, ref) => (
    <span
      ref={ref}
      className={cn('inline-flex items-center justify-center', className)}
      {...(decorative ? { 'aria-hidden': true } : { role: 'status' })}
      {...props}
    >
      <svg
        className={cn(spinnerVariants({ size }))}
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        {/* 軌道。回転が止まっていても円として読めるよう薄く残す */}
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" opacity="0.25" />
        {/* 走査する弧。円周の 1/4 を描く */}
        <path d="M15 8a7 7 0 0 0-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {!decorative && <span className="sr-only">{label}</span>}
    </span>
  ),
);

Spinner.displayName = 'Spinner';

export { spinnerVariants };
