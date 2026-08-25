import * as React from 'react';
import { Button, cn, Drawer, DrawerContent, DrawerTitle, X } from '@kedama-design/design-system';
import { useAppShell } from './AppShell';

/**
 * RightPane — 開閉できる右ペイン（Tier 2 ブロック `app-shell`）
 *
 * 仕様書 §4.5「開閉可能な右ペイン（320〜400px）。モバイルでは Drawer へ変換」。
 * 出典はベンチマーク §7.2 と §3.3（VS Code の Secondary Sidebar）。
 *
 * ## 開閉状態は AppShell が持つ
 *
 * `AppHeader` のトグルと同じ状態を見るため。ここに独立した state を持たせると、
 * ヘッダーのトグルと食い違う経路ができる。制御したいときは AppShell の
 * `rightPaneOpen` / `onRightPaneOpenChange` を使う。
 *
 * ## モバイル
 *
 * `Drawer`（右から）に化ける。ベンチマーク §7.2 は「右ペインは Sheet」と書いているが、
 * Sheet は廃止済みで Drawer が唯一の汎用エッジパネル（仕様書 §2.2）。
 * ベンチマークは**要件の出どころ**であって実装の形を決めるものではない（§4.5）。
 *
 * ## 閉じているとき
 *
 * デスクトップでは `display:none` にする（`hidden` ＋ `data-[state=open]:flex`）。
 * **レイアウトとペイントから外れるだけで、React ツリーは保持される。**
 * 中身は unmount されず、内部状態はそのまま残る。開くときは
 * `@starting-style` から幅と不透明度を補間するが、閉じた後は `display:none` に戻す。
 * 閉じている間も中身のレイアウト計算が走り続ける状態にはしない
 * （中身が重い差分表示・履歴を想定している）。
 *
 * モバイル（Drawer）は閉じると unmount される。Base UI の Presence による
 * 挙動で、デスクトップとは性質が違う。**開閉で中身の state が消えるかどうかが
 * 画面幅で変わる**ので、保ちたい状態は消費側が上位で持つこと。
 */

// `title` は DOM 属性（string）と衝突するので外す。ここでの title は見出しである
export interface RightPaneProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  /**
   * ペインの名前。必須。
   * デスクトップでは見出し、モバイル（Drawer）ではダイアログ名になる。
   */
  title: React.ReactNode;
  /** 見出し行の右に置く操作 */
  actions?: React.ReactNode;
  children: React.ReactNode;
  /** 閉じるボタンを出す。既定 true */
  showClose?: boolean;
}

export const RightPane = React.forwardRef<HTMLElement, RightPaneProps>(function RightPane(
  { title, actions, children, showClose = true, className, ...props },
  ref,
) {
  const { isMobile, rightPaneOpen, setRightPaneOpen } = useAppShell();

  const head = (
    <div
      data-slot="right-pane-header"
      className="flex h-10 shrink-0 items-center gap-2 border-b border-border-muted bg-sidebar px-3"
    >
      <span data-slot="right-pane-title" className="min-w-0 flex-1 truncate text-sm font-medium">
        {title}
      </span>
      {actions}
      {showClose && (
        <Button
          variant="ghost"
          size="icon-sm"
          data-slot="right-pane-close"
          aria-label="右ペインを閉じる"
          onClick={() => setRightPaneOpen(false)}
        >
          <X />
        </Button>
      )}
    </div>
  );

  const body = (
    <div data-slot="right-pane-content" className="min-h-0 flex-1 overflow-auto p-3">
      {children}
    </div>
  );

  /*
   * モバイルは Drawer。背景色はクラスを重ねず `--popover` の差し替えで渡す
   * （SidebarNav と同じ理由。`cn()` は tailwind-merge を含まない）。
   *
   * ⚠️ 幅は Drawer の既定（75% / sm 以上で 24rem）に任せる。
   *    `[--drawer-content-width:…]` は上流の `data-[swipe-axis=x]:` 版に詳細度で負けて
   *    効かない（SidebarNav の注記に実測値あり）。効かないクラスは置かない。
   */
  if (isMobile) {
    return (
      <Drawer open={rightPaneOpen} onOpenChange={setRightPaneOpen} swipeDirection="right">
        <DrawerContent className="[--popover:var(--color-bg-surface)]">
          <DrawerTitle className="sr-only">{title}</DrawerTitle>
          {/*
           * `data-slot` は DrawerContent へ渡さない。上流の
           * `data-slot="drawer-popup"` を黙って上書きするため（SidebarNav と同じ）。
           *
           * **`ref` / 残りの props / className はここへ渡す。** デスクトップの
           * `<aside data-slot="right-pane">` と同じ位置づけの要素であり、
           * 画面幅で `id` や `style`、イベントハンドラ、ref が消えてはならない。
           */}
          <div
            ref={ref as React.Ref<HTMLDivElement>}
            data-slot="right-pane"
            data-mobile="true"
            className={cn('flex min-h-0 flex-1 flex-col', className)}
            {...props}
          >
            {head}
            {body}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <aside
      ref={ref}
      data-slot="right-pane"
      data-state={rightPaneOpen ? 'open' : 'closed'}
      className={cn(
        'hidden w-(--app-shell-right-pane-width) shrink-0 flex-col opacity-100',
        'border-l border-border-muted bg-surface',
        'transition-[width,opacity] duration-normal ease-enter starting:w-0 starting:opacity-0 motion-reduce:transition-none',
        'data-[state=open]:flex',
        className,
      )}
      {...props}
    >
      {head}
      {body}
    </aside>
  );
});
