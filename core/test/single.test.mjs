// 単一の HTML への取り込み（scripts/single-html.mjs）。README の手順が実際に動くこと。
// 完了前レビューの指摘2: import・export を外してただ連結すると、toast.js と drawer.js の const EXIT_GAP が重なって
// SyntaxError になる。モジュールごとにブロックへ入れるまとめ方なら、名前が重ならずに動く。
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { UI, read } from './helpers.mjs';
import {
  MODULE_ORDER,
  CSS_ORDER,
  buildSingleJs,
  buildSingleCss,
  buildSingleHtml,
} from '../scripts/single-html.mjs';

/** ui の各モジュールが export している名前（本物の ESM として読み込んで数える） */
async function realExports() {
  const out = {};
  for (const name of MODULE_ORDER) out[name] = Object.keys(await import(`../ui/${name}.js`)).sort();
  return out;
}

describe('単一の HTML への取り込み（scripts/single-html.mjs）', () => {
  it('ただ連結する手順は SyntaxError になる（README から外した理由）', () => {
    const naive = MODULE_ORDER.map((n) =>
      read(path.join(UI, `${n}.js`))
        .replace(/^\s*import\s.*$/gm, '')
        .replace(/^export /gm, ''),
    ).join('\n');
    assert.throws(() => new vm.Script(naive), /Identifier 'EXIT_GAP' has already been declared/);
  });

  it('まとめた JS は構文として正しく、ui の全モジュールを依存の順に含む', () => {
    const js = buildSingleJs();
    assert.doesNotThrow(() => new vm.Script(js, { filename: 'kedama-core.js' }));
    assert.doesNotMatch(js, /^\s*(import|export)\b/m, 'import・export が残っていない');
    const order = [...js.matchAll(/^\/\/ ---- ui\/([a-z]+)\.js ----$/gm)].map((m) => m[1]);
    assert.deepEqual(order, [...MODULE_ORDER]);
    const jsFiles = fs
      .readdirSync(UI)
      .filter((f) => f.endsWith('.js'))
      .map((f) => f.replace(/\.js$/, ''));
    assert.deepEqual([...MODULE_ORDER].sort(), jsFiles.sort(), 'ui の JS をすべて含む');
  });

  it('まとめた JS を動かすと globalThis.kedamaCore に、各モジュールの export がすべて同じ名前で入る', async () => {
    const ctx = vm.createContext({});
    vm.runInContext(buildSingleJs(), ctx);
    const core = ctx.kedamaCore;
    const real = await realExports();
    for (const [name, keys] of Object.entries(real)) {
      assert.deepEqual(Object.keys(core.modules[name]).sort(), keys, `${name}.js の export`);
      for (const k of keys) assert.ok(k in core, `kedamaCore.${k} が無い`);
    }
    // DOM に触らない部品は、そのまま呼んで本物と同じ答え
    const motion = await import('../ui/motion.js');
    const icons = await import('../ui/icons.js');
    const date = await import('../ui/dateinput.js');
    const step = { k: 170, c: 18, to: 10, dt: 0.016 };
    assert.deepEqual(
      { ...core.springStep({ x: 0, v: 0 }, step) },
      motion.springStep({ x: 0, v: 0 }, step),
    );
    assert.equal(core.statusIconMarkup('success'), icons.statusIconMarkup('success'));
    assert.equal(
      core.normalizeDateText('２０２６／９／８'),
      date.normalizeDateText('２０２６／９／８'),
    );
    assert.equal(typeof core.createToaster, 'function');
    assert.equal(typeof core.openDrawer, 'function');
    assert.equal(typeof core.attachShell, 'function', '外枠（0.2.0）');
    assert.deepEqual({ ...core.SHELL_MEDIA }, { ...(await import('../ui/shell.js')).SHELL_MEDIA });
  });

  it('まとめた HTML は CSS を読み込み順に中へ入れ、外のファイルを読まない', () => {
    const html = buildSingleHtml();
    const css = buildSingleCss();
    assert.ok(html.includes(css), 'tokens → base → components の CSS がそのまま入る');
    let at = 0;
    for (const n of CSS_ORDER) {
      const i = html.indexOf(read(path.join(UI, `${n}.css`)), at);
      assert.ok(i >= at, `${n}.css の順番`);
      at = i;
    }
    assert.ok(html.includes(buildSingleJs()));
    assert.doesNotMatch(
      html,
      /<link\b|<script[^>]+src=|\bimport\s*\(|\bfetch\s*\(|https?:\/\/(?!www\.w3\.org)/,
    );
    assert.match(html, /<html lang="ja">/);
  });
});
