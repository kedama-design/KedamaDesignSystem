/**
 * Kedama Design System — セマンティックカラーのテーマ契約
 *
 * Light / Dark / Deep-dark の3テーマは**同一のキー集合**を持つ。
 * この型がその契約を強制する（キーの追加漏れをコンパイル時に検出）。
 *
 * 参照: docs/cross-product-ui-library-spec.md §0.6・§0.7
 */

/**
 * プリミティブ色にアルファを掛けた合成色。
 *
 * セマンティックトークンに `rgba(...)` の直値を書くと
 * `docs/design-rules.md` 1.1「セマンティックトークンに直接値を書かない。
 * 必ずプリミティブを参照する」に違反する。この形で持つことで、
 * generator が `color-mix(in srgb, var(--primitive-color-birch-900) 50%, transparent)`
 * を出力でき、参照関係が保たれる。
 */
export interface ColorMix {
  readonly mix: {
    /** ベースとなるプリミティブ色の HEX 値 */
    readonly color: string;
    /** 0–1 のアルファ */
    readonly alpha: number;
  };
}

/** セマンティックカラーが取りうる値。HEX 文字列か、プリミティブのアルファ合成。 */
export type ColorValue = string | ColorMix;

export function isColorMix(value: ColorValue): value is ColorMix {
  return typeof value === 'object' && value !== null && 'mix' in value;
}

// ─── Foreground ─────────────────────────────────────────
export interface ForegroundColors {
  /** メインテキスト */
  default: string;
  /**
   * 二次テキスト（Ibuki `--text-light` 相当）。
   * 本文として読ませるため 4.5:1 を満たす。
   */
  secondary: string;
  /**
   * 補助テキスト・軸ラベルなど「読ませる」もの。4.5:1 を満たす。
   * bg.subtle の上では使わない（fg.secondary を使う）— §0.7。
   */
  muted: string;
  /**
   * 純装飾（区切り記号、装飾的な図形）。3:1 目標。
   * **意味のある文字には使用禁止**（§0.7 運用ルール1）。
   */
  decorative: string;
  /** 入力欄のプレースホルダー（WCAG 3:1 以上） */
  placeholder: string;
  /** 無効状態のテキスト */
  disabled: string;
  /** 反転背景上のテキスト */
  inverse: string;
  /** リンクテキスト */
  link: string;
  /** ホバー時のリンクテキスト */
  'link-hover': string;
}

// ─── Background ─────────────────────────────────────────
export interface BackgroundColors {
  /** ページ全体の背景（キャンバス） */
  page: string;
  /** サイドバーの背景。Dark 系では page と分離する */
  sidebar: string;
  /** カード・セクションの背景 */
  surface: string;
  /** 浮き上がった要素の背景（モーダル等） */
  'surface-raised': string;
  /**
   * subtle な区別を付けたい領域（チップ、ウェル、押下状態、テーブル偶数行）。
   * Ibuki `--surface-200` / `--bg-alt` 相当。
   */
  subtle: string;
  /** subtle より一段強い面。Ibuki `--surface-300` 相当 */
  'subtle-strong': string;
  /** インタラクティブ要素のホバー背景 */
  hover: string;
  /** 選択中の要素の背景 */
  selected: string;
  /** モーダルのスクリム。プリミティブのアルファ合成で持つ */
  scrim: ColorMix;
  /** 反転背景 */
  inverse: string;
  /** 無効状態の背景 */
  disabled: string;
}

// ─── Border ─────────────────────────────────────────────
export interface BorderColors {
  /** 標準のボーダー（ヘアライン志向） */
  default: string;
  /**
   * 強調ボーダー（WCAG 非テキストコントラスト 3:1 確保）。
   * **入力コントロールの枠線はこれを使う**（§0.7 運用ルール2）。
   */
  strong: string;
  /** 控えめなボーダー（ディバイダー） */
  muted: string;
  /** アクティブ・選択状態のボーダー */
  active: string;
  /** フォーカスリング */
  focus: string;
  /** エラー状態のボーダー */
  error: string;
  /** 無効状態のボーダー */
  disabled: string;
}

// ─── Accent ─────────────────────────────────────────────
export interface AccentColors {
  primary: string;
  'primary-hover': string;
  'primary-active': string;
  'primary-subtle': string;
  'primary-fg': string;
  // `tertiary` は 2026-07-31 に廃止（primitive の amber ごと）。
  // 未使用であり、かつ amber の色相 82.1° が新 warning 84.0° と衝突したため。
  /**
   * 破壊的アクション（削除ボタン等）の面。
   *
   * `status.danger`（状態の**表示**）とは役割が違うので分けている。
   * status 側は「いま異常が起きている」を伝えるテキスト・バッジの色、
   * accent.danger は「押すと壊れる」アクションの色。
   * hover / active を持つのは後者だけなので、同じ token に相乗りさせない。
   */
  danger: string;
  'danger-hover': string;
  'danger-active': string;
  'danger-fg': string;
}

// ─── Status ─────────────────────────────────────────────
export interface StatusColors {
  success: string;
  'success-bg': string;
  'success-border': string;
  'success-solid': string;
  'success-fg': string;

  warning: string;
  'warning-bg': string;
  'warning-border': string;
  'warning-solid': string;
  'warning-fg': string;

  danger: string;
  'danger-bg': string;
  'danger-border': string;
  'danger-solid': string;
  'danger-fg': string;

  info: string;
  'info-bg': string;
  'info-border': string;
  'info-solid': string;
  'info-fg': string;
}

// ─── Data Visualization ─────────────────────────────────
/**
 * チャート本体は Tier 2（レジストリ配布）へ移ったが、
 * **一貫性はコードではなくトークンで担保する**ため、
 * data-viz セマンティックは Tier 0（npm）側に置く（仕様書 §4）。
 *
 * status color を系列色に流用しないこと（報告書 Q5）。
 */
export interface DataVizColors {
  /** 中立系列 1（最も淡い） */
  'categorical-neutral-primary': string;
  /** 中立系列 2 */
  'categorical-neutral-secondary': string;
  /** 中立系列 3（前期比較などの「前」の系列） */
  'categorical-neutral-previous': string;
  /** 強調系列。意味を担う唯一の彩度アクセント */
  'emphasis-positive': string;
  /** 軸線 */
  'axis-default': string;
  /** グリッド線 */
  'grid-default': string;
  /** ヒートマップ 5段階（活動量ゼロ → 最大） */
  'heatmap-empty': string;
  'heatmap-low': string;
  'heatmap-medium': string;
  'heatmap-high': string;
  'heatmap-max': string;
}

// ─── Theme ──────────────────────────────────────────────
export interface SemanticColorTheme {
  fg: ForegroundColors;
  bg: BackgroundColors;
  border: BorderColors;
  accent: AccentColors;
  status: StatusColors;
  dataViz: DataVizColors;
}

/** テーマ名。CSS では `[data-theme="..."]` に対応する */
export type ThemeName = 'light' | 'dark' | 'deep-dark';
