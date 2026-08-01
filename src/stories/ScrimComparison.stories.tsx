import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';

/**
 * スクリム比較 — 10% と bg.scrim（50%）
 *
 * **決着済み（2026-08-01）。このページは判断の根拠を残すためのもの。**
 *
 *   スクリム → `bg.scrim`（birch/900 を 50%）に統一。`bg.scrim-subtle` は作らない
 *   ブラー   → 既定オフ
 *
 * 経緯は docs/phase-a2-decisions.md。
 *
 * ## 何を比べていたか
 *
 * 取り込んだ Sheet / Drawer は上流で `bg-black/10` を使っていた。純黒は Kedama に
 * 存在しない（純白・純黒は定義しない）ため除去は無条件で確定していたが、
 * 10% → 50% は見た目が大きく変わるので、濃さは並べて判断した。
 *
 * 3案を並べたことで分かったのは、**10% では純黒と birch/900 の区別が視覚的に
 * つかない**こと。つまり「純黒の除去」は見た目を変えず、判断すべきは濃さだけだった。
 * そして 10% はモーダルとして機能していない——Light では背面のリストがそのまま読め、
 * Dark ではほぼ何も起きていない。フォーカスを閉じ込めて背面を不活性化しておきながら
 * 見た目は「触れそう」なままで、挙動と外観が食い違っていた。
 *
 * ## ブラーについて
 *
 * ブラーあり・なしの両方を残してある。**既定オフに決まった理由**は2つ:
 *
 *   1. 50% 単独で目的を達している。blur なしでも背面が不活性であることは明確に
 *      伝わる。blur は必要な機能を足すのではなく「さらに読めなくする」だけだった
 *   2. 全画面要素の backdrop-filter は GPU 負荷が高く、大きなテーブルを背面に持つ
 *      業務画面では体感の引っかかりになり得る
 *
 * 決着前の実測では、ブラーは効いており、しかも強さが2種類あった:
 *   Modal          `backdrop-blur-[var(--primitive-backdrop-blur)]` → blur(8px)
 *   Sheet / Drawer `supports-backdrop-filter:backdrop-blur-xs`      → blur(4px)
 * どちらも外して解消している。
 */

type Theme = 'light' | 'dark' | 'deep-dark';

interface ScrimSpec {
  label: string;
  /** スクリムの背景色（CSS） */
  background: string;
  note: string;
}

/**
 * 比較した3案。
 *
 * 10% の純黒は「上流が実際に書いていた値」の再現。その隣に birch/900 10% を
 * 置くことで、「純黒の除去」と「濃さの変更」を切り分けて判断できるようにした。
 * 結果、この2つは視覚的に区別がつかず、判断すべきは濃さだけだと分かった。
 */
const SCRIMS: ScrimSpec[] = [
  {
    label: '不採用 — 上流のまま black 10%',
    background: 'color-mix(in srgb, #000000 10%, transparent)',
    note: '純黒。Kedama には存在しない色。加えて 10% ではモーダルとして機能していない',
  },
  {
    label: '不採用 — birch/900 10%',
    background: 'color-mix(in srgb, var(--primitive-color-birch-900) 10%, transparent)',
    note: '純黒をやめただけの案。左と見分けがつかない＝純黒の除去は見た目を変えない、の証拠',
  },
  {
    label: '★ 採用 — bg.scrim（birch/900 50%）',
    background: 'var(--color-bg-scrim)',
    note: 'Modal が元から使っていた値。Sheet / Drawer もここへ統一し、システム内でスクリムは1種類',
  },
];

/** 背面に敷く「業務画面らしい」中身。スクリム越しに何がどれだけ見えるかを判断する。 */
function BackdropContent() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--color-bg-page)',
        color: 'var(--color-fg-default)',
        fontFamily: 'var(--primitive-font-family-body)',
        padding: 14,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--primitive-font-family-heading)',
          fontSize: 16,
          fontWeight: 500,
          marginBottom: 10,
        }}
      >
        サイト診断一覧
      </div>

      {/* 表 — 罫線とテキストがスクリム越しにどう見えるか */}
      <div
        style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-muted)',
          borderRadius: 'var(--primitive-radius-md)',
          overflow: 'hidden',
          marginBottom: 10,
        }}
      >
        {[
          ['株式会社あさひ', '完了', 'success'],
          ['みどり工業', '確認待ち', 'warning'],
          ['たけうち商店', '失敗', 'danger'],
          ['なかむら製作所', '実行中', 'info'],
        ].map(([name, status, tone], i) => (
          <div
            key={name}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '7px 10px',
              fontSize: 12,
              borderTop: i === 0 ? 'none' : '1px solid var(--color-border-muted)',
            }}
          >
            <span>{name}</span>
            <span
              style={{
                background: `var(--color-status-${tone}-bg)`,
                color: `var(--color-status-${tone})`,
                border: `1px solid var(--color-status-${tone}-border)`,
                borderRadius: 'var(--primitive-radius-sm)',
                padding: '2px 7px',
                fontSize: 10.5,
              }}
            >
              {status}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <span
          style={{
            background: 'var(--color-accent-primary)',
            color: 'var(--color-accent-primary-fg)',
            borderRadius: 'var(--primitive-radius-sm)',
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          新規診断
        </span>
        <span
          style={{
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--primitive-radius-sm)',
            padding: '6px 12px',
            fontSize: 12,
          }}
        >
          書き出し
        </span>
      </div>
    </div>
  );
}

