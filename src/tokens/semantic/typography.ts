/**
 * Kedama Design System — セマンティック タイポグラフィトークン
 *
 * 用途ベースの命名（h1〜h6 禁止、ルール 1.3）。
 * 各スタイルは fontFamily / fontSize / fontWeight / lineHeight / letterSpacing の組み合わせ。
 *
 * フォント使い分け:
 *   heading → fontFamily.heading（DM Sans 優先 — 見出し・UI英語テキスト）
 *   body / caption / overline → fontFamily.body（Noto Sans JP 優先 — 日本語全般）
 *
 * ビジュアルの役割と HTML のセマンティクスは別の軸:
 *   heading-xl が <h2> になるか <h3> になるかは文脈次第。
 *   コード側では適切な HTML 要素と ARIA 属性を必ず付与する。
 *
 * Figma Styles との対応:
 *   Text Styles として定義
 *   例: heading/2xl, body/md, caption
 */

import {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
} from '../primitive/typography';

// ─── 型定義 ─────────────────────────────────────────────
export type TypographyStyle = {
  fontFamily: string;
  fontSize: string;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: string;
  /**
   * 数字の字形指定（`font-variant-numeric`）。
   * 桁を揃える数値スタイルだけが持つ。省略時は指定なし。
   */
  fontVariantNumeric?: string;
};

// ─── Heading（見出し） ──────────────────────────────────
// DM Sans 優先。日本語が混在する見出しでは Noto Sans JP にフォールバック。

/** ページタイトル — 42.67px (8/3) */
export const heading2xl: TypographyStyle = {
  fontFamily: fontFamily.heading,
  fontSize: fontSize['5xl'],
  fontWeight: fontWeight.bold,
  lineHeight: lineHeight.tight,
  letterSpacing: letterSpacing.tight,
};

/** セクション見出し（大） — 32px (8/4) */
export const headingXl: TypographyStyle = {
  fontFamily: fontFamily.heading,
  fontSize: fontSize['4xl'],
  fontWeight: fontWeight.bold,
  lineHeight: lineHeight.tight,
  letterSpacing: letterSpacing.tight,
};

/** セクション見出し（中） — 25.6px (8/5) */
export const headingLg: TypographyStyle = {
  fontFamily: fontFamily.heading,
  fontSize: fontSize['3xl'],
  fontWeight: fontWeight.medium,
  lineHeight: lineHeight.tight,
  letterSpacing: letterSpacing.tight,
};

/** セクション見出し（小） — 21.33px (8/6) */
export const headingMd: TypographyStyle = {
  fontFamily: fontFamily.heading,
  fontSize: fontSize['2xl'],
  fontWeight: fontWeight.medium,
  lineHeight: lineHeight.tight,
  letterSpacing: letterSpacing.normal,
};

/** カード見出し、サブセクション — 18.29px (8/7) */
export const headingSm: TypographyStyle = {
  fontFamily: fontFamily.heading,
  fontSize: fontSize.xl,
  fontWeight: fontWeight.medium,
  lineHeight: lineHeight.tight,
  letterSpacing: letterSpacing.normal,
};

// ─── Body（本文） ───────────────────────────────────────
// Noto Sans JP 優先。日本語の可読性を最優先。

/** デフォルト本文・リード文 — 16px (8/8 = 基準サイズ) */
export const bodyLg: TypographyStyle = {
  fontFamily: fontFamily.body,
  fontSize: fontSize.lg,
  fontWeight: fontWeight.regular,
  lineHeight: lineHeight.normal,
  letterSpacing: letterSpacing.normal,
};

/** 補助テキスト — 14.22px (8/9) */
export const bodyMd: TypographyStyle = {
  fontFamily: fontFamily.body,
  fontSize: fontSize.md,
  fontWeight: fontWeight.regular,
  lineHeight: lineHeight.normal,
  letterSpacing: letterSpacing.normal,
};

