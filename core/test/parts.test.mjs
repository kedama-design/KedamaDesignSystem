// 状態のアイコン（ui/icons.js）・トースト（toast.js）・ドロワー（drawer.js）の振る舞い。
// 移した元: 登記議事録つくるさん _dev/test/uiparts.test.mjs（丸ごと。読む場所と、ESLint の no-this-alias に当たる2か所の書き方だけ変えた）
// 依存を増やさないため、要るところだけを持つ作り物の DOM と、手で進める時計（描画の合図・タイマー）で動かす。
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  STATUS_ICONS,
  STATUS_KINDS,
  statusIconMarkup,
  statusIconNode,
  statusMarkup,
  glyphMarkup,
} from '../ui/icons.js';
import { createToaster, TOAST_DURATION_MS } from '../ui/toast.js';
import { openDrawer, focusablesIn } from '../ui/drawer.js';

const CORE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ------------------------------------------------------------------ 作り物の DOM */

class FakeEvent {
  constructor(type, init = {}) {
    Object.assign(this, { bubbles: true, ...init });
    this.type = type;
    this.defaultPrevented = false;
    this.stopped = false;
  }
  preventDefault() {
    this.defaultPrevented = true;
  }
  stopPropagation() {
    this.stopped = true;
  }
}

class FakeNode {
  constructor(doc, tagName) {
    this.ownerDocument = doc;
    this.tagName = String(tagName).toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.attrs = new Map();
    this.style = {};
    this.listeners = [];
    this.text = '';
    this.offsetWidth = 360;
    // アロー関数はこの constructor の this をそのまま使う（別名の変数を作らない）
    this.classList = {
      add: (c) => {
        const s = new Set(this.className.split(/\s+/).filter(Boolean));
        s.add(c);
        this.className = [...s].join(' ');
      },
      remove: (c) => {
        this.className = this.className
          .split(/\s+/)
          .filter((x) => x && x !== c)
          .join(' ');
      },
      contains: (c) => this.className.split(/\s+/).includes(c),
    };
  }
  get className() {
    return this.attrs.get('class') || '';
  }
  set className(v) {
    this.attrs.set('class', String(v));
  }
  get id() {
    return this.attrs.get('id') || '';
  }
  set id(v) {
    this.attrs.set('id', String(v));
  }
  get type() {
    return this.attrs.get('type') || '';
  }
  set type(v) {
    this.attrs.set('type', String(v));
  }
  setAttribute(k, v) {
    this.attrs.set(k, String(v));
  }
  getAttribute(k) {
    return this.attrs.has(k) ? this.attrs.get(k) : null;
  }
  hasAttribute(k) {
    return this.attrs.has(k);
  }
  removeAttribute(k) {
    this.attrs.delete(k);
  }
  get textContent() {
    return this.text + this.children.map((c) => c.textContent).join('');
  }
  set textContent(v) {
    for (const c of this.children) c.parentNode = null;
    this.children = [];
    this.text = String(v);
  }
  appendChild(child) {
    if (child.parentNode) child.parentNode.removeChild(child);
    child.parentNode = this;
    this.children.push(child);
    return child;
  }
  removeChild(child) {
    const i = this.children.indexOf(child);
    if (i >= 0) this.children.splice(i, 1);
    child.parentNode = null;
    return child;
  }
  remove() {
    if (this.parentNode) this.parentNode.removeChild(this);
  }
  contains(other) {
    for (let n = other; n; n = n.parentNode) if (n === this) return true;
    return false;
  }
  get isConnected() {
    return this.ownerDocument.contains(this);
  }
  addEventListener(type, fn, opts) {
    this.listeners.push({ type, fn, capture: opts === true || Boolean(opts && opts.capture) });
  }
  removeEventListener(type, fn, opts) {
    const capture = opts === true || Boolean(opts && opts.capture);
    this.listeners = this.listeners.filter(
      (l) => !(l.type === type && l.fn === fn && l.capture === capture),
    );
  }
  dispatchEvent(evt) {
    evt.target = this;
    const pathUp = [this];
    for (let n = this.parentNode; n; n = n.parentNode) pathUp.push(n);
    for (const n of [...pathUp].reverse()) {
      if (evt.stopped) break;
      for (const l of n.listeners.filter((x) => x.type === evt.type && x.capture))
        l.fn.call(n, evt);
    }
    for (const [i, n] of pathUp.entries()) {
      if (evt.stopped || (i > 0 && !evt.bubbles)) break;
      for (const l of n.listeners.filter((x) => x.type === evt.type && !x.capture))
        l.fn.call(n, evt);
    }
    return !evt.defaultPrevented;
  }
  focus() {
    const doc = this.ownerDocument;
    const prev = doc.activeElement;
    if (prev === this) return;
    doc.activeElement = this;
    if (prev && prev !== doc.body)
      prev.dispatchEvent(new FakeEvent('focusout', { relatedTarget: this }));
    this.dispatchEvent(new FakeEvent('focusin', { relatedTarget: prev }));
  }
  click() {
    this.dispatchEvent(new FakeEvent('click'));
  }
  /** innerHTML を使う部品があれば、すぐ分かるように止める */
  set innerHTML(_v) {
    throw new Error('innerHTML を使った');
  }
  get innerHTML() {
    throw new Error('innerHTML を読んだ');
  }
  insertAdjacentHTML() {
    throw new Error('insertAdjacentHTML を使った');
  }
  /** 子孫を文書の順にたどる */
  *walk() {
    for (const c of this.children) {
      yield c;
      yield* c.walk();
    }
  }
  find(pred) {
    for (const n of this.walk()) if (pred(n)) return n;
    return null;
  }
  findAll(pred) {
    return [...this.walk()].filter(pred);
  }
  byClass(c) {
    return this.find((n) => n.classList.contains(c));
  }
}

