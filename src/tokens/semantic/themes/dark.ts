/**
 * Kedama Design System — セマンティックカラー / Dark テーマ
 *
 * 仕様書 docs/cross-product-ui-library-spec.md §0.6「Dark／Deep-dark の
 * 再配色マッピング（仮）」および §0.7 の修正値に従う。
 *
 * この値の位置づけ（§0.6 より）: Kedama の既存プリミティブだけを再利用し、
 * 新しい色は一切発明していない。将来 Kedama 側で Atmos により Dark 用
 * プリミティブが正式生成されたら差し替える前提の仮値。
 */

import { birch, primary, warning, danger, success, info } from '../../primitive/colors';
import { opacity } from '../../primitive/opacity';
import type { SemanticColorTheme } from '../themeTypes';

/**
 * Dark テーマの surface 候補。
 *
 * 報告書 Q7「Dark surface を birch/700 から birch/800 へ下げる案を
 * Storybook で比較し、本文階調の余地を優先する」への対応。
 * **切り替わるのは surface だけで、page は birch/800 に固定**する。
 *
 * - `default`（birch/700）: §0.6 ルール1「surface は bg より1段階明るい」に従う。
 *   面が浮き上がって見える。
 * - `alt`（birch/800）: surface が page と同色になり、面の分離は
 *   border.muted のヘアラインだけが担う。§0.6 が Deep-dark の
 *   `--bg-sidebar` で既に採っている「OLED 的に canvas と同色にし、
 *   ヘアラインのみで区切る」パターンと同じ考え方。本文階調の余地が広がる。
 *
 * CSS では `[data-theme="dark"]` と `[data-theme="dark"][data-surface="alt"]`
 * に出力される。既定は `default`。
 */
export const darkSurfaceVariants = {
  default: birch[700],
  alt: birch[800],
} as const;

export type DarkSurfaceVariant = keyof typeof darkSurfaceVariants;

export function createDark(variant: DarkSurfaceVariant = 'default'): SemanticColorTheme {
  const surface = darkSurfaceVariants[variant];

  return {
    fg: {
      default: birch[50],
      secondary: birch[200],
      /** §0.7 修正: 当初案 birch/400 は 3.45:1 で未達だったため birch/300 */
      muted: birch[300],
      /** §0.7 修正: 当初案 birch/600 は 1.47:1 で未達だったため birch/400 */
      decorative: birch[400],
      placeholder: birch[400],
      disabled: birch[500],
      inverse: birch[900],
      /** §0.6 `--text-brand` = primary/300 */
      link: primary[300],
      'link-hover': primary[200],
    },

    bg: {
      page: birch[800],
      /** §0.6: OLED 的に canvas と分離し、サイドバーは最暗にする */
      sidebar: birch[900],
      surface,
      'surface-raised': surface,
      /** §0.6 `--surface-200` / `--bg-alt` */
      subtle: birch[600],
      /** §0.6 `--surface-300` */
      'subtle-strong': birch[500],
      hover: birch[600],
      /** §0.6 `--brand-soft` = primary/800（暗地用の極薄ティント） */
      selected: primary[800],
      scrim: { mix: { color: birch[900], alpha: opacity.scrim } },
      inverse: birch[25],
      disabled: birch[600],
    },

    border: {
      /** §0.6 `--border` = birch/500 */
      default: birch[500],
      /** §0.6 `--border-strong` = birch/400 */
      strong: birch[400],
      /** §0.6 `--border-muted` = birch/600 */
      muted: birch[600],
      active: primary[400],
      focus: primary[300],
      error: danger[300],
      disabled: birch[600],
    },

    accent: {
      /** §0.6 ルール3: 暗色背景に映える、より明るいステップへシフト */
      primary: primary[400],
      'primary-hover': primary[300],
      'primary-active': primary[200],
      'primary-subtle': primary[800],
      /** §0.6 `--on-primary`: 明るい brand 背景の上なので暗色に反転 */
      'primary-fg': birch[900],
      danger: danger[400],
      'danger-hover': danger[300],
      'danger-active': danger[200],
      'danger-fg': birch[900],
    },

    status: {
      success: success[300],
      'success-bg': success[800],
      'success-border': success[600],
      'success-solid': success[200],
      'success-fg': birch[900],

      /** §0.6 `--warning` = warning/300, `--warning-bg` = warning/800 */
      warning: warning[300],
      'warning-bg': warning[800],
      'warning-border': warning[600],
      'warning-solid': warning[200],
      'warning-fg': birch[900],

      /** §0.6 `--destructive` = danger/300, `--destructive-bg` = danger/800 */
      danger: danger[300],
      'danger-bg': danger[800],
      'danger-border': danger[600],
      'danger-solid': danger[200],
      'danger-fg': birch[900],

      /** §0.6 `--info` = info/300 */
      info: info[300],
      'info-bg': info[800],
      'info-border': info[600],
      'info-solid': info[200],
      'info-fg': birch[900],
    },

    dataViz: {
      /** §0.6 `--chart-1/2/3` Dark = birch/600・500・400 */
      'categorical-neutral-primary': birch[600],
      'categorical-neutral-secondary': birch[500],
      'categorical-neutral-previous': birch[400],
      'emphasis-positive': primary[400],
      'axis-default': birch[400],
      'grid-default': birch[600],
      /** §0.6 `--hm0..hm4` Dark = primary/900・800・600・400・300 */
      'heatmap-empty': primary[900],
      'heatmap-low': primary[800],
      'heatmap-medium': primary[600],
      'heatmap-high': primary[400],
      'heatmap-max': primary[300],
    },
  };
}

/** 既定の Dark テーマ（surface = birch/700） */
export const dark: SemanticColorTheme = createDark('default');

/** 比較用の Dark テーマ（surface = birch/800） */
export const darkSurfaceAlt: SemanticColorTheme = createDark('alt');
