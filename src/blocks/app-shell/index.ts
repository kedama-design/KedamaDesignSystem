/**
 * Tier 2 ブロック `app-shell`（仕様書 §4.5）
 *
 * ⚠️ **`src/index.ts` からは公開しない。** Tier 2 の配布は npm ではなく
 *    shadcn レジストリ（`registry.json` → `shadcn add @kedama/app-shell`）で、
 *    「コピーしてプロダクトごとに手を入れる」ことを前提にした単位である（§2.1）。
 *    npm に載せると、その前提と「バージョンで一元的に配る」Tier 0 の前提が混ざる。
 *    `tests/tier2Boundary.test.ts` が機械的に担保している。
 *
 * このブロックが依存するのは **Tier 0 の公開 API だけ**
 * （`@kedama-design/design-system` からの import）。深い import はしない。
 * リポジトリ内では tsconfig / vite / vitest の alias で `src/index.ts` に解決される。
 */

export {
  AppShell,
  useAppShell,
  type AppShellProps,
  type AppShellContextValue,
  type SidebarCollapsible,
  type SidebarState,
} from './AppShell';

export { AuthShell, type AuthShellProps } from './AuthShell';

export {
  SidebarNav,
  type SidebarNavProps,
  type SidebarNavGroup,
  type SidebarNavItem,
} from './SidebarNav';

export { IconRail, type IconRailProps, type IconRailItem } from './IconRail';

export { AppHeader, type AppHeaderProps, type AppHeaderBreadcrumb } from './AppHeader';

export {
  StatusBar,
  StatusBarItem,
  type StatusBarProps,
  type StatusBarItemProps,
} from './StatusBar';

export { RightPane, type RightPaneProps } from './RightPane';

export { useIsMobile, MOBILE_BREAKPOINT } from './useIsMobile';
