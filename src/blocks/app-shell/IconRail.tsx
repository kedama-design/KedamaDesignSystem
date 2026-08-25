import * as React from 'react';
import { cn } from '@kedama-design/design-system';

/**
 * IconRail — 左端のアイコンのみの細いレール（Tier 2 ブロック `app-shell`）
 *
 * 仕様書 §4.5「左端のアイコンのみの細いレール（VS Code / Linear 型）」。
 * 出典はベンチマーク §3.2・§3.3（VS Code の Activity Bar）。
 *
 * ## SidebarNav との役割の違い
 *
 * VS Code の Activity Bar と Primary Sidebar の関係と同じ。**レールは
 * 「どの領域を見るか」を選び、サイドバーは「その領域の中の何を見るか」を選ぶ。**
 * したがってレールはサイドバーの畳み方（`collapsible`）に連動しない。常に出ている。
 *
 * ## 表示はアイコンだけ、名前は失わない
 *
 * Linear / VS Code と同じく、レール上にラベル文字列は表示しない。領域名まで並べると
 * SidebarNav と情報量が重複し、48px のレールが小さなサイドバーになってしまうため。
 * 一方、アイコンの形だけで意味を推測させないよう次を契約にする。
 *
 * - `label` は必須。アクセシブルネーム（`aria-label`）と `title` の両方に使う
 * - 現在地は色面ではなく、左端の細いインジケーターと `aria-current` で示す
 * - 下部のアカウント／設定はアプリ全体のスコープ。選択中サイトの設定は SidebarNav に置く
 *
 * モバイルでは隠す。左ナビは SidebarNav の Drawer に集約する（ベンチマーク §7.2）。
 */

export interface IconRailItem {
  /** 現在地の照合に使う ID（仕様書 §5-1） */
  id: string;
  /** 必須。`aria-label` と `title` になる */
  label: string;
  icon: React.ReactNode;
  /** 小さな印（未読など）。数値ではなく点で足りることが多い */
  badge?: React.ReactNode;
  disabled?: boolean;
}

export interface IconRailProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onSelect'> {
  /** 上側に並ぶ主要な領域 */
  items: IconRailItem[];
  /** 下側に固定するアカウント・アプリ全体設定など。サイト固有設定は置かない */
  footerItems?: IconRailItem[];
  activeId?: string;
  onSelect?: (item: IconRailItem) => void;
  /** 上部（プロダクトのマーク） */
  header?: React.ReactNode;
  /** 下部の追加要素。項目として扱うものは `footerItems` を使う */
  footer?: React.ReactNode;
  /** ナビゲーションランドマークの名前。既定「領域の切り替え」 */
  'aria-label'?: string;
}

interface RailItemListProps {
  items: IconRailItem[];
  activeId?: string;
  onSelect?: (item: IconRailItem) => void;
  position: 'main' | 'footer';
}

function RailItemList({
  items,
  activeId,
  onSelect,
  position,
}: RailItemListProps): React.JSX.Element {
  return (
    <ul
      data-slot={position === 'main' ? 'icon-rail-items' : 'icon-rail-footer-items'}
      className={cn(
        'flex flex-col items-center',
        position === 'main' ? 'min-h-0 flex-1 overflow-y-auto' : 'shrink-0',
      )}
    >
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <li key={item.id} data-slot="icon-rail-item" data-position={position}>
            <button
              type="button"
              data-slot="icon-rail-button"
              data-active={active ? '' : undefined}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              title={item.label}
              disabled={item.disabled}
              onClick={() => onSelect?.(item)}
              className={cn(
                'relative flex size-12 items-center justify-center',
                'text-fg-muted transition-colors duration-fast ease-default',
                'outline-hidden focus-visible:ring-2 focus-visible:ring-border-focus',
                'hover:bg-hover hover:text-fg-default',
                'data-active:text-fg-default',
                'disabled:pointer-events-none disabled:text-fg-disabled',
                'before:absolute before:top-1/2 before:left-0 before:h-7 before:w-0.5 before:-translate-y-1/2',
                'before:bg-accent-primary before:opacity-0',
                'before:transition-opacity before:duration-fast before:ease-default',
                'data-active:before:opacity-100',
                '[&>svg]:size-6',
              )}
            >
              {item.icon}

              {item.badge != null && (
                <span
                  data-slot="icon-rail-badge"
                  aria-hidden="true"
                  className="absolute top-0.5 right-0.5"
                >
                  {item.badge}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export const IconRail = React.forwardRef<HTMLElement, IconRailProps>(function IconRail(
  { items, footerItems, activeId, onSelect, header, footer, className, ...props },
  ref,
) {
  const { 'aria-label': ariaLabel = '領域の切り替え', ...rest } = props;

  return (
    <nav
      ref={ref}
      data-slot="icon-rail"
      aria-label={ariaLabel}
      className={cn(
        'hidden w-(--app-shell-rail-width) shrink-0 flex-col items-center md:flex',
        'border-r border-sidebar-border bg-sidebar',
        className,
      )}
      {...rest}
    >
      {header != null && (
        <div data-slot="icon-rail-header" className="flex shrink-0 flex-col items-center py-1">
          {header}
        </div>
      )}

      <RailItemList items={items} activeId={activeId} onSelect={onSelect} position="main" />

      {footerItems != null && footerItems.length > 0 && (
        <RailItemList
          items={footerItems}
          activeId={activeId}
          onSelect={onSelect}
          position="footer"
        />
      )}

      {footer != null && (
        <div data-slot="icon-rail-footer" className="flex shrink-0 flex-col items-center py-1">
          {footer}
        </div>
      )}
    </nav>
  );
});
