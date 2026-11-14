// テストの補助（*.test.mjs に当たらない名前なので、これ自体はテストとして走らない）。
// 値は書き写さず、core の中のファイルを読んで比べるための道具だけを置く。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const CORE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const UI = path.join(CORE, 'ui');
export const GUIDE = path.join(CORE, 'guidelines');

export const read = (p) => fs.readFileSync(p, 'utf8');
export const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
/** JS のコメントを外す（ブロックと、行の頭からの // だけ。文字列の中の // は残す） */
export const stripJsComments = (js) =>
  js.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** 値の比べ方: 空白をそろえ、小文字にする（0.04 と .04 のような書き方の違いは許さない＝写した字のまま） */
export const norm = (v) =>
  String(v)
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .toLowerCase();

/** :root { … } の塊ごとに、カスタムプロパティの名前 → 値 */
export function rootBlocks(css) {
  const blocks = [];
  const re = /:root\s*\{([^}]*)\}/g;
  let m;
  const text = stripComments(css);
  while ((m = re.exec(text))) {
    const map = new Map();
    for (const decl of m[1].split(';')) {
      const i = decl.indexOf(':');
      if (i < 0) continue;
      const name = decl.slice(0, i).trim();
      if (name.startsWith('--')) map.set(name, decl.slice(i + 1).trim());
    }
    blocks.push(map);
  }
  return blocks;
}

export const ourTokens = () => {
  const blocks = rootBlocks(read(path.join(UI, 'tokens.css')));
  if (blocks.length !== 1)
    throw new Error(`ui/tokens.css の :root は1つだけのはず（${blocks.length}）`);
  return blocks[0];
};
export const guideCssBlocks = () => rootBlocks(read(path.join(GUIDE, 'tokens', 'tokens.css')));
export const guideJson = () => JSON.parse(read(path.join(GUIDE, 'tokens', 'tokens.json')));

/* ---------------------------------------------------------------- 色の計算（WCAG 2.x） */

/** '#rrggbb' → [r, g, b]（0〜255） */
export function hexToRgb(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) throw new Error(`#rrggbb ではない: ${hex}`);
  return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
}
export const rgbToHex = (rgb) => `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`;

/** 相対輝度（WCAG 2.x の式） */
export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** コントラスト比（明るい方 + 0.05）/（暗い方 + 0.05） */
export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * 主ボタンの hover・active の決め方。sRGB 8bit の各成分で
 *   白へ t: c + (255 - c) * t ／ 黒へ t: c * (1 - t)
 * 端数は Math.round（0.5 は切り上げ）。偶数への丸めにすると active は #1c1c17 になるので、丸め方もここで決める
 */
export const mixToWhite = (hex, t) =>
  rgbToHex(hexToRgb(hex).map((c) => Math.round(c + (255 - c) * t)));
export const mixToBlack = (hex, t) => rgbToHex(hexToRgb(hex).map((c) => Math.round(c * (1 - t))));

/* ---------------------------------------------------------------- DERIVED（ガイドラインに無い値・解釈した値） */

/**
 * tokens.json の値の欄（葉）ごとに、ui/tokens.css のどの名前と比べるか。
 * tokens.json の値はすべてここで JSON から読む（ガイドラインの tokens.css を経由しない＝正と直接比べる）。
 * 解釈の要るもの（「約44px」など）は下の DERIVED にも理由を載せる
 * @returns {{path: string, name: string, value: string}[]}
 */
