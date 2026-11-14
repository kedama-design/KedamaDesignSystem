// SPDX-License-Identifier: Apache-2.0
/**
 * 減衰ばね。DOM に触らない純関数と、描画の合図（requestAnimationFrame）を注入して回す小さな進め役。
 * トースト・ドロワーの「やわらかな動き」はここだけで計算する（toast.js・drawer.js はこれを使う）。
 *
 * 質量 1 のばね: a = -k (x - to) - c v。半陰的オイラー法（先に速さ、次に位置）で1こま進める。
 * 1こまの時間 dt は 0.032 秒で打ち切る（タブが裏に回って戻ったときに、大きな dt で飛んだり発散したりしないため）。
 * 減衰比 ζ = c / (2√k): 1 より小さいと少し行き過ぎて戻る（トーストの入り）、1 以上なら行き過ぎない（ドロワーの入り）。
 */

/** 1こまの時間の上限（秒） */
export const MAX_DT = 0.032;

/** 止まったとみなす位置の差（px）の既定値。速さの既定値はその 20 倍（px/秒） */
export const DEFAULT_TOLERANCE = 0.3;

/**
 * 決まった強さ（利用者が承認した値。2026-11-05）
 * toastEnter … 少し行き過ぎて戻る（ζ ≈ 0.69）／ toastExit … ほぼ臨界（ζ ≈ 1.00）
 * drawerEnter … 行き過ぎない（ζ ≈ 1.01）／ drawerExit … ほぼ臨界（ζ ≈ 0.99。外へ出る向きなので見えない）
 */
export const SPRINGS = Object.freeze({
  toastEnter: Object.freeze({ k: 170, c: 18 }),
  toastExit: Object.freeze({ k: 120, c: 22 }),
  drawerEnter: Object.freeze({ k: 220, c: 30 }),
  drawerExit: Object.freeze({ k: 200, c: 28 }),
});

/** 減衰比 ζ（質量 1） */
export function dampingRatio({ k, c }) {
  return c / (2 * Math.sqrt(k));
}

/**
 * 1こま進める。state はこわさず、新しい { x, v } を返す。
 * @param {{x: number, v: number}} state
 * @param {{k: number, c: number, to: number, dt: number}} p dt は秒（上限 MAX_DT、負は 0）
 */
export function springStep(state, { k, c, to, dt }) {
  const h = Math.min(Math.max(Number(dt) || 0, 0), MAX_DT);
  const a = -k * (state.x - to) - c * state.v;
  const v = state.v + a * h;
  const x = state.x + v * h;
  return { x, v };
}

/**
 * 止まったか。位置の差が tolerance より小さく、速さが velocityTolerance（既定は tolerance の 20 倍）より小さい。
 * @param {{x: number, v: number}} state
 * @param {number} to
 * @param {{tolerance?: number, velocityTolerance?: number}} [opts]
 */
export function isSettled(state, to, { tolerance = DEFAULT_TOLERANCE, velocityTolerance } = {}) {
  const vt = velocityTolerance ?? tolerance * 20;
  return Math.abs(state.x - to) < tolerance && Math.abs(state.v) < vt;
}

/**
 * 描画の合図ごとにばねを進め、位置を onFrame へ渡す。止まったら最後に to をちょうど渡して onDone を呼ぶ。
 * DOM には触らない（raf・cancelRaf・now は呼び出し側が渡す）。
 * @param {{from: number, to: number, spring: {k: number, c: number}, velocity?: number, tolerance?: number,
 *   raf: (cb: (t: number) => void) => any, cancelRaf?: (id: any) => void, now: () => number,
 *   onFrame: (x: number) => void, onDone?: () => void}} p now・raf の時刻はミリ秒
 * @returns {{cancel: () => void, current: () => {x: number, v: number}, done: () => boolean}}
 */
export function runSpring({ from, to, spring, velocity = 0, tolerance = DEFAULT_TOLERANCE, raf, cancelRaf, now, onFrame, onDone }) {
  let state = { x: from, v: velocity };
  let last = now();
  let id = null;
  let finished = false;
  const frame = (t) => {
    id = null;
    if (finished) return;
    const at = Number.isFinite(t) ? t : now();
    const dt = (at - last) / 1000;
    last = at;
    state = springStep(state, { k: spring.k, c: spring.c, to, dt });
    if (isSettled(state, to, { tolerance })) {
      state = { x: to, v: 0 };
      finished = true;
      onFrame(to);
      if (onDone) onDone();
      return;
    }
    onFrame(state.x);
    id = raf(frame);
  };
  onFrame(from);
  id = raf(frame);
  return {
    cancel() {
      if (finished) return;
      finished = true;
      if (id != null && cancelRaf) cancelRaf(id);
      id = null;
    },
    current: () => ({ ...state }),
    done: () => finished,
  };
}