class FakeDocument extends FakeNode {
  constructor() {
    super(null, '#document');
    this.ownerDocument = this;
    this.body = new FakeNode(this, 'body');
    this.appendChild(this.body);
    this.activeElement = this.body;
  }
  get isConnected() {
    return true;
  }
  createElement(tag) {
    return new FakeNode(this, tag);
  }
  createElementNS(_ns, tag) {
    const n = new FakeNode(this, tag);
    n.tagName = tag;
    return n;
  }
}

/** 手で進める時計。描画の合図は 16ms ごと、タイマーは期限が来たら */
function fakeWindow({ reduced = false } = {}) {
  let t = 1000;
  let seq = 0;
  let frames = [];
  let timers = [];
  const win = {
    performance: { now: () => t },
    requestAnimationFrame(cb) {
      seq += 1;
      frames.push({ id: seq, cb });
      return seq;
    },
    cancelAnimationFrame(id) {
      frames = frames.filter((f) => f.id !== id);
    },
    setTimeout(fn, ms) {
      seq += 1;
      timers.push({ id: seq, at: t + Number(ms || 0), fn });
      return seq;
    },
    clearTimeout(id) {
      timers = timers.filter((x) => x.id !== id);
    },
    matchMedia: (q) => ({ matches: reduced && /prefers-reduced-motion:\s*reduce/.test(q) }),
    /** ms だけ進める（16ms ごとに合図を流し、期限の来たタイマーを呼ぶ） */
    advance(ms) {
      const end = t + ms;
      while (t < end) {
        t = Math.min(end, t + 16);
        const due = frames;
        frames = [];
        for (const f of due) f.cb(t);
        for (;;) {
          const next = timers.filter((x) => x.at <= t).sort((a, b) => a.at - b.at)[0];
          if (!next) break;
          timers = timers.filter((x) => x !== next);
          next.fn();
        }
      }
    },
  };
  return win;
}

const translateX = (el) => {
  const m = /translateX\((-?[\d.e+-]+)px\)/.exec(el.style.transform || '');
  return m ? Number(m[1]) : null;
};

/* ------------------------------------------------------------------ 状態のアイコン */

