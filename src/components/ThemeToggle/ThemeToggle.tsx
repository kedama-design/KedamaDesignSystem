'use client';

import React from 'react';
import { cn } from '../../lib/cn';
import { useTheme, type ThemeSetting } from '../ThemeProvider';

/**
 * ThemeToggle — テーマを選ぶ segmented control
 *
 * ## 選択肢は4つ（3テーマ ＋ 自動）
 *
 * `system` はテーマ名ではなく「OS に追随する」指示なので、選択肢としては
 * 並ぶが解決先は `light` か `dark` になる。
 *
 * ## `aria-pressed` が唯一の正
 *
 * **見た目は `aria-pressed` から CSS で導く**（`aria-pressed:` バリアント）。
 * 押下状態を JS 側の条件分岐でクラスに変換すると、支援技術に伝わる状態と
 * 目に見える状態が二重管理になり、片方だけ直る事故が起きる。
 *
 * ## 選択は「解決値」ではなく「利用者の選択」に付く
 *
 * `system` を選んで Light に解決されているとき、押下状態になるのは
 * **「自動」**であって「ライト」ではない。利用者が選んだのは追随であり、
 * 現在の見た目はその結果に過ぎない。
 *
 * ## SSR ではコントロールを隠さない
 *
 * マウント前でも4つの選択肢を**同じ寸法で**描画し、全項目を未選択にする。
 * `mounted` まで何も出さないと、コントロールが遅れて現れて場所が動く。
 * サーバとクライアント初回で同じマークアップになるため、ハイドレーション
 * 不一致も起きない（変わるのは `aria-pressed` だけ）。
 *
 * 押下状態でサイズが変わらないよう、選択時に太字にしない・境界線を足さない。
 * 変えるのは面と文字色だけ。
 *
 * ## i18n
 *
 * ライブラリは足さない。差し替えたいときは `labels` に必要な分だけ渡す。
 *
 * @example
 * ```tsx
 * <ThemeToggle />
 * <ThemeToggle labels={{ system: 'OSに合わせる' }} ariaLabel="配色" />
 * ```
 */

/** 表示順。`system` は「その他」なので最後 */
const ORDER = ['light', 'dark', 'deep-dark', 'system'] as const satisfies readonly ThemeSetting[];

const DEFAULT_LABELS: Record<ThemeSetting, string> = {
  light: 'ライト',
  dark: 'ダーク',
  'deep-dark': 'ディープ',
  system: '自動',
};

export interface ThemeToggleProps {
  /** 既定ラベルの差し替え。必要な分だけ渡す */
  labels?: Partial<Record<ThemeSetting, string>>;
  /**
   * コントロール全体の名前。
   * @default 'テーマ'
   */
  ariaLabel?: string;
  className?: string;
}

export function ThemeToggle({ labels, ariaLabel = 'テーマ', className }: ThemeToggleProps) {
  const { theme, setTheme, mounted } = useTheme();

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      data-slot="theme-toggle"
      className={cn(
        'inline-flex items-center gap-0.5',
        'rounded-sm border border-border-default bg-surface p-0.5',
        className,
      )}
    >
      {ORDER.map((value) => (
        <button
          key={value}
          type="button"
          // マウント前は全項目を未選択にする。サーバは利用者の選択を読めない。
          aria-pressed={mounted ? theme === value : false}
          onClick={() => setTheme(value)}
          className={cn(
            'h-7 rounded-sm px-3 text-sm font-medium whitespace-nowrap',
            'transition-colors duration-fast ease-default',
            'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus',
            // 未選択
            'text-fg-muted hover:bg-hover',
            // 選択（aria-pressed から導く。サイズを変える指定は置かない）
            'aria-pressed:bg-accent-primary aria-pressed:text-accent-primary-fg',
          )}
        >
          {labels?.[value] ?? DEFAULT_LABELS[value]}
        </button>
      ))}
    </div>
  );
}

ThemeToggle.displayName = 'ThemeToggle';
