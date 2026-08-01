import React, { useId } from 'react';
import { cn } from '../../lib/cn';

// ─── Types ──────────────────────────────────────────────

export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** ラベルテキスト */
  label?: string;
  /** 補助テキスト（入力のヒント） */
  helperText?: string;
  /** エラーメッセージ。指定するとエラー状態になる */
  error?: string;
  /** 入力フィールドの左側に表示する要素（アイコンなど） */
  leadingIcon?: React.ReactNode;
  /** 入力フィールドの右側に表示する要素（アイコンなど） */
  trailingIcon?: React.ReactNode;
}

// ─── Component ──────────────────────────────────────────

/**
 * TextField コンポーネント
 *
 * ラベル + 入力フィールド + ヘルプテキスト/エラーメッセージを
 * 一体で管理するフォーム入力コンポーネント。
 *
 * - ラベルと入力は `id` で自動的に紐付けられる（アクセシビリティ）
 * - エラー時は `aria-invalid` + `aria-describedby` で支援技術に伝達
 * - Calm UI: 境界線は控えめ、フォーカス時にアクティブカラーで明示
 *
 * @example
 * ```tsx
 * <TextField label="メールアドレス" placeholder="example@kedama.co" />
 * <TextField label="会社名" helperText="正式名称を入力してください" />
 * <TextField label="電話番号" error="電話番号の形式が正しくありません" />
 * ```
 */
export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      disabled,
      leadingIcon,
      trailingIcon,
      id: externalId,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = externalId ?? generatedId;
    const hasError = !!error;
    const messageId = hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined;

    return (
      <div className={cn('flex flex-col gap-1', className)}>
        {/* ── Label ── */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn('text-sm font-medium', disabled ? 'text-fg-disabled' : 'text-fg-default')}
          >
            {label}
          </label>
        )}

        {/* ── Input Wrapper ── */}
        <div
          className={cn(
            'flex items-center gap-2',
            'rounded-sm border bg-surface px-3',
            'transition-colors',
            'duration-[var(--primitive-duration-fast)]',
            // 通常状態
            // §0.7 運用ルール2: 枠線がコントロールの境界を伝える要素は
            // WCAG 1.4.11 で 3:1 が必要。border.default（ヘアライン）ではなく
            // border.strong を使う。単なるディバイダーは border.default で構わない。
            !hasError &&
              !disabled && [
                'border-border-strong',
                'hover:border-border-active',
                'focus-within:border-border-active focus-within:ring-1 focus-within:ring-border-focus',
              ],
            // エラー状態
            hasError &&
              !disabled && [
                'border-border-error',
                'focus-within:ring-1 focus-within:ring-border-error',
              ],
            // 無効状態
            disabled && 'border-border-disabled bg-bg-disabled cursor-not-allowed',
          )}
        >
          {leadingIcon && (
            <span className={cn('shrink-0', disabled ? 'text-fg-disabled' : 'text-fg-muted')}>
              {leadingIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={hasError || undefined}
            aria-describedby={messageId}
            className={cn(
              'w-full bg-transparent py-2 outline-none',
              'text-md font-body',
              'placeholder:text-fg-placeholder',
              disabled && 'cursor-not-allowed text-fg-disabled',
            )}
            {...props}
          />

          {trailingIcon && (
            <span className={cn('shrink-0', disabled ? 'text-fg-disabled' : 'text-fg-muted')}>
              {trailingIcon}
            </span>
          )}
        </div>

        {/* ── Helper / Error Message ── */}
        {(error || helperText) && (
          <p
            id={messageId}
            className={cn('text-xs', hasError ? 'text-status-danger' : 'text-fg-muted')}
            role={hasError ? 'alert' : undefined}
          >
            {error ?? helperText}
          </p>
        )}
      </div>
    );
  },
);

TextField.displayName = 'TextField';
