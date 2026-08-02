import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { TextField } from '../components/TextField';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  decorators: [
    (Story) => (
      <div style={{ padding: '24px', backgroundColor: 'var(--color-bg-page)', minHeight: '300px' }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof Card>;

// ─── 基本 ───────────────────────────────────────────────

export const Default: Story = {
  render: () => (
    <Card style={{ maxWidth: '400px' }}>
      {/*
        構造は shadcn/ui に合わせてある（仕様書 §0.6 方針転換）。
        root は縦 padding だけを持ち、左右 padding は各パートが持つ。
        直下にコンテンツを置くと左右の余白が付かないので CardContent で包む。
      */}
      <CardContent>
        <p
          style={{
            color: 'var(--color-fg-default)',
            fontFamily: 'var(--primitive-font-family-body)',
          }}
        >
          シンプルなカードコンテナ。内容は CardContent で包みます。
        </p>
      </CardContent>
    </Card>
  ),
};

// ─── 正規 API（named exports・報告書 Q1） ───────────────

export const NamedExports: Story = {
  name: 'named exports（正規API）',
  render: () => (
    <Card style={{ maxWidth: '400px' }}>
      <CardHeader className="border-b border-border-muted">
        <CardTitle>プロジェクト概要</CardTitle>
        <Badge variant="success">稼働中</Badge>
      </CardHeader>
      <CardContent>
        <p
          style={{
            color: 'var(--color-fg-default)',
            fontFamily: 'var(--primitive-font-family-body)',
            lineHeight: 1.6,
          }}
        >
          区切り線は利用者が <code>border-b</code> / <code>border-t</code> を付けたときだけ
          余白が付きます。左右 padding を各パートが持つので、線はカードの全幅に伸びます。
        </p>
      </CardContent>
      <CardFooter className="border-t border-border-muted">
        <Button variant="ghost">キャンセル</Button>
        <Button variant="primary">保存する</Button>
      </CardFooter>
    </Card>
  ),
};

// ─── Header / Body / Footer ─────────────────────────────

export const WithSections: Story = {
  name: 'Header / Body / Footer',
  render: () => (
    <Card style={{ maxWidth: '400px' }}>
      <Card.Header>
        <h3
          style={{
            fontFamily: 'var(--primitive-font-family-heading)',
            fontSize: 'var(--primitive-font-size-2xl)',
            fontWeight: 500,
            color: 'var(--color-fg-default)',
            margin: 0,
          }}
        >
          プロジェクト概要
        </h3>
        <Badge variant="success">進行中</Badge>
      </Card.Header>
      <Card.Body>
        <p
          style={{
            fontFamily: 'var(--primitive-font-family-body)',
            fontSize: 'var(--primitive-font-size-md)',
            lineHeight: 1.6,
            color: 'var(--color-fg-default)',
            margin: 0,
          }}
        >
          Kedama Design Systemは、社内業務システム向けのReact + TypeScriptデザインシステムです。
          Calm UIの原則に基づき、穏やかで確かなインターフェースを提供します。
        </p>
      </Card.Body>
      <Card.Footer>
        <Button variant="ghost" size="sm">
          閉じる
        </Button>
        <Button variant="primary" size="sm">
          詳細を見る
        </Button>
      </Card.Footer>
    </Card>
  ),
};

// ─── noPadding ──────────────────────────────────────────

export const NoPadding: Story = {
  name: 'noPadding（テーブル用途）',
  render: () => (
    <Card noPadding style={{ maxWidth: '480px' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border-muted)' }}>
        <h3
          style={{
            fontFamily: 'var(--primitive-font-family-heading)',
            fontSize: 'var(--primitive-font-size-xl)',
            fontWeight: 500,
            color: 'var(--color-fg-default)',
            margin: 0,
          }}
        >
          最近のアクティビティ
        </h3>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {[
            { action: 'デザイントークン更新', user: '東森', time: '2分前' },
            { action: 'Buttonコンポーネント追加', user: 'Claude', time: '15分前' },
            { action: 'プロジェクト初期化', user: '東森', time: '1時間前' },
          ].map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--color-border-muted)' }}>
              <td
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  color: 'var(--color-fg-default)',
                  fontFamily: 'var(--primitive-font-family-body)',
                }}
              >
                {row.action}
              </td>
              <td
                style={{
                  padding: '10px 20px',
                  fontSize: '13px',
                  color: 'var(--color-fg-muted)',
                  fontFamily: 'var(--primitive-font-family-body)',
                }}
              >
                {row.user}
              </td>
              <td
                style={{
                  padding: '10px 20px',
                  fontSize: '12px',
                  color: 'var(--color-fg-placeholder)',
                  fontFamily: 'var(--primitive-font-family-mono)',
                  textAlign: 'right',
                }}
              >
                {row.time}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  ),
};

// ─── フォームカード ─────────────────────────────────────

export const FormCard: Story = {
  name: '使用例：フォームカード',
  render: () => (
    <Card style={{ maxWidth: '440px' }}>
      <Card.Header>
        <h3
          style={{
            fontFamily: 'var(--primitive-font-family-heading)',
            fontSize: 'var(--primitive-font-size-2xl)',
            fontWeight: 500,
            color: 'var(--color-fg-default)',
            margin: 0,
          }}
        >
          お問い合わせ
        </h3>
      </Card.Header>
      <Card.Body>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <TextField label="お名前" placeholder="山田 太郎" />
          <TextField label="メールアドレス" type="email" placeholder="taro@example.com" />
          <TextField label="件名" placeholder="お問い合わせ内容のタイトル" />
        </div>
      </Card.Body>
      <Card.Footer>
        <Button variant="ghost" size="sm">
          キャンセル
        </Button>
        <Button variant="primary" size="sm">
          送信する
        </Button>
      </Card.Footer>
    </Card>
  ),
};
