/**
 * Kedama Design System — プリミティブ データ可視化トークン（非色）
 *
 * data-viz の**色**は新しいプリミティブを作らない。既存パレット
 * （birch / primary）を semantic 層でエイリアスする
 * （docs/codex-investigation-report.md Q5「すべて primitive alias とし、
 * status color を系列色に流用しない」）。
 *
 * このファイルが持つのは、チャートに必要で既存プリミティブのどこにも
 * 無かった**非色の値**だけ。線幅・破線パターン・ヒートマップのセル寸法は
 * spacing や borderWidth の意味論とは別物のため、独立させる。
 *
 * 値の出所: Ibuki プロトタイプ（docs/prototypes/ibuki_prototype.html）の実測。
 *   - 目標線 / 参照線: stroke-width="1.5" stroke-dasharray="4 4"
 *   - 軸目盛り・グリッド: stroke-width 既定（1px）
 *
 * Figma Variables との対応:
 *   Collection: "Primitives" > Group: "data-viz"
 */

// ─── Stroke Width ───────────────────────────────────────
export const dataVizStroke = {
  /** 軸線 */
  axis: '1px',
  /** グリッド線 */
  grid: '1px',
  /** 系列線（折れ線・スパークライン） */
  series: '1.5px',
  /** 参照線・目標線 */
  reference: '1.5px',
} as const;

// ─── Dash Pattern ───────────────────────────────────────
// SVG `stroke-dasharray` にそのまま渡す文字列。
export const dataVizDash = {
  /** 実線 */
  solid: 'none',
  /** 参照線・目標線（Ibuki プロトタイプ実測値） */
  reference: '4 4',
  /** 補助グリッド */
  grid: '2 4',
} as const;

// ─── Heatmap Geometry ───────────────────────────────────
// 草ヒートマップ（週 × 曜日グリッド）のセル寸法。
export const dataVizHeatmap = {
  /** セルの一辺 */
  cell: '11px',
  /** セル間の間隔 */
  gap: '3px',
  /** セルの角丸 */
  radius: '2px',
} as const;

/**
 * プリミティブ data-viz 全体をエクスポート。
 */
export const dataVizPrimitives = {
  stroke: dataVizStroke,
  dash: dataVizDash,
  heatmap: dataVizHeatmap,
} as const;
