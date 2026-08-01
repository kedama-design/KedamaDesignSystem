import React, { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

// ─── Types ──────────────────────────────────────────────

export interface ModalProps {
  /** モーダルの表示状態 */
  open: boolean;
  /** 閉じるときのコールバック（Escape、スクリムクリック、閉じるボタン） */
  onClose: () => void;
  /** モーダルのタイトル（aria-labelledby に使用） */
  title?: string;
  /** モーダルの説明（aria-describedby に使用） */
  description?: string;
  /** モーダルの幅。デフォルトは md（480px） */
  size?: 'sm' | 'md' | 'lg';
  /** モーダルのコンテンツ */
  children: React.ReactNode;
  /** ルートに追加するクラス名 */
  className?: string;
}

// ─── Size Map ───────────────────────────────────────────

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
} as const;

// ─── Component ──────────────────────────────────────────

/**
 * Modal コンポーネント
 *
 * HTML `<dialog>` 要素をベースにしたモーダルダイアログ。
 *
 * ブラウザネイティブの機能を活用:
 * - フォーカストラップ（dialog 内に自動的に閉じ込め）
 * - Escape キーで閉じる
 * - `::backdrop` でスクリム表示
 * - `inert` で背景要素を自動無効化
 *
 * Calm UI:
 * - shadow-lg（ブランドカラー混ぜ）で上質な浮遊感
 * - scrim（birch/900 50%）で背面を遮る。backdrop-filter は使わない
 * - 穏やかなフェードイン（duration-normal）
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <Modal open={open} onClose={() => setOpen(false)} title="確認">
 *   <Modal.Body>本当に削除しますか？</Modal.Body>
 *   <Modal.Footer>
 *     <Button variant="ghost" onClick={() => setOpen(false)}>キャンセル</Button>
 *     <Button variant="danger">削除する</Button>
 *   </Modal.Footer>
 * </Modal>
 * ```
 */
function ModalRoot({
  open,
  onClose,
  title,
  description,
  size = 'md',
  children,
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // open の変化に応じて showModal / close を呼ぶ
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // スクリム（::backdrop）クリックで閉じる
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) {
        onClose();
      }
    },
    [onClose],
  );

  // Escape で閉じる（dialog のデフォルト動作を onClose にフック）
  const handleCancel = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      onClose();
    },
    [onClose],
  );

  const titleId = title ? 'modal-title' : undefined;
  const descId = description ? 'modal-desc' : undefined;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleClick}
      onCancel={handleCancel}
      aria-labelledby={titleId}
      aria-describedby={descId}
      className={cn(
        // リセット: dialog のデフォルトスタイルを上書き
        'm-auto p-0 bg-transparent',
        // backdrop — scrim はセマンティックトークン経由。値はプリミティブの
        // birch/900 を color-mix() でアルファ合成したもの（rgba 直値ではない）
        //
        // backdrop-filter: blur() は既定オフ（2026-08-01 判断）。
        // scrim 50% だけで「背面は触れない」は十分に伝わり、blur は必要な機能を
        // 足すのではなく「さらに読めなくする」だけだった。加えて全画面要素の
        // backdrop-filter は GPU 負荷が高く、大きなテーブルを背面に持つ業務画面では
        // 体感の引っかかりになり得る。経緯は docs/phase-a2-decisions.md。
        'backdrop:bg-scrim',
        // 開閉アニメーション — overlay-enter（slow 400ms + enter easing）
        //
        // 以前は tailwindcss-animate 系の `animate-in fade-in zoom-in-95` が
        // 書かれていたが、それらを供給するパッケージが無く animation-name が
        // none に落ちていた（Computed Style Audit で実測）。自前のキーフレーム
        // （tailwind.css の --animate-overlay-enter）に差し替えてある。
        //
        // 拡大（zoom-in-95）は再現していない。95%→100% の拡大は注意を引く
        // ための表現で、§3.5「オーバーレイの出入りは damped、overshoot 不可」
        // の趣旨から外れる。フェードだけで出現は十分に伝わる。
        'open:animate-overlay-enter',
      )}
    >
      <div
        className={cn(
          'w-full rounded-md bg-surface shadow-lg',
          'border border-border-muted',
          sizeClasses[size],
          className,
        )}
        role="document"
      >
        {/* ── Header ── */}
        {title && (
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <h2 id={titleId} className="font-heading text-xl font-medium text-fg-default">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'inline-flex items-center justify-center',
                'h-8 w-8 rounded-sm text-fg-muted',
                'hover:bg-hover hover:text-fg-default',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus',
                'transition-colors duration-[var(--primitive-duration-fast)]',
              )}
              aria-label="閉じる"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}

        {description && (
          <p id={descId} className="px-6 pb-2 text-sm text-fg-muted">
            {description}
          </p>
        )}

        {children}
      </div>
    </dialog>
  );
}

ModalRoot.displayName = 'Modal';

// ─── Modal.Body ─────────────────────────────────────────

export type ModalBodyProps = React.HTMLAttributes<HTMLDivElement>;

function ModalBody({ className, children, ...props }: ModalBodyProps) {
  return (
    <div className={cn('px-6 py-4', className)} {...props}>
      {children}
    </div>
  );
}

ModalBody.displayName = 'Modal.Body';

// ─── Modal.Footer ───────────────────────────────────────

export type ModalFooterProps = React.HTMLAttributes<HTMLDivElement>;

function ModalFooter({ className, children, ...props }: ModalFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2',
        'border-t border-border-muted px-6 py-4',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

ModalFooter.displayName = 'Modal.Footer';

// ─── Compound Component ─────────────────────────────────

export const Modal = Object.assign(ModalRoot, {
  Body: ModalBody,
  Footer: ModalFooter,
});
