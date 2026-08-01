import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Button } from '../components/Button';
import { Plus, ArrowRight } from '../components/Icon';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    children: 'ボタン',
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

// ─── 基本バリアント ─────────────────────────────────────

export const Primary: Story = {
  args: { variant: 'primary', children: '保存する' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'キャンセル' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', children: '詳細を見る' },
};

export const Danger: Story = {
  args: { variant: 'danger', children: '削除する' },
};

// ─── サイズ ─────────────────────────────────────────────

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

// ─── 全バリアント一覧 ───────────────────────────────────

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {(['primary', 'secondary', 'ghost', 'danger'] as const).map((variant) => (
        <div key={variant}>
          <p
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '14px',
              fontWeight: 600,
              color: '#315039',
              marginBottom: '8px',
              textTransform: 'capitalize',
            }}
          >
            {variant}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Button variant={variant} size="sm">
              Small
            </Button>
            <Button variant={variant} size="md">
              Medium
            </Button>
            <Button variant={variant} size="lg">
              Large
            </Button>
            <Button variant={variant} size="md" disabled>
              Disabled
            </Button>
            <Button variant={variant} size="md" loading>
              読込中
            </Button>
          </div>
        </div>
      ))}
    </div>
  ),
};

// ─── ローディング状態 ───────────────────────────────────

export const Loading: Story = {
  args: { loading: true, children: '保存中…' },
};

// ─── 無効状態 ───────────────────────────────────────────

export const Disabled: Story = {
  args: { disabled: true, children: '操作できません' },
};

// ─── アイコン付き ───────────────────────────────────────

export const WithIconLeft: Story = {
  args: {
    iconLeft: <Plus size={16} />,
    children: '新規作成',
  },
};

export const WithIconRight: Story = {
  args: {
    iconRight: <ArrowRight size={16} />,
    children: '次へ進む',
  },
};

export const WithIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      <Button iconLeft={<Plus size={16} />}>新規作成</Button>
      <Button variant="secondary" iconRight={<ArrowRight size={16} />}>
        次へ進む
      </Button>
      <Button variant="ghost" iconLeft={<Plus size={16} />}>
        追加する
      </Button>
      <Button variant="danger" iconLeft={<Plus size={16} />} loading>
        削除中…
      </Button>
    </div>
  ),
};
