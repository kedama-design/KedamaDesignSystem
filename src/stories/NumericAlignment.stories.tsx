import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { fontFamily, semanticTypography } from '../tokens';

/**
 * 数値の字幅揃え 検証ページ
 *
 * 「表の数値・KPI・軸ラベルを mono から本文フォント + tabular-nums へ
 * 変えられないか」を目視で判定するためのページ。
 *
 * 判定方法: 1,111 と 8,888 を縦に並べ、右端が揃うかを見る。
 * 赤い基準線は1行目の右端に引いてある。
 *
 * 2026-07-29 の実測結果（詳細は docs/phase-a1-token-decisions.md §4）:
 *   - Noto Sans JP   … 数字がもともと等幅。tabular-nums は no-op
 *   - DM Sans        … プロポーショナルかつ tnum 非対応。tabular-nums でも揃わない
 *   - Noto Sans Mono … 等幅（ただし桁揃えのために使う必要はない）
 */
const meta: Meta = {
  title: 'Foundations/Numeric Alignment',
  parameters: {
    docs: {
      description: {
        component:
          '数字の字幅揃えの検証。桁を揃えたい数値は fontFamily.numeric + tabular-nums' +
          '（= semanticTypography の numeric-*）で組む。' +
          'DM Sans は tnum を持たないため heading フォントで数値を組んではいけない。',
      },
    },
  },
};
export default meta;

const SAMPLES = ['1,111', '8,888', '1,111', '8,888'];
const ROW_HEIGHT = 42;

function Column({
  label,
  note,
  family,
  variant,
  verdict,
}: {
  label: string;
  note: string;
  family: string;
  variant: 'normal' | 'tabular-nums';
  verdict: 'aligned' | 'misaligned';
}) {
  const rowRefs = React.useRef<(HTMLSpanElement | null)[]>([]);
  const [ruleLeft, setRuleLeft] = React.useState<number | null>(null);

  // 1行目の実測幅に基準線を合わせる。Web フォント読み込み後にも再計測する。
  React.useLayoutEffect(() => {
    let cancelled = false;
    const place = () => {
      const first = rowRefs.current[0];
      if (!cancelled && first) setRuleLeft(first.getBoundingClientRect().width);
    };
    place();
    void document.fonts?.ready.then(place);
    return () => {
      cancelled = true;
    };
  }, [family, variant]);

  return (
    <div
      style={{
        border: '1px solid var(--color-border-muted)',
        borderRadius: 'var(--primitive-radius-md)',
        padding: '14px 16px',
        background: 'var(--color-bg-surface)',
      }}
    >
      <div
        style={{
          fontSize: '11.5px',
          fontWeight: 500,
          lineHeight: 1.5,
          color: 'var(--color-fg-default)',
          marginBottom: '2px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '10.5px',
          lineHeight: 1.5,
          color: 'var(--color-fg-muted)',
          marginBottom: '10px',
          height: '32px',
        }}
      >
        {note}
      </div>

      <div style={{ position: 'relative', display: 'inline-block' }}>
        {SAMPLES.map((text, i) => (
          <div key={i} style={{ height: `${ROW_HEIGHT}px` }}>
            <span
              ref={(el) => {
                rowRefs.current[i] = el;
              }}
              style={{
                display: 'inline-block',
                fontFamily: family,
                fontVariantNumeric: variant,
                fontSize: '32px',
                fontWeight: 500,
                color: 'var(--color-fg-default)',
              }}
            >
              {text}
            </span>
          </div>
        ))}
        {ruleLeft !== null && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 0,
              left: `${ruleLeft}px`,
              height: `${SAMPLES.length * ROW_HEIGHT}px`,
              width: '1px',
              background: 'var(--color-border-error)',
            }}
          />
        )}
      </div>

      <div
        style={{
          marginTop: '10px',
          fontSize: '11.5px',
          fontWeight: 500,
          color:
            verdict === 'aligned' ? 'var(--color-status-success)' : 'var(--color-status-danger)',
        }}
      >
        {verdict === 'aligned' ? '✓ 桁が揃う' : '✗ 桁が揃わない'}
      </div>
    </div>
  );
}

