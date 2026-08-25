import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Tier 2（レジストリ配布）と Tier 0（npm 配布）の境界を機械的に守る。
 *
 * ## なぜこれがあるのか
 *
 * 仕様書 §2.1 は配布方式を Tier で分けている。
 *
 * - **Tier 0** … npm。どのプロダクトでも挙動が完全に同一であるべき部分。
 *   バージョンで一元的に更新を配る
 * - **Tier 2** … shadcn レジストリ。「コピーしてプロダクトごとに手を入れる」
 *   ことを前提にした単位
 *
 * この2つは**前提が正反対**で、混ざると両方が壊れる。Tier 2 を npm に載せると、
 * 消費側が手を入れた部品をバージョン更新で上書きすることになる。逆に Tier 0 を
 * レジストリで配ると、本プロジェクトが解こうとしている「ずれ」が再発する。
 *
 * `src/index.ts` はワイルドカード export を使わない列挙式なので、うっかり
 * ブロックを足すことは起きにくい。ただし**起きたときに静かに通る**（型も通るし
 * 既存テストも落ちない）。ここで落とす。
 *
 * あわせて `registry.json` が実体と食い違っていないかも見る。レジストリの
 * 定義ファイルはビルドの一部ではないため、ファイルを消しても改名しても
 * 気づけるのは配布した後になる。
 */

const ROOT = resolve(__dirname, '..');
const BLOCKS_DIR = resolve(ROOT, 'src/blocks');
const REGISTRY_PATH = resolve(ROOT, 'registry.json');

interface RegistryFile {
  path: string;
  type: string;
  target?: string;
}

interface RegistryItem {
  name: string;
  type: string;
  title?: string;
  description?: string;
  dependencies?: string[];
  files: RegistryFile[];
}

interface Registry {
  name: string;
  items: RegistryItem[];
}

const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8')) as Registry;

/** ブロック配下の実装ファイル（テストは除く） */
function blockSourceFiles(): string[] {
  const found: string[] = [];
  for (const block of readdirSync(BLOCKS_DIR, { withFileTypes: true })) {
    if (!block.isDirectory()) continue;
    for (const entry of readdirSync(resolve(BLOCKS_DIR, block.name), { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      if (!/\.tsx?$/.test(entry.name)) continue;
      if (entry.name.includes('.test.')) continue;
      found.push(`src/blocks/${block.name}/${entry.name}`);
    }
  }
  return found.sort();
}

describe('Tier 2 の配布境界', () => {
  it('src/index.ts が src/blocks/ を参照していない（npm では配らない）', () => {
    const index = readFileSync(resolve(ROOT, 'src/index.ts'), 'utf-8');

    expect(
      /from\s+['"][^'"]*blocks\//.test(index),
      [
        'src/index.ts が Tier 2 ブロックを export しています。',
        '',
        'Tier 2 の配布は npm ではなく shadcn レジストリです（仕様書 §2.1）。',
        '「コピーして手を入れる」前提の部品を npm に載せると、消費側の改変を',
        'バージョン更新で上書きすることになります。registry.json に足してください。',
      ].join('\n'),
    ).toBe(false);
  });

  it('ブロックは Tier 0 を公開 API 経由でだけ使う（深い import をしない）', () => {
    const offenders: string[] = [];

    for (const file of blockSourceFiles()) {
      const src = readFileSync(resolve(ROOT, file), 'utf-8');
      // `@/components/...` や `../../components/...` のような深い import
      const deep = src.match(/from\s+['"](?:@\/|\.\.\/\.\.\/)[^'"]+['"]/g);
      if (deep) offenders.push(`${file}: ${deep.join(', ')}`);
    }

    expect(
      offenders,
      [
        'Tier 2 ブロックが Tier 0 の内部を直接参照しています:',
        ...offenders.map((o) => `  - ${o}`),
        '',
        'レジストリでコピーされた先に src/ は存在しません。',
        '`@kedama-design/design-system` から import してください。',
        'そこに無いものは、Tier 0 側に足すか、ブロックの中で完結させます。',
      ].join('\n'),
    ).toEqual([]);
  });

  it('registry.json に載っているファイルがすべて実在する', () => {
    const missing = registry.items
      .flatMap((item) => item.files.map((f) => ({ item: item.name, path: f.path })))
      .filter(({ path }) => !existsSync(resolve(ROOT, path)))
      .map(({ item, path }) => `${item}: ${path}`);

    expect(
      missing,
      `registry.json が存在しないファイルを指しています:\n${missing.join('\n')}`,
    ).toEqual([]);
  });

  it('ブロックの実装ファイルがすべて registry.json に載っている', () => {
    const listed = new Set(registry.items.flatMap((item) => item.files.map((f) => f.path)));
    const unlisted = blockSourceFiles().filter((f) => !listed.has(f));

    expect(
      unlisted,
      [
        'registry.json に載っていないブロックのファイルがあります:',
        ...unlisted.map((f) => `  - ${f}`),
        '',
        'レジストリ経由でコピーされないので、消費側で import が壊れます。',
      ].join('\n'),
    ).toEqual([]);
  });

  it('app-shell は §4.5 の部品を1つのアイテムにまとめている', () => {
    const appShell = registry.items.find((item) => item.name === 'app-shell');
    expect(appShell, 'registry.json に app-shell がありません').toBeDefined();
    expect(appShell!.type).toBe('registry:block');

    const basenames = appShell!.files.map((f) => f.path.split('/').pop());
    for (const required of [
      'AppShell.tsx',
      'AuthShell.tsx',
      'AppTitleBar.tsx',
      'SidebarNav.tsx',
      'IconRail.tsx',
      'AppHeader.tsx',
      'StatusBar.tsx',
      'RightPane.tsx',
    ]) {
      expect(basenames, `${required} が app-shell に含まれていません（§4.5）`).toContain(required);
    }
  });

  it('app-shell は Tier 0 を npm 依存として宣言している', () => {
    const appShell = registry.items.find((item) => item.name === 'app-shell')!;
    expect(appShell.dependencies ?? []).toContain('@kedama-design/design-system');
  });

  it('data-table は独立した block として TanStack Table v8 を固定する', () => {
    const dataTable = registry.items.find((item) => item.name === 'data-table');
    expect(dataTable, 'registry.json に data-table がありません').toBeDefined();
    expect(dataTable!.type).toBe('registry:block');
    expect(dataTable!.dependencies ?? []).toEqual([
      '@kedama-design/design-system',
      '@tanstack/react-table@8.21.3',
    ]);
    expect(dataTable!.files.map((file) => file.path.split('/').pop())).toEqual([
      'DataTable.tsx',
      'index.ts',
    ]);
  });

  it('command-palette は独立した block として cmdk を固定する', () => {
    const commandPalette = registry.items.find((item) => item.name === 'command-palette');
    expect(commandPalette, 'registry.json に command-palette がありません').toBeDefined();
    expect(commandPalette!.type).toBe('registry:block');
    expect(commandPalette!.dependencies ?? []).toEqual([
      '@kedama-design/design-system',
      'cmdk@1.1.1',
    ]);
    expect(commandPalette!.files.map((file) => file.path.split('/').pop())).toEqual([
      'CommandPalette.tsx',
      'index.ts',
    ]);
  });
});
