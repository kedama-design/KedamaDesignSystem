import * as React from 'react';
import { cn, Drawer, DrawerContent, DrawerTitle } from '@kedama-design/design-system';
import { useAppShell } from './AppShell';

/**
 * SidebarNav — 左サイドバー（Tier 2 ブロック `app-shell`）
 *
 * 仕様書 §4.5「左サイドバー（224〜240px）。ラベル付きナビ」。
 * 構造と挙動は shadcn（Base UI variant）の `ui/sidebar.tsx` ＋ dashboard 系ブロックの
 * `app-sidebar.tsx` に倣う。`data-slot` / `data-state` / `data-collapsible` の語彙も上流のまま。
 *
 * ## データ駆動にした理由
 *
 * 上流の `app-sidebar.tsx` も配列を map してメニューを組む。加えて仕様書 §5-1 が
 * 「**キーは ID / モデルで持つ。ラベルの部分文字列マッチや列の位置決め打ちで
 * 値を取り出さない**」を定めている（Ibuki doc32 §6.5 の実バグの是正）。
 * `activeId` を ID で照合する API にすると、ラベル一致で現在地を判定する実装が
 * そもそも書けない。
 *
 * 自由に組みたい部分は `header` / `footer` スロットで受ける。
 *
 * ## モバイル
 *
 * `Drawer` に化ける（仕様書 §4.5 ／ ベンチマーク §7.2「左ナビはオフキャンバス」）。
 * 上流は `Sheet` を使うが、Sheet は廃止済みで Drawer が唯一の汎用エッジパネル（§2.2）。
 *
 * ## 畳んだときのラベル
 *
 * 上流は Tooltip で出す。Tier 0 に Tooltip がまだ無いので `title` で担保する。
 * ベンチマーク §3.3 の避ける点「アイコンだけで意味を推測させるナビゲーション」に
 * 対しても、支援技術（アクセシブルネームはラベル文字列のまま）とホバーの双方で
 * ラベルが残る。
 */

// ─── 型 ─────────────────────────────────────────────────

export interface SidebarNavItem {
  /** 現在地の照合に使う。ラベルではなく ID で持つ（仕様書 §5-1） */
  id: string;
  /** 表示ラベル。畳んだときも `title` として残る */
  label: string;
  /** 行頭のアイコン。Lucide のアイコン要素を想定 */
  icon?: React.ReactNode;
  /** 行末のバッジ（未読件数など） */
  badge?: React.ReactNode;
  /** 指定するとアンカーとして描画する。無ければ `<button>` */
  href?: string;
  disabled?: boolean;
  /** 1階層だけの子項目。畳んだときは隠れる */
  items?: SidebarNavItem[];
}

export interface SidebarNavGroup {
  id: string;
  /** 見出し。畳んだときは隠れる */
  label?: string;
  items: SidebarNavItem[];
}

export interface SidebarNavProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onSelect'> {
  groups: SidebarNavGroup[];
  /** 現在地の項目 ID */
  activeId?: string;
  /** 項目が選ばれたとき。`href` を持つ項目でも呼ばれる */
  onSelect?: (item: SidebarNavItem) => void;
  /** 上部（プロダクト切替・ワークスペース名など） */
  header?: React.ReactNode;
  /** 下部の補助領域。アプリ全体のアカウント／設定は IconRail.footerItems を使う */
  footer?: React.ReactNode;
  /** ナビゲーションランドマークの名前。既定「メインナビゲーション」 */
  'aria-label'?: string;
}

// ─── 1項目 ──────────────────────────────────────────────

const itemClassName = cn(
  'group/menu-button flex min-h-6 w-full items-center gap-1.5 overflow-hidden rounded-sm',
  'px-2 py-1 text-left text-xs text-fg-muted',
  'transition-colors duration-fast ease-default',
  'outline-hidden focus-visible:ring-2 focus-visible:ring-border-focus',
  'hover:bg-hover hover:text-fg-default',
  'data-active:bg-selected data-active:text-fg-default',
  'data-disabled:pointer-events-none data-disabled:text-fg-disabled',
  // 畳んだとき（collapsible="icon"）はアイコンだけを中央に置く
  'group-data-[collapsible=icon]/sidebar:justify-center',
);

interface NavButtonProps {
  item: SidebarNavItem;
  active: boolean;
  onSelect?: (item: SidebarNavItem) => void;
  /** 子項目は一段細く描く */
  sub?: boolean;
}

