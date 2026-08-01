/**
 * WCAG コントラスト比 検証テーブル（表駆動）
 *
 * ここには **case の表と計算だけ** を置く。アサーションは
 * tests/contrast.test.ts にある。分けてあるのは、vitest のハーネス無しでも
 * 同じ表を検証できるようにするため（tsx から直接 import できる）。
 *
 * 報告書 docs/codex-investigation-report.md Q7 に従い、
 * case を `{ theme, role, fg, bg, threshold, rationale }` として持つ。
 *
 * 設計上の要点:
 *
 * 1. **3テーマ全部を同じ表で回す。** テーマ定義を引数にした表駆動にすることで、
 *    Light だけ検証されて Dark が素通りする状態を構造的に作れなくする。
 *    比較用の Dark surface バリアント（birch/800）も1つの変種として通す。
 *
 * 2. **例外は token 名の allowlist にしない。** 「この token は対象外」ではなく、
 *    「この **ペア** を、この **用途** で使うときだけ、この **WCAG 基準** により
 *    緩和する」という形で持つ。免除された case も計測は続け、実測値が
 *    floor を下回ったら失敗する（黙って悪化しない）。
 *
 * AA基準:
 *   - 通常テキスト: 4.5:1 以上（WCAG 1.4.3）
 *   - 非テキスト要素・グラフィカルオブジェクト: 3:1 以上（WCAG 1.4.11）
 */

import { themes, darkSurfaceAlt } from '@/tokens/semantic/colors';
import type { SemanticColorTheme } from '@/tokens/semantic/themeTypes';

// ─── Relative Luminance ─────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '');
  return [
    parseInt(cleaned.slice(0, 2), 16) / 255,
    parseInt(cleaned.slice(2, 4), 16) / 255,
    parseInt(cleaned.slice(4, 6), 16) / 255,
  ];
}

function linearize(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(linearize);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const lA = relativeLuminance(a);
  const lB = relativeLuminance(b);
  return (Math.max(lA, lB) + 0.05) / (Math.min(lA, lB) + 0.05);
}

// ─── Theme variants under test ──────────────────────────

/**
 * 検証対象のテーマ変種。
 * `dark-alt` は報告書 Q7 の比較案（surface = birch/800）。
 * 比較用であっても未検証のまま Storybook に出さないため、ここで一緒に通す。
 */
export const THEME_VARIANTS: Record<string, SemanticColorTheme> = {
  light: themes.light,
  dark: themes.dark,
  'dark-alt': darkSurfaceAlt,
  'deep-dark': themes['deep-dark'],
};

/** `'fg.default'` のようなパスでテーマから HEX を引く */
export function pick(theme: SemanticColorTheme, path: string): string {
  const [group, key] = path.split('.');
  const value = (theme as unknown as Record<string, Record<string, unknown>>)[group]?.[key];
  if (typeof value !== 'string') {
    throw new Error(`contrast: ${path} は HEX 文字列ではありません（${JSON.stringify(value)}）`);
  }
  return value;
}

// ─── Role table ─────────────────────────────────────────

export interface Role {
  /** 何の用途か。失敗メッセージにそのまま出る */
  role: string;
  fg: string;
  bg: string;
  threshold: number;
  /** 適用する WCAG 達成基準 */
  wcag: '1.4.3' | '1.4.11';
  /** なぜこの閾値なのか */
  rationale: string;
}

