import * as React from 'react';
import { createPortal } from 'react-dom';
import {
  flexRender,
  functionalUpdate,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type OnChangeFn,
  type PaginationState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import {
  Button,
  ChevronDown,
  ChevronUp,
  Filter,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  X,
  cn,
} from '@kedama-design/design-system';

/** ヘッダーから選ぶ単一選択フィルタの候補 */
export interface DataTableFilterOption {
  label: string;
  value: string;
}

export type DataTableHeaderFilter =
  | { type: 'text'; placeholder?: string }
  | { type: 'select'; options: DataTableFilterOption[]; allLabel?: string };

export interface DataTableColumnHeaderProps<TData, TValue = unknown> {
  column: Column<TData, TValue>;
  label: string;
  filter?: DataTableHeaderFilter;
}

/**
 * DataTableColumnHeader — 列名を押して、その列だけの絞り込みと並べ替えを行う。
 *
 * 一覧上部に巨大な FilterBar を常設せず、「何を絞る操作か」を列との位置関係で
 * 明らかにする。保存ビューは列フィルタ状態を外部制御し、AppHeader のタブなど
 * プロダクト側のナビゲーションと組み合わせる。
 */
export function DataTableColumnHeader<TData, TValue = unknown>({
  column,
  label,
  filter,
}: DataTableColumnHeaderProps<TData, TValue>): React.JSX.Element {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const menuId = React.useId();
  const [open, setOpen] = React.useState(false);
  const [position, setPosition] = React.useState<{ left: number; top: number } | null>(null);
  const filterValue = column.getFilterValue();
  const active = filterValue != null && filterValue !== '';
  const canSort = column.getCanSort();
  const sorting = column.getIsSorted();
  const affordanceState = active
    ? 'filtered'
    : sorting === 'asc'
      ? 'sorted-asc'
      : sorting === 'desc'
        ? 'sorted-desc'
        : 'menu';

  React.useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    const positionMenu = (): void => {
      const anchor = buttonRef.current?.getBoundingClientRect();
      if (anchor == null) return;

      const viewportPadding = 8;
      const gap = 4;
      const menuWidth = menuRef.current?.offsetWidth ?? 224;
      const menuHeight = menuRef.current?.offsetHeight ?? 0;
      const left = Math.min(
        Math.max(viewportPadding, anchor.left),
        Math.max(viewportPadding, window.innerWidth - menuWidth - viewportPadding),
      );
      const below = anchor.bottom + gap;
      const top =
        below + menuHeight <= window.innerHeight - viewportPadding
          ? below
          : Math.max(viewportPadding, anchor.top - menuHeight - gap);

      setPosition((current) =>
        current?.left === left && current.top === top ? current : { left, top },
      );
    };

    const closeOnOutsidePointer = (event: PointerEvent): void => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    };

    positionMenu();
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', positionMenu);
    window.addEventListener('scroll', positionMenu, true);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', positionMenu);
      window.removeEventListener('scroll', positionMenu, true);
    };
  }, [open]);

  if (filter == null && !canSort) return <span>{label}</span>;

  return (
    <div data-slot="data-table-column-menu">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'group/column-header flex min-h-7 items-center gap-1 rounded-sm',
          'text-xs outline-hidden transition-colors duration-fast ease-default',
          'hover:text-fg-default focus-visible:ring-2 focus-visible:ring-border-focus',
          active || sorting ? 'text-fg-default' : 'text-fg-muted',
        )}
      >
        <span className="truncate">{label}</span>
        <span
          aria-hidden="true"
          data-slot="data-table-column-affordance"
          data-state={affordanceState}
          className={cn(
            'flex size-3.5 shrink-0 items-center justify-center transition-colors duration-fast ease-default',
            active || sorting || open
              ? 'text-accent-primary'
              : 'text-fg-decorative group-hover/column-header:text-fg-muted group-focus/column-header:text-fg-muted',
          )}
        >
          {active ? (
            <Filter className="size-3" />
          ) : sorting === 'asc' ? (
            <ChevronUp className="size-3" />
          ) : (
            <ChevronDown className="size-3" />
          )}
        </span>
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="dialog"
            aria-label={`${label}の列操作`}
            data-slot="data-table-column-menu-content"
            style={position ?? { visibility: 'hidden' }}
            className="fixed z-50 flex w-56 flex-col gap-2 rounded-md border border-border-muted bg-surface p-2 shadow-overlay"
          >
            {filter?.type === 'text' && (
              <input
                type="search"
                aria-label={`${label}で絞り込む`}
                placeholder={filter.placeholder ?? `${label}を検索`}
                value={typeof filterValue === 'string' ? filterValue : ''}
                onChange={(event) => column.setFilterValue(event.currentTarget.value)}
                className="h-8 w-full rounded-sm border border-border-muted bg-page px-2 text-xs text-fg-default outline-hidden placeholder:text-fg-placeholder focus-visible:ring-2 focus-visible:ring-border-focus"
              />
            )}

            {filter?.type === 'select' && (
              <select
                aria-label={`${label}で絞り込む`}
                value={typeof filterValue === 'string' ? filterValue : ''}
                onChange={(event) => column.setFilterValue(event.currentTarget.value)}
                className="h-8 w-full rounded-sm border border-border-muted bg-page px-2 text-xs text-fg-default outline-hidden focus-visible:ring-2 focus-visible:ring-border-focus"
              >
                <option value="">{filter.allLabel ?? 'すべて'}</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

            {(canSort || active) && (
              <div className="flex items-center gap-1 border-t border-border-muted pt-2">
                {canSort && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`${label}を昇順に並べる`}
                      title="昇順"
                      onClick={() => column.toggleSorting(false)}
                    >
                      <ChevronUp />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`${label}を降順に並べる`}
                      title="降順"
                      onClick={() => column.toggleSorting(true)}
                    >
                      <ChevronDown />
                    </Button>
                  </>
                )}
                {active && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="ml-auto"
                    aria-label={`${label}の絞り込みを解除`}
                    title="絞り込みを解除"
                    onClick={() => column.setFilterValue(undefined)}
                  >
                    <X />
                  </Button>
                )}
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}