function NavButton({ item, active, onSelect, sub = false }: NavButtonProps): React.JSX.Element {
  const content = (
    <>
      {item.icon != null && (
        <span
          data-slot="sidebar-nav-icon"
          aria-hidden="true"
          className="flex size-4 shrink-0 items-center justify-center [&>svg]:size-4"
        >
          {item.icon}
        </span>
      )}
      <span
        data-slot="sidebar-nav-label"
        className="min-w-0 flex-1 truncate group-data-[collapsible=icon]/sidebar:hidden"
      >
        {item.label}
      </span>
      {item.badge != null && (
        <span
          data-slot="sidebar-nav-badge"
          className="shrink-0 text-xs text-fg-muted group-data-[collapsible=icon]/sidebar:hidden"
        >
          {item.badge}
        </span>
      )}
    </>
  );

  /*
   * 畳んだときは `title` が唯一の視覚的なラベルになるので常に付ける。
   * `aria-label` は付けない — 展開時はラベル文字列が中にあり、二重定義になる。
   * `aria-current="page"` は現在地を色以外でも伝えるため
   * （ベンチマーク §9「色だけで状態を伝えない」）。
   */
  const shared = {
    'data-slot': sub ? 'sidebar-nav-sub-button' : 'sidebar-nav-button',
    'data-active': active ? '' : undefined,
    'data-disabled': item.disabled ? '' : undefined,
    'aria-current': active ? ('page' as const) : undefined,
    title: item.label,
    className: cn(itemClassName, sub && 'text-xs text-fg-muted'),
  };

  if (item.href != null && !item.disabled) {
    return (
      <a {...shared} href={item.href} onClick={() => onSelect?.(item)}>
        {content}
      </a>
    );
  }

  return (
    <button {...shared} type="button" disabled={item.disabled} onClick={() => onSelect?.(item)}>
      {content}
    </button>
  );
}

// ─── 中身（デスクトップ／モバイルで共有） ───────────────

interface SidebarNavBodyProps {
  groups: SidebarNavGroup[];
  activeId?: string;
  onSelect?: (item: SidebarNavItem) => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  label: string;
}

