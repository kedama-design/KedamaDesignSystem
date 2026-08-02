import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';

import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../components/ui/table';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../components/ui/accordion';
import { Skeleton } from '../components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { TextField } from '../components/TextField';

/**
 * Dark surface 比較 — 実コンポーネント版
 *
 * `Foundations/Dark Surface Comparison` は素の div とインラインスタイルで面の色だけを
 * 並べたページで、「単色の面」としては比べられるが、**実際の部品が同居したときに
 * 面の分離が成立するか**は分からない。このページは取り込んだ Accordion / Table /
 * Button と、既存の Card / Badge / TextField を1画面に載せて、それを見るためのもの。
 *
 * ## 切り替わるもの
 *
 * `data-surface="alt"` のときだけ `bg.surface` と `bg.surface-raised` が
 * birch/700 → birch/800 に下がる。`bg.page` は birch/800 のままなので、alt では
 * カードと地の色が同じになり、**面の分離は border.muted のヘアラインだけが担う**。
 *
 * ## 見るべき点
 *
 * 1. alt でカード・テーブル・アコーディオンの境界がヘアラインだけで足りているか
 * 2. 既定（birch/700）でカードが浮きすぎていないか（Calm UI としてうるさくないか）
 * 3. 本文4階調（default / secondary / muted / decorative）の読み分けやすさ
 * 4. Skeleton の面が「空」ではなく「これから入る」と読めるか
 */

type SurfaceVariant = 'default' | 'alt';

/** 表示用の合成データ。実在の企業ではない。 */
const ROWS = [
  { site: '株式会社あさひ', pages: '1,284', score: '92', status: '完了', tone: 'success' },
  { site: 'みどり工業', pages: '318', score: '74', status: '確認待ち', tone: 'warning' },
  { site: 'たけうち商店', pages: '96', score: '41', status: '失敗', tone: 'danger' },
  { site: 'なかむら製作所', pages: '2,051', score: '88', status: '実行中', tone: 'info' },
] as const;

