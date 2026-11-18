// 外枠（ui/shell.css・ui/shell.js）の決まりと振る舞い。設計は docs/stage2-log.md の「外枠の設計（0.2.0）」。
// JS は test/fakedom.mjs の作り物の DOM で動かす（inert の中・隠れた要素・無効な要素へは focus() しても移らない）。
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { UI, read, stripComments } from './helpers.mjs';
import { FakeDocument, FakeEvent, evalMedia, fakeWindow } from './fakedom.mjs';
import { attachShell, SHELL_MEDIA, SHELL_TARGETS } from '../ui/shell.js';
import { openDrawer } from '../ui/drawer.js';

const WIDTH = Object.freeze({ wide: 1440, mid: 1024, narrow: 390 });
const PARTS = Object.freeze({
  topbar: 'tsk-shell__topbar',
  side: 'tsk-shell__side',
  sideHead: 'tsk-shell__side-head',
  rail: 'tsk-shell__rail',
  sidebar: 'tsk-shell__sidebar',
  page: 'tsk-shell__page',
  panel: 'tsk-shell__panel',
});

/* ------------------------------------------------------------------ 見本の DOM（設計案の「HTML の形」） */

function buildShell({
  width = WIDTH.wide,
  sidebar = 'open',
  panel = 'closed',
  rail = 'shown',
} = {}) {
  const doc = new FakeDocument();
  const win = fakeWindow({ width });
  const el = (tag, attrs = {}, ...kids) => {
    const n = doc.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    for (const c of kids) n.appendChild(c);
    return n;
  };
  const btn = (id, attrs = {}) => el('button', { id, type: 'button', ...attrs });
  const root = el(
    'div',
    { class: 'tsk-shell', 'data-sidebar': sidebar, 'data-panel': panel, 'data-rail': rail },
    el(
      'header',
      { class: 'tsk-shell__topbar' },
      el(
        'div',
        { class: 'tsk-shell__start' },
        el('span', { class: 'tsk-shell__history' }, btn('back'), btn('forward')),
        btn('tog-sidebar', { class: 'tsk-iconbtn', 'data-shell-toggle': 'sidebar' }),
      ),
      el('nav', { class: 'tsk-shell__crumbs', 'aria-label': 'パンくず' }),
      el(
        'div',
        { class: 'tsk-shell__end' },
        btn('action'),
        btn('tog-panel', { class: 'tsk-iconbtn', 'data-shell-toggle': 'panel' }),
      ),
    ),
    el(
      'div',
      { class: 'tsk-shell__body' },
      el(
        'div',
        { class: 'tsk-shell__side', 'aria-label': 'メニュー' },
        el(
          'div',
          { class: 'tsk-shell__side-head' },
          btn('client'),
          btn('side-close', { 'data-shell-close': '' }),
        ),
        el(
          'nav',
          { class: 'tsk-shell__rail', 'aria-label': 'アプリの切り替え' },
          el('a', { id: 'app1', class: 'tsk-shell__app', href: '#a1' }),
          el('a', { id: 'app2', class: 'tsk-shell__app', href: '#a2' }),
        ),
        el(
          'div',
          { class: 'tsk-shell__sidebar', 'aria-label': 'カレンダーのメニュー' },
          el(
            'nav',
            { class: 'tsk-shell__nav', 'aria-label': '画面' },
            el('a', { id: 'nav1', class: 'tsk-shell__nav-item', href: '#n1' }),
            el('a', { id: 'nav2', class: 'tsk-shell__nav-item', href: '#n2' }),
          ),
        ),
      ),
      el(
        'div',
        { class: 'tsk-shell__face' },
        el('main', { class: 'tsk-shell__page' }, btn('page-btn')),
        el(
          'aside',
          { class: 'tsk-shell__panel', 'aria-label': '詳細' },
          btn('panel-first'),
          btn('panel-close', { 'data-shell-close': '' }),
        ),
      ),
    ),
  );
  doc.body.appendChild(root);
  const outside = btn('outside');
  doc.body.appendChild(outside);
  const $ = (id) => doc.byId(id);
  const part = (k) => root.byClass(PARTS[k]);
  const key = (name, extra = {}) =>
    doc.activeElement.dispatchEvent(new FakeEvent('keydown', { key: name, ...extra }));
  return { doc, win, root, $, part, key, outside, el };
}

/** 要素を親の先頭に入れる（作り物の DOM には insertBefore が無い） */
function prepend(parent, child) {
  parent.appendChild(child);
  parent.children.unshift(parent.children.pop());
}

/* ------------------------------------------------------------------ inert の割り当て表（設計案のまま写す） */

const T = true;
const F = false;
/** R = data-rail="hidden" のときだけ付ける。'!sidebar'・'!panel' = その好みが closed なら付ける */
const TABLE = Object.freeze({
  'wide·none': {
    topbar: F,
    side: F,
    sideHead: T,
    rail: 'R',
    sidebar: '!sidebar',
    page: F,
    panel: '!panel',
    dialog: null,
  },
  'mid·none': {
    topbar: F,
    side: F,
    sideHead: T,
    rail: 'R',
    sidebar: T,
    page: F,
    panel: T,
    dialog: null,
  },
  'mid·sidebar': {
    topbar: T,
    side: F,
    sideHead: T,
    rail: T,
    sidebar: F,
    page: T,
    panel: T,
    dialog: 'sidebar',
  },
  'mid·panel': {
    topbar: T,
    side: T,
    sideHead: T,
    rail: T,
    sidebar: T,
    page: T,
    panel: F,
    dialog: 'panel',
  },
  'narrow·none': {
    topbar: F,
    side: T,
    sideHead: T,
    rail: T,
    sidebar: T,
    page: F,
    panel: T,
    dialog: null,
  },
  'narrow·sidebar': {
    topbar: T,
    side: F,
    sideHead: F,
    rail: 'R',
    sidebar: F,
    page: T,
    panel: T,
    dialog: 'side',
  },
  'narrow·panel': {
    topbar: T,
    side: T,
    sideHead: T,
    rail: T,
    sidebar: T,
    page: T,
    panel: F,
    dialog: 'panel',
  },
});

function expected(row, { rail = 'shown', sidebar = 'open', panel = 'closed' } = {}) {
  const want = {};
  for (const k of Object.keys(PARTS)) {
    const v = row[k];
    if (v === 'R') want[k] = rail === 'hidden';
    else if (v === '!sidebar') want[k] = sidebar === 'closed';
    else if (v === '!panel') want[k] = panel === 'closed';
    else want[k] = v;
  }
  return want;
}

