'use client';

import React from 'react';
import { ThemeProvider as NextThemeProvider, useTheme as useNextTheme } from 'next-themes';
import type { ThemeName } from '../../tokens';

/**
 * ThemeProvider — テーマの適用と永続化
 *
 * ## 契約（先に固めたもの）
 *
 * | 項目               | 決定                                                             |
 * | ------------------ | ---------------------------------------------------------------- |
 * | 公開テーマ         | `light` / `dark` / `deep-dark` の3つ                             |
 * | 利用者の選択肢     | 上記3つ ＋ `system`（`system` はテーマではなく追随の指示）       |
 * | `system` の解決先  | Dark 側は **`dark`**（`deep-dark` にはしない）                   |
 * | 既定               | `light`                                                          |
 * | 適用方式           | `<html data-theme="...">`                                        |
 * | 保存キー           | `kedama-theme`（localStorage）                                   |
 * | 初期描画のちらつき | next-themes が `<head>` へ同期スクリプトを挿入して防ぐ           |
 * | SSR                | 安全。ただしサーバでは選択が読めない（下記）                     |
 *
 * ## `dark-alt` は公開しない
 *
 * `[data-theme="dark"][data-surface="alt"]` は Dark surface の比較と
 * コントラスト検証のためだけに存在する**属性の組み合わせ**であって、
 * テーマ値ではない。したがって `themes` には入れない。
 * 検証時は Storybook 側で `data-surface` を立てる。
 *
 * ## なぜ Props を絞るのか
 *
 * `attribute` やテーマ一覧を消費側から差し替えられるようにすると、プロダクトごとに
 * 適用方式が分岐しうる。それは本基盤が無くそうとしている「ずれ」そのもの。
 * ここで公開するのは**既定テーマと system 追随の可否**だけにする。
 *
 * ## SSR での注意
 *
 * サーバは利用者の選択（localStorage）も OS 設定も読めないため、初回レンダリングでは
 * テーマが確定しない。`useTheme()` の `theme` / `resolvedTheme` はマウント前 `undefined`
 * を返す。**テーマ名で表示を分岐する UI は `mounted` が true になるまで描画しない**こと
 * （そうしないとハイドレーション不一致になる）。`mounted` は `useTheme()` が返す。
 *
 * 見た目そのものは CSS 変数が担うため、この制約が影響するのは
 * 「今どのテーマか」を**文字やアイコンで見せる**部分だけである。
 *
 * @example
 * ```tsx
 * // アプリのルート
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 * ```
 */

/** 公開テーマ。`dark-alt` は検証専用なので含めない */
export const THEMES = ['light', 'dark', 'deep-dark'] as const satisfies readonly ThemeName[];

/** 利用者が選べる値。`system` はテーマではなく「OS に追随する」指示 */
export type ThemeSetting = ThemeName | 'system';

/** localStorage のキー。プロダクト間で揃える必要があるため固定する */
const STORAGE_KEY = 'kedama-theme';

export interface ThemeProviderProps {
  children: React.ReactNode;
  /**
   * 初期テーマ。利用者の保存済みの選択があればそちらが優先される。
   * @default 'light'
   */
  defaultTheme?: ThemeSetting;
  /**
   * `system`（OS 追随）を選択肢に含めるか。
   * @default true
   */
  enableSystem?: boolean;
  /** CSP で `script-src` に nonce を要求している場合に渡す */
  nonce?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  enableSystem = true,
  nonce,
}: ThemeProviderProps) {
  return (
    <NextThemeProvider
      // ── ここから下は消費側に開けない（適用方式を分岐させないため） ──
      attribute="data-theme"
      themes={[...THEMES]}
      storageKey={STORAGE_KEY}
      // system の Dark 解決先は dark に固定される。next-themes は
      // prefers-color-scheme: dark のとき themes の中の 'dark' を選ぶ。
      // deep-dark は「利用者が明示的に選ぶもの」であって OS からは導かない。
      enableSystem={enableSystem}
      defaultTheme={defaultTheme}
      // 切替時に全要素のトランジションが一斉に走ると画面が波打つ（Calm UI）
      disableTransitionOnChange
      nonce={nonce}
    >
      {children}
    </NextThemeProvider>
  );
}

ThemeProvider.displayName = 'ThemeProvider';

export interface UseThemeResult {
  /** 利用者の選択。`system` を含む。マウント前は `undefined` */
  theme: ThemeSetting | undefined;
  /** 実際に当たっているテーマ。`system` は解決済み。マウント前は `undefined` */
  resolvedTheme: ThemeName | undefined;
  /** OS 側の設定（`enableSystem` のとき）。マウント前は `undefined` */
  systemTheme: 'light' | 'dark' | undefined;
  /** テーマを切り替える */
  setTheme: (theme: ThemeSetting) => void;
  /** 選択できるテーマ（`system` は含まない） */
  themes: readonly ThemeName[];
  /**
   * クライアントでマウント済みか。
   * **テーマ名を表示に使う UI は、これが true になるまで描画しないこと。**
   * SSR ではテーマが確定しないため、分岐するとハイドレーション不一致になる。
   */
  mounted: boolean;
}

/**
 * 現在のテーマを読む／切り替える。
 *
 * `next-themes` の `useTheme` を Kedama の契約に絞って公開している
 * （テーマ名の型付けと `mounted` の同梱）。
 */
export function useTheme(): UseThemeResult {
  const { theme, resolvedTheme, systemTheme, setTheme } = useNextTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return {
    theme: mounted ? (theme as ThemeSetting | undefined) : undefined,
    resolvedTheme: mounted ? (resolvedTheme as ThemeName | undefined) : undefined,
    systemTheme: mounted ? (systemTheme as 'light' | 'dark' | undefined) : undefined,
    setTheme: setTheme as (theme: ThemeSetting) => void,
    themes: THEMES,
    mounted,
  };
}
