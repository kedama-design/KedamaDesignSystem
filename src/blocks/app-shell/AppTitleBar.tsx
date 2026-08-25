import * as React from 'react';
import { cn } from '@kedama-design/design-system';

/**
 * AppTitleBar — ワークベンチ全体に効く最上段（Tier 2 `app-shell`）
 *
 * VS Code の Title Bar / Command Center に相当する。Editor 内の現在地や操作を持つ
 * {@link AppHeader} とは責務を分け、履歴移動・プロダクト名・全体検索・レイアウト操作など、
 * ワークベンチ全体に効く要素だけを置く。
 *
 * OS のウィンドウボタンやドラッグ領域は Web / Electron で条件が異なるため内蔵しない。
 * 必要なプロダクトは `navigation` / `commandCenter` / `actions` の各スロットへ渡す。
 */

export interface AppTitleBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 左側。戻る・進むなどの履歴移動を想定 */
  navigation?: React.ReactNode;
  /** 中央。ワークスペース名または全体検索・Command Center */
  commandCenter?: React.ReactNode;
  /** 右側。レイアウト切替やアカウントなど、全体に効く操作 */
  actions?: React.ReactNode;
}

export const AppTitleBar = React.forwardRef<HTMLDivElement, AppTitleBarProps>(function AppTitleBar(
  { navigation, commandCenter, actions, className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      data-slot="app-title-bar"
      className={cn(
        'flex h-9 min-w-0 shrink-0 items-center border-b border-sidebar-border bg-sidebar px-2',
        'md:grid md:grid-cols-[minmax(0,1fr)_minmax(16rem,40rem)_minmax(0,1fr)]',
        className,
      )}
      {...props}
    >
      <div
        data-slot="app-title-bar-navigation"
        className="hidden min-w-0 items-center gap-0.5 md:flex"
      >
        {navigation}
      </div>

      <div
        data-slot="app-title-bar-command-center"
        className="flex min-w-0 flex-1 items-center justify-center md:px-2"
      >
        {commandCenter}
      </div>

      <div
        data-slot="app-title-bar-actions"
        className="ml-1 flex min-w-0 shrink-0 items-center justify-end gap-0.5 md:ml-0"
      >
        {actions}
      </div>
    </div>
  );
});