export function jsonChecks(j) {
  const out = [];
  const add = (path, name, value) => out.push({ path, name, value: String(value) });
  const num = (text) => `${/\d+/.exec(text)[0]}px`; // 「約44px」「40px（角丸10px）」は数字の部分を取る（DERIVED に理由）
  for (const group of ['surface', 'border', 'text', 'status']) {
    for (const [k, v] of Object.entries(j.color[group]))
      add(`color.${group}.${k}.value`, `--ui-${group}-${k}`, v.value);
  }
  const { primary, secondary } = j.color.action;
  add('color.action.primary.value', '--ui-action-primary', primary.value);
  add('color.action.primary.on', '--ui-action-on-primary', primary.on);
  add('color.action.secondary.value', '--ui-action-secondary', secondary.value);
  add('color.action.secondary.border', '--ui-action-secondary-border', secondary.border);
  add('color.action.secondary.on', '--ui-action-on-secondary', secondary.on);
  add('font.ui.value', '--ui-font-ui', j.font.ui.value);
  add('font.reading.value', '--ui-font-reading', j.font.reading.value);
  for (const [k, v] of Object.entries(j.font.size)) add(`font.size.${k}`, `--ui-font-size-${k}`, v);
  for (const [k, v] of Object.entries(j.font.weight))
    add(`font.weight.${k}`, `--ui-font-weight-${k}`, v);
  j.space.values.forEach((v, i) => add(`space.values.${i}`, `--ui-space-${v / 4}`, `${v}px`));
  for (const [k, v] of Object.entries(j.radius)) add(`radius.${k}`, `--ui-radius-${k}`, v);
  const L = j.layout;
  add('layout.topBarHeight', '--ui-topbar-h', L.topBarHeight);
  add('layout.appRailWidth', '--ui-rail-w', L.appRailWidth);
  add('layout.appRailItem', '--ui-rail-item', num(L.appRailItem));
  add('layout.sidebarWidth', '--ui-sidebar-w', L.sidebarWidth);
  add('layout.pagePaddingX', '--ui-page-pad-x', L.pagePaddingX);
  add('layout.rightPanelWidth', '--ui-panel-w', L.rightPanelWidth);
  add('layout.tabHeight', '--ui-tab-h', L.tabHeight);
  add('layout.tableRowHeight', '--ui-row-h', num(L.tableRowHeight));
  add('layout.controlHeight.sm', '--ui-control-h-sm', L.controlHeight.sm);
  add('elevation.floatingPanel', '--ui-shadow-floating', j.elevation.floatingPanel);
  return out;
}

/**
 * jsonChecks で比べない葉と、その理由（別のテストが受け持つ・値ではない）。
 * tokens.json に新しい葉が増えたら、jsonChecks かここのどちらかに載せないとテストが落ちる
 */
export const JSON_LEAVES_ELSEWHERE = Object.freeze({
  'layout.controlHeight.md':
    '「32〜36px」の範囲。範囲の中かを tokens.test.mjs が確かめる（DERIVED）',
  'space.scale':
    '「4px刻み」という説明。space.values がすべて 4 の倍数かを tokens.test.mjs が確かめる',
});

/** tokens.json の値の葉（説明の欄 use・$ で始まる欄・純白の地での比 contrastOnWhite は除く）のパスを並べる */
export function jsonLeaves(j) {
  const out = [];
  const walk = (node, at) => {
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith('$') || k === 'use' || k === 'contrastOnWhite') continue;
      const p = at ? `${at}.${k}` : k;
      if (v && typeof v === 'object') walk(v, p);
      else out.push(p);
    }
  };
  walk(j, '');
  return out;
}

/** ui/tokens.css（名前 → 値）と tokens.json の食い違いを並べる（無ければ空） */
export function jsonMismatches(ours, j) {
  const bad = [];
  for (const { path, name, value } of jsonChecks(j)) {
    if (!ours.has(name)) bad.push(`${name} が ui/tokens.css に無い（${path}）`);
    else if (norm(ours.get(name)) !== norm(value))
      bad.push(
        `${name}: ui/tokens.css「${ours.get(name)}」と tokens.json の ${path}「${value}」が違う`,
      );
  }
  return bad;
}

/**
 * ガイドラインに無い値・ガイドラインの記述を解釈した値（理由つき）。ここに無い名前を ui/tokens.css に足すと落ちる。
 * docs/stage1-report.md の DERIVED 表はこの表の写し（test/tokens.test.mjs が名前の一致を確かめる）。
 *   kind: value（ガイドラインに無い値）／ rule（決め方で作る値。テストが決め方どおりか確かめる）／
 *         interpretation（ガイドラインの記述を解釈した値）／ naming（名前の付け方）
 */
