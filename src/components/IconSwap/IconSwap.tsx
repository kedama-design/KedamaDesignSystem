import React from 'react';
import { cn } from '../../lib/cn';

/**
 * IconSwap — 文脈に応じてアイコンを差し替える（コピー → チェック 等）
 *
 * ## 装飾であって通知ではない
 *
 * wrapper は**常に `aria-hidden`**。状態が変わったことは周囲のテキストや
 * Toast が伝える。動きだけが変化の唯一の手掛かりになってはいけない。
 *
 * ## 両方のアイコンを常に DOM に置く
 *
 * 差し替えではなく重ね置き。マウント／アンマウントで切り替えると、途中で
 * 状態が変わったときに前の動きを引き継げない。両方を置いて opacity と
 * scale を CSS で補間すれば、**切替中の再切替も途切れない**。
 *
 * ## 表示は `data-active` から CSS で導く
 *
 * React 側は状態を属性へ写すだけで、見た目のクラスを組み立てない。
 * 属性と見た目が二重管理になると、片方だけ直る事故が起きる
 * （ThemeToggle の `aria-pressed` と同じ考え方）。
 *
 * ## Ibuki からの変更点
 *
 * - `globals.css` の `.iswap` クラス依存をやめ、トークン経由の
 *   ユーティリティで書き直した
 * - **blur 演出は持ち込まない**。opacity と scale に絞る。ぼかしは
 *   「一瞬の不調」に見えやすく、Calm UI では利得より副作用が大きい
 * - `160ms` の直値をやめ、`duration-fast` / `ease-default` を使う
 *   （アイコンの差し替えは「色や不透明度の変化」の系統。
 *   `docs/motion-token-mapping.md` §1）
 *
 * reduced-motion はグローバル CSS が一括で止めるため、ここでは分岐しない。
 * 動きが消えても**即時に切り替わる**（情報は失われない）。
 *
 * @example
 * ```tsx
 * <IconSwap active={copied} base={<CopyIcon />} swap={<CheckIcon />} />
 * <span aria-live="polite">{copied ? 'コピーしました' : ''}</span>
 * ```
 */
export interface IconSwapProps {
  /** false のとき `base`、true のとき `swap` を見せる */
  active: boolean;
  base: React.ReactNode;
  swap: React.ReactNode;
  /** 寸法はここで変える（既定は `1em × 1em` ＝ 周囲の文字サイズに追従） */
  className?: string;
}

/** 2つのアイコンを同じマスへ重ねる。svg は寸法指定が無ければ枠いっぱいに */
const LAYER = [
  'col-start-1 row-start-1',
  'inline-flex items-center justify-center',
  // Tailwind v4 の `scale-*` は独立した `scale` プロパティを使う（`transform` ではない）。
  // `transition-[opacity,transform]` と書くとスケールが補間されず瞬間的に飛ぶ。
  // 実測で発覚（transition-property が "opacity, transform" のまま scale が動いた）。
  'transition-[opacity,scale] duration-fast ease-default',
  "[&_svg:not([class*='size-'])]:size-full",
] as const;

export function IconSwap({ active, base, swap, className }: IconSwapProps) {
  return (
    <span
      aria-hidden
      data-slot="icon-swap"
      // 属性が付いているかどうかだけを見る（`data-active` バリアント）
      data-active={active ? '' : undefined}
      className={cn(
        'group/icon-swap relative inline-grid size-[1em] shrink-0 align-middle',
        className,
      )}
    >
      <span
        className={cn(
          LAYER,
          'scale-100 opacity-100',
          'group-data-active/icon-swap:scale-[0.7] group-data-active/icon-swap:opacity-0',
        )}
      >
        {base}
      </span>
      <span
        className={cn(
          LAYER,
          'scale-[0.7] opacity-0',
          'group-data-active/icon-swap:scale-100 group-data-active/icon-swap:opacity-100',
        )}
      >
        {swap}
      </span>
    </span>
  );
}

IconSwap.displayName = 'IconSwap';
