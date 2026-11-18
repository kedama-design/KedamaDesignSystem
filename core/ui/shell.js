// SPDX-License-Identifier: Apache-2.0
/**
 * 外枠（AppShell。ui/shell.css）の、重ねて出すときの振る舞い。
 *
 * - 幅の段（SHELL_MEDIA）を見て data-mode を書く。mid・narrow ではサイドバー・右パネルを data-overlay で重ねる（同時に1つ）
 * - wide での開閉（data-sidebar・data-panel）は使う側の好み。toggle は「呼ばれた時点の DOM の逆」を絶対値で求める
 *   （onRequest があれば渡すだけで DOM を書かない。無ければここで書く）。求めの控えは持たない
 * - 重ねているあいだは、外枠の中の決まった7つの要素だけに inert を付け、ダイアログになる要素に role="dialog"・aria-modal を付ける。
 *   毎回すべてを計算し直す（控えて戻すことはしない）。外枠の外（body の他の子）には触らない
 * - Tab は重ねものの端で折り返す。Esc・覆い・[data-shell-close] で閉じ、開いたボタンへフォーカスを戻す
 * - 段をまたいだ直後の2こまは data-switching を付ける（shell.css が開閉の動きを止める。閉じる動きを本文に重ねない）
 * - ドロワー（drawer.js）を上に重ねてよい。ドロワーの中の Tab・Esc はドロワーが先に受ける
 * - 接続中、外枠の要素の inert・role・aria-modal・tabindex と開閉ボタンの aria-expanded はここの持ち物。
 *   destroy() で取り除く（使う側の data-sidebar・data-panel・data-rail は変えない）
 *
 * doc・win は注入できる（試験は作り物の DOM で動かす）。セレクタに頼らず、子をたどって探す。
 */
import { focusablesIn } from './drawer.js';

/** 幅の段。shell.css の @media と同じ文字列（テストが一致を確かめる） */
export const SHELL_MEDIA = Object.freeze({
  wide: '(width >= 1200px)',
  mid: '(768px <= width < 1200px)',
  narrow: '(width < 768px)',
});

/** 開け閉めできるもの（data-shell-toggle の値） */
export const SHELL_TARGETS = Object.freeze(['sidebar', 'panel']);

const PART = Object.freeze({
  body: 'tsk-shell__body',
  topbar: 'tsk-shell__topbar',
  side: 'tsk-shell__side',
  sideHead: 'tsk-shell__side-head',
  rail: 'tsk-shell__rail',
  sidebar: 'tsk-shell__sidebar',
  page: 'tsk-shell__page',
  panel: 'tsk-shell__panel',
});
/** inert を計算する7つ */
const INERT_PARTS = Object.freeze(['topbar', 'side', 'sideHead', 'rail', 'sidebar', 'page', 'panel']);
/** ダイアログになりうる3つ */
const DIALOG_PARTS = Object.freeze(['side', 'sidebar', 'panel']);
const OBSERVED = Object.freeze(['data-sidebar', 'data-panel', 'data-rail']);

/** つないでいる外枠（同じ外枠に2つつながない） */
const attached = new WeakSet();

const hasClass = (el, c) => String((el.getAttribute && el.getAttribute('class')) || '').split(/\s+/).includes(c);

function findPart(root, cls) {
  for (const child of Array.from(root.children || [])) {
    if (hasClass(child, cls)) return child;
    const hit = findPart(child, cls);
    if (hit) return hit;
  }
  return null;
}

function findAllWithAttr(root, attr, value, out = []) {
  for (const child of Array.from(root.children || [])) {
    if (child.getAttribute && child.getAttribute(attr) === value) out.push(child);
    findAllWithAttr(child, attr, value, out);
  }
  return out;
}

/** el から root までさかのぼって、attr を持つ最初の要素 */
function closestWithAttr(el, root, attr) {
  for (let n = el; n && n.getAttribute; n = n.parentNode) {
    if (n.hasAttribute(attr)) return n;
    if (n === root) break;
  }
  return null;
}