interface SelectionCheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'checked' | 'type'
> {
  checked: boolean | 'indeterminate';
}

function SelectionCheckbox({ checked, ...props }: SelectionCheckboxProps): React.JSX.Element {
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (ref.current != null) ref.current.indeterminate = checked === 'indeterminate';
  }, [checked]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked === true}
      aria-checked={checked === 'indeterminate' ? 'mixed' : checked}
      className="size-3.5 shrink-0 accent-accent-primary outline-hidden focus-visible:ring-2 focus-visible:ring-border-focus"
      {...props}
    />
  );
}

export interface DataTableProps<TData, TValue = unknown> extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children'
> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** 保存ビューなど、表の外から列フィルタを制御する */
  columnFilters?: ColumnFiltersState;
  /** 非制御時の初期列フィルタ */
  defaultColumnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  /** 保存ビューなど、表の外から並び順を制御する */
  sorting?: SortingState;
  /** 非制御時の初期並び順 */
  defaultSorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  /** 設定画面など、表の外から表示列を制御する */
  columnVisibility?: VisibilityState;
  /** 非制御時の初期表示列 */
  defaultColumnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
  /** フィルタ後の件数。StatusBar など表の外へ渡す */
  onFilteredRowCountChange?: (count: number) => void;
  /** 先頭に行選択チェックボックスを追加する */
  selectable?: boolean;
  /** 設定画面や一括操作から行選択を制御する */
  rowSelection?: RowSelectionState;
  /** 非制御時の初期選択 */
  defaultRowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  /** 一括操作へ渡す選択済みの元データ */
  onSelectedRowsChange?: (rows: TData[]) => void;
  /** 行の安定ID。省略時は TanStack の行番号になる */
  getRowId?: (originalRow: TData, index: number, parent?: Row<TData>) => string;
  loading?: boolean;
  error?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  /** 指定した場合だけページングする。未指定なら全行を表示 */
  pageSize?: number;
}

