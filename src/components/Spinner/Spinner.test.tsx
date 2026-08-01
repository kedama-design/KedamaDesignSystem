import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Spinner } from './Spinner';

/**
 * ラベルは accessible name ではなく **ライブリージョンの内容**として持たせている。
 * `status` ロールは name-from-content 非対応であり、読み上げられるのは内容のため。
 * よってアサーションは textContent に対して行う。
 */
describe('Spinner', () => {
  it('既定で status ロールと既定ラベルを持つ', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toHaveTextContent('読み込み中');
  });

  it('label を差し替えられる', () => {
    render(<Spinner label="保存しています" />);
    expect(screen.getByRole('status')).toHaveTextContent('保存しています');
  });

  it('decorative では読み上げ対象から外れる', () => {
    const { container } = render(<Spinner decorative />);

    // 親が aria-busy を持つ文脈での二重読み上げを避ける
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.sr-only')).toBeNull();
  });

  it('size ごとに寸法が変わる', () => {
    const { container: sm } = render(<Spinner size="sm" />);
    const { container: lg } = render(<Spinner size="lg" />);

    expect(sm.querySelector('svg')).toHaveClass('size-3');
    expect(lg.querySelector('svg')).toHaveClass('size-6');
  });

  it('既定の size は md', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('svg')).toHaveClass('size-4');
  });

  it('回転は motion-safe に限定される', () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector('svg');

    // 回転が止まってもラベルで意味が伝わる設計（原則: Accessible）
    expect(svg).toHaveClass('motion-safe:animate-spin');
    expect(svg).not.toHaveClass('animate-spin');
  });

  it('回転を CSS に委ねているため、ラベルは常に DOM 上に存在する', () => {
    render(<Spinner label="集計中" />);
    expect(screen.getByRole('status')).toHaveTextContent('集計中');
  });

  it('SVG 自体は装飾として扱われる', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('ref を転送する', () => {
    const ref = { current: null as HTMLSpanElement | null };
    render(<Spinner ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});
