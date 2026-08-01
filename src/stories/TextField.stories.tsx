import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { TextField } from '../components/TextField';
import { Search, X } from '../components/Icon';

const meta: Meta<typeof TextField> = {
  title: 'Components/TextField',
  component: TextField,
  argTypes: {
    disabled: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<typeof TextField>;

// ─── 基本 ───────────────────────────────────────────────

export const Default: Story = {
  args: {
    label: 'メールアドレス',
    placeholder: 'example@kedama.co',
  },
};

export const WithHelperText: Story = {
  args: {
    label: '会社名',
    placeholder: '株式会社ケダマ',
    helperText: '正式名称を入力してください',
  },
};

export const WithError: Story = {
  args: {
    label: '電話番号',
    defaultValue: '12345',
    error: '電話番号の形式が正しくありません',
  },
};

export const Disabled: Story = {
  args: {
    label: 'ユーザーID',
    defaultValue: 'kedama-admin',
    disabled: true,
  },
};

// ─── アイコン付き ───────────────────────────────────────

export const WithLeadingIcon: Story = {
  args: {
    label: '検索',
    placeholder: 'キーワードを入力…',
    leadingIcon: <Search size={16} />,
  },
};

export const WithTrailingIcon: Story = {
  args: {
    label: 'フィルター',
    defaultValue: 'デザインシステム',
    trailingIcon: <X size={16} />,
  },
};

// ─── 全状態一覧 ─────────────────────────────────────────

export const AllStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '360px' }}>
      <TextField label="デフォルト" placeholder="入力してください" />
      <TextField label="入力済み" defaultValue="株式会社ケダマ" helperText="正式名称で入力" />
      <TextField label="フォーカス（クリックして確認）" placeholder="ここをクリック" />
      <TextField label="エラー" defaultValue="abc" error="数値を入力してください" />
      <TextField label="無効" defaultValue="変更できません" disabled />
      <TextField
        label="検索（アイコン付き）"
        placeholder="検索…"
        leadingIcon={<Search size={16} />}
      />
    </div>
  ),
};

// ─── フォーム使用例 ─────────────────────────────────────

export const FormExample: Story = {
  name: '使用例：登録フォーム',
  render: () => (
    <div
      style={{
        maxWidth: '400px',
        padding: '24px',
        backgroundColor: 'var(--color-bg-surface)',
        borderRadius: '8px',
        boxShadow: 'var(--primitive-shadow-sm)',
      }}
    >
      <h3
        style={{
          fontFamily: 'var(--primitive-font-family-heading)',
          fontSize: 'var(--primitive-font-size-2xl)',
          fontWeight: 500,
          marginBottom: '20px',
          color: 'var(--color-fg-default)',
        }}
      >
        アカウント登録
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <TextField label="氏名" placeholder="山田 太郎" />
        <TextField label="メールアドレス" type="email" placeholder="taro@example.com" />
        <TextField
          label="パスワード"
          type="password"
          placeholder="8文字以上"
          helperText="英数字と記号を含めてください"
        />
      </div>
    </div>
  ),
};