const actual = (part) =>
  Object.fromEntries(Object.keys(PARTS).map((k) => [k, part(k).hasAttribute('inert')]));

describe('外枠（ui/shell.js）: 作り物の DOM の確かめ（段2 の「実装の前に確かめる」）', () => {
  it('inert の中・隠れた要素・visibility:hidden・無効な要素・無効な fieldset の中・フォーカスできない要素へは focus() しても activeElement が変わらない', () => {
    const doc = new FakeDocument();
    const make = (tag, attrs = {}, parent = doc.body) => {
      const n = doc.createElement(tag);
      for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
      parent.appendChild(n);
      return n;
    };
    const ok = make('button');
    ok.focus();
    assert.equal(doc.activeElement, ok, '普通のボタンには移る');
    const inInert = make('button', {}, make('div', { inert: '' }));
    const hidden = make('button');
    hidden.style.display = 'none';
    const invisible = make('button');
    invisible.style.visibility = 'hidden';
    const disabled = make('button', { disabled: '' });
    const inFieldset = make('input', {}, make('fieldset', { disabled: '' }));
    const plain = make('div');
    for (const n of [inInert, hidden, invisible, disabled, inFieldset, plain]) {
      n.focus();
      assert.equal(doc.activeElement, ok, `${n.tagName} へは移らない`);
    }
    assert.ok(inFieldset.matches(':disabled'), '無効な fieldset の中の入力欄は :disabled');
    const withTabindex = make('div', { tabindex: '-1' });
    withTabindex.focus();
    assert.equal(doc.activeElement, withTabindex, 'tabindex="-1" の要素には focus() で移る');
  });
});

describe('外枠（ui/shell.js）: つなぐ・属性の持ち主', () => {
  it('つなぐと幅の段を data-mode に書き、data-overlay="none" から始め、覆いを __body の中に足す', () => {
    for (const [mode, width] of Object.entries(WIDTH)) {
      const { root, part, win, doc } = buildShell({ width });
      const shell = attachShell(root, { doc, win });
      assert.equal(root.getAttribute('data-mode'), mode);
      assert.equal(root.getAttribute('data-overlay'), 'none');
      const scrim = root.byClass('tsk-shell__scrim');
      assert.ok(scrim, '覆いがある');
      assert.equal(scrim.parentNode, root.byClass('tsk-shell__body'));
      assert.equal(scrim.getAttribute('aria-hidden'), 'true');
      assert.equal(part('page').getAttribute('tabindex'), '-1', '本文は最後の戻り先');
      shell.destroy();
    }
  });

  it('幅の段の文字列は3つで、端数の幅（767.5・1199.5）でもどれか1つだけに当たる', () => {
    assert.deepEqual(Object.keys(SHELL_MEDIA), ['wide', 'mid', 'narrow']);
    for (const w of [0, 390, 767, 767.5, 768, 1024, 1199, 1199.5, 1200, 1440]) {
      const hits = Object.values(SHELL_MEDIA).filter((q) => evalMedia(q, { width: w }));
      assert.equal(hits.length, 1, `${w}px`);
    }
  });

  it('onRequest が無いとき、wide の toggle は data-sidebar・data-panel を書く。data-rail は書かない', () => {
    const { root, win, part, $, doc } = buildShell({ panel: 'closed' });
    const shell = attachShell(root, { doc, win });
    shell.toggle('panel');
    assert.equal(root.getAttribute('data-panel'), 'open');
    assert.ok(!part('panel').hasAttribute('inert'), 'すぐに計算し直す');
    assert.equal($('tog-panel').getAttribute('aria-expanded'), 'true');
    shell.toggle('sidebar');
    assert.equal(root.getAttribute('data-sidebar'), 'closed');
    assert.equal(root.getAttribute('data-rail'), 'shown');
    shell.destroy();
  });

  it('onRequest があるとき、wide の toggle は DOM を書かず、呼ばれた時点の DOM の逆を絶対値で求める（控えを持たない）', () => {
    const { root, win, doc } = buildShell({ panel: 'closed', sidebar: 'open' });
    const reqs = [];
    const shell = attachShell(root, { doc, win, onRequest: (r) => reqs.push(r) });
    shell.toggle('panel');
    shell.toggle('panel'); // 反映の前に続けて押す → 同じ求め（絶対値なので矛盾しない）
    const want = (target, open) => ({ kind: 'preference', target, open, reason: 'toggle' });
    assert.deepEqual(reqs, [want('panel', true), want('panel', true)]);
    assert.equal(root.getAttribute('data-panel'), 'closed', 'shell.js は data-panel を書かない');
    root.setAttribute('data-panel', 'open'); // 使う側が反映
    shell.toggle('panel');
    shell.toggle('sidebar');
    assert.deepEqual(reqs.slice(2), [want('panel', false), want('sidebar', false)]);
    shell.destroy();
  });

  it('使う側が data-panel・data-rail を書き換えると、MutationObserver で計算し直す', () => {
    const { root, win, part, $, doc } = buildShell({ panel: 'closed' });
    const shell = attachShell(root, { doc, win, onRequest: () => {} });
    assert.ok(part('panel').hasAttribute('inert'));
    root.setAttribute('data-panel', 'open');
    root.setAttribute('data-rail', 'hidden');
    win.flushMutations();
    assert.ok(!part('panel').hasAttribute('inert'));
    assert.ok(part('rail').hasAttribute('inert'));
    assert.equal($('tog-panel').getAttribute('aria-expanded'), 'true');
    shell.destroy();
  });

  it('wide の右パネルの中の [data-shell-close] は、好みを閉じる求め（reason: close）にする', () => {
    const { root, win, $, doc } = buildShell({ panel: 'open' });
    const reqs = [];
    const shell = attachShell(root, { doc, win, onRequest: (r) => reqs.push(r) });
    $('panel-close').click();
    assert.deepEqual(reqs, [{ kind: 'preference', target: 'panel', open: false, reason: 'close' }]);
    shell.destroy();
  });

  it('知らない対象の toggle は理由つきで止める。destroy のあとの toggle・close は何もしない', () => {
    const { root, win, doc } = buildShell();
    const shell = attachShell(root, { doc, win });
    assert.throws(() => shell.toggle('tabs'), /toggle の対象は sidebar・panel/);
    assert.deepEqual([...SHELL_TARGETS], ['sidebar', 'panel']);
    shell.destroy();
    shell.toggle('panel');
    shell.close();
    assert.equal(root.getAttribute('data-panel'), 'closed');
  });
});

