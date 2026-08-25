import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { AppShell, useAppShell } from './AppShell';
import { AuthShell } from './AuthShell';
import { SidebarNav, type SidebarNavGroup } from './SidebarNav';
import { IconRail, type IconRailItem } from './IconRail';
import { AppTitleBar } from './AppTitleBar';
import { AppHeader } from './AppHeader';
import { StatusBar, StatusBarItem } from './StatusBar';
import { RightPane } from './RightPane';

/**
 * Tier 2 ブロック `app-shell` の契約テスト（仕様書 §4.5）。
 *
 * ## なぜ1ファイルにまとめてあるか
 *
 * 8つの部品は**1つのレジストリアイテム**として配られ、`useAppShell` を通じて
 * 1つの状態を共有する。AppShell の外では投げる設計なので、単体で描ける部品が
 * そもそも無い。契約はシェル1式として意味を持つ。
 *
 * ## ここで守るもの
 *
 * - **スロットの契約**（どのスロットがどのランドマークになるか）
 * - **シェル適用ルール**（AuthShell にサイドバーが出ないこと。§4.5 最重要）
 * - **現在地の伝え方**（ID 照合と `aria-current`。§5-1 ／ ベンチマーク §9）
 * - **開閉の一元管理**（ヘッダーのトグルと右ペインが同じ状態を見ること）
 *
 * 見た目の値（幅・色）は見ない。CSS の解決は描画して `getComputedStyle` で
 * 読むもので、クラス名の文字列比較では逆向きの誤判定が出る（AGENTS.md ／
 * design-rules 3.5）。Storybook の `Blocks/AppShell` が実測側を受け持つ。
 */

const NAV: SidebarNavGroup[] = [
  {
    id: 'work',
    label: '作業',
    items: [
      { id: 'articles', label: '記事', href: '/articles' },
      {
        id: 'reviews',
        label: '確認待ち',
        badge: '3',
        items: [{ id: 'reviews-mine', label: '自分の確認待ち' }],
      },
      { id: 'archive', label: 'アーカイブ', disabled: true },
    ],
  },
  {
    id: 'admin',
    label: '管理',
    items: [{ id: 'clients', label: 'クライアント' }],
  },
];

const RAILS: IconRailItem[] = [
  { id: 'articles', label: '記事', icon: <svg data-testid="rail-articles" /> },
  { id: 'settings', label: '設定', icon: <svg data-testid="rail-settings" /> },
];

afterEach(() => {
  vi.unstubAllGlobals();
});

/** モバイル幅を名乗る matchMedia。jsdom は matchMedia を実装していない */
function stubViewport(isMobile: boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: isMobile && query.includes('max-width'),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
}

