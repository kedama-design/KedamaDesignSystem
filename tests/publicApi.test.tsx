import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import * as api from '../src/index';

/**
 * 公開 API の面を固定する。
 *
 * `src/index.ts` は消費側との契約そのものであり、**ワイルドカード export を
 * 使わず列挙している**（何が公開 API かをあのファイルだけで読めるようにするため）。
 * 列挙は書き漏らしうるので、ここで機械的に確認する。
 *
 * 併せて「公開しないもの」も固定する。公開は後から取り消しにくい。
 */

/** Tier 0 として消費側へ約束する named export */
const REQUIRED_EXPORTS = [
  // Kedama 製
  'Button',
  'Badge',
  'TextField',
  'Card',
  'CardHeader',
  'CardTitle',
  'CardContent',
  'CardFooter',
  'Modal',
  // 低層部品（取り込み品）
  'Skeleton',
  'Spinner',
  'Accordion',
  'AccordionItem',
  'AccordionTrigger',
  'AccordionContent',
  'Table',
  'TableHeader',
  'TableBody',
  'TableFooter',
  'TableHead',
  'TableRow',
  'TableCell',
  'TableCaption',
  'Drawer',
  'DrawerPortal',
  'DrawerOverlay',
  'DrawerSwipeHandle',
  'DrawerTrigger',
  'DrawerClose',
  'DrawerContent',
  'DrawerHeader',
  'DrawerFooter',
  'DrawerTitle',
  'DrawerDescription',
  'Toaster',
  'Toast',
  'ToastAction',
  'ToastClose',
  'ToastContent',
  'ToastDescription',
  'ToastPortal',
  'ToastProvider',
  'ToastTitle',
  'ToastViewport',
  'createToastManager',
  'toast',
  'useToastManager',
  // テーマ
  'ThemeProvider',
  'useTheme',
  'THEMES',
  // トークン・ユーティリティ
  'elevation',
  'semanticColors',
  'cn',
] as const;

describe('公開 API', () => {
  it.each(REQUIRED_EXPORTS)('exports %s', (name) => {
    expect(api, `${name} が公開されていない（src/index.ts の列挙漏れ）`).toHaveProperty(name);
    expect((api as Record<string, unknown>)[name]).toBeDefined();
  });

  /**
   * Sheet は廃止した。Drawer が唯一の汎用エッジパネル（仕様書 §2.2）。
   * 同じ役割の部品を2つ公開すると、消費側で選択が発生し「ずれ」が再発する。
   */
  it.each(['Sheet', 'SheetContent', 'SheetTrigger', 'SheetClose', 'SheetTitle'])(
    'does not export %s（Drawer に一本化した）',
    (name) => {
      expect(api).not.toHaveProperty(name);
    },
  );

  it('does not leak internals of the imported components', () => {
    // 取り込み品の内部ヘルパが漏れていないこと
    expect(api).not.toHaveProperty('useDrawer');
    expect(api).not.toHaveProperty('DrawerContext');
  });

  /**
   * compound component（`Card.Header` 等）はルートから使えること。
   * named export と compound の両方を約束しているため、両方を確認する。
   */
  it('supports the compound Card API from the root entry', () => {
    const { Card } = api;
    expect(Card.Header).toBeDefined();
    expect(Card.Body).toBeDefined();
    expect(Card.Footer).toBeDefined();
    expect(Card.Title).toBeDefined();

    render(
      <Card>
        <Card.Header>
          <Card.Title>見出し</Card.Title>
        </Card.Header>
        <Card.Body>本文</Card.Body>
        <Card.Footer>脚注</Card.Footer>
      </Card>,
    );
    expect(screen.getByText('見出し')).toBeInTheDocument();
    expect(screen.getByText('本文')).toBeInTheDocument();
    expect(screen.getByText('脚注')).toBeInTheDocument();
  });

  it('renders low-level components imported from the root entry', () => {
    const { Table, TableBody, TableRow, TableCell, Skeleton, Spinner } = api;
    render(
      <>
        <Skeleton data-testid="sk" />
        <Spinner label="読み込み中" />
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>セル</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </>,
    );
    expect(screen.getByTestId('sk')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'セル' })).toBeInTheDocument();
  });
});
