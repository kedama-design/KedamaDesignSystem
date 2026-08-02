'use client';

import React from 'react';
import { SlotText } from 'slot-text/react';
import { cn } from '../../lib/cn';
import { semanticMotion } from '../../tokens';

/**
 * RollingText — 値が変わった瞬間だけ文字をロールさせる
 *
 * 状態やラベルが**実際に変わった時点**の表示に使う（スコア更新、バッジの遷移、
 * コピー→コピーしました）。カウントアップや装飾には使わない。
 *
 * ## 公開するのは3つだけ
 *
 * `text` / `direction` / `className`。slot-text の `options` は**公開しない**。
 * 任意の duration・easing・bounce・色を許すと画面ごとにモーションが分岐し、
 * この基盤が無くそうとしている「ずれ」が再発する。モーションは Kedama 側で固定する。
 *
 * ## モーションの固定値
 *
 * | 項目            | 値                               | 理由                                   |
 * | --------------- | -------------------------------- | -------------------------------------- |
 * | duration/easing | `semanticMotion['value-change']` | 値の変化はこの用途                     |
 * | `bounce`        | `0`                              | overshoot 禁止（仕様書 §3.5）          |
 * | `stagger`       | `0`                              | 全体の完了時間を duration に一致させる |
 * | `exitOffset`    | `0`                              | 同上                                   |
 * | `skipUnchanged` | `true`                           | 変わっていない文字は動かさない         |
 * | `interrupt`     | `true`                           | 途中で値が変わっても取りこぼさない     |
 *
 * `stagger` と `exitOffset` を 0 にするのは、slot-text の既定（45ms / 50ms）の
 * ままだと**全体の完了時間が `value-change` の 120ms を大きく超える**ため。
 * 1文字あたりの duration ではなく、変化が終わるまでの時間をトークンに合わせる。
 *
 * ## 例外：幅変更は slot-text 内部の固定値で動く
 *
 * 文字数が変わるときの幅のアニメーションは、slot-text が内部に持つ
 * `minimumTransitionMs: 140` と `resizeEasing: cubic-bezier(0.2, 0, 0, 1)` で
 * 動く。**公開 API から差し替えられない。** fork はせず、
 * 「slot-text 0.3.3 のレイアウト安定化処理」として受け入れる。
 * 文字ロール本体のトークン準拠とは別の話として扱う。
 *
 * ## SSR と reduced-motion
 *
 * どちらも**素のテキスト1層**を出す。`prefers-reduced-motion: reduce` は
 * フォールバック必須（動きが唯一の手掛かりにならない）。
 *
 * ## 二層構造（Ibuki から踏襲）
 *
 * 動きが有効なときだけ2層を重ねる。
 *
 * - **ちらつき防止**: SlotText は自分の mount effect で文字を組み立てるため、
 *   単体だと毎回1フレーム空白が出る。素のテキスト層を `ready` が立つまで
 *   見せ続ける。`ready` は `reduced` から再計算するので、hydration 経路
 *   （サーバ `true` → クライアント `false` で SlotText が再マウント）でも、
 *   実行中の OS 設定変更でも同じ保証が効く
 * - **a11y**: slot-text の1文字ごとの span は、読み上げのブラウズモードで
 *   断片として読まれる。SlotText 層は `aria-hidden` にし、素のテキスト層
 *   （`opacity-0` であって `visibility:hidden` ではない）を読み上げ・選択の
 *   対象として残す
 *
 * `aria-live` は**内蔵しない**。変化を読み上げるかは文脈で決まるので、
 * 必要な箇所で外から指定する。
 *
 * @example
 * ```tsx
 * <RollingText text={status} />
 * <span aria-live="polite">
 *   <RollingText text={count} />
 * </span>
 * ```
 */

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * MediaQueryList はモジュールに1つだけ持ち、全インスタンスで共有する。
 * インスタンスごとに購読すると、表の1行1バッジで listener が積み上がる。
 * 遅延初期化にしてモジュール読み込みを SSR 安全に保つ。
 */
let sharedMql: MediaQueryList | null = null;
const listeners = new Set<() => void>();

function getMql(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
  if (!sharedMql) {
    sharedMql = window.matchMedia(REDUCED_MOTION_QUERY);
    const notify = (): void => {
      for (const l of listeners) l();
    };
    // Safari <14 は addListener しか持たない
    if (typeof sharedMql.addEventListener === 'function') {
      sharedMql.addEventListener('change', notify);
    } else {
      sharedMql.addListener(notify);
    }
  }
  return sharedMql;
}

function subscribeReducedMotion(onChange: () => void): () => void {
  getMql();
  listeners.add(onChange);
  return (): void => {
    listeners.delete(onChange);
  };
}

/** 判定できない環境は reduced 扱い（安全側＝素のテキスト） */
function getReducedMotionSnapshot(): boolean {
  return getMql()?.matches ?? true;
}

/** `'120ms'` → `120`。slot-text は数値 ms を取る */
function toMilliseconds(value: string): number {
  return Number.parseFloat(value);
}

const { duration, easing } = semanticMotion['value-change'].tween;

/**
 * slot-text へ渡す固定オプション。**呼び出し側から差し替えられない。**
 * `direction` だけ後から重ねる。
 */
const FIXED_OPTIONS = {
  duration: toMilliseconds(duration),
  easing,
  // overshoot 禁止（仕様書 §3.5）。既定の 0.6 は跳ねる
  bounce: 0,
  // 既定（45 / 50）のままだと全体の完了が value-change の 120ms を大きく超える
  stagger: 0,
  exitOffset: 0,
  skipUnchanged: true,
  interrupt: true,
} as const;

export interface RollingTextProps {
  /** 現在の値。変わるとロールする */
  text: string;
  /**
   * ロールの向き。
   * @default 'down'
   */
  direction?: 'up' | 'down';
  className?: string;
}

export function RollingText({ text, direction = 'down', className }: RollingTextProps) {
  const reduced = React.useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    () => true,
  );

  // SlotText がマウントされ、文字を組み立て終えるまで false。
  // `reduced` を依存にしているので、動きが有効な側の分岐へ入るたびに
  // SlotText の populate effect の**後で**走る（子の effect が先に流れる）。
  // フォールバック層がロール層より先に消えることはない。
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    setReady(!reduced);
  }, [reduced]);

  const options = React.useMemo(() => ({ ...FIXED_OPTIONS, direction }), [direction]);

  if (reduced) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span data-slot="rolling-text" className={cn('inline-grid', className)}>
      <span className={cn('[grid-area:1/1]', ready && 'opacity-0')}>{text}</span>
      {/*
       * 表示の切替は**この wrapper** で行い、SlotText の className には触らない。
       * slot-text は実行時に自前のクラスを命令的に足すため、React 側から
       * className を更新すると消してしまう。
       */}
      <span aria-hidden className={cn('[grid-area:1/1] select-none', !ready && 'invisible')}>
        <SlotText text={text} options={options} />
      </span>
    </span>
  );
}

RollingText.displayName = 'RollingText';
