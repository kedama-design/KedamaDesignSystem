import * as React from 'react';
import { cn } from '@kedama-design/design-system';
import { useIsMobile } from './useIsMobile';

/**
 * AppShell — アプリケーションの外枠（Tier 2 ブロック `app-shell`）
 *
 * 仕様書 §4.5。**npm では配らない。** レジストリ配布（`registry.json`）であり、
 * `src/index.ts` からは公開しない（`tests/tier2Boundary.test.ts` が担保する）。
 *
 * ## 正の所在（§4.5・2026-07-30 の方針転換の帰結）
 *
 * - **構造と挙動の正 … shadcn**（Base UI variant の `ui/sidebar.tsx` と
 *   dashboard 系ブロック）。context ＋ `data-state` / `data-collapsible` /
 *   `data-slot` の語彙、`--sidebar-width` / `--sidebar-width-icon` の名前、
 *   offcanvas / icon の2段階の畳み方、Cmd+B のトグルはすべて上流のもの
 * - **Ibuki のプロトタイプ（`.app` / `.side` / `.apphead` / `.statusbar`）と
 *   ベンチマーク §7.2 … 要件と参照元**。どのスロットが要るか・幅がいくつかを
 *   決める材料であって、実装の形ではない
 * - **トークンの値 … Kedama**。色は `bg-sidebar` / `border-sidebar-border` 等の
 *   セマンティック経由。primitive は直に参照しない
 *
 * ## 上流からの逸脱（意図的なもの。理由つき）
 *
 * 1. **`Sheet` ではなく `Drawer` を使う。** Sheet は廃止済みで、Drawer が唯一の
 *    汎用エッジパネル（仕様書 §2.2・§4）。取り込み品の在庫に Sheet は無い
 * 2. **`Tooltip` に依存しない。** Tier 0 に Tooltip がまだ無い。畳んだときの
 *    ラベルは `aria-label` ＋ `title` で担保する（ベンチマーク §3.3 の
 *    「アイコンだけで意味を推測させるナビゲーションを避ける」にも沿う）
 * 3. **サイドバーを `position: fixed` にしない。** 上流は `min-h-svh` の
 *    ページスクロール前提で、幅を確保するスペーサ（`sidebar-gap`）と
 *    `fixed` のコンテナに分けている。こちらは StatusBar を持つ `h-svh` の
 *    シェルで、スクロールするのは中身だけなので素直な flex 列で足りる。
 *    ラベルが潰れないよう、外側の幅だけを遷移させ内側は固定幅にする
 * 4. **`document.cookie` へ状態を書かない。** 上流は開閉状態を cookie に保存するが、
 *    保存先はプロダクトの都合（cookie / localStorage / サーバ）なので、
 *    `sidebarOpen` / `onSidebarOpenChange` の制御 prop に委ねる
 * 5. **ショートカットキーを無効化できる。** 上流は Cmd+B 固定。最初の適用先が
 *    記事エディタ（すらすらスタジオ）であり、Cmd+B は太字と衝突する。
 *    `sidebarShortcutKey={null}` で切れるようにした
 *
 * ## シェル適用ルール（§4.5 の最重要事項）
 *
 * 外枠は**明示的に着せる**。暗黙に継承させない。ログイン・招待受諾・2段階認証など
 * 認証前の画面は {@link AuthShell} を使う。すらすらスタジオで実際に起きた
 * 「ログイン画面にサイドメニューが出る」は、レイアウトの暗黙継承が原因だった。
 *
 * @example
 * ```tsx
 * <AppShell
 *   iconRail={<IconRail items={rails} activeId="articles" onSelect={select} />}
 *   sidebar={<SidebarNav groups={nav} activeId="all" onSelect={select} />}
 *   header={<AppHeader breadcrumbs={crumbs} actions={actions} />}
 *   statusBar={<StatusBar left={saved} right={count} />}
 *   rightPane={<RightPane title="レビュー">{review}</RightPane>}
 * >
 *   <ArticleTable />
 * </AppShell>
 * ```
 */

// ─── 型 ─────────────────────────────────────────────────

/** サイドバーの畳み方。上流 `Sidebar` の `collapsible` と同じ語彙 */
export type SidebarCollapsible = 'offcanvas' | 'icon' | 'none';

/** サイドバーの開閉状態。`data-state` に出る。上流と同じ語彙 */
export type SidebarState = 'expanded' | 'collapsed';

export interface AppShellContextValue {
  /** ビューポートがモバイル幅か（768px 未満） */
  isMobile: boolean;