export function DataTable<TData, TValue = unknown>({
  columns,
  data,
  columnFilters: controlledColumnFilters,
  defaultColumnFilters = [],
  onColumnFiltersChange,
  sorting: controlledSorting,
  defaultSorting = [],
  onSortingChange,
  columnVisibility: controlledVisibility,
  defaultColumnVisibility = {},
  onColumnVisibilityChange,
  onFilteredRowCountChange,
  selectable = false,
  rowSelection: controlledRowSelection,
  defaultRowSelection = {},
  onRowSelectionChange,
  onSelectedRowsChange,
  getRowId,
  loading = false,
  error,
  emptyMessage = '条件に一致する項目はありません',
  pageSize,
  className,
  ...props
}: DataTableProps<TData, TValue>): React.JSX.Element {
  const [uncontrolledSorting, setUncontrolledSorting] =
    React.useState<SortingState>(defaultSorting);
  const [uncontrolledColumnFilters, setUncontrolledColumnFilters] =
    React.useState<ColumnFiltersState>(defaultColumnFilters);
  const [uncontrolledVisibility, setUncontrolledVisibility] =
    React.useState<VisibilityState>(defaultColumnVisibility);
  const [uncontrolledRowSelection, setUncontrolledRowSelection] =
    React.useState<RowSelectionState>(defaultRowSelection);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSize ?? Math.max(data.length, 1),
  });

  const sorting = controlledSorting ?? uncontrolledSorting;
  const columnFilters = controlledColumnFilters ?? uncontrolledColumnFilters;
  const columnVisibility = controlledVisibility ?? uncontrolledVisibility;
  const rowSelection = controlledRowSelection ?? uncontrolledRowSelection;
  const setSorting = React.useCallback<OnChangeFn<SortingState>>(
    (updater) => {
      const next = functionalUpdate(updater, sorting);
      if (controlledSorting === undefined) setUncontrolledSorting(next);
      onSortingChange?.(next);
    },
    [controlledSorting, onSortingChange, sorting],
  );
  const setColumnFilters = React.useCallback<OnChangeFn<ColumnFiltersState>>(
    (updater) => {
      const next = functionalUpdate(updater, columnFilters);
      if (controlledColumnFilters === undefined) setUncontrolledColumnFilters(next);
      onColumnFiltersChange?.(next);
    },
    [columnFilters, controlledColumnFilters, onColumnFiltersChange],
  );
  const setColumnVisibility = React.useCallback<OnChangeFn<VisibilityState>>(
    (updater) => {
      const next = functionalUpdate(updater, columnVisibility);
      if (controlledVisibility === undefined) setUncontrolledVisibility(next);
      onColumnVisibilityChange?.(next);
    },
    [columnVisibility, controlledVisibility, onColumnVisibilityChange],
  );
  const setRowSelection = React.useCallback<OnChangeFn<RowSelectionState>>(
    (updater) => {
      const next = functionalUpdate(updater, rowSelection);
      if (controlledRowSelection === undefined) setUncontrolledRowSelection(next);
      onRowSelectionChange?.(next);
    },
    [controlledRowSelection, onRowSelectionChange, rowSelection],
  );

  React.useEffect(() => {
    if (pageSize == null) return;
    setPagination((current) => ({ ...current, pageSize }));
  }, [pageSize]);

  // TanStack Table v8 returns a mutable table instance; React Compiler intentionally skips it.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility, pagination, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: selectable,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: pageSize == null ? undefined : getPaginationRowModel(),
    getRowId,
  });

  const filteredCount = table.getFilteredRowModel().rows.length;
  React.useEffect(() => {
    onFilteredRowCountChange?.(filteredCount);
  }, [filteredCount, onFilteredRowCountChange]);

  React.useEffect(() => {
    onSelectedRowsChange?.(
      table.getSelectedRowModel().flatRows.map((selectedRow) => selectedRow.original),
    );
  }, [data, onSelectedRowsChange, rowSelection, table]);

  const rows = table.getRowModel().rows;
  const visibleColumnCount = table.getVisibleLeafColumns().length;
  const renderedColumnCount = visibleColumnCount + (selectable ? 1 : 0);
  const headerGroups = table.getHeaderGroups();
  const showPagination = pageSize != null && table.getPageCount() > 1;

  return (
    <div data-slot="data-table" className={cn('min-w-0 bg-surface', className)} {...props}>
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-surface">
          {headerGroups.map((headerGroup, headerGroupIndex) => (
            <TableRow key={headerGroup.id}>
              {selectable && headerGroupIndex === 0 && (
                <TableHead
                  data-slot="data-table-selection-head"
                  className="w-9 px-2"
                  rowSpan={headerGroups.length}
                >
                  <SelectionCheckbox
                    checked={
                      table.getIsAllPageRowsSelected()
                        ? true
                        : table.getIsSomePageRowsSelected()
                          ? 'indeterminate'
                          : false
                    }
                    aria-label="表示中の行をすべて選択"
                    onChange={table.getToggleAllPageRowsSelectedHandler()}
                  />
                </TableHead>
              )}
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  aria-sort={
                    header.column.getIsSorted() === 'asc'
                      ? 'ascending'
                      : header.column.getIsSorted() === 'desc'
                        ? 'descending'
                        : header.column.getCanSort()
                          ? 'none'
                          : undefined
                  }
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={renderedColumnCount} className="h-24 text-center">
                <span className="inline-flex items-center gap-2 text-sm text-fg-muted">
                  <Spinner className="size-3.5" label="読み込み中" />
                  読み込み中
                </span>
              </TableCell>
            </TableRow>
          ) : error != null ? (
            <TableRow>
              <TableCell
                colSpan={renderedColumnCount}
                className="h-24 whitespace-normal text-center text-status-danger"
                role="alert"
              >
                {error}
              </TableCell>
            </TableRow>
          ) : rows.length > 0 ? (
            rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
                {selectable && (
                  <TableCell data-slot="data-table-selection-cell" className="w-9 px-2">
                    <SelectionCheckbox
                      checked={row.getIsSelected()}
                      aria-label={`${row.id}を選択`}
                      disabled={!row.getCanSelect()}
                      onChange={row.getToggleSelectedHandler()}
                    />
                  </TableCell>
                )}
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={renderedColumnCount}
                className="h-24 whitespace-normal text-center text-fg-muted"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {showPagination && (
        <div
          data-slot="data-table-pagination"
          className="flex h-9 items-center justify-end gap-2 border-t border-border-muted px-2"
        >
          <span className="mr-auto text-xs text-fg-muted">
            {pagination.pageIndex + 1} / {table.getPageCount()} ページ
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            前へ
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            次へ
          </Button>
        </div>
      )}
    </div>
  );
}