export const ROLES: Role[] = [
  // ── 読ませるテキスト（WCAG 1.4.3 / 4.5:1） ──
  ...['page', 'surface', 'sidebar', 'subtle', 'selected'].map((bg) => ({
    role: `本文テキスト on bg.${bg}`,
    fg: 'fg.default',
    bg: `bg.${bg}`,
    threshold: 4.5,
    wcag: '1.4.3' as const,
    rationale: '本文。あらゆる面の上で読めなければならない',
  })),
  ...['page', 'surface', 'subtle'].map((bg) => ({
    role: `二次テキスト on bg.${bg}`,
    fg: 'fg.secondary',
    bg: `bg.${bg}`,
    threshold: 4.5,
    wcag: '1.4.3' as const,
    rationale: '§0.7: fg.secondary は「読ませる」階調。bg.subtle 上の補助テキストはこれを使う',
  })),
  ...['page', 'surface'].map((bg) => ({
    role: `補助テキスト on bg.${bg}`,
    fg: 'fg.muted',
    bg: `bg.${bg}`,
    threshold: 4.5,
    wcag: '1.4.3' as const,
    rationale: '§0.7 運用ルール1: fg.muted は軸ラベル等「読ませる」もの。4.5:1 を満たす',
  })),
  {
    role: '補助テキスト on bg.subtle',
    fg: 'fg.muted',
    bg: 'bg.subtle',
    threshold: 4.5,
    wcag: '1.4.3',
    rationale: 'テーブル偶数行など、面が一段沈んだ領域に置かれる補助テキスト',
  },
  {
    role: '反転テキスト on bg.inverse',
    fg: 'fg.inverse',
    bg: 'bg.inverse',
    threshold: 4.5,
    wcag: '1.4.3',
    rationale: '反転面（トーストの濃色背景など）の本文',
  },
  ...['page', 'surface'].flatMap((bg) => [
    {
      role: `リンク on bg.${bg}`,
      fg: 'fg.link',
      bg: `bg.${bg}`,
      threshold: 4.5,
      wcag: '1.4.3' as const,
      rationale: 'リンクは本文中に現れるため通常テキスト基準',
    },
    {
      role: `リンク(hover) on bg.${bg}`,
      fg: 'fg.link-hover',
      bg: `bg.${bg}`,
      threshold: 4.5,
      wcag: '1.4.3' as const,
      rationale: 'hover 中も本文として読める必要がある',
    },
  ]),
  ...['primary', 'primary-hover', 'primary-active'].map((k) => ({
    role: `ボタン文字 on accent.${k}`,
    fg: 'accent.primary-fg',
    bg: `accent.${k}`,
    threshold: 4.5,
    wcag: '1.4.3' as const,
    rationale: '§0.6 判断1: on-primary は名前で白黒を固定せず、実測で決める',
  })),
  ...['danger', 'danger-hover', 'danger-active'].map((k) => ({
    role: `破壊的アクション文字 on accent.${k}`,
    fg: 'accent.danger-fg',
    bg: `accent.${k}`,
    threshold: 4.5,
    wcag: '1.4.3' as const,
    rationale: '削除ボタン等のラベル。hover・押下中も読めなければならない',
  })),

  // ── 非テキスト（WCAG 1.4.11 / 3:1） ──
  {
    role: 'プレースホルダー on bg.surface',
    fg: 'fg.placeholder',
    bg: 'bg.surface',
    threshold: 3,
    wcag: '1.4.11',
    rationale:
      '§0.7: プレースホルダーは入力済みテキストではないため 3:1。入力欄は surface 上に置く',
  },
  ...['page', 'surface'].map((bg) => ({
    role: `装飾要素 on bg.${bg}`,
    fg: 'fg.decorative',
    bg: `bg.${bg}`,
    threshold: 3,
    wcag: '1.4.11' as const,
    rationale:
      '§0.7 運用ルール1: fg.decorative は純装飾（区切り記号・装飾図形）専用。' +
      '意味のある文字には使用禁止。文字に使うと 1.4.3 の 4.5:1 を満たさない',
  })),
  ...['page', 'surface'].flatMap((bg) => [
    {
      role: `コントロール枠線 on bg.${bg}`,
      fg: 'border.strong',
      bg: `bg.${bg}`,
      threshold: 3,
      wcag: '1.4.11' as const,
      rationale:
        '§0.7 運用ルール2: 境界を伝える枠線は 3:1 必要。入力コントロールは border.strong を使う',
    },
    {
      role: `フォーカスリング on bg.${bg}`,
      fg: 'border.focus',
      bg: `bg.${bg}`,
      threshold: 3,
      wcag: '1.4.11' as const,
      rationale: 'フォーカス位置が見えないとキーボード操作が成立しない',
    },
    {
      role: `選択状態の枠線 on bg.${bg}`,
      fg: 'border.active',
      bg: `bg.${bg}`,
      threshold: 3,
      wcag: '1.4.11' as const,
      rationale: 'タブ下線・選択カードの枠は状態を伝える',
    },
    {
      role: `エラー枠線 on bg.${bg}`,
      fg: 'border.error',
      bg: `bg.${bg}`,
      threshold: 3,
      wcag: '1.4.11' as const,
      rationale: 'エラー状態を伝える枠線',
    },
    {
      role: `プライマリ面 on bg.${bg}`,
      fg: 'accent.primary',
      bg: `bg.${bg}`,
      threshold: 3,
      wcag: '1.4.11' as const,
      rationale: 'ボタンの塗りが背景から識別できる必要がある',
    },
  ]),
  {
    role: 'フォーカスリング on bg.subtle',
    fg: 'border.focus',
    bg: 'bg.subtle',
    threshold: 3,
    wcag: '1.4.11',
    rationale: 'focus ring は outline-offset で要素の外に出るため、沈んだ面の上にも載る',
  },

  // ── ステータス ──
  ...(['success', 'warning', 'danger', 'info'] as const).flatMap((s) => [
    {
      role: `status.${s} テキスト on status.${s}-bg`,
      fg: `status.${s}`,
      bg: `status.${s}-bg`,
      threshold: 4.5,
      wcag: '1.4.3' as const,
      rationale: 'アラート内の本文',
    },
    {
      role: `status.${s} テキスト on bg.surface`,
      fg: `status.${s}`,
      bg: 'bg.surface',
      threshold: 4.5,
      wcag: '1.4.3' as const,
      rationale: '状態テキストは通常面の上にも単独で置かれる',
    },
    {
      role: `status.${s}-fg on status.${s}-solid`,
      fg: `status.${s}-fg`,
      bg: `status.${s}-solid`,
      threshold: 4.5,
      wcag: '1.4.3' as const,
      rationale: 'ベタ塗りバッジ・トースト上のラベル',
    },
    {
      role: `status.${s}-solid on bg.surface`,
      fg: `status.${s}-solid`,
      bg: 'bg.surface',
      threshold: 3,
      wcag: '1.4.11' as const,
      rationale: 'ベタ塗りバッジが面から識別できる必要がある',
    },
    {
      role: `status.${s}-border on status.${s}-bg`,
      fg: `status.${s}-border`,
      bg: `status.${s}-bg`,
      threshold: 3,
      wcag: '1.4.11' as const,
      rationale: 'アラート領域の輪郭',
    },
  ]),

  // ── データ可視化 ──
  {
    role: 'dataViz.emphasis-positive on bg.surface',
    fg: 'dataViz.emphasis-positive',
    bg: 'bg.surface',
    threshold: 3,
    wcag: '1.4.11',
    rationale: '意味を担う唯一の系列。内容の理解に必要なグラフィカルオブジェクト',
  },
  {
    role: 'dataViz.axis-default on bg.surface',
    fg: 'dataViz.axis-default',
    bg: 'bg.surface',
    threshold: 3,
    wcag: '1.4.11',
    rationale: '軸はチャートの読み取り基準線',
  },
  {
    role: 'dataViz.heatmap-max on bg.surface',
    fg: 'dataViz.heatmap-max',
    bg: 'bg.surface',
    threshold: 3,
    wcag: '1.4.11',
    rationale: 'ヒートマップの最大値セルは必ず識別できる必要がある',
  },
  {
    role: 'dataViz.grid-default on bg.surface',
    fg: 'dataViz.grid-default',
    bg: 'bg.surface',
    threshold: 3,
    wcag: '1.4.11',
    rationale: 'グリッド線',
  },
  {
    role: 'dataViz.heatmap-empty on bg.surface',
    fg: 'dataViz.heatmap-empty',
    bg: 'bg.surface',
    threshold: 3,
    wcag: '1.4.11',
    rationale: '活動量ゼロのセル',
  },
  ...(
    [
      ['categorical-neutral-primary', '中立系列1'],
      ['categorical-neutral-secondary', '中立系列2'],
      ['categorical-neutral-previous', '中立系列3'],
    ] as const
  ).map(([key, label]) => ({
    role: `dataViz.${key} on bg.surface`,
    fg: `dataViz.${key}`,
    bg: 'bg.surface',
    threshold: 3,
    wcag: '1.4.11' as const,
    rationale: `${label}（§0.6「中立色のグラフ用3段階」）`,
  })),
];

