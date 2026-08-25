import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Modal } from './Modal';

const sizeClassesForTest = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
} as const;

// jsdom では HTMLDialogElement.showModal / close が未実装のため、モックする
beforeEach(() => {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    });
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    });
  }
});

describe('Modal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    title: 'テストモーダル',
  };

  // ─── レンダリング ─────────────────────────────────────

  it('renders when open', () => {
    render(
      <Modal {...defaultProps}>
        <Modal.Body>コンテンツ</Modal.Body>
      </Modal>,
    );
    expect(screen.getByText('コンテンツ')).toBeInTheDocument();
  });

  it('renders title', () => {
    render(
      <Modal {...defaultProps}>
        <Modal.Body>内容</Modal.Body>
      </Modal>,
    );
    expect(screen.getByText('テストモーダル')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(
      <Modal {...defaultProps} description="これは補足説明です">
        <Modal.Body>内容</Modal.Body>
      </Modal>,
    );
    expect(screen.getByText('これは補足説明です')).toBeInTheDocument();
  });

  it('renders a dialog element', () => {
    render(
      <Modal {...defaultProps}>
        <Modal.Body>内容</Modal.Body>
      </Modal>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  // ─── 閉じるボタン ─────────────────────────────────────

  it('has a close button with aria-label', () => {
    render(
      <Modal {...defaultProps}>
        <Modal.Body>内容</Modal.Body>
      </Modal>,
    );
    expect(screen.getByLabelText('閉じる')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(
      <Modal {...defaultProps} onClose={onClose}>
        <Modal.Body>内容</Modal.Body>
      </Modal>,
    );
    await userEvent.click(screen.getByLabelText('閉じる'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ─── cancel イベント（Escape） ────────────────────────

  it('calls onClose on cancel event', () => {
    const onClose = vi.fn();
    render(
      <Modal {...defaultProps} onClose={onClose}>
        <Modal.Body>内容</Modal.Body>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    dialog.dispatchEvent(new Event('cancel', { bubbles: true }));
    expect(onClose).toHaveBeenCalled();
  });

  // ─── アクセシビリティ ─────────────────────────────────

  it('sets aria-labelledby when title is provided', () => {
    render(
      <Modal {...defaultProps}>
        <Modal.Body>内容</Modal.Body>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy!)?.textContent).toBe('テストモーダル');
  });

  it('sets aria-describedby when description is provided', () => {
    render(
      <Modal {...defaultProps} description="説明文">
        <Modal.Body>内容</Modal.Body>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    const describedBy = dialog.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toBe('説明文');
  });

  it('視覚的な title が無いとき ariaLabel で名前を付けられる', () => {
    render(
      <Modal open onClose={vi.fn()} ariaLabel="コマンドパレット">
        内容
      </Modal>,
    );
    expect(screen.getByRole('dialog', { name: 'コマンドパレット' })).toBeInTheDocument();
  });

  it('top placement は上寄せの余白を使う', () => {
    render(
      <Modal open onClose={vi.fn()} ariaLabel="検索" placement="top">
        内容
      </Modal>,
    );
    const dialog = screen.getByRole('dialog', { name: '検索' });
    expect(dialog.className).toContain('mt-4');
    expect(dialog.className).toContain('sm:mt-[18vh]');
    expect(dialog.className).not.toContain('m-auto');
  });

  // ─── サブコンポーネント ───────────────────────────────

  it('renders Modal.Body', () => {
    render(
      <Modal {...defaultProps}>
        <Modal.Body>ボディコンテンツ</Modal.Body>
      </Modal>,
    );
    expect(screen.getByText('ボディコンテンツ')).toBeInTheDocument();
  });

  it('renders Modal.Footer', () => {
    render(
      <Modal {...defaultProps}>
        <Modal.Body>内容</Modal.Body>
        <Modal.Footer>フッター</Modal.Footer>
      </Modal>,
    );
    expect(screen.getByText('フッター')).toBeInTheDocument();
  });

  it('Modal.Footer has border-top', () => {
    render(
      <Modal {...defaultProps}>
        <Modal.Footer>F</Modal.Footer>
      </Modal>,
    );
    expect(screen.getByText('F').className).toContain('border-t');
  });

  // ─── サイズ ───────────────────────────────────────────

  it.each(['sm', 'md', 'lg'] as const)('renders %s size', (size) => {
    const { container } = render(
      <Modal {...defaultProps} size={size}>
        <Modal.Body>内容</Modal.Body>
      </Modal>,
    );
    const dialog = container.querySelector('dialog');
    expect(dialog).toHaveClass('w-[calc(100%_-_2rem)]');
    expect(dialog).toHaveClass(sizeClassesForTest[size]);
  });

  // ─── showModal / close 呼び出し ──────────────────────

  it('calls showModal when open becomes true', () => {
    const { rerender } = render(
      <Modal open={false} onClose={vi.fn()} title="テスト">
        <Modal.Body>内容</Modal.Body>
      </Modal>,
    );
    rerender(
      <Modal open={true} onClose={vi.fn()} title="テスト">
        <Modal.Body>内容</Modal.Body>
      </Modal>,
    );
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
  });
});
