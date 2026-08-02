import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { Skeleton } from '../components/ui/skeleton';
import { Spinner } from '../components/ui/spinner';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../components/ui/accordion';

/**
 * Computed Style Audit — 解決値をブラウザに聞く
 *
 * ## なぜこれがあるのか
 *
 * このリポジトリでは CSS 変数・ユーティリティの生成有無を grep で判定して
 * 2回連続で誤判定を出した。1件目は「生成されていない」と報告したものが
 * 実際には修飾子付きで生成されていた、というもの。
 *
 * 原因は grep が**ソースの文字列**しか見ないこと。実際に効くかどうかは
 *
 *   - Tailwind の @theme に名前が登録されているか
 *   - `inline` の有無でテーマ切替に追随するか
 *   - var() の連鎖が終端のプリミティブまで届いているか
 *   - @keyframes が本当に定義されているか
 *
 * の積であって、どれもソースの文字列一致では判定できない。
 *
 * このページは実際に DOM を描画し `getComputedStyle` で読む。
 * ブラウザが返した値だけを表示し、期待値との一致は機械的に判定する。
 * 以後「〜のはず」で先へ進まないための道具として使う。
 *
 * ## 読み方
 *
 * 各行は2つの要素を描画して比べる。
 *
 *   実測（utility）  … 検証対象の Tailwind ユーティリティを当てた要素
 *   実測（参照）      … 期待する CSS 変数を style 属性で直接当てた要素
 *
 * この2つが一致し、かつ初期値でなければ ✅。ユーティリティ側だけが初期値
 * なら「@theme に無い＝生成されていない」。両方が初期値なら「変数自体が
 * 存在しない」。値が違えば「別のものを指している」。
 *
 * ## 書き足すときの注意
 *
 * ⚠️ ユーティリティ名は**必ずリテラルで書くこと**。`` `bg-${name}` `` のように
 *    組み立てると Tailwind のソーススキャンに引っかからず、
 *    「@theme に無いから生成されない」と「どこにも書かれていないから
 *    生成されない」が区別できなくなる。テスト自体が嘘をつく。
 */

// ════════════════════════════════════════════════════════
//  計測
// ════════════════════════════════════════════════════════

/** 読み取り対象のプロパティ。`--` 始まりならカスタムプロパティとして読む。 */
type ProbeProp = 'backgroundColor' | 'color' | 'borderTopColor' | string;

/**
 * 配下の `[data-probe-id]` を全部 getComputedStyle で読む。
 *
 * ref 配列を持ち回るより、描画後に DOM を引く方が行の追加が安い。
 * 計測は useLayoutEffect（描画後・ペイント前）で行う。
 */
function useProbes(deps: React.DependencyList) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [tick, setTick] = React.useState(0);

  React.useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const next: Record<string, string> = {};
    root.querySelectorAll<HTMLElement>('[data-probe-id]').forEach((el) => {
      const id = el.dataset.probeId;
      const prop = el.dataset.probeProp;
      if (!id || !prop) return;
      const cs = getComputedStyle(el);
      next[id] = prop.startsWith('--')
        ? cs.getPropertyValue(prop).trim()
        : String(cs[prop as keyof CSSStyleDeclaration] ?? '');
    });
    setValues(next);
    // deps は呼び出し側が渡す。tick は「再計測」ボタン用。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { ref, values, remeasure: () => setTick((t) => t + 1) };
}

/**
 * 指定名の @keyframes が実際に定義されているかを CSSOM から探す。
 *
 * `animation-name` は keyframes が無くても宣言した名前をそのまま返すため、
 * `animationName !== 'none'` だけでは「クラスは生成されたが keyframes が
 * 無い」状態を見逃す。accordion がまさにその状態にあるため必要。
 *
 * @media / @layer / @supports の入れ子に入ることがあるので再帰で辿る。
 */
function findKeyframes(name: string): boolean {
  const walk = (rules: CSSRuleList): boolean => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSKeyframesRule && rule.name === name) return true;
      // CSSGroupingRule（@media / @supports / @layer）は子を持つ
      const grouping = rule as CSSGroupingRule;
      if (grouping.cssRules && walk(grouping.cssRules)) return true;
    }
    return false;
  };

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      // クロスオリジンのシート（Google Fonts）は読めない。無視してよい。
      continue;
    }
    if (walk(rules)) return true;
  }
  return false;
}

// ════════════════════════════════════════════════════════
//  判定
// ════════════════════════════════════════════════════════

type Verdict = 'ok' | 'mismatch' | 'missing' | 'both-missing' | 'pending';

/** その値が「何も当たっていない」ことを意味する初期値か */
function isInitial(prop: ProbeProp, value: string): boolean {
  if (!value) return true;
  if (prop === 'backgroundColor') return value === 'rgba(0, 0, 0, 0)' || value === 'transparent';
  if (prop === 'backdropFilter') return value === 'none';
  // borderTopColor の初期値は currentColor（＝色が付く）ため透明判定ができない。
  // 「未生成」は参照側との不一致として現れる。
  return false;
}

function judge(prop: ProbeProp, utility: string, reference: string): Verdict {
  if (!utility && !reference) return 'pending';
  const uMissing = isInitial(prop, utility);
  const rMissing = isInitial(prop, reference);
  if (uMissing && rMissing) return 'both-missing';
  if (uMissing) return 'missing';
  return utility === reference ? 'ok' : 'mismatch';
}

const VERDICT_LABEL: Record<Verdict, string> = {
  ok: '✅ 一致',
  mismatch: '⚠️ 不一致',
  missing: '❌ 未生成',
  'both-missing': '❌ 変数なし',
  pending: '… 計測前',
};

const VERDICT_COLOR: Record<Verdict, string> = {
  ok: 'var(--color-status-success)',
  mismatch: 'var(--color-status-warning)',
  missing: 'var(--color-status-danger)',
  'both-missing': 'var(--color-status-danger)',
  pending: 'var(--color-fg-muted)',
};

// ════════════════════════════════════════════════════════
//  検証対象の定義
// ════════════════════════════════════════════════════════

