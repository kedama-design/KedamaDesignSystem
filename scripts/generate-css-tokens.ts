/**
 * CSS Custom Properties 生成スクリプト
 *
 * src/tokens/ のTypeScript定数を唯一の真実（Single Source of Truth）として読み込み、
 * 3種類のCSSを生成する:
 *
 *   1. src/styles/tokens.css       — プリミティブ + 3テーマのセマンティック
 *   2. src/styles/alias-ibuki.css  — Ibuki 互換エイリアス（var() 参照のみ）
 *   3. src/styles/alias-shadcn.css — shadcn 互換エイリアス（var() 参照のみ）
 *
 * 層の関係（docs/design-rules.md 1.1・報告書 Q2 案(a)）:
 *
 *   プリミティブ   --primitive-color-birch-900: #040302;
 *   セマンティック --color-fg-default: var(--primitive-color-birch-900);  ← 正規CSS API
 *   エイリアス     --text: var(--color-fg-default);                       ← 値を持たない
 *
 * 出力に日時は含めない。含めると `generate → git diff --exit-code` が
 * 常に失敗し、A-1 の DoD「生成差分ゼロ」を検証できなくなるため。
 */

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── Primitives ─────────────────────────────────────────
import { primary, birch, warning, danger, success, info } from '../src/tokens/primitive/colors';
import {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
} from '../src/tokens/primitive/typography';
import { spacing } from '../src/tokens/primitive/spacing';
import { radius } from '../src/tokens/primitive/radius';
import { shadow } from '../src/tokens/primitive/shadow';
import { breakpoints, contentWidth, containerPadding } from '../src/tokens/primitive/breakpoints';
import { zIndex } from '../src/tokens/primitive/zIndex';
import { duration, easing } from '../src/tokens/primitive/motion';
import { borderWidth } from '../src/tokens/primitive/borderWidth';
import { focusRing } from '../src/tokens/primitive/focusRing';
import { opacity, backdropBlur } from '../src/tokens/primitive/opacity';
import { dataVizStroke, dataVizDash, dataVizHeatmap } from '../src/tokens/primitive/dataViz';

// ─── Semantics ──────────────────────────────────────────
import { themes, dark, darkSurfaceAlt } from '../src/tokens/semantic/colors';
import {
  isColorMix,
  type ColorValue,
  type SemanticColorTheme,
} from '../src/tokens/semantic/themeTypes';
import {
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
  numericSm,
  numericMd,
  numericXl,
} from '../src/tokens/semantic/typography';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Helpers ────────────────────────────────────────────

/** 生成ファイルの先頭に付けるヘッダ。手書きと区別するための目印。 */
function generatedHeader(title: string, extra: string[] = []): string[] {
  return [
    '/* ============================================================',
    ` * ${title}`,
    ' *',
    ' * ⚠️  このファイルは自動生成です。直接編集しないでください。',
    ' *    編集元: src/tokens/ → scripts/generate-css-tokens.ts',
    ' *    再生成: pnpm generate:tokens',
    ...extra.map((line) => (line ? ` * ${line}` : ' *')),
    ' * ============================================================ */',
    '',
  ];
}

/** オブジェクトを --prefix-key: value; 形式のCSS変数に変換 */
function flattenToVars(obj: Record<string, string | number>, prefix: string): string[] {
  return Object.entries(obj).map(([key, value]) => `  --${prefix}-${key}: ${value};`);
}

/**
 * プリミティブ値から対応するCSS変数名を逆引きする。
 * セマンティック変数を var(--primitive-...) で参照させるために使用。
 */
function buildPrimitiveValueMap(): Map<string, string> {
  const map = new Map<string, string>();
  const palettes = { primary, birch, warning, danger, success, info };
  for (const [name, palette] of Object.entries(palettes)) {
    for (const [step, hex] of Object.entries(palette)) {
      // 同じHEXが複数パレットに現れた場合は最初の定義を優先する
      if (!map.has(hex as string)) {
        map.set(hex as string, `var(--primitive-color-${name}-${step})`);
      }
    }
  }
  return map;
}

