import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { ThemeProvider, useTheme, THEMES } from './ThemeProvider';

/**
 * ThemeProvider の**契約**を固定する。
 *
 * テーマ名 / system 追随 / 永続化 / 初期描画のちらつき / SSR 安全性 の5点。
 * next-themes の内部実装ではなく、Kedama が消費側へ約束した面だけを見る。
 */

const STORAGE_KEY = 'kedama-theme';

/** prefers-color-scheme を差し替える（jsdom は matchMedia を持たない） */
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

function Probe() {
  const { theme, resolvedTheme, themes, mounted, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{String(theme)}</span>
      <span data-testid="resolved">{String(resolvedTheme)}</span>
      <span data-testid="themes">{themes.join(',')}</span>
      <span data-testid="mounted">{String(mounted)}</span>
      <button onClick={() => setTheme('deep-dark')}>deep-dark へ</button>
      <button onClick={() => setTheme('system')}>system へ</button>
    </div>
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

describe('ThemeProvider の契約', () => {
  // ── テーマ名 ──────────────────────────────────────────

  it('公開テーマは light / dark / deep-dark の3つ', () => {
    expect(THEMES).toEqual(['light', 'dark', 'deep-dark']);
  });

  it('dark-alt は公開テーマに含めない（検証専用の属性の組み合わせ）', () => {
    expect(THEMES as readonly string[]).not.toContain('dark-alt');
  });

  it('選択できるテーマを useTheme が返す', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('themes')).toHaveTextContent('light,dark,deep-dark');
  });

  // ── 既定と適用方式 ────────────────────────────────────

  it('既定は light で、html の data-theme に当たる', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('resolved')).toHaveTextContent('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('class ではなく data-theme を使う', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <Probe />
      </ThemeProvider>,
    );
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  // ── 永続化 ────────────────────────────────────────────

  it('選択を kedama-theme に保存する', async () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'deep-dark へ' }));
    expect(localStorage.getItem(STORAGE_KEY)).toBe('deep-dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('deep-dark');
  });

  it('保存済みの選択が既定より優先される', () => {
    localStorage.setItem(STORAGE_KEY, 'deep-dark');
    render(
      <ThemeProvider defaultTheme="light">
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('resolved')).toHaveTextContent('deep-dark');
  });

  // ── 不正な保存値 ─────────────────────────────────────

  /**
   * next-themes@0.4.6 は localStorage の値を themes と照合しない。
   * 手で書き換えた値や、テーマ名を変えたあとの古い値がそのまま data-theme に
   * 載ると、どのテーマ定義にも一致せず素の見た目に落ちる。
   */
  it.each(['bogus', 'dark-alt', 'DARK', '', 'deep_dark'])(
    '不正な保存値 %o を捨てて既定へ戻す',
    (bad) => {
      localStorage.setItem(STORAGE_KEY, bad);
      render(
        <ThemeProvider>
          <Probe />
        </ThemeProvider>,
      );
      expect(screen.getByTestId('resolved')).toHaveTextContent('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(localStorage.getItem(STORAGE_KEY)).not.toBe(bad);
    },
  );

  it('不正な保存値でも defaultTheme の指定が効く', () => {
    localStorage.setItem(STORAGE_KEY, 'bogus');
    render(
      <ThemeProvider defaultTheme="deep-dark">
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('resolved')).toHaveTextContent('deep-dark');
  });

  it.each(['light', 'dark', 'deep-dark', 'system'])('妥当な保存値 %s は捨てない', (good) => {
    localStorage.setItem(STORAGE_KEY, good);
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(localStorage.getItem(STORAGE_KEY)).toBe(good);
  });

  // ── system 追随 ───────────────────────────────────────

  it('system の Dark 解決先は dark（deep-dark にはしない）', async () => {
    mockColorScheme(true);
    render(
      <ThemeProvider defaultTheme="system">
        <Probe />
      </ThemeProvider>,
    );
    await act(async () => {});
    expect(screen.getByTestId('theme')).toHaveTextContent('system');
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('system の Light 解決先は light', async () => {
    mockColorScheme(false);
    render(
      <ThemeProvider defaultTheme="system">
        <Probe />
      </ThemeProvider>,
    );
    await act(async () => {});
    expect(screen.getByTestId('resolved')).toHaveTextContent('light');
  });

  it('system を無効化する Props は公開しない（常に選択できる）', () => {
    // 型の上でも渡せないこと自体は typecheck が担保する。
    // ここでは「常に system へ切り替えられる」ことを実行時に確認する。
    mockColorScheme(true);
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByRole('button', { name: 'system へ' })).toBeEnabled();
  });

  it('system は「選択」であってテーマ名ではない（theme と resolvedTheme が分かれる）', async () => {
    mockColorScheme(true);
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'system へ' }));
    expect(screen.getByTestId('theme')).toHaveTextContent('system');
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
  });

  // ── SSR 安全性 ────────────────────────────────────────

  it('サーバでレンダリングしても落ちない', () => {
    expect(() =>
      renderToStaticMarkup(
        <ThemeProvider>
          <Probe />
        </ThemeProvider>,
      ),
    ).not.toThrow();
  });

  it('サーバではテーマが確定しない（mounted=false・theme は undefined）', () => {
    const html = renderToStaticMarkup(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    // mounted は useEffect でしか true にならない
    expect(html).toContain('>false<');
    expect(html).toContain('>undefined<');
  });

  /**
   * SSR では next-themes のスクリプトが解析時に走り、localStorage の値を
   * そのまま data-theme に載せる。検証スクリプトが**先に**無いと、
   * 初回描画で一度 data-theme="bogus" が立つ。順序が意味を持つ。
   */
  it('検証スクリプトを next-themes のスクリプトより前に出す', () => {
    const html = renderToStaticMarkup(
      <ThemeProvider>
        <span />
      </ThemeProvider>,
    );
    const purgeAt = html.indexOf('removeItem');
    const nextThemesAt = html.indexOf('setAttribute');

    expect(purgeAt, '検証スクリプトが出ていない').toBeGreaterThan(-1);
    expect(nextThemesAt, 'next-themes のスクリプトが出ていない').toBeGreaterThan(-1);
    expect(purgeAt, '検証スクリプトが後ろにある').toBeLessThan(nextThemesAt);
  });

  it('検証スクリプトは公開テーマと system だけを通す', () => {
    const html = renderToStaticMarkup(
      <ThemeProvider>
        <span />
      </ThemeProvider>,
    );
    expect(html).toContain('["light","dark","deep-dark","system"]');
  });

  it('検証スクリプトに nonce を付ける', () => {
    const html = renderToStaticMarkup(
      <ThemeProvider nonce="abc123">
        <span />
      </ThemeProvider>,
    );
    // 検証スクリプト（先頭）に nonce が乗ること
    expect(html.indexOf('<script nonce="abc123">')).toBe(0);

    // next-themes 側は `typeof window === 'undefined'` のときだけ nonce を出す
    // 実装（dist/index.mjs の `nonce: typeof window=="undefined"?d:""`）。
    // jsdom では window が在るため、このテスト環境では空文字になる。
    // 実 SSR（node）では両方に nonce が乗る。ここでは前段だけを固定する。
  });

  it('初期描画のちらつきを防ぐスクリプトを差し込む', () => {
    const html = renderToStaticMarkup(
      <ThemeProvider>
        <span />
      </ThemeProvider>,
    );
    // next-themes は data-theme を同期的に立てる script を出す
    expect(html).toContain('<script');
    expect(html).toContain(STORAGE_KEY);
  });

  it('クライアントでは mounted が true になる', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('mounted')).toHaveTextContent('true');
  });
});
