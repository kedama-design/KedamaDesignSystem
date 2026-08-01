import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import {
  Search,
  X,
  Plus,
  Check,
  AlertTriangle,
  Info,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Pencil,
  Settings,
  User,
} from './Icon';

describe('Icon (Lucide)', () => {
  // ─── 基本レンダリング ─────────────────────────────────

  it('renders an svg element', () => {
    const { container } = render(<Search />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('defaults to size 24 (Lucide default)', () => {
    const { container } = render(<Search />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('width')).toBe('24');
    expect(svg.getAttribute('height')).toBe('24');
  });

  it('accepts custom size', () => {
    const { container } = render(<Search size={20} />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('width')).toBe('20');
    expect(svg.getAttribute('height')).toBe('20');
  });

  it('uses stroke-based styling', () => {
    const { container } = render(<Search />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('stroke')).toBe('currentColor');
  });

  it('accepts className', () => {
    const { container } = render(<Search className="text-fg-muted" />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('class')).toContain('text-fg-muted');
  });

  it('is aria-hidden by default (decorative)', () => {
    const { container } = render(<Search />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('aria-hidden')).toBe('true');
  });

  // ─── 全プリセットアイコンのレンダリング ───────────────

  const presets = [
    ['Search', Search],
    ['X', X],
    ['Plus', Plus],
    ['Check', Check],
    ['AlertTriangle', AlertTriangle],
    ['Info', Info],
    ['ArrowRight', ArrowRight],
    ['ArrowLeft', ArrowLeft],
    ['Trash2', Trash2],
    ['Pencil', Pencil],
    ['Settings', Settings],
    ['User', User],
  ] as const;

  it.each(presets)('%s renders without crashing', (_name, IconComponent) => {
    const { container } = render(<IconComponent />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it.each(presets)('%s passes size prop', (_name, IconComponent) => {
    const { container } = render(<IconComponent size={16} />);
    expect(container.querySelector('svg')?.getAttribute('width')).toBe('16');
  });

  it.each(presets)('%s accepts className', (_name, IconComponent) => {
    const { container } = render(<IconComponent className="custom-icon" />);
    expect(container.querySelector('svg')?.getAttribute('class')).toContain('custom-icon');
  });
});
