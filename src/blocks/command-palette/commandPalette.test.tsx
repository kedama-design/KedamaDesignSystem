import * as React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { CommandPalette, type CommandPaletteGroup } from './CommandPalette';

const GROUPS: CommandPaletteGroup[] = [
  {
    id: 'navigation',
    label: '移動',
    commands: [
      { id: 'articles', label: 'すべての記事', keywords: ['記事一覧'], shortcut: 'G A' },
      { id: 'clients', label: 'クライアント', keywords: ['顧客'] },
    ],
  },
  {
    id: 'actions',
    label: '操作',
    commands: [{ id: 'publish', label: '公開する', disabled: true }],
  },
];

beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class ResizeObserverMock {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    },
  );
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  });
});

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  });
});

describe('CommandPalette', () => {
  it('アクセシブル名・グループ・安定したcommand IDを描く', () => {
    render(
      <CommandPalette groups={GROUPS} onCommandSelect={vi.fn()} defaultOpen title="全体検索" />,
    );

    const dialog = screen.getByRole('dialog', { name: '全体検索' });
    expect(dialog).toHaveAttribute('open');
    expect(within(dialog).getByText('移動')).toBeInTheDocument();
    expect(within(dialog).getByText('操作')).toBeInTheDocument();
    const selectedItem = within(dialog).getByText('すべての記事').closest('[data-command-id]');
    expect(selectedItem).toHaveAttribute('data-command-id', 'articles');
    expect(selectedItem?.className).toContain('data-[selected=true]:bg-hover');
    expect(selectedItem?.className).not.toContain('data-selected:bg-hover');
  });

  it('開いた後に検索欄へフォーカスする', async () => {
    render(<CommandPalette groups={GROUPS} onCommandSelect={vi.fn()} defaultOpen />);
    const input = screen.getByPlaceholderText('コマンドまたは移動先を検索');
    await vi.waitFor(() => expect(input).toHaveFocus());
  });

  it('ラベルと非表示keywordsの両方で絞り込む', async () => {
    const user = userEvent.setup();
    render(<CommandPalette groups={GROUPS} onCommandSelect={vi.fn()} defaultOpen />);
    const input = screen.getByPlaceholderText('コマンドまたは移動先を検索');

    await user.type(input, '顧客');
    expect(screen.getByText('クライアント')).toBeVisible();
    expect(screen.queryByText('すべての記事')).not.toBeInTheDocument();
  });

  it('一致しないとき空状態を出す', async () => {
    const user = userEvent.setup();
    render(<CommandPalette groups={GROUPS} onCommandSelect={vi.fn()} defaultOpen />);
    await user.type(screen.getByPlaceholderText('コマンドまたは移動先を検索'), '該当なし');
    expect(screen.getByText('一致するコマンドがありません')).toBeVisible();
  });

  it('選択するとIDを含むcommandを返して閉じる', async () => {
    const user = userEvent.setup();
    const onCommandSelect = vi.fn();
    const { container } = render(
      <CommandPalette groups={GROUPS} onCommandSelect={onCommandSelect} defaultOpen />,
    );

    await user.click(screen.getByText('クライアント'));
    expect(onCommandSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'clients', label: 'クライアント' }),
    );
    expect(container.querySelector('dialog')).not.toHaveAttribute('open');
  });

  it('disabled commandは実行しない', async () => {
    const user = userEvent.setup();
    const onCommandSelect = vi.fn();
    render(<CommandPalette groups={GROUPS} onCommandSelect={onCommandSelect} defaultOpen />);
    await user.click(screen.getByText('公開する'));
    expect(onCommandSelect).not.toHaveBeenCalled();
  });

  it('Cmd/Ctrl+Kで開き、パレット内でもう一度押すと閉じる', () => {
    const { container } = render(<CommandPalette groups={GROUPS} onCommandSelect={vi.fn()} />);
    const dialog = container.querySelector('dialog');

    fireEvent.keyDown(document.body, { key: 'k', metaKey: true });
    expect(dialog).toHaveAttribute('open');

    fireEvent.keyDown(screen.getByPlaceholderText('コマンドまたは移動先を検索'), {
      key: 'k',
      metaKey: true,
    });
    expect(dialog).not.toHaveAttribute('open');
  });

  it('外部の編集欄ではCmd/Ctrl+Kを横取りしない', () => {
    const { container } = render(
      <>
        <input aria-label="記事本文" />
        <CommandPalette groups={GROUPS} onCommandSelect={vi.fn()} />
      </>,
    );
    const editor = screen.getByRole('textbox', { name: '記事本文' });
    fireEvent.keyDown(editor, { key: 'k', metaKey: true });
    expect(container.querySelector('dialog')).not.toHaveAttribute('open');
  });

  it('shortcutKey=nullならグローバルキーを登録しない', () => {
    const { container } = render(
      <CommandPalette groups={GROUPS} onCommandSelect={vi.fn()} shortcutKey={null} />,
    );
    fireEvent.keyDown(document.body, { key: 'k', metaKey: true });
    expect(container.querySelector('dialog')).not.toHaveAttribute('open');
  });

  it('controlled openはonOpenChangeだけを通知する', () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <CommandPalette
        groups={GROUPS}
        onCommandSelect={vi.fn()}
        open={false}
        onOpenChange={onOpenChange}
      />,
    );
    fireEvent.keyDown(document.body, { key: 'k', ctrlKey: true });
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(container.querySelector('dialog')).not.toHaveAttribute('open');
  });
});
