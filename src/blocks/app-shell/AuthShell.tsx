import * as React from 'react';
import { cn } from '@kedama-design/design-system';

/**
 * AuthShell — 認証前の画面の外枠（Tier 2 ブロック `app-shell`）
 *
 * サイドバーもヘッダーもステータスバーも持たない。中央に1カラムだけ置く。
 *
 * ## なぜ AppShell の prop ではなく別コンポーネントなのか（仕様書 §4.5）
 *
 * すらすらスタジオで「ログイン画面にサイドメニューが出る」が実際に起きた。
 * 原因はルートグループのレイアウト構成ミスで、**シェルを暗黙に継承させたこと**だった。
 * `(internal)/layout.tsx` が `<aside>` を無条件に描画していて、/login も
 * その配下にあった（§4.6 の検証で、配置は認識されていたが副作用だけ手当てされて
 * いなかったことが確認されている。事故ではなく設計の穴）。
 *
 * `<AppShell hideSidebar>` のようなフラグにすると、**外枠を着せることが既定**の
 * ままになり、同じ穴が残る。別コンポーネントにすることで「着せる」を明示的な行為に
 * 変え、認証前のルートで AppShell を書かないかぎりサイドバーは出ない。
 *
 * ## 中身は Card などで組む
 *
 * ここが持つのは中央寄せと幅の制限だけで、面（surface）は持たない。
 * 上流 shadcn の login ブロックも同じ構成で、`Card` は中身側にある。
 *
 * @example
 * ```tsx
 * <AuthShell brand={<Wordmark />} footer={<TermsLink />}>
 *   <Card>
 *     <CardHeader>
 *       <CardTitle>ログイン</CardTitle>
 *     </CardHeader>
 *     <CardContent>
 *       <LoginForm />
 *     </CardContent>
 *   </Card>
 * </AuthShell>
 * ```
 */
export interface AuthShellProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  /** フォームなど。通常は `Card` を1枚置く */
  children: React.ReactNode;
  /** 上に置くロゴやワードマーク */
  brand?: React.ReactNode;
  /** 下に置く補助リンク（利用規約・問い合わせなど） */
  footer?: React.ReactNode;
  /** カラムの最大幅。既定 `24rem`（384px） */
  width?: string;
}

const DEFAULT_AUTH_WIDTH = '24rem';

export const AuthShell = React.forwardRef<HTMLElement, AuthShellProps>(function AuthShell(
  { children, brand, footer, width = DEFAULT_AUTH_WIDTH, className, style, ...props },
  ref,
) {
  return (
    <main
      ref={ref}
      data-slot="auth-shell"
      className={cn(
        'flex min-h-svh flex-col items-center justify-center gap-6 bg-page p-6 md:p-10',
        className,
      )}
      style={{ '--auth-shell-width': width, ...style } as React.CSSProperties}
      {...props}
    >
      <div
        data-slot="auth-shell-column"
        className="flex w-full max-w-(--auth-shell-width) flex-col gap-6"
      >
        {brand != null && (
          <div data-slot="auth-shell-brand" className="flex justify-center">
            {brand}
          </div>
        )}

        {children}

        {footer != null && (
          <div
            data-slot="auth-shell-footer"
            className="text-center text-xs leading-relaxed text-fg-muted"
          >
            {footer}
          </div>
        )}
      </div>
    </main>
  );
});
