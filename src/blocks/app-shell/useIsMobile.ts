import * as React from 'react';

/**
 * ビューポートがモバイル幅かどうか。
 *
 * 移植元は shadcn/ui（Base UI variant）の `hooks/use-mobile.ts`。構造と挙動は
 * 上流のまま。閾値は primitive/breakpoints.ts の `md`（768px）と同じ値で、
 * 上流の 768 とも一致する。
 *
 * ここが `matchMedia` を使うのは、AppShell が「モバイルでは左ナビをオフキャンバス、
 * 右ペインを Drawer へ変換する」（仕様書 §4.5 ／ ベンチマーク §7.2）を
 * **DOM の構造ごと切り替える**ためで、CSS のメディアクエリでは代替できない。
 * Drawer と据え置きの `<aside>` は同じマークアップにできない。
 *
 * ⚠️ 初回レンダーは常に `false`（＝デスクトップ）を返す。`matchMedia` を読むのは
 *    effect の中で、SSR とハイドレーションのミスマッチを避けるため。上流も同じ。
 *
 * `typeof window.matchMedia !== 'function'` のガードは RollingText と同じ理由。
 * jsdom は matchMedia を実装していないので、無いときはデスクトップ扱いで据え置く。
 */
export const MOBILE_BREAKPOINT = 768;

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;

    const query = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const sync = (): void => setIsMobile(query.matches);

    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  return isMobile;
}
