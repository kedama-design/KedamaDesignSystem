import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import { DataTable, DataTableColumnHeader } from './DataTable';

interface Item {
  id: string;
  title: string;
  status: string;
}

const DATA: Item[] = [
  { id: '2', title: '請求書の整理', status: '公開済み' },
  { id: '1', title: '経理の改善', status: '編集中' },
];

const COLUMNS: ColumnDef<Item>[] = [
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
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        label="ステータス"
        filter={{
          type: 'select',
          options: [
            { label: '公開済み', value: '公開済み' },
            { label: '編集中', value: '編集中' },
          ],
        }}
      />
    ),
  },
];

describe('DataTable', () => {
  it('列ヘッダーからその列だけを絞り込み、件数を外へ渡す', async () => {
    const user = userEvent.setup();
    const onCountChange = vi.fn();
    render(<DataTable columns={COLUMNS} data={DATA} onFilteredRowCountChange={onCountChange} />);

    const header = screen.getByRole('button', { name: 'ステータス' });
    expect(header.querySelector('[data-slot="data-table-column-affordance"]')).toHaveAttribute(
      'data-state',
      'menu',
    );

    await user.click(header);
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'ステータスで絞り込む' }),
      '編集中',
    );

    expect(screen.getByText('経理の改善')).toBeInTheDocument();
    expect(screen.queryByText('請求書の整理')).toBeNull();
    expect(onCountChange).toHaveBeenLastCalledWith(1);
    expect(header.querySelector('[data-slot="data-table-column-affordance"]')).toHaveAttribute(
      'data-state',
      'filtered',
    );
  });

  it('保存ビューから列フィルタを制御し、変更後の状態を外へ渡す', async () => {
    const user = userEvent.setup();
    const filters: ColumnFiltersState = [{ id: 'status', value: '編集中' }];
    const onFiltersChange = vi.fn();
    render(
      <DataTable
        columns={COLUMNS}
        data={DATA}
        columnFilters={filters}
        onColumnFiltersChange={onFiltersChange}
      />,
    );

    expect(screen.getByText('経理の改善')).toBeInTheDocument();
    expect(screen.queryByText('請求書の整理')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'ステータス' }));
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'ステータスで絞り込む' }),
      '公開済み',
    );

    expect(onFiltersChange).toHaveBeenLastCalledWith([{ id: 'status', value: '公開済み' }]);
    expect(screen.getByText('経理の改善')).toBeInTheDocument();
  });

  it('保存ビューから並び順を制御し、変更後の状態を外へ渡す', async () => {
    const user = userEvent.setup();
    const sorting: SortingState = [{ id: 'id', desc: true }];
    const onSortingChange = vi.fn();
    render(
      <DataTable
        columns={COLUMNS}
        data={DATA}
        sorting={sorting}
        onSortingChange={onSortingChange}
      />,
    );

    const rows = screen.getAllByRole('row');
    expect(within(rows[1]).getByText('2')).toBeInTheDocument();
    expect(within(rows[2]).getByText('1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'ID' }));
    await user.click(screen.getByRole('button', { name: 'IDを昇順に並べる' }));

    expect(onSortingChange).toHaveBeenLastCalledWith([{ id: 'id', desc: false }]);
    expect(within(rows[1]).getByText('2')).toBeInTheDocument();
  });

  it('非制御の保存ビューに初期列フィルタを適用する', () => {
    render(
      <DataTable
        columns={COLUMNS}
        data={DATA}
        defaultColumnFilters={[{ id: 'status', value: '公開済み' }]}
      />,
    );

    expect(screen.getByText('請求書の整理')).toBeInTheDocument();
    expect(screen.queryByText('経理の改善')).toBeNull();
  });

  it('非制御の保存ビューに初期並び順を適用する', () => {
    render(
      <DataTable columns={COLUMNS} data={DATA} defaultSorting={[{ id: 'id', desc: false }]} />,
    );

    const rows = screen.getAllByRole('row');
    expect(within(rows[1]).getByText('1')).toBeInTheDocument();
    expect(within(rows[2]).getByText('2')).toBeInTheDocument();
  });

  it('列名ではなく列IDで表示・非表示を制御する', () => {
    const visibility: VisibilityState = { status: false };
    render(<DataTable columns={COLUMNS} data={DATA} columnVisibility={visibility} />);

    expect(screen.queryByText('ステータス')).toBeNull();
    expect(screen.queryByText('公開済み')).toBeNull();
    expect(screen.getByText('請求書の整理')).toBeInTheDocument();
  });

  it('先頭列で行を選択し、mixed全選択と元データを一括操作へ渡す', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const onSelectedRowsChange = vi.fn();
    render(
      <DataTable
        columns={COLUMNS}
        data={DATA}
        selectable
        getRowId={(row) => row.id}
        onRowSelectionChange={onSelectionChange}
        onSelectedRowsChange={onSelectedRowsChange}
      />,
    );

    const selectAll = screen.getByRole('checkbox', { name: '表示中の行をすべて選択' });
    await user.click(screen.getByRole('checkbox', { name: '2を選択' }));

    expect(onSelectionChange).toHaveBeenLastCalledWith({ 2: true });
    expect(onSelectedRowsChange).toHaveBeenLastCalledWith([DATA[0]]);
    expect(selectAll).toHaveAttribute('aria-checked', 'mixed');
    expect(selectAll).toHaveProperty('indeterminate', true);

    await user.click(selectAll);
    expect(onSelectionChange).toHaveBeenLastCalledWith({ 1: true, 2: true });
    expect(onSelectedRowsChange).toHaveBeenLastCalledWith(DATA);
  });

  it('ヘッダーメニューから昇順に並べる', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={COLUMNS} data={DATA} />);

    await user.click(screen.getByText('ID'));
    await user.click(screen.getByRole('button', { name: 'IDを昇順に並べる' }));

    const rows = screen.getAllByRole('row');
    expect(within(rows[1]).getByText('1')).toBeInTheDocument();
    expect(within(rows[2]).getByText('2')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'ID' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    expect(
      screen
        .getByRole('button', { name: 'ID' })
        .querySelector('[data-slot="data-table-column-affordance"]'),
    ).toHaveAttribute('data-state', 'sorted-asc');
  });

  it('列メニューを body 直下へ出し、Escape で閉じてヘッダーへフォーカスを戻す', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={COLUMNS} data={DATA} />);

    const header = screen.getByRole('button', { name: 'タイトル' });
    await user.click(header);
    const menu = screen.getByRole('dialog', { name: 'タイトルの列操作' });
    expect(menu.parentElement).toBe(document.body);

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'タイトルの列操作' })).toBeNull();
    expect(header).toHaveFocus();
  });

  it('loading / error / empty を明示する', () => {
    const { rerender } = render(<DataTable columns={COLUMNS} data={[]} loading />);
    expect(screen.getByRole('status', { name: '読み込み中' })).toBeInTheDocument();

    rerender(<DataTable columns={COLUMNS} data={[]} error="読み込みに失敗しました" />);
    expect(screen.getByRole('alert')).toHaveTextContent('読み込みに失敗しました');

    rerender(<DataTable columns={COLUMNS} data={[]} emptyMessage="記事がありません" />);
    expect(screen.getByText('記事がありません')).toBeInTheDocument();
  });

  it('pageSize を指定したときだけページングする', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={COLUMNS} data={DATA} pageSize={1} />);

    expect(screen.getByText('1 / 2 ページ')).toBeInTheDocument();
    expect(screen.getByText('請求書の整理')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '次へ' }));
    expect(screen.getByText('2 / 2 ページ')).toBeInTheDocument();
    expect(screen.getByText('経理の改善')).toBeInTheDocument();
  });
});
