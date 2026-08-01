import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Badge } from './Badge';

describe('Badge', () => {
  // ─── レンダリング ─────────────────────────────────────

  it('renders with children text', () => {
    render(<Badge>完了</Badge>);
    expect(screen.getByText('完了')).toBeInTheDocument();
  });

  it('renders as a span element', () => {
    render(<Badge>テスト</Badge>);
    expect(screen.getByText('テスト').tagName).toBe('SPAN');
  });

  // ─── ステータスバリアント ─────────────────────────────

  it('applies default status by default', () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText('Default');
    expect(badge.className).toContain('bg-subtle');
  });

  it.each(['success', 'warning', 'danger', 'info'] as const)(
    'applies %s status classes',
    (status) => {
      render(<Badge status={status}>Label</Badge>);
      const badge = screen.getByText('Label');
      expect(badge.className).toContain(status);
    },
  );

  // ─── appearance ───────────────────────────────────────

  it('uses subtle appearance by default', () => {
    render(<Badge status="success">Subtle</Badge>);
    const badge = screen.getByText('Subtle');
    expect(badge.className).toContain('border');
  });

  it('applies solid appearance', () => {
    render(
      <Badge status="success" appearance="solid">
        Solid
      </Badge>,
    );
    const badge = screen.getByText('Solid');
    expect(badge.className).toContain('success-solid');
  });

  // ─── アイコン ─────────────────────────────────────────

  it('renders icon when provided', () => {
    render(<Badge icon={<span data-testid="badge-icon">●</span>}>With Icon</Badge>);
    expect(screen.getByTestId('badge-icon')).toBeInTheDocument();
  });

  it('renders without icon by default', () => {
    render(<Badge>No Icon</Badge>);
    const badge = screen.getByText('No Icon');
    // テキストノードのみ（Element childrenは0）
    expect(badge.children).toHaveLength(0);
    expect(badge.textContent).toBe('No Icon');
  });

  // ─── カスタムクラス ───────────────────────────────────

  it('merges custom className', () => {
    render(<Badge className="my-class">Custom</Badge>);
    expect(screen.getByText('Custom').className).toContain('my-class');
  });

  // ─── HTML属性の透過 ───────────────────────────────────

  it('passes through HTML attributes', () => {
    render(
      <Badge data-testid="my-badge" title="ステータス">
        Badge
      </Badge>,
    );
    const badge = screen.getByTestId('my-badge');
    expect(badge).toHaveAttribute('title', 'ステータス');
  });

  // ─── 全ステータス × 全appearance の組み合わせ ─────────

  const statuses = ['default', 'success', 'warning', 'danger', 'info'] as const;
  const appearances = ['subtle', 'solid'] as const;

  it.each(statuses.flatMap((s) => appearances.map((a) => [s, a] as const)))(
    'renders %s/%s without crashing',
    (status, appearance) => {
      const { container } = render(
        <Badge status={status} appearance={appearance}>
          {status}/{appearance}
        </Badge>,
      );
      expect(container.firstChild).toBeInTheDocument();
    },
  );
});
