import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { IconSwap } from './IconSwap';

/**
 * IconSwap の契約。
 *
 * 表示は `data-active` から CSS で導くので、テストも属性だけを見る
 * （クラス名の見た目部分は見ない。見ると二重管理の片方をテストすることになる）。
 */

function Fixture({ active }: { active: boolean }) {
  return (
    <IconSwap
      active={active}
      base={<span data-testid="base">base</span>}
      swap={<span data-testid="swap">swap</span>}
    />
  );
}

describe('IconSwap', () => {
  it('keeps both icons in the DOM（切替中の再切替を途切れさせない）', () => {
    const { rerender } = render(<Fixture active={false} />);
    expect(screen.getByTestId('base')).toBeInTheDocument();
    expect(screen.getByTestId('swap')).toBeInTheDocument();

    rerender(<Fixture active />);
    expect(screen.getByTestId('base')).toBeInTheDocument();
    expect(screen.getByTestId('swap')).toBeInTheDocument();
  });

  it('is hidden from assistive technology（装飾であって通知ではない）', () => {
    const { container } = render(<Fixture active={false} />);
    const wrapper = container.querySelector('[data-slot="icon-swap"]');
    expect(wrapper).toHaveAttribute('aria-hidden');
  });

  it('stays hidden from assistive technology when active', () => {
    const { container } = render(<Fixture active />);
    expect(container.querySelector('[data-slot="icon-swap"]')).toHaveAttribute('aria-hidden');
  });

  it('mirrors the state onto data-active', () => {
    const { container, rerender } = render(<Fixture active={false} />);
    const wrapper = container.querySelector('[data-slot="icon-swap"]');
    expect(wrapper).not.toHaveAttribute('data-active');

    rerender(<Fixture active />);
    expect(wrapper).toHaveAttribute('data-active');
  });

  it('defaults to 1em square（周囲の文字サイズに追従する）', () => {
    const { container } = render(<Fixture active={false} />);
    expect(container.querySelector('[data-slot="icon-swap"]')?.className).toContain('size-[1em]');
  });

  it('lets the caller size it', () => {
    const { container } = render(
      <IconSwap active={false} base={<i />} swap={<i />} className="size-4" />,
    );
    expect(container.querySelector('[data-slot="icon-swap"]')?.className).toContain('size-4');
  });

  it('uses motion tokens, never a raw duration', () => {
    const { container } = render(<Fixture active={false} />);
    const html = container.innerHTML;
    expect(html).toContain('duration-fast');
    expect(html).toContain('ease-default');
    // Ibuki の 160ms 直値を持ち込んでいない
    expect(html).not.toMatch(/duration-\d/);
  });

  /**
   * Tailwind v4 の scale-* は独立した `scale` プロパティを使う。
   * transition の対象を `transform` にすると補間されず瞬間的に飛ぶ（実測で発覚）。
   */
  it('transitions the scale property, not transform', () => {
    const { container } = render(<Fixture active={false} />);
    expect(container.innerHTML).toContain('transition-[opacity,scale]');
    expect(container.innerHTML).not.toContain('transition-[opacity,transform]');
  });

  it('does not bring the blur treatment over from Ibuki', () => {
    const { container } = render(<Fixture active />);
    expect(container.innerHTML).not.toContain('blur');
  });
});
