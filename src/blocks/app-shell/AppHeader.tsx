import * as React from 'react';
import { Button, cn, ChevronRight } from '@kedama-design/design-system';
import { PanelLeft, PanelRight } from 'lucide-react';
import { useAppShell } from './AppShell';

/**
 * AppHeader — 上部バー（Tier 2 ブロック `app-shell`）
 *
 * 仕様書 §4.5「上部バー。パンくず／検索／Cmd+K／通知／ユーザー」。
 * 出典は Ibuki `.apphead` とベンチマーク §7.2。
 *
 * ## スロットの分け方
 *
 * 左（サイドバートグル＋パンくず）／中央（検索）／右（通知・ユーザー等）に分ける。
 * 検索は中央に幅を絞って置く。ベンチマーク §7.2 が Global 行に検索を置いており、
 * Cmd+K は §3.2 の適用「ショートカットを唯一の操作経路にしない」に従って
 * 画面上のボタンとしても残す前提。CommandPalette 自体は本ブロックの範囲外
 * （Tier 2 の別アイテム）なので、ここは `search` スロットで受けるだけにする。
 *
 * ## トグル
 *
 * 左のサイドバートグルは AppShell に `sidebar` があるとき出る。右ペインのトグルは
 * `rightPane` があるとき出る。どちらも AppShell の context を読む
 * （上流 `SidebarTrigger` と同じ設計）。
 *
 * `PanelLeft` / `PanelRight` は Icon の re-export に無いため lucide-react から直接
 * 取る。新しいアイコンパッケージは足していない（`.claude/rules/figma-design-system.md`）。
 */

export interface AppHeaderBreadcrumb {
  /** key と照合に使う ID（仕様書 §5-1） */
  id: string;
  label: string;
  href?: string;
}

export interface AppHeaderProps extends React.HTMLAttributes<HTMLElement> {
  /** パンくず。最後の要素が現在地として `aria-current="page"` になる */
  breadcrumbs?: AppHeaderBreadcrumb[];
  /** 中央に置く検索・コマンド入口 */
  search?: React.ReactNode;
  /** 右端（通知・ユーザー・テーマ切替など） */
  actions?: React.ReactNode;
  /** 左のサイドバートグルを出す。既定は AppShell に `sidebar` があるとき true */
  showSidebarToggle?: boolean;
  /** 右ペイントグルを出す。既定は AppShell に `rightPane` があるとき true */
  showRightPaneToggle?: boolean;
  /** 追加要素（パンくずの右） */
  children?: React.ReactNode;
}

const HEADER_HEIGHT = '3rem';

export const AppHeader = React.forwardRef<HTMLElement, AppHeaderProps>(function AppHeader(
  {
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

  /*
   * `collapsible="none"` のときはトグルを出さない。押しても何も起きない操作を
   * 置くと、壊れているのか仕様なのかを利用者が区別できない。
   * 明示指定（`showSidebarToggle`）があればそちらが勝つ。
   */
  const sidebarToggleVisible = showSidebarToggle ?? (hasSidebar && sidebarCollapsible !== 'none');
  const rightPaneToggleVisible = showRightPaneToggle ?? hasRightPane;
  const sidebarExpanded = isMobile ? sidebarOpenMobile : sidebarState === 'expanded';

  return (
    <header
      ref={ref}
      data-slot="app-header"
      className={cn(
        'flex h-(--app-shell-header-height) shrink-0 items-center gap-2',
        'border-b border-border-muted bg-surface px-2',
        className,
      )}
      style={{ '--app-shell-header-height': HEADER_HEIGHT, ...style } as React.CSSProperties}
      {...props}
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
          <ol className="flex min-w-0 items-center gap-1 text-sm">
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
          className="mx-auto hidden max-w-80 min-w-0 flex-1 md:block"
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
    </header>
  );
});
