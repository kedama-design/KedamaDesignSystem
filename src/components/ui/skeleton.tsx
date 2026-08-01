import { cn } from "@/lib/cn"

/**
 * Skeleton — 読み込み中のプレースホルダ。
 *
 * ## 既定で静止させている（上流の shadcn からの変更点）
 *
 * 上流は `animate-pulse` を既定で持つ。一覧の読み込みでは Skeleton が
 * 10行20行と並ぶことがあり、それが一斉に明滅すると画面全体が呼吸する。
 * Calm UI では穏やかさが最優先の原則であり、待ち時間の画面こそ
 * 最も落ち着いているべき場面なので、既定を静止に変えている。
 *
 * ## ただし無地にはしない
 *
 * 明滅を外しても `bg-muted`（→ semantic の bg.subtle）は残す。
 * 面としての存在が消えると「まだ何も来ていない」ではなく
 * 「空だ」「壊れている」と読まれる。プレースホルダは「ここに何か入る」ことを
 * 示す図形であって、動きはその手段の一つに過ぎない。
 *
 * ## 明滅させたいとき
 *
 * 単独で長く待たせる箇所など、動きで進行を示したい場合は呼び出し側で
 * `className="animate-pulse"` を足す。prop を増やさず className の
 * 逃がし口で足りる。prefers-reduced-motion 時はグローバル CSS
 * （tailwind.css の Reduced motion セクション）が止めるので、
 * 呼び出し側で分岐を書く必要はない。
 *
 * @example
 * ```tsx
 * <Skeleton className="h-4 w-full" />                 // 一覧向け（静止）
 * <Skeleton className="h-32 w-full animate-pulse" />  // 単独・長時間
 * ```
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
