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

  it('applies default variant by default', () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText('Default');
    expect(badge.className).toContain('bg-subtle');
  });

  it.each(['success', 'warning', 'danger', 'info'] as const)(
    'applies %s variant classes',
    (variant) => {
      render(<Badge variant={variant}>Label</Badge>);
      const badge = screen.getByText('Label');
      expect(badge.className).toContain(variant);
    },
  );

  it('applies accent variant (ブランド／選択。success とは別の色を引く)', () => {
    render(<Badge variant="accent">選択中</Badge>);
    const badge = screen.getByText('選択中');
    expect(badge.className).toContain('bg-accent-primary-subtle');
    expect(badge.className).not.toContain('status-success');
  });

  // ─── 非推奨の別名 `status` ────────────────────────────

  it('still accepts the deprecated status prop', () => {
    render(<Badge status="success">Legacy</Badge>);
    expect(screen.getByText('Legacy').className).toContain('status-success');
  });

  it('prefers variant over the deprecated status prop', () => {
    render(
      <Badge variant="danger" status="success">
        Both
      </Badge>,
    );
    const badge = screen.getByText('Both');
    expect(badge.className).toContain('status-danger');
    expect(badge.className).not.toContain('status-success');
  });

  // ─── appearance ───────────────────────────────────────

  it('uses subtle appearance by default', () => {
    render(<Badge variant="success">Subtle</Badge>);
    const badge = screen.getByText('Subtle');
    expect(badge.className).toContain('border');
  });

  it('applies solid appearance', () => {
    render(
      <Badge variant="success" appearance="solid">
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

  const variants = ['default', 'accent', 'success', 'warning', 'danger', 'info'] as const;
  const appearances = ['subtle', 'solid'] as const;

  it.each(variants.flatMap((v) => appearances.map((a) => [v, a] as const)))(
    'renders %s/%s without crashing',
    (variant, appearance) => {
      const { container } = render(
        <Badge variant={variant} appearance={appearance}>
          {variant}/{appearance}
        </Badge>,
      );
      expect(container.firstChild).toBeInTheDocument();
    },
  );
});