// ─── Waivers ────────────────────────────────────────────

export interface Waiver {
  /** なぜこのペアだけ閾値を免除できるのか */
  reason: string;
  /** 免除しても下回ってはいけない実測下限。悪化したら失敗する */
  floor: number;
}

/**
 * 免除。**token 名ではなく (テーマ変種, 役割) のペア**で持つ。
 *
 * floor は全変種の実測値の最小値をもとに置いている。閾値を免除しても
 * 「今より悪くなったら気付く」ようにするための回帰ガード。
 */
export const WAIVERS: Record<string, Waiver> = {};

function waive(variants: string[], roles: string[], waiver: Waiver): void {
  for (const v of variants) {
    for (const r of roles) {
      WAIVERS[`${v}::${r}`] = waiver;
    }
  }
}

const ALL_VARIANTS = ['light', 'dark', 'dark-alt', 'deep-dark'];
const STATUSES = ['success', 'warning', 'danger', 'info'] as const;

// (1) アラート領域の輪郭線
waive(
  ALL_VARIANTS,
  STATUSES.map((s) => `status.${s}-border on status.${s}-bg`),
  {
    reason:
      'WCAG 1.4.11 は「UI コンポーネントや状態の識別に必要な視覚情報」を対象とする。' +
      'Kedama のステータスは色だけで伝えず必ずアイコン＋テキストを併用する（原則2）ため、' +
      'アラート領域の輪郭線は状態の識別に必要な要素ではなく、面の縁取りにとどまる。' +
      'コンポーネントの境界を伝える枠線（入力欄など）には border.strong を使うこと。',
    floor: 1.5,
  },
);

