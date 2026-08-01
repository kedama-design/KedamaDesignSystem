import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card';

describe('Card', () => {
  // ─── 基本レンダリング ─────────────────────────────────

  it('renders children', () => {
    render(<Card>カードコンテンツ</Card>);
    expect(screen.getByText('カードコンテンツ')).toBeInTheDocument();
  });

  it('renders as a div', () => {
    const { container } = render(<Card>テスト</Card>);
    expect(container.firstChild?.nodeName).toBe('DIV');
  });

  it('forwards ref to the root element', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Card ref={ref}>テスト</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  // 構造は shadcn/ui の Card に合わせる（仕様書 §0.6 方針転換・2026-07-30）。
  // shadcn の Card は shadow-sm を持つため Kedama も影を持つ。
  it('has surface background, hairline border and shadow', () => {
    const { container } = render(<Card>テスト</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('bg-surface');
    expect(card.className).toContain('border-border-muted');
    expect(card.className).toContain('shadow-sm');
  });

  // root は縦 padding と gap だけを持ち、左右 padding は各パートが持つ。
  // これにより Header/Footer の区切り線が全幅に伸びる。
  it('root has vertical padding and gap, not all-round padding', () => {
    const { container } = render(<Card>テスト</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('py-6');
    expect(card.className).toContain('gap-6');
    expect(card.className).toContain('flex-col');
  });

  it('removes padding with noPadding', () => {
    const { container } = render(<Card noPadding>テスト</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).not.toContain('py-6');
    expect(card.className).not.toContain('gap-6');
  });

  it('merges custom className', () => {
    const { container } = render(<Card className="my-card">テスト</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('my-card');
  });

  it('passes through HTML attributes', () => {
    render(
      <Card data-testid="card" role="region">
        テスト
      </Card>,
    );
    expect(screen.getByTestId('card')).toHaveAttribute('role', 'region');
  });

  // ─── named exports（正規 API・報告書 Q1） ─────────────

  it('renders named-export parts', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>タイトル</CardTitle>
        </CardHeader>
        <CardContent>ボディ</CardContent>
        <CardFooter>フッター</CardFooter>
      </Card>,
    );
    expect(screen.getByText('タイトル')).toBeInTheDocument();
    expect(screen.getByText('ボディ')).toBeInTheDocument();
    expect(screen.getByText('フッター')).toBeInTheDocument();
  });

  it('CardTitle renders as a heading element', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>見出し</CardTitle>
        </CardHeader>
      </Card>,
    );
    expect(screen.getByText('見出し').nodeName).toBe('H3');
  });

  // 左右 padding は各パートが持つ（root ではない）
  it.each([
    ['CardHeader', CardHeader],
    ['CardContent', CardContent],
    ['CardFooter', CardFooter],
  ] as const)('%s owns the horizontal padding', (_name, Part) => {
    render(
      <Card>
        <Part>P</Part>
      </Card>,
    );
    expect(screen.getByText('P').className).toContain('px-6');
  });

  it.each([
    ['CardHeader', CardHeader],
    ['CardContent', CardContent],
    ['CardFooter', CardFooter],
  ] as const)('%s forwards ref', (_name, Part) => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Card>
        <Part ref={ref}>P</Part>
      </Card>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  // ─── compound API（既存互換） ─────────────────────────

  it('renders compound parts', () => {
    render(
      <Card>
        <Card.Header>ヘッダー</Card.Header>
        <Card.Body>ボディ</Card.Body>
        <Card.Footer>フッター</Card.Footer>
      </Card>,
    );
    expect(screen.getByText('ヘッダー')).toBeInTheDocument();
    expect(screen.getByText('ボディ')).toBeInTheDocument();
    expect(screen.getByText('フッター')).toBeInTheDocument();
  });

  it('Card.Body is an alias of CardContent', () => {
    expect(Card.Body).toBe(CardContent);
  });

  it('Card.Header merges className', () => {
    render(
      <Card>
        <Card.Header className="custom-header">H</Card.Header>
      </Card>,
    );
    expect(screen.getByText('H').className).toContain('custom-header');
  });

  // 区切り線は利用者が border-t / border-b を付けたときだけ余白が出る。
  // Footer 自身は線を持たない（shadcn と同じ挙動）。
  it('CardFooter reserves padding only when a border is applied', () => {
    render(
      <Card>
        <CardFooter>F</CardFooter>
      </Card>,
    );
    const footer = screen.getByText('F');
    expect(footer.className).toContain('[.border-t]:pt-6');
    expect(footer.className).not.toMatch(/(^|\s)border-t(\s|$)/);
  });
});
