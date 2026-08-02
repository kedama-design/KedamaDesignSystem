import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { ThemeProvider } from '../ThemeProvider';
import { ThemeToggle } from './ThemeToggle';

/**
 * ThemeToggle の契約。
 *
 * `aria-pressed` が唯一の正なので、テストも `aria-pressed` だけを見る
 * （クラス名は見ない。見ると二重管理の片方をテストすることになる）。
 */

const STORAGE_KEY = 'kedama-theme';
const LABELS = ['ライト', 'ダーク', 'ディープ', '自動'];

function mockColorScheme(prefersDark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({
        matches: query.includes('prefers-color-scheme: dark') ? prefersDark : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList,
  );
}

function setup() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  mockColorScheme(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ThemeToggle', () => {
  // ── 構造 ──────────────────────────────────────────────

  it('names the control as a group', () => {
    setup();
    expect(screen.getByRole('group', { name: 'テーマ' })).toBeInTheDocument();
  });

  it('accepts a custom group name', () => {
    render(
      <ThemeProvider>
        <ThemeToggle ariaLabel="配色" />
      </ThemeProvider>,
    );
    expect(screen.getByRole('group', { name: '配色' })).toBeInTheDocument();
  });

  it('offers 3 themes plus 自動', () => {
    setup();
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual(LABELS);
  });

  it('replaces only the labels it is given', () => {
    render(
      <ThemeProvider>
        <ThemeToggle labels={{ system: 'OSに合わせる' }} />
      </ThemeProvider>,
    );
    expect(screen.getByRole('button', { name: 'OSに合わせる' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ライト' })).toBeInTheDocument();
  });

  // ── aria-pressed が唯一の正 ───────────────────────────

  it('marks the current choice with aria-pressed', () => {
    setup();
    expect(screen.getByRole('button', { name: 'ライト' })).toHaveAttribute('aria-pressed', 'true');
    for (const name of ['ダーク', 'ディープ', '自動']) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'false');
    }
  });

  it('moves aria-pressed when a theme is chosen', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'ディープ' }));

    expect(screen.getByRole('button', { name: 'ディープ' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'ライト' })).toHaveAttribute('aria-pressed', 'false');
    expect(document.documentElement.getAttribute('data-theme')).toBe('deep-dark');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('deep-dark');
  });

  it('exactly one option is pressed at a time', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'ダーク' }));
    const pressed = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-pressed') === 'true');
    expect(pressed).toHaveLength(1);
  });

  /**
   * 押下状態は**利用者の選択**に付く。解決値ではない。
   * system が Light へ解決されても「自動」が選択状態。
   */
  it('keeps 自動 pressed when system resolves to light', async () => {
    mockColorScheme(false);
    setup();
    await userEvent.click(screen.getByRole('button', { name: '自動' }));

    expect(screen.getByRole('button', { name: '自動' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'ライト' })).toHaveAttribute('aria-pressed', 'false');
    // 解決先は light（見た目）だが、選択は system のまま
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('keeps 自動 pressed when system resolves to dark', async () => {
    mockColorScheme(true);
    setup();
    await userEvent.click(screen.getByRole('button', { name: '自動' }));

    expect(screen.getByRole('button', { name: '自動' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'ダーク' })).toHaveAttribute('aria-pressed', 'false');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  // ── SSR ───────────────────────────────────────────────

  it('renders all four options on the server（コントロールを隠さない）', () => {
    const html = renderToStaticMarkup(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );
    for (const label of LABELS) {
      expect(html).toContain(label);
    }
  });

  it('leaves every option unpressed before mount', () => {
    const html = renderToStaticMarkup(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );
    expect(html).toContain('aria-pressed="false"');
    expect(html).not.toContain('aria-pressed="true"');
  });

  it('is keyboard operable', async () => {
    setup();
    const deep = screen.getByRole('button', { name: 'ディープ' });
    deep.focus();
    await userEvent.keyboard('{Enter}');
    expect(deep).toHaveAttribute('aria-pressed', 'true');
  });
});
