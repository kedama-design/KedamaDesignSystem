// パッケージの形（core/package.json・LICENSE・各ファイルのライセンス表示）。
// 配布物（npm pack の中身）からの確認は scripts/verify-pack.mjs（npm run verify:pack）が行う。
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { CORE, UI, read } from './helpers.mjs';

const pkg = () => JSON.parse(read(path.join(CORE, 'package.json')));

/** files の1行（ディレクトリは末尾の /）に、そのパスが入るか */
const coveredByFiles = (files, rel) =>
  files.some((f) => (f.endsWith('/') ? rel.startsWith(f) : rel === f)) || rel === 'package.json';

describe('パッケージの形（core/package.json）', () => {
  it('名前・ライセンス・ESM・公開先（この段では公開しない。設定だけ）', () => {
    const p = pkg();
    assert.equal(p.name, '@kedama-design/core');
    assert.equal(p.license, 'Apache-2.0');
    assert.equal(p.type, 'module');
    assert.deepEqual(p.publishConfig, { registry: 'https://registry.npmjs.org', access: 'public' });
    assert.deepEqual(p.sideEffects, ['*.css']);
  });

  it('実行時・開発時の依存を持たない（node の標準だけで動く）', () => {
    const p = pkg();
    for (const k of [
      'dependencies',
      'devDependencies',
      'peerDependencies',
      'optionalDependencies',
      'bundleDependencies',
      'bundledDependencies',
    ]) {
      assert.ok(!(k in p) || Object.keys(p[k]).length === 0, `${k} がある`);
    }
  });

  it('exports の行き先はすべて実在し、files に入る', () => {
    const p = pkg();
    const targets = Object.values(p.exports);
    assert.ok(targets.length >= 18, `exports が少なすぎる（${targets.length}）`);
    for (const t of targets) {
      assert.equal(typeof t, 'string', '行き先は文字列（条件分けをしない）');
      assert.ok(t.startsWith('./'), t);
      const rel = t.slice(2);
      assert.ok(fs.existsSync(path.join(CORE, rel)), `${t} が無い`);
      assert.ok(coveredByFiles(p.files, rel), `${t} が files に入っていない（配布物に無い）`);
    }
  });

  it('ui のファイルとアイコンはすべて exports に載っている（配るのに取り込めないものが無い）', () => {
    const targets = new Set(Object.values(pkg().exports));
    for (const f of fs.readdirSync(UI))
      assert.ok(targets.has(`./ui/${f}`), `ui/${f} が exports に無い`);
    for (const f of fs.readdirSync(path.join(CORE, 'guidelines', 'icons')))
      assert.ok(targets.has(`./guidelines/icons/${f}`), `icons/${f} が exports に無い`);
  });

  it('files は配る物だけ（ガイドラインの文書・画像・見本・テストは配らない）', () => {
    // npm は README をどのフォルダでも必ず入れるので、ガイドラインの README（社内向けの記述）は ! で外す
    assert.deepEqual(pkg().files, [
      'ui/',
      'guidelines/tokens/tokens.json',
      'guidelines/icons/',
      '!guidelines/README.md',
      'README.md',
      'LICENSE',
    ]);
  });

  it('test は node --test で、対象を *.test.mjs に限る（補助のファイルを走らせない）', () => {
    assert.equal(pkg().scripts.test, 'node --test test/*.test.mjs');
  });
});

describe('ライセンス', () => {
  it('LICENSE は Apache License 2.0 の全文（付録まで）', () => {
    const text = read(path.join(CORE, 'LICENSE'));
    assert.match(text, /Apache License\s+Version 2\.0, January 2004/);
    assert.match(text, /END OF TERMS AND CONDITIONS/);
    assert.match(text, /APPENDIX: How to apply the Apache License to your work\./);
    assert.ok(text.split('\n').length >= 200, '全文ではない');
  });

  it('ui の CSS・JS は1行目に SPDX のライセンス表示を持つ', () => {
    for (const f of fs.readdirSync(UI)) {
      const first = read(path.join(UI, f)).split('\n')[0];
      const want = f.endsWith('.css')
        ? '/* SPDX-License-Identifier: Apache-2.0 */'
        : '// SPDX-License-Identifier: Apache-2.0';
      assert.equal(first, want, `ui/${f}`);
    }
  });

  it('著作権表示は README のライセンスの節の1か所だけ（2026-11-14 yuuki）。各ファイルは SPDX の1行だけ。NOTICE は作らない', () => {
    const COPYRIGHT = 'Copyright 2026 Kedama Design';
    const readme = read(path.join(CORE, 'README.md'));
    assert.equal(readme.split(COPYRIGHT).length - 1, 1, 'README に1回だけ');
    assert.match(readme, new RegExp(`## ライセンス\\n\\n${COPYRIGHT}\\n`), 'ライセンスの節にある');
    for (const f of fs.readdirSync(UI))
      assert.ok(!read(path.join(UI, f)).includes('Copyright'), `ui/${f} に著作権表示を書かない`);
    assert.doesNotMatch(readme, /著作権表示は未決/);
    assert.ok(
      !fs.existsSync(path.join(CORE, 'NOTICE')),
      'NOTICE は作らない（移した元に第三者の NOTICE が無い）',
    );
  });
});
