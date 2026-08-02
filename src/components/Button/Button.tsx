import React from 'react';
import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';

/**
 * Button バリアントスタイル定義
 *
 * **Tier 0 の唯一の Button**（Q1 統合・2026-08-01）。
 * 以前は Kedama 製の `Button/Button.tsx` と、取り込み品 `ui/button.tsx` の
 * 2つが並存していた。同じ要素に2つの見た目が存在する状態は、本プロジェクトが
 * 解こうとしている「ずれ」そのものなので、1つに統合し取り込み品は削除した。
 * `ui/sheet.tsx` / `ui/toast.tsx` はこの Button を参照する。
 *
 * 統合にあたっての出自:
 * - **構造・挙動**: Base UI の Button（`render` による多態。仕様書 §4 Tier 0 の
 *   「asChild→render」方針）
 * - **サイズ体系**: 取り込み品（shadcn Base UI variant）準拠 24/28/32/36。
 *   取り込む Tier 2 ブロックが無調整で馴染むことを優先した判断
 * - **色・角丸・フォーカス・モーション**: Kedama トークン（仕様書 §0.6
 *   「Kedama は色と設計思想を供給する」）
 *
 * Calm UI: 控えめなホバー、穏やかなトランジション、
 * フォーカスリングは要素から離して柔らかく表示。
 *
 * ⚠️ `cn()` は clsx のみで tailwind-merge を含まない。したがって同じ CSS
 * プロパティを触るユーティリティを base と size/variant の両方に置くと、
 * 打ち消し合わずに**生成CSSの順序**で勝敗が決まる。gap・高さ・余白・border色・
 * svg サイズは **size / variant 側だけ**に置くこと。
 */
const buttonVariants = cva(
  [
    // 共通ベーススタイル（size/variant と衝突するプロパティは置かない）
    'group/button inline-flex shrink-0 items-center justify-center',
    'font-medium whitespace-nowrap select-none',
    'rounded-sm border bg-clip-padding',
    // モーション: ホバー＝色の変化なので fast/default（docs/motion-token-mapping.md §1）
    'transition-colors duration-fast ease-default',
    // フォーカスリング（Calm UI: 要素から離して柔らかく）
    'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus',
    // disabled。native は `disabled`、render で非 button にした場合は Base UI が
    // `aria-disabled` を立てるため、両方に同じ見た目を当てる
    'disabled:pointer-events-none disabled:opacity-[var(--primitive-opacity-disabled)]',
    'aria-disabled:pointer-events-none aria-disabled:opacity-[var(--primitive-opacity-disabled)]',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-accent-primary text-accent-primary-fg border-transparent',
          'hover:bg-accent-primary-hover',
          'active:bg-accent-primary-active',
        ],
        secondary: [
          'bg-surface text-fg-default border-border-default',
          'hover:bg-hover',
          'active:bg-subtle',
        ],
        // Ibuki の outline。secondary との違いは面を持たないこと
        outline: [
          'bg-transparent text-fg-default border-border-strong',
          'hover:bg-hover',
          'active:bg-subtle',
        ],
        ghost: [
          'bg-transparent text-fg-default border-transparent',
          'hover:bg-hover',
          'active:bg-subtle',
        ],
        // 破壊的アクションは accent.danger（アクションの面）を使う。
        // status.danger は「状態の表示」であり hover/active を持たない別カテゴリ。
        danger: [
          'bg-accent-danger text-accent-danger-fg border-transparent',
          'hover:bg-accent-danger-hover',
          'active:bg-accent-danger-active',
        ],
      },
      size: {
        xs: "h-6 gap-1 px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 px-2.5 text-sm [&_svg:not([class*='size-'])]:size-3.5",
        default: "h-8 gap-1.5 px-2.5 text-sm [&_svg:not([class*='size-'])]:size-4",
        lg: "h-9 gap-1.5 px-2.5 text-md [&_svg:not([class*='size-'])]:size-4",
        icon: "size-8 [&_svg:not([class*='size-'])]:size-4",
        'icon-xs': "size-6 [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        'icon-lg': "size-9 [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

// ─── Spinner（ローディング表示） ─────────────────────────

/**
 * size クラスを持たないため、size 側の `[&_svg:not([class*='size-'])]` 規則で
 * ボタンサイズに追従する（width/height 属性は CSS 側が上書きする）。
 */
function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className)}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.25"
      />
      <path d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ─── Types ──────────────────────────────────────────────