describe('状態のアイコン（ui/icons.js）', () => {
  it('種類ごとに形が違う（色に頼らない）。どれも見出しの既定がある', () => {
    const sig = new Map();
    for (const kind of STATUS_KINDS) {
      const s = JSON.stringify(STATUS_ICONS[kind].shapes);
      assert.ok(!sig.has(s), `${kind} と ${sig.get(s)} が同じ形`);
      sig.set(s, kind);
      assert.ok(STATUS_ICONS[kind].label.trim(), `${kind} に見出しが無い`);
    }
    assert.deepEqual(STATUS_KINDS, [
      'idea',
      'todo',
      'none',
      'progress',
      'waiting',
      'success',
      'info',
      'danger',
    ]);
  });

  it('アイコンは role="img" と aria-label を持つ。隣に文字があるときは aria-hidden にできる', () => {
    const m = statusIconMarkup('danger', { label: '公開失敗' });
    assert.match(m, /role="img"/);
    assert.match(m, /aria-label="公開失敗"/);
    assert.match(m, /class="tsk-icon tsk-icon--danger"/);
    const d = statusIconMarkup('danger', { decorative: true });
    assert.match(d, /aria-hidden="true"/);
    assert.doesNotMatch(d, /role="img"/);
    const doc = new FakeDocument();
    const n = statusIconNode(doc, 'success');
    assert.equal(n.getAttribute('aria-label'), '完了');
    assert.equal(n.getAttribute('role'), 'img');
    assert.equal(n.children.length, 2);
  });

  it('アイコンの文字列は色を持たず（色は CSS）、ラベルは esc される', () => {
    for (const kind of STATUS_KINDS) {
      const m = statusIconMarkup(kind);
      assert.doesNotMatch(m, /#[0-9a-f]{3,8}|rgb|fill="(?!none)|stroke="/i, kind);
    }
    assert.match(statusIconMarkup('info', { label: '"<b>' }), /aria-label="&quot;&lt;b&gt;"/);
  });

  it('状態（.tsk-status）は文字のラベルが必須。アイコンだけにしない。文字は esc される', () => {
    assert.throws(() => statusMarkup('danger', ''), /文字のラベル/);
    assert.throws(() => statusMarkup('danger', '  '), /文字のラベル/);
    const m = statusMarkup('danger', '<img src=x>');
    assert.match(m, /tsk-status tsk-status--danger/);
    assert.match(m, /&lt;img src=x&gt;/);
    assert.doesNotMatch(m, /<img/);
  });

  it('知らない種類は理由つきで止める（黙って灰色の丸にしない）', () => {
    assert.throws(() => statusIconMarkup('warning'), /状態のアイコンの種類「warning」はありません/);
    assert.throws(() => statusIconMarkup('constructor'), /はありません/);
    assert.throws(() => glyphMarkup('toString'), /はありません/);
  });
});

/* ------------------------------------------------------------------ トースト */

describe('トースト（ui/toast.js）', () => {
  const setup = (opts) => {
    const doc = new FakeDocument();
    const win = fakeWindow(opts);
    return { doc, win, toaster: createToaster({ doc, win }) };
  };

  it('右下の入れ物に入り、右から入って（行き過ぎて戻り）0 に止まる', () => {
    const { doc, win, toaster } = setup();
    const h = toaster.show({ kind: 'success', title: '保存しました' });
    const box = doc.body.byClass('tsk-toasts');
    assert.ok(box && box.contains(h.el));
    assert.ok(translateX(h.el) > 300, '右の外から始まる');
    let min = Infinity;
    for (let i = 0; i < 60; i += 1) {
      win.advance(16);
      min = Math.min(min, translateX(h.el));
    }
    assert.ok(min < 0, '少し行き過ぎる（ばね）');
    assert.equal(translateX(h.el), 0);
  });

  it('5秒たつと右へ引っ込んで消える', () => {
    const { doc, win, toaster } = setup();
    const h = toaster.show({ kind: 'info', title: '再読み込みしました' });
    win.advance(TOAST_DURATION_MS - 100);
    assert.ok(h.isOpen(), '5秒より前は残る');
    win.advance(200);
    assert.ok(!h.isOpen(), '5秒で閉じ始める');
    assert.ok(doc.contains(h.el), '引っ込む間は残る');
    let max = -Infinity;
    for (let i = 0; i < 120 && doc.contains(h.el); i += 1) {
      win.advance(16);
      max = Math.max(max, translateX(h.el) ?? max);
    }
    assert.ok(!doc.contains(h.el), '引っ込んだら消える');
    assert.ok(max > 300, '右へ出ていった');
    assert.equal(toaster.count(), 0);
  });

  it('マウスを重ねている間は時計と進み具合の線が止まり、離すと残りの時間から続ける', () => {
    const { win, toaster } = setup();
    const h = toaster.show({ kind: 'error', title: '書けませんでした' });
    win.advance(2000);
    const fill = h.el.byClass('tsk-toast__bar-fill');
    assert.equal(fill.style.transform, 'scaleX(0)');
    h.el.dispatchEvent(new FakeEvent('mouseenter', { bubbles: false }));
    assert.equal(fill.style.transition, 'none');
    const frac = Number(/scaleX\(([\d.]+)\)/.exec(fill.style.transform)[1]);
    assert.ok(frac > 0.55 && frac < 0.65, `止めた位置が残りの割合（${frac}）`);
    win.advance(20_000);
    assert.ok(h.isOpen(), '重ねている間は閉じない');
    h.el.dispatchEvent(new FakeEvent('mouseleave', { bubbles: false }));
    win.advance(16);
    assert.match(
      fill.style.transition,
      /^transform 30\d\dms linear$/,
      '残りの時間をかけて線が進む',
    );
    win.advance(2850);
    assert.ok(h.isOpen(), '残りは約3秒（2秒+20秒で閉じていない）');
    win.advance(200);
    assert.ok(!h.isOpen(), '残りの時間で閉じる');
  });

  it('中にフォーカスがある間も止まる（キーボードで × へ移ったとき）', () => {
    const { win, toaster } = setup();
    const h = toaster.show({ kind: 'info', title: 'お知らせ' });
    const btn = h.el.find((n) => n.tagName === 'BUTTON');
    btn.focus();
    win.advance(10_000);
    assert.ok(h.isOpen());
    btn.dispatchEvent(new FakeEvent('focusout', { relatedTarget: null }));
    win.advance(TOAST_DURATION_MS + 50);
    assert.ok(!h.isOpen());
  });

  it('× で閉じる。中にフォーカスがあれば Esc でも閉じる', () => {
    const { win, toaster } = setup();
    const a = toaster.show({ kind: 'info', title: 'A' });
    const btn = a.el.find(
      (n) => n.tagName === 'BUTTON' && n.getAttribute('aria-label') === '閉じる',
    );
    assert.ok(btn, '閉じるボタン（aria-label つき）');
    btn.click();
    assert.ok(!a.isOpen());
    const b = toaster.show({ kind: 'info', title: 'B' });
    const e = new FakeEvent('keydown', { key: 'Escape' });
    b.el.dispatchEvent(e);
    assert.ok(!b.isOpen());
    assert.ok(e.defaultPrevented);
    win.advance(2000);
  });

  it('エラーは role="alert"、それ以外は role="status"。種類の名前をアイコンで読み上げる', () => {
    const { toaster } = setup();
    const err = toaster.show({ kind: 'error', title: 'x' });
    const ok = toaster.show({ kind: 'success', title: 'y' });
    const inf = toaster.show({ kind: 'info', title: 'z' });
    assert.equal(err.el.getAttribute('role'), 'alert');
    assert.equal(ok.el.getAttribute('role'), 'status');
    assert.equal(inf.el.getAttribute('role'), 'status');
    assert.equal(err.el.find((n) => n.tagName === 'svg').getAttribute('aria-label'), 'エラー');
    assert.throws(
      () => toaster.show({ kind: 'warning', title: 'w' }),
      /トーストの種類「warning」はありません/,
    );
  });

  it('文字は textContent だけで入る（タグを書いても要素にならない）', () => {
    const { toaster } = setup();
    const evil = '<img src=x onerror=alert(1)>';
    const h = toaster.show({ kind: 'error', title: evil, detail: `${evil}詳細` });
    assert.equal(h.el.byClass('tsk-toast__title').textContent, evil);
    assert.equal(h.el.byClass('tsk-toast__detail').textContent, `${evil}詳細`);
    assert.equal(h.el.findAll((n) => n.tagName === 'IMG').length, 0);
  });

  it('動きを減らす設定では、ばねで動かさず透明度だけで出し入れする', () => {
    const { doc, win, toaster } = setup({ reduced: true });
    const h = toaster.show({ kind: 'info', title: 'r' });
    assert.equal(h.el.style.transform, undefined, '位置を動かさない');
    assert.equal(h.el.style.opacity, '0');
    win.advance(16);
    assert.equal(h.el.style.opacity, '1');
    h.close();
    assert.equal(h.el.style.opacity, '0');
    assert.match(h.el.style.transition, /opacity/);
    win.advance(250);
    assert.ok(!doc.contains(h.el));
    assert.equal(h.el.style.transform, undefined);
  });

  it('出しすぎたら古いものから閉じる（4つまで）', () => {
    const { toaster } = setup();
    const hs = [1, 2, 3, 4, 5].map((i) => toaster.show({ kind: 'info', title: `t${i}` }));
    assert.ok(!hs[0].isOpen());
    assert.ok(hs.slice(1).every((h) => h.isOpen()));
  });

  it('onClose は消えたときに1回だけ、理由つき', () => {
    const { win, toaster } = setup();
    const reasons = [];
    const h = toaster.show({ kind: 'info', title: 't', onClose: (r) => reasons.push(r) });
    h.close('button');
    h.close('button');
    win.advance(3000);
    assert.deepEqual(reasons, ['button']);
  });
});

/* ------------------------------------------------------------------ ドロワー */

describe('ドロワー（ui/drawer.js）', () => {
  const setup = (opts = {}) => {
    const doc = new FakeDocument();
    const win = fakeWindow(opts);
    const opener = doc.createElement('button');
    doc.body.appendChild(opener);
    opener.focus();
    const body = (el) => {
      const a = doc.createElement('input');
      a.id = 'name';
      const b = doc.createElement('select');
      b.id = 'kind';
      const off = doc.createElement('input');
      off.setAttribute('disabled', '');
      el.appendChild(a);
      el.appendChild(off);
      el.appendChild(b);
    };
    return { doc, win, opener, body };
  };

  it('role="dialog"・aria-modal・見出しで名前を付ける。見出しは textContent', () => {
    const { doc, win, body } = setup();
    const d = openDrawer({ doc, win, title: '<b>山田 太郎</b>', body });
    assert.equal(d.el.getAttribute('role'), 'dialog');
    assert.equal(d.el.getAttribute('aria-modal'), 'true');
    const h = d.el.find((n) => n.id === d.el.getAttribute('aria-labelledby'));
    assert.ok(h, 'aria-labelledby が見出しを指す');
    assert.equal(h.textContent, '<b>山田 太郎</b>');
    assert.equal(h.findAll(() => true).length, 0, '見出しに要素を作らない');
    d.setTitle('新しい人');
    assert.equal(h.textContent, '新しい人');
    assert.ok(doc.body.byClass('tsk-scrim'), '覆いがある');
  });

  it('開くと本文の最初の欄へフォーカスが移る。initialFocus で欄を指せる', () => {
    const { doc, win, body } = setup();
    const d = openDrawer({ doc, win, title: 't', body });
    assert.equal(doc.activeElement.id, 'name');
    d.close();
    const d2 = openDrawer({
      doc,
      win,
      title: 't',
      body,
      initialFocus: (el) => el.find((n) => n.id === 'kind'),
    });
    assert.equal(doc.activeElement.id, 'kind');
    d2.close();
  });

  it('本文に欄が無ければ × へフォーカスが移る', () => {
    const { doc, win } = setup();
    const d = openDrawer({ doc, win, title: 't' });
    assert.equal(doc.activeElement.getAttribute('aria-label'), '閉じる');
    d.close();
  });

  for (const [how, act] of [
    ['×', (d) => d.el.find((n) => n.getAttribute('aria-label') === '閉じる').click()],
    [
      '「閉じる」',
      (d) => d.foot.find((n) => n.tagName === 'BUTTON' && n.textContent === '閉じる').click(),
    ],
    [
      'Esc',
      (d, doc) => doc.activeElement.dispatchEvent(new FakeEvent('keydown', { key: 'Escape' })),
    ],
    ['覆い', (d, doc) => doc.body.byClass('tsk-scrim').click()],
  ]) {
    it(`${how} で閉じ、開いたときの要素へフォーカスを戻す。閉じたら消える`, () => {
      const { doc, win, opener, body } = setup();
      const reasons = [];
      const d = openDrawer({ doc, win, title: 't', body, onClose: (r) => reasons.push(r) });
      assert.notEqual(doc.activeElement, opener);
      act(d, doc);
      assert.ok(!d.isOpen());
      assert.equal(doc.activeElement, opener, 'opener へ戻る');
      assert.equal(reasons.length, 1);
      for (let i = 0; i < 120 && doc.contains(d.el); i += 1) win.advance(16);
      assert.ok(!doc.contains(d.el), 'ドロワーが消える');
      assert.ok(!doc.body.byClass('tsk-scrim'), '覆いが消える');
    });
  }

  it('opener が消えていたら fallbackFocus へ戻す', () => {
    const { doc, win, opener, body } = setup();
    const other = doc.createElement('button');
    doc.body.appendChild(other);
    const d = openDrawer({ doc, win, title: 't', body, opener, fallbackFocus: () => other });
    opener.remove();
    d.close();
    assert.equal(doc.activeElement, other);
  });

  it('開いている間、Tab は中で回る（最後 → 最初、Shift+Tab で最初 → 最後）。無効な欄は飛ばす', () => {
    const { doc, win, body } = setup();
    const d = openDrawer({ doc, win, title: 't', body });
    const list = focusablesIn(d.el);
    assert.deepEqual(
      list.map((n) => n.id || n.getAttribute('aria-label') || n.textContent),
      ['閉じる', 'name', 'kind', '閉じる'],
    );
    list.at(-1).focus();
    const e = new FakeEvent('keydown', { key: 'Tab' });
    doc.activeElement.dispatchEvent(e);
    assert.ok(e.defaultPrevented);
    assert.equal(doc.activeElement, list[0]);
    const s = new FakeEvent('keydown', { key: 'Tab', shiftKey: true });
    doc.activeElement.dispatchEvent(s);
    assert.equal(doc.activeElement, list.at(-1));
    // 途中の Tab はブラウザに任せる（止めない）
    list[1].focus();
    const mid = new FakeEvent('keydown', { key: 'Tab' });
    doc.activeElement.dispatchEvent(mid);
    assert.equal(mid.defaultPrevented, false);
    d.close();
  });

  it('開いている間にフォーカスが外へ出たら、中へ戻す。閉じたあとは見張らない', () => {
    const { doc, win, opener, body } = setup();
    const outside = doc.createElement('button');
    doc.body.appendChild(outside);
    const d = openDrawer({ doc, win, title: 't', body });
    outside.focus();
    assert.ok(d.el.contains(doc.activeElement), '中へ戻った');
    d.close();
    assert.equal(doc.activeElement, opener);
    outside.focus();
    assert.equal(doc.activeElement, outside, '閉じたあとは外へ移れる');
    const ks = doc.listeners.filter((l) => l.type === 'keydown' || l.type === 'focusin');
    assert.equal(ks.length, 0, '文書の見張りを外した');
  });

  it('右から入り、行き過ぎずに 0 に止まる', () => {
    const { doc, win, body } = setup();
    const d = openDrawer({ doc, win, title: 't', body });
    const start = translateX(d.el);
    assert.ok(start > 300, '右の外から');
    let min = Infinity;
    for (let i = 0; i < 90; i += 1) {
      win.advance(16);
      min = Math.min(min, translateX(d.el));
    }
    assert.ok(min >= 0, `行き過ぎない（最小 ${min}）`);
    assert.equal(translateX(d.el), 0);
    assert.ok(doc.body.byClass('tsk-scrim').classList.contains('is-on'));
    d.close();
  });

  it('動きを減らす設定では、位置を動かさず透明度だけ', () => {
    const { doc, win, body } = setup({ reduced: true });
    const d = openDrawer({ doc, win, title: 't', body });
    assert.equal(d.el.style.transform, undefined);
    assert.equal(d.el.style.opacity, '0');
    win.advance(16);
    assert.equal(d.el.style.opacity, '1');
    d.close();
    assert.equal(d.el.style.opacity, '0');
    win.advance(250);
    assert.ok(!doc.contains(d.el));
    assert.equal(d.el.style.transform, undefined);
  });

  it('重ねて開いたら、Esc は一番上だけを閉じる', () => {
    const { doc, win, body } = setup();
    const a = openDrawer({ doc, win, title: 'a', body });
    const b = openDrawer({ doc, win, title: 'b', body });
    doc.activeElement.dispatchEvent(new FakeEvent('keydown', { key: 'Escape' }));
    assert.ok(!b.isOpen());
    assert.ok(a.isOpen());
    a.close();
  });

  it('close は何度呼んでも onClose は1回', () => {
    const { doc, win, body } = setup();
    let n = 0;
    const d = openDrawer({
      doc,
      win,
      title: 't',
      body,
      onClose: () => {
        n += 1;
      },
    });
    d.close();
    d.close('escape');
    assert.equal(n, 1);
  });
});

/* ------------------------------------------------------------------ 静的な決まり */

describe('ui の静的な決まり', () => {
  const files = ['motion.js', 'icons.js', 'toast.js', 'drawer.js', 'dateinput.js'].map((f) => [
    f,
    fs.readFileSync(path.join(CORE, 'ui', f), 'utf8'),
  ]);

  it('innerHTML・outerHTML・insertAdjacentHTML・document.write を使わない（文字は textContent）', () => {
    for (const [f, src] of files)
      assert.doesNotMatch(
        src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, ''),
        /\binnerHTML\b|\bouterHTML\b|insertAdjacentHTML|document\.write/,
        f,
      );
  });

  it('new Function・eval・文字列の setTimeout・ネットワークを使わない（原則5）', () => {
    for (const [f, src] of files) {
      assert.doesNotMatch(
        src,
        /new\s+Function|(^|[^\w.$])eval\s*\(|setTimeout\(\s*["'`]|fetch\s*\(|XMLHttpRequest|WebSocket/,
        f,
      );
    }
  });

  it('motion.js は DOM に触らない（純関数）', () => {
    const src = files.find(([f]) => f === 'motion.js')[1].replace(/\/\*[\s\S]*?\*\//g, '');
    assert.doesNotMatch(
      src,
      /\bdocument\b|\bwindow\b|requestAnimationFrame|performance\.now|\bimport\b/,
    );
  });

  it('ui の JS は ui の中のモジュールしか読まない（使う側の画面に依存しない。知らせ notice.js は移していない）', () => {
    for (const [f, src] of files) {
      for (const m of src.matchAll(/^\s*import\s[^'"]*['"]([^'"]+)['"]/gm)) {
        assert.match(m[1], /^\.\/[a-z]+\.js$/, `${f} が ${m[1]} を読む`);
        assert.ok(fs.existsSync(path.join(CORE, 'ui', m[1])), `${f} が読む ${m[1]} が ui に無い`);
      }
    }
  });
});

// トーストのボタン（「元に戻す」など）。押すと onClick を1回呼んで閉じる。無ければボタンを作らない
describe('トーストのボタン（action）', () => {
  it('action を渡すと本文の下にボタン。押すと onClick を1回呼び、閉じる（2度押しても1回）', () => {
    const doc = new FakeDocument();
    const win = fakeWindow();
    const toaster = createToaster({ doc, win });
    let calls = 0;
    const h = toaster.show({
      kind: 'success',
      title: '駒田花子を外しました',
      action: {
        label: '元に戻す',
        onClick: () => {
          calls += 1;
        },
      },
    });
    const btn = h.el.byClass('tsk-toast__action');
    assert.ok(btn, 'ボタンがある');
    assert.equal(btn.textContent, '元に戻す');
    btn.dispatchEvent(new FakeEvent('click'));
    btn.dispatchEvent(new FakeEvent('click'));
    assert.equal(calls, 1);
    assert.ok(!h.isOpen(), '押したら閉じる');
  });
  it('action が無ければボタンを作らない', () => {
    const doc = new FakeDocument();
    const toaster = createToaster({ doc, win: fakeWindow() });
    const h = toaster.show({ kind: 'info', title: 'x' });
    assert.equal(h.el.byClass('tsk-toast__action'), null);
  });
});
