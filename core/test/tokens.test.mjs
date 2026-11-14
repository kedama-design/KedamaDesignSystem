// 共有の値（ui/tokens.css）が、正である core/guidelines/tokens/tokens.json（と同じ値の tokens.css）と同じであること。
// 値は両方のファイルを読んで比べる（テストに値を書き写さない）。
// 移した元: 登記議事録つくるさん _dev/test/uitokens.test.mjs（考え方はそのまま。正の置き場所と、純白・hover/active の決め方を足した）
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  CORE,
  UI,
  GUIDE,
  read,
  stripComments,
  norm,
  ourTokens,
  guideCssBlocks,
  guideJson,
  jsonChecks,
  jsonLeaves,
  jsonMismatches,
  JSON_LEAVES_ELSEWHERE,
  DERIVED,
  DERIVED_NAMES,
  PRODUCT_ONLY,
  isWhite,
  cssDeclarations,
  jsonColorValues,
  svgPaintValues,
} from './helpers.mjs';

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

describe('ガイドラインの写し（core/guidelines）', () => {
  const src = JSON.parse(read(path.join(GUIDE, 'SOURCE.json')));
  const sha = (rel) =>
    crypto
      .createHash('sha256')
      .update(fs.readFileSync(path.join(GUIDE, rel)))
      .digest('hex');

  it('写したファイルの一覧は SOURCE.json の files と同じ（足りない・余分が無い）', () => {
    const have = walk(GUIDE)
      .map((p) => path.relative(GUIDE, p).split(path.sep).join('/'))
      .filter((rel) => rel !== 'SOURCE.json')
      .sort();
    assert.deepEqual(have, Object.keys(src.files).sort());
    assert.ok(have.length >= 25, `写したファイルが少なすぎる（${have.length}）`);
  });

  it('直していないファイルは写した元と同じ（SOURCE.json の sha256）', () => {
    for (const [rel, want] of Object.entries(src.files)) {
      if (Object.hasOwn(src.modified, rel)) continue;
      assert.equal(
        sha(rel),
        want,
        `guidelines/${rel} が写したときと違う（直したなら modified に理由を書く）`,
      );
    }
  });

  it('直したファイル（modified）は理由があり、実際に元と違う', () => {
    for (const [rel, why] of Object.entries(src.modified)) {
      assert.ok(Object.hasOwn(src.files, rel), `modified の ${rel} が files に無い`);
      assert.ok(String(why).trim().length >= 10, `${rel} の理由が短い`);
      assert.notEqual(sha(rel), src.files[rel], `${rel} は元と同じなのに modified に載っている`);
    }
  });

  it('直したファイルのいまの sha256 は SOURCE.json の modifiedSha256 と同じ（記録のあとに黙って変えていない）', () => {
    assert.deepEqual(Object.keys(src.modifiedSha256).sort(), Object.keys(src.modified).sort());
    for (const [rel, want] of Object.entries(src.modifiedSha256))
      assert.equal(sha(rel), want, `guidelines/${rel} が記録（modifiedSha256）と違う`);
  });

  it('色を直したアイコン2つは来歴情報（C2PA）を持たず、ほかの6つは元のまま持つ（2026-11-14 yuuki）', () => {
    const dir = path.join(GUIDE, 'icons');
    const stripped = ['status-approved.svg', 'publish-failed.svg'];
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.svg'))) {
      const svg = read(path.join(dir, f));
      if (stripped.includes(f)) {
        assert.doesNotMatch(svg, /<metadata|c2pa/i, `${f} に来歴情報が残っている`);
        assert.match(svg, /^<svg [^>]*role="img"[^>]*aria-label="[^"]+"/, `${f} の名前が消えた`);
      } else {
        assert.match(svg, /<metadata><c2pa:manifest>/, `${f} の来歴情報が無い`);
        assert.equal(sha(`icons/${f}`), src.files[`icons/${f}`], `${f} が元と違う`);
      }
    }
  });

  it('ガイドラインの tokens.css は --ui- の :root 1つだけ（他の部品集向けの上書き案を持たない）', () => {
    const css = read(path.join(GUIDE, 'tokens', 'tokens.css'));
    const blocks = guideCssBlocks();
    assert.equal(blocks.length, 1);
    for (const name of blocks[0].keys()) assert.ok(name.startsWith('--ui-'), name);
    assert.doesNotMatch(stripComments(css), /--color-/);
    assert.doesNotMatch(css, /sparkle/i);
  });
});

