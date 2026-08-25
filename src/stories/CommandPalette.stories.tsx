import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { Check, FileText, Settings, Users } from '../index';
import {
  CommandPalette,
  type CommandPaletteCommand,
  type CommandPaletteGroup,
} from '../blocks/command-palette';

const GROUPS: CommandPaletteGroup[] = [
  {
    id: 'navigation',
    label: '移動',
    commands: [
      {
        id: 'articles',
        label: 'すべての記事',
        keywords: ['記事一覧', 'コンテンツ'],
        icon: <FileText />,
      },
      { id: 'reviews', label: '自分の確認待ち', keywords: ['レビュー'], icon: <Check /> },
      { id: 'clients', label: 'クライアント', keywords: ['顧客'], icon: <Users /> },
      { id: 'settings', label: 'サイト設定', icon: <Settings /> },
    ],
  },
  {
    id: 'actions',
    label: '操作',
    commands: [
      { id: 'edit', label: '選択中の記事を編集', shortcut: 'Enter', icon: <FileText /> },
      { id: 'publish', label: '公開する', disabled: true, icon: <Check /> },
    ],
  },
];

const meta = {
  title: 'Blocks/CommandPalette',
  component: CommandPalette,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '横断検索とクイック操作の補助入口。主要操作は画面上にも残し、command IDで実行を分岐する。',
      },
    },
  },
} satisfies Meta<typeof CommandPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    groups: GROUPS,
    onCommandSelect: () => undefined,
    defaultOpen: true,
  },
};

function TriggeredExample(): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const [lastCommand, setLastCommand] = React.useState('未実行');

  const selectCommand = (command: CommandPaletteCommand): void => {
    setLastCommand(command.label);
  };

  return (
    <div className="min-h-dvh bg-page p-6 text-fg-default">
      <button
        type="button"
        className="h-8 rounded-sm border border-border-muted bg-surface px-3 text-sm hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
        onClick={() => setOpen(true)}
      >
        コマンドを開く
      </button>
      <p className="mt-3 text-sm text-fg-muted">最後の操作: {lastCommand}</p>
      <CommandPalette
        groups={GROUPS}
        onCommandSelect={selectCommand}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}

export const WithTrigger: Story = {
  args: { groups: GROUPS, onCommandSelect: () => undefined },
  render: () => <TriggeredExample />,
};

export const Empty: Story = {
  args: {
    groups: [],
    onCommandSelect: () => undefined,
    defaultOpen: true,
    emptyLabel: '利用できるコマンドがありません',
  },
};
