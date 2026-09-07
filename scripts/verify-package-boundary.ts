import { existsSync, readdirSync, readFileSync } from 'node:fs';
import ts from 'typescript';
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

/*
 * ─── `use client` ディレクティブの検証 ──────────────────────
 *
 * Rollup はバンドル時にモジュール先頭のディレクティブを落とす。root entry は
 * Provider・hooks を含むので、失われたまま配ると Next.js App Router の
 * **Server Component** から import した時点で production build が落ちる
 * （すらすらスタジオで実測: TypeError: O.createContext is not a function）。
 *
 * `vite.config.ts` の Rollup `banner` が entry 名で出し分けているが、
 * ビルド設定は静かに壊れうるので、実際の dist を読んで確かめる。
 *
 * tokens entry は値だけで React に依存しない。Server Component から読める
 * 状態を保つため、**付いていないこと**も同時に検証する。
 */

/**
 * ディレクティブプロローグに `use client` があるか。
 *
 * 「先頭に文字列が出てくるか」ではなく「**ディレクティブとして有効な位置**に
 * あるか」を見る。判定は TypeScript の AST で行う（既存の devDependency）。
 *
 * ## 正規表現をやめた理由
 *
 * 当初は自前の正規表現で読み進めていたが、末尾のセミコロンを省略可能にしていたため
 * `"use client" + value;` の**左辺だけ**にマッチし、ディレクティブと誤認していた。
 * 文字列の並びを「文」として扱えるのはパーサだけなので AST に委ねる。
 *
 * ## 判定
 *
 * ディレクティブプロローグ ＝ SourceFile の先頭から続く
 * 「式が**文字列リテラルそのもの**である ExpressionStatement」の並び。
 * それ以外の文が現れた時点でプロローグは終わる。
 *
 * したがって次はいずれも false になる:
 *   `"use client" + value;`          → 式が BinaryExpression
 *   `const value = 1; "use client";` → 先頭が VariableStatement
 *   `("use client");`                → 式が ParenthesizedExpression
 *
 * `"use strict";` が先行しても（CJS 出力が実際にそうなる）その後ろの
 * `use client` は有効なので true になる。
 *
 * 比較は**ソース上の綴り**で行う。ECMAScript のディレクティブ照合はエスケープを
 * 解釈しないため、エスケープで綴った文字列はディレクティブにならない。
 */
function hasUseClientDirective(source: string): boolean {
  const sourceFile = ts.createSourceFile(
    'dist-entry.js',
    source,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ false,
    ts.ScriptKind.JS,
  );

  for (const statement of sourceFile.statements) {
    if (!ts.isExpressionStatement(statement)) return false; // プロローグの終わり
    const { expression } = statement;
    if (!ts.isStringLiteral(expression)) return false; // 文字列リテラル「そのもの」でない
    // 引用符を含む生の綴りで比較する（エスケープを解釈しない）。
    if (/^(['"])use client\1$/.test(expression.getText(sourceFile))) return true;
  }
  return false;
}

const directiveExpectations = [
  { file: 'index.js', format: 'ESM', shouldHave: true },
  { file: 'index.cjs', format: 'CJS', shouldHave: true },
  { file: 'tokens.js', format: 'ESM', shouldHave: false },
  { file: 'tokens.cjs', format: 'CJS', shouldHave: false },
] as const;

const directiveProblems = directiveExpectations.flatMap(({ file, format, shouldHave }) => {
  const path = resolve(dist, file);
  if (!existsSync(path)) {
    return [`${file}: 配布物がありません（${format} entry）`];
  }
  // ディレクティブはプロローグにしか置けないので、先頭だけ読めば足りる。
  const head = readFileSync(path, 'utf8').slice(0, 4096);
  const actual = hasUseClientDirective(head);
  if (actual === shouldHave) return [];
  return shouldHave
    ? [
        `${file} (${format} root entry): "use client" ディレクティブがありません。`,
        '  Server Component から import すると Next.js の build が落ちます。',
        '  vite.config.ts の rollupOptions.output.banner を確認してください。',
      ]
    : [
        `${file} (${format} tokens entry): "use client" ディレクティブが付いています。`,
        '  tokens は値だけで React に依存しません。付けると Server Component から',
        '  読めなくなります。banner の entry 名による出し分けを確認してください。',
      ];
});

if (directiveProblems.length > 0) {
  throw new Error(
    ['配布物の "use client" 境界が壊れています。', '', ...directiveProblems].join('\n'),
  );
}

console.log('"use client" directive: root entry あり / tokens entry なし');
