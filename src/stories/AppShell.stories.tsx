import type { Meta, StoryObj } from '@storybook/react';
import type {
  ColumnDef,
  ColumnFiltersState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import React from 'react';

import {
  AppShell,
  AuthShell,
  AppTitleBar,
  SidebarNav,
  IconRail,
  AppHeader,
  StatusBar,
  StatusBarItem,
  RightPane,
  type SidebarNavGroup,
  type IconRailItem,
  type AppHeaderTab,
  useAppShell,
} from '../blocks/app-shell';
import { DataTable, DataTableColumnHeader } from '../blocks/data-table';
import {
  CommandPalette,
  type CommandPaletteCommand,
  type CommandPaletteGroup,
} from '../blocks/command-palette';

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
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  FileText,
  Folder,
  Pencil,
  Search,
  Settings,
  User,
  Users,
} from '../index';
import { PanelLeft, PanelRight } from 'lucide-react';

/**
 * Tier 2 ブロック `app-shell`（仕様書 §4.5）
 *
 * **npm では配らない。** レジストリ配布であり、`src/index.ts` からは公開していない
 * （`tests/tier2Boundary.test.ts`）。このストーリーが `../blocks/app-shell` を
 * 直接 import しているのはそのため。消費側は `shadcn add <公開URL>/r/app-shell.json` で
 * ファイルごと受け取る。
 *
 * ## ここで実測すること（design-rules 3.5）
 *
 * クラス名を読んでも CSS が解決したかは分からない。ブラウザで開いて次を見る。
 *
 * 1. サイドバーが 240px、右ペインが 360px、レールが 48px で出ているか
 * 2. トグルで幅が **遷移して** 畳まれるか（飛んでいないか）
 * 3. 768px 未満に縮めたとき、レールが消え・サイドバーが Drawer になるか
 * 4. Title Bar、作業タブ、ビューヘッダーが別の階層に見えるか
 * 5. StatusBar が最下部に貼り付き、中身だけがスクロールするか
 * 6. コンソールに警告が出ていないか
 */
const meta = {
  title: 'Blocks/AppShell',
  component: AppShell,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'アプリケーションの外枠一式。VS Code の Title Bar / Activity Bar / Primary Sidebar / ' +
          'editor tabs / Status Bar の階層を、Kedama の Calm UI へ翻訳した。' +
          '設計判断は docs/app-shell-design-review.md を参照。',
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
    label: 'サイト',
    items: [
      { id: 'site-settings', label: 'サイト設定', icon: <Settings />, href: '#site-settings' },
      { id: 'archive', label: 'アーカイブ', icon: <Folder />, disabled: true },
    ],
  },
];

const RAILS: IconRailItem[] = [
  { id: 'articles', label: '記事', icon: <FileText /> },
  { id: 'clients', label: 'クライアント', icon: <Users /> },
];

const RAIL_FOOTER: IconRailItem[] = [
  { id: 'account', label: 'アカウント', icon: <User /> },
  { id: 'global-settings', label: '全体設定', icon: <Settings /> },
];

const INITIAL_TABS: AppHeaderTab[] = [
  { id: 'all', label: 'すべての記事', icon: <FileText /> },
  { id: 'reviews', label: '自分の確認待ち', icon: <Check />, closable: true },
  { id: 'draft', label: '棚卸し設計', icon: <FileText />, closable: true },
];

interface ArticleViewState {
  columnFilters: ColumnFiltersState;
  sorting: SortingState;
}

const INITIAL_ARTICLE_VIEW_STATES: Record<string, ArticleViewState> = {
  all: { columnFilters: [], sorting: [] },
  reviews: {
    columnFilters: [{ id: 'status', value: '公開前確認' }],
    sorting: [{ id: 'priority', desc: true }],
  },
  'in-progress': {
    columnFilters: [{ id: 'status', value: '編集中' }],
    sorting: [],
  },
};

const SITES = [
  { id: 'keiri', label: '経理アウトソース.com' },
  { id: 'shokei', label: 'みずほ事業承継' },
] as const;

