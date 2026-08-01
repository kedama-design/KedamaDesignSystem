import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { themes, darkSurfaceAlt } from '../tokens';

/**
 * Dark surface 比較 — birch/700 と birch/800
 *
 * 報告書 Q7「Dark surface を birch/700 から birch/800 へ下げる案を Storybook で
 * 比較し、本文階調の余地を優先する」への対応。
 *
 * **切り替わるのは surface だけ。page は birch/800 に固定。**
 *   - 既定（birch/700）: §0.6 ルール1「surface は bg より1段階明るい」。面が浮き上がる
 *   - alt （birch/800）: surface が page と同色になり、面の分離は
 *     border.muted のヘアラインだけが担う。本文階調の余地が広がる
 *
 * CSS 側の実体は tokens.css の `[data-theme='dark'][data-surface='alt']` で、
 * 上書きされるのは `--color-bg-surface` と `--color-bg-surface-raised` の2つだけ。
 */
const meta: Meta = {
  title: 'Foundations/Dark Surface Comparison',
  parameters: {
    backgrounds: { disable: true },
    docs: {
      description: {
        component:
          'Dark テーマの surface を birch/700（既定）と birch/800（alt）で並べて比較する。' +
          '切り替わるのは surface のみで page は birch/800 固定。' +
          'どちらを既定にするかを決めるためのページ。',
      },
    },
  },
};
export default meta;

// ─── 比較用のミニ画面 ───────────────────────────────────
// AppShell の骨格（sidebar / page / surface）に、面の差が出る要素を載せる。