interface AliasRow {
  /** 取り込み品が使う名前（alias-shadcn.css の左辺） */
  alias: string;
  /** 期待する解決先（alias-shadcn.css の右辺・Kedama セマンティック） */
  expects: string;
  /** 検証するユーティリティ。リテラルで書くこと */
  utility: string;
}

/**
 * alias-shadcn.css の全エイリアス。
 *
 * 一律で `bg-*` を使う。色の値は当たるプロパティによらないため、
 * 「@theme に名前が登録され、値が Kedama トークンへ届いているか」は
 * これで判定できる。実際に使われている `text-*` / `border-*` /
 * 透明度付きは USED_CLASSES 側で別に見る。
 */
const ALIAS_ROWS: AliasRow[] = [
  { alias: '--background', expects: '--color-bg-page', utility: 'bg-background' },
  { alias: '--foreground', expects: '--color-fg-default', utility: 'bg-foreground' },
  { alias: '--card', expects: '--color-bg-surface', utility: 'bg-card' },
  { alias: '--card-foreground', expects: '--color-fg-default', utility: 'bg-card-foreground' },
  { alias: '--popover', expects: '--color-bg-surface-raised', utility: 'bg-popover' },
  {
    alias: '--popover-foreground',
    expects: '--color-fg-default',
    utility: 'bg-popover-foreground',
  },
  { alias: '--primary', expects: '--color-accent-primary', utility: 'bg-primary' },
  {
    alias: '--primary-foreground',
    expects: '--color-accent-primary-fg',
    utility: 'bg-primary-foreground',
  },
  { alias: '--secondary', expects: '--color-bg-subtle', utility: 'bg-secondary' },
  {
    alias: '--secondary-foreground',
    expects: '--color-fg-default',
    utility: 'bg-secondary-foreground',
  },
  { alias: '--muted', expects: '--color-bg-subtle', utility: 'bg-muted' },
  { alias: '--muted-foreground', expects: '--color-fg-muted', utility: 'bg-muted-foreground' },
  { alias: '--accent', expects: '--color-bg-hover', utility: 'bg-accent' },
  { alias: '--accent-foreground', expects: '--color-fg-default', utility: 'bg-accent-foreground' },
  { alias: '--destructive', expects: '--color-status-danger-solid', utility: 'bg-destructive' },
  {
    alias: '--destructive-foreground',
    expects: '--color-status-danger-fg',
    utility: 'bg-destructive-foreground',
  },
  { alias: '--border', expects: '--color-border-default', utility: 'bg-border' },
  { alias: '--input', expects: '--color-border-strong', utility: 'bg-input' },
  { alias: '--ring', expects: '--color-border-focus', utility: 'bg-ring' },
  {
    alias: '--chart-1',
    expects: '--color-data-viz-categorical-neutral-primary',
    utility: 'bg-chart-1',
  },
  {
    alias: '--chart-2',
    expects: '--color-data-viz-categorical-neutral-secondary',
    utility: 'bg-chart-2',
  },
  {
    alias: '--chart-3',
    expects: '--color-data-viz-categorical-neutral-previous',
    utility: 'bg-chart-3',
  },
  { alias: '--chart-4', expects: '--color-data-viz-emphasis-positive', utility: 'bg-chart-4' },
  { alias: '--chart-5', expects: '--color-data-viz-axis-default', utility: 'bg-chart-5' },
  { alias: '--sidebar', expects: '--color-bg-sidebar', utility: 'bg-sidebar' },
  {
    alias: '--sidebar-foreground',
    expects: '--color-fg-default',
    utility: 'bg-sidebar-foreground',
  },
  { alias: '--sidebar-primary', expects: '--color-accent-primary', utility: 'bg-sidebar-primary' },
  {
    alias: '--sidebar-primary-foreground',
    expects: '--color-accent-primary-fg',
    utility: 'bg-sidebar-primary-foreground',
  },
  { alias: '--sidebar-accent', expects: '--color-bg-hover', utility: 'bg-sidebar-accent' },
  {
    alias: '--sidebar-accent-foreground',
    expects: '--color-fg-default',
    utility: 'bg-sidebar-accent-foreground',
  },
  { alias: '--sidebar-border', expects: '--color-border-muted', utility: 'bg-sidebar-border' },
  { alias: '--sidebar-ring', expects: '--color-border-focus', utility: 'bg-sidebar-ring' },
];

interface UsedClassRow {
  /** 取り込み品のソースに実在するクラス文字列 */
  utility: string;
  /** 読み取るプロパティ */
  prop: ProbeProp;
  /** 期待値の CSS（style 属性で直接当てる） */
  reference: string;
  /** どのファイルで使われているか */
  usedIn: string;
  /** 補足 */
  note?: string;
}

/**
 * src/components/ui/ に実在するクラス文字列。
 *
 * ALIAS_ROWS が「名前が @theme にあるか」を見るのに対し、こちらは
 * 「実際に書かれている形（透明度修飾子つき・text/border 名前空間）で
 * 解決するか」を見る。透明度修飾子は Tailwind v4 で color-mix() に
 * 展開されるため、var() 連鎖の上でも動くかは実測しないとわからない。
 */
