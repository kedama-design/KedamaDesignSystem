import * as React from 'react';
import { Button, cn, ChevronRight } from '@kedama-design/design-system';
import { PanelLeft, PanelRight, X } from 'lucide-react';
import { useAppShell } from './AppShell';

/**
 * AppHeader — ワークスペースタブと現在ビューの上部バー（Tier 2 `app-shell`）
 *
 * 仕様書 §4.5。VS Code と Linear が共通して持つ、次の2階層を分ける。
 *
 * 1. **ワークスペースタブ** — 開いている作業面を切り替える。Linear desktop の
 *    タブや VS Code の editor tabs に相当する
 * 2. **ビューヘッダー（必要なときだけ）** — 現在地、検索、そのビューにだけ効く操作を置く
 *
 * 1本のバーにパンくず・検索・通知・ユーザー・ビュー操作をすべて詰めると、
 * グローバルな移動と現在ビューの操作が同じ強さで並ぶ。Linear の UI refresh が
 * tabs / app headers / view headers を別の層として定義した理由もここにある。
 *
 * タブだけで現在地が十分に伝わり、ビュー固有の操作も無い場合はビューヘッダーを描かない。
 * 同じ情報を別の横段で繰り返さないためである。タブの履歴スタック、並べ替え、永続化は
 * プロダクトの責務。ここは ID とイベントだけを約束し、ルーターや保存先を持たない。
 * タブはプロダクト側で画面を開いた結果として追加する。対象が曖昧な汎用の追加操作は持たない。
 * モバイルではタブ列を隠し、必要な場合だけビューヘッダーを残す。
 */

export interface AppHeaderBreadcrumb {
  /** key と照合に使う ID（仕様書 §5-1） */
  id: string;
  label: string;
  href?: string;
}

export interface AppHeaderTab {
  /** 選択状態と key に使う ID */
  id: string;
  label: string;
  icon?: React.ReactNode;
  /** 指定するとアンカーになる。無ければ button */
  href?: string;
  /** 閉じる操作を出す。既定 false */
  closable?: boolean;
  disabled?: boolean;
}

export interface AppHeaderProps extends React.HTMLAttributes<HTMLElement> {
  /** デスクトップで上段に表示する、開いている作業面 */
  tabs?: AppHeaderTab[];
  /** 現在選択中のタブ ID */
  activeTabId?: string;
  /** タブを選んだとき。ラベルではなく項目そのものを渡す */
  onTabSelect?: (tab: AppHeaderTab) => void;
  /** closable なタブを閉じたとき */
  onTabClose?: (tab: AppHeaderTab) => void;
  /** タブ列のランドマーク名。既定「開いているビュー」 */
  tabsAriaLabel?: string;
  /** パンくず。最後の要素が現在地として `aria-current="page"` になる */
  breadcrumbs?: AppHeaderBreadcrumb[];
  /** ビューヘッダー中央に置く検索・コマンド入口 */
  search?: React.ReactNode;
  /** ビューヘッダー右端（通知・ユーザー等） */
  actions?: React.ReactNode;
  /** 左のサイドバートグルを出す。既定は AppShell に `sidebar` があるとき true */
  showSidebarToggle?: boolean;
  /** 右ペイントグルを出す。既定は AppShell に `rightPane` があるとき true */
  showRightPaneToggle?: boolean;
  /** ビューヘッダーの追加要素（パンくずの右） */
  children?: React.ReactNode;
}

const TAB_BAR_HEIGHT = '2.25rem';

interface HeaderTabProps {
  tab: AppHeaderTab;
  active: boolean;
  onSelect?: (tab: AppHeaderTab) => void;
  onClose?: (tab: AppHeaderTab) => void;
}

function HeaderTab({ tab, active, onSelect, onClose }: HeaderTabProps): React.JSX.Element {
  const content = (
    <>
      {tab.icon != null && (
        <span
          data-slot="app-header-tab-icon"
          aria-hidden="true"
          className="flex size-3.5 shrink-0 items-center justify-center [&>svg]:size-3.5"
        >
          {tab.icon}
        </span>
      )}
      <span className="truncate">{tab.label}</span>
    </>
  );

  const tabClassName = cn(
    'flex h-full min-w-0 max-w-56 items-center gap-2 border-t-2 border-r border-t-transparent border-r-border-muted bg-sidebar',
    'text-xs text-fg-muted transition-colors duration-fast ease-default',
    'outline-hidden hover:bg-hover hover:text-fg-default focus-visible:ring-2 focus-visible:ring-border-focus',
    'data-active:border-t-accent-primary data-active:bg-surface data-active:text-fg-default',
    'disabled:pointer-events-none disabled:text-fg-disabled',
    tab.closable && onClose != null ? 'pr-8 pl-2.5' : 'px-2.5',
  );

  const shared = {
    'data-slot': 'app-header-tab',
    'data-active': active ? '' : undefined,
    'aria-current': active ? ('page' as const) : undefined,
    title: tab.label,
    className: tabClassName,
  };

  return (
    <li data-slot="app-header-tab-item" className="relative h-full min-w-0 shrink-0">
      {tab.href != null && !tab.disabled ? (
        <a {...shared} href={tab.href} onClick={() => onSelect?.(tab)}>
          {content}
        </a>
      ) : (
        <button {...shared} type="button" disabled={tab.disabled} onClick={() => onSelect?.(tab)}>
          {content}
        </button>
      )}

      {tab.closable && onClose != null && !tab.disabled && (
        <button
          type="button"
          data-slot="app-header-tab-close"
          aria-label={`${tab.label}を閉じる`}
          title={`${tab.label}を閉じる`}
          className={cn(
            'absolute top-1/2 right-1 flex size-6 -translate-y-1/2 items-center justify-center rounded-sm',
            'text-fg-decorative transition-colors duration-fast ease-default',
            'outline-hidden hover:bg-hover hover:text-fg-default focus-visible:ring-2 focus-visible:ring-border-focus',
            '[&>svg]:size-3.5',
          )}
          onClick={() => onClose(tab)}
        >
          <X />
        </button>
      )}
    </li>
  );
}

