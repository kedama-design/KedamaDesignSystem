import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { semanticMotion } from '../../tokens';

/**
 * `sharedMql` はモジュールレベルに1つだけ持つ設計（listener の積み上がりを
 * 防ぐため）。そのままだとテスト間で持ち越されてモックが効かないので、
 * テストごとにモジュールを作り直して読み込む。
 */
let RollingText: typeof import('./RollingText').RollingText;

/**
 * RollingText の契約。
 *
 * slot-text の内部実装ではなく、Kedama が固定した面だけを見る。
 * - SSR と reduced-motion は素のテキスト1層
 * - 動きが有効なときはロール層が aria-hidden、素のテキスト層が読み上げ対象
 * - OS 設定の実行中変更に両方向で追随する
 */

/** OS 設定を差し替え、実行中の変更も流せるようにする */
let changeHandlers: Array<() => void> = [];
let prefersReduced = false;

function installMatchMedia() {
  changeHandlers = [];
  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() {
      return query.includes('prefers-reduced-motion: reduce') ? prefersReduced : false;
    },
    media: query,
    onchange: null,
    addEventListener: (_: string, h: () => void) => changeHandlers.push(h),
    removeEventListener: (_: string, h: () => void) => {
      changeHandlers = changeHandlers.filter((x) => x !== h);
    },
    addListener: (h: () => void) => changeHandlers.push(h),
    removeListener: (h: () => void) => {
      changeHandlers = changeHandlers.filter((x) => x !== h);
    },
    dispatchEvent: vi.fn(),
  }));
}

/**
 * 読み上げ対象のテキスト。
 * ロール中は2層になる（素のテキスト層＋ aria-hidden のロール層）ので、
 * `getByText` では2件見つかってしまう。読み上げ対象の層だけを見る。
 */
function accessibleText(container: HTMLElement): string {
  const rolling = container.querySelector('[data-slot="rolling-text"]');
  if (!rolling) return container.textContent ?? '';
  return rolling.querySelector(':scope > span:not([aria-hidden])')?.textContent ?? '';
}

/** OS 設定を実行中に切り替える */
function setReducedMotion(value: boolean) {
  prefersReduced = value;
  act(() => {
    for (const h of changeHandlers) h();
  });
}

beforeEach(async () => {
  prefersReduced = false;
  installMatchMedia();
  vi.resetModules();
  ({ RollingText } = await import('./RollingText'));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('RollingText', () => {
  // ── SSR / reduced-motion は素のテキスト ────────────────

  it('renders plain text on the server', () => {
    const html = renderToStaticMarkup(<RollingText text="確認待ち" />);
    expect(html).toContain('確認待ち');
    // ロール層（aria-hidden の入れ子）を出さない
    expect(html).not.toContain('aria-hidden');
  });

  it('renders plain text when reduced motion is requested', () => {
    prefersReduced = true;
    const { container } = render(<RollingText text="確認待ち" />);
    expect(screen.getByText('確認待ち')).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden]')).toBeNull();
  });

  it('keeps the text reachable when motion is enabled', () => {
    const { container } = render(<RollingText text="公開済み" />);
    expect(accessibleText(container)).toBe('公開済み');
  });

  // ── 二層構造 ──────────────────────────────────────────

  it('hides the roll layer from assistive technology', () => {
    const { container } = render(<RollingText text="公開済み" />);
    expect(container.querySelector('[aria-hidden]')).toBeInTheDocument();

    // 読み上げ対象は素のテキスト層（opacity で隠すだけで DOM に残す）
    const accessible = container.querySelector(
      '[data-slot="rolling-text"] > span:not([aria-hidden])',
    );
    expect(accessible).toHaveTextContent('公開済み');
  });

  it('never uses visibility:hidden on the accessible layer', () => {
    const { container } = render(<RollingText text="公開済み" />);
    const accessible = container.querySelector(
      '[data-slot="rolling-text"] > span:not([aria-hidden])',
    );
    // invisible だと読み上げ・選択の対象から外れる。opacity-0 で隠す
    expect(accessible?.className).not.toContain('invisible');
  });

  // ── OS 設定の実行中変更（両方向） ─────────────────────

  it('switches to plain text when the OS turns reduced motion on', () => {
    const { container } = render(<RollingText text="確認待ち" />);
    expect(container.querySelector('[data-slot="rolling-text"]')).toBeInTheDocument();

    setReducedMotion(true);

    expect(container.querySelector('[data-slot="rolling-text"]')).toBeNull();
    expect(accessibleText(container)).toBe('確認待ち');
  });

  it('switches back to the roll when the OS turns reduced motion off', () => {
    prefersReduced = true;
    const { container } = render(<RollingText text="確認待ち" />);
    expect(container.querySelector('[data-slot="rolling-text"]')).toBeNull();

    setReducedMotion(false);

    expect(container.querySelector('[data-slot="rolling-text"]')).toBeInTheDocument();
    expect(accessibleText(container)).toBe('確認待ち');
  });

  // ── モーションは固定 ──────────────────────────────────

  it('derives its timing from the value-change token', () => {
    const { duration, easing } = semanticMotion['value-change'].tween;
    expect(duration).toBe('120ms');
    expect(easing).toBe('cubic-bezier(0.4, 0, 0.2, 1)');
  });

  it('does not expose colour or chromatic knobs', () => {
    const source = RollingText.toString();
    for (const forbidden of ['color', 'chromatic', 'colorFade']) {
      expect(source).not.toContain(forbidden);
    }
  });
});