const insideInert = (el) => {
  for (let n = el; n && n.getAttribute; n = n.parentNode) if (n.hasAttribute('inert')) return true;
  return false;
};

function isShown(el, win) {
  if (typeof el.getClientRects === 'function' && el.getClientRects().length === 0) return false;
  if (win && typeof win.getComputedStyle === 'function' && win.getComputedStyle(el).visibility === 'hidden') return false;
  return true;
}

/** tabindex 属性の値（整数として読めなければ null。読めないときブラウザは指定が無いものとして扱う） */
function tabindexAttr(el) {
  const raw = el.getAttribute('tabindex');
  if (raw === null || !/^\s*[+-]?\d+\s*$/.test(raw)) return null;
  return parseInt(raw, 10);
}

/** 編集できる領域の入口（contenteditable の要素。親も編集できるなら入口ではない） */
function isEditingHost(el) {
  if (typeof el.isContentEditable === 'boolean') {
    const parent = el.parentNode;
    return el.isContentEditable && !(parent && parent.isContentEditable === true);
  }
  const v = el.getAttribute('contenteditable');
  return v !== null && ['', 'true', 'plaintext-only'].includes(v.trim().toLowerCase());
}

/**
 * dialog の中で、実際に Tab で移れる要素を Tab の順に並べる。
 * 候補は drawer.js の focusablesIn と、編集できる領域の入口（contenteditable）。そこから、tabindex 属性が負のもの・inert の中・
 * 無効（無効な fieldset の中を含む）・見えないものを除く（tabIndex のプロパティは見ない。tabindex の無い編集欄は -1 を返すため）。
 * 並びはブラウザと同じ: tabindex が正のものを値の小さい順（同じ値は文書の順）に先、そのあとに 0 と指定なしを文書の順
 */
function tabbablesIn(dialog, win) {
  const known = new Set(focusablesIn(dialog));
  const found = [];
  const walk = (node) => {
    for (const child of Array.from(node.children || [])) {
      if (child.hasAttribute && (child.hasAttribute('hidden') || child.getAttribute('aria-hidden') === 'true')) continue;
      if (known.has(child) || isEditingHost(child)) found.push(child);
      walk(child);
    }
  };
  walk(dialog);
  const usable = found.filter((el) => {
    const ti = tabindexAttr(el);
    return !(ti !== null && ti < 0)
      && !insideInert(el)
      && !(typeof el.matches === 'function' && el.matches(':disabled'))
      && isShown(el, win);
  });
  const order = (el) => {
    const ti = tabindexAttr(el);
    return ti !== null && ti > 0 ? ti : Infinity;
  };
  return usable.map((el, i) => ({ el, i, o: order(el) })).sort((a, b) => a.o - b.o || a.i - b.i).map((x) => x.el);
}

/**
 * 段 × 重ねもの × 好み × data-rail から、7つの要素の inert とダイアログになる要素を決める（設計の割り当て表そのまま）
 * @returns {{dialog: string|null, inert: Record<string, boolean>}}
 */
function plan(mode, overlay, prefs, railHidden) {
  const all = (v) => Object.fromEntries(INERT_PARTS.map((k) => [k, v]));
  if (mode !== 'wide' && overlay === 'panel') return { dialog: 'panel', inert: { ...all(true), panel: false } };
  if (mode === 'mid' && overlay === 'sidebar') {
    return { dialog: 'sidebar', inert: { ...all(true), side: false, sidebar: false } };
  }
  if (mode === 'narrow' && overlay === 'sidebar') {
    return { dialog: 'side', inert: { topbar: true, side: false, sideHead: false, rail: railHidden, sidebar: false, page: true, panel: true } };
  }
  if (mode === 'narrow') return { dialog: null, inert: { ...all(true), topbar: false, page: false } };
  if (mode === 'mid') {
    return { dialog: null, inert: { topbar: false, side: false, sideHead: true, rail: railHidden, sidebar: true, page: false, panel: true } };
  }
  return {
    dialog: null,
    inert: { topbar: false, side: false, sideHead: true, rail: railHidden, sidebar: !prefs.sidebar, page: false, panel: !prefs.panel },
  };
}