describe('外枠（ui/shell.js）: inert の割り当て表（段 × 重ねもの × 好み × data-rail の全組み合わせ）', () => {
  const PREFS = [
    { sidebar: 'open', panel: 'open' },
    { sidebar: 'open', panel: 'closed' },
    { sidebar: 'closed', panel: 'open' },
    { sidebar: 'closed', panel: 'closed' },
  ];
  for (const [name, row] of Object.entries(TABLE)) {
    const [mode, overlay] = name.split('·');
    for (const rail of ['shown', 'hidden']) {
      for (const prefs of PREFS) {
        it(`${name}・rail ${rail}・sidebar ${prefs.sidebar}・panel ${prefs.panel}`, () => {
          const { root, win, part, $, doc } = buildShell({ width: WIDTH[mode], rail, ...prefs });
          const shell = attachShell(root, { doc, win });
          if (overlay !== 'none') shell.toggle(overlay);
          assert.equal(root.getAttribute('data-overlay'), overlay);
          assert.deepEqual(actual(part), expected(row, { rail, ...prefs }));
          for (const k of ['side', 'sidebar', 'panel']) {
            const isDialog = row.dialog === k;
            assert.equal(part(k).getAttribute('role'), isDialog ? 'dialog' : null, `${k} の role`);
            assert.equal(part(k).getAttribute('aria-modal'), isDialog ? 'true' : null);
            assert.equal(part(k).getAttribute('tabindex'), isDialog ? '-1' : null);
          }
          const open = (t) => (mode === 'wide' ? prefs[t] === 'open' : overlay === t);
          assert.equal($('tog-sidebar').getAttribute('aria-expanded'), String(open('sidebar')));
          assert.equal($('tog-panel').getAttribute('aria-expanded'), String(open('panel')));
          shell.destroy();
        });
      }
    }
  }

  it('ダイアログになる要素とその祖先には inert を付けない（3つのダイアログすべて）', () => {
    for (const [mode, overlay, dialogKey] of [
      ['mid', 'sidebar', 'sidebar'],
      ['narrow', 'sidebar', 'side'],
      ['mid', 'panel', 'panel'],
      ['narrow', 'panel', 'panel'],
    ]) {
      const { root, win, part, doc } = buildShell({ width: WIDTH[mode] });
      const shell = attachShell(root, { doc, win });
      shell.toggle(overlay);
      for (let n = part(dialogKey); n && n.getAttribute; n = n.parentNode)
        assert.ok(!n.hasAttribute('inert'), `${mode}・${overlay}: ${n.className || n.tagName}`);
      shell.destroy();
    }
  });
});

describe('外枠（ui/shell.js）: 重ねて出す・閉じる・フォーカス', () => {
  it('mid でサイドバーを開くと中の最初の候補へ。右パネルへ入れ替え、閉じると開いたボタンへ戻る', () => {
    const { root, win, $, doc } = buildShell({ width: WIDTH.mid });
    const shell = attachShell(root, { doc, win });
    $('tog-sidebar').focus();
    $('tog-sidebar').click();
    assert.equal(root.getAttribute('data-overlay'), 'sidebar');
    assert.equal(doc.activeElement, $('nav1'));
    shell.toggle('panel', $('tog-panel'));
    assert.equal(
      root.getAttribute('data-overlay'),
      'panel',
      '別のものが開いていれば閉じてから開く',
    );
    assert.equal(doc.activeElement, $('panel-first'));
    shell.close();
    assert.equal(root.getAttribute('data-overlay'), 'none');
    assert.equal(doc.activeElement, $('tog-panel'));
    shell.destroy();
  });

  it('narrow でサイドバーを開くと __side がダイアログになり、引き出しの先頭の最初の候補へ', () => {
    const { root, win, $, doc, part } = buildShell({ width: WIDTH.narrow });
    const shell = attachShell(root, { doc, win });
    $('tog-sidebar').focus();
    $('tog-sidebar').click();
    assert.equal(part('side').getAttribute('role'), 'dialog');
    assert.equal(doc.activeElement, $('client'));
    $('side-close').click();
    assert.equal(root.getAttribute('data-overlay'), 'none');
    assert.equal(doc.activeElement, $('tog-sidebar'));
    shell.destroy();
  });

  it('候補が0件の重ねものを開くと、ダイアログ要素そのものへ', () => {
    const { root, win, $, doc, part } = buildShell({ width: WIDTH.mid });
    $('panel-first').remove();
    $('panel-close').remove();
    const shell = attachShell(root, { doc, win });
    shell.toggle('panel', $('tog-panel'));
    assert.equal(doc.activeElement, part('panel'));
    shell.destroy();
  });

  it('覆いを押す・[data-shell-close] を押すと閉じる', () => {
    const { root, win, $, doc } = buildShell({ width: WIDTH.mid });
    const shell = attachShell(root, { doc, win });
    shell.toggle('panel', $('tog-panel'));
    root.byClass('tsk-shell__scrim').click();
    assert.equal(root.getAttribute('data-overlay'), 'none');
    shell.toggle('panel', $('tog-panel'));
    $('panel-close').click();
    assert.equal(root.getAttribute('data-overlay'), 'none');
    assert.equal(doc.activeElement, $('tog-panel'));
    shell.destroy();
  });

  it('戻り先の順番: 開いたボタン → 同じ data-shell-toggle の別のボタン → __page', () => {
    const { root, win, $, doc, part, el } = buildShell({ width: WIDTH.mid });
    const extra = el('button', { id: 'tog-panel-2', 'data-shell-toggle': 'panel' });
    part('page').appendChild(extra);
    const shell = attachShell(root, { doc, win });
    shell.toggle('panel', $('tog-panel'));
    $('tog-panel').remove(); // 開いたボタンが消えた
    shell.close();
    assert.equal(doc.activeElement, extra, '同じ data-shell-toggle の別のボタンへ');
    shell.toggle('panel', extra);
    extra.style.display = 'none'; // 隠れた（focus しても移らない）
    shell.close();
    assert.equal(doc.activeElement, part('page'), '最後は __page');
    shell.destroy();
  });

  it('close() は、フォーカスが外枠の外（ドロワーなど）にあるときは動かさない', () => {
    const { root, win, $, doc, outside } = buildShell({ width: WIDTH.mid });
    const shell = attachShell(root, { doc, win });
    shell.toggle('panel', $('tog-panel'));
    outside.focus();
    shell.close();
    assert.equal(doc.activeElement, outside);
    shell.destroy();
  });

  it('幅が段をまたぐと data-overlay="none" にし、重ねものの inert を残さない。フォーカスが外枠の中なら戻す', () => {
    const { root, win, $, doc, part } = buildShell({ width: WIDTH.narrow });
    const shell = attachShell(root, { doc, win });
    $('tog-sidebar').focus();
    $('tog-sidebar').click();
    assert.equal(doc.activeElement, $('client'));
    win.setWidth(WIDTH.mid);
    assert.equal(root.getAttribute('data-mode'), 'mid');
    assert.equal(root.getAttribute('data-overlay'), 'none');
    assert.deepEqual(actual(part), expected(TABLE['mid·none']));
    assert.equal(part('side').getAttribute('role'), null);
    assert.equal(doc.activeElement, $('tog-sidebar'));
    win.setWidth(WIDTH.wide);
    assert.equal(root.getAttribute('data-mode'), 'wide');
    assert.deepEqual(actual(part), expected(TABLE['wide·none']));
    shell.destroy();
  });

  it('幅が段をまたいでも、フォーカスが外枠の外にあれば動かさない。遅れて届いた好みの反映は重ねものを開かない', () => {
    const { root, win, $, doc, outside } = buildShell({ width: WIDTH.mid });
    const shell = attachShell(root, { doc, win, onRequest: () => {} });
    shell.toggle('panel', $('tog-panel'));
    outside.focus();
    win.setWidth(WIDTH.wide);
    assert.equal(doc.activeElement, outside);
    root.setAttribute('data-panel', 'open');
    win.flushMutations();
    assert.equal(root.getAttribute('data-overlay'), 'none');
    shell.destroy();
  });

  it('wide でサイドバーの中にフォーカスがあるまま閉じると、サイドバーの開閉ボタンへ移す', () => {
    const { root, win, $, doc } = buildShell({ width: WIDTH.wide });
    const shell = attachShell(root, { doc, win });
    $('nav1').focus();
    shell.toggle('sidebar');
    assert.equal(doc.activeElement, $('tog-sidebar'));
    shell.destroy();
  });

  it('wide から mid へ幅を変えたとき、閉じた領域（サイドバー）にフォーカスがあれば開閉ボタンへ移す', () => {
    const { root, win, $, doc } = buildShell({ width: WIDTH.wide });
    const shell = attachShell(root, { doc, win });
    $('nav1').focus();
    win.setWidth(WIDTH.mid);
    assert.equal(doc.activeElement, $('tog-sidebar'));
    shell.destroy();
  });
});