const primitiveMap = buildPrimitiveValueMap();

/**
 * セマンティックの値をCSSの右辺へ変換する。
 *
 * - HEX     → var(--primitive-...) 参照
 * - ColorMix → color-mix() でプリミティブ参照を保ったままアルファ合成
 *
 * プリミティブに存在しないHEXが来た場合は throw する。黙って直値を出力すると
 * design-rules.md 1.1「セマンティックトークンに直接値を書かない」に違反した
 * 状態が気付かれないまま通ってしまうため。
 */
function resolveSemanticValue(key: string, value: ColorValue): string {
  if (isColorMix(value)) {
    const base = primitiveMap.get(value.mix.color);
    if (!base) {
      throw new Error(
        `[generate-css-tokens] ${key}: mix のベース色 ${value.mix.color} がプリミティブに存在しません`,
      );
    }
    return `color-mix(in srgb, ${base} ${Math.round(value.mix.alpha * 100)}%, transparent)`;
  }

  const ref = primitiveMap.get(value);
  if (!ref) {
    throw new Error(
      `[generate-css-tokens] ${key}: 値 ${value} がプリミティブに存在しません。` +
        ' セマンティックはプリミティブを参照しなければなりません（design-rules.md 1.1）。',
    );
  }
  return ref;
}

// セマンティックの各グループは固有の interface（ForegroundColors 等）で
// キーが型に固定されているため index signature を持たない。ジェネリックで受けて
// entries 側で ColorValue に落とす。
function semanticGroupVars<T extends object>(obj: T, prefix: string): string[] {
  return (Object.entries(obj) as [string, ColorValue][]).map(
    ([key, value]) => `  --${prefix}-${key}: ${resolveSemanticValue(`${prefix}-${key}`, value)};`,
  );
}

/** テーマ1つ分のセマンティックカラー宣言を返す */
function themeVars(theme: SemanticColorTheme): string[] {
  return [
    ...semanticGroupVars(theme.fg, 'color-fg'),
    ...semanticGroupVars(theme.bg, 'color-bg'),
    ...semanticGroupVars(theme.border, 'color-border'),
    ...semanticGroupVars(theme.accent, 'color-accent'),
    ...semanticGroupVars(theme.status, 'color-status'),
    ...semanticGroupVars(theme.dataViz, 'color-data-viz'),
  ];
}

/** TypographyStyleをCSS変数群に変換 */
function typographyVars(
  name: string,
  style: {
    fontFamily: string;
    fontSize: string;
    fontWeight: number;
    lineHeight: number;
    letterSpacing: string;
    fontVariantNumeric?: string;
  },
): string[] {
  const out = [
    `  --typography-${name}-font-family: ${style.fontFamily};`,
    `  --typography-${name}-font-size: ${style.fontSize};`,
    `  --typography-${name}-font-weight: ${style.fontWeight};`,
    `  --typography-${name}-line-height: ${style.lineHeight};`,
    `  --typography-${name}-letter-spacing: ${style.letterSpacing};`,
  ];
  // 桁を揃える数値スタイルだけが持つ。省略時は出力しない。
  if (style.fontVariantNumeric) {
    out.push(`  --typography-${name}-font-variant-numeric: ${style.fontVariantNumeric};`);
  }
  return out;
}

// ════════════════════════════════════════════════════════
//  1. tokens.css
// ════════════════════════════════════════════════════════

const lines: string[] = generatedHeader('Kedama Design System — CSS Custom Properties', [
  '',
  'テーマ切替:            <html data-theme="light|dark|deep-dark">',
  'Dark surface 比較用:   <html data-theme="dark" data-surface="alt">',
]);

lines.push(':root {');
lines.push('');
lines.push('  /* ── Primitive: Colors ─────────────────────────────── */');

const colorPalettes = { primary, birch, warning, danger, success, info };
for (const [name, palette] of Object.entries(colorPalettes)) {
  lines.push(...flattenToVars(palette as Record<string, string>, `primitive-color-${name}`));
}

