// コントラスト（WCAG 2.x の式で計算）。
//  1) 新しい本文の面（--ui-surface-page。純白をやめた #fffefc）に対する下限: 文字 4.5、状態の色 3.0
//  2) ガイドラインの contrastOnWhite（純白の地での値）を計算し直して ±0.05 で照合（ガイドラインの数値の写し違いを見つける）
//  3) 入力・選択の枠: 部品が使う値（2026-11-14 から --ui-border-input）が 3:1 以上か。重ねても枠を変えないこと
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { ourTokens, guideJson, contrast, read, UI } from './helpers.mjs';

const PURE_WHITE = '#ffffff'; // ガイドラインの contrastOnWhite を計算し直すためだけに使う（色としては使わない）

describe('コントラスト', () => {
  it('本文の面に対して、文字（high・middle・low）は 4.5:1 以上', (t) => {
    const o = ourTokens();
    const page = o.get('--ui-surface-page');
    for (const k of ['high', 'middle', 'low']) {
      const r = contrast(o.get(`--ui-text-${k}`), page);
      t.diagnostic(`text-${k} ${o.get(`--ui-text-${k}`)} on ${page}: ${r.toFixed(2)}`);
      assert.ok(r >= 4.5, `text-${k} が ${r.toFixed(2)}（4.5 未満）`);
    }
  });

  it('本文の面に対して、状態の色（status-*）は 3.0:1 以上', (t) => {
    const o = ourTokens();
    const page = o.get('--ui-surface-page');
    for (const k of Object.keys(guideJson().color.status)) {
      const r = contrast(o.get(`--ui-status-${k}`), page);
      t.diagnostic(`status-${k} ${o.get(`--ui-status-${k}`)} on ${page}: ${r.toFixed(2)}`);
      assert.ok(r >= 3.0, `status-${k} が ${r.toFixed(2)}（3.0 未満）`);
    }
  });

  it('ガイドラインの contrastOnWhite は、純白の地で計算し直した値と ±0.05 以内', () => {
    const color = guideJson().color;
    let n = 0;
    for (const [group, items] of Object.entries(color)) {
      for (const [k, v] of Object.entries(items)) {
        if (v.contrastOnWhite === undefined) continue;
        n += 1;
        const r = contrast(v.value, PURE_WHITE);
        assert.ok(
          Math.abs(r - v.contrastOnWhite) <= 0.05,
          `${group}.${k}: 計算 ${r.toFixed(3)} とガイドライン ${v.contrastOnWhite} の差が 0.05 を超える`,
        );
      }
    }
    assert.ok(n >= 10, `contrastOnWhite を持つ色が少なすぎる（${n}）`);
  });

  it('入力欄の枠の比を記録する（docs/stage1-report.md の D6。2026-11-14 に border-input へ切り替えた）', (t) => {
    const o = ourTokens();
    const page = o.get('--ui-surface-page');
    const panel = o.get('--ui-surface-panel');
    for (const name of ['--ui-border-high', '--ui-border-input']) {
      const onPage = contrast(o.get(name), page).toFixed(2);
      const onPanel = contrast(o.get(name), panel).toFixed(2);
      t.diagnostic(`${name} ${o.get(name)}: page ${onPage} / panel ${onPanel}`);
    }
    assert.ok(contrast(o.get('--ui-border-high'), page) > 1);
  });

  it('入力・選択の枠は、使っている値が本文の面・入力の地・アプリの地に対して 3:1 以上（WCAG 1.4.11。D6 の見直し 2026-11-14）', (t) => {
    const o = ourTokens();
    const rules = parseCss(read(path.join(UI, 'components.css')));
    for (const sel of ['.tsk-input', '.tsk-select__control']) {
      // 条件の無い規則で、ちょうどこの選択子に当たるものの border の最後の値
      const borders = rules
        .filter((r) => r.conds.length === 0 && r.selectors.includes(sel))
        .map((r) => declMap(r.decl).get('border'))
        .filter(Boolean);
      assert.ok(borders.length, `${sel} の枠の規則が無い`);
      const m = /^1px solid var\((--ui-[a-z0-9-]+)\)$/.exec(borders.at(-1));
      assert.ok(m, `${sel} の枠が var(--ui-…) で書かれていない`);
      assert.equal(m[1], '--ui-border-input', `${sel} の枠は --ui-border-input`);
      for (const bg of ['--ui-surface-page', '--ui-surface-panel', '--ui-surface-app']) {
        const r = contrast(o.get(m[1]), o.get(bg));
        t.diagnostic(`${sel} の枠 ${m[1]} on ${bg}: ${r.toFixed(2)}`);
        assert.ok(r >= 3, `${sel} の枠と ${bg} の比 ${r.toFixed(2)} が 3 未満`);
      }
    }
  });

  it('入力・選択の枠は、重ねても色を変えない（@media などの条件つきの規則も含む。2026-11-14 yuuki）', () => {
    const css = read(path.join(UI, 'components.css'));
    assert.deepEqual(hoverBorderProblems(css), []);
    // 道具の確認: 古い hover の規則を、条件なし・@media の中・@supports の中に戻すと、どれも見つかる（レビューの指摘2）
    const old = '.tsk-select__control:hover { border-color: var(--ui-text-disabled); }';
    for (const added of [
      old,
      `@media (hover: hover) { ${old} }`,
      `@supports (display: grid) { @media (min-width: 1px) { ${old} } }`,
      '@media (hover: hover) { .tsk-field .tsk-input:hover { border-color: var(--ui-text-disabled); } }',
      '.tsk-input:hover { box-shadow: inset 0 0 0 1px var(--ui-text-disabled); }',
    ]) {
      assert.ok(hoverBorderProblems(`${css}\n${added}`).length > 0, `見逃した: ${added}`);
    }
  });

  it('通常の入力欄・選択欄のフォーカスの輪は 2px・インク色・外側で、ほかの規則に消されていない', () => {
    const css = read(path.join(UI, 'components.css'));
    assert.deepEqual(focusRingProblems(css), []);
    // 道具の確認（レビューの指摘1）: 共通の規則の輪を none にする・細くする・内側にする、後ろの規則で消す、@media の中で消す
    const common =
      /(\.tsk-input:focus-visible,\s*\.tsk-seg__btn:focus-visible\s*\{\s*)outline: 2px solid var\(--ui-text-high\);\s*outline-offset: 2px;/;
    assert.match(css, common, '共通の規則が見つからない（テストを直す）');
    for (const broken of [
      css.replace(common, '$1outline: none; outline-offset: 2px;'),
      css.replace(common, '$1outline: 1px solid var(--ui-text-high); outline-offset: 2px;'),
      css.replace(common, '$1outline: 2px solid var(--ui-border-low); outline-offset: 2px;'),
      css.replace(common, '$1outline: 2px solid var(--ui-text-high); outline-offset: -2px;'),
      `${css}\n.tsk-input:focus-visible { outline: none; }`,
      `${css}\n@media (pointer: fine) { .tsk-select__control:focus-visible { outline: 0; } }`,
      css.replace(
        '.tsk-select__control:focus-visible { outline: 2px solid var(--ui-text-high);',
        '.tsk-select__control:focus-visible { outline: none;',
      ),
      // 個別の指定（outline-style・outline-width・outline-color）で輪を変える（再レビューの指摘。条件つきの規則も含む）
      `${css}\n.tsk-input:focus-visible { outline-style: none; }`,
      `${css}\n.tsk-select__control:focus-visible { outline-width: 1px; }`,
      `${css}\n.tsk-input:focus-visible { outline-color: var(--ui-border-low); }`,
      `${css}\n@media (pointer: fine) { .tsk-select__control:focus-visible { outline-width: 0; } }`,
      `${css}\n@supports (display: grid) { .tsk-field .tsk-input:focus-visible { outline-style: dashed; } }`,
      `${css}\n@media (hover: hover) { .tsk-input:focus-visible { outline-color: transparent !important; } }`,
      css.replace(
        '.tsk-select__control:focus-visible { outline: 2px solid var(--ui-text-high);',
        '.tsk-select__control:focus-visible { outline: 2px solid var(--ui-text-high); outline-style: hidden;',
      ),
    ]) {
      assert.notEqual(broken, css, 'テストの書き換えが効いていない');
      assert.ok(focusRingProblems(broken).length > 0, `壊した輪を見逃した: ${broken.slice(-120)}`);
    }
    // 輪を変えない書き方は、問題にしない（書く順や、同じ値の言い直し）
    for (const same of [
      `${css}\n.tsk-input:focus-visible { outline: solid var(--ui-text-high) 2px; outline-offset: 3px; }`,
      `${css}\n@media (hover: hover) { .tsk-select__control:focus-visible { outline-width: 2px; outline-style: solid; } }`,
    ]) {
      assert.deepEqual(focusRingProblems(same), [], `同じ輪なのに問題にした: ${same.slice(-120)}`);
    }
  });

  it('誤りの赤い枠は残り、手順の番号の丸い枠は border-high のまま', () => {
    const rules = parseCss(read(path.join(UI, 'components.css')));
    const declOf = (selector) =>
      rules
        .filter((r) => r.conds.length === 0 && r.selectors.includes(selector))
        .map((r) => r.decl)
        .join(';');
    assert.match(
      declOf('.tsk-input[aria-invalid="true"]'),
      /border-color: var\(--ui-status-danger\)/,
    );
    assert.match(
      declOf('.tsk-field--invalid .tsk-input'),
      /border-color: var\(--ui-status-danger\)/,
    );
    assert.match(
      declOf('.tsk-select__control[aria-invalid="true"]'),
      /border-color: var\(--ui-status-danger\)/,
    );
    assert.match(declOf('.tsk-steps__number'), /border: 1px solid var\(--ui-border-high\)/);
  });
});

/**
 * CSS の規則を並べる。@media・@supports などの条件の中にも降り、その条件を conds に持つ（書いた順）。
 *
 * 扱える書き方:
 *  - コメント（外してから読む）、条件の入れ子（@supports の中の @media など。conds に外側から順に入る）
 *  - 選択子の並び（a, b）。1つの規則に同じ宣言が2回あっても、宣言の文字列のまま返す（順は declEntries が保つ）
 * 扱えない書き方（このテストの対象の components.css には無い。書いたら、この関数を直してから使う）:
 *  - かっこの中のカンマ（:is(.a, .b)・:where(…)・:not(.a, .b)）。選択子を単純に , で分けるので、途中で切れる。
 *    いまは css.test.mjs の「規則はすべて .tsk- の class から始まる」の規約テストが、この書き方を拒むので実害は無い
 *  - 文字列や url( ) の中の { } ; ,（例 content: "{"）。区切りとして読んでしまう
 *  - CSS の入れ子（& を使う書き方）。規則の中の規則を、外側の規則の一部として読めない
 *  - @font-face・@page など、宣言を直接持つ at-rule の宣言（規則として返さない）
 *  - @import・@charset のような ; で終わる at-rule。次の規則とひとまとまりに読み、その規則を at-rule と取り違えて落とす
 *    （components.css は @import を持たないことを css.test.mjs が確かめている）
 * @returns {{conds: string[], selectors: string[], decl: string}[]}
 */
function parseCss(css) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [];
  const stack = [];
  let buf = '';
  for (const ch of text) {
    if (ch === '{') {
      const prelude = buf.trim().replace(/\s+/g, ' ');
      buf = '';
      stack.push(prelude.startsWith('@') ? { at: prelude } : { selector: prelude });
    } else if (ch === '}') {
      const top = stack.pop();
      if (top && top.selector !== undefined) {
        out.push({
          conds: stack.filter((s) => s.at).map((s) => s.at),
          selectors: top.selector.split(',').map((s) => s.trim()),
          decl: buf.trim(),
        });
      }
      buf = '';
    } else {
      buf += ch;
    }
  }
  return out;
}

