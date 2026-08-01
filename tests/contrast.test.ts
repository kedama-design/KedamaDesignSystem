/**
 * WCAG コントラスト比 自動検証テスト（表駆動）
 *
 * case の表そのものは tests/contrastCases.ts に置いてある。
 * vitest のハーネス無しでも同じ表を検証できるようにするための分離
 * （scripts から tsx で直接読める）。
 *
 * 報告書 docs/codex-investigation-report.md Q7 の方針:
 *   - case は { theme, role, fg, bg, threshold, rationale }
 *   - 3テーマ全ペアを通す（比較用の dark surface バリアントも含む）
 *   - 例外は token 名の allowlist ではなく、具体的なペアと用途と WCAG 基準で持つ
 */

import { describe, it, expect } from 'vitest';
import { CASES, WAIVERS, THEME_VARIANTS, pick, contrastRatio } from './contrastCases';
import type { SemanticColorTheme } from '@/tokens/semantic/themeTypes';

describe('WCAG contrast (table-driven, 3 themes + dark surface variant)', () => {
  it('全4変種を検証する', () => {
    expect(Object.keys(THEME_VARIANTS)).toEqual(['light', 'dark', 'dark-alt', 'deep-dark']);
  });

  it('3テーマのキー集合が一致する', () => {
    const shape = (t: SemanticColorTheme) =>
      Object.entries(t)
        .map(([group, values]) => `${group}:${Object.keys(values).sort().join(',')}`)
        .sort()
        .join('|');
    const [first, ...rest] = Object.values(THEME_VARIANTS).map(shape);
    for (const other of rest) expect(other).toBe(first);
  });

  it.each(CASES.map((c) => [`[${c.theme}] ${c.role}`, c] as const))('%s', (_label, c) => {
    const fgHex = pick(THEME_VARIANTS[c.theme], c.fg);
    const bgHex = pick(THEME_VARIANTS[c.theme], c.bg);
    const ratio = contrastRatio(fgHex, bgHex);

    if (c.waiver) {
      expect(
        ratio,
        `[${c.theme}] ${c.role}: ${ratio.toFixed(2)}:1 が免除下限 ${c.waiver.floor}:1 を下回った。\n` +
          `免除理由: ${c.waiver.reason}\n` +
          `FG=${c.fg}(${fgHex}) BG=${c.bg}(${bgHex})`,
      ).toBeGreaterThanOrEqual(c.waiver.floor);
      return;
    }

    expect(
      ratio,
      `[${c.theme}] ${c.role}: ${ratio.toFixed(2)}:1 (WCAG ${c.wcag} は ${c.threshold}:1 を要求)\n` +
        `根拠: ${c.rationale}\n` +
        `FG=${c.fg}(${fgHex}) BG=${c.bg}(${bgHex})`,
    ).toBeGreaterThanOrEqual(c.threshold);
  });
});

describe('コントラスト表そのものの健全性', () => {
  it('すべての case が用途と WCAG 達成基準を持つ', () => {
    for (const c of CASES) {
      expect(c.rationale.length, `${c.role} に rationale がない`).toBeGreaterThan(0);
      expect(['1.4.3', '1.4.11']).toContain(c.wcag);
    }
  });

  it('すべての免除が理由と実測下限を持つ', () => {
    for (const [key, w] of Object.entries(WAIVERS)) {
      expect(w.reason.length, `${key} の免除に理由がない`).toBeGreaterThan(40);
      expect(w.floor, `${key} の免除に下限がない`).toBeGreaterThan(0);
    }
  });

  it('免除が実在する case だけを指している（stale な免除を残さない）', () => {
    const known = new Set(CASES.map((c) => `${c.theme}::${c.role}`));
    for (const key of Object.keys(WAIVERS)) {
      expect(known.has(key), `免除 ${key} に対応する case がない`).toBe(true);
    }
  });

  it('fg.decorative の case は「意味のある文字に使用禁止」を明記している', () => {
    const decorative = CASES.filter((c) => c.fg === 'fg.decorative');
    expect(decorative.length).toBeGreaterThan(0);
    for (const c of decorative) {
      expect(c.rationale).toContain('使用禁止');
    }
  });
});
