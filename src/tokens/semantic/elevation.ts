import { shadow } from '../primitive/shadow';

/**
 * Kedama Design System — セマンティック エレベーショントークン
 *
 * 用途を意味する。値はプリミティブ（primitive/shadow.ts）を参照する。
 *
 * ── なぜ用途名を挟むのか ──────────────────────────────
 *
 * 部品が `shadow-sm` / `shadow-lg` を直に書くと、「なぜその段なのか」が
 * コードに残らない。段は見た目の強さではなく**その面が何であるか**で決まる。
 * §3.3 の primitive → semantic → component の順序を、影にも適用する。
 *
 * ── 段の定義（2026-08-02 確定） ──────────────────────
 *
 * 実装の実測から出た形を、規則として追認したもの。
 *
 *   影なし   操作部品        Button など。面ではないので浮かない
 *   raised   地の上に浮く面  Card
 *   overlay  オーバーレイ    Modal / Drawer / Toast / 将来の Popover
 *
 * 「操作部品には影を付けない」は明示的な規則である。ボタンが浮くと、
 * 画面の中で最も数が多い要素が一斉に浮いて騒がしくなる（Calm UI）。
 * ボタンの状態は面の高さではなく、色とフォーカスリングで伝える。
 *
 * ── 影の「色」は shadcn ではなく Kedama が決める ──────
 *
 * §0.6 の既定ルールでは「エレベーション → shadcn が正」だが、これが決めるのは
 * **段の有無と割当**（Card は raised、オーバーレイは overlay）であって、影の
 * **色**ではない。色はトークンの領域であり、暖色（birch）のパレットには
 * 無機質な黒より、ブランドカラーを混ぜた影の方が合う。
 * したがって `overlay` は Kedama 独自の値（primary/600 を 12% 混ぜた
 * shadow.lg）を使う。
 *
 * ── 使い方 ────────────────────────────────────────────
 *
 * Tailwind では用途名のユーティリティを使う。
 *
 *   <Card />     → `shadow-raised`
 *   <Modal /> 等 → `shadow-overlay`
 *
 * `shadow-sm` / `shadow-lg` を部品に直接書かないこと。
 *
 * ── md について ──────────────────────────────────────
 *
 * `shadow.md` はどの用途にも割り当てていない。primitive は在庫、semantic は
 * 約束であり、在庫に未使用の段があるのは正常な状態（Popover やホバー時の
 * カードが必要になったら、ここに用途を足して割り当てる）。
 */
export const elevation = {
  /**
   * 地の上に浮く面。カードなど、ページの流れの中にありながら
   * 面として立っているもの。
   * = shadow.sm（blur 8px / opacity 4%）
   */
  raised: shadow.sm,

  /**
   * 他のすべての上に載るもの。モーダル、ドロワー、トースト、ポップオーバー。
   * = shadow.lg（ブランドカラーを混ぜた2層シャドウ）
   */
  overlay: shadow.lg,
} as const;

export type ElevationLevel = keyof typeof elevation;
