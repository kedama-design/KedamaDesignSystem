// SPDX-License-Identifier: Apache-2.0
/**
 * 右のドロワー（一覧の1件を開いて編集するときなどに使う）。
 *
 * - 右から減衰ばね（SPRINGS.drawerEnter。行き過ぎない）で入り、閉じると右へ（SPRINGS.drawerExit）出て消える
 * - role="dialog"・aria-modal="true"・見出しで名前を付ける（aria-labelledby）。後ろに覆い（scrim）
 * - × ／「閉じる」／Esc ／覆いを押すと閉じる。閉じたら開いたときの要素（opener）へフォーカスを戻す
 * - 開くと中へフォーカスを移し（initialFocus か本文の最初の欄。無ければ ×）、開いている間は中から出さない
 * - 狭い画面では画面いっぱい（components.css の @media）
 * - 「動きを減らす」設定ではばねを使わず、透明度だけで出し入れする
 * - 入力の中身は持たない（入力は呼び出し側が1文字ごとに状態へ入れる。閉じると欄は消える）
 *
 * doc・win は注入できる（試験は作り物の DOM で動かす）。
 */
import { runSpring, SPRINGS } from './motion.js';
import { glyphNode } from './icons.js';

/** 透明度だけで出し入れするときの時間（ミリ秒） */
export const DRAWER_FADE_MS = 200;
/** 右へ出すとき、幅にさらに足す距離（px。影まで画面の外へ出す） */
const EXIT_GAP = 24;

/** 文書ごとの「いま開いているドロワー」の重なり（Esc・フォーカスの見張りは一番上だけが受け持つ） */
const stacks = new WeakMap();
let serial = 0;

