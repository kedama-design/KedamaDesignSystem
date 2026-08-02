import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';

/**
 * Badge バリアントスタイル定義
 *
 * Calm UI: 色だけに依存しない情報伝達（原則2: Accessible）。
 * テキストとの併用が必須。アイコンを添えることを推奨。
 *
 * subtle: 背景+テキスト（アラート帯、インラインステータス）
 * solid: ベタ塗り（通知数、強い視認性が必要な場面）
 */
const badgeVariants = cva(
  [
    'inline-flex items-center gap-1',
    'font-medium whitespace-nowrap',
    'rounded-full',
    'text-xs',
    'px-2 py-0.5',
  ],
  {
    variants: {
      variant: {
        default: '',
        /**
         * ブランド／選択を示す。**success とは別物**。
         *
         * Ibuki の `variant="brand"` の移行先。`variant="success"` へ機械的に
         * 潰すと「選択されている」と「成功した」が同じ色になる（報告書 Q1）。
         * Kedama は primary も success も緑系（色相差 13.9°）なので、判別は
         * 参照する段の明度差で確保している（ΔE 0.226 / 色覚D型 0.216）。
         */
        accent: '',
        success: '',
        warning: '',
        danger: '',
        info: '',
      },
      appearance: {
        subtle: '',
        solid: '',
      },
    },
    compoundVariants: [
      // ── default ──
      { variant: 'default', appearance: 'subtle', className: 'bg-subtle text-fg-muted' },
      {
        variant: 'default',
        appearance: 'solid',
        className: 'bg-[var(--color-fg-muted)] text-fg-inverse',
      },

      // ── accent（ブランド／選択。success とは別物） ──
      {
        variant: 'accent',
        appearance: 'subtle',
        className: 'bg-accent-primary-subtle text-accent-primary border border-border-active',
      },
      {
        variant: 'accent',
        appearance: 'solid',
        className: 'bg-accent-primary text-accent-primary-fg',
      },

      // ── success ──
      {
        variant: 'success',
        appearance: 'subtle',
        className:
          'bg-[var(--color-status-success-bg)] text-[var(--color-status-success)] border border-[var(--color-status-success-border)]',
      },
      {
        variant: 'success',
        appearance: 'solid',
        className: 'bg-[var(--color-status-success-solid)] text-[var(--color-status-success-fg)]',
      },

      // ── warning ──
      {
        variant: 'warning',
        appearance: 'subtle',
        className:
          'bg-[var(--color-status-warning-bg)] text-[var(--color-status-warning)] border border-[var(--color-status-warning-border)]',
      },
      {
        variant: 'warning',
        appearance: 'solid',
        className: 'bg-[var(--color-status-warning-solid)] text-[var(--color-status-warning-fg)]',
      },

      // ── danger ──
      {
        variant: 'danger',
        appearance: 'subtle',
        className:
          'bg-[var(--color-status-danger-bg)] text-[var(--color-status-danger)] border border-[var(--color-status-danger-border)]',
      },
      {
        variant: 'danger',
        appearance: 'solid',
        className: 'bg-[var(--color-status-danger-solid)] text-[var(--color-status-danger-fg)]',
      },

      // ── info ──
      {
        variant: 'info',
        appearance: 'subtle',
        className:
          'bg-[var(--color-status-info-bg)] text-[var(--color-status-info)] border border-[var(--color-status-info-border)]',
      },
      {
        variant: 'info',
        appearance: 'solid',
        className: 'bg-[var(--color-status-info-solid)] text-[var(--color-status-info-fg)]',
      },
    ],
    defaultVariants: {
      variant: 'default',
      appearance: 'subtle',
    },
  },
);

// ─── Types ──────────────────────────────────────────────

type BadgeVariantProps = VariantProps<typeof badgeVariants>;

/** 見た目の分類。状態とは限らない（`accent` はブランド／選択） */
export type BadgeVariant = NonNullable<BadgeVariantProps['variant']>;

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, Omit<BadgeVariantProps, 'variant'> {
  /**
   * 見た目の分類。
   * @default 'default'
   */
  variant?: BadgeVariant;
  /**
   * @deprecated `variant` を使う。1 major の間だけ受け付ける。
   *
   * 旧称は `status` だったが、`accent`（ブランド／選択）を加えた時点で
   * 「状態」という括りが成り立たなくなった。`status="accent"` は
   * 「状態がアクセント」と読め、分類として破綻している。Button が
   * `variant` を使っていること、Ibuki／shadcn も `variant` であることから、
   * 中立な名前へ寄せた。`variant` が指定された場合はそちらが優先される。
   */
  status?: BadgeVariant;
  /** バッジの左側に表示するアイコン（ドットやSVG） */
  icon?: React.ReactNode;
}

// ─── Component ──────────────────────────────────────────

/**
 * Badge コンポーネント
 *
 * ステータスやカテゴリを視覚的に示すラベル。
 * 色だけに依存せず、必ずテキストと併用すること（原則2: Accessible）。
 *
 * Ibuki からの移行対応表（別名は用意していない。明示的に書き換えること）:
 * `neutral`→`default` / `brand`→`accent` / `warning`→`warning` /
 * `destructive`→`danger`
 *
 * @example
 * ```tsx
 * <Badge variant="success">完了</Badge>
 * <Badge variant="danger" appearance="solid">エラー</Badge>
 * <Badge variant="info" icon={<InfoIcon />}>3件の通知</Badge>
 * <Badge variant="accent">選択中</Badge>
 * ```
 */
export function Badge({
  className,
  variant,
  status,
  appearance,
  icon,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant: variant ?? status, appearance }), className)}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}

Badge.displayName = 'Badge';

export { badgeVariants };
