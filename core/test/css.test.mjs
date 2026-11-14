// 部品の CSS（ui/components.css・ui/base.css）の決まり。
//  - 色の値を書いてよいのは ui/tokens.css だけ（ほかの ui の CSS・JS は --ui- の名前だけ）
//  - 部品が使う var(--ui-…) はすべて tokens.css にある
//  - components.css の規則は .tsk- の class から始まる（is-* の状態の class は添えてよい）。base.css は要素の規則を持ってよい
//  - 間隔の px の直書き（3px 以上）は、理由つきの例外の表にあるものだけ
// 移した元: 登記議事録つくるさん _dev/test/uicss.test.mjs（帳票との衝突の検査・製品のビルドの検査・製品の画面の CSS の走査は移していない）
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { CORE, UI, read, stripComments, stripJsComments } from './helpers.mjs';

const NAMED_COLORS = [
  'black',
  'white',
  'red',
  'green',
  'blue',
  'gray',
  'grey',
  'silver',
  'yellow',
  'orange',
  'purple',
  'pink',
  'brown',
  'navy',
  'teal',
  'maroon',
  'olive',
  'lime',
  'aqua',
  'fuchsia',
];

/** 色の直書き（hex・rgb/hsl・名前の色）。transparent・currentColor・inherit は色の値ではないので許す */
function colorLiterals(text) {
  const found = [];
  for (const m of text.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) found.push(m[0]);
  for (const m of text.matchAll(/\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/g))
    found.push(m[0]);
  for (const m of text.matchAll(new RegExp(`:\\s*[^;{}]*\\b(${NAMED_COLORS.join('|')})\\b`, 'gi')))
    found.push(m[1]);
  return found;
}

/** CSS の規則の前置き（セレクタ）を並べる。@media の中にも降りる */
function selectors(css) {
  const out = [];
  const text = stripComments(css);
  let depth = 0;
  let buf = '';
  for (const ch of text) {
    if (ch === '{') {
      const prelude = buf.trim();
      buf = '';
      if (!prelude.startsWith('@')) out.push(prelude);
      depth += 1;
    } else if (ch === '}') {
      buf = '';
      depth -= 1;
    } else {
      buf += ch;
      if (ch === ';' && depth > 0) buf = '';
    }
  }
  return out;
}

const componentsCss = () => read(path.join(UI, 'components.css'));
const baseCss = () => read(path.join(UI, 'base.css'));
const definedVars = () =>
  new Set(
    [...read(path.join(UI, 'tokens.css')).matchAll(/(--ui-[a-z0-9-]+)\s*:/g)].map((m) => m[1]),
  );

