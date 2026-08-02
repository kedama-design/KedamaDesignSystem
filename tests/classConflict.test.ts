import { describe, it, expect, beforeAll } from 'vitest';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { compile } from 'tailwindcss';
import { buttonVariants } from '../src/components/Button/Button';

/**
 * 「同じ CSS プロパティを触るクラスが同じ要素に重なっていない」ことを守る。
 *
 * ## なぜこれがあるのか
 *
 * `cn()` は clsx のみで **tailwind-merge を含まない**。上流 shadcn の `cn` は
 * `twMerge(clsx(...))` で「後から渡したクラスが先行クラスを打ち消す」が、
 * こちらにその働きは無い。したがってクラスが競合したとき、勝敗は class 属性の
 * 順序ではなく**生成 CSS の順序**で決まる。
 *
 * 実測（2026-08-02）: `px-4 px-2` も `px-2 px-4` も 16px になる。順序に関係なく
 * `px-4` が勝つ。上流ならどちらも `px-2` が勝つ。
 *
 * tailwind-merge は入れない判断をした（docs/proposal-tailwind-merge.md）。
 * 実測時点で上流と挙動が変わっている取り込み品が無かったこと、唯一の競合が
 * 取り込み品ではなく自作の Button ghost 由来だったこと、そして
 * extendTailwindMerge の設定がトークンと乖離すると別の silent failure を
 * 生むこと。**代わりに競合そのものを禁じ、それをこのテストで担保する。**
 *
 * このテストが落ちたときが、tailwind-merge を再検討するタイミングになる。
 *
 * ## 何を見ているか
 *
 * Tailwind 本体の `compile()` で実際に CSS を生成し、クラス1つずつが
 * **どの CSS プロパティを設定するか**をブラウザと同じ規則で調べる。
 * クラス名の文字列比較ではない。
 */

const ROOT = resolve(__dirname, '..');
const ENTRY = resolve(ROOT, 'src/styles/tailwind.css');

/**
 * `compiled.build()` は呼ぶたびに候補を**蓄積する**（2回目の戻り値には1回目の
 * クラスも含まれる）。そのため1クラスずつ調べるときはコンパイラを作り直す。
 * ファイルの読み込みだけキャッシュして繰り返しのコストを抑える。
 */
const fileCache = new Map<string, string>();

async function readCached(path: string): Promise<string> {
  const hit = fileCache.get(path);
  if (hit !== undefined) return hit;
  const content = await readFile(path, 'utf8');
  fileCache.set(path, content);
  return content;
}

