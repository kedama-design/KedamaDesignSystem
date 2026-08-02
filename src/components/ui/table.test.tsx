import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './table';

/**
 * Table は**プリミティブ**（Tier 0）。トークンでスタイルしただけの薄い要素群で、
 * TanStack には依存しない。ソート・ページネーション等を載せた DataTable は
 * Tier 2 で別に作る（仕様書 §4）。
 *
 * ここで守るのは「素の table セマンティクスを壊していないこと」。
 */
function Fixture() {
  return (
    <Table>
      <TableCaption>記事一覧</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>タイトル</TableHead>
          <TableHead>状態</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>デザインレビュー</TableCell>
          <TableCell>完了</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>1件</TableCell>
          <TableCell />
        </TableRow>
      </TableFooter>
    </Table>
  );
}

describe('Table', () => {
  it('renders a real table with an accessible name', () => {
    render(<Fixture />);
    expect(screen.getByRole('table', { name: '記事一覧' })).toBeInTheDocument();
  });

  it('keeps native row/columnheader/cell semantics', () => {
    render(<Fixture />);
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
    expect(screen.getByRole('cell', { name: 'デザインレビュー' })).toBeInTheDocument();
    // header 1 + body 1 + footer 1
    expect(screen.getAllByRole('row')).toHaveLength(3);
  });

  it('wraps the table in a scroll container（横スクロールを表側で持たせない）', () => {
    const { container } = render(<Fixture />);
    const wrapper = container.querySelector('[data-slot="table-container"]');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper?.querySelector('[data-slot="table"]')).toBeInTheDocument();
  });

  it('carries the expected slots', () => {
    const { container } = render(<Fixture />);
    for (const slot of [
      'table-header',
      'table-body',
      'table-footer',
      'table-head',
      'table-row',
      'table-cell',
      'table-caption',
    ]) {
      expect(container.querySelector(`[data-slot="${slot}"]`)).toBeInTheDocument();
    }
  });

  it('merges custom className', () => {
    render(
      <Table>
        <TableBody>
          <TableRow className="my-row">
            <TableCell>x</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('row').className).toContain('my-row');
  });
});