  /** `sidebar` スロットが渡されているか */
  hasSidebar: boolean;
  /** サイドバーの畳み方 */
  sidebarCollapsible: SidebarCollapsible;
  /** デスクトップでの開閉状態 */
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  /** モバイル（Drawer）での開閉状態。デスクトップとは別に持つ（上流と同じ） */
  sidebarOpenMobile: boolean;
  setSidebarOpenMobile: (open: boolean) => void;
  /** `data-state` に出る派生値 */
  sidebarState: SidebarState;
  /** 開閉を切り替える。モバイルでは Drawer を開閉する */
  toggleSidebar: () => void;

  /** `rightPane` スロットが渡されているか */
  hasRightPane: boolean;
  rightPaneOpen: boolean;
  setRightPaneOpen: (open: boolean) => void;
  toggleRightPane: () => void;
}

export interface AppShellProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** 主コンテンツ。`<main>` の中に入る */
  children: React.ReactNode;

  /** 左端のアイコンレール。{@link IconRail} を想定 */
  iconRail?: React.ReactNode;
  /** 左サイドバー。{@link SidebarNav} を想定 */
  sidebar?: React.ReactNode;
  /** 上部バー。{@link AppHeader} を想定 */
  header?: React.ReactNode;
  /** 下部ステータスバー。{@link StatusBar} を想定 */
  statusBar?: React.ReactNode;
  /** 開閉できる右ペイン。{@link RightPane} を想定 */
  rightPane?: React.ReactNode;

  /** サイドバーの畳み方。既定 `offcanvas`（上流と同じ既定） */
  sidebarCollapsible?: SidebarCollapsible;
  /** 非制御のときの初期状態。既定 `true` */
  defaultSidebarOpen?: boolean;
  /** 制御する場合の開閉状態 */
  sidebarOpen?: boolean;
  onSidebarOpenChange?: (open: boolean) => void;

  /** 非制御のときの初期状態。既定 `false`（右ペインは閉じて始まる） */
  defaultRightPaneOpen?: boolean;
  /** 制御する場合の開閉状態 */
  rightPaneOpen?: boolean;
  onRightPaneOpenChange?: (open: boolean) => void;

  /**
   * サイドバーを開閉するショートカット（Cmd / Ctrl と組み合わせる1文字）。
   * 既定 `'b'`（上流と同じ）。`null` で無効。
   */
  sidebarShortcutKey?: string | null;

  /** 左サイドバーの幅。既定 `15rem`（240px。§4.5 の 224〜240px の上限） */
  sidebarWidth?: string;
  /** `collapsible="icon"` で畳んだときの幅。既定 `3rem`（48px。上流と同じ） */
  sidebarWidthIcon?: string;
  /** アイコンレールの幅。既定 `3rem`（48px） */
  railWidth?: string;
  /** 右ペインの幅。既定 `22.5rem`（360px。§4.5 の 320〜400px の中央） */
  rightPaneWidth?: string;
}

// ─── コンテキスト ───────────────────────────────────────

const AppShellContext = React.createContext<AppShellContextValue | null>(null);

/**
 * AppShell の状態を読む。
 *
 * AppShell の外で呼ぶと投げる。上流 `useSidebar` と同じ設計で、
 * 「シェルを着せていないのにシェルの部品を置いた」を静かに通さないため。
 */
export function useAppShell(): AppShellContextValue {
  const context = React.useContext(AppShellContext);
  if (!context) {
    throw new Error('useAppShell は AppShell の中でだけ使えます。');
  }
  return context;
}

// ─── 既定値 ─────────────────────────────────────────────

/*
 * シェルの寸法。
 *
 * トークン層には置かない。**Tier 2 の値であって Tier 0 の約束ではない**からで、
 * 仕様書 §7 Phase C(c) も「ローカル CSS に残すのは製品固有の prose と
 * shell 寸法のみ」と、シェル寸法を明示的にトークンの外に置いている。
 * 上流 shadcn も同じく sidebar.tsx 内の定数として持つ。
 * 変えたいときは props（`sidebarWidth` 等）で上書きする。
 */
const DEFAULT_SIDEBAR_WIDTH = '15rem';
const DEFAULT_SIDEBAR_WIDTH_ICON = '3rem';
const DEFAULT_RAIL_WIDTH = '3rem';
const DEFAULT_RIGHT_PANE_WIDTH = '22.5rem';

// ─── AppShell ───────────────────────────────────────────