describe('外枠（ui/shell.js）: 段をまたいだ直後は動かさない', () => {
  it('段をまたぐと data-switching を付け、2こまのあとに外す。同じ段の中の幅の変化では付けない', () => {
    const { root, win, doc } = buildShell({ width: WIDTH.mid });
    const shell = attachShell(root, { doc, win });
    assert.equal(root.getAttribute('data-switching'), null, 'つないだだけでは付けない');
    win.setWidth(900);
    assert.equal(root.getAttribute('data-switching'), null, '同じ段の中');
    win.setWidth(WIDTH.narrow);
    assert.equal(root.getAttribute('data-switching'), '');
    win.advance(16);
    assert.equal(root.getAttribute('data-switching'), '', '1こまではまだ');
    win.advance(16);
    assert.equal(root.getAttribute('data-switching'), null, '2こまで外す');
    shell.destroy();
  });

  it('destroy は予約したこまを無効にし、data-switching を取り除く', () => {
    const { root, win, doc } = buildShell({ width: WIDTH.mid });
    const shell = attachShell(root, { doc, win });
    win.setWidth(WIDTH.wide);
    shell.destroy();
    assert.equal(root.getAttribute('data-switching'), null);
    root.setAttribute('data-switching', 'x'); // 予約が残っていれば、次のこまで消される
    win.advance(64);
    assert.equal(root.getAttribute('data-switching'), 'x', '予約は残っていない');
  });

  it('shell.css は data-switching のあいだ、重ねるもの・覆いの動きを止める（動きを減らす規則の前に置く）', () => {
    for (const part of ['side', 'sidebar', 'panel', 'scrim'])
      assert.equal(
        declOf(`.tsk-shell[data-switching] .tsk-shell__${part}`, 'transition-property'),
        'none',
        part,
      );
  });
});