describe('共有の値（ui/tokens.css）', () => {
  it('ガイドラインの tokens.css の値はすべて、同じ名前・同じ値で ui/tokens.css にある', () => {
    const g = guideCssBlocks()[0];
    const o = ourTokens();
    assert.ok(g.size >= 30, `ガイドラインの --ui- が少なすぎる（${g.size}）`);
    for (const [name, value] of g) {
      assert.ok(o.has(name), `${name} が ui/tokens.css に無い`);
      assert.equal(norm(o.get(name)), norm(value), `${name} の値がガイドラインと違う`);
    }
  });

  it('tokens.json の値はすべて、JSON から直接読んで ui/tokens.css と同じ（色・書体・大きさ・太さ・余白・角丸・寸法・影）', () => {
    const j = guideJson();
    assert.deepEqual(jsonMismatches(ourTokens(), j), []);
    // 角丸と外枠の寸法も JSON と直接比べていること（完了前レビューの指摘1）
    const names = new Set(jsonChecks(j).map((c) => c.name));
    for (const k of Object.keys(j.radius)) assert.ok(names.has(`--ui-radius-${k}`), `radius.${k}`);
    for (const name of ['--ui-topbar-h', '--ui-rail-w', '--ui-sidebar-w', '--ui-panel-w'])
      assert.ok(names.has(name), name);
  });

  it('tokens.json の値の葉は、すべて照合されている（照合の抜けを作らない）', () => {
    const j = guideJson();
    const checked = new Set([
      ...jsonChecks(j).map((c) => c.path),
      ...Object.keys(JSON_LEAVES_ELSEWHERE),
    ]);
    const missing = jsonLeaves(j).filter((p) => !checked.has(p));
    assert.deepEqual(missing, [], 'jsonChecks か JSON_LEAVES_ELSEWHERE に載せる');
    for (const p of Object.keys(JSON_LEAVES_ELSEWHERE))
      assert.ok(jsonLeaves(j).includes(p), `JSON_LEAVES_ELSEWHERE の ${p} は tokens.json に無い`);
    // 余白は 4px 刻み（space.scale の説明を値で確かめる）
    for (const v of j.space.values)
      assert.equal(v % 4, 0, `space.values の ${v} が 4 の倍数でない`);
  });

  it('照合は JSON を壊すと落ちる（角丸・外枠の寸法・色・余白を1つずつ変えて確かめる）', () => {
    const o = ourTokens();
    const cases = [
      ['radius.sm', (j) => (j.radius.sm = '7px'), '--ui-radius-sm'],
      ['radius.2xl', (j) => (j.radius['2xl'] = '17px'), '--ui-radius-2xl'],
      ['layout.topBarHeight', (j) => (j.layout.topBarHeight = '41px'), '--ui-topbar-h'],
      ['layout.appRailWidth', (j) => (j.layout.appRailWidth = '57px'), '--ui-rail-w'],
      ['layout.sidebarWidth', (j) => (j.layout.sidebarWidth = '281px'), '--ui-sidebar-w'],
      ['layout.rightPanelWidth', (j) => (j.layout.rightPanelWidth = '341px'), '--ui-panel-w'],
      ['color.surface.page', (j) => (j.color.surface.page.value = '#fffefd'), '--ui-surface-page'],
      ['space.values.0', (j) => (j.space.values[0] = 5), '--ui-space-'],
      ['elevation', (j) => (j.elevation.floatingPanel = 'none'), '--ui-shadow-floating'],
    ];
    for (const [label, mutate, name] of cases) {
      const j = guideJson();
      mutate(j);
      const bad = jsonMismatches(o, j);
      assert.ok(
        bad.some((b) => b.includes(name)),
        `${label} を変えても落ちない: ${bad.join(' / ')}`,
      );
    }
    // 葉が増えたら（照合の対象に入れ忘れたら）落ちる
    const j = guideJson();
    j.layout.newThing = '12px';
    assert.ok(jsonLeaves(j).includes('layout.newThing'));
  });

  it('入力の高さ（md）は tokens.json の範囲「32〜36px」の中', () => {
    const [lo, hi] = guideJson().layout.controlHeight.md.match(/\d+/g).map(Number);
    const v = Number(/\d+/.exec(ourTokens().get('--ui-control-h-md'))[0]);
    assert.ok(v >= lo && v <= hi, `--ui-control-h-md ${v}px が ${lo}〜${hi}px の外`);
  });

  it('名前はすべて --ui- で始まり、ガイドラインから来たものか DERIVED に理由のあるものだけ', () => {
    const o = ourTokens();
    const known = new Set([
      ...guideCssBlocks()[0].keys(),
      ...jsonChecks(guideJson()).map((c) => c.name),
      ...DERIVED_NAMES,
    ]);
    for (const name of o.keys()) {
      assert.ok(name.startsWith('--ui-'), `${name} は --ui- で始まらない`);
      assert.ok(known.has(name), `${name} はガイドラインに無く、DERIVED にも理由が無い`);
    }
    for (const name of DERIVED_NAMES)
      assert.ok(o.has(name), `DERIVED の ${name} が tokens.css に無い`);
    for (const [name, d] of Object.entries(DERIVED)) {
      assert.ok(String(d.reason).trim().length >= 10, `${name} の理由が短い`);
      if (d.kind === 'rule') assert.equal(typeof d.rule, 'function', `${name} の決め方が無い`);
    }
  });

  it('決め方で作る値（DERIVED の rule）は決め方どおり', () => {
    const o = ourTokens();
    const rules = Object.entries(DERIVED).filter(([, d]) => d.kind === 'rule');
    assert.deepEqual(rules.map(([name]) => name).sort(), [
      '--ui-action-primary-active',
      '--ui-action-primary-hover',
      '--ui-scrim',
    ]);
    for (const [name, d] of rules) {
      assert.equal(norm(o.get(name)), norm(d.rule(o)), `${name} が決め方どおりでない`);
    }
    // 壊すと落ちる: 覆いの不透明度を 0.99 にしたら決め方と合わない（完了前レビューの改善提案）
    const broken = new Map(o);
    broken.set('--ui-scrim', 'rgba(38,37,31,0.99)');
    assert.notEqual(norm(broken.get('--ui-scrim')), norm(DERIVED['--ui-scrim'].rule(broken)));
  });

  it('docs/stage1-report.md の DERIVED 表は、この表の名前をすべて載せている', () => {
    const report = read(path.join(CORE, 'docs', 'stage1-report.md'));
    for (const name of Object.keys(DERIVED))
      assert.ok(report.includes(`\`${name}\``), `報告に ${name} が無い`);
  });

  it('登記議事録つくるさんだけで使う6つの値は持たない', () => {
    const o = ourTokens();
    for (const name of PRODUCT_ONLY) assert.ok(!o.has(name), `${name} は製品だけの値（移さない）`);
    const css = stripComments(
      read(path.join(UI, 'components.css')) + read(path.join(UI, 'base.css')),
    );
    for (const name of PRODUCT_ONLY) assert.ok(!css.includes(name), `部品が ${name} を使っている`);
  });

  it('覆いの色はインク色（--ui-text-high）と同じ RGB で、不透明度は 10%', () => {
    const o = ourTokens();
    const hex = o.get('--ui-text-high').replace('#', '');
    const rgb = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',');
    const m = new RegExp(`^rgba\\(${rgb},(0?\\.\\d+)\\)$`).exec(
      o.get('--ui-scrim').replace(/\s/g, ''),
    );
    assert.ok(m, `--ui-scrim「${o.get('--ui-scrim')}」がインク色の rgba でない`);
    assert.equal(Number(m[1]), 0.1, `--ui-scrim の不透明度 ${m[1]} が 10% でない`);
  });

  it('明るい画面だけ（暗い画面の規則・:root 以外の塊を持たない）', () => {
    const css = stripComments(read(path.join(UI, 'tokens.css')));
    assert.doesNotMatch(css, /prefers-color-scheme|data-theme|@media/);
    assert.equal(
      css.replace(/:root\s*\{[^}]*\}/, '').trim(),
      '',
      'tokens.css は :root の1つの塊だけ',
    );
  });
});