type SiteId = (typeof SITES)[number]['id'];

interface ArticleRow {
  id: string;
  siteId: SiteId;
  type: string;
  category: string;
  title: string;
  status: string;
  targetKw: string;
  relatedKw: string;
  cluster: string;
  priority: string;
  ctaPurpose: string;
  phase: string;
  pillarParent: string;
  liveUrl: string;
  articleUrl: string;
  publishDate: string;
  targetReader: string;
  summary: string;
  note: string;
}

const ARTICLE_COLUMN_SETTINGS = [
  { id: 'id', label: 'ID' },
  { id: 'type', label: '区分' },
  { id: 'category', label: 'カテゴリ' },
  { id: 'title', label: 'タイトル' },
  { id: 'status', label: 'ステータス' },
  { id: 'targetKw', label: '想定KW' },
  { id: 'relatedKw', label: '関連KW' },
  { id: 'cluster', label: '連携クラスター' },
  { id: 'priority', label: '優先度' },
  { id: 'ctaPurpose', label: 'CTA該当目的' },
  { id: 'phase', label: '公開フェーズ' },
  { id: 'pillarParent', label: '親（ピラー）' },
  { id: 'liveUrl', label: 'ライブURL' },
  { id: 'articleUrl', label: '記事URL' },
  { id: 'publishDate', label: '公開日' },
  { id: 'targetReader', label: 'ターゲット読者' },
  { id: 'summary', label: '記事概要' },
  { id: 'note', label: '備考' },
] as const;

const DEFAULT_ARTICLE_COLUMN_VISIBILITY: VisibilityState = {
  relatedKw: false,
  cluster: false,
  ctaPurpose: false,
  pillarParent: false,
  liveUrl: false,
  targetReader: false,
  summary: false,
  note: false,
};

function article(
  input: Partial<ArticleRow> & Pick<ArticleRow, 'id' | 'siteId' | 'title'>,
): ArticleRow {
  return {
    type: '既存コラム',
    category: 'コラム',
    status: '公開前確認',
    targetKw: '',
    relatedKw: '',
    cluster: '',
    priority: '通常',
    ctaPurpose: '無料相談',
    phase: 'フェーズ2',
    pillarParent: '',
    liveUrl: '',
    articleUrl: '',
    publishDate: '',
    targetReader: '',
    summary: '',
    note: '',
    ...input,
  };
}

/** 指定された記事管理表と同じ18項目を持つ、表示確認用の最小データ */
const ROWS = [
  article({
    id: 'COL-01',
    siteId: 'keiri',
    title: '請求書・書類のファイリング術',
    status: '公開済',
    targetKw: '請求書 ファイリング',
    relatedKw: '領収書 保管',
    cluster: '経理効率化',
    liveUrl: 'https://keiri-outsource.com/column/filing-how-to-202605/',
    articleUrl: 'https://docs.example.com/COL-01',
    publishDate: '2026-05-08',
    targetReader: '書類整理に悩む経理担当者',
    summary: '請求書・領収書の分類方法と保管ルールを解説する。',
    note: 'COL-05と役割を分離',
  }),
  article({
    id: 'COL-02',
    siteId: 'keiri',
    title: '経理担当者の生産性を上げる改善策',
    targetKw: '経理 生産性',
    relatedKw: '経理 効率化',
    cluster: '経理効率化',
    priority: '高',
    articleUrl: 'https://docs.example.com/COL-02',
    targetReader: '業務改善を任された経理責任者',
    summary: '経理業務が滞る原因と、改善の着手順を整理する。',
  }),
  article({
    id: 'PIL-01',
    siteId: 'keiri',
    type: '新規記事',
    title: '経理アウトソーシングの選び方',
    category: 'ピラー',
    status: '編集中',
    targetKw: '経理 アウトソーシング',
    relatedKw: '記帳代行 比較',
    priority: '最優先',
    ctaPurpose: '無料診断',
    phase: 'フェーズ3',
    articleUrl: 'https://docs.example.com/PIL-01',
    targetReader: '経理体制を見直す経営者',
    summary: '委託範囲・品質・費用の比較軸を提示するピラー記事。',
  }),
  article({
    id: '承継-PIL-01',
    siteId: 'shokei',
    type: '新規記事',
    title: '中小企業の事業承継を進める手順',
    category: 'ピラー',
    status: '確認待ち',
    targetKw: '事業承継 手順',
    relatedKw: '後継者 育成',
    priority: '最優先',
    ctaPurpose: '個別相談',
    articleUrl: 'https://docs.example.com/succession-pillar-01',
    targetReader: '後継者選びに悩む中小企業経営者',
  }),
  article({
    id: '承継-COL-01',
    siteId: 'shokei',
    title: 'M&A前に整理しておく財務資料',
    status: '構成案',
    targetKw: 'M&A 財務資料',
    relatedKw: '企業価値 算定',
    cluster: 'M&A準備',
    priority: '高',
    ctaPurpose: '個別相談',
    articleUrl: 'https://docs.example.com/succession-col-01',
    targetReader: '第三者承継を検討する経営者',
  }),
];

