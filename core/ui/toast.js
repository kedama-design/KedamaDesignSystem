// SPDX-License-Identifier: Apache-2.0
/**
 * 右下のトースト（一時的な知らせ）。
 *
 * - 右から減衰ばね（SPRINGS.toastEnter）で入り、5秒たつと右へ（SPRINGS.toastExit）戻って消える
 * - マウスを重ねる・中にフォーカスがある間は時計と進み具合の線が止まる。離れると残りの時間から続ける
 * - × で閉じる。中にフォーカスがあるときは Esc でも閉じる
 * - エラーは role="alert"、それ以外は role="status"
 * - 文字は textContent だけで入れる（innerHTML を使わない。内部の英語をそのまま出すかは呼び出し側の責任）
 * - 「動きを減らす」設定（prefers-reduced-motion: reduce）ではばねを使わず、透明度だけで出し入れする
 *
 * doc・win は注入できる（試験は作り物の DOM で動かす）。既定は画面の document / window。
 */
import { runSpring, SPRINGS } from './motion.js';
import { statusIconNode, glyphNode } from './icons.js';

/** 消えるまでの時間（ミリ秒） */
export const TOAST_DURATION_MS = 5000;
/** 同時に出しておく数。超えたら古いものから閉じる */
export const TOAST_MAX_VISIBLE = 4;
/** 透明度だけで出し入れするときの時間（ミリ秒） */
export const TOAST_FADE_MS = 200;
/** 右へ引っ込めるとき、カードの幅にさらに足す距離（px。影まで画面の外へ出す） */
const EXIT_GAP = 40;

/** 種類 → 状態のアイコンと読み上げの名前 */
export const TOAST_KINDS = Object.freeze({
  error: Object.freeze({ icon: 'danger', label: 'エラー', role: 'alert' }),
  success: Object.freeze({ icon: 'success', label: '完了', role: 'status' }),
  info: Object.freeze({ icon: 'info', label: 'お知らせ', role: 'status' }),
});

/**
 * @param {{doc?: Document, win?: Window, duration?: number, maxVisible?: number,
 *   container?: () => HTMLElement|null, toastClass?: string}} [opts]
 *   container … 入れ物を返す関数（無い・返さないときは body の末尾に .tsk-toasts を作る）。
 *   toastClass … 各トーストに足す class（使う側の画面の既存の選択子を通すため。例 'toast'）
 */