/** スクリム1案 × ブラー有無 の1枚 */
function ScrimCell({ spec, blur }: { spec: ScrimSpec; blur: string | null }) {
  return (
    <div style={{ flex: '1 1 300px', minWidth: 280 }}>
      <div style={{ fontSize: 12.5, fontWeight: 500, marginBottom: 2 }}>{spec.label}</div>
      <div
        style={{
          fontFamily: 'var(--primitive-font-family-mono)',
          fontSize: 10.5,
          color: 'var(--color-fg-muted)',
          marginBottom: 6,
        }}
      >
        {blur ? `backdrop-filter: blur(${blur})` : 'ブラーなし'}
      </div>

      <div
        style={{
          position: 'relative',
          height: 260,
          borderRadius: 'var(--primitive-radius-md)',
          overflow: 'hidden',
          border: '1px solid var(--color-border-muted)',
        }}
      >
        <BackdropContent />

        {/* スクリム */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: spec.background,
            backdropFilter: blur ? `blur(${blur})` : undefined,
          }}
        />

        {/* 前面のパネル（Sheet 相当） */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '58%',
            background: 'var(--color-bg-surface-raised)',
            borderLeft: '1px solid var(--color-border-default)',
            boxShadow: 'var(--primitive-shadow-lg)',
            padding: 14,
            color: 'var(--color-fg-default)',
            fontFamily: 'var(--primitive-font-family-body)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--primitive-font-family-heading)',
              fontSize: 14,
              fontWeight: 500,
              marginBottom: 6,
            }}
          >
            診断の設定
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--color-fg-secondary)', lineHeight: 1.7 }}>
            クロール深度と対象パスを指定します。実行中は結果が随時更新されます。
          </div>
          <div
            style={{
              marginTop: 10,
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-strong)',
              borderRadius: 'var(--primitive-radius-sm)',
              padding: '6px 9px',
              fontSize: 11.5,
              color: 'var(--color-fg-placeholder)',
            }}
          >
            /products/ 以下
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: 10.5,
          color: 'var(--color-fg-muted)',
          lineHeight: 1.6,
          marginTop: 6,
          maxWidth: '40ch',
        }}
      >
        {spec.note}
      </div>
    </div>
  );
}

function ScrimPage({ theme = 'dark', blur = null }: { theme?: Theme; blur?: string | null }) {
  // 実運用と同じくルート要素にテーマを置く（非 inline の @theme 変数を正しく解決させるため）
  React.useLayoutEffect(() => {
    const el = document.documentElement;
    const previous = el.dataset.theme;
    el.dataset.theme = theme;
    return () => {
      if (previous === undefined) delete el.dataset.theme;
      else el.dataset.theme = previous;
    };
  }, [theme]);

  return (
    <div
      style={{
        background: 'var(--color-bg-page)',
        color: 'var(--color-fg-default)',
        fontFamily: 'var(--primitive-font-family-body)',
        padding: 24,
        minHeight: '100vh',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--primitive-font-family-heading)',
          fontSize: 26,
          fontWeight: 500,
          marginBottom: 6,
        }}
      >
        スクリム比較 — {theme} / {blur ? `blur(${blur})` : 'ブラーなし'}
      </h2>
      <p
        style={{
          fontSize: 13,
          color: 'var(--color-fg-muted)',
          lineHeight: 1.7,
          maxWidth: '76ch',
          marginBottom: 20,
        }}
      >
        Sheet / Drawer は既定でモーダル（フォーカスを閉じ込め、背面を不活性化する）。
        遮断しているという事実が見た目に出ているか、同時に背面の状況がうっすら残るかを見る。
      </p>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {SCRIMS.map((spec) => (
          <ScrimCell key={spec.label} spec={spec} blur={blur} />
        ))}
      </div>
    </div>
  );
}

const meta = {
  title: 'Foundations/Scrim Comparison',
  component: ScrimPage,
  parameters: { layout: 'fullscreen', backgrounds: { disable: true } },
  argTypes: {
    theme: { control: 'inline-radio', options: ['light', 'dark', 'deep-dark'] },
    blur: { control: 'inline-radio', options: [null, '4px', '8px'] },
  },
  args: { theme: 'dark', blur: null },
} satisfies Meta<typeof ScrimPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DarkNoBlur: Story = { name: 'Dark / ブラーなし', args: { theme: 'dark', blur: null } };
export const DarkBlur8: Story = {
  name: 'Dark / blur 8px（Modal の現状）',
  args: { theme: 'dark', blur: '8px' },
};
export const LightNoBlur: Story = {
  name: 'Light / ブラーなし',
  args: { theme: 'light', blur: null },
};
export const LightBlur8: Story = {
  name: 'Light / blur 8px',
  args: { theme: 'light', blur: '8px' },
};
