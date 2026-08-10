import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import {
  AppShell,
  AuthShell,
  SidebarNav,
  IconRail,
  AppHeader,
  StatusBar,
  StatusBarItem,
  RightPane,
  type SidebarNavGroup,
  type IconRailItem,
} from '../blocks/app-shell';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TextField,
  ThemeToggle,
  Bell,
  Check,
  FileText,
  Folder,
  Settings,
  Users,
} from '../index';

/**
 * Tier 2 ブロック `app-shell`（仕様書 §4.5）
 *
 * **npm では配らない。** レジストリ配布であり、`src/index.ts` からは公開していない
 * （`tests/tier2Boundary.test.ts`）。このストーリーが `../blocks/app-shell` を
 * 直接 import しているのはそのため。消費側は `shadcn add @kedama/app-shell` で
 * ファイルごと受け取る。
 *
 * ## ここで実測すること（design-rules 3.5）
 *
 * クラス名を読んでも CSS が解決したかは分からない。ブラウザで開いて次を見る。
 *
 * 1. サイドバーが 240px、右ペインが 360px、レールが 48px で出ているか
 * 2. トグルで幅が **遷移して** 畳まれるか（飛んでいないか）
 * 3. 768px 未満に縮めたとき、レールが消え・サイドバーが Drawer になるか
 * 4. StatusBar が最下部に貼り付き、中身だけがスクロールするか
 * 5. コンソールに警告が出ていないか
 */
const meta = {
  title: 'Blocks/AppShell',
  component: AppShell,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'アプリケーションの外枠一式。構造と挙動の正は shadcn、要件は Ibuki のプロトタイプと' +
          'ベンチマーク §7.2、トークンの値は Kedama（仕様書 §4.5）。',
      },
    },
  },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── サンプルデータ ─────────────────────────────────────

const NAV: SidebarNavGroup[] = [
  {
    id: 'work',
    label: '作業',
    items: [
      { id: 'articles', label: 'すべての記事', icon: <FileText />, href: '#articles' },
      { id: 'reviews', label: '自分の確認待ち', icon: <Check />, badge: '3', href: '#reviews' },
      {
        id: 'in-progress',
        label: '修正対応中',
        icon: <Folder />,
        href: '#in-progress',
        items: [
          { id: 'in-progress-mine', label: '自分の担当', href: '#mine' },
          { id: 'in-progress-team', label: 'チーム', href: '#team' },
        ],
      },
    ],
  },
  {
    id: 'manage',
    label: '管理',
    items: [
      { id: 'clients', label: 'クライアント', icon: <Users />, href: '#clients' },
      { id: 'settings', label: '設定', icon: <Settings />, href: '#settings' },
      { id: 'archive', label: 'アーカイブ', icon: <Folder />, disabled: true },
    ],
  },
];

const RAILS: IconRailItem[] = [
  { id: 'articles', label: '記事', icon: <FileText /> },
  { id: 'clients', label: 'クライアント', icon: <Users /> },
  { id: 'settings', label: '設定', icon: <Settings /> },
];

/** 架空のサンプル。日付は持たせない（ストーリーを決定的に保つため） */
const ROWS = [
  {
    id: 'a1',
    title: '在庫管理を止めないための棚卸し設計',
    client: '青葉製作所',
    status: '確認待ち',
  },
  { id: 'a2', title: '請求フローを一本化した話', client: '常盤ホールディングス', status: '修正中' },
  {
    id: 'a3',
    title: '現場が使い続けるダッシュボードの条件',
    client: '青葉製作所',
    status: '承認済み',
  },
  { id: 'a4', title: '入稿前チェックリストの作り方', client: '白樺工業', status: '公開済み' },
];