export function createToaster({ doc = globalThis.document, win = globalThis.window, duration = TOAST_DURATION_MS, maxVisible = TOAST_MAX_VISIBLE, container = null, toastClass = '' } = {}) {
  const raf = (cb) => win.requestAnimationFrame(cb);
  const cancelRaf = (id) => win.cancelAnimationFrame(id);
  const now = () => win.performance.now();
  const reduced = () => Boolean(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
  /** 出ている順（古い順） */
  const live = [];
  let box = null;

  function region() {
    const given = typeof container === 'function' ? container() : null;
    if (given) return given;
    if (box && box.isConnected) return box;
    box = doc.createElement('div');
    box.className = 'tsk-toasts';
    doc.body.appendChild(box);
    return box;
  }

  /**
   * @param {{kind?: 'error'|'success'|'info', title: string, detail?: string, duration?: number, onClose?: (reason: string) => void,
   *   action?: {label: string, onClick: () => void}}} p action … 本文の下のボタン（「元に戻す」など。押すと onClick のあと閉じる）
   * @returns {{el: HTMLElement, close: (reason?: string) => void, isOpen: () => boolean}}
   */
  function show({ kind = 'info', title, detail = '', duration: ms = duration, onClose, action = null } = {}) {
    if (!Object.hasOwn(TOAST_KINDS, kind)) throw new Error(`トーストの種類「${kind}」はありません（使えるのは ${Object.keys(TOAST_KINDS).join(' / ')}）`);
    const spec = TOAST_KINDS[kind];
    const el = doc.createElement('div');
    el.className = `tsk-toast tsk-toast--${kind}${toastClass ? ` ${toastClass}` : ''}`;
    el.setAttribute('data-level', kind);
    el.setAttribute('role', spec.role);
    el.setAttribute('aria-atomic', 'true');
    el.appendChild(statusIconNode(doc, spec.icon, { label: spec.label }));
    const body = doc.createElement('div');
    body.className = 'tsk-toast__body';
    const t = doc.createElement('p');
    t.className = 'tsk-toast__title';
    t.textContent = String(title ?? '');
    body.appendChild(t);
    if (detail) {
      const d = doc.createElement('p');
      d.className = 'tsk-toast__detail';
      d.textContent = String(detail);
      body.appendChild(d);
    }
    let actionBtn = null;
    if (action && typeof action.onClick === 'function') {
      actionBtn = doc.createElement('button');
      actionBtn.type = 'button';
      actionBtn.className = 'tsk-btn tsk-btn--sm tsk-toast__action';
      actionBtn.textContent = String(action.label ?? '');
      body.appendChild(actionBtn);
    }
    const bar = doc.createElement('div');
    bar.className = 'tsk-toast__bar';
    bar.setAttribute('aria-hidden', 'true');
    const fill = doc.createElement('span');
    fill.className = 'tsk-toast__bar-fill';
    fill.style.transform = 'scaleX(1)';
    bar.appendChild(fill);
    body.appendChild(bar);
    el.appendChild(body);
    const btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 'tsk-iconbtn';
    btn.setAttribute('aria-label', '閉じる');
    btn.appendChild(glyphNode(doc, 'close'));
    el.appendChild(btn);
    region().appendChild(el);

    let left = ms;
    let started = 0;
    let timer = null;
    let barFrame = null;
    let closing = false;
    let hovered = false;
    let focused = false;
    let anim = null;
    const fade = reduced();

    const setX = (x) => { el.style.transform = `translateX(${x}px)`; };

    function arm() {
      if (closing || timer != null) return;
      started = now();
      timer = win.setTimeout(() => { timer = null; close('timeout'); }, Math.max(0, left));
      // 進み具合の線: 次のこまで、残りの時間をかけて 0 へ（同じこまで書くと変化が見えない）
      if (barFrame != null) cancelRaf(barFrame);
      barFrame = raf(() => {
        barFrame = null;
        if (closing || timer == null) return;
        fill.style.transition = `transform ${Math.max(0, Math.round(left))}ms linear`;
        fill.style.transform = 'scaleX(0)';
      });
    }

    function pause() {
      if (closing || timer == null) return;
      win.clearTimeout(timer);
      timer = null;
      if (barFrame != null) { cancelRaf(barFrame); barFrame = null; }
      left = Math.max(0, left - (now() - started));
      fill.style.transition = 'none';
      fill.style.transform = `scaleX(${ms > 0 ? (left / ms).toFixed(4) : 0})`;
    }

    const sync = () => { if (hovered || focused) pause(); else arm(); };

    function remove(reason) {
      el.remove();
      const i = live.indexOf(handle);
      if (i >= 0) live.splice(i, 1);
      if (onClose) onClose(reason);
    }

    function close(reason = 'close') {
      if (closing) return;
      closing = true;
      if (timer != null) { win.clearTimeout(timer); timer = null; }
      if (barFrame != null) { cancelRaf(barFrame); barFrame = null; }
      if (fade) {
        el.style.transition = `opacity ${TOAST_FADE_MS}ms ease-out`;
        el.style.opacity = '0';
        win.setTimeout(() => remove(reason), TOAST_FADE_MS);
        return;
      }
      const from = anim ? anim.current().x : 0;
      if (anim) anim.cancel();
      const off = (el.offsetWidth || 360) + EXIT_GAP;
      anim = runSpring({ from, to: off, spring: SPRINGS.toastExit, raf, cancelRaf, now, onFrame: setX, onDone: () => remove(reason) });
    }

    el.addEventListener('mouseenter', () => { hovered = true; sync(); });
    el.addEventListener('mouseleave', () => { hovered = false; sync(); });
    el.addEventListener('focusin', () => { focused = true; sync(); });
    el.addEventListener('focusout', (e) => {
      if (e && e.relatedTarget && el.contains(e.relatedTarget)) return;
      focused = false;
      sync();
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close('escape'); }
    });
    btn.addEventListener('click', () => close('button'));
    if (actionBtn) actionBtn.addEventListener('click', () => { if (closing) return; action.onClick(); close('action'); });

    if (fade) {
      el.style.opacity = '0';
      raf(() => {
        if (closing) return;
        el.style.transition = `opacity ${TOAST_FADE_MS}ms ease-out`;
        el.style.opacity = '1';
      });
    } else {
      const off = (el.offsetWidth || 360) + EXIT_GAP;
      anim = runSpring({ from: off, to: 0, spring: SPRINGS.toastEnter, raf, cancelRaf, now, onFrame: setX });
    }

    const handle = { el, close, isOpen: () => !closing };
    live.push(handle);
    // 出しすぎたら古いものから閉じる（閉じかけのものは数えない）
    const open = live.filter((h) => h.isOpen());
    for (const h of open.slice(0, Math.max(0, open.length - maxVisible))) h.close('overflow');
    arm();
    return handle;
  }

  return {
    show,
    /** いま出ている（閉じかけを含む）数 */
    count: () => live.length,
    closeAll: () => { for (const h of [...live]) h.close('closeAll'); },
  };
}