export const DERIVED = Object.freeze({
  '--ui-scrim': {
    kind: 'rule',
    reason:
      'ドロワー・小窓の後ろの覆い。インク色（--ui-text-high の RGB 38,37,31）の 10%。ガイドラインに覆いの色の定めが無い',
    rule: (o) => `rgba(${hexToRgb(o.get('--ui-text-high')).join(',')},0.10)`,
  },
  '--ui-action-primary-hover': {
    kind: 'rule',
    reason:
      '主ボタンの hover。インク色（--ui-action-primary）を白へ 12% 混ぜる。ガイドラインに定めが無い',
    rule: (o) => mixToWhite(o.get('--ui-action-primary'), 0.12),
  },
  '--ui-action-primary-active': {
    kind: 'rule',
    reason:
      '主ボタンの active。インク色（--ui-action-primary）を黒へ 25% 混ぜる。ガイドラインに定めが無い',
    rule: (o) => mixToBlack(o.get('--ui-action-primary'), 0.25),
  },
  '--ui-control-h-md': {
    kind: 'interpretation',
    reason:
      'tokens.json の layout.controlHeight.md「32〜36px」から 36px を選んだ（範囲の中であることをテストで確かめる）',
  },
  '--ui-row-h': {
    kind: 'interpretation',
    reason: 'tokens.json の layout.tableRowHeight「約44px」を 44px とした',
  },
  '--ui-rail-item': {
    kind: 'interpretation',
    reason:
      'tokens.json の layout.appRailItem「40px（角丸10px）」の大きさを 40px とした（角丸は --ui-radius-lg）',
  },
  '--ui-space-N': {
    kind: 'naming',
    reason:
      'tokens.json の space.values（4px 刻みの並び）に名前が無いので、--ui-space-{px ÷ 4} と名付けた（例 12px → --ui-space-3）',
  },
});

/** DERIVED の中で、ui/tokens.css に実際に名前として現れるもの（naming の行は名前の型なので除く） */
export const DERIVED_NAMES = Object.keys(DERIVED).filter((k) => DERIVED[k].kind !== 'naming');

/** 登記議事録つくるさんだけで使う値。core には移さない */
export const PRODUCT_ONLY = Object.freeze([
  '--ui-content-w',
  '--ui-list-w',
  '--ui-actionbar-h',
  '--ui-paper-preview-w',
  '--ui-paper-preview-min-h',
  '--ui-line-height-reading',
]);

/* ---------------------------------------------------------------- 純白の検出（色として使う値だけ） */

/** 純白の書き方（#fff・#ffff・#ffffff・#ffffffff・white・rgb(255,255,255)・rgba(255,255,255,a)） */
const WHITE =
  /#(?:fff|ffff|ffffff|ffffffff)\b|\bwhite\b|rgba?\(\s*255\s*,\s*255\s*,\s*255\s*(?:,[^)]*)?\)|rgba?\(\s*255\s+255\s+255\s*(?:\/[^)]*)?\)/i;
export const isWhite = (value) => WHITE.test(String(value));

/** CSS の宣言（名前: 値）を並べる。コメントは外す。@media の中にも降りる */
export function cssDeclarations(css) {
  const out = [];
  for (const m of stripComments(css).matchAll(/([-a-zA-Z]+)\s*:\s*([^;{}]+)/g)) {
    out.push({ prop: m[1].trim(), value: m[2].trim() });
  }
  return out;
}

/** tokens.json の color の下で、色を持つ欄（value・on・border）の値を並べる。$ で始まる欄（注記）は見ない */
export function jsonColorValues(j) {
  const out = [];
  const walk = (node, at) => {
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith('$')) continue;
      if (v && typeof v === 'object') walk(v, `${at}.${k}`);
      else if (['value', 'on', 'border'].includes(k)) out.push({ at: `${at}.${k}`, value: v });
    }
  };
  walk(j.color, 'color');
  return out;
}

/**
 * 属性の値の書き方（二重引用符・一重引用符・引用符なし）。
 * 引用符なしは HTML の中の SVG で起こりうるので拾っておく（XML の SVG では書けない）
 */
const ATTR_VALUE = String.raw`\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>\x60/]+))`;
const attrValue = (m) => m[2] ?? m[3] ?? m[4];

/** SVG の描画属性（fill・stroke・stop-color・flood-color・lighting-color・color と style の中のそれら）の値 */
export function svgPaintValues(svg) {
  const body = svg.replace(/<metadata>[\s\S]*?<\/metadata>/g, '');
  const out = [];
  const paint = new RegExp(
    String.raw`\s(fill|stroke|stop-color|flood-color|lighting-color|color)${ATTR_VALUE}`,
    'g',
  );
  for (const m of body.matchAll(paint)) out.push({ attr: m[1], value: attrValue(m) });
  for (const m of body.matchAll(new RegExp(String.raw`\s(style)${ATTR_VALUE}`, 'g'))) {
    for (const d of cssDeclarations(attrValue(m)))
      out.push({ attr: `style:${d.prop}`, value: d.value });
  }
  return out;
}