describe('AppShell — スロットの契約', () => {
  it('渡したスロットをすべて描き、main はちょうど1つだけ持つ', () => {
    render(
      <AppShell
        titleBar={
          <AppTitleBar
            navigation={<button>戻る</button>}
            commandCenter={<button>全体検索</button>}
            actions={<button>レイアウト</button>}
          />
        }
        iconRail={<IconRail items={RAILS} activeId="articles" />}
        sidebar={<SidebarNav groups={NAV} activeId="articles" />}
        header={<AppHeader breadcrumbs={[{ id: 'root', label: '記事' }]} />}
        statusBar={<StatusBar left={<StatusBarItem>保存済み</StatusBarItem>} />}
        rightPane={<RightPane title="レビュー">本文</RightPane>}
      >
        <p>コンテンツ</p>
      </AppShell>,
    );

    expect(screen.getByRole('navigation', { name: '領域の切り替え' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '全体検索' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'レイアウト' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'メインナビゲーション' })).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo', { name: 'ステータス' })).toBeInTheDocument();
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(within(screen.getByRole('main')).getByText('コンテンツ')).toBeInTheDocument();
  });

  it('Title Bar は Editor 内の banner と分かれた最上段として描く', () => {
    const { container } = render(
      <AppShell
        titleBar={<AppTitleBar commandCenter={<span>ワークスペース</span>} />}
        header={<AppHeader breadcrumbs={[{ id: 'view', label: '現在のビュー' }]} />}
      >
        本文
      </AppShell>,
    );

    const shell = container.querySelector('[data-slot="app-shell"]')!;
    expect(shell.firstElementChild).toHaveAttribute('data-slot', 'app-title-bar');
    expect(screen.getByText('ワークスペース')).toBeInTheDocument();
    expect(screen.getAllByRole('banner')).toHaveLength(1);
  });

  it('スロットを渡さなければ、その領域は DOM に出ない', () => {
    render(<AppShell>本文だけ</AppShell>);

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  it('シェルの寸法を CSS カスタムプロパティで渡す', () => {
    const { container } = render(
      <AppShell sidebarWidth="14rem" rightPaneWidth="20rem" viewHeaderHeight="2.625rem">
        本文
      </AppShell>,
    );
    const shell = container.querySelector('[data-slot="app-shell"]') as HTMLElement;

    expect(shell.style.getPropertyValue('--sidebar-width')).toBe('14rem');
    expect(shell.style.getPropertyValue('--app-shell-right-pane-width')).toBe('20rem');
    expect(shell.style.getPropertyValue('--app-shell-view-header-height')).toBe('2.625rem');
  });
});

describe('AppShell — サイドバーの開閉', () => {
  it('data-state は expanded / collapsed を出し、トグルで入れ替わる', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AppShell sidebar={<SidebarNav groups={NAV} />} header={<AppHeader />}>
        本文
      </AppShell>,
    );

    const shell = container.querySelector('[data-slot="app-shell"]')!;
    const sidebar = container.querySelector('[data-slot="sidebar"]')!;
    expect(shell).toHaveAttribute('data-state', 'expanded');
    expect(sidebar).toHaveAttribute('data-collapsible', '');

    await user.click(screen.getByRole('button', { name: 'サイドバーの表示を切り替える' }));

    expect(shell).toHaveAttribute('data-state', 'collapsed');
    // 畳んだときだけ collapsible が値を持つ（上流 Sidebar と同じ語彙）
    expect(sidebar).toHaveAttribute('data-collapsible', 'offcanvas');
  });

  it('collapsible="none" は畳めず、効かないトグルも出さない', () => {
    const { container } = render(
      <AppShell
        sidebarCollapsible="none"
        defaultSidebarOpen={false}
        sidebar={<SidebarNav groups={NAV} />}
        header={<AppHeader />}
      >
        本文
      </AppShell>,
    );

    expect(container.querySelector('[data-slot="app-shell"]')).toHaveAttribute(
      'data-state',
      'expanded',
    );
    // 押しても何も起きない操作は置かない
    expect(screen.queryByRole('button', { name: 'サイドバーの表示を切り替える' })).toBeNull();
  });

  it('collapsible="none" でも showSidebarToggle を明示すればトグルは出る', () => {
    render(
      <AppShell
        sidebarCollapsible="none"
        sidebar={<SidebarNav groups={NAV} />}
        header={<AppHeader showSidebarToggle />}
      >
        本文
      </AppShell>,
    );
    expect(
      screen.getByRole('button', { name: 'サイドバーの表示を切り替える' }),
    ).toBeInTheDocument();
  });

  it('collapsible="none" はモバイルでも Drawer にしない（開く手段の無い Drawer を作らない）', () => {
    stubViewport(true);
    const { container, baseElement } = render(
      <AppShell
        sidebarCollapsible="none"
        sidebar={<SidebarNav groups={NAV} />}
        header={<AppHeader />}
      >
        本文
      </AppShell>,
    );

    expect(container.querySelector('aside[data-slot="sidebar"]')).not.toBeNull();
    expect(baseElement.querySelector('[data-slot="drawer-popup"]')).toBeNull();
  });

  it('制御できる（内部 state を持たず、渡された値に従う）', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { container } = render(
      <AppShell
        sidebarOpen
        onSidebarOpenChange={onOpenChange}
        sidebar={<SidebarNav groups={NAV} />}
        header={<AppHeader />}
      >
        本文
      </AppShell>,
    );

    await user.click(screen.getByRole('button', { name: 'サイドバーの表示を切り替える' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    // 親が値を変えていないので開いたまま
    expect(container.querySelector('[data-slot="app-shell"]')).toHaveAttribute(
      'data-state',
      'expanded',
    );
  });

  it('Cmd / Ctrl + B で開閉する（上流と同じ既定）', async () => {
    const user = userEvent.setup();
    const { container } = render(<AppShell sidebar={<SidebarNav groups={NAV} />}>本文</AppShell>);

    await user.keyboard('{Meta>}b{/Meta}');
    expect(container.querySelector('[data-slot="app-shell"]')).toHaveAttribute(
      'data-state',
      'collapsed',
    );

    await user.keyboard('{Control>}b{/Control}');
    expect(container.querySelector('[data-slot="app-shell"]')).toHaveAttribute(
      'data-state',
      'expanded',
    );
  });

  it('sidebarShortcutKey={null} でショートカットを切れる（エディタの太字と衝突するため）', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AppShell sidebarShortcutKey={null} sidebar={<SidebarNav groups={NAV} />}>
        本文
      </AppShell>,
    );

    await user.keyboard('{Meta>}b{/Meta}');
    expect(container.querySelector('[data-slot="app-shell"]')).toHaveAttribute(
      'data-state',
      'expanded',
    );
  });
});

