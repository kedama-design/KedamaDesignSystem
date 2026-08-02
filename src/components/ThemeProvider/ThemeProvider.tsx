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

/** 選択として妥当な値か */
function isThemeSetting(value: string): value is ThemeSetting {
  return value === 'system' || (THEMES as readonly string[]).includes(value);
}

/**
 * 保存済みの選択を検証し、壊れていたら捨てる。
 *
 * `next-themes@0.4.6` は localStorage の値を `themes` と**照合しない**。
 * そのため手で書き換えた値や、将来テーマ名を変えたときの古い値がそのまま
 * `data-theme` に載り、どのテーマ定義にも一致せず素の見た目に落ちる。
 *
 * next-themes が読む前に消す。**消すだけ**にするのは、既定値の判断を
 * next-themes 側に残すため（ここで既定値を書き込むと二重管理になる）。
 */
function discardInvalidStoredTheme(): void {
  if (typeof window === 'undefined') return;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== null && !isThemeSetting(stored)) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // localStorage が使えない環境（プライベートモード等）では何もしない
  }
}

export interface ThemeProviderProps {
  children: React.ReactNode;
  /**
   * 初期テーマ。利用者の保存済みの選択があればそちらが優先される。
   * @default 'light'
   */
  defaultTheme?: ThemeSetting;
  /** CSP で `script-src` に nonce を要求している場合に渡す */
  nonce?: string;
}

export function ThemeProvider({ children, defaultTheme = 'light', nonce }: ThemeProviderProps) {
  // next-themes が localStorage を読む前に、壊れた値を捨てる。
  // lazy initializer は初回レンダリング中に一度だけ走る。
  React.useState(() => {
    discardInvalidStoredTheme();
    return null;
  });

  return (
    <NextThemeProvider
      // ── ここから下は消費側に開けない（適用方式を分岐させないため） ──
      attribute="data-theme"
      themes={[...THEMES]}
      storageKey={STORAGE_KEY}
      // `system` は**常に**選択肢に含める。仕様が「3テーマ ＋ system」で
      // 確定しているため。無効化できるようにすると、`setTheme('system')` は
      // 型上通るのに解決先が無い＝`data-theme="system"` になりうる状態を作る。
      enableSystem
      defaultTheme={defaultTheme}
      // 切替時に全要素のトランジションが一斉に走ると画面が波打つ（Calm UI）
      disableTransitionOnChange
      // next-themes は `light` / `dark` しか知らないため、`deep-dark` のときに
      // `color-scheme: light` を書き込んでしまう（スクロールバーやフォーム部品が
      // 明色のまま残る）。ここでは書かせず、3テーマ分を CSS 側で定義する
      // （`tailwind.css` の `@layer base`）。
      enableColorScheme={false}
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