/** 宣言の文字列 → 名前 → 値（後ろが勝つ） */
function declMap(decl) {
  const map = new Map();
  for (const part of decl.split(';')) {
    const i = part.indexOf(':');
    if (i > 0) map.set(part.slice(0, i).trim(), part.slice(i + 1).trim());
  }
  return map;
}

const FIELD = /\.tsk-(input|select__control)\b/;

/** 入力・選択に効く :hover の規則で、枠（border・outline・box-shadow）を変えるもの（条件つきの規則も見る） */
function hoverBorderProblems(css) {
  const bad = [];
  for (const r of parseCss(css)) {
    for (const sel of r.selectors) {
      if (!FIELD.test(sel) || !/:hover\b/.test(sel)) continue;
      const touched = [...declMap(r.decl).keys()].filter((p) =>
        /^(border|outline|box-shadow)/.test(p),
      );
      if (touched.length) bad.push(`${r.conds.join(' ')} ${sel} { ${touched.join(', ')} }`.trim());
    }
  }
  return bad;
}

/** 宣言の文字列 → [名前, 値] を書いた順に（同じ名前が2回あっても両方残す。!important は外す） */
function declEntries(decl) {
  const out = [];
  for (const part of decl.split(';')) {
    const i = part.indexOf(':');
    if (i > 0)
      out.push([
        part.slice(0, i).trim().toLowerCase(),
        part
          .slice(i + 1)
          .replace(/\s*!important\s*$/i, '')
          .trim(),
      ]);
  }
  return out;
}