// (2) 中立系列（グラフ）
waive(
  ALL_VARIANTS,
  [
    'dataViz.categorical-neutral-primary on bg.surface',
    'dataViz.categorical-neutral-secondary on bg.surface',
    'dataViz.categorical-neutral-previous on bg.surface',
  ],
  {
    reason:
      '§0.6 が意図的に選んだ「中立色のグラフ用3段階」。意味を担うのは ' +
      'dataViz.emphasis-positive（3:1 を満たす）であり、中立系列は文脈の地。' +
      'WCAG 1.4.11 の対象は「内容の理解に必要なグラフィカルオブジェクト」であるため、' +
      '凡例・データラベル・軸を併記することを条件に地の系列は免除する。' +
      '中立系列だけで意味を区別させる図を作ってはならない。',
    floor: 1.2,
  },
);

// (3) グリッド線
waive(ALL_VARIANTS, ['dataViz.grid-default on bg.surface'], {
  reason:
    'グリッドは読み取りの補助であり、内容の理解に必須の情報を担わない（WCAG 1.4.11 の対象外）。' +
    '読み取り基準となる軸線 dataViz.axis-default は 3:1 を満たしている。',
  floor: 1.4,
});

// (4) ヒートマップの空セル
waive(ALL_VARIANTS, ['dataViz.heatmap-empty on bg.surface'], {
  reason:
    '「活動量ゼロ」を面に溶け込ませる設計そのもの（§0.6「活動量ゼロ＝背景に溶け込む極暗」）。' +
    'セルの存在は grid のセル間 gap で示され、値は tooltip とテキストで伝える。',
  floor: 1.0,
});

// (5) Dark 系での補助テキスト on bg.subtle
waive(['dark', 'dark-alt'], ['補助テキスト on bg.subtle'], {
  reason:
    'Dark 系では bg.subtle（birch/600）が中間調のため、fg.muted（birch/300）では 4.5:1 に届かない。' +
    '**このペアは使用禁止**とし、bg.subtle 上の補助テキストには fg.secondary を使う' +
    '（「二次テキスト on bg.subtle」が全テーマで 4.5:1 を満たすことを別 case で検証している）。' +
    'Light / Deep-dark では fg.muted のままで 4.5:1 を満たすため免除しない。',
  floor: 3.4,
});

// ─── Cases ──────────────────────────────────────────────

export interface ContrastCase extends Role {
  theme: string;
  waiver?: Waiver;
}

export const CASES: ContrastCase[] = Object.keys(THEME_VARIANTS).flatMap((theme) =>
  ROLES.map((role) => ({
    ...role,
    theme,
    waiver: WAIVERS[`${theme}::${role.role}`],
  })),
);