function ArticleTable(): React.JSX.Element {
  return (
    <div className="p-6">
      <Card noPadding>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>タイトル</TableHead>
              <TableHead>クライアント</TableHead>
              <TableHead>ステータス</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ROWS.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.title}</TableCell>
                <TableCell>{row.client}</TableCell>
                <TableCell>
                  <Badge>{row.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

/** スクロールの担当が本文だけであることを確かめるための長い中身 */
function LongContent(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4 p-6">
      {Array.from({ length: 12 }, (_, i) => (
        <Card key={i}>
          <CardHeader>
            <CardTitle>セクション {i + 1}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-fg-muted">
              ステータスバーが最下部に貼り付いたまま、この領域だけがスクロールする。
              左サイドバーとアイコンレールも動かない。
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function HeaderActions(): React.JSX.Element {
  return (
    <>
      <Button variant="ghost" size="icon-sm" aria-label="通知">
        <Bell />
      </Button>
      <ThemeToggle />
    </>
  );
}

// ─── ストーリー ─────────────────────────────────────────

/** すべてのスロットを埋めた既定形。ベンチマーク §7.2 の構成そのもの。 */
export const Default: Story = {
  args: { children: null },
  render: function Render() {
    const [active, setActive] = React.useState('articles');
    const [rail, setRail] = React.useState('articles');

    return (
      <AppShell
        iconRail={
          <IconRail
            items={RAILS}
            activeId={rail}
            onSelect={(item) => setRail(item.id)}
            showLabels
          />
        }
        sidebar={
          <SidebarNav
            groups={NAV}
            activeId={active}
            onSelect={(item) => setActive(item.id)}
            header={<div className="px-2 py-1 text-sm font-medium">すらすらスタジオ</div>}
            footer={<div className="px-2 py-1 text-xs text-fg-muted">担当者</div>}
          />
        }
        header={
          <AppHeader
            breadcrumbs={[
              { id: 'home', label: 'ホーム', href: '#' },
              { id: 'articles', label: '記事' },
            ]}
            search={<TextField placeholder="検索（⌘K）" aria-label="検索" />}
            actions={<HeaderActions />}
          />
        }
        statusBar={
          <StatusBar
            left={
              <>
                <StatusBarItem tone="success" icon={<Check />} live>
                  保存済み
                </StatusBarItem>
                <StatusBarItem>WordPress 接続済み</StatusBarItem>
              </>
            }
            right={<StatusBarItem>{ROWS.length} 件</StatusBarItem>}
          />
        }
        rightPane={
          <RightPane title="レビュー">
            <div className="flex flex-col gap-3 text-sm">
              <p className="text-fg-muted">この領域は開閉できる。モバイルでは Drawer に化ける。</p>
              <Button variant="secondary" size="sm">
                修正を依頼する
              </Button>
            </div>
          </RightPane>
        }
      >
        <ArticleTable />
      </AppShell>
    );
  },
};

/** 右ペインを開いた状態。幅 360px（§4.5 の 320〜400px）。 */
export const WithRightPaneOpen: Story = {
  args: { children: null },
  render: () => (
    <AppShell
      defaultRightPaneOpen
      sidebar={<SidebarNav groups={NAV} activeId="articles" />}
      header={<AppHeader breadcrumbs={[{ id: 'articles', label: '記事' }]} />}
      statusBar={<StatusBar left={<StatusBarItem>保存済み</StatusBarItem>} />}
      rightPane={
        <RightPane title="レビュー">
          <p className="text-sm text-fg-muted">開いた状態の右ペイン。</p>
        </RightPane>
      }
    >
      <ArticleTable />
    </AppShell>
  ),
};

/**
 * `collapsible="icon"` — 畳んでもアイコンだけ残す（VS Code / Linear 型）。
 * ラベルは `title` に残るので、ホバーでも支援技術でも失われない。
 */
export const CollapsibleIcon: Story = {
  args: { children: null },
  render: () => (
    <AppShell
      sidebarCollapsible="icon"
      defaultSidebarOpen={false}
      sidebar={<SidebarNav groups={NAV} activeId="articles" />}
      header={<AppHeader breadcrumbs={[{ id: 'articles', label: '記事' }]} />}
      statusBar={<StatusBar left={<StatusBarItem>畳んだ状態</StatusBarItem>} />}
    >
      <ArticleTable />
    </AppShell>
  ),
};

/**
 * `collapsible="none"` — 畳まないサイドバー。
 *
 * トグルは**出ない**（押しても何も起きない操作を置かないため）。
 * モバイル幅でも Drawer にせず据え置く。Drawer にすると、開く手段の無い
 * Drawer が残ってしまう。**768px 未満に縮めても左に出たままか**を見る。
 */
export const SidebarAlwaysVisible: Story = {
  args: { children: null },
  render: () => (
    <AppShell
      sidebarCollapsible="none"
      sidebar={<SidebarNav groups={NAV} activeId="articles" />}
      header={<AppHeader breadcrumbs={[{ id: 'articles', label: '記事' }]} />}
      statusBar={<StatusBar left={<StatusBarItem>トグルは出ない</StatusBarItem>} />}
    >
      <ArticleTable />
    </AppShell>
  ),
};

/**
 * レールもサイドバーも無い、いちばん薄い形。
 * スロットを渡さなければ DOM に出ない（余白だけ残ることが無い）。
 */
export const ContentOnly: Story = {
  args: { children: null },
  render: () => (
    <AppShell header={<AppHeader breadcrumbs={[{ id: 'articles', label: '記事' }]} />}>
      <ArticleTable />
    </AppShell>
  ),
};

/** スクロールの担当を確かめる。動くのは本文だけ。 */
export const ScrollingContent: Story = {
  args: { children: null },
  render: () => (
    <AppShell
      iconRail={<IconRail items={RAILS} activeId="articles" />}
      sidebar={<SidebarNav groups={NAV} activeId="articles" />}
      header={<AppHeader breadcrumbs={[{ id: 'articles', label: '記事' }]} />}
      statusBar={<StatusBar left={<StatusBarItem>最下部に貼り付く</StatusBarItem>} />}
    >
      <LongContent />
    </AppShell>
  ),
};

/**
 * AuthShell — 認証前の画面（§4.5 最重要のシェル適用ルール）。
 *
 * **サイドバーが出ないことがこのストーリーの主題。**
 * 「ログイン画面にサイドメニューが出る」は暗黙のレイアウト継承で実際に起きた。
 */
export const Auth: Story = {
  args: { children: null },
  render: () => (
    <AuthShell
      brand={<span className="font-heading text-xl font-medium">すらすらスタジオ</span>}
      footer={
        <>
          <a href="#terms" className="text-fg-link hover:text-fg-link-hover">
            利用規約
          </a>
          {' ・ '}
          <a href="#privacy" className="text-fg-link hover:text-fg-link-hover">
            プライバシー
          </a>
        </>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>ログイン</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" aria-label="ログイン">
            {/* autoComplete が無いと Chrome が DOM 助言をコンソールに出す（実測で確認） */}
            <TextField
              label="メールアドレス"
              type="email"
              placeholder="you@example.com"
              autoComplete="username"
            />
            <TextField label="パスワード" type="password" autoComplete="current-password" />
            <Button type="submit">ログイン</Button>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  ),
};

/**
 * 実測ページ。ブラウザで開いて `getComputedStyle` の値を読む
 * （design-rules 3.5「grep で判定しない」）。
 */
export const ComputedLayoutAudit: Story = {
  args: { children: null },
  render: function Render() {
    const shellRef = React.useRef<HTMLDivElement>(null);
    const [rows, setRows] = React.useState<[string, string][]>([]);

    React.useEffect(() => {
      const root = shellRef.current;
      if (!root) return;

      const read = (selector: string, property: string): [string, string] => {
        const el = root.querySelector(selector);
        if (!el) return [`${selector} → ${property}`, '(要素なし)'];
        return [`${selector} → ${property}`, getComputedStyle(el).getPropertyValue(property)];
      };

      setRows([
        read('[data-slot="sidebar"]', 'width'),
        read('[data-slot="sidebar"]', 'background-color'),
        read('[data-slot="icon-rail"]', 'width'),
        read('[data-slot="app-header"]', 'height'),
        read('[data-slot="status-bar"]', 'height'),
        read('[data-slot="right-pane"]', 'width'),
        read('[data-slot="sidebar-nav-button"]', 'transition-duration'),
        read('[data-slot="app-shell-content"]', 'overflow-y'),
      ]);
    }, []);

    return (
      <div ref={shellRef} className="h-svh">
        <AppShell
          iconRail={<IconRail items={RAILS} activeId="articles" />}
          sidebar={<SidebarNav groups={NAV} activeId="articles" />}
          header={<AppHeader breadcrumbs={[{ id: 'audit', label: '実測' }]} />}
          statusBar={<StatusBar left={<StatusBarItem>実測</StatusBarItem>} />}
          defaultRightPaneOpen
          rightPane={
            <RightPane title="レビュー">
              <p className="text-sm text-fg-muted">実測対象</p>
            </RightPane>
          }
        >
          <div className="p-6">
            <Card noPadding>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>対象</TableHead>
                    <TableHead>解決値</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(([label, value]) => (
                    <TableRow key={label}>
                      <TableCell className="font-mono text-xs">{label}</TableCell>
                      <TableCell className="font-mono text-xs">{value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </AppShell>
      </div>
    );
  },
};
