import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('既定では装飾として扱われ、読み上げ対象にならない', () => {
    const { container } = render(<Skeleton />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('label を渡したときだけ状態を読み上げる', () => {
    render(<Skeleton label="グラフを読み込み中" />);
    const el = screen.getByRole('status');

    expect(el).toHaveAccessibleName('グラフを読み込み中');
    expect(el).toHaveAttribute('aria-live', 'polite');
    expect(el).not.toHaveAttribute('aria-hidden');
  });

  it('shape ごとに角丸が変わる', () => {
    const { container: text } = render(<Skeleton shape="text" />);
    const { container: circle } = render(<Skeleton shape="circle" />);
    const { container: block } = render(<Skeleton shape="block" />);

    expect(text.firstElementChild).toHaveClass('rounded-sm');
    expect(circle.firstElementChild).toHaveClass('rounded-full');
    expect(block.firstElementChild).toHaveClass('rounded-md');
  });

  it('既定の shape は block', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstElementChild).toHaveClass('rounded-md');
  });

  it('明滅は motion-safe に限定される', () => {
    const { container } = render(<Skeleton />);

    // prefers-reduced-motion の利用者に無条件でアニメーションを出さない（原則: Accessible）
    expect(container.firstElementChild).toHaveClass('motion-safe:animate-skeleton-pulse');
    expect(container.firstElementChild).not.toHaveClass('animate-skeleton-pulse');
  });

  it('className を受け取り、寸法を呼び出し側から与えられる', () => {
    const { container } = render(<Skeleton className="h-4 w-3/4" />);
    expect(container.firstElementChild).toHaveClass('h-4', 'w-3/4', 'bg-subtle');
  });

  it('ref を転送する', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Skeleton ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