lines.push('');
lines.push('  /* ── Primitive: Typography ──────────────────────── */');
lines.push(...flattenToVars(fontFamily as Record<string, string>, 'primitive-font-family'));
lines.push(...flattenToVars(fontSize as Record<string, string>, 'primitive-font-size'));
lines.push(
  ...flattenToVars(fontWeight as Record<string, string | number>, 'primitive-font-weight'),
);
lines.push(
  ...flattenToVars(lineHeight as Record<string, string | number>, 'primitive-line-height'),
);
lines.push(...flattenToVars(letterSpacing as Record<string, string>, 'primitive-letter-spacing'));

lines.push('');
lines.push('  /* ── Primitive: Spacing ──────────────────────────── */');
lines.push(...flattenToVars(spacing as Record<string, string>, 'primitive-spacing'));

lines.push('');
lines.push('  /* ── Primitive: Radius ───────────────────────────── */');
lines.push(...flattenToVars(radius as Record<string, string>, 'primitive-radius'));

lines.push('');
lines.push('  /* ── Primitive: Shadow ───────────────────────────── */');
lines.push(...flattenToVars(shadow as Record<string, string>, 'primitive-shadow'));

lines.push('');
lines.push('  /* ── Primitive: Breakpoints ──────────────────────── */');
lines.push(...flattenToVars(breakpoints as Record<string, string>, 'primitive-breakpoint'));
lines.push(...flattenToVars(contentWidth as Record<string, string>, 'primitive-content-width'));
lines.push(
  ...flattenToVars(containerPadding as Record<string, string>, 'primitive-container-padding'),
);

lines.push('');
lines.push('  /* ── Primitive: Z-Index ──────────────────────────── */');
lines.push(...flattenToVars(zIndex as Record<string, string | number>, 'primitive-z'));

lines.push('');
lines.push('  /* ── Primitive: Motion ───────────────────────────── */');
lines.push('  /* spring / inertia は CSS transition で表現できないため出力しない。 */');
lines.push('  /* JS へ渡す値は @kedama/design-system/tokens から import する。      */');
lines.push(...flattenToVars(duration as Record<string, string>, 'primitive-duration'));
lines.push(...flattenToVars(easing as Record<string, string>, 'primitive-easing'));

lines.push('');
lines.push('  /* ── Primitive: Border Width ─────────────────────── */');
lines.push(...flattenToVars(borderWidth as Record<string, string>, 'primitive-border-width'));

lines.push('');
lines.push('  /* ── Primitive: Focus Ring ───────────────────────── */');
lines.push(...flattenToVars(focusRing as Record<string, string>, 'primitive-focus-ring'));

lines.push('');
lines.push('  /* ── Primitive: Opacity ──────────────────────────── */');
lines.push(...flattenToVars(opacity as Record<string, string | number>, 'primitive-opacity'));
lines.push(`  --primitive-backdrop-blur: ${backdropBlur};`);

lines.push('');
lines.push('  /* ── Primitive: Data Visualization (non-color) ───── */');
lines.push(...flattenToVars(dataVizStroke as Record<string, string>, 'primitive-data-viz-stroke'));
lines.push(...flattenToVars(dataVizDash as Record<string, string>, 'primitive-data-viz-dash'));
lines.push(
  ...flattenToVars(dataVizHeatmap as Record<string, string>, 'primitive-data-viz-heatmap'),
);

lines.push('');
lines.push('  /* ── Semantic: Typography ────────────────────────── */');
const typographyStyles = {
  'heading-2xl': heading2xl,
  'heading-xl': headingXl,
  'heading-lg': headingLg,
  'heading-md': headingMd,
  'heading-sm': headingSm,
  'body-lg': bodyLg,
  'body-md': bodyMd,
  'body-sm': bodySm,
  caption,
  overline,
  'numeric-sm': numericSm,
  'numeric-md': numericMd,
  'numeric-xl': numericXl,
};
for (const [name, style] of Object.entries(typographyStyles)) {
  lines.push(...typographyVars(name, style));
}

