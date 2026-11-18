// 外枠（ui/shell.js）の試験に使う作り物の DOM（*.test.mjs に当たらない名前なので、これ自体はテストとして走らない）。
//
// parts.test.mjs の作り物は focus() でいつも activeElement を変える（段2 の設計の「実装の前に確かめる」で確かめた）。
// 外枠は「focus して、activeElement が変わったか確かめる」ことで戻り先を選ぶので、ここではブラウザと同じく、
// inert の中・隠れた要素（display:none・hidden・visibility:hidden）・無効な要素（無効な fieldset の中を含む）・
// フォーカスできない要素へは focus() しても activeElement を変えない。
// ほかに: 幅を変えられる matchMedia、手で流す MutationObserver、getComputedStyle の visibility、描画の合図とタイマー（drawer.js 用）。

export class FakeEvent {
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

const FORM_TAGS = new Set(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']);
/** 属性の書き込みを見張る MutationObserver（作り物）の登録 */
const observations = new Set();

export class FakeElement {
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
    this.setAttribute('class', v);
  }
  get id() {
    return this.attrs.get('id') || '';
  }
  set id(v) {
    this.setAttribute('id', v);
  }
  get type() {
    return this.attrs.get('type') || '';
  }
  set type(v) {
    this.setAttribute('type', v);
  }
  set hidden(v) {
    if (v) this.setAttribute('hidden', '');
    else this.removeAttribute('hidden');
  }
  get hidden() {
    return this.hasAttribute('hidden');
  }
  setAttribute(k, v) {
    this.attrs.set(k, String(v));
    notify(this, k);
  }
  getAttribute(k) {
    return this.attrs.has(k) ? this.attrs.get(k) : null;
  }
  hasAttribute(k) {
    return this.attrs.has(k);
  }
  removeAttribute(k) {
    if (!this.attrs.has(k)) return;
    this.attrs.delete(k);
    notify(this, k);
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
  append(...nodes) {
    for (const n of nodes) {
      if (typeof n === 'string') this.text += n;
      else this.appendChild(n);
    }
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
  /** 自分と祖先（文書の手前まで） */
  *selfAndAncestors() {
    yield this;
    for (let n = this.parentNode; n && n !== this.ownerDocument; n = n.parentNode) yield n;
  }

  /* ---- フォーカスの判定（ブラウザの動きに寄せる） ---- */
  get nativelyFocusable() {
    return FORM_TAGS.has(this.tagName) || (this.tagName === 'A' && this.hasAttribute('href'));
  }
  get tabIndex() {
    const v = this.getAttribute('tabindex');
    if (v !== null && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
    return this.nativelyFocusable ? 0 : -1;
  }
  /** 無効か（自分の disabled、または無効な fieldset の中の入力欄） */
  get actuallyDisabled() {
    if (!FORM_TAGS.has(this.tagName)) return false;
    if (this.hasAttribute('disabled')) return true;
    for (const n of this.selfAndAncestors())
      if (n !== this && n.tagName === 'FIELDSET' && n.hasAttribute('disabled')) return true;
    return false;
  }
  matches(sel) {
    if (sel === ':disabled') return this.actuallyDisabled;
    throw new Error(`作り物の matches は ${sel} を知らない`);
  }
  get rendered() {
    if (!this.isConnected) return false;
    for (const n of this.selfAndAncestors())
      if (n.style.display === 'none' || n.hasAttribute('hidden')) return false;
    return true;
  }
  getClientRects() {
    return this.rendered ? [{ width: 1, height: 1 }] : [];
  }
  get computedVisibility() {
    for (const n of this.selfAndAncestors()) if (n.style.visibility) return n.style.visibility;
    return 'visible';
  }
  get inInert() {
    for (const n of this.selfAndAncestors()) if (n.hasAttribute('inert')) return true;
    return false;
  }
  get canFocus() {
    return (
      this.rendered &&
      this.computedVisibility !== 'hidden' &&
      !this.inInert &&
      !this.actuallyDisabled &&
      (this.nativelyFocusable || this.hasAttribute('tabindex'))
    );
  }
  focus() {
    const doc = this.ownerDocument;
    if (!this.canFocus) return; // ブラウザと同じく、移れない要素への focus() は何もしない
    const prev = doc.activeElement;
    if (prev === this) return;
    doc.activeElement = this;
    if (prev && prev !== doc.body)
      prev.dispatchEvent(new FakeEvent('focusout', { relatedTarget: this }));
    this.dispatchEvent(new FakeEvent('focusin', { relatedTarget: prev }));
  }

  /* ---- イベント ---- */
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
  click() {
    this.dispatchEvent(new FakeEvent('click'));
  }

  /* ---- 探す ---- */
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
  byId(id) {
    return this.find((n) => n.id === id);
  }
  byClass(c) {
    return this.find((n) => n.classList.contains(c));
  }
}

export class FakeDocument extends FakeElement {
  constructor() {
    super(null, '#document');
    this.ownerDocument = this;
    this.body = new FakeElement(this, 'body');
    this.appendChild(this.body);
    this.activeElement = this.body;
  }
  get isConnected() {
    return true;
  }
  createElement(tag) {
    return new FakeElement(this, tag);
  }
  createElementNS(_ns, tag) {
    const n = new FakeElement(this, tag);
    n.tagName = tag;
    return n;
  }
}

function notify(el, name) {
  for (const o of observations) {
    if (o.target !== el) continue;
    if (o.filter && !o.filter.includes(name)) continue;
    o.observer.records.push({ type: 'attributes', target: el, attributeName: name });
  }
}

/** 作り物の MutationObserver。属性の書き込みを貯め、win.flushMutations() で知らせる */
class FakeMutationObserver {
  constructor(cb) {
    this.cb = cb;
    this.records = [];
    FakeMutationObserver.all.add(this);
  }
  observe(target, { attributeFilter } = {}) {
    observations.add({ observer: this, target, filter: attributeFilter || null });
  }
  disconnect() {
    for (const o of [...observations]) if (o.observer === this) observations.delete(o);
    this.records = [];
    FakeMutationObserver.all.delete(this);
  }
}
FakeMutationObserver.all = new Set();

/** 幅の範囲の書き方（shell.js の SHELL_MEDIA の3つの形）と、動きを減らす設定だけを読む */
export function evalMedia(query, { width, reduced }) {
  let m = /^\(width >= (\d+(?:\.\d+)?)px\)$/.exec(query);
  if (m) return width >= Number(m[1]);
  m = /^\((\d+(?:\.\d+)?)px <= width < (\d+(?:\.\d+)?)px\)$/.exec(query);
  if (m) return width >= Number(m[1]) && width < Number(m[2]);
  m = /^\(width < (\d+(?:\.\d+)?)px\)$/.exec(query);
  if (m) return width < Number(m[1]);
  if (/^\(prefers-reduced-motion:\s*reduce\)$/.test(query)) return reduced;
  throw new Error(`作り物の matchMedia は ${query} を読めない`);
}

/** 幅を変えられる窓。描画の合図は 16ms ごと、タイマーは期限が来たら（drawer.js の動きを進める） */
export function fakeWindow({ width = 1440, reduced = false } = {}) {
  let t = 1000;
  let seq = 0;
  let frames = [];
  let timers = [];
  const lists = new Set();
  const state = { width, reduced };
  const win = {
    performance: { now: () => t },
    MutationObserver: FakeMutationObserver,
    matchMedia(q) {
      const mql = {
        media: q,
        matches: evalMedia(q, state),
        listeners: new Set(),
        addEventListener(type, fn) {
          if (type === 'change') this.listeners.add(fn);
        },
        removeEventListener(type, fn) {
          if (type === 'change') this.listeners.delete(fn);
        },
      };
      lists.add(mql);
      return mql;
    },
    /** 幅を変え、答えの変わった matchMedia に change を知らせる（ブラウザと同じく、全部の答えを直してから知らせる） */
    setWidth(w) {
      state.width = w;
      const changed = [];
      for (const m of lists) {
        const now = evalMedia(m.media, state);
        if (now !== m.matches) {
          m.matches = now;
          changed.push(m);
        }
      }
      for (const m of changed)
        for (const fn of [...m.listeners]) fn({ matches: m.matches, media: m.media });
    },
    /** matchMedia の change を聞いている数（destroy で外れたかを見る） */
    mediaListenerCount() {
      let n = 0;
      for (const m of lists) n += m.listeners.size;
      return n;
    },
    /** 貯まった属性の変化を知らせる（ブラウザではマイクロタスクで届く） */
    flushMutations() {
      for (const o of [...FakeMutationObserver.all]) {
        if (!o.records.length) continue;
        const recs = o.records;
        o.records = [];
        o.cb(recs, o);
      }
    },
    getComputedStyle(el) {
      return { visibility: el.computedVisibility };
    },
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
