import * as React from 'react';
import { cn } from '@kedama-design/design-system';

/**
 * StatusBar — 下部ステータスバー（Tier 2 ブロック `app-shell`）
 *
 * 仕様書 §4.5「下部ステータスバー。接続状態・保存状態・件数等」。
 * 出典は Ibuki `.statusbar`（プロトタイプにあるが未コンポーネント化）と
 * ベンチマーク §3.3（VS Code の Status Bar）。§4.6 は「下部バーの欠落」を
 * 「モダンに見えない」の一因として挙げている。
 *
 * ## Calm UI としての位置づけ
 *
 * ベンチマーク §3.3 の適用「WordPress 入稿状態や自動保存状態は、**作業を邪魔しない
 * 小さな状態表示**にする」。ここは通知の置き場ではない。割り込みが要るものは Toast、
 * 恒常的な状態はここ、という切り分けにする。
 *
 * ## 読み上げ
 *
 * 状態の更新を支援技術へ伝えたい項目（保存済み／接続断など）は
 * `StatusBarItem` に `live` を付ける。**バー全体を live region にはしない。**
 * 件数のような頻繁に変わる値まで読み上げると、Calm どころか騒がしくなる。
 */

export interface StatusBarProps extends React.HTMLAttributes<HTMLElement> {
  /** 左側（保存状態・接続状態など） */
  left?: React.ReactNode;
  /** 右側（件数・カーソル位置・バージョンなど） */
  right?: React.ReactNode;
  /** left / right の間に入る自由領域 */
  children?: React.ReactNode;
  /** ランドマークの名前。既定「ステータス」 */
  'aria-label'?: string;
}

const STATUS_BAR_HEIGHT = '1.75rem';

export const StatusBar = React.forwardRef<HTMLElement, StatusBarProps>(function StatusBar(
  { left, right, children, className, style, ...props },
  ref,
) {
  const { 'aria-label': ariaLabel = 'ステータス', ...rest } = props;

  return (
    <footer
      ref={ref}
      data-slot="status-bar"
      aria-label={ariaLabel}
      className={cn(
        'flex h-(--app-shell-status-bar-height) shrink-0 items-center gap-3',
        'border-t border-border-muted bg-surface px-3 text-xs text-fg-muted',
        className,
      )}
      style={
        { '--app-shell-status-bar-height': STATUS_BAR_HEIGHT, ...style } as React.CSSProperties
      }
      {...rest}
    >
      {left != null && (
        <div data-slot="status-bar-left" className="flex min-w-0 items-center gap-3">
          {left}
        </div>
      )}

      {children}

      {right != null && (
        <div data-slot="status-bar-right" className="ml-auto flex min-w-0 items-center gap-3">
          {right}
        </div>
      )}
    </footer>
  );
});

/** ステータスバーの1項目 */
export interface StatusBarItemProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** 行頭のアイコン */
  icon?: React.ReactNode;
  /**
   * 状態の色。**色だけで状態を伝えない**（ベンチマーク §9）ため、
   * 文言かアイコンを必ず添えること。
   */
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  /** 変化を支援技術へ穏やかに伝える（`aria-live="polite"`） */
  live?: boolean;
}

const toneClassName: Record<NonNullable<StatusBarItemProps['tone']>, string> = {
  default: 'text-fg-muted',
  success: 'text-status-success',
  warning: 'text-status-warning',
  danger: 'text-status-danger',
  info: 'text-status-info',
};

export const StatusBarItem = React.forwardRef<HTMLSpanElement, StatusBarItemProps>(
  function StatusBarItem(
    { icon, tone = 'default', live = false, className, children, ...props },
    ref,
  ) {
    return (
      <span
        ref={ref}
        data-slot="status-bar-item"
        data-tone={tone}
        aria-live={live ? 'polite' : undefined}
        className={cn(
          'flex min-w-0 items-center gap-1 truncate [&>svg]:size-3.5 [&>svg]:shrink-0',
          toneClassName[tone],
          className,
        )}
        {...props}
      >
        {icon}
        {children}
      </span>
    );
  },
);