interface ArticleTableProps {
  rows?: ArticleRow[];
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  onSelectedRowsChange?: (rows: ArticleRow[]) => void;
  onVisibleCountChange?: (count: number) => void;
  onEdit?: (row: ArticleRow) => void;
  onShare?: (row: ArticleRow) => void;
}

function ArticleTable({
  rows = ROWS.filter((row) => row.siteId === 'keiri'),
  columnFilters,
  onColumnFiltersChange,
  sorting,
  onSortingChange,
  columnVisibility,
  onColumnVisibilityChange,
  rowSelection,
  onRowSelectionChange,
  onSelectedRowsChange,
  onVisibleCountChange,
  onEdit,
  onShare,
}: ArticleTableProps = {}): React.JSX.Element {
  const showActions = onEdit != null || onShare != null;
  const optionsFor = React.useCallback(
    (key: keyof ArticleRow) =>
      [...new Set(rows.map((row) => String(row[key])).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'ja'))
        .map((value) => ({ label: value, value })),
    [rows],
  );

  const columns = React.useMemo<ColumnDef<ArticleRow>[]>(() => {
    const textColumn = (key: keyof ArticleRow, label: string): ColumnDef<ArticleRow> => ({
      id: key,
      accessorKey: key,
      filterFn: 'includesString',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          label={label}
          filter={{ type: 'text', placeholder: `${label}を検索` }}
        />
      ),
    });
    const selectColumn = (key: keyof ArticleRow, label: string): ColumnDef<ArticleRow> => ({
      id: key,
      accessorKey: key,
      filterFn: 'equalsString',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          label={label}
          filter={{ type: 'select', options: optionsFor(key) }}
        />
      ),
    });

    return [
      {
        ...textColumn('id', 'ID'),
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.id}</span>,
      },
      selectColumn('type', '区分'),
      {
        ...selectColumn('category', 'カテゴリ'),
        cell: ({ row }) => <Badge>{row.original.category}</Badge>,
      },
      {
        ...textColumn('title', 'タイトル'),
        cell: ({ row }) =>
          onEdit != null ? (
            <button
              type="button"
              className="max-w-96 truncate text-left font-medium text-fg-default outline-hidden hover:text-fg-link focus-visible:ring-2 focus-visible:ring-border-focus"
              onClick={() => onEdit(row.original)}
            >
              {row.original.title}
            </button>
          ) : (
            <span className="max-w-96 whitespace-normal font-medium">{row.original.title}</span>
          ),
      },
      selectColumn('status', 'ステータス'),
      textColumn('targetKw', '想定KW'),
      textColumn('relatedKw', '関連KW'),
      selectColumn('cluster', '連携クラスター'),
      selectColumn('priority', '優先度'),
      selectColumn('ctaPurpose', 'CTA該当目的'),
      selectColumn('phase', '公開フェーズ'),
      selectColumn('pillarParent', '親（ピラー）'),
      {
        ...textColumn('liveUrl', 'ライブURL'),
        cell: ({ row }) =>
          row.original.liveUrl ? (
            <a
              href={row.original.liveUrl}
              target="_blank"
              rel="noreferrer"
              className="text-fg-link hover:text-fg-link-hover"
            >
              ライブ
            </a>
          ) : (
            <span className="text-fg-decorative">—</span>
          ),
      },
      {
        ...textColumn('articleUrl', '記事URL'),
        cell: ({ row }) =>
          row.original.articleUrl ? (
            <a
              href={row.original.articleUrl}
              target="_blank"
              rel="noreferrer"
              className="text-fg-link hover:text-fg-link-hover"
            >
              原稿
            </a>
          ) : (
            <span className="text-fg-decorative">—</span>
          ),
      },
      selectColumn('publishDate', '公開日'),
      textColumn('targetReader', 'ターゲット読者'),
      textColumn('summary', '記事概要'),
      textColumn('note', '備考'),
      ...(showActions
        ? [
            {
              id: 'actions',
              enableHiding: false,
              enableSorting: false,
              header: () => <span className="sr-only">操作</span>,
              cell: ({ row }) => (
                <div className="flex items-center justify-end gap-0.5">
                  {onEdit != null && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`${row.original.title}を編集`}
                      title="編集"
                      onClick={() => onEdit(row.original)}
                    >
                      <Pencil />
                    </Button>
                  )}
                  {onShare != null && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`${row.original.title}を共有`}
                      title="共有リンクをコピー"
                      onClick={() => onShare(row.original)}
                    >
                      <Copy />
                    </Button>
                  )}
                </div>
              ),
            } satisfies ColumnDef<ArticleRow>,
          ]
        : []),
    ];
  }, [onEdit, onShare, optionsFor, showActions]);

  return (
    <DataTable
      columns={columns}
      data={rows}
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
      sorting={sorting}
      onSortingChange={onSortingChange}
      columnVisibility={columnVisibility}
      defaultColumnVisibility={DEFAULT_ARTICLE_COLUMN_VISIBILITY}
      onColumnVisibilityChange={onColumnVisibilityChange}
      selectable
      rowSelection={rowSelection}
      onRowSelectionChange={onRowSelectionChange}
      onSelectedRowsChange={onSelectedRowsChange}
      onFilteredRowCountChange={onVisibleCountChange}
      getRowId={(row) => row.id}
    />
  );
}

