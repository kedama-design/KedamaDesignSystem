import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';

import { Skeleton } from '../components/ui/skeleton';
import { Spinner } from '../components/ui/spinner';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../components/ui/accordion';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '../components/ui/table';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '../components/ui/drawer';
import { Toaster, toast } from '../components/ui/toast';
import { Button } from '../components/Button';

/**
 * Tier 0 の低層部品（Q4）。
 *
 * shadcn/ui（Base UI variant）から取り込み、Kedama トークンで再スタイルしたもの。
 * ファイル名は上流との追随性のため小文字のまま、公開シンボルは PascalCase。
 */
const meta: Meta = { title: 'Components/Low-level' };
export default meta;

// ─── Skeleton ───────────────────────────────────────────

/** 既定で静止する。明滅は呼び出し側が `animate-pulse` で足す */
export const SkeletonList: StoryObj = {
  name: 'Skeleton — 一覧の読み込み',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  ),
};

// ─── Spinner ────────────────────────────────────────────

/** 動きが情報を担う唯一の部品。reduced-motion では静止図形＋文字に入れ替わる */
export const SpinnerStates: StoryObj = {
  name: 'Spinner — 進行中',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Spinner />
      <Spinner label="集計中" />
      <Spinner label="送信中" className="size-6" />
    </div>
  ),
};

// ─── Accordion ──────────────────────────────────────────

export const AccordionBasic: StoryObj = {
  name: 'Accordion — 観点の開閉',
  render: () => (
    <div style={{ maxWidth: 560 }}>
      <Accordion>
        <AccordionItem value="a">
          <AccordionTrigger>公開前チェック</AccordionTrigger>
          <AccordionContent>
            タイトル・ディスクリプション・アイキャッチ画像・URL を確認します。
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>修正依頼の扱い</AccordionTrigger>
          <AccordionContent>
            テキスト範囲を指定して依頼できます。未解決の依頼は一覧に件数で出ます。
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

// ─── Table ──────────────────────────────────────────────

/** プリミティブ。TanStack 非依存で、DataTable（Tier 2）の素材になる */
export const TableBasic: StoryObj = {
  name: 'Table — 一覧（高密度）',
  render: () => (
    <div style={{ maxWidth: 720 }}>
      <Table>
        <TableCaption>記事一覧</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>タイトル</TableHead>
            <TableHead>クライアント</TableHead>
            <TableHead>状態</TableHead>
            <TableHead>期限</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[
            ['SEO記事の書き方', '株式会社あおい', '確認待ち', '08-05'],
            ['採用ページ改善案', '株式会社みどり', '修正対応中', '08-07'],
            ['導入事例インタビュー', '株式会社あおい', '公開済み', '—'],
          ].map(([title, client, status, due]) => (
            <TableRow key={title}>
              <TableCell>{title}</TableCell>
              <TableCell>{client}</TableCell>
              <TableCell>{status}</TableCell>
              <TableCell>{due}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
};

// ─── Drawer ─────────────────────────────────────────────

/**
 * 唯一の汎用エッジパネル。Sheet は廃止した（仕様書 §2.2）。
 * 左右・上下、スワイプ、スナップポイントを扱える。
 */
export const DrawerRight: StoryObj = {
  name: 'Drawer — 右からの詳細パネル',
  render: function DrawerStory() {
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>詳細を開く</Button>
        <Drawer open={open} onOpenChange={setOpen} swipeDirection="left">
          <DrawerContent>
            <div style={{ padding: 16 }}>
              <DrawerTitle>SEO記事の書き方</DrawerTitle>
              <DrawerDescription>株式会社あおい / 確認待ち</DrawerDescription>
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  },
};

// ─── Toast ──────────────────────────────────────────────

/**
 * ⚠️ Modal を開いている間、Toast は Modal の背後になる（仕様書 §2.2）。
 * ネイティブ `<dialog>` の top layer は z-index で覆せないため。
 */
export const ToastBasic: StoryObj = {
  name: 'Toast — 完了の通知',
  render: () => (
    <>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button onClick={() => toast.add({ title: '保存しました' })}>保存</Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast.add({ title: '入稿しました', description: 'WordPress へ送信しました' })
          }
        >
          入稿
        </Button>
      </div>
      <Toaster />
    </>
  ),
};
