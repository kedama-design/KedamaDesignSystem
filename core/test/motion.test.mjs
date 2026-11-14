// 減衰ばね（ui/motion.js）。DOM を使わない純関数として確かめる。
// 移した元: 登記議事録つくるさん _dev/test/uimotion.test.mjs（丸ごと。読む場所だけ変えた）
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SPRINGS, MAX_DT, springStep, isSettled, runSpring, dampingRatio } from '../ui/motion.js';

/** from から to へ、一定の dt で止まるまで回す。通った位置の最小・最大と、こまの数を返す */
function simulate(spring, from, to, dt, limit = 10000) {
  let s = { x: from, v: 0 };
  let min = from;
  let max = from;
  let steps = 0;
  while (!isSettled(s, to) && steps < limit) {
    s = springStep(s, { ...spring, to, dt });
    min = Math.min(min, s.x);
    max = Math.max(max, s.x);
    steps += 1;
  }
  return { min, max, steps, settled: isSettled(s, to), seconds: steps * dt };
}

const RATES = [1 / 120, 1 / 60, 1 / 30, MAX_DT];

describe('減衰ばね（ui/motion.js）', () => {
  it('決まった強さ（トースト 入り k170/c18・出 k120/c22、ドロワー 入り k220/c30・出 k200/c28）', () => {
    assert.deepEqual({ ...SPRINGS.toastEnter }, { k: 170, c: 18 });
    assert.deepEqual({ ...SPRINGS.toastExit }, { k: 120, c: 22 });
    assert.deepEqual({ ...SPRINGS.drawerEnter }, { k: 220, c: 30 });
    assert.deepEqual({ ...SPRINGS.drawerExit }, { k: 200, c: 28 });
    assert.ok(
      Object.isFrozen(SPRINGS) && Object.isFrozen(SPRINGS.toastEnter),
      '強さを書き換えられない',
    );
  });

  it('トーストの入りは目標を少し行き過ぎてから戻り、1.5秒以内に止まる（どのこまの速さでも）', () => {
    assert.ok(dampingRatio(SPRINGS.toastEnter) < 1, '減衰比が 1 未満（行き過ぎる）');
    for (const dt of RATES) {
      const r = simulate(SPRINGS.toastEnter, 400, 0, dt);
      assert.ok(r.settled, `dt=${dt} で止まらない`);
      assert.ok(r.min < -1, `dt=${dt} で行き過ぎない（最小 ${r.min.toFixed(2)}px）`);
      assert.ok(r.min > -40, `dt=${dt} で行き過ぎが大きすぎる（最小 ${r.min.toFixed(2)}px）`);
      assert.ok(r.seconds < 1.5, `dt=${dt} で止まるまで ${r.seconds.toFixed(2)} 秒`);
    }
  });

  it('ドロワーの入りは行き過ぎない（距離・こまの速さによらず、目標を越えない）', () => {
    assert.ok(dampingRatio(SPRINGS.drawerEnter) >= 1, '減衰比が 1 以上');
    for (const dt of RATES) {
      for (const from of [24, 300, 464, 1200]) {
        const r = simulate(SPRINGS.drawerEnter, from, 0, dt);
        assert.ok(r.settled, `dt=${dt} from=${from} で止まらない`);
        assert.ok(r.min >= 0, `dt=${dt} from=${from} で目標を越えた（最小 ${r.min}px）`);
        assert.ok(r.seconds < 1.5, `dt=${dt} from=${from} で止まるまで ${r.seconds.toFixed(2)} 秒`);
      }
    }
  });

  it('ドロワーの出・トーストの出も行き過ぎない（画面の外で跳ね返らない）', () => {
    for (const spring of [SPRINGS.drawerExit, SPRINGS.toastExit]) {
      for (const dt of RATES) {
        const r = simulate(spring, 0, 464, dt);
        assert.ok(r.settled, `dt=${dt} で止まらない`);
        assert.ok(r.max <= 464, `dt=${dt} で目標を越えた（最大 ${r.max}px）`);
      }
    }
  });

  it('1こまの時間は 0.032 秒で打ち切る（長く止まったあとでも飛ばない）。負の時間は進めない', () => {
    const s = { x: 400, v: 0 };
    const p = { ...SPRINGS.toastEnter, to: 0 };
    assert.deepEqual(springStep(s, { ...p, dt: 5 }), springStep(s, { ...p, dt: MAX_DT }));
    assert.deepEqual(springStep(s, { ...p, dt: 0.5 }), springStep(s, { ...p, dt: 0.032 }));
    assert.notDeepEqual(springStep(s, { ...p, dt: 0.016 }), springStep(s, { ...p, dt: 0.032 }));
    assert.deepEqual(springStep(s, { ...p, dt: -1 }), { x: 400, v: 0 });
    assert.deepEqual(springStep(s, { ...p, dt: Number.NaN }), { x: 400, v: 0 });
    // 打ち切りが無いと、1秒のこま1回で目標を大きく越えてしまう
    const one = springStep(s, { ...p, dt: 1 });
    assert.ok(one.x > 0, `1秒のこまで ${one.x}px（目標を越えた）`);
  });

  it('springStep は渡した状態を書き換えない', () => {
    const s = Object.freeze({ x: 10, v: 3 });
    const next = springStep(s, { k: 100, c: 10, to: 0, dt: 0.016 });
    assert.deepEqual(s, { x: 10, v: 3 });
    assert.notEqual(next, s);
  });

  it('止まったかの判定は、位置と速さの許容を指定できる', () => {
    assert.equal(isSettled({ x: 0.2, v: 0 }, 0), true);
    assert.equal(isSettled({ x: 0.5, v: 0 }, 0), false, '既定の 0.3px を越えた');
    assert.equal(isSettled({ x: 0.5, v: 0 }, 0, { tolerance: 1 }), true);
    assert.equal(isSettled({ x: 0, v: 7 }, 0), false, '既定の速さの許容は 0.3 × 20 = 6');
    assert.equal(isSettled({ x: 0, v: 5 }, 0), true);
    assert.equal(
      isSettled({ x: 0, v: 7 }, 0, { tolerance: 1 }),
      true,
      '速さの許容は tolerance の 20 倍',
    );
    assert.equal(isSettled({ x: 0, v: 7 }, 0, { tolerance: 1, velocityTolerance: 2 }), false);
    assert.equal(isSettled({ x: 100.1, v: 0 }, 100), true, '目標が 0 以外でも差で見る');
  });

  it('runSpring: 最初に from を描き、止まったら to をちょうど描いて onDone を1回だけ呼ぶ', () => {
    let t = 0;
    const queue = [];
    const frames = [];
    let done = 0;
    const r = runSpring({
      from: 400,
      to: 0,
      spring: SPRINGS.toastEnter,
      now: () => t,
      raf: (cb) => {
        queue.push(cb);
        return queue.length;
      },
      cancelRaf: () => {},
      onFrame: (x) => frames.push(x),
      onDone: () => {
        done += 1;
      },
    });
    assert.equal(frames[0], 400);
    for (let i = 0; i < 1000 && queue.length; i += 1) {
      t += 16;
      queue.shift()(t);
    }
    assert.equal(done, 1);
    assert.equal(frames.at(-1), 0);
    assert.ok(r.done());
    assert.ok(Math.min(...frames) < 0, '行き過ぎがある（トーストの入り）');
    assert.deepEqual(r.current(), { x: 0, v: 0 });
  });

  it('runSpring: cancel で止めると、そのあとの合図では描かず、onDone も呼ばない', () => {
    let t = 0;
    const queue = [];
    const frames = [];
    let cancelled = 0;
    let done = 0;
    const r = runSpring({
      from: 400,
      to: 0,
      spring: SPRINGS.drawerEnter,
      now: () => t,
      raf: (cb) => {
        queue.push(cb);
        return queue.length;
      },
      cancelRaf: () => {
        cancelled += 1;
      },
      onFrame: (x) => frames.push(x),
      onDone: () => {
        done += 1;
      },
    });
    t += 16;
    queue.shift()(t);
    const n = frames.length;
    r.cancel();
    assert.equal(cancelled, 1);
    while (queue.length) {
      t += 16;
      queue.shift()(t);
    }
    assert.equal(frames.length, n);
    assert.equal(done, 0);
  });

  it('runSpring: 合図が長く途切れても（裏のタブ）、1こまの動きは 0.032 秒ぶんまで', () => {
    let t = 0;
    const queue = [];
    const frames = [];
    runSpring({
      from: 400,
      to: 0,
      spring: SPRINGS.toastEnter,
      now: () => t,
      raf: (cb) => {
        queue.push(cb);
        return 1;
      },
      onFrame: (x) => frames.push(x),
    });
    t += 10_000;
    queue.shift()(t);
    const capped = springStep({ x: 400, v: 0 }, { ...SPRINGS.toastEnter, to: 0, dt: MAX_DT });
    assert.equal(frames[1], capped.x);
  });
});
