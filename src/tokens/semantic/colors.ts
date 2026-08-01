/**
 * Kedama Design System — セマンティックカラートークン（公開API）
 *
 * 用途を意味する。値はプリミティブを参照する。
 * コンポーネントは必ずセマンティックトークン経由で色を参照する。
 *
 * 命名規則: {カテゴリ}.{要素}.{状態/バリアント}
 *
 * ダークモード対応（Phase A-1 で実装済み）:
 *   3テーマ（light / dark / deep-dark）を `themes` に持つ。
 *   このファイルが名前付きで re-export する `fg` / `bg` / … は
 *   **Light テーマ**を指す。実行時のテーマ切替は CSS 側の `[data-theme]` が
 *   担うため、これは TypeScript から既定テーマの値を直接読みたいケース
 *   （Storybook のカタログ、テスト等）向けの互換 API である。
 *
 * Figma Variables との対応:
 *   Collection: "Semantics" > Variable Alias でプリミティブを参照
 *   例: color/fg/default → birch/900
 */

import { light } from './themes/light';
import { dark, darkSurfaceAlt, darkSurfaceVariants, createDark } from './themes/dark';
import { deepDark } from './themes/deepDark';
import type { SemanticColorTheme, ThemeName } from './themeTypes';

export type {
  SemanticColorTheme,
  ThemeName,
  ColorMix,
  ColorValue,
  ForegroundColors,
  BackgroundColors,
  BorderColors,
  AccentColors,
  StatusColors,
  DataVizColors,
} from './themeTypes';
export { isColorMix } from './themeTypes';

export { light, dark, deepDark, darkSurfaceAlt, darkSurfaceVariants, createDark };
export type { DarkSurfaceVariant } from './themes/dark';

/**
 * 全テーマ。generator とコントラストテストはここを唯一の入口にする。
 * キー集合は `SemanticColorTheme` により3テーマで一致することが保証される。
 */
export const themes: Record<ThemeName, SemanticColorTheme> = {
  light,
  dark,
  'deep-dark': deepDark,
};

/** 既定テーマ名 */
export const defaultTheme: ThemeName = 'light';

// ─── Light テーマの名前付き re-export（後方互換） ─────────
// 既存の `import { fg, bg } from '@/tokens/semantic/colors'` を壊さない。

export const { fg, bg, border, accent, status, dataViz } = light;

/**
 * セマンティックカラー全体（Light）をエクスポート。
 * フラットなドット記法で参照できる:
 *   semanticColors.fg.default
 *   semanticColors.accent.primary
 */
export const semanticColors: SemanticColorTheme = light;
