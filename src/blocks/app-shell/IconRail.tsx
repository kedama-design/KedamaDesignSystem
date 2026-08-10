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
 * ## アイコンだけにしない
 *
 * ベンチマーク §3.3 は避ける点として「**アイコンだけで意味を推測させる
 * ナビゲーション**」を挙げている。そのため:
 *
 * - `label` は必須。アクセシブルネーム（`aria-label`）と `title` の両方に使う
 * - `showLabels` でアイコン下に小さなラベルを出せる（VS Code も設定で出せる）。
 *   既定は false（レールを細く保つ）だが、業務システムでは true を推奨する
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
  items: IconRailItem[];
  activeId?: string;
  onSelect?: (item: IconRailItem) => void;
  /** 上部（プロダクトのマーク） */
  header?: React.ReactNode;
  /** 下部（設定・ユーザー） */
  footer?: React.ReactNode;
  /** アイコンの下にラベルを出す。既定 false */
  showLabels?: boolean;
  /** ナビゲーションランドマークの名前。既定「領域の切り替え」 */
  'aria-label'?: string;
}

export const IconRail = React.forwardRef<HTMLElement, IconRailProps>(function IconRail(
  { items, activeId, onSelect, header, footer, showLabels = false, className, ...props },
  ref,
) {
  const { 'aria-label': ariaLabel = '領域の切り替え', ...rest } = props;

  return (
    <nav
      ref={ref}
      data-slot="icon-rail"
      aria-label={ariaLabel}
      className={cn(
        'hidden w-(--app-shell-rail-width) shrink-0 flex-col items-center gap-1 md:flex',
        'border-r border-sidebar-border bg-sidebar p-1',
        className,
      )}
      {...rest}
    >
      {header != null && (
        <div data-slot="icon-rail-header" className="flex shrink-0 flex-col items-center py-1">
          {header}
        </div>
      )}

      <ul className="flex min-h-0 flex-1 flex-col items-center gap-1 overflow-y-auto">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id} data-slot="icon-rail-item">
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
                  'relative flex w-10 flex-col items-center justify-center gap-0.5 rounded-md py-1.5',
                  'text-fg-muted transition-colors duration-fast ease-default',
                  'outline-hidden focus-visible:ring-2 focus-visible:ring-border-focus',
                  'hover:bg-hover hover:text-fg-default',
                  'data-active:bg-selected data-active:text-fg-default',
                  'disabled:pointer-events-none disabled:text-fg-disabled',
                  '[&>svg]:size-5',
                )}
              >
                {item.icon}

                {showLabels && (
                  <span
                    data-slot="icon-rail-label"
                    aria-hidden="true"
                    className="w-full truncate text-center text-2xs leading-relaxed"
                  >
                    {item.label}
                  </span>
                )}

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

      {footer != null && (
        <div data-slot="icon-rail-footer" className="flex shrink-0 flex-col items-center py-1">
          {footer}
        </div>
      )}
    </nav>
  );
});