async function freshBuild(): Promise<(candidates: string[]) => string> {
  const css = await readCached(ENTRY);
  const compiled = await compile(css, {
    base: dirname(ENTRY),
    loadStylesheet: async (id: string, base: string) => {
      // 相対 import（./tokens.css 等）
      if (id.startsWith('.')) {
        const path = resolve(base, id);
        return { path, base: dirname(path), content: await readCached(path) };
      }
      // `tailwindcss` / `tailwindcss/theme` などの本体側
      const rel = id === 'tailwindcss' ? 'index.css' : id.replace(/^tailwindcss\//, '') + '.css';
      const path = resolve(ROOT, 'node_modules/tailwindcss', rel);
      return { path, base: dirname(path), content: await readCached(path) };
    },
  });
  return (candidates: string[]) => compiled.build(candidates);
}

/** クラス → そのクラスが設定する CSS プロパティ名（beforeAll で埋める） */
const properties = new Map<string, Set<string>>();
/** 順序カナリア用に、全候補をまとめて生成した CSS */
let combinedCss = '';

/**
 * `build()` はテーマや base レイヤを含む**全文**を返すので、候補ゼロで生成した
 * ものとの差分（＝そのクラスが足した行）だけを見る。
 */
function addedProperties(baseLines: string[], css: string): Set<string> {
  const remaining = new Map<string, number>();
  for (const line of baseLines) remaining.set(line, (remaining.get(line) ?? 0) + 1);

  const props = new Set<string>();
  for (const line of css.split('\n')) {
    const left = remaining.get(line) ?? 0;
    if (left > 0) {
      remaining.set(line, left - 1);
      continue; // ベースにもある行 ＝ このクラス由来ではない
    }
    const name = /^\s*([a-z-]+)\s*:/.exec(line)?.[1];
    // カスタムプロパティ（--tw-*）は打ち消しの単位が異なるので対象外。
    // `syntax` / `inherits` は @property の記述子であって要素の宣言ではない。
    if (name && !name.startsWith('--') && !PROPERTY_DESCRIPTORS.has(name)) props.add(name);
  }
  return props;
}

function propertiesOf(candidate: string): Set<string> {
  const hit = properties.get(candidate);
  if (!hit) throw new Error(`未計測のクラス: ${candidate}（ALL_CANDIDATES に足す）`);
  return hit;
}

/**
 * バリアント接頭辞（`hover:` など）で分ける。
 * 接頭辞が違えば同じプロパティでも競合しない（状態が異なるため）。
 * 角括弧の中のコロンは接頭辞ではない。
 */
function variantPrefix(candidate: string): string {
  let depth = 0;
  let lastColon = -1;
  for (let i = 0; i < candidate.length; i++) {
    const ch = candidate[i];
    if (ch === '[' || ch === '(') depth++;
    else if (ch === ']' || ch === ')') depth--;
    else if (ch === ':' && depth === 0) lastColon = i;
  }
  return lastColon === -1 ? '' : candidate.slice(0, lastColon + 1);
}

/** `@property` の記述子。要素に効く宣言ではないので数えない */
const PROPERTY_DESCRIPTORS = new Set(['syntax', 'inherits', 'initial-value']);

/**
 * 重なっていても競合ではない組み合わせ。
 *
 * `transition-colors duration-fast ease-default` は Tailwind が意図している
 * 書き方で、`transition-*` は duration / timing-function の既定値も出す。
 * tailwind-merge でもこの3つは別グループなので打ち消されない。
 * つまり上流との挙動差は生じない。
 */
function isIntendedLayering(property: string, owners: string[]): boolean {
  const transitionDefaults = ['transition-duration', 'transition-timing-function'];
  if (
    transitionDefaults.includes(property) &&
    owners.some((c) => /^transition(-|$)/.test(c)) &&
    owners.every((c) => /^(transition|duration|ease)(-|$)/.test(c))
  ) {
    return true;
  }

  // `before:` / `after:` のユーティリティには Tailwind が必ず `content` を注ぎ込む。
  // 疑似要素を出すための仕掛けであって、重なっても打ち消し合う関係ではない。
  if (property === 'content' && owners.every((c) => /^(before|after):/.test(c))) {
    return true;
  }

  return false;
}

/** 同じ (接頭辞, プロパティ) を2つ以上のクラスが設定していたら競合 */
function findConflicts(classList: string): string[] {
  const classes = [...new Set(classList.split(/\s+/).filter(Boolean))];
  const owners = new Map<string, string[]>();

  for (const c of classes) {
    const prefix = variantPrefix(c);
    for (const prop of propertiesOf(c)) {
      const key = `${prefix}${prop}`;
      owners.set(key, [...(owners.get(key) ?? []), c]);
    }
  }

  return [...owners.entries()]
    .filter(([, cs]) => cs.length > 1)
    .filter(([key, cs]) => !isIntendedLayering(key.replace(/^.*:/, ''), cs))
    .map(([key, cs]) => `${key} ← ${cs.join(' / ')}`);
}

/**
 * 監視対象の3箇所。
 *
 * いずれも「取り込み品が Button に className を重ねる」場所であり、
 * tailwind-merge が無いことの影響を最初に受ける。
 * literal は取り込み品のソースそのままなので、ソースが変わったら
 * 下の「literal がソースと一致している」テストが落ちて気づける。
 */
const SITES = [
  {
    name: 'ToastClose（ui/toast.tsx）',
    file: 'src/components/ui/toast.tsx',
    button: buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
    literal:
      "relative shrink-0 text-muted-foreground after:absolute after:-inset-2 after:content-[''] hover:text-foreground",
  },
  {
    name: 'ToastAction（ui/toast.tsx）',
    file: 'src/components/ui/toast.tsx',
    button: buttonVariants({ variant: 'outline', size: 'sm' }),
    literal: 'shrink-0',
  },
  {
    name: 'SheetContent の閉じるボタン（ui/sheet.tsx）',
    file: 'src/components/ui/sheet.tsx',
    button: buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
    literal: 'absolute top-3 right-3',
  },
] as const;

/** 実測対象の全クラス（SITES の合成結果を分解したもの） */
const ALL_CANDIDATES = [
  ...new Set(SITES.flatMap((s) => `${s.button} ${s.literal}`.split(/\s+/)).filter(Boolean)),
  'text-fg-default',
  'text-muted-foreground',
];

beforeAll(async () => {
  const baseLines = (await freshBuild())([]).split('\n');

  for (const candidate of ALL_CANDIDATES) {
    const build = await freshBuild();
    properties.set(candidate, addedProperties(baseLines, build([candidate])));
  }

  combinedCss = (await freshBuild())(['text-fg-default', 'text-muted-foreground']);
}, 120_000);

describe('クラス競合（tailwind-merge を持たないことの担保）', () => {
  it.each(SITES)('$name に競合が無い', ({ button, literal }) => {
    const conflicts = findConflicts(`${button} ${literal}`);
    expect(
      conflicts,
      [
        '同じプロパティを複数のクラスが設定しています:',
        ...conflicts.map((c) => `  ${c}`),
        '',
        'cn() は tailwind-merge を含まないため、勝敗は class 属性の順序ではなく',
        '生成 CSS の順序で決まります（＝上流 shadcn と挙動が変わりうる）。',
        'どちらかを外して競合そのものを消してください。',
        '消せない競合なら docs/proposal-tailwind-merge.md を再検討する合図です。',
      ].join('\n'),
    ).toEqual([]);
  });

  it.each(SITES)('$name の literal がソースと一致している', ({ file, literal }) => {
    const src = readFileSync(resolve(ROOT, file), 'utf8');
    expect(src).toContain(literal);
  });

  /**
   * 歴史的な競合のカナリア。
   *
   * Button ghost はかつて `text-fg-default` を持っており、ToastClose の
   * `text-muted-foreground` と競合していた。当時は生成 CSS の順序が
   * たまたま twMerge と同じ結果（muted が勝つ）を返していた。
   * ghost から既定文字色を外して競合自体は解消したが、「順序で決まる」性質は
   * 残っている。順序が反転したらここで気づけるようにしておく。
   */
  it('text-muted-foreground が text-fg-default より後に生成される', () => {
    const iDefault = combinedCss.indexOf('.text-fg-default');
    const iMuted = combinedCss.indexOf('.text-muted-foreground');

    expect(iDefault, 'text-fg-default が生成されていない').toBeGreaterThan(-1);
    expect(iMuted, 'text-muted-foreground が生成されていない').toBeGreaterThan(-1);
    expect(
      iMuted,
      '生成順が反転しました。重なったときの勝者が変わるため、' +
        'tailwind-merge の再検討（docs/proposal-tailwind-merge.md）の合図です。',
    ).toBeGreaterThan(iDefault);
  });

  it('Button ghost は既定の文字色を持たない（競合の発生源を断つ）', () => {
    const ghost = buttonVariants({ variant: 'ghost', size: 'icon-sm' });
    const colorSetters = ghost
      .split(/\s+/)
      .filter(Boolean)
      .filter((c) => variantPrefix(c) === '' && propertiesOf(c).has('color'));

    expect(
      colorSetters,
      'ghost に文字色を持たせると、文字色を重ねる取り込み品と競合します',
    ).toEqual([]);
  });
});