const USED_CLASSES: UsedClassRow[] = [
  {
    utility: 'bg-muted',
    prop: 'backgroundColor',
    reference: 'var(--color-bg-subtle)',
    usedIn: 'skeleton.tsx',
  },
  {
    utility: 'bg-muted/50',
    prop: 'backgroundColor',
    reference: 'color-mix(in oklab, var(--color-bg-subtle) 50%, transparent)',
    usedIn: 'table.tsx',
  },
  {
    utility: 'bg-primary',
    prop: 'backgroundColor',
    reference: 'var(--color-accent-primary)',
    usedIn: 'button.tsx',
  },
  {
    utility: 'bg-primary/80',
    prop: 'backgroundColor',
    reference: 'color-mix(in oklab, var(--color-accent-primary) 80%, transparent)',
    usedIn: 'button.tsx',
  },
  {
    utility: 'bg-secondary',
    prop: 'backgroundColor',
    reference: 'var(--color-bg-subtle)',
    usedIn: 'button.tsx',
  },
  {
    utility: 'bg-popover',
    prop: 'backgroundColor',
    reference: 'var(--color-bg-surface-raised)',
    usedIn: 'toast.tsx',
  },
  {
    utility: 'bg-background',
    prop: 'backgroundColor',
    reference: 'var(--color-bg-page)',
    usedIn: '（使用箇所なし・在庫）',
  },
  {
    utility: 'bg-destructive/10',
    prop: 'backgroundColor',
    reference: 'color-mix(in oklab, var(--color-status-danger-solid) 10%, transparent)',
    usedIn: 'toast.tsx',
  },
  {
    utility: 'bg-input/30',
    prop: 'backgroundColor',
    reference: 'color-mix(in oklab, var(--color-border-strong) 30%, transparent)',
    usedIn: 'button.tsx',
  },
  {
    utility: 'text-foreground',
    prop: 'color',
    reference: 'var(--color-fg-default)',
    usedIn: 'accordion.tsx / table.tsx',
  },
  {
    utility: 'text-muted-foreground',
    prop: 'color',
    reference: 'var(--color-fg-muted)',
    usedIn: 'accordion.tsx / table.tsx',
  },
  {
    utility: 'text-primary',
    prop: 'color',
    reference: 'var(--color-accent-primary)',
    usedIn: 'toast.tsx',
  },
  {
    utility: 'text-primary-foreground',
    prop: 'color',
    reference: 'var(--color-accent-primary-fg)',
    usedIn: 'button.tsx',
  },
  {
    utility: 'text-secondary-foreground',
    prop: 'color',
    reference: 'var(--color-fg-default)',
    usedIn: 'button.tsx',
  },
  {
    utility: 'text-popover-foreground',
    prop: 'color',
    reference: 'var(--color-fg-default)',
    usedIn: 'toast.tsx',
  },
  {
    utility: 'text-destructive',
    prop: 'color',
    reference: 'var(--color-status-danger-solid)',
    usedIn: 'toast.tsx',
  },
  {
    utility: 'border-border',
    prop: 'borderTopColor',
    reference: 'var(--color-border-default)',
    usedIn: 'table.tsx',
  },
  {
    utility: 'border-input',
    prop: 'borderTopColor',
    reference: 'var(--color-border-strong)',
    usedIn: 'button.tsx',
  },
  {
    utility: 'border-ring',
    prop: 'borderTopColor',
    reference: 'var(--color-border-focus)',
    usedIn: 'accordion.tsx / button.tsx',
  },
  {
    utility: 'border-destructive/50',
    prop: 'borderTopColor',
    reference: 'color-mix(in oklab, var(--color-status-danger-solid) 50%, transparent)',
    usedIn: 'toast.tsx',
  },
  {
    utility: 'border-b',
    prop: 'borderTopColor',
    reference: 'var(--color-border-default)',
    usedIn: 'accordion.tsx（not-last:border-b） / table.tsx / drawer.tsx',
    note: '色を書いていない border-*。CSS の初期値は currentColor（＝文字色）で、shadcn の globals.css は base レイヤに `* { border-color: var(--border) }` を敷いてこれを上書きしている。取り込み時に落ちていたため tailwind.css の @layer base で補った。この行はその規則が効いているかを見る。',
  },
  {
    // blur は既定オフ（2026-08-01 判断）。この行はどこからも使われていない
    // 在庫トークンが「使うと決めたときに解決するか」を見るためのもの。
    utility: 'backdrop-blur-[var(--primitive-backdrop-blur)]',
    prop: 'backdropFilter',
    reference: 'blur(8px)',
    usedIn: '（使用箇所なし・在庫）',
    note: 'backdrop-filter は既定オフに決まった。以前は Modal が 8px、取り込んだ当時の Sheet / Drawer が Tailwind 既定の 4px を使っており、同一システム内でブラーの強さが2種類あった。両方外して解消済み。将来使うときは必ず --primitive-backdrop-blur を経由させること（4px / 8px が散らばる状態に戻さない）。',
  },
  {
    // base レイヤの規則がユーティリティに勝ってしまっていないかを見る。
    // @layer base はユーティリティより優先度が低いので、明示指定が勝つのが正しい。
    utility: 'border-b border-border-strong',
    prop: 'borderTopColor',
    reference: 'var(--color-border-strong)',
    usedIn: '（base レイヤの優先度確認用）',
    note: '明示的な色指定が @layer base の既定色に勝つことの確認。ここが不一致なら base レイヤの置き場所が間違っている。',
  },
];

interface MotionRow {
  utility: string;
  /** 'duration' は transition-all を併用して初期値と duration-0 を区別する */
  kind: 'duration' | 'easing';
  reference: string;
  note?: string;
}

/**
 * duration の probe には `transition-all` を併せて当てる。
 *
 * transition-duration の初期値は 0s で、`duration-0` の期待値も 0s。
 * 素で計測すると「生成されていない」と「0ms が正しく当たった」が
 * 同じ 0s になって区別できない。transition-all を敷くと未指定時の
 * ベースラインが Tailwind 既定の 0.15s になり、両者が分離する。
 *
 * easing は逆に transition-all を当てない。既定のタイミング関数が
 * `cubic-bezier(0.4, 0, 0.2, 1)` で、Kedama の easing.default と
 * 同値のため区別できなくなる。素の初期値 `ease` を基準にする。
 */