export const AppShell = React.forwardRef<HTMLDivElement, AppShellProps>(function AppShell(
  {
    children,
    iconRail,
    sidebar,
    header,
    statusBar,
    rightPane,
    sidebarCollapsible = 'offcanvas',
    defaultSidebarOpen = true,
    sidebarOpen: sidebarOpenProp,
    onSidebarOpenChange,
    defaultRightPaneOpen = false,
    rightPaneOpen: rightPaneOpenProp,
    onRightPaneOpenChange,
    sidebarShortcutKey = 'b',
    sidebarWidth = DEFAULT_SIDEBAR_WIDTH,
    sidebarWidthIcon = DEFAULT_SIDEBAR_WIDTH_ICON,
    railWidth = DEFAULT_RAIL_WIDTH,
    rightPaneWidth = DEFAULT_RIGHT_PANE_WIDTH,
    className,
    style,
    ...props
  },
  ref,
) {
  const isMobile = useIsMobile();

  const [sidebarOpenUncontrolled, setSidebarOpenUncontrolled] = React.useState(defaultSidebarOpen);
  const sidebarOpen = sidebarOpenProp ?? sidebarOpenUncontrolled;
  const setSidebarOpen = React.useCallback(
    (open: boolean) => {
      if (sidebarOpenProp === undefined) setSidebarOpenUncontrolled(open);
      onSidebarOpenChange?.(open);
    },
    [sidebarOpenProp, onSidebarOpenChange],
  );

  const [sidebarOpenMobile, setSidebarOpenMobile] = React.useState(false);

  const [rightPaneOpenUncontrolled, setRightPaneOpenUncontrolled] =
    React.useState(defaultRightPaneOpen);
  const rightPaneOpen = rightPaneOpenProp ?? rightPaneOpenUncontrolled;
  const setRightPaneOpen = React.useCallback(
    (open: boolean) => {
      if (rightPaneOpenProp === undefined) setRightPaneOpenUncontrolled(open);
      onRightPaneOpenChange?.(open);
    },
    [rightPaneOpenProp, onRightPaneOpenChange],
  );

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) setSidebarOpenMobile(!sidebarOpenMobile);
    else setSidebarOpen(!sidebarOpen);
  }, [isMobile, sidebarOpen, sidebarOpenMobile, setSidebarOpen]);

  const toggleRightPane = React.useCallback(
    () => setRightPaneOpen(!rightPaneOpen),
    [rightPaneOpen, setRightPaneOpen],
  );

  /*
   * Cmd / Ctrl + B。上流と同じ挙動。
   * 既定を残しつつ切れるようにしてある理由は冒頭の逸脱5を参照。
   */
  React.useEffect(() => {
    if (!sidebarShortcutKey || sidebar == null) return;

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key.toLowerCase() !== sidebarShortcutKey.toLowerCase()) return;
      if (!event.metaKey && !event.ctrlKey) return;
      event.preventDefault();
      toggleSidebar();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [sidebarShortcutKey, sidebar, toggleSidebar]);

  const sidebarState: SidebarState =
    sidebarCollapsible === 'none' || sidebarOpen ? 'expanded' : 'collapsed';

  const contextValue = React.useMemo<AppShellContextValue>(
    () => ({
      isMobile,
      hasSidebar: sidebar != null,
      sidebarCollapsible,
      sidebarOpen,
      setSidebarOpen,
      sidebarOpenMobile,
      setSidebarOpenMobile,
      sidebarState,
      toggleSidebar,
      hasRightPane: rightPane != null,
      rightPaneOpen,
      setRightPaneOpen,
      toggleRightPane,
    }),
    [
      isMobile,
      sidebar,
      sidebarCollapsible,
      sidebarOpen,
      setSidebarOpen,
      sidebarOpenMobile,
      sidebarState,
      toggleSidebar,
      rightPane,
      rightPaneOpen,
      setRightPaneOpen,
      toggleRightPane,
    ],
  );

  return (
    <AppShellContext.Provider value={contextValue}>
      <div
        ref={ref}
        data-slot="app-shell"
        data-state={sidebarState}
        className={cn('flex h-svh w-full flex-col overflow-hidden bg-page', className)}
        style={
          {
            '--sidebar-width': sidebarWidth,
            '--sidebar-width-icon': sidebarWidthIcon,
            '--app-shell-rail-width': railWidth,
            '--app-shell-right-pane-width': rightPaneWidth,
            ...style,
          } as React.CSSProperties
        }
        {...props}
      >
        <div data-slot="app-shell-body" className="flex min-h-0 min-w-0 flex-1">
          {iconRail}
          {sidebar}

          <div data-slot="app-shell-main" className="flex min-h-0 min-w-0 flex-1 flex-col">
            {header}

            <div data-slot="app-shell-workspace" className="flex min-h-0 min-w-0 flex-1">
              <main data-slot="app-shell-content" className="min-h-0 min-w-0 flex-1 overflow-auto">
                {children}
              </main>
              {rightPane}
            </div>
          </div>
        </div>

        {statusBar}
      </div>
    </AppShellContext.Provider>
  );
});
