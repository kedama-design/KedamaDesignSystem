import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef, VisibilityState } from '@tanstack/react-table';
import React from 'react';

import { DataTable, DataTableColumnHeader, type DataTableProps } from '../blocks/data-table';

interface ExampleRow {
  id: string;
  title: string;
  category: string;
  status: string;
}

const DATA: ExampleRow[] = [
  { id: 'COL-01', title: '請求書・書類のファイリング術', category: 'コラム', status: '公開済' },
  {
    id: 'COL-02',
    title: '経理担当者の生産性を上げる改善策',
    category: 'コラム',
    status: '確認待ち',
  },
  { id: 'PIL-01', title: '経理アウトソーシングの選び方', category: 'ピラー', status: '編集中' },
];

const COLUMNS: ColumnDef<ExampleRow>[] = [
  {
    accessorKey: 'id',
    header: ({ column }) => <DataTableColumnHeader column={column} label="ID" />,
  },
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        label="タイトル"
        filter={{ type: 'text', placeholder: 'タイトルを検索' }}
      />
    ),
  },
  {
    accessorKey: 'category',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        label="カテゴリ"
        filter={{
          type: 'select',
          options: [
            { label: 'コラム', value: 'コラム' },
            { label: 'ピラー', value: 'ピラー' },
          ],
        }}
      />
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        label="ステータス"
        filter={{
          type: 'select',
          options: [
            { label: '公開済', value: '公開済' },
            { label: '確認待ち', value: '確認待ち' },
            { label: '編集中', value: '編集中' },
          ],
        }}
      />
    ),
  },
];

type ExampleDataTableProps = Omit<DataTableProps<ExampleRow>, 'columns' | 'data'> & {
  data?: ExampleRow[];
};

function ExampleDataTable({ data = DATA, ...props }: ExampleDataTableProps): React.JSX.Element {
  return <DataTable columns={COLUMNS} data={data} {...props} />;
}

const meta = {
  title: 'Blocks/DataTable',
  component: ExampleDataTable,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ExampleDataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { selectable: true },
};

export const ColumnVisibility: Story = {
  args: {},
  render: function Render() {
    const [visibility, setVisibility] = React.useState<VisibilityState>({ category: false });
    return (
      <div className="flex flex-col gap-3 p-4">
        <label className="inline-flex items-center gap-2 text-sm text-fg-default">
          <input
            type="checkbox"
            checked={visibility.category !== false}
            onChange={(event) =>
              setVisibility((current) => ({ ...current, category: event.currentTarget.checked }))
            }
            className="size-4 accent-accent-primary"
          />
          カテゴリを表示
        </label>
        <DataTable
          columns={COLUMNS}
          data={DATA}
          columnVisibility={visibility}
          onColumnVisibilityChange={setVisibility}
        />
      </div>
    );
  },
};

export const Loading: Story = {
  args: { data: [], loading: true },
};

export const Empty: Story = {
  args: { data: [], emptyMessage: '記事がありません' },
};

export const Error: Story = {
  args: { data: [], error: '記事を読み込めませんでした' },
};
