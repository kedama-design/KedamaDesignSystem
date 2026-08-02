import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Button } from './Button';

describe('Button', () => {
  // ─── レンダリング ─────────────────────────────────────

  it('renders with children text', () => {
    render(<Button>保存する</Button>);
    expect(screen.getByRole('button', { name: '保存する' })).toBeInTheDocument();
  });

  it('renders as a button element', () => {
    render(<Button>テスト</Button>);
    expect(screen.getByRole('button')).toBeInstanceOf(HTMLButtonElement);
  });

  // ─── バリアント ───────────────────────────────────────

  it('applies primary variant by default', () => {
    render(<Button>Primary</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-accent-primary');
  });

  it('applies secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-surface');
    expect(button.className).toContain('border');
  });

  it('applies ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-transparent');
  });

  it('applies danger variant', () => {
    render(<Button variant="danger">Danger</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('danger');
  });

  // ─── サイズ ───────────────────────────────────────────

  // 統合後のサイズ体系は取り込み品（shadcn Base UI variant）準拠 24/28/32/36

  it('applies default size (32px) by default', () => {
    render(<Button>Default</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('h-8');
  });

  it('applies xs size', () => {
    render(<Button size="xs">XSmall</Button>);
    expect(screen.getByRole('button').className).toContain('h-6');
  });

  it('applies sm size', () => {
    render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button').className).toContain('h-7');
  });

  it('applies lg size', () => {
    render(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button').className).toContain('h-9');
  });

  it('applies square icon sizes', () => {
    render(<Button size="icon-sm" aria-label="閉じる" />);
    expect(screen.getByRole('button').className).toContain('size-7');
  });

  // ─── 非推奨の別名 ─────────────────────────────────────

  it('maps deprecated size "md" to default (寸法は 40px から 32px へ変わる)', () => {
    render(<Button size="md">Legacy</Button>);
    expect(screen.getByRole('button').className).toContain('h-8');
  });

  it('maps deprecated variant "brand" to primary', () => {
    render(<Button variant="brand">Brand</Button>);
    expect(screen.getByRole('button').className).toContain('bg-accent-primary');
  });

  it('maps deprecated variant "destructive" to danger', () => {
    render(<Button variant="destructive">Destructive</Button>);
    expect(screen.getByRole('button').className).toContain('bg-accent-danger');
  });

  it('applies outline variant', () => {
    render(<Button variant="outline">Outline</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-transparent');
    expect(button.className).toContain('border-border-strong');
  });

  // ─── disabled状態 ─────────────────────────────────────

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('sets aria-disabled when disabled', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
  });

  it('does not fire onClick when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Disabled
      </Button>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  // ─── loading状態 ──────────────────────────────────────

  it('is disabled when loading', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('sets aria-busy when loading', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  it('shows spinner when loading', () => {
    render(<Button loading>Loading</Button>);
    const svg = screen.getByRole('button').querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('does not fire onClick when loading', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Loading
      </Button>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  // ─── アイコン ─────────────────────────────────────────

  it('renders iconLeft', () => {
    render(<Button iconLeft={<span data-testid="icon-left">+</span>}>Add</Button>);
    expect(screen.getByTestId('icon-left')).toBeInTheDocument();
  });

  it('renders iconRight', () => {
    render(<Button iconRight={<span data-testid="icon-right">→</span>}>Next</Button>);
    expect(screen.getByTestId('icon-right')).toBeInTheDocument();
  });

  it('hides iconLeft and shows spinner when loading', () => {
    render(
      <Button loading iconLeft={<span data-testid="icon-left">+</span>}>
        Add
      </Button>,
    );
    expect(screen.queryByTestId('icon-left')).not.toBeInTheDocument();
  });

  it('hides iconRight when loading', () => {
    render(
      <Button loading iconRight={<span data-testid="icon-right">→</span>}>
        Next
      </Button>,
    );
    expect(screen.queryByTestId('icon-right')).not.toBeInTheDocument();
  });

  // ─── イベント ─────────────────────────────────────────

  it('fires onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  // ─── カスタムクラス ───────────────────────────────────

  it('merges custom className', () => {
    render(<Button className="my-custom-class">Custom</Button>);
    expect(screen.getByRole('button').className).toContain('my-custom-class');
  });

  // ─── ref転送 ──────────────────────────────────────────

  it('forwards ref', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  // ─── render による多態（旧 asChild） ──────────────────
  //
  // Ibuki は asChild + disabled を `inert` で塞いでいた。Base UI は
  // tabIndex=-1 / aria-disabled / ハンドラ遮断で同じ目的を果たし、かつ
  // 要素をアクセシビリティツリーに残す。ここではその契約を実測で確認する。

  it('renders as an anchor via render prop', () => {
    render(
      <Button render={<a href="/docs" />} nativeButton={false}>
        ドキュメント
      </Button>,
    );
    const link = screen.getByText('ドキュメント');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/docs');
  });

  it('keeps a disabled anchor out of the tab order and marks it disabled', () => {
    render(
      <Button render={<a href="/docs" />} nativeButton={false} disabled>
        ドキュメント
      </Button>,
    );
    const link = screen.getByText('ドキュメント');
    expect(link).toHaveAttribute('tabindex', '-1');
    expect(link).toHaveAttribute('aria-disabled', 'true');
  });

  it('does not activate a disabled anchor on click', async () => {
    const onClick = vi.fn();
    render(
      <Button render={<a href="/docs" />} nativeButton={false} disabled onClick={onClick}>
        ドキュメント
      </Button>,
    );
    await userEvent.click(screen.getByText('ドキュメント'), { pointerEventsCheck: 0 });
    expect(onClick).not.toHaveBeenCalled();
  });
});