function Panel({ variant, caption }: { variant: 'default' | 'alt'; caption: string }) {
  const surfaceHex = variant === 'alt' ? darkSurfaceAlt.bg.surface : themes.dark.bg.surface;

  return (
    <div style={{ flex: '1 1 420px', minWidth: '380px' }}>
      <div style={{ fontSize: '12.5px', fontWeight: 500, marginBottom: '2px' }}>{caption}</div>
      <div
        style={{
          fontFamily: 'var(--primitive-font-family-mono)',
          fontSize: '11px',
          color: '#676358',
          marginBottom: '8px',
        }}
      >
        bg.surface = {surfaceHex} / bg.page = {themes.dark.bg.page}
      </div>

      {/* data-theme をこの要素に付けることで、この枠の中だけ Dark になる */}
      <div
        data-theme="dark"
        data-surface={variant === 'alt' ? 'alt' : undefined}
        style={{
          display: 'flex',
          height: '440px',
          borderRadius: 'var(--primitive-radius-md)',
          overflow: 'hidden',
          border: '1px solid var(--color-border-muted)',
          background: 'var(--color-bg-page)',
          color: 'var(--color-fg-default)',
          fontFamily: 'var(--primitive-font-family-body)',
        }}
      >
        {/* ── サイドバー ── */}
        <aside
          style={{
            width: '148px',
            flexShrink: 0,
            background: 'var(--color-bg-sidebar)',
            borderRight: '1px solid var(--color-border-muted)',
            padding: '14px 10px',
          }}
        >
          <div
            style={{
              fontSize: '10.5px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--color-fg-muted)',
              margin: '0 6px 8px',
            }}
          >
            メニュー
          </div>
          {['ダッシュボード', 'サイト一覧', 'レポート'].map((label, i) => (
            <div
              key={label}
              style={{
                fontSize: '12.5px',
                padding: '6px 8px',
                borderRadius: 'var(--primitive-radius-sm)',
                marginBottom: '2px',
                background: i === 0 ? 'var(--color-bg-selected)' : 'transparent',
                color: i === 0 ? 'var(--color-fg-link)' : 'var(--color-fg-secondary)',
              }}
            >
              {label}
            </div>
          ))}
        </aside>

        {/* ── 本体（page の上に surface のカードを置く） ── */}
        <main style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
          <div
            style={{
              fontFamily: 'var(--primitive-font-family-heading)',
              fontSize: '18px',
              fontWeight: 500,
              marginBottom: '12px',
            }}
          >
            サイト診断
          </div>

          {/* surface のカード — ここが birch/700 か birch/800 かで見え方が変わる */}
          <div
            style={{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-muted)',
              borderRadius: 'var(--primitive-radius-md)',
              padding: '14px',
              marginBottom: '12px',
            }}
          >
            <div style={{ fontSize: '12.5px', marginBottom: '4px' }}>
              本文テキスト（fg.default）
            </div>
            <div
              style={{
                fontSize: '12.5px',
                color: 'var(--color-fg-secondary)',
                marginBottom: '4px',
              }}
            >
              二次テキスト（fg.secondary）
            </div>
            <div
              style={{ fontSize: '12.5px', color: 'var(--color-fg-muted)', marginBottom: '4px' }}
            >
              補助テキスト（fg.muted）
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--color-fg-decorative)' }}>
              装飾（fg.decorative・意味のある文字には使わない）
            </div>

            {/* 面の段差（subtle / subtle-strong / hover） */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
              {(
                [
                  ['subtle', 'var(--color-bg-subtle)'],
                  ['subtle-strong', 'var(--color-bg-subtle-strong)'],
                  ['hover', 'var(--color-bg-hover)'],
                ] as const
              ).map(([label, bg]) => (
                <div
                  key={label}
                  style={{
                    flex: 1,
                    background: bg,
                    borderRadius: 'var(--primitive-radius-sm)',
                    padding: '8px 6px',
                    fontSize: '10.5px',
                    textAlign: 'center',
                    color: 'var(--color-fg-secondary)',
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* surface-raised（モーダル相当）を page 上に直接置いて浮き方を見る */}
          <div
            style={{
              background: 'var(--color-bg-surface-raised)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--primitive-radius-md)',
              padding: '12px 14px',
              marginBottom: '12px',
            }}
          >
            <div style={{ fontSize: '12.5px', marginBottom: '8px' }}>
              surface-raised（モーダル相当）
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                style={{
                  background: 'var(--color-accent-primary)',
                  color: 'var(--color-accent-primary-fg)',
                  border: 'none',
                  borderRadius: 'var(--primitive-radius-sm)',
                  padding: '6px 12px',
                  fontSize: '12.5px',
                  fontWeight: 500,
                }}
              >
                保存する
              </button>
              <button
                type="button"
                style={{
                  background: 'var(--color-bg-surface)',
                  color: 'var(--color-fg-default)',
                  border: '1px solid var(--color-border-strong)',
                  borderRadius: 'var(--primitive-radius-sm)',
                  padding: '6px 12px',
                  fontSize: '12.5px',
                }}
              >
                キャンセル
              </button>
            </div>
          </div>

          {/* 入力コントロール — border.strong の見え方 */}
          <div
            style={{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-strong)',
              borderRadius: 'var(--primitive-radius-sm)',
              padding: '7px 10px',
              fontSize: '12.5px',
              color: 'var(--color-fg-placeholder)',
              marginBottom: '12px',
            }}
          >
            キーワードを入力…
          </div>

          {/* ステータス */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {(['success', 'warning', 'danger', 'info'] as const).map((s) => (
              <span
                key={s}
                style={{
                  background: `var(--color-status-${s}-bg)`,
                  color: `var(--color-status-${s})`,
                  border: `1px solid var(--color-status-${s}-border)`,
                  borderRadius: 'var(--primitive-radius-sm)',
                  padding: '3px 8px',
                  fontSize: '11px',
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

function ComparisonPage() {
  return (
    <div
      style={{
        padding: '24px',
        background: '#F0EEE9',
        color: '#040302',
        fontFamily: 'var(--primitive-font-family-body)',
        minHeight: '100vh',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--primitive-font-family-heading)',
          fontSize: '32px',
          fontWeight: 700,
          marginBottom: '8px',
        }}
      >
        Dark surface 比較
      </h2>
      <p style={{ color: '#4B473D', lineHeight: 1.6, marginBottom: '4px' }}>
        切り替わるのは <code>bg.surface</code>（と <code>surface-raised</code>）だけ。
        <code>bg.page</code> は birch/800 に固定。
      </p>
      <p style={{ color: '#4B473D', lineHeight: 1.6, marginBottom: '24px' }}>
        <strong>見るべき点</strong>：(1) カードが page から浮いて見えるか、(2)
        カード上の本文4階調（default / secondary / muted / decorative）が区別しやすいか、(3) alt
        でヘアラインだけの分離が成立しているか。
      </p>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <Panel variant="default" caption="既定 — surface = birch/700（§0.6 ルール1）" />
        <Panel variant="alt" caption="alt — surface = birch/800（page と同色・ヘアライン分離）" />
      </div>

      <p
        style={{
          marginTop: '24px',
          padding: '12px 14px',
          background: '#F8F7F4',
          border: '1px solid #C1BDB5',
          borderRadius: '8px',
          fontSize: '13px',
          lineHeight: 1.7,
          color: '#302E27',
        }}
      >
        <strong>切り替え方法</strong>：ルート要素に <code>data-theme=&quot;dark&quot;</code>{' '}
        を付けると既定（birch/700）。<code>data-surface=&quot;alt&quot;</code> を併記すると
        birch/800 になる。
        <br />
        実体は <code>tokens.css</code> の{' '}
        <code>[data-theme=&apos;dark&apos;][data-surface=&apos;alt&apos;]</code>{' '}
        で、上書きされるのは <code>--color-bg-surface</code> と{' '}
        <code>--color-bg-surface-raised</code> の2つだけ。
      </p>
    </div>
  );
}

export const Comparison: StoryObj = {
  render: () => <ComparisonPage />,
};