interface ArticleColumnSettingsProps {
  siteName: string;
  visibility: VisibilityState;
  onChange: (visibility: VisibilityState) => void;
}

function ArticleColumnSettings({
  siteName,
  visibility,
  onChange,
}: ArticleColumnSettingsProps): React.JSX.Element {
  const isVisible = (id: string): boolean => visibility[id] !== false;

  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="mb-6">
        <h1 className="font-heading text-xl font-medium text-fg-default">記事一覧の表示項目</h1>
        <p className="mt-1 text-sm text-fg-muted">{siteName} の一覧に表示する列を選びます。</p>
      </div>

      <div className="border-y border-border-muted">
        {ARTICLE_COLUMN_SETTINGS.map((column) => (
          <label
            key={column.id}
            className="flex min-h-10 items-center gap-3 border-b border-border-muted px-2 text-sm last:border-b-0 hover:bg-hover"
          >
            <input
              type="checkbox"
              checked={isVisible(column.id)}
              onChange={(event) => onChange({ ...visibility, [column.id]: event.target.checked })}
              className="size-4 accent-accent-primary"
            />
            <span>{column.label}</span>
          </label>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="secondary" size="sm" onClick={() => onChange({})}>
          すべて表示
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(DEFAULT_ARTICLE_COLUMN_VISIBILITY)}
        >
          既定に戻す
        </Button>
      </div>
    </section>
  );
}

function GlobalSettings(): React.JSX.Element {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="font-heading text-xl font-medium text-fg-default">全体設定</h1>
      <dl className="mt-6 border-y border-border-muted text-sm">
        <div className="flex min-h-11 items-center justify-between border-b border-border-muted px-2">
          <dt>表示テーマ</dt>
          <dd className="text-fg-muted">システム設定</dd>
        </div>
        <div className="flex min-h-11 items-center justify-between border-b border-border-muted px-2">
          <dt>通知</dt>
          <dd className="text-fg-muted">アプリ内・メール</dd>
        </div>
        <div className="flex min-h-11 items-center justify-between px-2">
          <dt>言語</dt>
          <dd className="text-fg-muted">日本語</dd>
        </div>
      </dl>
    </section>
  );
}