function SidebarNavBody({
  groups,
  activeId,
  onSelect,
  header,
  footer,
  label,
}: SidebarNavBodyProps): React.JSX.Element {
  return (
    <>
      {header != null && (
        <div data-slot="sidebar-nav-header" className="flex shrink-0 flex-col gap-1 p-1">
          {header}
        </div>
      )}

      <nav
        data-slot="sidebar-nav-content"
        aria-label={label}
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-x-hidden overflow-y-auto p-1"
      >
        {groups.map((group) => (
          <div key={group.id} data-slot="sidebar-nav-group" className="flex flex-col gap-0.5">
            {group.label != null && (
              <div
                data-slot="sidebar-nav-group-label"
                className="px-2 py-1 text-2xs leading-relaxed font-medium text-fg-muted group-data-[collapsible=icon]/sidebar:hidden"
              >
                {group.label}
              </div>
            )}

            <ul className="flex flex-col">
              {group.items.map((item) => (
                <li key={item.id} data-slot="sidebar-nav-item">
                  <NavButton item={item} active={item.id === activeId} onSelect={onSelect} />

                  {item.items != null && item.items.length > 0 && (
                    <ul className="mt-0.5 ml-4 flex flex-col gap-0.5 border-l border-sidebar-border pl-2 group-data-[collapsible=icon]/sidebar:hidden">
                      {item.items.map((child) => (
                        <li key={child.id} data-slot="sidebar-nav-sub-item">
                          <NavButton
                            item={child}
                            active={child.id === activeId}
                            onSelect={onSelect}
                            sub
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {footer != null && (
        <div
          data-slot="sidebar-nav-footer"
          className="flex shrink-0 flex-col gap-1 border-t border-sidebar-border p-1"
        >
          {footer}
        </div>
      )}
    </>
  );
}

// ─── SidebarNav ─────────────────────────────────────────

export const SidebarNav = React.forwardRef<HTMLElement, SidebarNavProps>(function SidebarNav(
  { groups, activeId, onSelect, header, footer, className, ...props },
  ref,
) {
  const { isMobile, sidebarCollapsible, sidebarState, sidebarOpenMobile, setSidebarOpenMobile } =
    useAppShell();

  const { 'aria-label': ariaLabel = 'メインナビゲーション', ...rest } = props;

  /*
   * モバイルでは項目を選んだら Drawer を閉じる。
   *
   * 開いたままだと、遷移先の画面がナビに覆われたままになる。デスクトップの
   * サイドバーは据え置きなので閉じない — 同じ操作でも意味が違う。
   */
  const handleSelect = React.useCallback(
    (item: SidebarNavItem) => {
      onSelect?.(item);
      if (isMobile) setSidebarOpenMobile(false);
    },
    [onSelect, isMobile, setSidebarOpenMobile],
  );

  const body = (
    <SidebarNavBody
      groups={groups}
      activeId={activeId}
      onSelect={handleSelect}
      header={header}
      footer={footer}
      label={ariaLabel}
    />
  );

  /*
   * `collapsible="none"` は「畳まない」指定なので、モバイルでも Drawer にしない
   * （上流 `Sidebar` も collapsible="none" では Sheet 経路に入らない）。
   * ここで Drawer にすると、AppHeader が「効かないトグルは出さない」規則で
   * トグルを消したときに、**開く手段の無い Drawer** が残ってしまう。
   */
  const alwaysVisible = sidebarCollapsible === 'none';

  /*
   * モバイルは Drawer。
   *
   * 背景色は `bg-sidebar` を**クラスで重ねずに**、shadcn 互換エイリアスの
   * `--popover` を差し替えて渡す。DrawerContent は既に `bg-popover` を持っており、
   * そこへ `bg-sidebar` を重ねると同じ background-color を2つのクラスが設定する
   * 競合になる（`cn()` は tailwind-merge を含まないため勝敗が生成 CSS 順で決まる。
   * AGENTS.md ／ tests/classConflict.test.ts）。
   *
   * ⚠️ **幅は Drawer の既定（75% / sm 以上で 24rem）に任せる。**
   *    一度 `[--drawer-content-width:var(--sidebar-width)]` を重ねたが、上流 Drawer の
   *    `data-[swipe-axis=x]:[--drawer-content-width:75%]` の方が詳細度が高く、
   *    **何もしないクラスになっていた**（実測: 390px 幅で解決値 `75%`・描画 293px）。
   *    上流 shadcn も モバイルは別値（`SIDEBAR_WIDTH_MOBILE` = 18rem ≒ 288px）を使う。
   *    デスクトップの 240px を持ち込む理由が無いので、効かないクラスを消す方を採る。
   */
  if (isMobile && !alwaysVisible) {
    return (
      <Drawer open={sidebarOpenMobile} onOpenChange={setSidebarOpenMobile} swipeDirection="left">
        <DrawerContent className="[--popover:var(--color-bg-sidebar)]">
          <DrawerTitle className="sr-only">{ariaLabel}</DrawerTitle>
          {/*
           * `data-slot` は DrawerContent へ渡さない。DrawerContent は自分の
           * `data-slot="drawer-popup"` を置いたあとに `{...props}` を展開するので、
           * 渡すと上流の語彙を**黙って上書き**してしまう（実測で発覚）。
           * サイドバーとしての目印は内側の器に置き、両方の語彙を残す。
           *
           * **`ref` / 残りの props / className はここへ渡す。** デスクトップの
           * `<aside data-slot="sidebar">` と同じ位置づけの要素であり、
           * 画面幅で `id` や `style`、イベントハンドラ、ref が消えてはならない。
           * （`ref` の宣言型は HTMLElement。div はその部分型なので実行時は安全）
           */}
          <div
            ref={ref as React.Ref<HTMLDivElement>}
            data-slot="sidebar"
            data-mobile="true"
            className={cn('flex min-h-0 flex-1 flex-col', className)}
            {...rest}
          >
            {body}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  /*
   * デスクトップ。外側だけ幅を遷移させ、内側は固定幅にする。
   * こうしないと畳む途中でラベルが潰れて折り返す。
   * 上流は `fixed` のコンテナ＋スペーサでこれを避けているが、こちらは
   * StatusBar を持つ `h-svh` シェルなので素直な flex 列で足りる（AppShell の逸脱3）。
   */
  return (
    <aside
      ref={ref}
      data-slot="sidebar"
      data-state={sidebarState}
      data-collapsible={sidebarState === 'collapsed' ? sidebarCollapsible : ''}
      className={cn(
        'group/sidebar shrink-0 overflow-hidden bg-sidebar text-fg-default',
        // 畳まない指定なら全幅で常に出す。それ以外は md 未満で Drawer へ譲る。
        // `hidden` と `flex` を接頭辞なしで重ねない（display の競合を作らない）
        alwaysVisible ? 'flex flex-col' : 'hidden md:flex md:flex-col',
        'w-(--sidebar-width) border-r border-sidebar-border',
        'transition-[width] duration-normal ease-default',
        'data-[collapsible=offcanvas]:w-0 data-[collapsible=offcanvas]:border-r-0',
        'data-[collapsible=icon]:w-(--sidebar-width-icon)',
        className,
      )}
      {...rest}
    >
      <div
        data-slot="sidebar-inner"
        className="flex h-full w-(--sidebar-width) flex-col group-data-[collapsible=icon]/sidebar:w-(--sidebar-width-icon)"
      >
        {body}
      </div>
    </aside>
  );
});
