/**
 * Kedama Design System — プリミティブ モーショントークン
 *
 * Calm UI におけるアニメーションは「装飾」ではなく「状態変化の案内役」。
 * 急な変化を避け、穏やかなイージングと適切な duration で
 * ユーザーを優しく誘導する。
 *
 * 設計方針:
 * - duration は用途別に3段階（即時フィードバック / 標準 / 大きな変化）
 * - easing は有機的な動き（機械的な linear を避ける）
 * - prefers-reduced-motion を必ず尊重すること（コンポーネント実装時）
 */

// ─── Duration ───────────────────────────────────────────
export const duration = {
  /**
   * 0ms — prefers-reduced-motion: reduce 用。
   * すべてのトランジション duration をこの値に差し替える前提で使う。
   *
   * CSS イメージ:
   *   @media (prefers-reduced-motion: reduce) {
   *     * { transition-duration: var(--duration-reduced) !important; }
   *   }
   */
  reduced: '0ms',
  /** 120ms — ホバー、フォーカスなど即時フィードバック */
  fast: '120ms',
  /** 240ms — 標準的なUI変化（アコーディオン、タブ切替など） */
  normal: '240ms',
  /** 400ms — 大きな変化（モーダル出入り、ページ遷移）。余韻を残す */
  slow: '400ms',
} as const;

// ─── Easing ─────────────────────────────────────────────
export const easing = {
  /** 標準イージング — ほとんどのUI操作に使用 */
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** 要素の出現（フェードイン、スライドイン） */
  enter: 'cubic-bezier(0, 0, 0.2, 1)',
  /** 要素の退出（フェードアウト、スライドアウト） */
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
} as const;

// ─── Spring（物理演算 — Motion の `type: 'spring'`） ─────
//
// 出典: docs/codex-investigation-report.md Q8。
// Nexvyn UI の motion-tokens.ts を参考値としつつ、Kedama の
// 「直接操作以外に overshoot を持ち込まない」方針に合わせて再調整した値。
//
// spring の本質的価値は「跳ねること」ではなく「中断に強いこと」。
// 固定 duration の tween は途中で状態が変わると速度が不連続に飛ぶが、
// spring は現在速度を引き継ぐため繋がる（装飾ではなく可読性）。
//
// これらは CSS transition では表現できないため tokens.css には出力しない。
// Motion（`motion` パッケージ）の transition 引数へそのまま渡す。
export const spring = {
  /** 即時フィードバック。値の変化など短く収束させたいもの */
  fast: { type: 'spring', stiffness: 400, damping: 34, mass: 0.8 },
  /** 標準。オーバーレイの出入り、開閉。overshoot なし */
  settle: { type: 'spring', stiffness: 260, damping: 30, mass: 1 },
  /** 押し込みの手応え */
  press: { type: 'spring', stiffness: 500, damping: 38, mass: 0.8 },
  /**
   * 直接操作（ドラッグ・スワイプ）の着地。
   * damping を下げてあり、境界に当たったときだけ overshoot が出る。
   * 指が触れていない遷移には使わないこと。
   */
  directRelease: { type: 'spring', stiffness: 300, damping: 24, mass: 1 },
} as const;

// ─── Inertia（減衰 — Motion の `type: 'inertia'`） ────────
//
// spring の damping とは別ソルバー。指を離した後の慣性スクロール／
// スナップに使う。`modifyTarget` / `min` / `max` は利用側で指定する。
export const inertia = {
  /** ドラッグ・スワイプを離した直後の余韻 */
  directRelease: { type: 'inertia', power: 0.25, timeConstant: 250 },
} as const;

/**
 * プリミティブ モーション全体をエクスポート。
 */
export const motion = {
  duration,
  easing,
  spring,
  inertia,
} as const;