export const AppHeader = React.forwardRef<HTMLElement, AppHeaderProps>(function AppHeader(
  {
    tabs,
    activeTabId,
    onTabSelect,
    onTabClose,
    tabsAriaLabel = '開いているビュー',
    breadcrumbs,
    search,
    actions,
    showSidebarToggle,
    showRightPaneToggle,
    children,
    className,
    style,
    ...props
  },
  ref,
) {
  const {
    hasSidebar,
    hasRightPane,
    toggleSidebar,
    toggleRightPane,
    sidebarState,
    sidebarCollapsible,
    rightPaneOpen,
    isMobile,
    sidebarOpenMobile,
  } = useAppShell();

  const sidebarToggleVisible = showSidebarToggle ?? (hasSidebar && sidebarCollapsible !== 'none');
  const rightPaneToggleVisible = showRightPaneToggle ?? hasRightPane;
  const sidebarExpanded = isMobile ? sidebarOpenMobile : sidebarState === 'expanded';
  const hasTabs = tabs != null && tabs.length > 0;
  const hasViewBar =
    sidebarToggleVisible ||
    rightPaneToggleVisible ||
    (breadcrumbs != null && breadcrumbs.length > 0) ||
    search != null ||
    actions != null ||
    children != null;

  return (
    <header
      ref={ref}
      data-slot="app-header"
      className={cn('flex shrink-0 flex-col bg-page', className)}
      style={{ '--app-shell-tab-bar-height': TAB_BAR_HEIGHT, ...style } as React.CSSProperties}
      {...props}
    >
      {hasTabs && (
        <div
          data-slot="app-header-tab-bar"
          className="hidden h-(--app-shell-tab-bar-height) min-w-0 shrink-0 items-center border-b border-border-muted bg-sidebar md:flex"
        >
          <nav aria-label={tabsAriaLabel} className="h-full min-w-0 flex-1 overflow-hidden">
            <ul className="flex h-full min-w-0 items-center overflow-x-auto">
              {tabs.map((tab) => (
                <HeaderTab
                  key={tab.id}
                  tab={tab}
                  active={tab.id === activeTabId}
                  onSelect={onTabSelect}
                  onClose={onTabClose}
                />
              ))}
            </ul>
          </nav>
        </div>
      )}

      {hasViewBar && (
        <div
          data-slot="app-header-view-bar"
          className={cn(
            'flex h-(--app-shell-view-header-height) shrink-0 items-center gap-2',
            'border-b border-border-muted bg-surface px-2 text-xs',
          )}
        >
          {sidebarToggleVisible && (
            <Button
              variant="ghost"
              size="icon-sm"
              data-slot="app-header-sidebar-toggle"
              aria-label="サイドバーの表示を切り替える"
              aria-expanded={sidebarExpanded}
              onClick={toggleSidebar}
            >
              <PanelLeft />
            </Button>
          )}

          {breadcrumbs != null && breadcrumbs.length > 0 && (
            <nav data-slot="app-header-breadcrumbs" aria-label="パンくず" className="min-w-0">
              <ol className="flex min-w-0 items-center gap-1 text-xs">
                {breadcrumbs.map((crumb, index) => {
                  const isLast = index === breadcrumbs.length - 1;
                  return (
                    <li key={crumb.id} className="flex min-w-0 items-center gap-1">
                      {index > 0 && (
                        <ChevronRight
                          aria-hidden="true"
                          className="size-3.5 shrink-0 text-fg-decorative"
                        />
                      )}
                      {crumb.href != null && !isLast ? (
                        <a
                          href={crumb.href}
                          className="truncate text-fg-muted outline-hidden hover:text-fg-default focus-visible:ring-2 focus-visible:ring-border-focus"
                        >
                          {crumb.label}
                        </a>
                      ) : (
                        <span
                          aria-current={isLast ? 'page' : undefined}
                          className={cn('truncate', isLast ? 'text-fg-default' : 'text-fg-muted')}
                        >
                          {crumb.label}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          )}

          {children}

          {search != null && (
            <div
              data-slot="app-header-search"
              className="mx-auto hidden max-w-72 min-w-0 flex-1 md:block"
            >
              {search}
            </div>
          )}

          <div data-slot="app-header-actions" className="ml-auto flex shrink-0 items-center gap-1">
            {actions}

            {rightPaneToggleVisible && (
              <Button
                variant="ghost"
                size="icon-sm"
                data-slot="app-header-right-pane-toggle"
                aria-label="右ペインの表示を切り替える"
                aria-expanded={rightPaneOpen}
                onClick={toggleRightPane}
              >
                <PanelRight />
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
});