const MOTION_ROWS: MotionRow[] = [
  {
    utility: 'duration-fast',
    kind: 'duration',
    reference: 'var(--primitive-duration-fast)',
    note: 'セマンティック名で書きたい形',
  },
  { utility: 'duration-normal', kind: 'duration', reference: 'var(--primitive-duration-normal)' },
  { utility: 'duration-slow', kind: 'duration', reference: 'var(--primitive-duration-slow)' },
  {
    utility: 'duration-[var(--primitive-duration-fast)]',
    kind: 'duration',
    reference: 'var(--primitive-duration-fast)',
    note: 'Button / TextField / Modal が現に使っている形',
  },
  {
    utility: 'duration-150',
    kind: 'duration',
    reference: '150ms',
    note: '取り込み直後に素の数値で書かれていた値。現在はトークンへ置換済みで使用箇所なし（在庫確認用）',
  },
  {
    utility: 'duration-200',
    kind: 'duration',
    reference: '200ms',
    note: '取り込み直後に素の数値で書かれていた値。現在はトークンへ置換済みで使用箇所なし（在庫確認用）',
  },
  {
    utility: 'duration-250',
    kind: 'duration',
    reference: '250ms',
    note: '取り込み直後に素の数値で書かれていた値。現在はトークンへ置換済みで使用箇所なし（在庫確認用）',
  },
  {
    utility: 'duration-300',
    kind: 'duration',
    reference: '300ms',
    note: '取り込み直後に素の数値で書かれていた値。現在はトークンへ置換済みで使用箇所なし（在庫確認用）',
  },
  {
    utility: 'duration-450',
    kind: 'duration',
    reference: '450ms',
    note: '取り込み直後に素の数値で書かれていた値。現在はトークンへ置換済みで使用箇所なし（在庫確認用）',
  },
  {
    utility: 'duration-0',
    kind: 'duration',
    reference: '0ms',
    note: 'drawer.tsx（data-swiping。指の直接操作なので現在も素の値）',
  },
  {
    utility: 'ease-default',
    kind: 'easing',
    reference: 'var(--primitive-easing-default)',
    note: 'セマンティック名で書きたい形',
  },
  { utility: 'ease-enter', kind: 'easing', reference: 'var(--primitive-easing-enter)' },
  { utility: 'ease-exit', kind: 'easing', reference: 'var(--primitive-easing-exit)' },
  {
    utility: 'ease-[var(--primitive-easing-default)]',
    kind: 'easing',
    reference: 'var(--primitive-easing-default)',
    note: 'Button が現に使っている形',
  },
  {
    utility: 'ease-in-out',
    kind: 'easing',
    reference: 'cubic-bezier(0.4, 0, 0.2, 1)',
    note: '取り込み当時の sheet.tsx が使っていた値。現在は使用箇所なし。参照が CSS キーワードでないのは、Tailwind v4 の既定 --ease-in-out が cubic-bezier(0.4, 0, 0.2, 1) だから（実測）。Kedama の easing.default と偶然同値なので見た目は一致するが、トークン経由ではない。',
  },
];

interface AnimationRow {
  utility: string;
  /** 期待する animation-name。keyframes の実在も CSSOM で確認する */
  keyframes: string;
  usedIn: string;
}

const ANIMATION_ROWS: AnimationRow[] = [
  { utility: 'animate-spin', keyframes: 'spin', usedIn: 'spinner.tsx / Button.tsx / toast.tsx' },
  {
    utility: 'animate-pulse',
    keyframes: 'pulse',
    usedIn: 'skeleton.tsx（既定では未使用・opt-in）',
  },
  { utility: 'animate-accordion-down', keyframes: 'accordion-down', usedIn: 'accordion.tsx' },
  { utility: 'animate-accordion-up', keyframes: 'accordion-up', usedIn: 'accordion.tsx' },
  { utility: 'animate-overlay-enter', keyframes: 'overlay-enter', usedIn: 'Modal.tsx' },
  { utility: 'animate-overlay-exit', keyframes: 'overlay-exit', usedIn: '（未使用・在庫）' },
];

// ════════════════════════════════════════════════════════
//  表示部品
// ════════════════════════════════════════════════════════

const cellStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderBottom: '1px solid var(--color-border-muted)',
  verticalAlign: 'middle',
  whiteSpace: 'nowrap',
};

const monoStyle: React.CSSProperties = {
  ...cellStyle,
  fontFamily: 'var(--primitive-font-family-mono)',
  fontSize: '11px',
};

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        ...cellStyle,
        textAlign: 'left',
        fontSize: '11px',
        fontWeight: 500,
        color: 'var(--color-fg-muted)',
        borderBottom: '1px solid var(--color-border-default)',
      }}
    >
      {children}
    </th>
  );
}

function VerdictCell({ verdict }: { verdict: Verdict }) {
  return (
    <td style={{ ...cellStyle, color: VERDICT_COLOR[verdict], fontSize: '12px' }}>
      {VERDICT_LABEL[verdict]}
    </td>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2
        style={{
          fontFamily: 'var(--primitive-font-family-heading)',
          fontSize: 'var(--primitive-font-size-xl)',
          fontWeight: 500,
          color: 'var(--color-fg-default)',
          marginBottom: 6,
        }}
      >
        {title}
      </h2>
      <div
        style={{
          fontSize: 'var(--primitive-font-size-sm)',
          lineHeight: 1.7,
          color: 'var(--color-fg-muted)',
          maxWidth: '72ch',
          marginBottom: 14,
        }}
      >
        {description}
      </div>
      <div style={{ overflowX: 'auto' }}>{children}</div>
    </section>
  );
}