function Screen() {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: 720,
        background: 'var(--color-bg-page)',
        color: 'var(--color-fg-default)',
        fontFamily: 'var(--primitive-font-family-body)',
      }}
    >
      {/* ── サイドバー ── */}
      <aside
        style={{
          width: 180,
          flexShrink: 0,
          background: 'var(--color-bg-sidebar)',
          borderRight: '1px solid var(--color-border-muted)',
          padding: '16px 10px',
        }}
      >
        <div
          style={{
            fontSize: 10.5,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--color-fg-muted)',
            margin: '0 6px 10px',
          }}
        >
          メニュー
        </div>
        {['ダッシュボード', 'サイト一覧', 'レポート', '設定'].map((label, i) => (
          <div
            key={label}
            style={{
              fontSize: 13,
              padding: '7px 8px',
              borderRadius: 'var(--primitive-radius-sm)',
              marginBottom: 2,
              background: i === 1 ? 'var(--color-bg-selected)' : 'transparent',
              color: i === 1 ? 'var(--color-fg-link)' : 'var(--color-fg-secondary)',
            }}
          >
            {label}
          </div>
        ))}
      </aside>

      {/* ── 本体 ── */}
      <main style={{ flex: 1, padding: 20, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--primitive-font-family-heading)',
                fontSize: 22,
                fontWeight: 500,
              }}
            >
              サイト診断
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--color-fg-muted)', marginTop: 2 }}>
              最終実行 2026-08-01 09:14
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="sm">
              書き出し
            </Button>
            <Button variant="primary" size="sm">
              新規診断
            </Button>
          </div>
        </div>

        {/* Card — surface の上に載る面 */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>絞り込み</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 220px' }}>
                <TextField label="キーワード" placeholder="サイト名で検索…" />
              </div>
              <div style={{ display: 'flex', gap: 6, paddingBottom: 6 }}>
                <Badge variant="success">完了</Badge>
                <Badge variant="warning">確認待ち</Badge>
                <Badge variant="danger">失敗</Badge>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm">
              条件をクリア
            </Button>
          </CardFooter>
        </Card>

        {/* Table — 取り込み品。罫線は border-b（色指定なし）で @layer base の既定色を拾う */}
        <div
          style={{
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-muted)',
            borderRadius: 'var(--primitive-radius-md)',
            overflow: 'hidden',
            marginBottom: 16,
          }}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">サイト</TableHead>
                <TableHead>ページ数</TableHead>
                <TableHead>スコア</TableHead>
                <TableHead className="pr-4">状態</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ROWS.map((r) => (
                <TableRow key={r.site}>
                  <TableCell className="pl-4">{r.site}</TableCell>
                  <TableCell className="font-numeric tabular-nums">{r.pages}</TableCell>
                  <TableCell className="font-numeric tabular-nums">{r.score}</TableCell>
                  <TableCell className="pr-4">
                    <span
                      style={{
                        background: `var(--color-status-${r.tone}-bg)`,
                        color: `var(--color-status-${r.tone})`,
                        border: `1px solid var(--color-status-${r.tone}-border)`,
                        borderRadius: 'var(--primitive-radius-sm)',
                        padding: '2px 8px',
                        fontSize: 11,
                      }}
                    >
                      {r.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {/* Accordion — 取り込み品。区切りは not-last:border-b（色指定なし） */}
          <div
            style={{
              flex: '1 1 320px',
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-muted)',
              borderRadius: 'var(--primitive-radius-md)',
              padding: '4px 14px',
            }}
          >
            <Accordion defaultValue={['a']}>
              <AccordionItem value="a">
                <AccordionTrigger>スコアはどう計算されますか</AccordionTrigger>
                <AccordionContent>
                  表示速度・構造化データ・アクセシビリティの3軸を重み付けして算出します。
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="b">
                <AccordionTrigger>診断の間隔を変えられますか</AccordionTrigger>
                <AccordionContent>
                  設定画面から日次・週次・月次のいずれかを選べます。
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* 取り込み品の Button と、読み込み中の面 */}
          <div
            style={{
              flex: '1 1 260px',
              background: 'var(--color-bg-surface-raised)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--primitive-radius-md)',
              padding: 14,
            }}
          >
            <div style={{ fontSize: 12.5, marginBottom: 10 }}>surface-raised（モーダル相当）</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              <Button size="sm">既定</Button>
              <Button variant="outline" size="sm">
                outline
              </Button>
              <Button variant="secondary" size="sm">
                secondary
              </Button>
              <Button variant="ghost" size="sm">
                ghost
              </Button>
            </div>

            <div style={{ fontSize: 11, color: 'var(--color-fg-muted)', marginBottom: 6 }}>
              読み込み中（Skeleton は既定で静止）
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-4/5" />
              <Skeleton className="h-3.5 w-3/5" />
            </div>

            {/* 本文4階調 */}
            <div style={{ marginTop: 14, fontSize: 12, lineHeight: 1.9 }}>
              <div>本文（fg.default）</div>
              <div style={{ color: 'var(--color-fg-secondary)' }}>二次（fg.secondary）</div>
              <div style={{ color: 'var(--color-fg-muted)' }}>補助（fg.muted）</div>
              <div style={{ color: 'var(--color-fg-decorative)' }}>装飾（fg.decorative）</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function RealisticPage({ variant = 'default' }: { variant?: SurfaceVariant }) {
  // 実運用と同じくルート要素にテーマを置く。
  // 非 inline の @theme 変数は宣言元（:root = html）で解決されるため、
  // ラッパー div に付けると Light に固定されてしまう。
  React.useLayoutEffect(() => {
    const el = document.documentElement;
    const prevTheme = el.dataset.theme;
    const prevSurface = el.dataset.surface;
    el.dataset.theme = 'dark';
    if (variant === 'alt') el.dataset.surface = 'alt';
    else delete el.dataset.surface;
    return () => {
      if (prevTheme === undefined) delete el.dataset.theme;
      else el.dataset.theme = prevTheme;
      if (prevSurface === undefined) delete el.dataset.surface;
      else el.dataset.surface = prevSurface;
    };
  }, [variant]);

  return (
    <div style={{ background: 'var(--color-bg-page)', minHeight: '100vh' }}>
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--color-border-muted)',
          background: 'var(--color-bg-page)',
          color: 'var(--color-fg-default)',
          fontFamily: 'var(--primitive-font-family-body)',
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 500 }}>
          {variant === 'alt'
            ? 'alt — surface = birch/800（page と同色・ヘアライン分離）'
            : '既定 — surface = birch/700（§0.6 ルール1「surface は bg より1段階明るい」）'}
        </div>
        <div
          style={{
            fontFamily: 'var(--primitive-font-family-mono)',
            fontSize: 11,
            color: 'var(--color-fg-muted)',
            marginTop: 2,
          }}
        >
          data-theme=&quot;dark&quot;
          {variant === 'alt' ? ' data-surface="alt"' : ''}
        </div>
      </div>
      <Screen />
    </div>
  );
}

const meta = {
  title: 'Foundations/Dark Surface Realistic',
  component: RealisticPage,
  parameters: { layout: 'fullscreen', backgrounds: { disable: true } },
  argTypes: { variant: { control: 'inline-radio', options: ['default', 'alt'] } },
  args: { variant: 'default' },
} satisfies Meta<typeof RealisticPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SurfaceDefault: Story = {
  name: '既定（birch/700）',
  args: { variant: 'default' },
};
export const SurfaceAlt: Story = { name: 'alt（birch/800）', args: { variant: 'alt' } };
