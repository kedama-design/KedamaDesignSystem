import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { elevation } from '../src/tokens/semantic/elevation';
import { shadow } from '../src/tokens/primitive/shadow';

/**
 * エレベーションの規則を守る（2026-08-02 確定）。
 *
 *   影なし   操作部品        Button など
 *   raised   地の上に浮く面  Card
 *   overlay  オーバーレイ    Modal / Drawer / Toast / 将来の Popover
 *
 * 部品は用途名（`shadow-raised` / `shadow-overlay`）を使い、primitive の段
 * （`shadow-sm` / `shadow-md` / `shadow-lg`）を直接参照しない。
 * §3.3 の primitive → semantic → component の順序を影にも適用したもの。
 */

const ROOT = resolve(__dirname, '..');
const COMPONENTS = resolve(ROOT, 'src/components');

/** src/components 配下の .tsx をすべて（テストは除く） */
function componentFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = resolve(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.tsx') && !e.name.includes('.test.')) out.push(p);
    }
  };
  walk(COMPONENTS);
  return out;
}

describe('エレベーション', () => {
  it('semantic は primitive の段を参照している', () => {
    expect(elevation.raised).toBe(shadow.sm);
    expect(elevation.overlay).toBe(shadow.lg);
  });

  it('overlay はブランドカラーを混ぜた影（無機質な黒ではない）', () => {
    // primary/600 = #315039 = rgb(49, 80, 57)
    expect(elevation.overlay).toContain('rgba(49, 80, 57');
  });

  it('md はどの用途にも割り当てていない（primitive は在庫、semantic は約束）', () => {
    expect(Object.values(elevation)).not.toContain(shadow.md);
  });

  it('部品が primitive の段を直接参照していない', () => {
    const offenders: string[] = [];

    for (const file of componentFiles()) {
      const src = readFileSync(file, 'utf8');
      // コメント行は除いて、クラスとして書かれているものだけを見る
      for (const line of src.split('\n')) {
        if (/^\s*(\*|\/\/)/.test(line)) continue;
        const hit = /\bshadow-(sm|md|lg)\b/.exec(line);
        if (hit) offenders.push(`${file.replace(ROOT + '/', '')}: ${hit[0]}`);
      }
    }

    expect(
      offenders,
      [
        '部品が primitive の段を直接参照しています:',
        ...offenders.map((o) => `  ${o}`),
        '',
        '用途名を使ってください（shadow-raised / shadow-overlay）。',
        '新しい用途が要るなら src/tokens/semantic/elevation.ts に足します。',
      ].join('\n'),
    ).toEqual([]);
  });

  it('面ごとの段の割当が規則どおり', () => {
    const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf8');

    // 地の上に浮く面
    expect(read('src/components/Card/Card.tsx')).toContain('shadow-raised');

    // オーバーレイ
    expect(read('src/components/Modal/Modal.tsx')).toContain('shadow-overlay');
    expect(read('src/components/ui/drawer.tsx')).toContain('shadow-overlay');
    expect(read('src/components/ui/toast.tsx')).toContain('shadow-overlay');

    // 操作部品は影を持たない
    expect(read('src/components/Button/Button.tsx')).not.toMatch(/\bshadow-/);
  });
});
