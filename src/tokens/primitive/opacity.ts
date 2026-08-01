/**
 * Kedama Design System — プリミティブ 不透明度トークン
 *
 * disabled 状態はセマンティックカラーで吸収済みのため、
 * ここでは主にオーバーレイ（scrim）用途を定義する。
 *
 * Calm UI の方針:
 * - モーダル背景は真っ暗にしない。背後をうっすら感じさせる
 */

export const opacity = {
  /** disabled 要素の不透明度（テキスト・アイコン等） */
  disabled: 0.4,
  /** scrim（モーダル・ダイアログの背景オーバーレイ）*/
  scrim: 0.5,
} as const;

/**
 * スクリム（オーバーレイ背景）のバックドロップブラー。
 *
 * ⚠️ **現時点で semantic からの参照が無い。** 未使用エクスポートとして削除しないこと。
 *    primitive は在庫であり、使われない値があってよい（spring プリセットや
 *    Light テーマの birch/900 と同じ扱い）。
 *
 * 2026-08-01、blur は**既定オフ**に決まった。理由は2つ:
 *
 *   1. scrim 50% だけで目的を達している。実画像で比較したところ、blur が無くても
 *      背面が不活性であることは明確に伝わった。blur は必要な機能を足すのではなく
 *      「さらに読めなくする」だけだった
 *   2. 全画面要素の backdrop-filter は GPU 負荷が高い。大きなテーブルを背面に持つ
 *      業務画面では体感の引っかかりになり得る。利用者の端末が高性能とは限らない
 *
 * それ以前は Modal が 8px（この値）、取り込んだ Sheet / Drawer が Tailwind 既定の
 * 4px を使っており、**同一システム内でブラーの強さが2種類**あった。両方外すことで
 * 解消している。
 *
 * ⚠️ 将来 blur を使う判断が出た場合は、**必ずこの単一値を経由させること**。
 *    4px / 8px が用途ごとに散らばる状態に戻さない。
 *
 * CSS イメージ:
 *   background: oklch(from birch-900 l c h / ${opacity.scrim});
 *   backdrop-filter: blur(${backdropBlur});
 *
 * 経緯: docs/phase-a2-decisions.md
 */
export const backdropBlur = '8px' as const;
