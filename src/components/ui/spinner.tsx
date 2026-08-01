import { cn } from "@/lib/cn"
import { CircleDashedIcon, Loader2Icon } from "lucide-react"

interface SpinnerProps extends Omit<React.ComponentProps<"span">, "children"> {
  /**
   * 進行中であることを表す文言。
   *
   * 常にアクセシブルネームとして使い、prefers-reduced-motion 時は
   * 目に見える形でも併記する。
   */
  label?: string
}

/**
 * Spinner — 処理中であることを示す。
 *
 * ## reduced-motion で「消す」わけにいかない部品
 *
 * Calm UI のモーションは原則として状態変化の案内役であり、
 * prefers-reduced-motion 時はグローバル CSS の受け皿
 * （tailwind.css の Reduced motion セクション）が一括で止める。
 * だが Spinner は数少ない例外で、**連続回転そのものが情報を担っている**。
 * 止めるだけだと、止まった輪が残って「固まった」「壊れた」と読まれる。
 * 何も出ないのが最悪で、止まった回転はそれに近い。
 *
 * そこで動きを消す代わりに、動かない表現へ差し替える。
 *
 *   通常           回転する Loader2Icon（動きが進行を伝える）
 *   reduce 指定時  静止の CircleDashedIcon ＋ ラベルの文字を可視化
 *
 * 静止アイコンに破線の円を選んだのは、止まった実線スピナーと
 * 見分けがつくため。実線の輪が止まっていると「壊れている」に見えるが、
 * 破線の円はもともと静止した図形として読める。
 *
 * ## これは「個別コンポーネントに reduced-motion を実装させる」ことの例外か
 *
 * 違う。動きを止める判断はグローバル CSS が一括で下しており、ここで
 * やっているのは「止めた結果として失われた情報を補う」ことである。
 * 判断は1箇所のまま、補償だけが情報を持っている部品の責任になる。
 *
 * @example
 * ```tsx
 * <Spinner />
 * <Spinner className="size-6" label="集計中" />
 * ```
 */
function Spinner({ className, label = "読み込み中", ...props }: SpinnerProps) {
  return (
    <span
      data-slot="spinner"
      role="status"
      aria-label={label}
      className="inline-flex items-center gap-2 align-middle"
      {...props}
    >
      <Loader2Icon
        aria-hidden="true"
        className={cn("size-4 shrink-0 animate-spin motion-reduce:hidden", className)}
      />
      <CircleDashedIcon
        aria-hidden="true"
        className={cn("hidden size-4 shrink-0 motion-reduce:block", className)}
      />
      {/*
       * 支援技術には常に読ませ、reduced-motion 時だけ目にも見せる。
       * 動きが伝えていた「進行中」を文字で肩代わりする。
       */}
      <span className="sr-only text-sm motion-reduce:not-sr-only">{label}</span>
    </span>
  )
}

export { Spinner, type SpinnerProps }
