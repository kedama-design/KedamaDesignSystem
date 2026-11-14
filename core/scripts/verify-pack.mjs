// 配布物からの確認（npm run verify:pack）。公開はしない（npm pack でローカルに tarball を作るだけ）。
//  1) npm pack の tarball を一時ディレクトリに展開する
//  2) 中身が配る物だけであること（ui・tokens.json・icons・README・LICENSE・package.json）
//  3) package.json の exports の行き先がすべて tarball の中にあること
//  4) tarball の中身だけを node_modules/@kedama-design/core に置き、パッケージ名で import できること
//     （JS は実際に読み込み、DOM に触らない motion・icons・dateinput は呼んでみる。toast・drawer は読み込めることだけ。
//       CSS・JSON・SVG は import.meta.resolve で行き先が解決できること）
// 依存は使わない（node の標準と、npm・tar のコマンドだけ）。
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const CORE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = (line) => process.stdout.write(`${line}\n`);
const failures = [];
const check = (ok, label) => {
  out(`${ok ? 'ok  ' : 'FAIL'} ${label}`);
  if (!ok) failures.push(label);
};

function listFiles(dir, base = dir) {
  const files = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...listFiles(p, base));
    else files.push(path.relative(base, p).split(path.sep).join('/'));
  }
  return files.sort();
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kedama-core-pack-'));
const packJson = JSON.parse(
  execFileSync('npm', ['pack', '--json', '--pack-destination', tmp], {
    cwd: CORE,
    encoding: 'utf8',
  }),
);
const tarball = path.join(tmp, packJson[0].filename);
out(`tarball: ${tarball}（${packJson[0].entryCount} files, ${packJson[0].size} bytes）`);

const extract = path.join(tmp, 'extract');
fs.mkdirSync(extract);
execFileSync('tar', ['-xzf', tarball, '-C', extract]);
const pkgDir = path.join(extract, 'package');
const pkg = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));
const inside = listFiles(pkgDir);

// 2) 中身
const allowed = (rel) =>
  ['package.json', 'README.md', 'LICENSE', 'guidelines/tokens/tokens.json'].includes(rel) ||
  /^ui\/[a-z]+\.(css|js)$/.test(rel) ||
  /^guidelines\/icons\/[a-z-]+\.svg$/.test(rel);
const extra = inside.filter((rel) => !allowed(rel));
check(extra.length === 0, `配る物だけ（余分: ${extra.join(', ') || 'なし'}）`);
check(inside.filter((rel) => rel.startsWith('ui/')).length === 8, 'ui の8ファイルが入っている');
check(
  inside.filter((rel) => rel.startsWith('guidelines/icons/')).length === 8,
  'アイコン8つが入っている',
);

// 3) exports の行き先
for (const [key, target] of Object.entries(pkg.exports)) {
  check(fs.existsSync(path.join(pkgDir, target)), `exports ${key} → ${target} が tarball にある`);
}

// 4) パッケージ名で取り込む
const consumer = path.join(tmp, 'consumer');
const installed = path.join(consumer, 'node_modules', '@kedama-design', 'core');
fs.mkdirSync(path.dirname(installed), { recursive: true });
fs.cpSync(pkgDir, installed, { recursive: true });
fs.writeFileSync(path.join(consumer, 'package.json'), '{ "type": "module", "private": true }\n');
const keys = Object.keys(pkg.exports).filter((k) => k !== './package.json');
const probe = `
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const results = [];
const ok = (cond, label) => results.push([Boolean(cond), label]);
const motion = await import('@kedama-design/core/motion.js');
const s = motion.springStep({ x: 0, v: 0 }, { k: 170, c: 18, to: 10, dt: 0.016 });
ok(s.x > 0 && s.v > 0, 'motion.js を名前で読み、springStep が動く');
const icons = await import('@kedama-design/core/icons.js');
ok(icons.statusIconMarkup('success').startsWith('<svg class="tsk-icon tsk-icon--success"'), 'icons.js を名前で読み、statusIconMarkup が動く');
const date = await import('@kedama-design/core/dateinput.js');
ok(date.normalizeDateText('2026/9/8') === '2026-09-08', 'dateinput.js を名前で読み、normalizeDateText が動く');
const toast = await import('@kedama-design/core/toast.js');
ok(typeof toast.createToaster === 'function', 'toast.js を名前で読める（相対 import の motion.js・icons.js も解決）');
const drawer = await import('@kedama-design/core/drawer.js');
ok(typeof drawer.openDrawer === 'function', 'drawer.js を名前で読める（相対 import の motion.js・icons.js も解決）');
for (const key of ${JSON.stringify(keys)}) {
  const spec = '@kedama-design/core' + key.slice(1);
  const url = import.meta.resolve(spec);
  ok(url.includes('/node_modules/@kedama-design/core/') && fs.existsSync(fileURLToPath(url)), 'import.meta.resolve(' + spec + ') が tarball の中のファイル');
}
process.stdout.write(JSON.stringify(results));
`;
fs.writeFileSync(path.join(consumer, 'probe.mjs'), probe);
const results = JSON.parse(
  execFileSync(process.execPath, ['probe.mjs'], { cwd: consumer, encoding: 'utf8' }),
);
for (const [ok, label] of results) check(ok, label);

if (failures.length === 0) {
  fs.rmSync(tmp, { recursive: true, force: true });
  out(`\nすべて通った。一時ディレクトリは消した`);
} else {
  out(`\n${failures.length} 件が通らない。調べるために一時ディレクトリを残した: ${tmp}`);
  process.exit(1);
}