describe('外枠（ui/shell.js）: Tab の折り返し', () => {
  const open = (width = WIDTH.mid, target = 'panel') => {
    const s = buildShell({ width });
    s.shell = attachShell(s.root, { doc: s.doc, win: s.win });
    s.shell.toggle(target, s.$(target === 'panel' ? 'tog-panel' : 'tog-sidebar'));
    return s;
  };

  it('最後で Tab → 最初へ、最初で Shift+Tab → 最後へ。ダイアログ要素そのものからも折り返す', () => {
    const { $, doc, key, part, shell } = open();
    assert.equal(doc.activeElement, $('panel-first'));
    $('panel-close').focus();
    key('Tab');
    assert.equal(doc.activeElement, $('panel-first'));
    key('Tab', { shiftKey: true });
    assert.equal(doc.activeElement, $('panel-close'));
    part('panel').focus();
    key('Tab');
    assert.equal(doc.activeElement, $('panel-first'));
    part('panel').focus();
    key('Tab', { shiftKey: true });
    assert.equal(doc.activeElement, $('panel-close'));
    shell.destroy();
  });

  it('中ほどの Tab は止めない（ブラウザに任せる）', () => {
    const { $, doc, shell } = open();
    const evt = new FakeEvent('keydown', { key: 'Tab' });
    $('panel-first').dispatchEvent(evt);
    assert.equal(evt.defaultPrevented, false);
    assert.equal(doc.activeElement, $('panel-first'));
    shell.destroy();
  });

  it('最初・最後の候補が隠れていたら飛ばす（display:none・visibility:hidden・tabindex="-1"・inert の中）', () => {
    const { $, doc, key, part, shell, el } = open();
    const p = part('panel');
    const hiddenFirst = el('button', { id: 'hidden-first' });
    hiddenFirst.style.display = 'none';
    prepend(p, hiddenFirst);
    const invisibleLast = el('button', { id: 'invisible-last' });
    invisibleLast.style.visibility = 'hidden';
    p.appendChild(invisibleLast);
    p.appendChild(el('button', { id: 'negative', tabindex: '-1' }));
    p.appendChild(el('div', { inert: '' }, el('button', { id: 'in-inert' })));
    $('panel-close').focus();
    key('Tab');
    assert.equal(doc.activeElement, $('panel-first'));
    key('Tab', { shiftKey: true });
    assert.equal(doc.activeElement, $('panel-close'));
    shell.destroy();
  });

  it('候補が0件なら Tab・Shift+Tab を止めてダイアログ要素に留める', () => {
    const { $, doc, part, shell } = open();
    $('panel-first').remove();
    $('panel-close').style.display = 'none';
    part('panel').focus();
    for (const shiftKey of [false, true]) {
      const evt = new FakeEvent('keydown', { key: 'Tab', shiftKey });
      doc.activeElement.dispatchEvent(evt);
      assert.equal(evt.defaultPrevented, true);
      assert.equal(doc.activeElement, part('panel'));
    }
    shell.destroy();
  });

  it('先頭が無効な fieldset の中の入力欄・末尾が閉じるボタンなら、末尾の Tab は正しい先頭へ。無効な入力欄だけなら0件として留まる', () => {
    const { $, doc, key, part, shell, el } = open();
    const p = part('panel');
    prepend(p, el('fieldset', { disabled: '' }, el('input', { id: 'fs-input' })));
    $('panel-close').focus();
    key('Tab');
    assert.equal(doc.activeElement, $('panel-first'), '無効な入力欄を飛ばして先頭へ');
    $('panel-first').remove();
    $('panel-close').remove();
    p.focus();
    const evt = new FakeEvent('keydown', { key: 'Tab' });
    doc.activeElement.dispatchEvent(evt);
    assert.equal(evt.defaultPrevented, true);
    assert.equal(doc.activeElement, p, '無効な入力欄だけ → 0件');
    shell.destroy();
  });

  it('末尾が tabindex の無い編集欄（contenteditable）でも、末尾で Tab → 先頭へ。先頭で Shift+Tab → 編集欄へ（Codex 完了前の指摘1）', () => {
    const { $, doc, key, part, shell, el } = open();
    const editor = el('div', { id: 'editor', contenteditable: '' });
    part('panel').appendChild(editor);
    assert.equal(editor.tabIndex, -1, 'tabindex の無い編集欄の tabIndex は -1（ブラウザと同じ）');
    editor.focus();
    assert.equal(doc.activeElement, editor, '編集欄へは移れる');
    key('Tab');
    assert.equal(doc.activeElement, $('panel-first'));
    key('Tab', { shiftKey: true });
    assert.equal(doc.activeElement, editor);
    shell.destroy();
  });

  it('編集欄でも tabindex="-1" なら候補にしない。編集欄の中の要素は入口ではない', () => {
    const { $, doc, key, part, shell, el } = open();
    part('panel').appendChild(el('div', { id: 'editor', contenteditable: 'true', tabindex: '-1' }));
    part('panel').appendChild(
      el('div', { id: 'host', contenteditable: 'plaintext-only' }, el('span', { id: 'inner' })),
    );
    $('host').focus();
    key('Tab');
    assert.equal(
      doc.activeElement,
      $('panel-first'),
      '末尾は host（inner・tabindex=-1 の編集欄は数えない）',
    );
    key('Tab', { shiftKey: true });
    assert.equal(doc.activeElement, $('host'));
    shell.destroy();
  });

  it('正の tabindex はブラウザと同じ順（正の値の小さい順が先、そのあと 0 と指定なしを文書の順）で端を決める（Codex 完了前の指摘2）', () => {
    const { doc, key, part, shell, el, root, win } = open();
    shell.destroy();
    const p = part('panel');
    p.textContent = '';
    p.appendChild(el('button', { id: 'A' }));
    p.appendChild(el('button', { id: 'B', tabindex: '1' }));
    p.appendChild(el('button', { id: 'C' }));
    p.appendChild(el('button', { id: 'D', tabindex: '2' }));
    p.appendChild(el('button', { id: 'E', tabindex: 'x' })); // 読めない値は指定なしと同じ
    p.appendChild(el('button', { id: 'F', tabindex: '1abc' })); // HTML の読み方では 1（数字のあとは無視）
    const s2 = attachShell(root, { doc, win });
    s2.toggle('panel', doc.byId('tog-panel'));
    assert.equal(doc.activeElement.id, 'B', '開くと Tab の順の最初（B）へ');
    doc.byId('F').focus();
    const shiftAtF = new FakeEvent('keydown', { key: 'Tab', shiftKey: true });
    doc.activeElement.dispatchEvent(shiftAtF);
    assert.equal(shiftAtF.defaultPrevented, false, 'F（"1abc" = 1）は B の次。先頭ではない');
    // Tab の順は B → F → D → A → C → E（F は "1abc" = 1。同じ値は文書の順）
    doc.byId('A').focus();
    const shiftAtA = new FakeEvent('keydown', { key: 'Tab', shiftKey: true });
    doc.activeElement.dispatchEvent(shiftAtA);
    assert.equal(shiftAtA.defaultPrevented, false, 'A は先頭ではない（ブラウザが D へ戻す）');
    doc.byId('E').focus();
    key('Tab');
    assert.equal(doc.activeElement.id, 'B', '末尾 E で Tab → 先頭 B');
    key('Tab', { shiftKey: true });
    assert.equal(doc.activeElement.id, 'E', '先頭 B で Shift+Tab → 末尾 E');
    doc.byId('C').focus();
    const tabAtC = new FakeEvent('keydown', { key: 'Tab' });
    doc.activeElement.dispatchEvent(tabAtC);
    assert.equal(tabAtC.defaultPrevented, false, 'C は末尾ではない');
    s2.destroy();
  });

  it('narrow の引き出しでは、data-rail="hidden" の列の中を候補にしない', () => {
    const s = buildShell({ width: WIDTH.narrow, rail: 'hidden' });
    const shell = attachShell(s.root, { doc: s.doc, win: s.win });
    shell.toggle('sidebar', s.$('tog-sidebar'));
    s.$('nav2').focus();
    s.key('Tab');
    assert.equal(s.doc.activeElement, s.$('client'), '列のアプリを飛ばして先頭へ');
    s.key('Tab', { shiftKey: true });
    assert.equal(s.doc.activeElement, s.$('nav2'));
    shell.destroy();
  });
});

