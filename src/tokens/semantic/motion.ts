/**
 * Kedama Design System — セマンティック モーショントークン
 *
 * 用途を意味する。値はプリミティブ（primitive/motion.ts）を参照する。
 *
 * ── トラックは選択肢ではない ──────────────────────────
 *
 * モーションには2つの表現手段がある。
 *   tween  — CSS の transition / animation で描画されるもの
 *   spring — Motion（`motion` パッケージ）で駆動されるもの
 *
 * **どちらを使うかは、コンポーネントの描画機構で決まる。**
 * CSS で描画される部品は tween、Motion で描画される部品は spring。
 * 実装者の好み・部品の重要度・見栄えでは選ばない。画面ごとに実装者が
 * 判断する状態こそ、この基盤が無くそうとしている失敗そのもの。
 *
 * 持たないトラックは定義しない。用途に `tween` しか無ければ、それは
 * CSS でしか描画されないという意味である。
 *
 * ── なぜ spring がほとんど無いのか（2026-07-29 実測にもとづく判断） ──
 *
 * spring の本質的価値は「跳ねること」ではなく「中断に強いこと」（§3.5）。
 * この原理を厳密に適用した結果、spring が必要なのは**中断が実際に
 * 起きうる直接操作系だけ**と確定した。
 *
 * 各プリセットを数値積分し、Motion の停止判定（restDelta / restSpeed
 * = 0.01）に到達するまでを実測した結果:
 *
 *   プリセット      収束     減衰比   overshoot
 *   fast            383ms    0.950    なし
 *   settle          480ms    0.930    なし
 *   press           345ms    0.950    なし
 *   directRelease   491ms    0.693    4.9%（境界衝突時のみ）
 *
 * 減衰比 0.93〜0.95 は臨界減衰にごく近く、この帯域の spring は ease-out
 * tween とほぼ同じ軌道を描く。つまり中断が起きない用途では、spring は
 * 「見た目が同じで 2〜3.7 倍遅いだけ」であり純粋に劣る。
 *
 * 同じ停止判定（残り1%）で tween 側と比べた比:
 *   押下フィードバック  tween 104ms ↔ spring 345ms   3.3×
 *   値の変化            tween 104ms ↔ spring 383ms   3.7×
 *   開閉                tween 209ms ↔ spring 480ms   2.3×
 *   オーバーレイ        tween 348ms ↔ spring 480ms   1.4×
 *
 * 当初（報告書 Q8 由来）はこれらすべてを spring に割り当てていた。その
 * まま Motion を導入すると、アプリ全体が 2〜3.7 倍遅くなる状態だった。
 * 誤っていたのは §3.5 の原理ではなく、当初の割当が広すぎたこと。
 *
 * ⚠️ 報告書 Q8 のモーション関連の記述は、そのまま採用せず実測で裏を取ること。
 *    誤りが見つかったのはこれで2件目（feedback-press の spring.fast 誤指定に続く）。
 *
 * primitive/motion.ts の spring は4プリセットとも残してある。primitive は
 * 在庫であり、使われない値があってよい（Light テーマで birch/900 が
 * 使われないのと同じ）。semantic は約束なので、駆動できない手段を指す
 * 約束は置かない。
 *
 * ── prefers-reduced-motion ──────────────────────────
 *
 * 担保箇所は2つ。個別コンポーネントには実装させない。
 *   1. グローバル CSS — tween を無効化する受け皿。
 *      実装は src/styles/tailwind.css の Reduced motion セクション
 *   2. プロバイダ層 — Motion の `MotionConfig reducedMotion="user"`。
 *      Motion 導入時に置く
 */

import { duration, easing, spring, inertia } from '../primitive/motion';

/** CSS の transition / animation で描画されるもの */
export interface TweenMotion {
  readonly duration: string;
  readonly easing: string;
}

/** Motion で駆動されるもの */
export interface SpringMotion {
  readonly spring: (typeof spring)[keyof typeof spring];
  readonly inertia?: (typeof inertia)[keyof typeof inertia];
}

export const semanticMotion = {
  /**
   * 押下フィードバック（Button 等）。
   *
   * 短いほど手応えが立つ。spring.press（345ms）は端的に劣化するため使わない。
   */
  'feedback-press': {
    tween: { duration: duration.fast, easing: easing.default },
  },

  /**
   * 値・状態が変わった瞬間（RollingText / IconSwap / ThemeToggle）。
   *
   * 📌 将来の見直し候補。ダッシュボードで中断が実際に起きうる最有力の用途。
   *    数値が 100→200 へ動いている最中に新しいデータで 150 が来ると、
   *    tween は速度が不連続に飛び、spring は繋がる。現状は 104ms で完了
   *    するため中断はまず起きない。**現時点では tween。ライブ更新する
   *    数値表示を導入する際に再検討する**（判断日 2026-07-29）。
   */
  'value-change': {
    tween: { duration: duration.fast, easing: easing.default },
  },

  /** オーバーレイの出現（Modal / Drawer / Toast）。overshoot なし */
  'overlay-enter': {
    tween: { duration: duration.slow, easing: easing.enter },
  },
  /** オーバーレイの退出 */
  'overlay-exit': {
    tween: { duration: duration.slow, easing: easing.exit },
  },

  /** 開閉（Accordion 等）。二値で中断されにくいため tween で足りる */
  'disclosure-expand': {
    tween: { duration: duration.normal, easing: easing.enter },
  },
  'disclosure-collapse': {
    tween: { duration: duration.normal, easing: easing.exit },
  },

  /**
   * ドラッグ・スワイプを離した後の着地。
   *
   * **spring を持つ唯一の用途。** 指が触れて連続的に動かしている最中は
   * 目標値が変わり続けるため、中断耐性が実際に効く。
   * overshoot が許されるのもここだけ（境界に衝突した場合のみ）。
   *
   * tween を持たないのは、CSS では現在速度を引き継げないため。
   * この用途を CSS で実装してはならない。
   */
  'drag-release': {
    spring: spring.directRelease,
    inertia: inertia.directRelease,
  },
} as const satisfies Record<string, { tween: TweenMotion } | SpringMotion>;

export type SemanticMotionToken = keyof typeof semanticMotion;

/**
 * コンポーネントごとの割当。
 *
 * - Button → feedback-press
 * - Badge / Card / Skeleton / Icon → 原則なし（Skeleton は既定で静止）
 * - Spinner → 連続回転は機能状態。reduced motion 時は静止＋ラベルに切替
 * - Drawer / Toast / Modal → overlay-enter / overlay-exit
 * - Accordion → disclosure-expand / disclosure-collapse
 * - ThemeToggle / IconSwap / RollingText → value-change
 * - Drawer のスワイプ / ドラッグ並べ替え → drag-release（Motion 導入が必要）
 */
