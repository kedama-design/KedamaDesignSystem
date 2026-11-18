// 単一の HTML（オフライン版など）に取り込むための、1つにまとめた JS と HTML を作る。依存は使わない（node の標準だけ）。
//
//   node scripts/single-html.mjs js   > kedama-core.js    … ui の JS を1つにまとめた JS（<script> にそのまま貼れる）
//   node scripts/single-html.mjs html > kedama-core.html  … CSS と上の JS を入れた、1つで動く見本の HTML
//
// まとめ方（ui の JS の中身は変えない）:
//   - 各モジュールの中身を、それぞれ別のブロック { … } に入れる（モジュールの中だけの名前が、ほかと重ならない。
//     例: toast.js と drawer.js はどちらも const EXIT_GAP を持つので、ただ連結すると SyntaxError になる）
//   - import { a, b } from './x.js'; の行は、const { a, b } = modules.x; に置き換える（依存の順に並べる）
//   - export の語を外し、ブロックの最後で、そのモジュールが export していた名前を modules.<名前> に入れる
//   - 全体を 'use strict' の関数で包み、最後に globalThis.kedamaCore（export した名前をすべて持つ）を作る
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const CORE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UI = path.join(CORE, 'ui');

/** 依存の順（読まれる側が先） */
export const MODULE_ORDER = Object.freeze([
  'motion',
  'icons',
  'dateinput',
  'toast',
  'drawer',
  'shell',
]);
/** CSS の読み込み順 */
export const CSS_ORDER = Object.freeze(['tokens', 'base', 'components', 'shell']);

const IMPORT_LINE = /^import\s*\{([^}]*)\}\s*from\s*'\.\/([a-z]+)\.js';[ \t]*$/gm;
const EXPORT_DECL = /^export (const|function|let|class) ([A-Za-z_$][\w$]*)/gm;

/** 1つのモジュールを、ブロックに入れた文字列にする */
function wrapModule(name, source, defined) {
  let body = source.replace(IMPORT_LINE, (_line, names, from) => {
    if (!defined.has(from)) throw new Error(`${name}.js が読む ${from}.js が先に並んでいない`);
    return `const {${names}} = modules.${from};`;
  });
  if (/^\s*import\b/m.test(body)) throw new Error(`${name}.js に置き換えられない import がある`);
  const exported = [];
  body = body.replace(EXPORT_DECL, (_m, kind, id) => {
    exported.push(id);
    return `${kind} ${id}`;
  });
  if (/^\s*export\b/m.test(body)) throw new Error(`${name}.js に置き換えられない export がある`);
  return {
    exported,
    text: `// ---- ui/${name}.js ----\n{\n${body.trimEnd()}\nmodules.${name} = Object.freeze({ ${exported.join(', ')} });\n}\n`,
  };
}

/** ui の JS を1つにまとめた JS（classic の <script> でも type="module" の <script> でも動く） */
export function buildSingleJs({ uiDir = UI } = {}) {
  const defined = new Set();
  const seen = new Map();
  const parts = [];
  for (const name of MODULE_ORDER) {
    const { exported, text } = wrapModule(
      name,
      fs.readFileSync(path.join(uiDir, `${name}.js`), 'utf8'),
      defined,
    );
    for (const id of exported) {
      if (seen.has(id))
        throw new Error(`export の名前 ${id} が ${seen.get(id)}.js と ${name}.js で重なる`);
      seen.set(id, name);
    }
    defined.add(name);
    parts.push(text);
  }
  return [
    '/* @kedama-design/core — ui の JS を1つにまとめたもの（scripts/single-html.mjs が作る。手で直さない） */',
    '/* SPDX-License-Identifier: Apache-2.0 */',
    '(() => {',
    "'use strict';",
    'const modules = {};',
    ...parts,
    'globalThis.kedamaCore = Object.freeze(Object.assign({ modules: Object.freeze(modules) }, ...Object.values(modules)));',
    '})();',
    '',
  ].join('\n');
}

/** CSS を読み込み順に並べたもの */
export function buildSingleCss({ uiDir = UI } = {}) {
  return CSS_ORDER.map((n) => fs.readFileSync(path.join(uiDir, `${n}.css`), 'utf8')).join('\n');
}

const DEMO_BODY = `
<main style="display:flex;flex-direction:column;gap:var(--ui-space-4);max-width:720px;margin:var(--ui-space-8) auto;padding:0 var(--ui-page-pad-x)">
  <h1 style="margin:0;font-size:var(--ui-font-size-2xl)">@kedama-design/core 単一の HTML の見本</h1>
  <p class="tsk-field__help">この1ファイルだけで動く（外のファイル・ネットワークを読まない）。</p>
  <div style="display:flex;gap:var(--ui-space-2);flex-wrap:wrap">
    <button class="tsk-btn tsk-btn--primary" type="button" id="toast">トーストを出す</button>
    <button class="tsk-btn" type="button" id="drawer">ドロワーを開く</button>
  </div>
  <div class="tsk-field">
    <label class="tsk-field__label" for="date">日付</label>
    <input class="tsk-input" id="date" value="2026/9/8" />
    <p class="tsk-field__help" id="date-help"></p>
  </div>
  <div id="status" style="display:flex;gap:var(--ui-space-4);flex-wrap:wrap"></div>
</main>`;

const DEMO_SCRIPT = `
const { createToaster, openDrawer, normalizeDateText, statusIconNode, STATUS_KINDS, STATUS_ICONS } = globalThis.kedamaCore;
const toaster = createToaster();
document.getElementById('toast').addEventListener('click', () => toaster.show({ kind: 'success', title: '保存しました' }));
document.getElementById('drawer').addEventListener('click', (e) =>
  openDrawer({ title: '詳細', badge: '見本', note: '閉じると元のボタンへ戻る', opener: e.currentTarget, body: (el) => el.append('ドロワーの本文') }));
const date = document.getElementById('date');
const showDate = () => { document.getElementById('date-help').textContent = '読んだ値: ' + (normalizeDateText(date.value) ?? '読めない'); };
date.addEventListener('input', showDate);
showDate();
for (const kind of STATUS_KINDS) {
  const s = document.createElement('span');
  s.className = 'tsk-status tsk-status--' + kind;
  s.append(statusIconNode(document, kind, { decorative: true }), STATUS_ICONS[kind].label);
  document.getElementById('status').append(s);
}
window.__singleReady = true;`;

/** CSS と JS を中に入れた、1つで動く HTML（body・script を渡せば見本の代わりにそれを入れる） */
export function buildSingleHtml({
  uiDir = UI,
  title = '@kedama-design/core',
  body = DEMO_BODY,
  script = DEMO_SCRIPT,
} = {}) {
  const js = buildSingleJs({ uiDir });
  if (/<\/script/i.test(js + script))
    throw new Error('JS の中に </script> がある（HTML に入れられない）');
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>
${buildSingleCss({ uiDir })}
</style>
</head>
<body>
${body}
<script>
${js}</script>
<script>
${script}
</script>
</body>
</html>
`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mode = process.argv[2];
  if (mode === 'js') process.stdout.write(buildSingleJs());
  else if (mode === 'html') process.stdout.write(buildSingleHtml());
  else {
    process.stderr.write('使い方: node scripts/single-html.mjs js|html > 出力先\n');
    process.exit(2);
  }
}
