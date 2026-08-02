import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';

import { ThemeProvider, useTheme } from '../components/ThemeProvider';
import { ThemeToggle } from '../components/ThemeToggle';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Badge } from '../components/Badge';

/**
 * ThemeProvider — テーマの適用と永続化
 *
 * 公開テーマは `light` / `dark` / `deep-dark` の3つ。利用者の選択肢はこれに
 * `system` を加えた4択で、`system` はテーマ名ではなく「OS に追随する」指示。
 * Dark 側の解決先は `dark`（`deep-dark` は明示選択のときだけ）。
 *
 * `dark-alt` は Dark surface の比較・コントラスト検証専用の属性の組み合わせで、
 * テーマとしては公開していない。
 */
const meta: Meta = { title: 'Foundations/ThemeProvider' };
export default meta;

function Switcher() {
  const { theme, resolvedTheme, systemTheme, mounted } = useTheme();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ThemeToggle />

      {/*
       * テーマ名を文字で見せる部分は mounted まで待つ。
       * SSR ではテーマが確定しないため、待たないとハイドレーション不一致になる。
       * ThemeToggle 自体は待たずに描画される（場所が動かないように）。
       */}
      <div style={{ fontSize: 13, color: 'var(--color-fg-muted)', minHeight: 20 }}>
        {mounted ? (
          <>
            選択: <code>{String(theme)}</code> / 解決後: <code>{String(resolvedTheme)}</code> / OS:{' '}
            <code>{String(systemTheme)}</code>
          </>
        ) : (
          '（マウント待ち）'
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>記事の詳細</CardTitle>
          <Badge variant="accent">選択中</Badge>
        </CardHeader>
        <CardContent>
          <p style={{ color: 'var(--color-fg-default)', margin: 0 }}>
            テーマを切り替えると、面・文字・境界線がすべてトークン経由で追随する。
          </p>
          <p style={{ color: 'var(--color-fg-muted)', margin: '8px 0 0' }}>
            補助テキスト。段差が保たれているかを見る。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/** 3テーマ＋system を切り替える */
export const Switching: StoryObj = {
  render: () => (
    <ThemeProvider>
      <div
        style={{
          background: 'var(--color-bg-page)',
          padding: 24,
          minHeight: 320,
          borderRadius: 8,
        }}
      >
        <Switcher />
      </div>
    </ThemeProvider>
  ),
};
