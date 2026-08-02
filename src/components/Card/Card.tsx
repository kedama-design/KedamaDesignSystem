import React from 'react';
import { cn } from '../../lib/cn';

/**
 * Card コンポーネント
 *
 * **構造は shadcn/ui の Card に合わせる**（仕様書 §0.6 方針転換・2026-07-30）。
 * 値（色・角丸・影）は Kedama トークン、命名は Kedama の API を維持する。
 *
 * **padding は 16px**（Q1 確定・2026-08-01）。§0.6「Ibuki が構成・レイアウト・
 * 挙動の正」の帰結として、Kedama の 24px ではなく Ibuki の 16px を採る。
 * パート間の `gap` も 16px に揃えた（padding だけ詰めて gap が 24px のままだと
 * 内側の余白より段間の方が広くなり、リズムが崩れるため）。
 * 影は `shadow-sm` を維持する（Calm UI の意図的な表現として残す判断）。
 *
 * shadcn 型の構造を採る理由:
 *   - root は縦方向の padding（`py-4`）と `gap-4` だけを持つ
 *   - 左右の padding（`px-4`）は各パートが持つ
 *   → こうすると Footer の `border-t` / Header の `border-b` が**全幅に伸びる**。
 *     root に一括で padding を置くと、区切り線の左右に余白が残ってしまう。
 *   → §2.1.5 で取り込む shadcn のブロックが同じ構造を前提にしているため、
 *     取り込み時の再調整も減る。
 *
 * API は2通りで使える。**named exports が正規**（報告書 Q1）。
 *
 * @example
 * ```tsx
 * // 正規（shadcn 互換）
 * <Card>
 *   <CardHeader><CardTitle>プロジェクト概要</CardTitle></CardHeader>
 *   <CardContent><p>Kedama Design System は…</p></CardContent>
 *   <CardFooter><Button variant="secondary">閉じる</Button></CardFooter>
 * </Card>
 *
 * // compound（既存互換。Body は CardContent の別名）
 * <Card>
 *   <Card.Header>…</Card.Header>
 *   <Card.Body>…</Card.Body>
 * </Card>
 * ```
 */

// ─── Card（ルートコンテナ） ─────────────────────────────

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** パディングを無くす（テーブルや画像を全幅で入れたいとき） */
  noPadding?: boolean;
}

const CardRoot = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, noPadding, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col rounded-md bg-surface',
        'border border-border-muted',
        // Calm UI の shadow.sm（blur 8px / opacity 4%）。
        // 「紙がそっと置かれたような」控えめな浮き上がり。
        'shadow-sm',
        !noPadding && 'gap-4 py-4',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);

CardRoot.displayName = 'Card';

// ─── CardHeader ─────────────────────────────────────────

export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-between gap-2 px-4',
        // border-b が付いたときだけ下の余白を足す（線が全幅に伸びる）
        '[.border-b]:pb-4',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);

CardHeader.displayName = 'CardHeader';

// ─── CardTitle ──────────────────────────────────────────

export type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('font-heading text-xl font-medium leading-none text-fg-default', className)}
      {...props}
    >
      {children}
    </h3>
  ),
);

CardTitle.displayName = 'CardTitle';

// ─── CardContent ────────────────────────────────────────

export type CardContentProps = React.HTMLAttributes<HTMLDivElement>;

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('px-4', className)} {...props}>
      {children}
    </div>
  ),
);

CardContent.displayName = 'CardContent';

/** @deprecated `CardContentProps` を使う。compound API 用に残している別名 */
export type CardBodyProps = CardContentProps;

// ─── CardFooter ─────────────────────────────────────────

export type CardFooterProps = React.HTMLAttributes<HTMLDivElement>;

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-end gap-2 px-4',
        // border-t が付いたときだけ上の余白を足す（線が全幅に伸びる）
        '[.border-t]:pt-4',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);

CardFooter.displayName = 'CardFooter';

// ─── Compound Component（既存互換） ─────────────────────

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  /** `CardContent` の別名 */
  Body: CardContent,
  Footer: CardFooter,
  Title: CardTitle,
});