/**
 * 外枠をつなぐ。
 * @param {HTMLElement} root .tsk-shell の要素
 * @param {{doc?: Document, win?: Window,
 *   onRequest?: (req: {kind: 'preference', target: 'sidebar'|'panel', open: boolean, reason: 'toggle'|'close'}) => void}} [opts]
 *   onRequest を渡すと、wide での開閉の好みを DOM に書かず、求めとして渡す（使う側が data-sidebar・data-panel を書く）
 * @returns {{toggle: (target: 'sidebar'|'panel', opener?: HTMLElement|null) => void, close: () => void, destroy: () => void}}
 */
export function attachShell(root, { doc, win, onRequest } = {}) {
  if (!root || typeof root.getAttribute !== 'function') throw new TypeError('attachShell には外枠の要素（.tsk-shell）を渡す');
  doc = doc || root.ownerDocument || globalThis.document;
  win = win || doc.defaultView || globalThis.window;
  if (attached.has(root)) throw new Error('この外枠はもうつないである（先に destroy() を呼ぶ）');
  attached.add(root);

  let destroyed = false;
  let overlay = 'none';
  let opener = null;
  let settle = null;
  const part = (k) => findPart(root, PART[k]);
  const lists = Object.entries(SHELL_MEDIA).map(([m, q]) => [m, typeof win.matchMedia === 'function' ? win.matchMedia(q) : null]);
  const currentMode = () => {
    for (const [m, mql] of lists) if (mql && mql.matches) return m;
    return 'wide';
  };
  let mode = currentMode();

  const prefOpen = (t) => root.getAttribute(`data-${t}`) !== 'closed';
  const isOpen = (t) => (mode === 'wide' ? prefOpen(t) : overlay === t);
  const togglesFor = (t) => (t ? findAllWithAttr(root, 'data-shell-toggle', t) : []);
  const dialogEl = () => {
    const k = mode === 'wide' ? null : plan(mode, overlay, {}, false).dialog;
    return k ? part(k) : null;
  };
  /** el が入っている開閉の領域（サイドバー・右パネル）。どちらでもなければ null */
  const regionOf = (el) => {
    if (!el) return null;
    const panel = part('panel');
    const side = part('side');
    const sidebar = part('sidebar');
    if (panel && panel.contains(el)) return 'panel';
    if ((sidebar && sidebar.contains(el)) || (side && side.contains(el))) return 'sidebar';
    return null;
  };
  /** フォーカスを動かしてよいか（外枠の中か body。ドロワーなど外にあるときは動かさない） */
  const focusIsOurs = (el) => !el || el === doc.body || root.contains(el);
  /** el が外枠の中にあって、もうフォーカスを持てない（閉じた領域に入った・見えない） */
  const strandedInShell = (el) => Boolean(el) && el !== doc.body && root.contains(el) && (insideInert(el) || !isShown(el, win));

  const scrim = doc.createElement('div');
  scrim.setAttribute('class', 'tsk-shell__scrim');
  scrim.setAttribute('aria-hidden', 'true');
  (part('body') || root).appendChild(scrim);

  function syncA11y() {
    const rail = root.getAttribute('data-rail') === 'hidden';
    const p = plan(mode, mode === 'wide' ? 'none' : overlay, { sidebar: prefOpen('sidebar'), panel: prefOpen('panel') }, rail);
    for (const k of INERT_PARTS) {
      const el = part(k);
      if (!el) continue;
      if (p.inert[k]) el.setAttribute('inert', '');
      else el.removeAttribute('inert');
    }
    for (const k of DIALOG_PARTS) {
      const el = part(k);
      if (!el) continue;
      if (p.dialog === k) {
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-modal', 'true');
        el.setAttribute('tabindex', '-1');
      } else {
        el.removeAttribute('role');
        el.removeAttribute('aria-modal');
        el.removeAttribute('tabindex');
      }
    }
    const page = part('page');
    if (page) page.setAttribute('tabindex', '-1');
    for (const t of SHELL_TARGETS) for (const b of togglesFor(t)) b.setAttribute('aria-expanded', String(isOpen(t)));
  }

  /** 戻り先へ「focus して、activeElement が変わったか確かめる」。開いたボタン → 同じ data-shell-toggle の別のボタン → __page */
  function returnFocus(target, first) {
    const tries = [first, ...togglesFor(target).filter((b) => b !== first), part('page')];
    for (const el of tries) {
      if (!el || el.isConnected === false || typeof el.focus !== 'function') continue;
      el.focus();
      if (doc.activeElement === el) return el;
    }
    return null;
  }

  /** 計算し直し、フォーカスしていた要素が閉じた領域に入ったら戻り先へ移す（wide で好みが変わったとき） */
  function syncAndRescue() {
    const before = doc.activeElement;
    const region = regionOf(before);
    syncA11y();
    const lost = before && before !== doc.body && root.contains(before) && doc.activeElement !== before;
    if (lost || strandedInShell(before)) returnFocus(region, null);
  }

  function setPreference(target, open, reason) {
    if (onRequest) {
      onRequest({ kind: 'preference', target, open, reason });
      return;
    }
    root.setAttribute(`data-${target}`, open ? 'open' : 'closed');
    syncAndRescue();
  }

  function openOverlay(target, from) {
    if (overlay === target) return;
    opener = from !== undefined ? from : (root.contains(doc.activeElement) ? doc.activeElement : null);
    overlay = target;
    root.setAttribute('data-overlay', target);
    syncA11y();
    const dlg = dialogEl();
    if (!dlg) return;
    const first = tabbablesIn(dlg, win)[0];
    (first || dlg).focus();
  }

  function closeOverlay() {
    if (overlay === 'none') return;
    const target = overlay;
    const back = opener;
    const active = doc.activeElement;
    overlay = 'none';
    opener = null;
    root.setAttribute('data-overlay', 'none');
    syncA11y();
    if (focusIsOurs(active)) returnFocus(target, back);
  }

  /** 段をまたいだ直後の2こまは data-switching を付け、閉じる動きを止める（退場の動きが本文に重ならない） */
  function holdMotion() {
    if (typeof win.requestAnimationFrame !== 'function') return;
    if (settle !== null) win.cancelAnimationFrame(settle);
    root.setAttribute('data-switching', '');
    settle = win.requestAnimationFrame(() => {
      settle = win.requestAnimationFrame(() => {
        settle = null;
        root.removeAttribute('data-switching');
      });
    });
  }

  /** 幅が段をまたいだ: その場で data-mode を書き、重ねものを閉じ、計算し直す */
  function applyMode(next) {
    holdMotion();
    const before = doc.activeElement;
    const region = regionOf(before);
    const was = overlay;
    const back = opener;
    mode = next;
    overlay = 'none';
    opener = null;
    root.setAttribute('data-mode', mode);
    root.setAttribute('data-overlay', 'none');
    syncA11y();
    if (was !== 'none') {
      if (focusIsOurs(before)) returnFocus(was, back);
    } else if (strandedInShell(before)) {
      returnFocus(region, null);
    }
  }

  function toggle(target, from) {
    if (destroyed) return;
    if (!SHELL_TARGETS.includes(target)) throw new TypeError(`toggle の対象は ${SHELL_TARGETS.join('・')}（${target}）`);
    if (mode === 'wide') {
      setPreference(target, !prefOpen(target), 'toggle');
      return;
    }
    if (overlay === target) closeOverlay();
    else openOverlay(target, from);
  }

  function close() {
    if (destroyed) return;
    closeOverlay();
  }

  function onClick(e) {
    if (destroyed) return;
    const t = e.target;
    if (t === scrim) {
      closeOverlay();
      return;
    }
    const closer = closestWithAttr(t, root, 'data-shell-close');
    if (closer) {
      if (mode !== 'wide') closeOverlay();
      else {
        const region = regionOf(closer);
        if (region) setPreference(region, false, 'close');
      }
      return;
    }
    const tog = closestWithAttr(t, root, 'data-shell-toggle');
    const target = tog && tog.getAttribute('data-shell-toggle');
    if (SHELL_TARGETS.includes(target)) toggle(target, tog);
  }

  /** 重ねものの端で Tab を折り返す（毎回、候補を取り直す。候補が0件ならダイアログ要素に留める） */
  function onKeydown(e) {
    if (destroyed || e.key !== 'Tab' || e.defaultPrevented || overlay === 'none') return;
    const dlg = dialogEl();
    if (!dlg || !dlg.contains(e.target)) return;
    const list = tabbablesIn(dlg, win);
    const active = doc.activeElement;
    if (!list.length) {
      e.preventDefault();
      if (active !== dlg) dlg.focus();
      return;
    }
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && (active === first || active === dlg)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || active === dlg)) {
      e.preventDefault();
      first.focus();
    }
  }

  /** Esc は、フォーカスが重ねものの中か body のときだけ（ドロワーの中の Esc はドロワーが capture で先に止める） */
  function onEscape(e) {
    if (destroyed || e.key !== 'Escape' || e.defaultPrevented || overlay === 'none') return;
    const active = doc.activeElement;
    const dlg = dialogEl();
    if (active && active !== doc.body && !(dlg && dlg.contains(active))) return;
    e.preventDefault();
    closeOverlay();
  }

  function onMediaChange() {
    if (destroyed) return;
    const next = currentMode();
    if (next !== mode) applyMode(next);
  }

  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKeydown);
  doc.addEventListener('keydown', onEscape);
  for (const [, mql] of lists) {
    if (!mql) continue;
    if (typeof mql.addEventListener === 'function') mql.addEventListener('change', onMediaChange);
    else if (typeof mql.addListener === 'function') mql.addListener(onMediaChange);
  }
  const MO = win.MutationObserver;
  const observer = typeof MO === 'function'
    ? new MO(() => { if (!destroyed) syncAndRescue(); })
    : null;
  if (observer) observer.observe(root, { attributes: true, attributeFilter: [...OBSERVED] });

  root.setAttribute('data-mode', mode);
  root.setAttribute('data-overlay', 'none');
  syncA11y();

  /** 監視・イベントを外し、ここが書いた属性と覆いを取り除く。何度呼んでもよい */
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    attached.delete(root);
    if (observer) observer.disconnect();
    if (settle !== null) win.cancelAnimationFrame(settle);
    settle = null;
    root.removeAttribute('data-switching');
    for (const [, mql] of lists) {
      if (!mql) continue;
      if (typeof mql.removeEventListener === 'function') mql.removeEventListener('change', onMediaChange);
      else if (typeof mql.removeListener === 'function') mql.removeListener(onMediaChange);
    }
    root.removeEventListener('click', onClick);
    root.removeEventListener('keydown', onKeydown);
    doc.removeEventListener('keydown', onEscape);
    scrim.remove();
    root.removeAttribute('data-mode');
    root.removeAttribute('data-overlay');
    for (const k of INERT_PARTS) {
      const el = part(k);
      if (el) el.removeAttribute('inert');
    }
    for (const k of DIALOG_PARTS) {
      const el = part(k);
      if (!el) continue;
      el.removeAttribute('role');
      el.removeAttribute('aria-modal');
      el.removeAttribute('tabindex');
    }
    const page = part('page');
    if (page) page.removeAttribute('tabindex');
    for (const t of SHELL_TARGETS) for (const b of togglesFor(t)) b.removeAttribute('aria-expanded');
    overlay = 'none';
    opener = null;
  }

  return { toggle, close, destroy };
}
