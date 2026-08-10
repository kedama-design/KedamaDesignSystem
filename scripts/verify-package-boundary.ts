import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Tier 2 が Tier 0 の npm 配布物へ混入していないことを、実際の dist で確認する。
 *
 * `src/index.ts` と dts の境界だけでは不十分だった。`public/r` を生成した状態で
 * Vite を実行すると、既定の publicDir コピーにより、ブロックのソース本文を含む
 * `dist/r/*.json` が tarball へ入ることを `pnpm pack` で実測している。
 */

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');

if (!existsSync(dist)) {
  throw new Error('dist がありません。pnpm build の Vite ビルド後に実行してください。');
}

const forbiddenDirectories = [
  { path: resolve(dist, 'r'), reason: 'レジストリ生成物' },
  { path: resolve(dist, 'src/blocks'), reason: 'Tier 2 の型宣言' },
];

const found = forbiddenDirectories
  .filter(({ path }) => existsSync(path))
  .map(({ path, reason }) => {
    const entries = readdirSync(path, { recursive: true });
    return `${reason}: ${path}\n${entries.map((entry) => `  - ${String(entry)}`).join('\n')}`;
  });

if (found.length > 0) {
  throw new Error(
    [
      'Tier 2 が npm 配布用の dist に混入しています。',
      '',
      ...found,
      '',
      'Tier 2 は registry:block だけで配り、package.json の files=["dist"] には含めません。',
    ].join('\n'),
  );
}

console.log('Tier 2 package boundary: clean');
