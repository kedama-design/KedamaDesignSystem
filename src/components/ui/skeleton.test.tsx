import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Skeleton } from './skeleton';

/**
 * Skeleton は「読み込み中」を面で示す部品。
 * **既定で静止する**（上流の `animate-pulse` を外してある）。一覧で10行20行と
 * 並んだときに一斉に明滅すると画面全体が呼吸するため。Calm UI の判断。
 */
describe('Skeleton', () => {
  it('renders with the skeleton slot', () => {
    render(<Skeleton data-testid="sk" />);
    expect(screen.getByTestId('sk')).toHaveAttribute('data-slot', 'skeleton');
  });

  it('keeps a surface so it reads as "まだ来ていない" ではなく空に見えない', () => {
    render(<Skeleton data-testid="sk" />);
    expect(screen.getByTestId('sk').className).toContain('bg-muted');
  });

  it('does not pulse by default（Calm UI の既定）', () => {
    render(<Skeleton data-testid="sk" />);
    expect(screen.getByTestId('sk').className).not.toContain('animate-pulse');
  });

  it('can opt into pulsing via className（prop を増やさない逃がし口）', () => {
    render(<Skeleton data-testid="sk" className="animate-pulse" />);
    expect(screen.getByTestId('sk').className).toContain('animate-pulse');
  });

  it('merges custom className', () => {
    render(<Skeleton data-testid="sk" className="h-4 w-32" />);
    const el = screen.getByTestId('sk');
    expect(el.className).toContain('h-4');
    expect(el.className).toContain('w-32');
  });
});