function AccountSettings(): React.JSX.Element {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="font-heading text-xl font-medium text-fg-default">アカウント</h1>
      <dl className="mt-6 border-y border-border-muted text-sm">
        <div className="flex min-h-11 items-center justify-between border-b border-border-muted px-2">
          <dt>表示名</dt>
          <dd className="text-fg-muted">担当者</dd>
        </div>
        <div className="flex min-h-11 items-center justify-between px-2">
          <dt>権限</dt>
          <dd className="text-fg-muted">編集者</dd>
        </div>
      </dl>
    </section>
  );
}

function ClientList(): React.JSX.Element {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="font-heading text-xl font-medium text-fg-default">クライアント</h1>
      <ul className="mt-6 border-y border-border-muted text-sm">
        <li className="flex min-h-11 items-center justify-between px-2">
          <span>税理士法人みずほ</span>
          <span className="text-fg-muted">2サイト</span>
        </li>
      </ul>
    </section>
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

function CommandCenter({ onOpen }: { onOpen: () => void }): React.JSX.Element {
  return (
    <button
      type="button"
      className={[
        'flex h-7 w-full min-w-0 items-center justify-center gap-2 rounded-md border border-border-muted',
        'bg-surface px-3 text-xs text-fg-muted outline-hidden',
        'transition-colors duration-fast ease-default hover:bg-hover hover:text-fg-default',
        'focus-visible:ring-2 focus-visible:ring-border-focus',
      ].join(' ')}
      aria-label="検索を開く"
      aria-haspopup="dialog"
      onClick={onOpen}
    >
      <Search className="size-3.5 shrink-0" />
      <span className="truncate">すらすらスタジオ</span>
      <kbd className="hidden shrink-0 text-2xs text-fg-decorative sm:inline">⌘K</kbd>
    </button>
  );
}

function TitleBarNavigation(): React.JSX.Element {
  return (
    <>
      <Button variant="ghost" size="icon-xs" aria-label="戻る" title="戻る" disabled>
        <ArrowLeft />
      </Button>
      <Button variant="ghost" size="icon-xs" aria-label="進む" title="進む" disabled>
        <ArrowRight />
      </Button>
    </>
  );
}

function TitleBarActions(): React.JSX.Element {
  const { hasSidebar, sidebarState, toggleSidebar, hasRightPane, rightPaneOpen, toggleRightPane } =
    useAppShell();

  return (
    <>
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="サイドバーの表示を切り替える"
          aria-expanded={sidebarState === 'expanded'}
          title="サイドバー"
          disabled={!hasSidebar}
          onClick={toggleSidebar}
        >
          <PanelLeft />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="右ペインの表示を切り替える"
          aria-expanded={rightPaneOpen}
          title="右ペイン"
          disabled={!hasRightPane}
          onClick={toggleRightPane}
        >
          <PanelRight />
        </Button>
      </div>
    </>
  );
}

// ─── ストーリー ─────────────────────────────────────────

type StoryTheme = 'light' | 'dark' | 'deep-dark';

function ThemeScope({ theme, children }: { theme: StoryTheme; children: React.ReactNode }) {
  React.useLayoutEffect(() => {
    const root = document.documentElement;
    const previous = root.dataset.theme;
    root.dataset.theme = theme;
    return () => {
      if (previous === undefined) delete root.dataset.theme;
      else root.dataset.theme = previous;
    };
  }, [theme]);

  return children;
}

function Workbench({ theme = 'light' }: { theme?: StoryTheme }): React.JSX.Element {
  const [active, setActive] = React.useState('articles');
  const [rail, setRail] = React.useState('articles');
  const [siteId, setSiteId] = React.useState<SiteId>('keiri');
  const [tabs, setTabs] = React.useState(INITIAL_TABS);
  const [activeTabId, setActiveTabId] = React.useState('all');
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [articleRowSelection, setArticleRowSelection] = React.useState<RowSelectionState>({});
  const [selectedArticles, setSelectedArticles] = React.useState<ArticleRow[]>([]);
  const [articleViewStateById, setArticleViewStateById] = React.useState(
    INITIAL_ARTICLE_VIEW_STATES,
  );
  const [columnVisibilityBySite, setColumnVisibilityBySite] = React.useState<
    Record<SiteId, VisibilityState>
  >({
    keiri: DEFAULT_ARTICLE_COLUMN_VISIBILITY,
    shokei: DEFAULT_ARTICLE_COLUMN_VISIBILITY,
  });
  const siteRows = React.useMemo(() => ROWS.filter((row) => row.siteId === siteId), [siteId]);
  const siteName = SITES.find((site) => site.id === siteId)?.label ?? siteId;
  const columnVisibility = columnVisibilityBySite[siteId];
  const articleViewId = activeTabId in articleViewStateById ? activeTabId : 'all';
  const articleViewState = articleViewStateById[articleViewId] ??
    INITIAL_ARTICLE_VIEW_STATES.all ?? { columnFilters: [], sorting: [] };
  const [visibleCount, setVisibleCount] = React.useState(siteRows.length);
  const [activityMessage, setActivityMessage] = React.useState('保存済み');

  const openTab = (tab: AppHeaderTab): void => {
    setTabs((current) =>
      current.some((item) => item.id === tab.id) ? current : [...current, tab],
    );
    setActiveTabId(tab.id);
  };

  const closeTab = (tab: AppHeaderTab): void => {
    setTabs((current) => {
      const next = current.filter((item) => item.id !== tab.id);
      if (tab.id === activeTabId) setActiveTabId(next[0]?.id ?? '');
      return next;
    });
  };

  const editArticle = (row: ArticleRow): void => {
    const id = `article-${row.id}`;
    openTab({ id, label: row.title, icon: <FileText />, closable: true });
    setActivityMessage(`${row.title}を編集`);
  };

  const shareArticle = (row: ArticleRow): void => {
    const url = row.liveUrl || row.articleUrl;
    if (navigator.clipboard != null) {
      void navigator.clipboard.writeText(url).catch(() => undefined);
    }
    setActivityMessage(url ? '共有リンクをコピーしました' : '共有できるURLがありません');
  };

  const selectRail = (item: IconRailItem): void => {
    setRail(item.id);
    if (item.id === 'articles') {
      setActive('articles');
      openTab({ id: 'all', label: 'すべての記事', icon: <FileText /> });
    } else {
      setActive(item.id);
      openTab({ id: item.id, label: item.label, icon: item.icon, closable: true });
    }
  };

  const selectSidebar = (item: SidebarNavGroup['items'][number]): void => {
    setRail('articles');
    setActive(item.id);
    openTab({
      id: item.id === 'articles' ? 'all' : item.id,
      label: item.label,
      icon: item.icon,
      closable: item.id !== 'articles',
    });
  };

  const selectTab = (tab: AppHeaderTab): void => {
    setActiveTabId(tab.id);
    if (tab.id === 'all') {
      setRail('articles');
      setActive('articles');
    } else if (['clients', 'account', 'global-settings'].includes(tab.id)) {
      setRail(tab.id);
      setActive(tab.id);
    } else if (!tab.id.startsWith('article-') && tab.id !== 'draft') {
      setRail('articles');
      setActive(tab.id);
    }
  };

  const changeSite = (nextSiteId: SiteId): void => {
    setSiteId(nextSiteId);
    setRail('articles');
    setActive('articles');
    setActiveTabId('all');
    setArticleRowSelection({});
    setSelectedArticles([]);
  };

  const changeColumnVisibility = (visibility: VisibilityState): void => {
    setColumnVisibilityBySite((current) => ({ ...current, [siteId]: visibility }));
  };

  const changeArticleViewState = (next: Partial<ArticleViewState>): void => {
    setArticleViewStateById((current) => ({
      ...current,
      [articleViewId]: { ...articleViewState, ...next },
    }));
  };

  const commandGroups: CommandPaletteGroup[] = [
    {
      id: 'navigation',
      label: '移動',
      commands: [
        { id: 'articles', label: 'すべての記事', keywords: ['記事一覧'], icon: <FileText /> },
        { id: 'reviews', label: '自分の確認待ち', keywords: ['レビュー'], icon: <Check /> },
        { id: 'clients', label: 'クライアント', keywords: ['顧客'], icon: <Users /> },
        { id: 'site-settings', label: 'サイト設定', icon: <Settings /> },
      ],
    },
    {
      id: 'actions',
      label: '現在の一覧',
      commands: [
        {
          id: 'mark-review',
          label:
            selectedArticles.length > 0
              ? `${selectedArticles.length}件を確認待ちにする`
              : '選択した記事を確認待ちにする',
          keywords: ['一括操作', 'ステータス'],
          icon: <Check />,
          disabled: selectedArticles.length === 0,
        },
      ],
    },
  ];

  const selectCommand = (command: CommandPaletteCommand): void => {
    switch (command.id) {
      case 'articles':
        selectSidebar(NAV[0].items[0]);
        break;
      case 'reviews':
        selectSidebar(NAV[0].items[1]);
        break;
      case 'clients':
        selectRail(RAILS[1]);
        break;
      case 'site-settings':
        selectSidebar(NAV[1].items[0]);
        break;
      case 'mark-review':
        setActivityMessage(`${selectedArticles.length}件を確認待ちにしました`);
        setArticleRowSelection({});
        break;
    }
  };

  let mainContent: React.ReactNode;
  if (rail === 'account') {
    mainContent = <AccountSettings />;
  } else if (rail === 'global-settings') {
    mainContent = <GlobalSettings />;
  } else if (rail === 'clients') {
    mainContent = <ClientList />;
  } else if (active === 'site-settings') {
    mainContent = (
      <ArticleColumnSettings
        siteName={siteName}
        visibility={columnVisibility}
        onChange={changeColumnVisibility}
      />
    );
  } else {
    mainContent = (
      <ArticleTable
        rows={siteRows}
        columnFilters={articleViewState.columnFilters}
        onColumnFiltersChange={(columnFilters) => changeArticleViewState({ columnFilters })}
        sorting={articleViewState.sorting}
        onSortingChange={(sorting) => changeArticleViewState({ sorting })}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={changeColumnVisibility}
        rowSelection={articleRowSelection}
        onRowSelectionChange={setArticleRowSelection}
        onSelectedRowsChange={setSelectedArticles}
        onVisibleCountChange={setVisibleCount}
        onEdit={editArticle}
        onShare={shareArticle}
      />
    );
  }

  return (
    <ThemeScope theme={theme}>
      <>
        <AppShell
          titleBar={
            <AppTitleBar
              navigation={<TitleBarNavigation />}
              commandCenter={<CommandCenter onOpen={() => setCommandOpen(true)} />}
              actions={<TitleBarActions />}
            />
          }
          iconRail={
            <IconRail
              items={RAILS}
              footerItems={RAIL_FOOTER}
              activeId={rail}
              onSelect={selectRail}
            />
          }
          sidebar={
            <SidebarNav
              groups={NAV}
              activeId={active}
              onSelect={selectSidebar}
              header={
                <select
                  aria-label="サイトを切り替える"
                  value={siteId}
                  onChange={(event) => changeSite(event.currentTarget.value as SiteId)}
                  className="h-7 w-full min-w-0 rounded-sm bg-sidebar px-1 text-xs font-medium text-fg-default outline-hidden focus-visible:ring-2 focus-visible:ring-border-focus"
                >
                  {SITES.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.label}
                    </option>
                  ))}
                </select>
              }
            />
          }
          header={
            <AppHeader
              tabs={tabs}
              activeTabId={activeTabId}
              onTabSelect={selectTab}
              onTabClose={closeTab}
              showSidebarToggle={false}
              showRightPaneToggle={false}
            />
          }
          statusBar={
            <StatusBar
              left={
                <>
                  <StatusBarItem tone="success" icon={<Check />} live>
                    {activityMessage}
                  </StatusBarItem>
                  <StatusBarItem>WordPress 接続済み</StatusBarItem>
                  {selectedArticles.length > 0 && (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => {
                        setActivityMessage(`${selectedArticles.length}件を確認待ちにしました`);
                        setArticleRowSelection({});
                      }}
                    >
                      確認待ちにする
                    </Button>
                  )}
                </>
              }
              right={
                rail === 'articles' && active !== 'site-settings' ? (
                  <StatusBarItem>
                    {selectedArticles.length > 0
                      ? `${selectedArticles.length}件選択`
                      : `${visibleCount} / ${siteRows.length} 件`}
                  </StatusBarItem>
                ) : undefined
              }
            />
          }
          rightPane={
            <RightPane title="レビュー">
              <div className="flex flex-col gap-3 text-sm">
                <p className="text-fg-muted">
                  この領域は開閉できる。モバイルでは Drawer に化ける。
                </p>
                <Button variant="secondary" size="sm">
                  修正を依頼する
                </Button>
              </div>
            </RightPane>
          }
        >
          {mainContent}
        </AppShell>

        <CommandPalette
          groups={commandGroups}
          onCommandSelect={selectCommand}
          open={commandOpen}
          onOpenChange={setCommandOpen}
          title="コマンドセンター"
          placeholder="記事、クライアント、操作を検索"
        />
      </>
    </ThemeScope>
  );
}

