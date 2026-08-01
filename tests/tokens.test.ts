import { describe, it, expect } from 'vitest';
import {
  primitiveColors,
  spacing,
  radius,
  shadow,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  borderWidth,
  focusRing,
  zIndex,
  duration,
  easing,
  opacity,
  backdropBlur,
  breakpoints,
  contentWidth,
  containerPadding,
  semanticColors,
  semanticTypography,
  themes,
  isColorMix,
  type ColorValue,
} from '@/tokens';

// ─── Primitive Color Tokens ─────────────────────────────

describe('Primitive Colors', () => {
  const palettes = Object.entries(primitiveColors);
  const steps = [25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

  // amber は 2026-07-31 に廃止（未使用 + 新 warning 84° と 1.9° 差で衝突）
  it('has 6 color palettes', () => {
    expect(palettes).toHaveLength(6);
  });

  it.each(palettes)('%s has all 11 steps (25–900)', (_name, palette) => {
    for (const step of steps) {
      expect(palette).toHaveProperty(String(step));
    }
    expect(Object.keys(palette)).toHaveLength(11);
  });

  it.each(palettes)('%s values are valid hex colors', (_name, palette) => {
    for (const value of Object.values(palette)) {
      expect(value).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('does not contain pure white (#FFFFFF)', () => {
    for (const [, palette] of palettes) {
      for (const value of Object.values(palette)) {
        expect(value.toUpperCase()).not.toBe('#FFFFFF');
      }
    }
  });

  it('does not contain pure black (#000000)', () => {
    for (const [, palette] of palettes) {
      for (const value of Object.values(palette)) {
        expect(value.toUpperCase()).not.toBe('#000000');
      }
    }
  });
});

// ─── Primitive Typography Tokens ────────────────────────

describe('Primitive Typography', () => {
  it('fontFamily has heading, body, numeric, mono', () => {
    expect(fontFamily).toHaveProperty('heading');
    expect(fontFamily).toHaveProperty('body');
    expect(fontFamily).toHaveProperty('numeric');
    expect(fontFamily).toHaveProperty('mono');
  });

  // DM Sans は tnum を持たずプロポーショナル数字のため、桁を揃える数値の
  // スタックに入れてはならない（2026-07-29 実測。primitive/typography.ts 参照）。
  it('fontFamily.numeric does not fall back to DM Sans', () => {
    expect(fontFamily.numeric).not.toContain('DM Sans');
    expect(fontFamily.numeric).toContain('Noto Sans JP');
  });

  it('fontSize values are rem strings', () => {
    for (const value of Object.values(fontSize)) {
      expect(value).toMatch(/^[\d.]+rem$/);
    }
  });

  it('fontWeight values are numbers', () => {
    for (const value of Object.values(fontWeight)) {
      expect(typeof value).toBe('number');
    }
  });

  it('lineHeight values are numbers', () => {
    for (const value of Object.values(lineHeight)) {
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThan(0);
    }
  });

  it('letterSpacing values are em strings', () => {
    for (const value of Object.values(letterSpacing)) {
      expect(value).toMatch(/^-?[\d.]+em$/);
    }
  });
});

// ─── Spacing Tokens ─────────────────────────────────────

describe('Spacing', () => {
  it('has 13 steps', () => {
    expect(Object.keys(spacing)).toHaveLength(13);
  });

  it('values are px strings', () => {
    for (const value of Object.values(spacing)) {
      expect(value).toMatch(/^\d+px$/);
    }
  });

  it('starts at 0px', () => {
    expect(spacing[0]).toBe('0px');
  });
});

// ─── Other Primitive Tokens ─────────────────────────────

describe('Radius', () => {
  it('has none, sm, md, lg, full', () => {
    expect(Object.keys(radius)).toEqual(['none', 'sm', 'md', 'lg', 'full']);
  });
});

describe('Shadow', () => {
  it('has sm, md, lg', () => {
    expect(Object.keys(shadow)).toEqual(['sm', 'md', 'lg']);
  });
});

describe('Border Width', () => {
  it('has none, thin, thick', () => {
    expect(Object.keys(borderWidth)).toEqual(['none', 'thin', 'thick']);
  });
});

describe('Focus Ring', () => {
  it('has width and offset', () => {
    expect(focusRing.width).toBe('2px');
    expect(focusRing.offset).toBe('2px');
  });
});

describe('Z-Index', () => {
  it('values increase monotonically', () => {
    const values = Object.values(zIndex);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });
});

describe('Motion', () => {
  it('duration.reduced is 0ms', () => {
    expect(duration.reduced).toBe('0ms');
  });

  it('easing values are cubic-bezier strings', () => {
    for (const value of Object.values(easing)) {
      expect(value).toMatch(/^cubic-bezier\(/);
    }
  });
});

describe('Opacity', () => {
  it('values are between 0 and 1', () => {
    for (const value of Object.values(opacity)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it('backdropBlur is a px length', () => {
    expect(backdropBlur).toMatch(/^\d+px$/);
  });
});

describe('Breakpoints', () => {
  it('values increase from sm to xl', () => {
    const order = ['sm', 'md', 'lg', 'xl'] as const;
    for (let i = 1; i < order.length; i++) {
      const prev = parseInt(breakpoints[order[i - 1]]);
      const curr = parseInt(breakpoints[order[i]]);
      expect(curr).toBeGreaterThan(prev);
    }
  });

  it('contentWidth values are px lengths', () => {
    for (const value of Object.values(contentWidth)) {
      expect(value).toMatch(/^\d+px$/);
    }
  });

  it('containerPadding values are px lengths', () => {
    for (const value of Object.values(containerPadding)) {
      expect(value).toMatch(/^\d+px$/);
    }
  });
});

// ─── Semantic Color Tokens ──────────────────────────────

describe('Semantic Colors', () => {
  it('has fg, bg, border, accent, status, dataViz groups', () => {
    for (const group of ['fg', 'bg', 'border', 'accent', 'status', 'dataViz']) {
      expect(semanticColors).toHaveProperty(group);
    }
  });

  it('fg.default is birch-900', () => {
    expect(semanticColors.fg.default).toBe('#040302');
  });

  it('bg.surface is birch-25 (warmest white)', () => {
    expect(semanticColors.bg.surface).toBe('#F8F7F4');
  });

  it('has all three themes with identical key sets', () => {
    expect(Object.keys(themes).sort()).toEqual(['dark', 'deep-dark', 'light']);
    const shape = (t: (typeof themes)['light']) =>
      Object.entries(t)
        .map(([g, v]) => `${g}:${Object.keys(v).sort().join(',')}`)
        .sort()
        .join('|');
    const shapes = Object.values(themes).map(shape);
    for (const s of shapes) expect(s).toBe(shapes[0]);
  });

  // セマンティックはプリミティブを参照しなければならない（design-rules.md 1.1）。
  // 値は HEX（プリミティブと一致する）か、プリミティブのアルファ合成（ColorMix）のみ。
  // rgba() の直値は禁止 — 以前 bg.scrim が違反していた。
  it('every semantic color value is a HEX or a primitive ColorMix — never a raw rgba()', () => {
    for (const [themeName, theme] of Object.entries(themes)) {
      for (const [group, values] of Object.entries(theme)) {
        for (const [key, value] of Object.entries(values) as [string, ColorValue][]) {
          const where = `${themeName}.${group}.${key}`;
          if (isColorMix(value)) {
            expect(value.mix.color, where).toMatch(/^#[0-9A-Fa-f]{6}$/);
            expect(value.mix.alpha, where).toBeGreaterThan(0);
            expect(value.mix.alpha, where).toBeLessThanOrEqual(1);
          } else {
            expect(value, where).toMatch(/^#[0-9A-Fa-f]{6}$/);
          }
        }
      }
    }
  });

  it('bg.scrim references a primitive rather than a literal rgba()', () => {
    for (const [themeName, theme] of Object.entries(themes)) {
      expect(isColorMix(theme.bg.scrim), `${themeName}.bg.scrim`).toBe(true);
    }
  });
});

// ─── Semantic Typography Tokens ─────────────────────────

describe('Semantic Typography', () => {
  it('has 13 styles', () => {
    expect(Object.keys(semanticTypography)).toHaveLength(13);
  });

  // 桁揃えは mono ではなく fontFamily.numeric + tabular-nums で行う。
  // DM Sans（heading）は tnum 非対応なので数値スタイルに現れてはいけない。
  it('numeric styles use tabular-nums and never the heading font', () => {
    const numerics = ['numeric-sm', 'numeric-md', 'numeric-xl'] as const;
    for (const name of numerics) {
      const style = semanticTypography[name];
      expect(style.fontVariantNumeric, name).toBe('tabular-nums');
      expect(style.fontFamily, name).not.toContain('DM Sans');
    }
  });

  it('each style has all required properties', () => {
    const requiredKeys = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing'];
    for (const [, style] of Object.entries(semanticTypography)) {
      for (const key of requiredKeys) {
        expect(style).toHaveProperty(key);
      }
    }
  });

  it('headings use heading font family', () => {
    const headings = [
      'heading-2xl',
      'heading-xl',
      'heading-lg',
      'heading-md',
      'heading-sm',
    ] as const;
    for (const name of headings) {
      expect(semanticTypography[name].fontFamily).toContain('DM Sans');
    }
  });

  it('body styles use body font family', () => {
    const bodies = ['body-lg', 'body-md', 'body-sm'] as const;
    for (const name of bodies) {
      expect(semanticTypography[name].fontFamily).toContain('Noto Sans JP');
    }
  });
});