describe('外枠（ui/shell.js）: Esc とドロワーとの重なり', () => {
  it('Esc は、フォーカスが重ねものの中か body のときだけ閉じる。外にあるとき・既に止められたときは閉じない', () => {
    const { root, win, $, doc, key, outside } = buildShell({ width: WIDTH.mid });
    const shell = attachShell(root, { doc, win });
    shell.toggle('panel', $('tog-panel'));
    key('Escape');
    assert.equal(root.getAttribute('data-overlay'), 'none');
    assert.equal(doc.activeElement, $('tog-panel'));
    shell.toggle('panel', $('tog-panel'));
    outside.focus();
    key('Escape');
    assert.equal(root.getAttribute('data-overlay'), 'panel', '外にあるときは閉じない');
    doc.activeElement = doc.body;
    const stopped = new FakeEvent('keydown', { key: 'Escape' });
    stopped.preventDefault();
    doc.body.dispatchEvent(stopped);
    assert.equal(root.getAttribute('data-overlay'), 'panel', '既に止められた Esc では閉じない');
    doc.body.dispatchEvent(new FakeEvent('keydown', { key: 'Escape' }));
    assert.equal(root.getAttribute('data-overlay'), 'none', 'body のときは閉じる');
    shell.destroy();
  });

  it('重ねものの上でドロワーを開く → Esc はドロワー → 重ねものの順に閉じる', () => {
    const { root, win, $, doc, key } = buildShell({ width: WIDTH.mid });
    const shell = attachShell(root, { doc, win });
    shell.toggle('panel', $('tog-panel'));
    const d = openDrawer({ doc, win, title: '詳細', opener: $('panel-first') });
    assert.ok(d.el.contains(doc.activeElement), 'ドロワーの中へ');
    key('Escape');
    assert.ok(!d.isOpen(), '1回目はドロワー');
    assert.equal(root.getAttribute('data-overlay'), 'panel');
    assert.equal(doc.activeElement, $('panel-first'), 'ドロワーを開いた要素へ戻る');
    key('Escape');
    assert.equal(root.getAttribute('data-overlay'), 'none', '2回目は重ねもの');
    shell.destroy();
  });

  it('ドロワーを開いているあいだ、外枠の Tab の折り返しは動かない（ドロワーが先に受ける）', () => {
    const { root, win, $, doc } = buildShell({ width: WIDTH.mid });
    const shell = attachShell(root, { doc, win });
    shell.toggle('panel', $('tog-panel'));
    const input = doc.createElement('input');
    const d = openDrawer({ doc, win, title: '詳細', body: input, opener: $('panel-first') });
    assert.equal(doc.activeElement, input);
    doc.activeElement.dispatchEvent(new FakeEvent('keydown', { key: 'Tab' }));
    assert.ok(d.el.contains(doc.activeElement), 'ドロワーの中に留まる');
    d.close();
    shell.destroy();
  });

  it('narrow の引き出しの中からドロワーを開き、mid へ幅を変えてから閉じる → fallbackFocus で __page へ', () => {
    const { root, win, $, doc, part } = buildShell({ width: WIDTH.narrow });
    const shell = attachShell(root, { doc, win });
    shell.toggle('sidebar', $('tog-sidebar'));
    $('client').focus();
    const d = openDrawer({
      doc,
      win,
      title: 'クライアント',
      opener: $('client'),
      fallbackFocus: () => part('page'),
    });
    win.setWidth(WIDTH.mid);
    assert.equal(root.getAttribute('data-overlay'), 'none');
    assert.ok(
      d.el.contains(doc.activeElement),
      '幅が変わってもドロワーの中のフォーカスは動かさない',
    );
    d.close();
    assert.equal(doc.activeElement, part('page'), '戻り先（引き出しの先頭）が隠れたので __page へ');
    shell.destroy();
  });
});

describe('外枠（ui/shell.js）: 外す・つなぎ直す', () => {
  it('destroy は監視とイベントを外し、shell.js が書いた属性と覆いを取り除く。使う側の属性は変えない。何度呼んでもよい', () => {
    const { root, win, $, doc, part } = buildShell({ width: WIDTH.mid, panel: 'open' });
    const docListeners = () => doc.listeners.length + doc.body.listeners.length;
    const before = docListeners();
    const shell = attachShell(root, { doc, win });
    shell.toggle('panel', $('tog-panel'));
    shell.destroy();
    shell.destroy();
    assert.equal(root.getAttribute('data-mode'), null);
    assert.equal(root.getAttribute('data-overlay'), null);
    assert.equal(root.byClass('tsk-shell__scrim'), null);
    for (const k of Object.keys(PARTS)) {
      assert.ok(!part(k).hasAttribute('inert'), `${k} の inert`);
      assert.equal(part(k).getAttribute('role'), null);
      assert.equal(part(k).getAttribute('aria-modal'), null);
      assert.equal(part(k).getAttribute('tabindex'), null);
    }
    assert.equal($('tog-panel').getAttribute('aria-expanded'), null);
    assert.equal($('tog-sidebar').getAttribute('aria-expanded'), null);
    assert.equal(root.getAttribute('data-panel'), 'open');
    assert.equal(root.getAttribute('data-sidebar'), 'open');
    assert.equal(root.getAttribute('data-rail'), 'shown');
    assert.equal(win.mediaListenerCount(), 0, 'matchMedia の change を外した');
    assert.equal(root.listeners.length, 0, '外枠の click・keydown を外した');
    assert.equal(docListeners(), before, 'document の keydown を外した');
    win.setWidth(WIDTH.narrow);
    root.setAttribute('data-panel', 'closed');
    win.flushMutations();
    assert.equal(root.getAttribute('data-mode'), null, '外したあとは何も書かない');
    assert.ok(!part('panel').hasAttribute('inert'));
  });

  it('つなぐ → 外す → つなぐ（React の StrictMode）がそのまま通る。つないだまま2つ目をつなぐと止める', () => {
    const { root, win, doc, $ } = buildShell({ width: WIDTH.mid });
    const a = attachShell(root, { doc, win });
    assert.throws(() => attachShell(root, { doc, win }), /もうつないである/);
    a.destroy();
    const b = attachShell(root, { doc, win });
    assert.equal(root.getAttribute('data-mode'), 'mid');
    const scrims = [...root.walk()].filter((n) => n.classList.contains('tsk-shell__scrim'));
    assert.equal(scrims.length, 1, '覆いは1つだけ');
    b.toggle('panel', $('tog-panel'));
    assert.equal(root.getAttribute('data-overlay'), 'panel');
    b.destroy();
  });
});