/** 正規のバリアント名 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

/**
 * Ibuki からの移行用の別名。1 major の間だけ受け付ける（報告書 Q1）。
 *
 * Ibuki の `default`（面＋境界線＝secondary 相当）は **別名にしていない**。
 * shadcn では `default` が primary 相当を指すため、同じ綴りが上流ごとに違う
 * 意味を持つ。黙って片方へ寄せると、もう片方の取り込み品が意図しない色で
 * 描画される。移行時は `secondary` へ明示的に書き換えること。
 */
export type DeprecatedButtonVariant = 'brand' | 'destructive';

/** 正規のサイズ名（24 / 28 / 32 / 36 と正方形のアイコン版） */
export type ButtonSize =
  | 'xs'
  | 'sm'
  | 'default'
  | 'lg'
  | 'icon'
  | 'icon-xs'
  | 'icon-sm'
  | 'icon-lg';

/**
 * 旧 Kedama のサイズ名。`md` は 40px だったが、統合後の `default` は 32px。
 * 綴りは通るが**寸法は変わる**点に注意（サイズ体系の変更そのものが決定事項）。
 */
export type DeprecatedButtonSize = 'md';

const VARIANT_ALIASES: Record<DeprecatedButtonVariant, ButtonVariant> = {
  brand: 'primary',
  destructive: 'danger',
};

const SIZE_ALIASES: Record<DeprecatedButtonSize, ButtonSize> = {
  md: 'default',
};

export interface ButtonProps extends Omit<ButtonPrimitive.Props, 'className'> {
  /**
   * 見た目のバリアント。
   * @default 'primary'
   */
  variant?: ButtonVariant | DeprecatedButtonVariant;
  /**
   * サイズ。
   * @default 'default'（32px）
   */
  size?: ButtonSize | DeprecatedButtonSize;
  /** ローディング状態。trueの場合スピナーを表示しボタンを無効化する */
  loading?: boolean;
  /** ボタンの左側に表示するアイコン */
  iconLeft?: React.ReactNode;
  /** ボタンの右側に表示するアイコン */
  iconRight?: React.ReactNode;
  /**
   * Base UI の `className` は関数形式も取れるが、本コンポーネントは文字列のみ。
   * 状態に応じた分岐は `data-*` バリアント（例 `data-disabled:`）で書く。
   */
  className?: string;
}

// ─── Component ──────────────────────────────────────────

/**
 * Button コンポーネント
 *
 * Kedama Design System の基本アクションコンポーネント。
 *
 * - primary: 主要アクション（1画面に原則1つ — Calm UI）
 * - secondary: 副次アクション（面を持つ）
 * - outline: 副次アクション（面を持たない）
 * - ghost: テキストリンク的なアクション
 * - danger: 破壊的アクション（削除など）
 *
 * `render` で別要素として描画できる（Base UI）。`<button>` 以外にする場合は
 * `nativeButton={false}` を併せて渡すこと。無効化したリンクは Base UI が
 * `tabIndex={-1}` と `aria-disabled` を付け、click / keydown / pointerdown を
 * 塞ぐ。Ibuki は同じ目的で `inert` を使っていたが、`inert` は要素を
 * アクセシビリティツリーから外してしまい `aria-disabled` が読み上げられない。
 * ここでは「無効だと分かる」ことを優先して Base UI の扱いを採る。
 *
 * @example
 * ```tsx
 * <Button>保存する</Button>
 * <Button variant="secondary" iconLeft={<PlusIcon />}>追加</Button>
 * <Button variant="danger" loading>削除中…</Button>
 * <Button render={<a href="/docs" />} nativeButton={false}>ドキュメント</Button>
 * ```
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'default',
      loading = false,
      disabled,
      iconLeft,
      iconRight,
      children,
      ...props
    },
    ref,
  ) => {
    const resolvedVariant =
      variant in VARIANT_ALIASES
        ? VARIANT_ALIASES[variant as DeprecatedButtonVariant]
        : (variant as ButtonVariant);
    const resolvedSize =
      size in SIZE_ALIASES ? SIZE_ALIASES[size as DeprecatedButtonSize] : (size as ButtonSize);

    const isDisabled = disabled || loading;

    return (
      <ButtonPrimitive
        ref={ref as React.Ref<HTMLElement>}
        data-slot="button"
        className={cn(buttonVariants({ variant: resolvedVariant, size: resolvedSize }), className)}
        disabled={isDisabled}
        aria-disabled={isDisabled || undefined}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? <Spinner /> : iconLeft}
        {children}
        {!loading && iconRight}
      </ButtonPrimitive>
    );
  },
);

Button.displayName = 'Button';

export { buttonVariants };
