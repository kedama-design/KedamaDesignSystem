/**
 * Kedama Design System — プリミティブ タイポグラフィトークン
 *
 * 値そのものを持つ。用途は持たない。
 * セマンティックトークン（heading-2xl, body-md 等）から参照される。
 *
 * 設計方針:
 * - 日本語フォントサイズ: 調和数列スケール（分子8）
 *   参考: https://standard.shiftbrain.com/blog/harmonious-proportions-in-type-sizes
 *   1rem × 8/n（n は等差数列）で知覚的に均一なステップを生成
 * - フォント: DM Sans（見出し・UI英語）+ Noto Sans JP（日本語全般）+ Noto Sans Mono（数値・コード）
 * - タイポグラフィ主導の階層（原則2: Accessible）
 * - 用途ベース命名、h1〜h6 禁止（ルール 1.3）
 *
 * Figma Variables との対応:
 *   Collection: "Primitives" > Group: "Typography"
 */

// ─── Font Family ────────────────────────────────────────
//
// **フォントの読み込みはこのパッケージの責任範囲外。**
// ここで定義するのは font-family の「スタック」だけで、パッケージはフォント
// ファイルを同梱せず、@font-face も link タグも出力しない。実体の調達と読み込みは
// **消費側プロダクトの責任**（README「フォントの扱い」参照）。
// 読み込まれていない場合、スタックは system-ui へフォールバックする。
//
// Storybook（.storybook/preview.ts）だけは Google Fonts から3書体を読み込んでいる。
// これはトークンを目視レビューするための Storybook 専用の措置であり、
// ビルド成果物には含まれない。
//
// 数字の字幅について（2026-07-29 ブラウザ実測。
// 検証ページ: src/stories/NumericAlignment.stories.tsx）
//
// | フォント       | 既定の数字        | tnum の効果    | 1,111 / 8,888 (100px) |
// |----------------|-------------------|----------------|-----------------------|
// | Noto Sans JP   | **等幅**          | 変化なし（不要） | 揃う                 |
// | DM Sans        | プロポーショナル   | **効果なし**    | 143px / 261px        |
// | Noto Sans Mono | 等幅              | 変化なし（不要） | 揃う                 |
//
// DM Sans は OpenType の `tnum` フィーチャを持たない。`font-variant-numeric:
// tabular-nums` も `font-feature-settings: "tnum"` も字幅を変えなかった
// （同条件で Inter は 40.69/61.88 → 64.84/64.84 と揃うため、ブラウザ側は
// 正しく tnum を適用している）。したがって **桁を揃えたい数値を heading
// フォントで組んではならない**。
export const fontFamily = {
  /** 見出し・UI英語テキスト（DM Sans 優先、日本語フォールバック） */
  heading: '"DM Sans", "Noto Sans JP", system-ui, -apple-system, sans-serif',
  /** 日本語全般 — 本文・UI（Noto Sans JP 優先、英語フォールバック） */
  body: '"Noto Sans JP", "DM Sans", system-ui, -apple-system, sans-serif',
  /**
   * 桁を揃える数値専用（表・KPI・チャート軸ラベル）。
   *
   * body から **DM Sans を意図的に外している**。body の第2候補は DM Sans だが、
   * DM Sans はプロポーショナル数字で tnum も持たないため、Noto Sans JP の
   * 読み込みに失敗すると桁揃えが崩れる。system-ui へ直接落とすことで、
   * フォールバック時も `tabular-nums`（semantic 側で指定）が効く経路になる。
   */
  numeric: '"Noto Sans JP", system-ui, -apple-system, "Segoe UI", sans-serif',
  /**
   * ログ・コード・ID・ハッシュ。
   *
   * 数値の桁揃えは mono ではなく fontFamily.numeric + tabular-nums で行う
   * （Noto Sans JP の数字がもともと等幅であり、本文と字面を揃えられるため）。
   * mono は「文字単位で位置を数えたいテキスト」に限定する。
   */
  mono: '"Noto Sans Mono", "JetBrains Mono", "Fira Code", monospace',
} as const;

// ─── Font Size ──────────────────────────────────────────
// 調和数列スケール（分子8、基準 1rem = 16px）
//
// | トークン |  計算  |   rem      |  px(概算) |
// |----------|--------|------------|-----------|
// | 5xl      |  8/3   | 2.66667    | 42.67     |
// | 4xl      |  8/4   | 2          | 32        |
// | 3xl      |  8/5   | 1.6        | 25.6      |
// | 2xl      |  8/6   | 1.33333    | 21.33     |
// | xl       |  8/7   | 1.14286    | 18.29     |
// | lg       |  8/8   | 1（基準）  | 16        |
// | md       |  8/9   | 0.88889    | 14.22     |
// | sm       |  8/10  | 0.8        | 12.8      |
// | xs       |  8/11  | 0.72727    | 11.64     |
// | 2xs      |  8/12  | 0.66667    | 10.67     |
//
// 注: 本デザインシステムでは body のデフォルトを lg（1rem = 16px）とする。
//     md（14.22px）は補助テキスト、sm（12.8px）はキャプション用途。
export const fontSize = {
  /** 42.67px — heading-2xl（ページタイトル） 8/3 */
  '5xl': '2.66667rem',
  /** 32px — heading-xl  8/4 */
  '4xl': '2rem',
  /** 25.6px — heading-lg  8/5 */
  '3xl': '1.6rem',
  /** 21.33px — heading-md  8/6 */
  '2xl': '1.33333rem',
  /** 18.29px — heading-sm  8/7 */
  xl: '1.14286rem',
  /** 16px — body-lg（デフォルト本文）= 基準サイズ  8/8 */
  lg: '1rem',
  /** 14.22px — body-md（補助テキスト）  8/9 */
  md: '0.88889rem',
  /** 12.8px — body-sm（キャプション・ラベル）  8/10 */
  sm: '0.8rem',
  /** 11.64px — overline、極小テキスト  8/11 */
  xs: '0.72727rem',
  /** 10.67px — 最小サイズ（特殊用途のみ）  8/12 */
  '2xs': '0.66667rem',
} as const;

// ─── Font Weight ────────────────────────────────────────
// Noto Sans JP の利用可能ウェイト:
//   Thin(100), Light(300), DemiLight(350), Regular(400), Medium(500), Bold(700), Black(900)
// DM Sans の利用可能ウェイト:
//   Thin(100)〜Black(900) の可変フォント
// ※ Noto Sans JP に SemiBold(600) がないため、Medium(500) で代替する。
export const fontWeight = {
  /** 通常テキスト */
  regular: 400,
  /** やや強調（Figma: Medium） — 見出し lg/md/sm、overline に使用 */
  medium: 500,
  /** 最大強調（Figma: Bold） — 見出し 2xl/xl に使用 */
  bold: 700,
} as const;

// ─── Line Height ────────────────────────────────────────
// 日本語は英語より行間が必要。やや広めの設定にする。
export const lineHeight = {
  /** 見出し用（コンパクト） */
  tight: 1.3,
  /** 本文用（標準） */
  normal: 1.6,
  /** リード文・キャプション用（ゆったり） */
  relaxed: 1.8,
  /** 1行テキスト（ボタン、ラベル） */
  none: 1,
} as const;

// ─── Letter Spacing ─────────────────────────────────────
export const letterSpacing = {
  /** 見出しの大きなテキスト */
  tight: '-0.025em',
  /** 本文 */
  normal: '0em',
  /** overline、キャプション（大文字） */
  wide: '0.05em',
} as const;

/**
 * プリミティブ タイポグラフィ全体をエクスポート。
 */
export const primitiveTypography = {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
} as const;
