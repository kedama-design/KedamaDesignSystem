import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Badge } from '../components/Badge';

const meta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  argTypes: {
    status: {
      control: 'select',
      options: ['default', 'success', 'warning', 'danger', 'info'],
    },
    appearance: {
      control: 'select',
      options: ['subtle', 'solid'],
    },
  },
  args: {
    children: 'ラベル',
  },
};
export default meta;

type Story = StoryObj<typeof Badge>;

// ─── 基本 ───────────────────────────────────────────────

export const Default: Story = {
  args: { status: 'default', children: 'デフォルト' },
};

export const Success: Story = {
  args: { status: 'success', children: '完了' },
};

export const Warning: Story = {
  args: { status: 'warning', children: '注意' },
};

export const Danger: Story = {
  args: { status: 'danger', children: 'エラー' },
};

export const Info: Story = {
  args: { status: 'info', children: '情報' },
};

// ─── Subtle（全ステータス一覧） ─────────────────────────

export const AllSubtle: Story = {
  name: 'Subtle（全ステータス）',
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Badge status="default" appearance="subtle">
        デフォルト
      </Badge>
      <Badge status="success" appearance="subtle">
        完了
      </Badge>
      <Badge status="warning" appearance="subtle">
        注意
      </Badge>
      <Badge status="danger" appearance="subtle">
        エラー
      </Badge>
      <Badge status="info" appearance="subtle">
        情報
      </Badge>
    </div>
  ),
};

// ─── Solid（全ステータス一覧） ──────────────────────────

export const AllSolid: Story = {
  name: 'Solid（全ステータス）',
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Badge status="default" appearance="solid">
        デフォルト
      </Badge>
      <Badge status="success" appearance="solid">
        完了
      </Badge>
      <Badge status="warning" appearance="solid">
        注意
      </Badge>
      <Badge status="danger" appearance="solid">
        エラー
      </Badge>
      <Badge status="info" appearance="solid">
        情報
      </Badge>
    </div>
  ),
};

// ─── アイコン付き ───────────────────────────────────────

function StatusDot({ color }: { color: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0,
      }}
      aria-hidden="true"
    />
  );
}

export const WithIcons: Story = {
  name: 'アイコン付き',
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Badge status="success" icon={<StatusDot color="var(--color-status-success)" />}>
        オンライン
      </Badge>
      <Badge status="warning" icon={<StatusDot color="var(--color-status-warning)" />}>
        保留中
      </Badge>
      <Badge status="danger" icon={<StatusDot color="var(--color-status-danger)" />}>
        オフライン
      </Badge>
      <Badge status="info" icon={<StatusDot color="var(--color-status-info)" />}>
        同期中
      </Badge>
    </div>
  ),
};

// ─── 使用例 ─────────────────────────────────────────────

export const UsageExample: Story = {
  name: '使用例：テーブル行のステータス',
  render: () => (
    <div
      style={{
        fontFamily: '"Noto Sans JP", sans-serif',
        maxWidth: '480px',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border-default)' }}>
            <th
              style={{
                textAlign: 'left',
                padding: '8px 12px',
                fontSize: '12px',
                color: 'var(--color-fg-muted)',
              }}
            >
              タスク名
            </th>
            <th
              style={{
                textAlign: 'left',
                padding: '8px 12px',
                fontSize: '12px',
                color: 'var(--color-fg-muted)',
              }}
            >
              ステータス
            </th>
          </tr>
        </thead>
        <tbody>
          {[
            { name: 'デザインレビュー', status: 'success' as const, label: '完了' },
            { name: 'API設計書の作成', status: 'warning' as const, label: '進行中' },
            { name: 'セキュリティ監査', status: 'danger' as const, label: '要対応' },
            { name: 'ドキュメント更新', status: 'info' as const, label: '予定' },
          ].map((row) => (
            <tr key={row.name} style={{ borderBottom: '1px solid var(--color-border-muted)' }}>
              <td
                style={{ padding: '10px 12px', fontSize: '14px', color: 'var(--color-fg-default)' }}
              >
                {row.name}
              </td>
              <td style={{ padding: '10px 12px' }}>
                <Badge status={row.status}>{row.label}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
};
