import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Spinner } from './spinner';

/**
 * Spinner は**動きそのものが情報を担う**唯一の部品。
 * したがって reduced-motion で動きを止めたとき、失われる情報を補う責任を持つ
 * （回転アイコンを隠し、静止の破線円とラベル文字を出す）。
 * 判断はグローバル CSS が一括で下し、ここは補償だけを持つ。
 */
describe('Spinner', () => {
  it('exposes progress to assistive technology', () => {
    render(<Spinner />);
    const el = screen.getByRole('status');
    expect(el).toHaveAttribute('data-slot', 'spinner');
    expect(el).toHaveAccessibleName('読み込み中');
  });

  it('accepts a custom label', () => {
    render(<Spinner label="集計中" />);
    expect(screen.getByRole('status')).toHaveAccessibleName('集計中');
  });

  it('always renders the label text for screen readers', () => {
    render(<Spinner label="集計中" />);
    expect(screen.getByText('集計中')).toBeInTheDocument();
  });

  it('carries both the moving and the static icon（reduced-motion の補償）', () => {
    const { container } = render(<Spinner />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(2);
    // 通常は回転側だけが見え、reduce 指定時に入れ替わる
    expect(svgs[0].getAttribute('class')).toContain('animate-spin');
    expect(svgs[0].getAttribute('class')).toContain('motion-reduce:hidden');
    expect(svgs[1].getAttribute('class')).toContain('motion-reduce:block');
  });

  it('hides the icons from assistive technology（読み上げはラベルが担う）', () => {
    const { container } = render(<Spinner />);
    for (const svg of container.querySelectorAll('svg')) {
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    }
  });
});
