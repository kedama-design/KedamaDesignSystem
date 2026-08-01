import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { themes } from '../src/tokens/semantic/colors';
import { contrastRatio, pick } from './contrastCases';

/**
 * `dark:` バリアントの網羅検証
 *
 * 取り込んだ shadcn コンポーネントは `dark:border-input` のように
 * Tailwind の dark バリアントを使う。Kedama のテーマ切替は [data-theme]
 * 属性方式なので、tailwind.css で @custom-variant dark を再定義している。
 *
 * この方式はセレクタ列挙なので、dark 系テーマを増やしたときに更新を
 * 忘れると**静かに壊れる**（暗い地の上に Light 前提のスタイルが残る）。
 * 規約ではなくテストで担保する。コントラストをテーブル駆動にしたのと
 * 同じ考え方。
 *
 * テーマ名の文字列一致では判定しない。将来 `midnight` のような名前の
 * 暗いテーマが増えたときに取りこぼすため、**実際の背景の明るさ**から
 * dark 系を判定する。
 */

const TAILWIND_CSS = resolve(__dirname, '../src/styles/tailwind.css');

/** 明度の基準点としてのみ使う。パレットの色ではない（Kedama は純白を持たない） */
const WHITE = '#FFFFFF';

/**
 * テーマが dark 系か。
 *
 * bg.page が白に対して 4.5:1 以上のコントラストを持つなら、その面の上では
 * 白い文字が本文として読める＝十分に暗い、と判定する。閾値を WCAG 1.4.3 の
 * 本文基準に合わせているのは、恣意的な明度カットオフを置かないため。
 */
function isDarkFamily(themeName: string): boolean {
  const page = pick(themes[themeName as keyof typeof themes], 'bg.page');
  return contrastRatio(page, WHITE) >= 4.5;
}

/** tailwind.css から @custom-variant dark の宣言を取り出す */
function readDarkVariantDeclaration(): string {
  const css = readFileSync(TAILWIND_CSS, 'utf-8');
  const match = css.match(/@custom-variant\s+dark\s*\(([\s\S]*?)\);/);
  if (!match) {
    throw new Error(
      'tailwind.css に @custom-variant dark の宣言が見つかりません。' +
        'Tailwind 既定の .dark クラス方式のままだと、[data-theme] による ' +
        'テーマ切替で dark: が発火しません。',
    );
  }
  return match[1];
}

describe('dark バリアント', () => {
  const declaration = readDarkVariantDeclaration();
  const themeNames = Object.keys(themes);
  const darkFamily = themeNames.filter(isDarkFamily);
  const lightFamily = themeNames.filter((n) => !isDarkFamily(n));

  it('dark 系テーマが少なくとも1つ存在する（判定関数の健全性）', () => {
    // 0 だと以下の網羅テストが空回りして無意味になる
    expect(darkFamily.length).toBeGreaterThan(0);
  });

  it('light 系テーマが少なくとも1つ存在する（判定関数の健全性）', () => {
    expect(lightFamily.length).toBeGreaterThan(0);
  });

  it.each(darkFamily)('dark 系の %s で dark: が発火する', (themeName) => {
    expect(declaration).toContain(`[data-theme='${themeName}']`);
  });

  it.each(lightFamily)('light 系の %s では dark: が発火しない', (themeName) => {
    expect(declaration).not.toContain(`[data-theme='${themeName}']`);
  });

  it('子孫要素にも適用される', () => {
    // [data-theme] は <html> に付くため、子孫セレクタが無いと
    // ルート要素自身にしか dark: が効かない
    for (const themeName of darkFamily) {
      expect(declaration).toContain(`[data-theme='${themeName}'] *`);
    }
  });

  it('宣言に含まれるテーマ名がすべて実在する', () => {
    // 削除・改名されたテーマ名が宣言に残っていないことを確認する
    const declared = [...declaration.matchAll(/\[data-theme='([^']+)'\]/g)].map((m) => m[1]);
    for (const name of new Set(declared)) {
      expect(themeNames).toContain(name);
    }
  });
});