lines.push('');
lines.push('  /* ── Semantic: Colors (default = light) ──────────── */');
lines.push(...themeVars(themes.light));
lines.push('}');
lines.push('');

// ── テーマごとのセマンティック ──
for (const [name, theme] of Object.entries(themes)) {
  lines.push(`[data-theme='${name}'] {`);
  lines.push(...themeVars(theme));
  lines.push('}');
  lines.push('');
}

// ── Dark surface 比較用バリアント ──
// dark と darkSurfaceAlt の差分キーだけを上書きする。
const altOverrides = Object.entries(darkSurfaceAlt.bg)
  .filter(([key, value]) => {
    const base = dark.bg[key as keyof typeof dark.bg];
    return JSON.stringify(base) !== JSON.stringify(value);
  })
  .map(
    ([key, value]) =>
      `  --color-bg-${key}: ${resolveSemanticValue(`color-bg-${key}`, value as ColorValue)};`,
  );

lines.push('/* 比較用: Dark の surface を birch/800 に下げる（報告書 Q7）。');
lines.push('   page は birch/800 のまま。面の分離は border.muted のヘアラインが担う。 */');
lines.push("[data-theme='dark'][data-surface='alt'] {");
lines.push(...altOverrides);
lines.push('}');
lines.push('');

writeFileSync(resolve(__dirname, '../src/styles/tokens.css'), lines.join('\n'), 'utf-8');

// ════════════════════════════════════════════════════════
//  2 & 3. エイリアス
// ════════════════════════════════════════════════════════

/**
 * エイリアスは値を持たず var() 参照のみ（報告書 Q2）。
 * `:root, [data-theme]` の両方に宣言することで、data-theme がルート以外の
 * 要素に付いていても、その場所のセマンティック値を拾う。
 */
function buildAliasCss(title: string, notes: string[], map: Record<string, string>): string {
  const out = generatedHeader(title, notes);
  out.push(':root,');
  out.push('[data-theme] {');
  for (const [alias, target] of Object.entries(map)) {
    out.push(`  --${alias}: var(--${target});`);
  }
  out.push('}');
  out.push('');
  return out.join('\n');
}

// ── Ibuki 互換 ──
// 出典: 仕様書 §0.6 の再配色マッピング表。
const ibukiAliases: Record<string, string> = {
  brand: 'color-accent-primary',
  'brand-600': 'color-accent-primary-hover',
  'text-brand': 'color-fg-link',
  'brand-soft': 'color-bg-selected',
  'on-primary': 'color-accent-primary-fg',

  bg: 'color-bg-page',
  'bg-sidebar': 'color-bg-sidebar',
  surface: 'color-bg-surface',
  'surface-200': 'color-bg-subtle',
  'surface-300': 'color-bg-subtle-strong',
  'bg-alt': 'color-bg-subtle',

  'border-muted': 'color-border-muted',
  border: 'color-border-default',
  'border-strong': 'color-border-strong',

  text: 'color-fg-default',
  'text-light': 'color-fg-secondary',
  'text-muted': 'color-fg-muted',

  // Ibuki には success セマンティックが存在せず、成功・完了・正常を
  // すべて `--brand` で代用していた。ブランドと成功が同じ色になる原因なので
  // 移行先として新設する。使用箇所の振り分けは docs/ibuki-brand-audit.md を参照。
  success: 'color-status-success',
  'success-bg': 'color-status-success-bg',
  'success-border': 'color-status-success-border',
  'success-solid': 'color-status-success-solid',

  warning: 'color-status-warning',
  'warning-bg': 'color-status-warning-bg',
  destructive: 'color-status-danger',
  'destructive-bg': 'color-status-danger-bg',
  info: 'color-status-info',

  'chart-1': 'color-data-viz-categorical-neutral-primary',
  'chart-2': 'color-data-viz-categorical-neutral-secondary',
  'chart-3': 'color-data-viz-categorical-neutral-previous',

  hm0: 'color-data-viz-heatmap-empty',
  hm1: 'color-data-viz-heatmap-low',
  hm2: 'color-data-viz-heatmap-medium',
  hm3: 'color-data-viz-heatmap-high',
  hm4: 'color-data-viz-heatmap-max',
};

