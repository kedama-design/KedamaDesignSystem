import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * 同じ役割のコンポーネントが2つ存在していないかを機械的に検出する。
 *
 * ## なぜこれがあるのか
 *
 * §2.1.5 で shadcn のブロックを取り込んだ結果、**Button が2つ並存した**
 * （Kedama 製 `components/Button/Button.tsx` と取り込み品 `components/ui/button.tsx`）。
 * 角丸・高さ・variant 名がすべて別体系で、`ui/sheet.tsx` と `ui/toast.tsx` だけが
 * 取り込み品を参照していた。この基盤が無くそうとしている「ずれ」が、基盤自身の
 * 中で起きたことになる（2026-08-02 に統合して解消）。
 *
 * 3つ目を防ぐのがこのテスト。取り込みは「配置してから考える」と衝突に気づけない。
 * **取り込む前に統合方針を決める**という順序を、機械的に強制する。
 *
 * ## 何を見ているか
 *
 * 取り込み品は `src/components/ui/<name>.tsx`、Kedama 製は
 * `src/components/<Name>/` という配置が §2.1.5 で決まっている。
 * したがって「ui 配下のファイル名」と「Kedama 側のディレクトリ名」が
 * 大文字小文字を無視して一致したら、同じ役割の部品が2つある。
 *
 * ARIA role で判定しないのは、role が一致することは正常だからである
 * （Button と将来の IconButton はどちらも role=button、Card と Modal は
 * どちらも div）。役割の重複は role ではなく**名前**に出る。
 */

const COMPONENTS_DIR = resolve(__dirname, '../src/components');
const UI_DIR = resolve(COMPONENTS_DIR, 'ui');

/** Kedama 製コンポーネント（`src/components/<Name>/`） */
function kedamaComponentNames(): string[] {
  return readdirSync(COMPONENTS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== 'ui')
    .map((e) => e.name);
}

/** 取り込み品（`src/components/ui/<name>.tsx`。テストは除く） */
function importedComponentNames(): string[] {
  return readdirSync(UI_DIR, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.tsx') && !e.name.includes('.test.'))
    .map((e) => e.name.replace(/\.tsx$/, ''));
}

describe('コンポーネントの役割重複', () => {
  it('取り込み品と同名の Kedama コンポーネントが並存していない', () => {
    const kedama = kedamaComponentNames();
    const imported = importedComponentNames();

    const kedamaLower = new Map(kedama.map((n) => [n.toLowerCase(), n]));
    const collisions = imported
      .filter((n) => kedamaLower.has(n.toLowerCase()))
      .map(
        (n) => `src/components/ui/${n}.tsx ⇔ src/components/${kedamaLower.get(n.toLowerCase())}/`,
      );

    expect(
      collisions,
      [
        '同じ役割のコンポーネントが2つあります:',
        ...collisions.map((c) => `  - ${c}`),
        '',
        '取り込む前に統合方針を決めてから配置してください（仕様書 §2.1.5 /',
        'docs/q1-tier0-unification.md）。どちらを Tier 0 の正とするか、',
        '取り込み品を参照している箇所をどう差し替えるかを先に決めます。',
      ].join('\n'),
    ).toEqual([]);
  });

  it('取り込み品が、削除済みの ui/button.tsx を参照していない', () => {
    // 統合で ui/button.tsx は削除した。取り込み時に上流のままの import が
    // 紛れ込むと、存在しないファイルを指すか、2つ目の Button を復活させる。
    const offenders = importedComponentNames()
      .map((name) => ({
        name,
        src: readFileSync(resolve(UI_DIR, `${name}.tsx`), 'utf-8'),
      }))
      .filter(({ src }) => /from\s+["'][^"']*\/ui\/button["']/.test(src))
      .map(({ name }) => `src/components/ui/${name}.tsx`);

    expect(
      offenders,
      `Tier 0 の統合 Button（@/components/Button）を参照してください:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});
