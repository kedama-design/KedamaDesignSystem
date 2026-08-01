/**
 * Kedama Design System — セマンティックカラー / Light テーマ
 *
 * 仕様書 docs/cross-product-ui-library-spec.md §0.6「再配色マッピング（Light）」
 * および §0.7「コントラスト検証とトークン修正」に従う。
 *
 * 仕様書からの逸脱は tests/contrast.test.ts の実測にもとづくものだけ。
 * 逸脱の一覧と根拠は docs/phase-a1-token-decisions.md を参照。
 */

import { birch, primary, warning, danger, success, info } from '../../primitive/colors';
import { opacity } from '../../primitive/opacity';
import type { SemanticColorTheme } from '../themeTypes';

export const light: SemanticColorTheme = {
  fg: {
    default: birch[900],
    /** Ibuki `--text-light` = birch/700（§0.6） */
    secondary: birch[700],
    /**
     * 逸脱1: §0.6 は `--text-muted` → birch/500 だが birch/600 を採用する。
     * §0.7 運用ルール1 が fg.muted に 4.5:1 を要求する一方、birch/500 は
     * bg.subtle（birch/100）上で 4.45:1 と未達だった。§0.7 自身が
     * コントラスト実測にもとづき §0.6 の値を差し替える節であるため、
     * 同じ方針で1段濃くする。
     */
    muted: birch[600],
    /**
     * 旧 `--text-faint`（birch/400）の「純装飾」用途がここへ来る。
     * 意味のある文字には使用禁止（§0.7 運用ルール1）。
     */
    decorative: birch[400],
    placeholder: birch[400],
    disabled: birch[300],
    inverse: birch[25],
    link: primary[600],
    'link-hover': primary[700],
  },

  bg: {
    page: birch[50],
    sidebar: birch[25],
    surface: birch[25],
    'surface-raised': birch[25],
    subtle: birch[100],
    'subtle-strong': birch[200],
    hover: birch[100],
    selected: primary[25],
    scrim: { mix: { color: birch[900], alpha: opacity.scrim } },
    inverse: birch[900],
    disabled: birch[100],
  },

  border: {
    /**
     * §0.6 判断3: Ibuki の「影を使わずヘアラインだけで階層を作る」構造ルールに
     * 合わせ、Kedama 従来の birch/300 から1段薄い birch/200 にする。
     */
    default: birch[200],
    /**
     * §0.7 判断3の例外: border.strong だけは Kedama 従来の birch/400 を維持する。
     * WCAG 非テキストコントラスト 3:1 の保証を壊さないため。
     */
    strong: birch[400],
    muted: birch[100],
    active: primary[600],
    /**
     * 逸脱2: 従来 primary/400。focus ring は outline-offset で要素の外側に出るため
     * bg.subtle（birch/100）上に載ることがあり、primary/400 では 2.81:1 と 3:1 未達。
     * primary/500 なら全テーマ・全背景で 3:1 を満たす。
     */
    focus: primary[500],
    error: danger[500],
    disabled: birch[100],
  },

  accent: {
    primary: primary[600],
    'primary-hover': primary[700],
    'primary-active': primary[800],
    'primary-subtle': primary[50],
    /** §0.6 判断1: 暗いブランド色の上なので暖白に反転する */
    'primary-fg': birch[25],
    danger: danger[600],
    'danger-hover': danger[700],
    'danger-active': danger[800],
    'danger-fg': birch[25],
  },

  // ─── status ───────────────────────────────────────────
  // `-solid` は **400 番**を使う。600 番だと accent.primary（primary/600）と
  // ΔE 0.033 で判別できない。400 番なら 0.226（D型 0.216）を確保しつつ、
  // 明るい surface（birch/25）の上でも 3.41:1 以上で WCAG 1.4.11 を満たす。
  // （300 番は分離は最大 0.321 だが surface 上 2.33:1 で 1.4.11 未達だった）
  // 400 番は明るいので `-fg` は暖白ではなく near-black（birch/900）になる。
  // 4 status すべて同じ段に揃えてあるので、バッジが並んでも明度が不揃いにならない。
  status: {
    success: success[700],
    'success-bg': success[50],
    'success-border': success[200],
    'success-solid': success[400],
    'success-fg': birch[900],

    warning: warning[700],
    'warning-bg': warning[50],
    'warning-border': warning[200],
    'warning-solid': warning[400],
    'warning-fg': birch[900],

    danger: danger[700],
    'danger-bg': danger[50],
    'danger-border': danger[200],
    'danger-solid': danger[400],
    'danger-fg': birch[900],

    info: info[700],
    'info-bg': info[50],
    'info-border': info[200],
    'info-solid': info[400],
    'info-fg': birch[900],
  },

  dataViz: {
    /** §0.6 `--chart-1/2/3` = 中立色のグラフ用3段階 */
    'categorical-neutral-primary': birch[100],
    'categorical-neutral-secondary': birch[200],
    'categorical-neutral-previous': birch[300],
    'emphasis-positive': primary[600],
    'axis-default': birch[400],
    'grid-default': birch[200],
    /** §0.6 `--hm0..hm4` = brand スケールから5段階 */
    'heatmap-empty': primary[25],
    'heatmap-low': primary[100],
    'heatmap-medium': primary[300],
    'heatmap-high': primary[500],
    'heatmap-max': primary[700],
  },
};