/* ------------------------------------------------------------------ shell.css の決まり */

const shellCss = () => read(path.join(UI, 'shell.css'));
const tokenNames = () =>
  new Set(
    [...read(path.join(UI, 'tokens.css')).matchAll(/(--ui-[a-z0-9-]+)\s*:/g)].map((m) => m[1]),
  );

/** 規則を {media, selector, decls} で並べる（@media の中に1段だけ降りる） */
function cssRules(css) {
  const out = [];
  const text = stripComments(css);
  const media = [];
  let buf = '';
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '{') {
      const prelude = buf.trim();
      buf = '';
      if (prelude.startsWith('@media')) {
        media.push(prelude.replace(/^@media\s*/, ''));
        continue;
      }
      const end = text.indexOf('}', i);
      const decls = new Map();
      for (const d of text.slice(i + 1, end).split(';')) {
        const k = d.indexOf(':');
        if (k > 0) decls.set(d.slice(0, k).trim(), d.slice(k + 1).trim());
      }
      out.push({ media: media.at(-1) ?? null, selector: prelude, decls });
      i = end;
    } else if (ch === '}') {
      media.pop();
      buf = '';
    } else buf += ch;
  }
  return out;
}
/** sel の規則（media を渡せばその @media の中だけ。null は @media の外）で、最後に書いた prop の値 */
const declOf = (sel, prop, media = null) => {
  const hits = cssRules(shellCss()).filter(
    (r) =>
      r.selector.split(',').some((s) => s.trim() === sel) && r.media === media && r.decls.has(prop),
  );
  return hits.length ? hits.at(-1).decls.get(prop) : undefined;
};