writeFileSync(
  resolve(__dirname, '../src/styles/alias-ibuki.css'),
  buildAliasCss(
    'Kedama Design System — Ibuki 互換エイリアス',
    [
      '',
      '出典: docs/cross-product-ui-library-spec.md §0.6 再配色マッピング。',
      'エイリアスは値を持たず var() 参照のみ（報告書 Q2 案(a)）。',
      '',
      '⚠️  alias-shadcn.css と同時に読み込まないこと。--destructive の指す先が',
      '    両者で異なる（Ibuki=文字色 status.danger / shadcn=背景色 status.danger-solid）。',
      '',
      '⚠️  --text-faint は出力しない。§0.7 で廃止され、用途ごとに fg.decorative /',
      '    fg.placeholder / fg.disabled / fg.muted へ分離した。',
      '    使用箇所ごとの移行先: docs/text-faint-audit.md',
    ],
    ibukiAliases,
  ),
  'utf-8',
);

// ── shadcn/ui 互換 ──
const shadcnAliases: Record<string, string> = {
  background: 'color-bg-page',
  foreground: 'color-fg-default',
  card: 'color-bg-surface',
  'card-foreground': 'color-fg-default',
  popover: 'color-bg-surface-raised',
  'popover-foreground': 'color-fg-default',

  primary: 'color-accent-primary',
  'primary-foreground': 'color-accent-primary-fg',
  secondary: 'color-bg-subtle',
  'secondary-foreground': 'color-fg-default',
  muted: 'color-bg-subtle',
  'muted-foreground': 'color-fg-muted',
  accent: 'color-bg-hover',
  'accent-foreground': 'color-fg-default',
  destructive: 'color-status-danger-solid',
  'destructive-foreground': 'color-status-danger-fg',

  border: 'color-border-default',
  // §0.7 運用ルール2: 入力コントロールの枠線は 3:1 が必要なため border.strong
  input: 'color-border-strong',
  ring: 'color-border-focus',

  'chart-1': 'color-data-viz-categorical-neutral-primary',
  'chart-2': 'color-data-viz-categorical-neutral-secondary',
  'chart-3': 'color-data-viz-categorical-neutral-previous',
  'chart-4': 'color-data-viz-emphasis-positive',
  // amber(tertiary) 廃止により、5本目は data-viz の軸色を充てる
  'chart-5': 'color-data-viz-axis-default',

  sidebar: 'color-bg-sidebar',
  'sidebar-foreground': 'color-fg-default',
  'sidebar-primary': 'color-accent-primary',
  'sidebar-primary-foreground': 'color-accent-primary-fg',
  'sidebar-accent': 'color-bg-hover',
  'sidebar-accent-foreground': 'color-fg-default',
  'sidebar-border': 'color-border-muted',
  'sidebar-ring': 'color-border-focus',

  radius: 'primitive-radius-md',
};

writeFileSync(
  resolve(__dirname, '../src/styles/alias-shadcn.css'),
  buildAliasCss(
    'Kedama Design System — shadcn/ui 互換エイリアス',
    [
      '',
      'shadcn/ui のブロックを取り込んだまま Kedama トークンで動かすための層。',
      'エイリアスは値を持たず var() 参照のみ（報告書 Q2 案(a)）。',
      '',
      '⚠️  alias-ibuki.css と同時に読み込まないこと（--destructive が衝突する）。',
    ],
    shadcnAliases,
  ),
  'utf-8',
);

console.log('✓ Generated src/styles/tokens.css');
console.log('✓ Generated src/styles/alias-ibuki.css');
console.log('✓ Generated src/styles/alias-shadcn.css');
