/**
 * Kedama Design System — セマンティックカラー / Deep-dark テーマ
 *
 * 仕様書 docs/cross-product-ui-library-spec.md §0.6「Dark／Deep-dark の
 * 再配色マッピング（仮）」に従う。
 *
 * §0.6 ルール4「文字色・ブランド色・ステータス色は Dark と Deep-dark で共通とし、
 * サーフェス／ボーダー系のみ Deep-dark でさらに一段暗く／明るくシフトする」
 * を適用している。
 */

import { birch, primary, warning, danger, success, info } from '../../primitive/colors';
import { opacity } from '../../primitive/opacity';
import type { SemanticColorTheme } from '../themeTypes';

export const deepDark: SemanticColorTheme = {
  // ルール4: 文字色は Dark と共通
  fg: {
    default: birch[50],
    secondary: birch[200],
    muted: birch[300],
    /** §0.7 修正: 当初案 birch/600 は 1.95:1 で未達だったため birch/400 */
    decorative: birch[400],
    placeholder: birch[400],
    disabled: birch[500],
    inverse: birch[900],
    link: primary[300],
    'link-hover': primary[200],
  },

  bg: {
    page: birch[900],
    /** §0.6: Dark 同様 canvas と同色にし、border.muted のヘアラインのみで区切る */
    sidebar: birch[900],
    /** §0.6 ルール1: bg より1段階明るい */
    surface: birch[800],
    'surface-raised': birch[800],
    /**
     * 逸脱3: §0.6 の表は Deep-dark の `--surface-200` / `--surface-300` を
     * birch/500 / birch/400 としているが、これは Dark（birch/600 / birch/500）より
     * **明るい**方向へのシフトであり、同じ §0.6 のルール4
     * 「サーフェス系のみ Deep-dark でさらに一段暗く」と矛盾する。
     * 実測でも fg.muted が birch/500 上で 2.24:1 と本文要件を大きく割り込む。
     * ルール4 を一貫適用し、Dark から1段暗い birch/700 / birch/600 とする。
     */
    subtle: birch[700],
    'subtle-strong': birch[600],
    hover: birch[700],
    selected: primary[800],
    scrim: { mix: { color: birch[900], alpha: opacity.scrim } },
    inverse: birch[25],
    disabled: birch[700],
  },

  // §0.6 ルール2: 暗地ではボーダーを明るい方向へシフトする
  border: {
    /** §0.6 `--border` Deep-dark = birch/400 */
    default: birch[400],
    /** §0.6 `--border-strong` Deep-dark = birch/300 */
    strong: birch[300],
    /** §0.6 `--border-muted` Deep-dark = birch/500 */
    muted: birch[500],
    active: primary[400],
    focus: primary[300],
    error: danger[300],
    disabled: birch[600],
  },

  // ルール4: ブランド色は Dark と共通
  accent: {
    primary: primary[400],
    'primary-hover': primary[300],
    'primary-active': primary[200],
    'primary-subtle': primary[800],
    'primary-fg': birch[900],
    danger: danger[400],
    'danger-hover': danger[300],
    'danger-active': danger[200],
    'danger-fg': birch[900],
  },

  // ルール4: ステータス色は Dark と共通。ただし -bg は §0.6 に従い
  // surface 系と同様 Deep-dark でさらに一段暗くする（800 → 900）。
  status: {
    success: success[300],
    'success-bg': success[900],
    'success-border': success[600],
    'success-solid': success[200],
    'success-fg': birch[900],

    warning: warning[300],
    /** §0.6 `--warning-bg` Deep-dark = warning/900 */
    'warning-bg': warning[900],
    'warning-border': warning[600],
    'warning-solid': warning[200],
    'warning-fg': birch[900],

    danger: danger[300],
    /** §0.6 `--destructive-bg` Deep-dark = danger/900 */
    'danger-bg': danger[900],
    'danger-border': danger[600],
    'danger-solid': danger[200],
    'danger-fg': birch[900],

    info: info[300],
    'info-bg': info[900],
    'info-border': info[600],
    'info-solid': info[200],
    'info-fg': birch[900],
  },

  dataViz: {
    /** §0.6 `--chart-1/2/3` Deep-dark = birch/500・400・300（やや明るい側へ） */
    'categorical-neutral-primary': birch[500],
    'categorical-neutral-secondary': birch[400],
    'categorical-neutral-previous': birch[300],
    'emphasis-positive': primary[400],
    'axis-default': birch[300],
    'grid-default': birch[500],
    /** §0.6 `--hm0..hm4` は Dark と共通（変更なし） */
    'heatmap-empty': primary[900],
    'heatmap-low': primary[800],
    'heatmap-medium': primary[600],
    'heatmap-high': primary[400],
    'heatmap-max': primary[300],
  },
};
