import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';

/**
 * Skeleton バリアントスタイル定義
 *
 * 読み込み中のプレースホルダ。実際に入るコンテンツと同じ寸法・位置を占め、
 * 読み込み完了時にレイアウトが動かないようにする（原則1: Calm。
 * 画面の飛び跳ねは穏やかさを最も損なう）。
 *
 * 明滅は `motion-safe:` 付きの `animate-skeleton-pulse`。
 * 定義と、Tailwind 既定の `animate-pulse` を使わない理由は
 * `src/styles/tailwind.css` の Animation セクションを参照。
 */
const skeletonVariants = cva(['block', 'bg-subtle', 'motion-safe:animate-skeleton-pulse'], {
  variants: {
    shape: {
      /** テキスト1行分 */
      text: 'rounded-sm',
      /** ブロック要素（カード・画像枠） */
      block: 'rounded-md',
      /** アバター等の円形 */
      circle: 'rounded-full',
    },
  },
  defaultVariants: {
    shape: 'block',
  },
});

// ─── Types ──────────────────────────────────────────────

type SkeletonVariantProps = VariantProps<typeof skeletonVariants>;

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement>, SkeletonVariantProps {
  /**
   * 読み込み中であることのラベル。
   *
   * 既定では読み上げ対象にしない（`aria-hidden`）。スケルトンは装飾であり、
   * 読み込み状態は本来これより上位のコンテナが `aria-busy` で伝えるべきもの。
   * 1画面に何十個も並ぶため、既定で読み上げると耳が潰れる。
   * 単独で使うなど、この部品自身に状態を語らせたい場合だけ指定する。
   */
  label?: string;
}

// ─── Component ──────────────────────────────────────────

/**
 * Skeleton コンポーネント
 *
 * 読み込み中のプレースホルダ。入る予定のコンテンツと同じ寸法を
 * `className` で与えて使う。
 *
 * @example
 * ```tsx
 * <Skeleton shape="text" className="h-4 w-3/4" />
 * <Skeleton shape="circle" className="size-10" />
 * <Skeleton className="h-32 w-full" label="グラフを読み込み中" />
 * ```
 */
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, shape, label, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(skeletonVariants({ shape }), className)}
      {...(label
        ? { role: 'status', 'aria-live': 'polite', 'aria-label': label }
        : { 'aria-hidden': true })}
      {...props}
    />
  ),
);

Skeleton.displayName = 'Skeleton';

export { skeletonVariants };