describe('純白を色として使わない（core。examples・guidelines/images・mockups は除く）', () => {
  it('検出の道具は純白の書き方を拾い、近い色・注記は拾わない', () => {
    for (const w of [
      '#fff',
      '#FFFFFF',
      '#ffff',
      '#ffffffff',
      'white',
      'rgb(255,255,255)',
      'rgba(255, 255, 255, .5)',
      'rgb(255 255 255 / 50%)',
    ])
      assert.ok(isWhite(w), `見逃した: ${w}`);
    for (const ok of [
      '#fffefc',
      '#fffff0',
      '#ffffe0',
      'rgb(255,255,254)',
      'var(--ui-surface-page)',
      'whitesmoke',
      'transparent',
    ])
      assert.ok(!isWhite(ok), `誤って拾った: ${ok}`);
    // 注記の欄（$ で始まる）は色の走査に入らない
    const vals = jsonColorValues({ color: { a: { value: '#fffefc', $note: '#ffffff での値' } } });
    assert.deepEqual(vals, [{ at: 'color.a.value', value: '#fffefc' }]);
  });

  it('SVG の描画属性と style は、二重引用符・一重引用符・引用符なしのどれでも純白を拾う（完了前レビューの指摘3）', () => {
    const svgWith = (attrs) =>
      `<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0" ${attrs}/></svg>`;
    const whites = (svg) =>
      svgPaintValues(svg)
        .filter((p) => isWhite(p.value))
        .map((p) => p.attr);
    // 属性
    assert.deepEqual(whites(svgWith('stroke="#ffffff"')), ['stroke']);
    assert.deepEqual(whites(svgWith("stroke='#ffffff'")), ['stroke']);
    assert.deepEqual(whites(svgWith('fill=#fff')), ['fill']);
    assert.deepEqual(whites(svgWith("stop-color = 'white'")), ['stop-color']);
    // style の中
    assert.deepEqual(whites(svgWith('style="stroke: #ffffff"')), ['style:stroke']);
    assert.deepEqual(whites(svgWith("style='fill:#FFF;stroke:#26251f'")), ['style:fill']);
    // 純白でないもの・描画属性でないもの・来歴情報（metadata）の中は拾わない
    assert.deepEqual(whites(svgWith('stroke=\'#fffefc\' fill="#3f8a5a"')), []);
    assert.deepEqual(whites(svgWith("stroke-width='1.6' data-fill='#ffffff'")), []);
    assert.deepEqual(
      whites(`<svg><metadata><x fill='#ffffff'/></metadata><path stroke='#fffefc'/></svg>`),
      [],
    );
    // 実物のアイコンを一重引用符で書き換えたものでも拾う
    const real = read(path.join(GUIDE, 'icons', 'status-approved.svg'));
    assert.ok(real.includes('stroke="#fffefc"'));
    assert.deepEqual(whites(real.replace('stroke="#fffefc"', "stroke='#ffffff'")), ['stroke']);
  });

  it('ui の CSS と、ガイドラインの tokens.css の宣言の値に純白が無い', () => {
    const files = [
      ...fs
        .readdirSync(UI)
        .filter((f) => f.endsWith('.css'))
        .map((f) => path.join(UI, f)),
      path.join(GUIDE, 'tokens', 'tokens.css'),
    ];
    for (const f of files) {
      for (const d of cssDeclarations(read(f)))
        assert.ok(!isWhite(d.value), `${path.relative(CORE, f)} の ${d.prop}: ${d.value}`);
    }
  });

  it('ui の JS の文字列に純白が無い', () => {
    for (const f of fs.readdirSync(UI).filter((x) => x.endsWith('.js'))) {
      const code = read(path.join(UI, f))
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
      assert.ok(!isWhite(code), `ui/${f}`);
    }
  });

  it('tokens.json の色の欄（value・on・border）に純白が無い', () => {
    const vals = jsonColorValues(guideJson());
    assert.ok(vals.length >= 25, `色の欄が少なすぎる（${vals.length}）`);
    for (const { at, value } of vals) assert.ok(!isWhite(value), `${at}: ${value}`);
  });

  it('ガイドラインのアイコン（icons/*.svg）の描画属性に純白が無い', () => {
    const dir = path.join(GUIDE, 'icons');
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.svg'));
    assert.equal(files.length, 8);
    let paints = 0;
    for (const f of files) {
      for (const { attr, value } of svgPaintValues(read(path.join(dir, f)))) {
        paints += 1;
        assert.ok(!isWhite(value), `icons/${f} の ${attr}="${value}"`);
      }
    }
    assert.ok(paints >= 8, '描画属性を拾えていない');
  });
});
