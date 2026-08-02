/**
 * Kedama Design System — デザイントークン パブリックAPI
 *
 * すべてのトークンはこのファイル経由でインポートする。
 *
 * 使い方:
 *   import { semanticColors, semanticTypography, spacing } from '@/tokens';
 *
 * 階層:
 *   primitive/ — 値そのもの（色のHEX値、px値など）
 *   semantic/  — 用途を意味する（fg.default, heading-2xl など）
 */

// ─── Primitive ──────────────────────────────────────────
export {
  primitiveColors,
  primary,
  birch,
  warning,
  danger,
  success,
  info,
} from './primitive/colors';

export {
  primitiveTypography,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
} from './primitive/typography';

export { spacing } from './primitive/spacing';
export { radius } from './primitive/radius';
export { shadow } from './primitive/shadow';
export { breakpoints, contentWidth, containerPadding } from './primitive/breakpoints';
export { zIndex } from './primitive/zIndex';
export { motion, duration, easing, spring, inertia } from './primitive/motion';
export { borderWidth } from './primitive/borderWidth';
export { focusRing } from './primitive/focusRing';
export { opacity, backdropBlur } from './primitive/opacity';
export { dataVizPrimitives, dataVizStroke, dataVizDash, dataVizHeatmap } from './primitive/dataViz';

// ─── Semantic ───────────────────────────────────────────
export {
  semanticColors,
  fg,
  bg,
  border,
  accent,
  status,
  dataViz,
  themes,
  defaultTheme,
  light,
  dark,
  deepDark,
  darkSurfaceAlt,
  darkSurfaceVariants,
  createDark,
  isColorMix,
  type SemanticColorTheme,
  type ThemeName,
  type DarkSurfaceVariant,
  type ColorMix,
  type ColorValue,
  type ForegroundColors,
  type BackgroundColors,
  type BorderColors,
  type AccentColors,
  type StatusColors,
  type DataVizColors,
} from './semantic/colors';

export { semanticMotion, type SemanticMotionToken } from './semantic/motion';
export { elevation, type ElevationLevel } from './semantic/elevation';

export {
  semanticTypography,
  heading2xl,
  headingXl,
  headingLg,
  headingMd,
  headingSm,
  bodyLg,
  bodyMd,
  bodySm,
  caption,
  overline,
  type TypographyStyle,
} from './semantic/typography';