describe('部品の CSS（ui/components.css・ui/base.css）', () => {
  it('色の値は tokens.css にだけある（ui のほかの CSS・JS に色の直書きが無い）', () => {
    const files = fs.readdirSync(UI).filter((f) => /\.(css|js)$/.test(f) && f !== 'tokens.css');
    assert.ok(files.length >= 7, `ui のファイルが足りない: ${files.length}`);
    for (const f of files) {
      const text = f.endsWith('.css')
        ? stripComments(read(path.join(UI, f)))
        : stripJsComments(read(path.join(UI, f)));
      assert.deepEqual(colorLiterals(text), [], `ui/${f} に色の直書き`);
    }
  });

  it('部品が使う変数はすべて tokens.css の --ui- の名前（components.css・base.css）', () => {
    const defined = definedVars();
    for (const [f, css] of [
      ['components.css', componentsCss()],
      ['base.css', baseCss()],
    ]) {
      const used = [...stripComments(css).matchAll(/var\(\s*(--[a-z0-9-]+)/g)].map((m) => m[1]);
      assert.ok(
        used.length >= (f === 'components.css' ? 50 : 3),
        `${f} が変数をほとんど使っていない`,
      );
      for (const name of used) {
        assert.ok(name.startsWith('--ui-'), `${f}: ${name} は --ui- ではない`);
        assert.ok(defined.has(name), `${f}: ${name} は tokens.css に無い`);
      }
      assert.doesNotMatch(
        stripComments(css),
        /(?<![\w-])--[a-z0-9-]+\s*:/,
        `${f} で変数を定義しない（値は tokens.css だけ）`,
      );
    }
  });

  it('components.css の規則はすべて .tsk- の class から始まる（要素の名前だけ・:root・* の規則が無い。is-* は添えてよい）', () => {
    const list = selectors(componentsCss());
    assert.ok(list.length > 40, `規則が少なすぎる: ${list.length}`);
    for (const prelude of list) {
      for (const sel of prelude.split(',').map((s) => s.trim())) {
        const head = sel.split(/[\s>+~]+/)[0];
        assert.match(
          head,
          /^[a-z]*\.tsk-[a-z0-9_-]+/,
          `「${sel}」は .tsk- の class から始まらない`,
        );
        for (const m of sel.matchAll(/\.([a-zA-Z0-9_-]+)/g)) {
          assert.ok(
            m[1].startsWith('tsk-') || /^is-[a-z-]+$/.test(m[1]),
            `「${sel}」の class「${m[1]}」は tsk- でも is- でもない`,
          );
        }
      }
    }
  });

  it('base.css は土台の要素の規則だけ（class を使わない。決まった6つのセレクタ）', () => {
    const list = selectors(baseCss()).flatMap((p) => p.split(',').map((s) => s.trim()));
    assert.deepEqual(list, [
      'html',
      'html:has(:modal)',
      'body:has(:modal)',
      ':where(a):any-link',
      ':where(a):any-link:hover',
      ':focus-visible',
    ]);
  });

  it('部品の CSS は外のものを読まない・強制しない（@import・url(・!important が無い）', () => {
    for (const css of [componentsCss(), baseCss()])
      assert.doesNotMatch(stripComments(css), /@import|url\(|!important/);
  });
});

// ---------------------------------------------------------------------------------------------
// 間隔の px の直書きを機械で止める（登記議事録つくるさん uicss の「波4 レーンT」のうち、部品の CSS の分）。
//   - 対象の宣言: margin*・padding*・gap*・inset*・top/right/bottom/left
//   - 3px 以上の px の直書きは、var(--ui-space-*) などのトークンにするか、下の PX_EXCEPTIONS に1行ずつ理由つきで載せる
//   - 2px 以下（罫線1本ぶんの補正・隣との詰め）は「数 px の微調整」として許す
//   - 表の行が実物に無ければ（直した・消した）表のほうを落とす（古い例外を残さない）
// ---------------------------------------------------------------------------------------------
const PX_TOLERANCE = 2;
const SPACING_PROP =
  /^(?:margin|padding|gap|row-gap|column-gap|inset|top|right|bottom|left)(?:-[a-z-]+)?$/;

/** 間隔の px の直書き（許容を超えるもの）を `prop: value` で並べる。var(...) の中は見ない */
function pxLiterals(cssText) {
  const found = [];
  const css = stripComments(cssText);
  for (const m of css.matchAll(/(?:^|[{;])\s*([a-z-]+)\s*:\s*([^;{}]+)/g)) {
    const [, prop, raw] = m;
    if (!SPACING_PROP.test(prop)) continue;
    const value = raw.replace(/!important/i, '').trim();
    const bare = value.replace(/var\((?:[^()]|\([^()]*\))*\)/g, ' ');
    const over = [...bare.matchAll(/(?<![\w.#-])(-?\d*\.?\d+)px/g)].some(
      (n) => Math.abs(Number(n[1])) > PX_TOLERANCE,
    );
    if (over) found.push({ prop, value });
  }
  return found;
}

/** [ファイル, 宣言の名前, 値, 理由]。登記議事録つくるさんの表の、部品の CSS の行をそのまま移した */
const PX_EXCEPTIONS = [
  [
    'ui/components.css',
    'gap',
    '10px',
    '.tsk-msg・.tsk-toasts・.tsk-toast・.tsk-steps__item の並び。ui-guidelines の寸法（4px 刻みの space に無い値）',
  ],
  [
    'ui/components.css',
    'gap',
    '6px',
    '.tsk-field・.tsk-field__label・.tsk-field__error・.tsk-msg__body の並び。ラベル・欄・1行の間（4px と 8px の間の値。ui-guidelines の寸法）',
  ],
  [
    'ui/components.css',
    'margin',
    '2px 0 6px 42px',
    '.tsk-steps__sub の字下げ。番号の円の幅ぶん（図形の寸法）',
  ],
  [
    'ui/components.css',
    'margin',
    '3px 0 0',
    '.tsk-check__input の位置合わせ。ラベルの1行目の高さに合わせる',
  ],
  ['ui/components.css', 'margin-top', '-7px', '.tsk-select__chevron の位置合わせ（図形の位置）'],
  [
    'ui/components.css',
    'margin-top',
    '3px',
    '.tsk-msg・.tsk-toast のアイコンの位置合わせ。1行目の高さに合わせる',
  ],
  [
    'ui/components.css',
    'padding',
    '0 10px',
    '.tsk-btn--sm・.tsk-input・.tsk-seg__btn の左右。ui-guidelines の寸法（4px 刻みの space に無い値）',
  ],
  [
    'ui/components.css',
    'padding',
    '0 14px',
    '.tsk-btn の左右。ui-guidelines の寸法（4px 刻みの space に無い値）',
  ],
  [
    'ui/components.css',
    'padding',
    '0 32px 0 10px',
    '.tsk-select__control の左右。右は矢印のぶんを空ける',
  ],
  [
    'ui/components.css',
    'padding',
    '10px 14px',
    '.tsk-table th の内側。ui-guidelines の寸法（4px 刻みの space に無い値）',
  ],
  ['ui/components.css', 'padding', '11px 14px', '.tsk-table td の内側。行の高さに合わせた値'],
  [
    'ui/components.css',
    'padding',
    '14px 14px 14px 18px',
    '.tsk-drawer__head の内側。左だけ広い（ドロワーの寸法）',
  ],
  [
    'ui/components.css',
    'padding',
    '14px var(--ui-space-4)',
    '.tsk-card__head の上下。ui-guidelines の寸法（4px 刻みの space に無い値）',
  ],
  ['ui/components.css', 'padding', '18px', '.tsk-drawer__body の内側。ドロワーの寸法'],
  ['ui/components.css', 'padding', '6px 10px', '.tsk-steps__item の内側。手順の目次の項目の寸法'],
  [
    'ui/components.css',
    'padding',
    'var(--ui-space-2) 10px',
    'textarea.tsk-input の内側。入力欄の左右 10px にそろえる',
  ],
  [
    'ui/components.css',
    'padding',
    'var(--ui-space-3) 10px var(--ui-space-3) 14px',
    '.tsk-toast の内側。右の × のぶんだけ狭い',
  ],
  [
    'ui/components.css',
    'padding',
    'var(--ui-space-3) 14px',
    '.tsk-msg・.tsk-drawer__foot の内側。ui-guidelines の寸法（4px 刻みの space に無い値）',
  ],
  ['ui/components.css', 'right', '10px', '.tsk-select__chevron の位置（図形の位置）'],
];

describe('部品の CSS の間隔の px の直書き', () => {
  it('3px 以上の直書きは、理由つきの例外の表（PX_EXCEPTIONS）に載っているものだけ。表の行は実物にあり、理由が空でない', () => {
    const table = new Map(PX_EXCEPTIONS.map(([f, p, v, why]) => [`${f}|${p}: ${v}`, why]));
    assert.equal(table.size, PX_EXCEPTIONS.length, '表に同じ行が2つある');
    const seen = new Set();
    const unlisted = [];
    for (const rel of ['ui/base.css', 'ui/components.css']) {
      for (const { prop, value } of pxLiterals(read(path.join(CORE, rel)))) {
        const key = `${rel}|${prop}: ${value}`;
        seen.add(key);
        if (!table.has(key)) unlisted.push(`${rel}  ${prop}: ${value}`);
      }
    }
    assert.deepEqual(
      unlisted,
      [],
      '表に無い px の直書き（トークンにするか、理由つきで PX_EXCEPTIONS に足す）',
    );
    assert.deepEqual(
      [...table.keys()].filter((k) => !seen.has(k)),
      [],
      '実物に無い例外の行（表から消す）',
    );
    for (const [key, why] of table)
      assert.ok(String(why).trim().length >= 10, `${key} の理由が短い`);
  });

  it('検査そのものが、3px 以上の直書き（calc の中・負の値・複数の値のうち1つ・小数）を見つけ、トークン・2px 以下・px 以外・関係の無い宣言は止めない', () => {
    for (const bad of [
      '.a{padding:7px}',
      '.a{margin:0 0 3px}',
      '.a{gap:calc(var(--ui-space-2) + 4px)}',
      '.a{margin-top:-5px}',
      '.a{padding:var(--ui-space-2) 10px}',
      '.a{top:2.5px}',
      '.a{inset:0 0 0 9px}',
    ]) {
      assert.ok(pxLiterals(bad).length > 0, `見逃した: ${bad}`);
    }
    for (const good of [
      '.a{padding:var(--ui-space-3)}',
      '.a{margin:-1px}',
      '.a{gap:2px}',
      '.a{padding:var(--ui-space-2) 2px}',
      '.a{width:240px}',
      '.a{border:1px solid red}',
      '.a{padding:0}',
      '.a{margin:0 auto}',
      '.a{padding:1em}',
      '.a{border-radius:10px}',
      '/* padding:9px */.a{padding:var(--ui-space-1)}',
    ]) {
      assert.deepEqual(pxLiterals(good), [], `誤って止めた: ${good}`);
    }
  });
});