describe('AppShell — useAppShell', () => {
  it('AppShell の外で呼ぶと投げる（シェル未適用を静かに通さない）', () => {
    function Orphan(): React.JSX.Element {
      useAppShell();
      return <div />;
    }
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Orphan />)).toThrow('useAppShell は AppShell の中でだけ使えます。');
    spy.mockRestore();
  });
});

describe('AuthShell — シェル適用ルール（§4.5 最重要）', () => {
  it('サイドバー・ヘッダー・ステータスバーをいっさい持たない', () => {
    render(
      <AuthShell brand={<span>Kedama</span>} footer={<a href="/terms">利用規約</a>}>
        <form aria-label="ログイン" />
      </AuthShell>,
    );

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText('Kedama')).toBeInTheDocument();
    expect(screen.getByRole('form', { name: 'ログイン' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '利用規約' })).toBeInTheDocument();
  });

  it('brand / footer を渡さなければその枠は出ない', () => {
    const { container } = render(
      <AuthShell>
        <div>フォーム</div>
      </AuthShell>,
    );
    expect(container.querySelector('[data-slot="auth-shell-brand"]')).toBeNull();
    expect(container.querySelector('[data-slot="auth-shell-footer"]')).toBeNull();
  });
});

describe('SidebarNav', () => {
  it('グループと項目を描き、現在地を aria-current で伝える（色だけに頼らない）', () => {
    render(<AppShell sidebar={<SidebarNav groups={NAV} activeId="articles" />}>本文</AppShell>);

    expect(screen.getByText('作業')).toBeInTheDocument();
    expect(screen.getByText('管理')).toBeInTheDocument();

    const active = screen.getByRole('link', { name: /記事/ });
    expect(active).toHaveAttribute('aria-current', 'page');
    expect(active).toHaveAttribute('data-active', '');

    expect(screen.getByRole('button', { name: /クライアント/ })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('現在地は ID で照合する（ラベル一致では判定しない。§5-1）', () => {
    render(<AppShell sidebar={<SidebarNav groups={NAV} activeId="clients" />}>本文</AppShell>);

    expect(screen.getByRole('link', { name: /記事/ })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('button', { name: /クライアント/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('href があればアンカー、無ければボタンになる', () => {
    render(<AppShell sidebar={<SidebarNav groups={NAV} />}>本文</AppShell>);

    expect(screen.getByRole('link', { name: /記事/ })).toHaveAttribute('href', '/articles');
    expect(screen.getByRole('button', { name: /クライアント/ })).toHaveAttribute('type', 'button');
  });

  it('disabled の項目は押せず、アンカーにもならない', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<AppShell sidebar={<SidebarNav groups={NAV} onSelect={onSelect} />}>本文</AppShell>);

    const archive = screen.getByRole('button', { name: /アーカイブ/ });
    expect(archive).toBeDisabled();
    await user.click(archive);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('選択したら項目そのものを渡す（ラベル文字列ではない）', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<AppShell sidebar={<SidebarNav groups={NAV} onSelect={onSelect} />}>本文</AppShell>);

    await user.click(screen.getByRole('button', { name: /クライアント/ }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'clients' }));
  });

  it('子項目を1階層だけ描く', () => {
    render(<AppShell sidebar={<SidebarNav groups={NAV} />}>本文</AppShell>);
    expect(screen.getByRole('button', { name: /自分の確認待ち/ })).toBeInTheDocument();
  });

  it('畳んでもラベルは title に残る（Tooltip の代わり。ベンチマーク §3.3）', () => {
    render(
      <AppShell
        sidebarCollapsible="icon"
        defaultSidebarOpen={false}
        sidebar={<SidebarNav groups={NAV} />}
      >
        本文
      </AppShell>,
    );
    expect(screen.getByRole('link', { name: /記事/ })).toHaveAttribute('title', '記事');
  });

  it('モバイルでは Drawer になる（§4.5 ／ ベンチ §7.2）', () => {
    stubViewport(true);
    const { container, baseElement } = render(
      <AppShell sidebar={<SidebarNav groups={NAV} />} header={<AppHeader />}>
        本文
      </AppShell>,
    );

    // 据え置きの aside は無い。閉じた Drawer は unmount されている
    expect(container.querySelector('aside[data-slot="sidebar"]')).toBeNull();
    expect(baseElement.querySelector('[data-slot="drawer-popup"]')).toBeNull();
  });

  it('モバイルでトグルすると Drawer が開く', async () => {
    stubViewport(true);
    const user = userEvent.setup();
    const { baseElement } = render(
      <AppShell sidebar={<SidebarNav groups={NAV} />} header={<AppHeader />}>
        本文
      </AppShell>,
    );

    await user.click(screen.getByRole('button', { name: 'サイドバーの表示を切り替える' }));
    // 上流の drawer-popup は残したまま、内側にサイドバーの目印を置く
    expect(baseElement.querySelector('[data-slot="drawer-popup"]')).not.toBeNull();
    expect(baseElement.querySelector('[data-slot="sidebar"][data-mobile="true"]')).not.toBeNull();
    expect(screen.getByRole('link', { name: /記事/ })).toBeInTheDocument();
  });
});

describe('IconRail', () => {
  it('表示はアイコンだけだが、アクセシブルネームと title は失わない', () => {
    const { container } = render(
      <AppShell iconRail={<IconRail items={RAILS} activeId="articles" />}>本文</AppShell>,
    );

    const articles = screen.getByRole('button', { name: '記事' });
    expect(articles).toHaveAttribute('title', '記事');
    expect(articles).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: '設定' })).not.toHaveAttribute('aria-current');
    expect(container.querySelector('[data-slot="icon-rail-label"]')).toBeNull();
  });

  it('アカウントと全体設定を下部項目として分離できる', () => {
    const { container } = render(
      <AppShell
        iconRail={<IconRail items={[RAILS[0]]} footerItems={[RAILS[1]]} activeId="settings" />}
      >
        本文
      </AppShell>,
    );

    const footer = container.querySelector<HTMLElement>('[data-slot="icon-rail-footer-items"]')!;
    expect(within(footer).getByRole('button', { name: '設定' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(container.querySelector('[data-slot="icon-rail-items"] [aria-label="設定"]')).toBeNull();
  });

  it('サイドバーの畳み方に連動しない（役割が違う。VS Code の Activity Bar）', async () => {
    const user = userEvent.setup();
    render(
      <AppShell
        iconRail={<IconRail items={RAILS} />}
        sidebar={<SidebarNav groups={NAV} />}
        header={<AppHeader />}
      >
        本文
      </AppShell>,
    );

    await user.click(screen.getByRole('button', { name: 'サイドバーの表示を切り替える' }));
    expect(screen.getByRole('navigation', { name: '領域の切り替え' })).toBeInTheDocument();
  });
});

describe('AppHeader', () => {
  const TABS = [
    { id: 'all', label: 'すべての記事' },
    { id: 'reviews', label: '確認待ち', closable: true },
  ];

  it('開いている作業面を ID で選び、現在地を aria-current で伝える', async () => {
    const user = userEvent.setup();
    const onTabSelect = vi.fn();

    render(
      <AppShell header={<AppHeader tabs={TABS} activeTabId="all" onTabSelect={onTabSelect} />}>
        本文
      </AppShell>,
    );

    const tabs = screen.getByRole('navigation', { name: '開いているビュー' });
    expect(within(tabs).getByRole('button', { name: 'すべての記事' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(tabs).getByRole('button', { name: '確認待ち' })).not.toHaveAttribute(
      'aria-current',
    );

    await user.click(within(tabs).getByRole('button', { name: '確認待ち' }));
    expect(onTabSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'reviews' }));
  });

  it('閉じる操作は closable なタブへ指定したときだけ出す', async () => {
    const user = userEvent.setup();
    const onTabClose = vi.fn();

    render(<AppShell header={<AppHeader tabs={TABS} onTabClose={onTabClose} />}>本文</AppShell>);

    expect(screen.queryByRole('button', { name: 'すべての記事を閉じる' })).toBeNull();
    expect(screen.queryByRole('button', { name: '新しいビューを開く' })).toBeNull();
    await user.click(screen.getByRole('button', { name: '確認待ちを閉じる' }));
    expect(onTabClose).toHaveBeenCalledWith(expect.objectContaining({ id: 'reviews' }));
  });

  it('タブだけで現在地が足りる場合は空のビューヘッダーを描かない', () => {
    const { container } = render(
      <AppShell
        header={
          <AppHeader
            tabs={TABS}
            activeTabId="all"
            showSidebarToggle={false}
            showRightPaneToggle={false}
          />
        }
      >
        本文
      </AppShell>,
    );

    expect(container.querySelector('[data-slot="app-header-tab-bar"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="app-header-view-bar"]')).toBeNull();
  });

  it('パンくずの末尾だけが現在地になる', () => {
    render(
      <AppShell
        header={
          <AppHeader
            breadcrumbs={[
              { id: 'home', label: 'ホーム', href: '/' },
              { id: 'articles', label: '記事', href: '/articles' },
              { id: 'detail', label: '10月の記事' },
            ]}
          />
        }
      >
        本文
      </AppShell>,
    );

    const crumbs = screen.getByRole('navigation', { name: 'パンくず' });
    expect(within(crumbs).getByRole('link', { name: 'ホーム' })).toBeInTheDocument();
    // 末尾はリンクにしない（現在地なので遷移先が無い）
    expect(within(crumbs).queryByRole('link', { name: '10月の記事' })).toBeNull();
    expect(within(crumbs).getByText('10月の記事')).toHaveAttribute('aria-current', 'page');
  });

  it('トグルはスロットの有無で出し分ける', () => {
    const { rerender } = render(<AppShell header={<AppHeader />}>本文</AppShell>);
    expect(screen.queryByRole('button', { name: 'サイドバーの表示を切り替える' })).toBeNull();
    expect(screen.queryByRole('button', { name: '右ペインの表示を切り替える' })).toBeNull();

    rerender(
      <AppShell
        header={<AppHeader />}
        sidebar={<SidebarNav groups={NAV} />}
        rightPane={<RightPane title="レビュー">本文</RightPane>}
      >
        本文
      </AppShell>,
    );
    expect(
      screen.getByRole('button', { name: 'サイドバーの表示を切り替える' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '右ペインの表示を切り替える' })).toBeInTheDocument();
  });

  it('トグルは aria-expanded で状態を伝える', async () => {
    const user = userEvent.setup();
    render(
      <AppShell header={<AppHeader />} sidebar={<SidebarNav groups={NAV} />}>
        本文
      </AppShell>,
    );

    const toggle = screen.getByRole('button', { name: 'サイドバーの表示を切り替える' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('StatusBar', () => {
  it('左右のスロットを描き、contentinfo ランドマークになる', () => {
    render(
      <AppShell
        statusBar={
          <StatusBar
            left={<StatusBarItem live>保存済み</StatusBarItem>}
            right={<StatusBarItem>128 件</StatusBarItem>}
          />
        }
      >
        本文
      </AppShell>,
    );

    const bar = screen.getByRole('contentinfo', { name: 'ステータス' });
    expect(within(bar).getByText('保存済み')).toHaveAttribute('aria-live', 'polite');
    // 頻繁に変わる値まで読み上げない
    expect(within(bar).getByText('128 件')).not.toHaveAttribute('aria-live');
  });

  it('tone は data 属性に出る（色だけで状態を伝えないための手掛かり）', () => {
    render(
      <AppShell
        statusBar={<StatusBar left={<StatusBarItem tone="danger">接続断</StatusBarItem>} />}
      >
        本文
      </AppShell>,
    );
    expect(screen.getByText('接続断')).toHaveAttribute('data-tone', 'danger');
  });
});

describe('RightPane', () => {
  it('既定では閉じており、data-state で開閉を表す', () => {
    const { container } = render(
      <AppShell header={<AppHeader />} rightPane={<RightPane title="レビュー">中身</RightPane>}>
        本文
      </AppShell>,
    );
    expect(container.querySelector('[data-slot="right-pane"]')).toHaveAttribute(
      'data-state',
      'closed',
    );
  });

  it('ヘッダーのトグルと閉じるボタンが同じ状態を見る', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AppShell header={<AppHeader />} rightPane={<RightPane title="レビュー">中身</RightPane>}>
        本文
      </AppShell>,
    );
    const pane = (): Element => container.querySelector('[data-slot="right-pane"]')!;

    await user.click(screen.getByRole('button', { name: '右ペインの表示を切り替える' }));
    expect(pane()).toHaveAttribute('data-state', 'open');

    await user.click(screen.getByRole('button', { name: '右ペインを閉じる' }));
    expect(pane()).toHaveAttribute('data-state', 'closed');
  });

  it('一覧の列見出しと揃う40pxのヘッダーと、シェルの面色を持つ', () => {
    const { container } = render(
      <AppShell defaultRightPaneOpen rightPane={<RightPane title="レビュー">中身</RightPane>}>
        本文
      </AppShell>,
    );
    const header = container.querySelector('[data-slot="right-pane-header"]');
    expect(header?.className).toContain('h-10');
    expect(header?.className).toContain('bg-sidebar');
  });

  it('デスクトップでは表示開始時に幅と不透明度を補間する', () => {
    const { container } = render(
      <AppShell defaultRightPaneOpen rightPane={<RightPane title="レビュー">中身</RightPane>}>
        本文
      </AppShell>,
    );
    const pane = container.querySelector('[data-slot="right-pane"]');
    expect(pane?.className).toContain('transition-[width,opacity]');
    expect(pane?.className).toContain('duration-normal');
    expect(pane?.className).toContain('ease-enter');
    expect(pane?.className).toContain('starting:w-0');
    expect(pane?.className).toContain('starting:opacity-0');
    expect(pane?.className).toContain('motion-reduce:transition-none');
  });

  it('制御できる', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <AppShell
        header={<AppHeader />}
        rightPaneOpen={false}
        onRightPaneOpenChange={onOpenChange}
        rightPane={<RightPane title="レビュー">中身</RightPane>}
      >
        本文
      </AppShell>,
    );

    await user.click(screen.getByRole('button', { name: '右ペインの表示を切り替える' }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  /**
   * デスクトップの閉じ方は `display:none` であって unmount ではない。
   * JSDoc がそう説明している以上、機械で確かめておく。ここが変わったら
   * （幅 0 への遷移や条件レンダリングに切り替えたら）説明も直すこと。
   */
  it('デスクトップで閉じても中身は unmount されず、内部状態が残る', async () => {
    const user = userEvent.setup();
    let mountCount = 0;

    function Counter(): React.JSX.Element {
      const [n, setN] = React.useState(0);
      React.useEffect(() => {
        mountCount += 1;
      }, []);
      return (
        <button type="button" onClick={() => setN(n + 1)}>
          count:{n}
        </button>
      );
    }

    render(
      <AppShell
        header={<AppHeader />}
        defaultRightPaneOpen
        rightPane={
          <RightPane title="レビュー">
            <Counter />
          </RightPane>
        }
      >
        本文
      </AppShell>,
    );

    await user.click(screen.getByRole('button', { name: /count:0/ }));
    expect(screen.getByRole('button', { name: /count:1/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '右ペインを閉じる' }));
    await user.click(screen.getByRole('button', { name: '右ペインの表示を切り替える' }));

    // 数え直されていない ＝ ツリーが保持されている
    expect(screen.getByRole('button', { name: /count:1/ })).toBeInTheDocument();
    expect(mountCount).toBe(1);
  });

  it('モバイルでは Drawer になる', async () => {
    stubViewport(true);
    const user = userEvent.setup();
    const { container, baseElement } = render(
      <AppShell
        header={<AppHeader />}
        defaultRightPaneOpen
        rightPane={<RightPane title="レビュー">中身</RightPane>}
      >
        本文
      </AppShell>,
    );

    expect(container.querySelector('aside[data-slot="right-pane"]')).toBeNull();
    expect(baseElement.querySelector('[data-slot="drawer-popup"]')).not.toBeNull();
    expect(
      baseElement.querySelector('[data-slot="right-pane"][data-mobile="true"]'),
    ).not.toBeNull();

    await user.click(screen.getByRole('button', { name: '右ペインを閉じる' }));
    expect(baseElement.querySelector('[data-slot="drawer-popup"]')).toBeNull();
  });
});

/**
 * 画面幅で契約が変わらないこと。
 *
 * SidebarNav と RightPane はモバイルで Drawer に化ける。実装が2分岐する以上、
 * **片方にだけ `ref` や残りの props を渡し忘れる**ことが起こりうる（実際に起きた）。
 * 「デスクトップでは動くがモバイルでは静かに消える」は発見が遅れる種類の欠陥なので、
 * 両方の枝を同じ表で突き合わせる。
 */
describe.each([
  {
    name: 'SidebarNav',
    slot: 'sidebar',
    renderShell: (extra: Record<string, unknown>) => (
      <AppShell header={<AppHeader />} sidebar={<SidebarNav groups={NAV} {...extra} />}>
        本文
      </AppShell>
    ),
    // モバイルの Drawer は閉じて始まるので、測る前に開ける
    openOnMobile: true,
  },
  {
    name: 'RightPane',
    slot: 'right-pane',
    renderShell: (extra: Record<string, unknown>) => (
      <AppShell
        header={<AppHeader />}
        defaultRightPaneOpen
        rightPane={
          <RightPane title="レビュー" {...extra}>
            中身
          </RightPane>
        }
      >
        本文
      </AppShell>
    ),
    // defaultRightPaneOpen で開いた状態から始まる
    openOnMobile: false,
  },
])('$name — 画面幅で消えない契約', ({ slot, renderShell, openOnMobile }) => {
  it.each([
    { viewport: 'デスクトップ', mobile: false },
    { viewport: 'モバイル', mobile: true },
  ])('$viewport で id / style / イベント / ref が届く', async ({ mobile }) => {
    stubViewport(mobile);
    const user = userEvent.setup();
    const onClick = vi.fn();
    const ref = React.createRef<HTMLElement>();

    const { baseElement } = render(
      renderShell({
        id: 'pane-under-test',
        style: { outlineWidth: '3px' },
        onClick,
        ref,
        className: 'custom-marker',
      }),
    );

    if (mobile && openOnMobile) {
      await user.click(screen.getByRole('button', { name: 'サイドバーの表示を切り替える' }));
    }

    const el = baseElement.querySelector(`[data-slot="${slot}"]`) as HTMLElement | null;
    expect(el, `${slot} が描かれていない`).not.toBeNull();

    expect(el).toHaveAttribute('id', 'pane-under-test');
    expect(el!.style.outlineWidth).toBe('3px');
    expect(el!.className).toContain('custom-marker');
    // forwardRef の宣言型は HTMLElement。モバイル側は div だが同じ要素を指す
    expect(ref.current).toBe(el);

    await user.click(el!);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('SidebarNav — モバイルで選んだら Drawer を閉じる', () => {
  /** jsdom の未実装ナビゲーション警告を避けるため、クリック用はフラグメントにする */
  const CLICKABLE: SidebarNavGroup[] = [
    {
      id: 'g',
      items: [
        { id: 'as-anchor', label: 'アンカー項目', href: '#anchor' },
        { id: 'as-button', label: 'ボタン項目' },
      ],
    },
  ];

  it.each([
    { kind: 'アンカー', role: 'link' as const, name: /アンカー項目/, id: 'as-anchor' },
    { kind: 'ボタン', role: 'button' as const, name: /ボタン項目/, id: 'as-button' },
  ])('$kind を選ぶと閉じ、onSelect も呼ばれる', async ({ role, name, id }) => {
    stubViewport(true);
    const user = userEvent.setup();
    const onSelect = vi.fn();

    const { baseElement } = render(
      <AppShell
        header={<AppHeader />}
        sidebar={<SidebarNav groups={CLICKABLE} onSelect={onSelect} />}
      >
        本文
      </AppShell>,
    );

    await user.click(screen.getByRole('button', { name: 'サイドバーの表示を切り替える' }));
    expect(baseElement.querySelector('[data-slot="drawer-popup"]')).not.toBeNull();

    await user.click(screen.getByRole(role, { name }));

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id }));
    expect(baseElement.querySelector('[data-slot="drawer-popup"]')).toBeNull();
  });

  it('デスクトップでは選んでも据え置き（閉じる概念が無い）', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { container } = render(
      <AppShell
        header={<AppHeader />}
        sidebar={<SidebarNav groups={CLICKABLE} onSelect={onSelect} />}
      >
        本文
      </AppShell>,
    );

    await user.click(screen.getByRole('button', { name: /ボタン項目/ }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-slot="app-shell"]')).toHaveAttribute(
      'data-state',
      'expanded',
    );
    expect(container.querySelector('aside[data-slot="sidebar"]')).not.toBeNull();
  });
});
