/**
 * Kedama Design System — セマンティック モーショントークン
 *
 * 用途を意味する。値はプリミティブ（primitive/motion.ts）を参照する。
 * 割当は docs/codex-investigation-report.md Q8 に従う。
 *
 * **採用の線引き（仕様書 §3.5）**
 *   overshoot を使ってよいのは「自分の指が対象に触れて連続的に動かしている」
 *   操作の余韻だけ（ドラッグ・スワイプ）。それ以外はすべて damped。
 *   境界は「ユーザーが操作したか」ではない。
 *
 * **prefers-reduced-motion は必須**（Calm > Accessible の優先順位より選択肢ではない）。
 *   Motion の `MotionConfig reducedMotion="user"` をプロバイダ層で一括適用し、
 *   個別コンポーネントに実装させない。Provider は Phase A-2 の範囲。
 *
 * これらは CSS transition では表現できないため tokens.css には出力しない。
 * CSS で完結する単純なトランジションには primitive の duration / easing を使う。
 */

import { spring, inertia } from '../primitive/motion';

export const semanticMotion = {
  /**
   * 押下フィードバック（Button 等）。primitive は `spring.press` を使う。
   *
   * 報告書 Q8 はこれを `spring.fast` に割り当てていたが、**報告書側の誤り**として
   * 訂正した（2026-07-29 ユーザー判断）。根拠は2つ。
   *   1. primitive の `spring.press` のコメントが「押し込みの手応え」と用途を
   *      名指ししている。用途名が一致するものを使わない理由がない
   *   2. パラメータも press のほうが押下に適している。fast（stiffness 400 /
   *      damping 34）より press（500 / 38）は硬く、かつ強く減衰するため、
   *      指を離した瞬間に素早く収まる＝押した手応えとして読める
   */
  'feedback-press': spring.press,

  /** オーバーレイの出現（Modal / Drawer / Toast）。overshoot なし */
  'overlay-enter': spring.settle,
  /** オーバーレイの退出 */
  'overlay-exit': spring.settle,

  /** 開閉（Accordion 等） */
  'disclosure-expand': spring.settle,
  'disclosure-collapse': spring.settle,

  /** 値・状態が変わった瞬間（RollingText / IconSwap / ThemeToggle） */
  'value-change': spring.fast,

  /**
   * ドラッグ・スワイプを離した後の着地。
   * **overshoot が許される唯一の用途**（境界に衝突した場合のみ）。
   */
  'drag-release': inertia.directRelease,
} as const;

export type SemanticMotionToken = keyof typeof semanticMotion;

/**
 * コンポーネントごとの割当（報告書 Q8）。Phase A-2 の実装時に参照する。
 *
 * - Button → feedback-press
 * - Badge / Card / Skeleton / Spinner / Icon → 原則なし
 * - Drawer / Toast → overlay-enter / overlay-exit
 * - Accordion → disclosure-expand / disclosure-collapse
 * - ThemeToggle / IconSwap / RollingText → value-change
 *
 * Spinner の連続回転は機能状態だが、reduced motion 時は
 * 静止アイコン＋ラベルに切り替える。
 */