/** 値を、かっこの外の空白で分ける（var(--a, b) を1つのまとまりとして扱う） */
function splitTopLevel(value) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of value) {
    if (ch === '(') depth += 1;
    if (ch === ')') depth -= 1;
    if (/\s/.test(ch) && depth === 0) {
      if (cur) out.push(cur);
      cur = '';
    } else cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

const OUTLINE_STYLES = new Set([
  'auto',
  'none',
  'hidden',
  'dotted',
  'dashed',
  'solid',
  'double',
  'groove',
  'ridge',
  'inset',
  'outset',
]);
const OUTLINE_WIDTH = /^(-?\d*\.?\d+(px|em|rem)?|thin|medium|thick)$/i;
const RING = Object.freeze({ width: '2px', style: 'solid', color: 'var(--ui-text-high)' });

/**
 * 輪の状態（width・style・color・offset）に、1つの宣言を当てる。
 * outline（まとめ書き）は、書いていない部分を初期値（medium・none・currentcolor）に戻す（CSS の決まりどおり）
 */
function applyOutline(state, prop, value) {
  if (prop === 'outline') {
    const next = { width: 'medium', style: 'none', color: 'currentcolor' };
    for (const tok of splitTopLevel(value)) {
      if (OUTLINE_STYLES.has(tok.toLowerCase())) next.style = tok.toLowerCase();
      else if (OUTLINE_WIDTH.test(tok)) next.width = tok;
      else next.color = tok;
    }
    Object.assign(state, next);
  } else if (prop === 'outline-width') state.width = value;
  else if (prop === 'outline-style') state.style = value.toLowerCase();
  else if (prop === 'outline-color') state.color = value;
  else if (prop === 'outline-offset') state.offset = value;
}

const ringText = (s) => `${s.width} ${s.style} ${s.color}`;
const isRing = (s) => s.width === RING.width && s.style === RING.style && s.color === RING.color;
const isOutside = (offset) => /^[1-9]\d*px$/.test(offset ?? '');

/**
 * 通常の入力欄・選択欄のフォーカスの輪（:focus-visible）の問題を並べる。
 *  - 条件の無い規則を書いた順にたどり、ちょうど `.tsk-input:focus-visible`・`.tsk-select__control:focus-visible` に
 *    当たる規則の outline・outline-width・outline-style・outline-color・outline-offset を順に当てた**最後の輪**が、
 *    2px・solid・インク色（var(--ui-text-high)）・外側（正の px の offset）であること
 *  - 入力・選択と :focus-visible を含む規則（誤りの状態・@media・@supports の中も含む）が、輪の部分を1つでも書くなら、
 *    その規則の中で順に当てた結果が同じ輪であること（まとめ書きでも個別の指定でも、輪を消す・細くする・色を変える・
 *    内側にすると問題になる）
 */
function focusRingProblems(css) {
  const bad = [];
  const rules = parseCss(css);
  for (const target of ['.tsk-input:focus-visible', '.tsk-select__control:focus-visible']) {
    const state = { width: null, style: null, color: null, offset: null };
    for (const r of rules) {
      if (r.conds.length || !r.selectors.includes(target)) continue;
      for (const [prop, value] of declEntries(r.decl)) applyOutline(state, prop, value);
    }
    if (!isRing(state))
      bad.push(`${target} の最後の輪が「${ringText(state)}」（${ringText(RING)} ではない）`);
    if (!isOutside(state.offset))
      bad.push(`${target} の輪の位置が「${state.offset}」（外側ではない）`);
  }
  for (const r of rules) {
    for (const sel of r.selectors) {
      if (!FIELD.test(sel) || !/:focus-visible\b/.test(sel)) continue;
      const entries = declEntries(r.decl).filter(([p]) => p.startsWith('outline'));
      if (!entries.length) continue;
      const where = `${r.conds.join(' ')} ${sel}`.trim();
      const state = { ...RING, offset: '2px' };
      for (const [prop, value] of entries) applyOutline(state, prop, value);
      if (!isRing(state)) bad.push(`${where} が輪を「${ringText(state)}」にしている`);
      if (!isOutside(state.offset)) bad.push(`${where} が輪の位置を「${state.offset}」にしている`);
    }
  }
  return bad;
}