function Summary({ verdicts }: { verdicts: Verdict[] }) {
  const counts = verdicts.reduce<Record<string, number>>((acc, v) => {
    acc[v] = (acc[v] ?? 0) + 1;
    return acc;
  }, {});
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 10, fontSize: 12 }}>
      {(['ok', 'mismatch', 'missing', 'both-missing'] as Verdict[])
        .filter((v) => counts[v])
        .map((v) => (
          <span key={v} style={{ color: VERDICT_COLOR[v] }}>
            {VERDICT_LABEL[v]} {counts[v]}
          </span>
        ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  監査ページ本体
// ════════════════════════════════════════════════════════

type Theme = 'light' | 'dark' | 'deep-dark';

/**
 * 初期テーマは Storybook の args で受け取る。
 *
 * ヘッドレスで回すときに `&args=theme:dark` でテーマを指定できるようにするため。
 * ページ内のボタンでも切り替わる（人が見るときはそちらが早い）。
 */
function Audit({ theme: initialTheme = 'light' }: { theme?: Theme }) {
  const [theme, setTheme] = React.useState<Theme>(initialTheme);
  React.useEffect(() => setTheme(initialTheme), [initialTheme]);

  /*
   * data-theme は**ルート要素**（<html>）に置く。ラッパー div ではない。
   *
   * `inline` なしの `@theme` で宣言した変数は Tailwind が :root へ展開する。
   * カスタムプロパティは宣言元の要素で解決されるため、:root の
   * `--color-sidebar: var(--color-bg-sidebar)` は <html> の
   * `--color-bg-sidebar` を見る。data-theme が div にあると <html> は Light の
   * ままなので、非 inline の変数だけ Light に固定される。
   *
   * これは実運用（<html data-theme="…">）では起きない。div に置いたまま
   * 計測すると、壊れていないものを壊れていると報告する。実際に初版は
   * それで --sidebar を誤検出した。
   *
   * ⚠️ この useLayoutEffect は useProbes より**前**に宣言すること。
   *    フックは呼び出し順に走るため、後ろに置くと切替前の値を計測する。
   */
  React.useLayoutEffect(() => {
    const el = document.documentElement;
    const previous = el.dataset.theme;
    el.dataset.theme = theme;
    return () => {
      if (previous === undefined) delete el.dataset.theme;
      else el.dataset.theme = previous;
    };
  }, [theme]);

  const { ref, values, remeasure } = useProbes([theme]);

  // keyframes の実在は CSSOM を直接引く。描画後に一度だけ調べる。
  const [keyframes, setKeyframes] = React.useState<Record<string, boolean> | null>(null);
  React.useLayoutEffect(() => {
    const found: Record<string, boolean> = {};
    for (const row of ANIMATION_ROWS) found[row.keyframes] = findKeyframes(row.keyframes);
    setKeyframes(found);
  }, []);

  const reducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const aliasVerdicts = ALIAS_ROWS.map((r) =>
    judge(
      'backgroundColor',
      values[`alias-u-${r.alias}`] ?? '',
      values[`alias-r-${r.alias}`] ?? '',
    ),
  );
  const usedVerdicts = USED_CLASSES.map((r) =>
    judge(r.prop, values[`used-u-${r.utility}`] ?? '', values[`used-r-${r.utility}`] ?? ''),
  );

  return (
    <div
      ref={ref}
      // data-theme はここには置かない。上の useLayoutEffect で <html> に置く。
      style={{
        background: 'var(--color-bg-page)',
        color: 'var(--color-fg-default)',
        fontFamily: 'var(--primitive-font-family-body)',
        padding: 32,
        minHeight: '100vh',
      }}
    >
      <header style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: 'var(--primitive-font-family-heading)',
            fontSize: 'var(--primitive-font-size-3xl)',
            fontWeight: 500,
            marginBottom: 8,
          }}
        >
          Computed Style Audit
        </h1>
        <p
          style={{
            fontSize: 'var(--primitive-font-size-sm)',
            color: 'var(--color-fg-muted)',
            maxWidth: '72ch',
            lineHeight: 1.7,
          }}
        >
          すべての値はブラウザの <code>getComputedStyle</code> が返したもの。ソースの文字列一致
          （grep）では判定していない。「実測（utility）」はユーティリティクラスを当てた要素、
          「実測（参照）」は期待する CSS 変数を style 属性で直接当てた要素の実測値。
        </p>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 16 }}>
          {(['light', 'dark', 'deep-dark'] as Theme[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--primitive-radius-sm)',
                border: '1px solid var(--color-border-default)',
                background: theme === t ? 'var(--color-accent-primary)' : 'var(--color-bg-surface)',
                color: theme === t ? 'var(--color-accent-primary-fg)' : 'var(--color-fg-default)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {t}
            </button>
          ))}
          <button
            type="button"
            onClick={remeasure}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--primitive-radius-sm)',
              border: '1px solid var(--color-border-default)',
              background: 'var(--color-bg-surface)',
              color: 'var(--color-fg-default)',
              fontSize: 12,
              cursor: 'pointer',
              marginLeft: 8,
            }}
          >
            再計測
          </button>
          <span style={{ fontSize: 12, color: 'var(--color-fg-muted)', marginLeft: 8 }}>
            prefers-reduced-motion: {reducedMotion ? 'reduce' : 'no-preference'}
          </span>
        </div>
      </header>

      {/* ── 1. エイリアス解決 ───────────────────────────── */}
      <Section
        title="1. shadcn エイリアス → Kedama トークン"
        description={
          <>
            取り込んだコンポーネントが使う <code>--muted</code> 等が、Kedama のセマンティック
            トークンまで届いているか。ユーティリティ側だけが透明なら
            <code>@theme inline</code> に名前が無い（＝クラスが生成されていない）。
            両方が透明なら変数自体が存在しない。
          </>
        }
      >
        <Summary verdicts={aliasVerdicts} />
        <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
          <thead>
            <tr>
              <Th>エイリアス</Th>
              <Th>期待する解決先</Th>
              <Th>ユーティリティ</Th>
              <Th>実測（utility）</Th>
              <Th>実測（参照）</Th>
              <Th>判定</Th>
            </tr>
          </thead>
          <tbody>
            {ALIAS_ROWS.map((row, i) => (
              <tr key={row.alias}>
                <td style={monoStyle}>{row.alias}</td>
                <td style={{ ...monoStyle, color: 'var(--color-fg-muted)' }}>{row.expects}</td>
                <td style={monoStyle}>{row.utility}</td>
                <td style={monoStyle}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span
                      data-probe-id={`alias-u-${row.alias}`}
                      data-probe-prop="backgroundColor"
                      className={row.utility}
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 3,
                        border: '1px solid var(--color-border-muted)',
                        flexShrink: 0,
                      }}
                    />
                    {values[`alias-u-${row.alias}`] || '…'}
                  </span>
                </td>
                <td style={monoStyle}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span
                      data-probe-id={`alias-r-${row.alias}`}
                      data-probe-prop="backgroundColor"
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 3,
                        border: '1px solid var(--color-border-muted)',
                        backgroundColor: `var(${row.expects})`,
                        flexShrink: 0,
                      }}
                    />
                    {values[`alias-r-${row.alias}`] || '…'}
                  </span>
                </td>
                <VerdictCell verdict={aliasVerdicts[i]} />
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* ── 2. 実際に使われているクラス ─────────────────── */}
      <Section
        title="2. 取り込み品に実在するクラス"
        description={
          <>
            1 が「名前が登録されているか」を見るのに対し、ここは
            <code>src/components/ui/</code> のソースに実際に書かれている形で解決するかを見る。
            透明度修飾子（<code>/50</code> 等）は Tailwind v4 で <code>color-mix()</code>
            に展開されるため、var() 連鎖の上で成立するかは実測しないとわからない。
          </>
        }
      >
        <Summary verdicts={usedVerdicts} />
        <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
          <thead>
            <tr>
              <Th>クラス</Th>
              <Th>プロパティ</Th>
              <Th>使用箇所</Th>
              <Th>実測（utility）</Th>
              <Th>実測（参照）</Th>
              <Th>判定</Th>
            </tr>
          </thead>
          <tbody>
            {USED_CLASSES.map((row, i) => (
              <React.Fragment key={row.utility}>
                <tr>
                  <td style={monoStyle}>{row.utility}</td>
                  <td style={{ ...monoStyle, color: 'var(--color-fg-muted)' }}>{row.prop}</td>
                  <td style={{ ...cellStyle, color: 'var(--color-fg-muted)', fontSize: 11 }}>
                    {row.usedIn}
                  </td>
                  <td style={monoStyle}>
                    <span
                      data-probe-id={`used-u-${row.utility}`}
                      data-probe-prop={row.prop}
                      className={row.utility}
                      style={{ display: 'inline-block', minWidth: 1 }}
                    >
                      &nbsp;
                    </span>
                    {values[`used-u-${row.utility}`] || '…'}
                  </td>
                  <td style={monoStyle}>
                    <span
                      data-probe-id={`used-r-${row.utility}`}
                      data-probe-prop={row.prop}
                      style={{ [row.prop]: row.reference } as React.CSSProperties}
                    >
                      &nbsp;
                    </span>
                    {values[`used-r-${row.utility}`] || '…'}
                  </td>
                  <VerdictCell verdict={usedVerdicts[i]} />
                </tr>
                {row.note && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        ...cellStyle,
                        whiteSpace: 'normal',
                        fontSize: 11,
                        color: 'var(--color-fg-muted)',
                        paddingTop: 0,
                        paddingBottom: 10,
                      }}
                    >
                      {row.note}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </Section>

      {/* ── 3. モーション ───────────────────────────────── */}
      <Section
        title="3. duration / easing"
        description={
          <>
            duration の probe には <code>transition-all</code> を併用している。 transition-duration
            の初期値 0s と <code>duration-0</code> の期待値 0s が
            同じになって区別できないため、未指定時のベースラインを Tailwind 既定の 0.15s に
            上げてある。「実測（utility）」がベースラインと同じ行は
            <strong>ユーティリティが生成されていない</strong>。easing 側は逆に transition-all
            を当てていない（既定のタイミング関数が Kedama の easing.default と同値のため）。
          </>
        }
      >
        <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
          <thead>
            <tr>
              <Th>クラス</Th>
              <Th>実測（utility）</Th>
              <Th>実測（参照）</Th>
              <Th>判定</Th>
              <Th>備考</Th>
            </tr>
          </thead>
          <tbody>
            {/* ベースライン行。ここが「当たっていない」ときの値 */}
            <tr>
              <td style={{ ...monoStyle, color: 'var(--color-fg-muted)' }}>
                （transition-all のみ）
              </td>
              <td style={monoStyle}>
                <span
                  data-probe-id="motion-baseline"
                  data-probe-prop="transitionDuration"
                  className="transition-all"
                />
                {values['motion-baseline'] || '…'}
              </td>
              <td style={{ ...monoStyle, color: 'var(--color-fg-muted)' }}>—</td>
              <td style={{ ...cellStyle, color: 'var(--color-fg-muted)', fontSize: 12 }}>
                ベースライン
              </td>
              <td style={{ ...cellStyle, fontSize: 11, color: 'var(--color-fg-muted)' }}>
                duration の実測がこの値と同じなら未生成
              </td>
            </tr>
            <tr>
              <td style={{ ...monoStyle, color: 'var(--color-fg-muted)' }}>（素の要素）</td>
              <td style={monoStyle}>
                <span data-probe-id="easing-baseline" data-probe-prop="transitionTimingFunction" />
                {values['easing-baseline'] || '…'}
              </td>
              <td style={{ ...monoStyle, color: 'var(--color-fg-muted)' }}>—</td>
              <td style={{ ...cellStyle, color: 'var(--color-fg-muted)', fontSize: 12 }}>
                ベースライン
              </td>
              <td style={{ ...cellStyle, fontSize: 11, color: 'var(--color-fg-muted)' }}>
                easing の実測がこの値と同じなら未生成
              </td>
            </tr>
            {/*
             * Base UI は退出中の要素に data-ending-style 属性を立てる。
             * drawer / toast で「入りは easing.enter、出は easing.exit」を
             * `ease-enter data-ending-style:ease-exit` で表現しているので、
             * その修飾子が実際に発火するかをここで見る。属性を手で立てた
             * 要素に当てて計測する。
             */}
            <tr>
              <td style={monoStyle}>ease-enter data-ending-style:ease-exit</td>
              <td style={monoStyle}>
                <span
                  data-probe-id="ending-style-easing"
                  data-probe-prop="transitionTimingFunction"
                  data-ending-style=""
                  className="ease-enter data-ending-style:ease-exit"
                />
                {values['ending-style-easing'] || '…'}
              </td>
              <td style={monoStyle}>
                <span
                  data-probe-id="ending-style-ref"
                  data-probe-prop="transitionTimingFunction"
                  style={{ transitionTimingFunction: 'var(--primitive-easing-exit)' }}
                />
                {values['ending-style-ref'] || '…'}
              </td>
              <VerdictCell
                verdict={judge(
                  'transitionTimingFunction',
                  values['ending-style-easing'] ?? '',
                  values['ending-style-ref'] ?? '',
                )}
              />
              <td
                style={{
                  ...cellStyle,
                  fontSize: 11,
                  color: 'var(--color-fg-muted)',
                  whiteSpace: 'normal',
                }}
              >
                drawer.tsx / toast.tsx の退出方向。属性を立てた要素で修飾子の発火を確認する
              </td>
            </tr>
            {MOTION_ROWS.map((row) => {
              const prop =
                row.kind === 'duration' ? 'transitionDuration' : 'transitionTimingFunction';
              const u = values[`motion-u-${row.utility}`] ?? '';
              const r = values[`motion-r-${row.utility}`] ?? '';
              const baseline =
                row.kind === 'duration' ? values['motion-baseline'] : values['easing-baseline'];
              let verdict: Verdict = 'pending';
              if (u && r) {
                if (u === baseline && r !== baseline) verdict = 'missing';
                else verdict = u === r ? 'ok' : 'mismatch';
              }
              return (
                <tr key={row.utility}>
                  <td style={monoStyle}>{row.utility}</td>
                  <td style={monoStyle}>
                    <span
                      data-probe-id={`motion-u-${row.utility}`}
                      data-probe-prop={prop}
                      className={
                        row.kind === 'duration' ? `transition-all ${row.utility}` : row.utility
                      }
                    />
                    {u || '…'}
                  </td>
                  <td style={monoStyle}>
                    <span
                      data-probe-id={`motion-r-${row.utility}`}
                      data-probe-prop={prop}
                      className={row.kind === 'duration' ? 'transition-all' : undefined}
                      style={
                        row.kind === 'duration'
                          ? { transitionDuration: row.reference }
                          : { transitionTimingFunction: row.reference }
                      }
                    />
                    {r || '…'}
                  </td>
                  <VerdictCell verdict={verdict} />
                  <td
                    style={{
                      ...cellStyle,
                      fontSize: 11,
                      color: 'var(--color-fg-muted)',
                      whiteSpace: 'normal',
                    }}
                  >
                    {row.note ?? ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Section>

      {/* ── 4. アニメーション ───────────────────────────── */}
      <Section
        title="4. animation / @keyframes"
        description={
          <>
            <code>animation-name</code> は keyframes が定義されていなくても宣言された名前を
            そのまま返す。「クラスは生成されたが @keyframes が無い」状態を見逃さないため、 CSSOM
            を再帰的に辿って <code>CSSKeyframesRule</code> の実在も確認している。
          </>
        }
      >
        <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
          <thead>
            <tr>
              <Th>クラス</Th>
              <Th>使用箇所</Th>
              <Th>animation-name</Th>
              <Th>animation-duration</Th>
              <Th>@keyframes の実在</Th>
              <Th>判定</Th>
            </tr>
          </thead>
          <tbody>
            {ANIMATION_ROWS.map((row) => {
              const name = values[`anim-n-${row.utility}`] ?? '';
              const dur = values[`anim-d-${row.utility}`] ?? '';
              const kf = keyframes?.[row.keyframes];
              let verdict: Verdict = 'pending';
              if (name) {
                if (name === 'none') verdict = 'missing';
                else if (kf === false) verdict = 'mismatch';
                else if (kf === true) verdict = 'ok';
              }
              return (
                <tr key={row.utility}>
                  <td style={monoStyle}>{row.utility}</td>
                  <td style={{ ...cellStyle, fontSize: 11, color: 'var(--color-fg-muted)' }}>
                    {row.usedIn}
                  </td>
                  <td style={monoStyle}>
                    <span
                      data-probe-id={`anim-n-${row.utility}`}
                      data-probe-prop="animationName"
                      className={row.utility}
                    />
                    {name || '…'}
                  </td>
                  <td style={monoStyle}>
                    <span
                      data-probe-id={`anim-d-${row.utility}`}
                      data-probe-prop="animationDuration"
                      className={row.utility}
                    />
                    {dur || '…'}
                  </td>
                  <td style={monoStyle}>
                    {kf === undefined ? '…' : kf ? `✅ ${row.keyframes}` : `❌ ${row.keyframes}`}
                  </td>
                  <VerdictCell verdict={verdict} />
                </tr>
              );
            })}
          </tbody>
        </table>
      </Section>

      {/* ── 5. 取り込み品の実描画 ───────────────────────── */}
      <Section
        title="5. 取り込み品の実描画"
        description={
          <>
            表だけでは「クラスは解決するがコンポーネントが別の理由で壊れている」を拾えない。
            実際に描画して目視する。テーマを切り替えると全体が追随するはず。
          </>
        }
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-muted)',
            borderRadius: 'var(--primitive-radius-md)',
            padding: 20,
          }}
        >
          <div>
            <p style={{ fontSize: 11, color: 'var(--color-fg-muted)', marginBottom: 8 }}>
              Skeleton — bg-muted が面として見えるか
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          </div>

          <div>
            <p style={{ fontSize: 11, color: 'var(--color-fg-muted)', marginBottom: 8 }}>
              Spinner — 回っているか / 色が currentColor を拾うか
            </p>
            <div
              style={{
                display: 'flex',
                gap: 16,
                alignItems: 'center',
                color: 'var(--color-fg-muted)',
              }}
            >
              <Spinner />
              <Spinner className="size-6" />
              <span style={{ color: 'var(--color-accent-primary)' }}>
                <Spinner className="size-6" />
              </span>
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <p style={{ fontSize: 11, color: 'var(--color-fg-muted)', marginBottom: 8 }}>
              Accordion — 開閉アニメーションと境界線の色
            </p>
            <Accordion defaultValue={['a']}>
              <AccordionItem value="a">
                <AccordionTrigger>配送先を変更できますか</AccordionTrigger>
                {/*
                 * AccordionContent の残り props は Base UI の Panel へ流れる。
                 * animate-accordion-* が当たるのは Panel なので、probe 属性も
                 * ここに渡して実物の animation-name を読む。表側の
                 * ANIMATION_ROWS は「クラスと keyframes が存在するか」しか
                 * 見ておらず、実際の部品に当たっているかは別の話。
                 */}
                <AccordionContent
                  data-probe-id="accordion-panel"
                  data-probe-prop="animationDuration"
                >
                  出荷前であれば注文詳細から変更できます。出荷後はサポートまでご連絡ください。
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="b">
                <AccordionTrigger>請求書の発行タイミング</AccordionTrigger>
                <AccordionContent>
                  毎月末締めで翌営業日に発行します。締め日の変更は契約単位で設定できます。
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </Section>

      {/* ── 6. reduced motion ──────────────────────────── */}
      <Section
        title="6. prefers-reduced-motion"
        description={
          <>
            仕様書 §3.5 はプロバイダ層の <code>MotionConfig reducedMotion=&quot;user&quot;</code>{' '}
            で一括対応と定めているが、それは Motion が駆動するアニメーションにしか効かない。 CSS
            で描画される transition / animation はプロバイダの外側にあるため、グローバル CSS
            側の受け皿が要る。下は OS の設定を reduce にしたときの実測値。 受け皿が無ければ reduce
            にしても値が変わらない。
          </>
        }
      >
        <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
          <tbody>
            <tr>
              <td style={cellStyle}>matchMedia の判定</td>
              <td style={monoStyle}>{reducedMotion ? 'reduce' : 'no-preference'}</td>
            </tr>
            <tr>
              <td style={cellStyle}>
                <code>transition-all duration-300</code> の transition-duration
              </td>
              <td style={monoStyle}>
                <span
                  data-probe-id="rm-duration"
                  data-probe-prop="transitionDuration"
                  className="transition-all duration-300"
                />
                {values['rm-duration'] || '…'}
              </td>
            </tr>
            <tr>
              <td style={cellStyle}>
                <code>animate-spin</code> の animation-duration
              </td>
              <td style={monoStyle}>
                <span
                  data-probe-id="rm-anim-duration"
                  data-probe-prop="animationDuration"
                  className="animate-spin"
                />
                {values['rm-anim-duration'] || '…'}
              </td>
            </tr>
            <tr>
              <td style={cellStyle}>
                <code>animate-spin</code> の animation-iteration-count
              </td>
              <td style={monoStyle}>
                <span
                  data-probe-id="rm-anim-iter"
                  data-probe-prop="animationIterationCount"
                  className="animate-spin"
                />
                {values['rm-anim-iter'] || '…'}
              </td>
            </tr>
            {/*
             * Spinner は動きを消すだけにできない部品なので、代替表現へ
             * 差し替える仕組みを持つ。その3クラスがそれぞれ切り替わることを
             * 直接読む（Spinner の内部を覗かずに機構だけ検証する）。
             */}
            <tr>
              <td style={cellStyle}>
                Spinner: 回転アイコン <code>motion-reduce:hidden</code> の display
              </td>
              <td style={monoStyle}>
                <span
                  data-probe-id="rm-spin-icon"
                  data-probe-prop="display"
                  className="motion-reduce:hidden"
                />
                {values['rm-spin-icon'] || '…'}
              </td>
            </tr>
            <tr>
              <td style={cellStyle}>
                Spinner: 静止アイコン <code>hidden motion-reduce:block</code> の display
              </td>
              <td style={monoStyle}>
                <span
                  data-probe-id="rm-static-icon"
                  data-probe-prop="display"
                  className="hidden motion-reduce:block"
                />
                {values['rm-static-icon'] || '…'}
              </td>
            </tr>
            <tr>
              <td style={cellStyle}>
                Spinner: ラベル <code>sr-only motion-reduce:not-sr-only</code> の position
              </td>
              <td style={monoStyle}>
                <span
                  data-probe-id="rm-label"
                  data-probe-prop="position"
                  className="sr-only motion-reduce:not-sr-only"
                />
                {values['rm-label'] || '…'}
              </td>
            </tr>
            <tr>
              <td style={{ ...cellStyle, whiteSpace: 'normal', maxWidth: '60ch' }}>
                Accordion パネル（実物）の animation-duration
                <br />
                <span style={{ fontSize: 11, color: 'var(--color-fg-muted)' }}>
                  animation-<em>name</em> ではなく duration を読んでいる。Base UI は開閉して
                  いない状態のパネルに inline style で <code>animation-name: none</code>{' '}
                  を書くため、name を読むと「クラスが当たっていない」のか「静置中だから
                  none」なのか区別できない。duration は残るのでクラスの適用を確認できる。
                  実際に開閉させたときの計測（CDP 経由）では、展開が accordion-down / 240ms /
                  easing.enter、収縮が accordion-up / 240ms / easing.exit だった。
                </span>
              </td>
              <td style={monoStyle}>{values['accordion-panel'] || '…'}</td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/*
       * ── 機械可読な出力 ─────────────────────────────
       *
       * 表と同じ実測値を JSON でも出す。ヘッドレス Chrome の
       * `--dump-dom` で `#audit-json` を拾えば、ブラウザを人が
       * 見なくても解決値を取り出せる。表示は折りたたみ。
       */}
      <details style={{ fontSize: 12, color: 'var(--color-fg-muted)' }}>
        <summary style={{ cursor: 'pointer' }}>実測値の JSON（#audit-json）</summary>
        <pre
          id="audit-json"
          style={{
            fontFamily: 'var(--primitive-font-family-mono)',
            fontSize: 10,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            marginTop: 8,
          }}
        >
          {JSON.stringify({ theme, reducedMotion, keyframes, values }, null, 1)}
        </pre>
      </details>
    </div>
  );
}

const meta = {
  title: 'Foundations/Computed Style Audit',
  component: Audit,
  parameters: {
    layout: 'fullscreen',
    // 監査ページ自身がテーマごとの背景を描くため、addon の背景は外す
    backgrounds: { disable: true },
  },
  argTypes: {
    theme: { control: 'inline-radio', options: ['light', 'dark', 'deep-dark'] },
  },
  args: { theme: 'light' },
} satisfies Meta<typeof Audit>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Resolution: Story = { name: '解決値の一覧' };
export const Dark: Story = { name: '解決値の一覧（Dark）', args: { theme: 'dark' } };
export const DeepDark: Story = { name: '解決値の一覧（Deep dark）', args: { theme: 'deep-dark' } };