describe('外枠の CSS（ui/shell.css）', () => {
  it('使う変数はすべて tokens.css の --ui- の名前。変数を定義しない。外のものを読まない・強制しない', () => {
    const css = stripComments(shellCss());
    const defined = tokenNames();
    const used = [...css.matchAll(/var\(\s*(--[a-z0-9-]+)/g)].map((m) => m[1]);
    assert.ok(used.length >= 40, `変数をほとんど使っていない: ${used.length}`);
    for (const name of used) assert.ok(defined.has(name), `${name} は tokens.css に無い`);
    assert.doesNotMatch(css, /(?<![\w-])--[a-z0-9-]+\s*:/, '変数を定義しない');
    assert.doesNotMatch(css, /@import|url\(|!important/);
  });

  it('規則はすべて .tsk-shell から始まる（class は tsk- だけ）', () => {
    const rules = cssRules(shellCss());
    assert.ok(rules.length > 40, `規則が少なすぎる: ${rules.length}`);
    for (const { selector } of rules) {
      for (const sel of selector.split(',').map((s) => s.trim())) {
        assert.match(sel, /^\.tsk-shell/, `「${sel}」は .tsk-shell から始まらない`);
        for (const m of sel.matchAll(/\.([a-zA-Z0-9_-]+)/g))
          assert.ok(m[1].startsWith('tsk-'), `「${sel}」の class「${m[1]}」`);
      }
    }
  });

  it('幅の @media は shell.js の SHELL_MEDIA と同じ3つの文字列（ほかは動きを減らす設定だけ）', () => {
    const queries = new Set(
      [...stripComments(shellCss()).matchAll(/@media\s*([^{]+)\{/g)].map((m) => m[1].trim()),
    );
    assert.deepEqual(
      [...queries].sort(),
      [...Object.values(SHELL_MEDIA), '(prefers-reduced-motion: reduce)'].sort(),
    );
  });

  it('寸法は --ui-* を使う（上の行・列・項目・サイドバー・右パネル・本文の余白・角丸・影）', () => {
    const want = [
      ['.tsk-shell__topbar', 'height', 'var(--ui-topbar-h)'],
      ['.tsk-shell__rail', 'width', 'var(--ui-rail-w)'],
      ['.tsk-shell__app', 'width', 'var(--ui-rail-item)'],
      ['.tsk-shell__app', 'height', 'var(--ui-rail-item)'],
      ['.tsk-shell__sidebar', 'width', 'var(--ui-sidebar-w)'],
      ['.tsk-shell__sidebar', 'background', 'var(--ui-surface-sidebar)'],
      ['.tsk-shell__panel', 'width', 'calc(var(--ui-panel-w) - var(--ui-space-3))'],
      ['.tsk-shell__panel', 'border-radius', 'var(--ui-radius-2xl)'],
      ['.tsk-shell__panel', 'box-shadow', 'var(--ui-shadow-floating)'],
      ['.tsk-shell__panel', 'background', 'var(--ui-surface-panel)'],
      ['.tsk-shell__page', 'padding', 'var(--ui-space-6) var(--ui-page-pad-x)'],
      ['.tsk-shell__face', 'border-radius', 'var(--ui-radius-xl)'],
      ['.tsk-shell__face', 'background', 'var(--ui-surface-page)'],
      ['.tsk-shell__face', 'border', '1px solid var(--ui-border-middle)'],
      ['.tsk-shell', 'background', 'var(--ui-surface-app)'],
      ['.tsk-shell__nav-item', 'height', '34px'],
    ];
    for (const [sel, prop, value] of want) assert.equal(declOf(sel, prop), value, `${sel} ${prop}`);
    assert.equal(declOf('.tsk-shell__panel', 'width', SHELL_MEDIA.mid), 'var(--ui-panel-w)');
    assert.equal(declOf('.tsk-shell__sidebar', 'left', SHELL_MEDIA.mid), 'var(--ui-rail-w)');
  });

  it('narrow: 上の行・上の行のボタン・引き出しの中の行とアプリの項目は 44px。戻る・進むは隠す', () => {
    const n = SHELL_MEDIA.narrow;
    const want = [
      ['.tsk-shell__topbar', 'height', '44px'],
      ['.tsk-shell__topbar .tsk-iconbtn', 'width', '44px'],
      ['.tsk-shell__topbar .tsk-iconbtn', 'height', '44px'],
      ['.tsk-shell__start', 'gap', '0'],
      ['.tsk-shell__end', 'gap', '0'],
      ['.tsk-shell__nav-item', 'height', '44px'],
      ['.tsk-shell__app', 'height', '44px'],
      ['.tsk-shell__history', 'display', 'none'],
      ['.tsk-shell__side', 'width', 'min(var(--ui-rail-w) + var(--ui-sidebar-w), 100vw - 40px)'],
      ['.tsk-shell__panel', 'max-height', '80dvh'],
      ['.tsk-shell__panel', 'border-radius', 'var(--ui-radius-2xl) var(--ui-radius-2xl) 0 0'],
    ];
    for (const [sel, prop, value] of want)
      assert.equal(declOf(sel, prop, n), value, `${sel} ${prop}`);
  });

  it('narrow: 上の行と引き出しの先頭の文字のボタン（tsk-btn）は、押せる範囲だけを上下に広げて 44px（幅も 44px 以上。左右は枠まで）', () => {
    const n = SHELL_MEDIA.narrow;
    for (const where of ['topbar', 'side-head']) {
      const btn = `.tsk-shell__${where} .tsk-btn`;
      assert.equal(declOf(btn, 'position', n), 'relative', btn);
      assert.equal(declOf(btn, 'min-width', n), '44px', btn);
      const hit = `${btn}::before`;
      assert.equal(declOf(hit, 'content', n), '""', hit);
      assert.equal(declOf(hit, 'position', n), 'absolute', hit);
      assert.equal(declOf(hit, 'height', n), '44px', hit);
      assert.equal(declOf(hit, 'left', n), '-1px', `${hit}（枠の 1px まで）`);
      assert.equal(declOf(hit, 'right', n), '-1px', hit);
    }
  });

  it('フォーカスの輪は 2px・インク色。外枠の中のフォーカスできる要素（アプリ・画面の行・ダイアログ・本文）すべて', () => {
    for (const sel of [
      '.tsk-shell__app:focus-visible',
      '.tsk-shell__nav-item:focus-visible',
      '.tsk-shell__side:focus-visible',
      '.tsk-shell__sidebar:focus-visible',
      '.tsk-shell__page:focus-visible',
      '.tsk-shell__panel:focus-visible',
    ])
      assert.equal(declOf(sel, 'outline'), '2px solid var(--ui-text-high)', sel);
  });

  it('動きは開閉 200ms。動きを減らす設定では、重ねるもの・覆いの動きを 0 にする（規則は最後に置く）', () => {
    const css = stripComments(shellCss());
    const durations = [...css.matchAll(/transition-duration:\s*([^;]+);/g)].map((m) => m[1]);
    assert.ok(durations.length >= 5);
    for (const d of durations)
      for (const v of d.split(',').map((s) => s.trim())) assert.match(v, /^(200ms|0s)$/, d);
    const reduced = '(prefers-reduced-motion: reduce)';
    for (const sel of [
      '.tsk-shell__side',
      '.tsk-shell__sidebar',
      '.tsk-shell__panel',
      '.tsk-shell__scrim',
    ]) {
      assert.equal(declOf(sel, 'transition-duration', reduced), '0s', sel);
      assert.equal(declOf(sel, 'transition-delay', reduced), '0s', sel);
    }
    assert.equal(cssRules(shellCss()).at(-1).media, reduced);
  });

  it('重なりの順は 覆い 800 < 重ねもの 801 < ドロワーの覆い（components.css の .tsk-scrim 900）', () => {
    const z = (sel, media) => Number(declOf(sel, 'z-index', media));
    assert.equal(z('.tsk-shell__scrim', null), 800);
    assert.equal(z('.tsk-shell__sidebar', SHELL_MEDIA.mid), 801);
    assert.equal(z('.tsk-shell__panel', SHELL_MEDIA.mid), 801);
    assert.equal(z('.tsk-shell__side', SHELL_MEDIA.narrow), 801);
    assert.equal(z('.tsk-shell__panel', SHELL_MEDIA.narrow), 801);
    const comp = stripComments(read(path.join(UI, 'components.css')));
    const drawerScrim = Number(/\.tsk-scrim\s*\{[^}]*z-index:\s*(\d+)/.exec(comp)[1]);
    assert.ok(drawerScrim > 801, `ドロワーの覆い ${drawerScrim} が上`);
  });

  it('閉じた重ねものは visibility:hidden（退場の 200ms のあと）。開いたときはすぐ見える', () => {
    const open = (target, part) => `.tsk-shell[data-overlay="${target}"] .tsk-shell__${part}`;
    for (const [part, media, target] of [
      ['sidebar', SHELL_MEDIA.mid, 'sidebar'],
      ['panel', SHELL_MEDIA.mid, 'panel'],
      ['side', SHELL_MEDIA.narrow, 'sidebar'],
      ['panel', SHELL_MEDIA.narrow, 'panel'],
    ]) {
      const sel = `.tsk-shell__${part}`;
      assert.equal(declOf(sel, 'visibility', media), 'hidden', `${media} ${sel}`);
      assert.match(declOf(sel, 'transition-delay', media), /200ms$/, `${media} ${sel} の退場`);
      assert.equal(declOf(open(target, part), 'visibility', media), 'visible');
      assert.equal(declOf(open(target, part), 'transition-delay', media), '0s');
    }
  });

  it('パンくずを本文の文字の左端にそろえるのは wide でサイドバーが開き、列があるときだけ（面の左端 + 1px + 24px）', () => {
    const w = SHELL_MEDIA.wide;
    const on = '.tsk-shell:not([data-sidebar="closed"]):not([data-rail="hidden"])';
    assert.equal(
      declOf(`${on} .tsk-shell__start`, 'min-width', w),
      'calc(var(--ui-rail-w) + var(--ui-sidebar-w) - var(--ui-space-2))',
    );
    assert.equal(
      declOf(`${on} .tsk-shell__crumbs`, 'padding-left', w),
      'calc(1px + var(--ui-page-pad-x))',
    );
    assert.equal(declOf('.tsk-shell__topbar', 'padding'), '0 var(--ui-space-2)');
    assert.equal(declOf('.tsk-shell__crumbs', 'margin-left'), 'var(--ui-space-3)');
  });
});
