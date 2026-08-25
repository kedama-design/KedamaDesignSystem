import * as React from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Modal, Search, cn } from '@kedama-design/design-system';

export interface CommandPaletteCommand {
  /** 保存や分岐に使う安定した識別子 */
  id: string;
  label: string;
  /** 表示しない検索語。表記揺れや旧名称を含められる */
  keywords?: readonly string[];
  icon?: React.ReactNode;
  /** 表示専用。ショートカットの登録は消費側が行う */
  shortcut?: React.ReactNode;
  disabled?: boolean;
}

export interface CommandPaletteGroup {
  id: string;
  label: React.ReactNode;
  commands: readonly CommandPaletteCommand[];
}

export interface CommandPaletteProps {
  groups: readonly CommandPaletteGroup[];
  onCommandSelect: (command: CommandPaletteCommand) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 既定 `k`。Cmd/Ctrlとの組み合わせで開く。nullなら登録しない */
  shortcutKey?: string | null;
  title?: string;
  placeholder?: string;
  emptyLabel?: string;
  className?: string;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.matches('input, textarea, select') ||
    target.isContentEditable ||
    target.closest('[contenteditable="true"]') != null
  );
}

/**
 * CommandPalette — 移動と主要操作を横断検索する補助入口。
 *
 * shadcn/ui 4.16.1 の Command 構造と `cmdk` のキーボード・検索挙動を採用し、
 * 外枠は Kedama のネイティブ `Modal` に載せる。同役割の Dialog / Input を
 * レジストリへ重複して持ち込まないためである。
 *
 * Cmd/Ctrl+K は外部の入力欄や contenteditable では横取りしない。記事編集の
 * リンク挿入など、プロダクト側の編集ショートカットを守るため。
 */
export function CommandPalette({
  groups,
  onCommandSelect,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  shortcutKey = 'k',
  title = 'コマンドパレット',
  placeholder = 'コマンドまたは移動先を検索',
  emptyLabel = '一致するコマンドがありません',
  className,
}: CommandPaletteProps): React.JSX.Element {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const [search, setSearch] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (controlledOpen === undefined) setUncontrolledOpen(nextOpen);
      onOpenChange?.(nextOpen);
    },
    [controlledOpen, onOpenChange],
  );

  React.useEffect(() => {
    if (!open) return;
    setSearch('');

    // closed な dialog 内では autoFocus が成立しない。showModal() の後の
    // フレームで検索欄へ移し、開いてすぐ入力できる状態を保証する。
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  React.useEffect(() => {
    if (shortcutKey == null || shortcutKey.length === 0) return;
    const normalizedKey = shortcutKey.toLowerCase();

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (
        !(event.metaKey || event.ctrlKey) ||
        event.altKey ||
        event.shiftKey ||
        event.key.toLowerCase() !== normalizedKey
      ) {
        return;
      }

      const target = event.target;
      const insidePalette =
        target instanceof Element && target.closest('[data-slot="command-palette"]') != null;
      if (isEditableTarget(target) && !insidePalette) return;

      event.preventDefault();
      setOpen(!open);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen, shortcutKey]);

  const selectCommand = (command: CommandPaletteCommand): void => {
    if (command.disabled) return;
    setOpen(false);
    onCommandSelect(command);
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} ariaLabel={title} size="lg" placement="top">
      <CommandPrimitive
        data-slot="command-palette"
        label={title}
        loop
        vimBindings={false}
        className={cn('flex w-full flex-col overflow-hidden bg-surface text-fg-default', className)}
      >
        <div
          data-slot="command-palette-input-wrapper"
          className="flex h-10 shrink-0 items-center gap-2 border-b border-border-muted px-3"
        >
          <Search className="size-4 shrink-0 text-fg-muted" aria-hidden="true" />
          <CommandPrimitive.Input
            ref={inputRef}
            data-slot="command-palette-input"
            value={search}
            onValueChange={setSearch}
            placeholder={placeholder}
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-fg-default outline-none placeholder:text-fg-muted disabled:cursor-not-allowed disabled:opacity-50"
          />
          <kbd className="shrink-0 text-2xs text-fg-decorative">Esc</kbd>
        </div>

        <CommandPrimitive.List
          data-slot="command-palette-list"
          label={`${title}の候補`}
          className="max-h-80 scroll-py-1 overflow-x-hidden overflow-y-auto p-1 outline-none"
        >
          <CommandPrimitive.Empty
            data-slot="command-palette-empty"
            className="py-10 text-center text-sm text-fg-muted"
          >
            {emptyLabel}
          </CommandPrimitive.Empty>

          {groups.map((group, groupIndex) => (
            <React.Fragment key={group.id}>
              {groupIndex > 0 && (
                <CommandPrimitive.Separator
                  data-slot="command-palette-separator"
                  className="mx-1 h-px bg-border-muted"
                />
              )}
              <CommandPrimitive.Group
                data-slot="command-palette-group"
                value={group.id}
                heading={group.label}
                className="overflow-hidden py-1 text-fg-default [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-fg-muted"
              >
                {group.commands.map((command) => (
                  <CommandPrimitive.Item
                    key={command.id}
                    data-slot="command-palette-item"
                    data-command-id={command.id}
                    value={command.id}
                    keywords={[command.label, ...(command.keywords ?? [])]}
                    disabled={command.disabled}
                    onSelect={() => selectCommand(command)}
                    className="relative flex min-h-9 cursor-default items-center gap-2 rounded-sm px-2 text-sm outline-none select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-hover data-[selected=true]:text-fg-default [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                  >
                    {command.icon}
                    <span className="min-w-0 flex-1 truncate">{command.label}</span>
                    {command.shortcut != null && (
                      <span
                        data-slot="command-palette-shortcut"
                        className="ml-auto shrink-0 text-2xs text-fg-muted"
                      >
                        {command.shortcut}
                      </span>
                    )}
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.Group>
            </React.Fragment>
          ))}
        </CommandPrimitive.List>
      </CommandPrimitive>
    </Modal>
  );
}