/** すべてのスロットを埋めた既定形。ベンチマーク §7.2 の構成そのもの。 */
export const Default: Story = {
  args: { children: null },
  render: () => <Workbench />,
};

/** 暗色テーマでもクロームが主コンテンツより強くならないことを見る。 */
export const DarkWorkbench: Story = {
  args: { children: null },
  render: () => <Workbench theme="dark" />,
};

/** 最暗テーマで境界と選択状態が潰れないことを見る。 */
export const DeepDarkWorkbench: Story = {
  args: { children: null },
  render: () => <Workbench theme="deep-dark" />,
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
        read('[data-slot="app-title-bar"]', 'height'),
        read('[data-slot="icon-rail"]', 'width'),
        read('[data-slot="app-header"]', 'height'),
        read('[data-slot="app-header-tab-bar"]', 'height'),
        read('[data-slot="app-header-view-bar"]', 'height'),
        read('[data-slot="status-bar"]', 'height'),
        read('[data-slot="right-pane"]', 'width'),
        read('[data-slot="sidebar-nav-button"]', 'transition-duration'),
        read('[data-slot="app-shell-content"]', 'overflow-y'),
      ]);
    }, []);

    return (
      <div ref={shellRef} className="h-svh">
        <AppShell
          titleBar={
            <AppTitleBar
              commandCenter={<span className="truncate text-xs text-fg-muted">実測</span>}
            />
          }
          iconRail={<IconRail items={RAILS} activeId="articles" />}
          sidebar={<SidebarNav groups={NAV} activeId="articles" />}
          header={
            <AppHeader
              tabs={INITIAL_TABS}
              activeTabId="all"
              breadcrumbs={[{ id: 'audit', label: '実測' }]}
            />
          }
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