const FOCUSABLE_TAGS = new Set(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']);

function isFocusable(el) {
  if (!el || typeof el.getAttribute !== 'function') return false;
  if (el.hasAttribute('disabled') || el.getAttribute('aria-hidden') === 'true' || el.hasAttribute('hidden')) return false;
  const tag = String(el.tagName || '').toUpperCase();
  if (tag === 'INPUT' && String(el.getAttribute('type') || '').toLowerCase() === 'hidden') return false;
  if (FOCUSABLE_TAGS.has(tag)) return true;
  if (tag === 'A' && el.hasAttribute('href')) return true;
  const ti = el.getAttribute('tabindex');
  if (ti != null && Number(ti) >= 0) return true;
  return el.getAttribute('contenteditable') === 'true';
}

/** root の中で、Tab で移れる要素（文書の順。隠れた枝は降りない）。セレクタに頼らない（作り物の DOM でも同じに動く） */
export function focusablesIn(root) {
  const out = [];
  const walk = (node) => {
    for (const child of Array.from(node.children || [])) {
      if (child.hasAttribute && (child.hasAttribute('hidden') || child.getAttribute('aria-hidden') === 'true')) continue;
      if (isFocusable(child)) out.push(child);
      walk(child);
    }
  };
  walk(root);
  return out;
}

/**
 * @param {{doc?: Document, win?: Window, title: string, body?: Node | ((bodyEl: HTMLElement) => void),
 *   note?: string, opener?: HTMLElement | null, initialFocus?: HTMLElement | ((drawerEl: HTMLElement) => HTMLElement | null),
 *   fallbackFocus?: () => HTMLElement | null, onClose?: (reason: string) => void}} p
 * @returns {{el: HTMLElement, body: HTMLElement, foot: HTMLElement, close: (reason?: string) => void, setTitle: (t: string) => void, isOpen: () => boolean}}
 */
export function openDrawer({
  doc = globalThis.document, win = globalThis.window, title = '', badge = '', body, note = '', opener, initialFocus, fallbackFocus, onClose,
} = {}) {
  const raf = (cb) => win.requestAnimationFrame(cb);
  const cancelRaf = (id) => win.cancelAnimationFrame(id);
  const now = () => win.performance.now();
  const fade = Boolean(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const returnTo = opener === undefined ? doc.activeElement : opener;
  serial += 1;
  const titleId = `tsk-drawer-title-${serial}`;

  const scrim = doc.createElement('div');
  scrim.className = 'tsk-scrim';
  scrim.setAttribute('aria-hidden', 'true');

  const el = doc.createElement('div');
  el.className = 'tsk-drawer';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-labelledby', titleId);
  el.setAttribute('tabindex', '-1');

  const head = doc.createElement('div');
  head.className = 'tsk-drawer__head';
  const h = doc.createElement('h2');
  h.className = 'tsk-drawer__title';
  h.id = titleId;
  h.textContent = String(title ?? '');
  head.appendChild(h);
  // 見出しの右のチップ（分類など。空なら出さない）
  const badgeEl = doc.createElement('span');
  badgeEl.className = 'tsk-chip tsk-drawer__badge';
  badgeEl.hidden = !badge;
  badgeEl.textContent = String(badge ?? '');
  head.appendChild(badgeEl);
  const x = doc.createElement('button');
  x.type = 'button';
  x.className = 'tsk-iconbtn';
  x.setAttribute('aria-label', '閉じる');
  x.appendChild(glyphNode(doc, 'close'));
  head.appendChild(x);
  el.appendChild(head);

  const bodyEl = doc.createElement('div');
  bodyEl.className = 'tsk-drawer__body';
  el.appendChild(bodyEl);

  const foot = doc.createElement('div');
  foot.className = 'tsk-drawer__foot';
  const noteEl = doc.createElement('span');
  noteEl.className = 'tsk-drawer__note';
  noteEl.textContent = String(note ?? '');
  foot.appendChild(noteEl);
  const closeBtn = doc.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'tsk-btn tsk-btn--sm';
  closeBtn.textContent = '閉じる';
  foot.appendChild(closeBtn);
  el.appendChild(foot);

  if (typeof body === 'function') body(bodyEl);
  else if (body) bodyEl.appendChild(body);

  doc.body.appendChild(scrim);
  doc.body.appendChild(el);

  const stack = stacks.get(doc) || [];
  stacks.set(doc, stack);
  let open = true;
  let anim = null;
  const isTop = () => stack[stack.length - 1] === api;

  const setX = (v) => { el.style.transform = `translateX(${v}px)`; };

  function firstFocus() {
    const pick = typeof initialFocus === 'function' ? initialFocus(el) : initialFocus;
    if (pick && el.contains(pick)) return pick;
    return focusablesIn(bodyEl)[0] || x;
  }

  function onKeydown(e) {
    if (!open || !isTop()) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
      close('escape');
      return;
    }
    if (e.key !== 'Tab') return;
    const list = focusablesIn(el);
    const active = doc.activeElement;
    if (!list.length) { e.preventDefault(); el.focus(); return; }
    const first = list[0];
    const last = list[list.length - 1];
    if (!el.contains(active)) { e.preventDefault(); first.focus(); return; }
    if (e.shiftKey && (active === first || active === el)) { e.preventDefault(); last.focus(); return; }
    if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  }

  /** 開いている間にフォーカスが外へ出たら（マウス・読み上げの操作など）中へ戻す */
  function onFocusin(e) {
    if (!open || !isTop()) return;
    if (el.contains(e.target)) return;
    firstFocus().focus();
  }

  function cleanup() {
    doc.removeEventListener('keydown', onKeydown, true);
    doc.removeEventListener('focusin', onFocusin, true);
    const i = stack.indexOf(api);
    if (i >= 0) stack.splice(i, 1);
  }

  function restoreFocus() {
    const target = returnTo && returnTo.isConnected !== false && typeof returnTo.focus === 'function' ? returnTo : (fallbackFocus ? fallbackFocus() : null);
    if (target && typeof target.focus === 'function') target.focus();
  }

  function removeNodes() {
    scrim.remove();
    el.remove();
  }

  function close(reason = 'close') {
    if (!open) return;
    open = false;
    cleanup();
    restoreFocus();
    scrim.classList.remove('is-on');
    if (fade) {
      el.style.transition = `opacity ${DRAWER_FADE_MS}ms ease-out`;
      el.style.opacity = '0';
      win.setTimeout(removeNodes, DRAWER_FADE_MS);
    } else {
      const from = anim ? anim.current().x : 0;
      if (anim) anim.cancel();
      const off = (el.offsetWidth || 440) + EXIT_GAP;
      anim = runSpring({ from, to: off, spring: SPRINGS.drawerExit, tolerance: 4, raf, cancelRaf, now, onFrame: setX, onDone: removeNodes });
    }
    if (onClose) onClose(reason);
  }

  const api = {
    el,
    body: bodyEl,
    foot,
    close,
    isOpen: () => open,
    setTitle(t) { h.textContent = String(t ?? ''); },
    setBadge(t) { badgeEl.textContent = String(t ?? ''); badgeEl.hidden = !t; },
  };
  stack.push(api);

  scrim.addEventListener('click', () => close('scrim'));
  x.addEventListener('click', () => close('button'));
  closeBtn.addEventListener('click', () => close('button'));
  doc.addEventListener('keydown', onKeydown, true);
  doc.addEventListener('focusin', onFocusin, true);

  if (fade) {
    el.style.opacity = '0';
    raf(() => { if (!open) return; el.style.transition = `opacity ${DRAWER_FADE_MS}ms ease-out`; el.style.opacity = '1'; scrim.classList.add('is-on'); });
  } else {
    const off = (el.offsetWidth || 440) + EXIT_GAP;
    anim = runSpring({ from: off, to: 0, spring: SPRINGS.drawerEnter, raf, cancelRaf, now, onFrame: setX });
    raf(() => { if (open) scrim.classList.add('is-on'); });
  }
  firstFocus().focus();
  return api;
}
