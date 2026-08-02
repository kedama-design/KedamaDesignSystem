import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { Toaster, toast } from './toast';

/**
 * Toast は Base UI Toast に載せている（報告書 Q4）。
 *
 * ⚠️ **Toast は Modal の背後になる。** ネイティブ `<dialog>` は top layer に載り、
 * z-index では覆せない（仕様書 §2.2「オーバーレイの重なり」で実測済み）。
 * Modal 内の処理結果は当面インライン表示とし、Toast の top layer 対応は
 * 要求が発生するまで保留。
 */
describe('Toast', () => {
  it('renders a toast added through the manager', async () => {
    render(<Toaster />);

    await act(async () => {
      toast.add({ title: '保存しました', description: '記事を更新しました' });
    });

    expect(await screen.findByText('保存しました')).toBeInTheDocument();
    expect(screen.getByText('記事を更新しました')).toBeInTheDocument();
  });

  it('labels the close control, and follows Base UI in hiding it while collapsed', async () => {
    const { baseElement } = render(<Toaster />);

    await act(async () => {
      toast.add({ title: '通知' });
    });
    await screen.findByText('通知');

    const close = baseElement.querySelector('[data-slot="toast-close"]');
    expect(close).toBeInTheDocument();
    expect(close).toHaveAttribute('aria-label', 'Close toast');

    // Base UI は `aria-hidden: !expanded && !hasFocus` を出す
    // （ToastClose.mjs:44）。スタックが畳まれている間は前面のトーストだけを
    // 読ませ、展開・フォーカス時に閉じるボタンが支援技術へ現れる設計。
    // 上流の意図なのでそのまま踏襲する。変わったらここで気づく。
    expect(close).toHaveAttribute('aria-hidden', 'true');
  });

  it('uses the overlay elevation（primitive の段を直に書かない）', async () => {
    const { baseElement } = render(<Toaster />);

    await act(async () => {
      toast.add({ title: '通知' });
    });

    await screen.findByText('通知');
    const root = baseElement.querySelector('[data-slot="toast"]');
    expect(root).toBeInTheDocument();
    expect(root?.className).toContain('shadow-overlay');
    expect(root?.className).not.toMatch(/\bshadow-(sm|md|lg)\b/);
  });
});