/** 注釈、フッター — 12.8px (8/10) */
export const bodySm: TypographyStyle = {
  fontFamily: fontFamily.body,
  fontSize: fontSize.sm,
  fontWeight: fontWeight.regular,
  lineHeight: lineHeight.normal,
  letterSpacing: letterSpacing.normal,
};

// ─── Caption & Overline ─────────────────────────────────

/** ラベル、メタ情報 — 11.64px (8/11) */
export const caption: TypographyStyle = {
  fontFamily: fontFamily.body,
  fontSize: fontSize.xs,
  fontWeight: fontWeight.regular,
  lineHeight: lineHeight.relaxed,
  letterSpacing: letterSpacing.normal,
};

/** カテゴリ表示、セクションラベル（大文字推奨） — 10.67px (8/12) */
export const overline: TypographyStyle = {
  fontFamily: fontFamily.body,
  fontSize: fontSize['2xs'],
  fontWeight: fontWeight.medium,
  lineHeight: lineHeight.relaxed,
  letterSpacing: letterSpacing.wide,
};

// ─── Numeric（桁を揃える数値） ──────────────────────────
//
// 表の数値・KPI・チャート軸ラベルなど「縦に並べて桁位置を比べる」数値専用。
//
// **mono ではなく本文フォント（Noto Sans JP）で組む。** 2026-07-29 の実測で
// Noto Sans JP の数字はもともと等幅（0〜9 すべて同じ字送り）であることを
// 確認したため、桁揃えのために字面の違う等幅フォントへ切り替える必要がない。
// 本文と同じ字面のまま数値が揃うほうが Calm UI の落ち着きに合う。
// 検証ページ: src/stories/NumericAlignment.stories.tsx
//
// `tabular-nums` は Noto Sans JP 上では実質 no-op だが、**フォールバック時の
// 保険として必ず付ける**。system-ui（SF Pro / Segoe UI）は既定がプロポーショナル
// 数字で、かつ tnum に対応しているため、この宣言があるかどうかで揃うかが決まる。
//
// **heading フォント（DM Sans）は使用禁止。** DM Sans は tnum を持たず、
// `1,111` と `8,888` の幅が 100px 指定で 143px と 261px にまで開く。
// 大きな KPI 数値も numeric-xl（body 系）で組むこと。

/** チャート軸ラベル・高密度テーブル — 12.8px (8/10) */
export const numericSm: TypographyStyle = {
  fontFamily: fontFamily.numeric,
  fontSize: fontSize.sm,
  fontWeight: fontWeight.regular,
  lineHeight: lineHeight.normal,
  letterSpacing: letterSpacing.normal,
  fontVariantNumeric: 'tabular-nums',
};

/** 表の数値（既定） — 14.22px (8/9) */
export const numericMd: TypographyStyle = {
  fontFamily: fontFamily.numeric,
  fontSize: fontSize.md,
  fontWeight: fontWeight.regular,
  lineHeight: lineHeight.normal,
  letterSpacing: letterSpacing.normal,
  fontVariantNumeric: 'tabular-nums',
};

/** KPI・主役の数値 — 32px (8/4)。heading-xl と同サイズだが body 系フォント */
export const numericXl: TypographyStyle = {
  fontFamily: fontFamily.numeric,
  fontSize: fontSize['4xl'],
  fontWeight: fontWeight.medium,
  lineHeight: lineHeight.tight,
  letterSpacing: letterSpacing.normal,
  fontVariantNumeric: 'tabular-nums',
};

/**
 * セマンティック タイポグラフィ全体をエクスポート。
 * コンポーネントでの参照例:
 *   import { semanticTypography } from '@/tokens';
 *   const style = semanticTypography['heading-2xl'];
 */
export const semanticTypography = {
  'heading-2xl': heading2xl,
  'heading-xl': headingXl,
  'heading-lg': headingLg,
  'heading-md': headingMd,
  'heading-sm': headingSm,
  'body-lg': bodyLg,
  'body-md': bodyMd,
  'body-sm': bodySm,
  caption,
  overline,
  'numeric-sm': numericSm,
  'numeric-md': numericMd,
  'numeric-xl': numericXl,
} as const;
