import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { primitiveColors, semanticColors, isColorMix, type ColorValue } from '../tokens';

// ─── Primitive Reverse Lookup ───────────────────────────
// HEX値からプリミティブトークン名を逆引きするマップを構築

function buildPrimitiveLookup(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [paletteName, palette] of Object.entries(primitiveColors)) {
    for (const [step, hex] of Object.entries(palette as Record<string, string>)) {
      const normalized = hex.toLowerCase();
      // 同じHEXが複数あり得るが、最初に見つかったものを採用
      if (!map[normalized]) {
        map[normalized] = `${paletteName}/${step}`;
      }
    }
  }
  return map;
}

const primitiveLookup = buildPrimitiveLookup();

// ─── Color Swatch Component ─────────────────────────────

function Swatch({
  color,
  label,
  showReference,
}: {
  color: string;
  label: string;
  showReference?: boolean;
}) {
  const ref = showReference ? primitiveLookup[color.toLowerCase()] : undefined;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
      <div
        style={{
          width: '48px',
          height: '32px',
          backgroundColor: color,
          borderRadius: '4px',
          border: '1px solid rgba(0,0,0,0.08)',
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: '"Noto Sans Mono", monospace',
          fontSize: '12px',
          color: '#4B473D',
          minWidth: '140px',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: '"Noto Sans Mono", monospace',
          fontSize: '11px',
          color: '#858073',
          minWidth: '72px',
        }}
      >
        {color}
      </span>
      {ref && (
        <span
          style={{
            fontFamily: '"Noto Sans Mono", monospace',
            fontSize: '11px',
            color: '#315039',
            backgroundColor: '#EEF8F1',
            padding: '1px 8px',
            borderRadius: '4px',
          }}
        >
          ← {ref}
        </span>
      )}
      {showReference && !ref && (
        <span
          style={{
            fontFamily: '"Noto Sans Mono", monospace',
            fontSize: '11px',
            color: '#858073',
            fontStyle: 'italic',
          }}
        >
          （直値）
        </span>
      )}
    </div>
  );
}

function PaletteGroup({ name, palette }: { name: string; palette: Record<string, string> }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <h3
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '18px',
          fontWeight: 500,
          marginBottom: '12px',
          color: '#040302',
          textTransform: 'capitalize',
        }}
      >
        {name}
      </h3>
      {Object.entries(palette).map(([step, hex]) => (
        <Swatch key={step} color={hex} label={`${name}/${step}`} />
      ))}
    </div>
  );
}

// ─── Primitive Colors Story ─────────────────────────────

function PrimitiveColorsPage() {
  return (
    <div style={{ padding: '24px', fontFamily: '"Noto Sans JP", sans-serif' }}>
      <h2
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '32px',
          fontWeight: 700,
          marginBottom: '8px',
          color: '#040302',
        }}
      >
        プリミティブカラー
      </h2>
      <p style={{ color: '#676358', marginBottom: '32px', lineHeight: 1.6 }}>
        OKLCH色空間ベースの7色パレット × 11段階（25–900）。
        <br />
        純白 #FFFFFF は不使用。最も明るい面の色は birch/25（#F8F7F4）。
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '16px',
        }}
      >
        {Object.entries(primitiveColors).map(([name, palette]) => (
          <PaletteGroup key={name} name={name} palette={palette as Record<string, string>} />
        ))}
      </div>
    </div>
  );
}

const meta: Meta = {
  title: 'Tokens/Colors',
};
export default meta;

export const Primitive: StoryObj = {
  render: () => <PrimitiveColorsPage />,
};

// ─── Semantic Colors Story ──────────────────────────────

function SemanticSection({
  title,
  description,
  tokens,
}: {
  title: string;
  description: string;
  // 各グループは固有の interface（ForegroundColors 等）でキーが固定されており
  // index signature を持たないため object で受ける。
  // 値は HEX 文字列か、bg.scrim のようなプリミティブのアルファ合成（ColorMix）。
  tokens: object;
}) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <h3
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '18px',
          fontWeight: 500,
          marginBottom: '4px',
          color: '#040302',
        }}
      >
        {title}
      </h3>
      <p style={{ color: '#858073', fontSize: '13px', marginBottom: '12px' }}>{description}</p>
      {(Object.entries(tokens) as [string, ColorValue][]).map(([key, value]) => (
        <Swatch
          key={key}
          color={
            isColorMix(value)
              ? `color-mix(in srgb, ${value.mix.color} ${Math.round(value.mix.alpha * 100)}%, transparent)`
              : value
          }
          label={`${title.toLowerCase()}.${key}`}
          showReference
        />
      ))}
    </div>
  );
}

function SemanticColorsPage() {
  return (
    <div style={{ padding: '24px', fontFamily: '"Noto Sans JP", sans-serif' }}>
      <h2
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '32px',
          fontWeight: 700,
          marginBottom: '8px',
          color: '#040302',
        }}
      >
        セマンティックカラー
      </h2>
      <p style={{ color: '#676358', marginBottom: '32px', lineHeight: 1.6 }}>
        用途ベースのカラートークン。コンポーネントは必ずセマンティック経由で色を参照する。
      </p>
      <SemanticSection title="fg" description="テキスト・アイコンの色" tokens={semanticColors.fg} />
      <SemanticSection title="bg" description="背景色" tokens={semanticColors.bg} />
      <SemanticSection title="border" description="境界線の色" tokens={semanticColors.border} />
      <SemanticSection
        title="accent"
        description="アクション・ブランドカラー"
        tokens={semanticColors.accent}
      />
      <SemanticSection
        title="status"
        description="状態表示（success / warning / danger / info）"
        tokens={semanticColors.status}
      />
      <SemanticSection
        title="dataViz"
        description="データ可視化。チャート本体は Tier 2 だが色はここで統一する（仕様書 §4）"
        tokens={semanticColors.dataViz}
      />
    </div>
  );
}

export const Semantic: StoryObj = {
  render: () => <SemanticColorsPage />,
};