function Page() {
  return (
    <div
      style={{
        padding: '24px',
        background: 'var(--color-bg-page)',
        fontFamily: 'var(--primitive-font-family-body)',
        color: 'var(--color-fg-default)',
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
        数値の字幅揃え
      </h2>
      <p style={{ color: 'var(--color-fg-muted)', marginBottom: '8px', lineHeight: 1.6 }}>
        <code>1,111</code> と <code>8,888</code> を縦に並べ、右端が赤い基準線に揃うかで判定する。
        基準線は1行目の右端。
      </p>
      <p style={{ color: 'var(--color-fg-muted)', marginBottom: '24px', lineHeight: 1.6 }}>
        <strong>結論</strong>：桁を揃えたい数値は <code>fontFamily.numeric</code> +{' '}
        <code>tabular-nums</code>（= <code>numeric-sm / md / xl</code>）で組む。
        <strong>DM Sans は tnum を持たないため、heading フォントで数値を組まないこと。</strong>
      </p>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Column
          label="fontFamily.numeric（採用）"
          note="Noto Sans JP + tabular-nums"
          family={fontFamily.numeric}
          variant="tabular-nums"
          verdict="aligned"
        />
        <Column
          label="fontFamily.body"
          note="Noto Sans JP。既定のまま（数字がもともと等幅）"
          family={fontFamily.body}
          variant="normal"
          verdict="aligned"
        />
        <Column
          label="fontFamily.heading ✗"
          note="DM Sans。既定はプロポーショナル"
          family={fontFamily.heading}
          variant="normal"
          verdict="misaligned"
        />
        <Column
          label="fontFamily.heading + tnum ✗"
          note="DM Sans は tnum 非対応のため変化しない"
          family={fontFamily.heading}
          variant="tabular-nums"
          verdict="misaligned"
        />
        <Column
          label="fontFamily.mono"
          note="Noto Sans Mono。揃うが字面が本文と離れる"
          family={fontFamily.mono}
          variant="normal"
          verdict="aligned"
        />
      </div>

      <h3
        style={{
          fontFamily: 'var(--primitive-font-family-heading)',
          fontSize: '21px',
          fontWeight: 500,
          margin: '40px 0 12px',
        }}
      >
        セマンティックトークン
      </h3>
      <table style={{ borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: 'var(--color-fg-muted)' }}>
            <th style={{ padding: '6px 16px 6px 0' }}>トークン</th>
            <th style={{ padding: '6px 16px 6px 0' }}>用途</th>
            <th style={{ padding: '6px 16px 6px 0' }}>見本</th>
          </tr>
        </thead>
        <tbody>
          {(
            [
              ['numeric-sm', 'チャート軸ラベル・高密度テーブル'],
              ['numeric-md', '表の数値（既定）'],
              ['numeric-xl', 'KPI・主役の数値'],
            ] as const
          ).map(([name, use]) => {
            const s = semanticTypography[name];
            return (
              <tr key={name} style={{ borderTop: '1px solid var(--color-border-muted)' }}>
                <td
                  style={{
                    padding: '10px 16px 10px 0',
                    fontFamily: 'var(--primitive-font-family-mono)',
                    verticalAlign: 'top',
                  }}
                >
                  {name}
                </td>
                <td
                  style={{
                    padding: '10px 16px 10px 0',
                    color: 'var(--color-fg-muted)',
                    verticalAlign: 'top',
                  }}
                >
                  {use}
                </td>
                <td style={{ padding: '10px 16px 10px 0' }}>
                  <div
                    style={{
                      fontFamily: s.fontFamily,
                      fontSize: s.fontSize,
                      fontWeight: s.fontWeight,
                      lineHeight: s.lineHeight,
                      letterSpacing: s.letterSpacing,
                      fontVariantNumeric: s.fontVariantNumeric,
                      textAlign: 'right',
                      width: '7em',
                    }}
                  >
                    <div>1,111</div>
                    <div>8,888</div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export const Verification: StoryObj = {
  render: () => <Page />,
};
