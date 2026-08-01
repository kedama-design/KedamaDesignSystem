import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { TextField } from '../components/TextField';

const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
};
export default meta;

type Story = StoryObj<typeof Modal>;

// ─── 基本 ───────────────────────────────────────────────

function BasicDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>モーダルを開く</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="お知らせ">
        <Modal.Body>
          <p
            style={{
              fontFamily: 'var(--primitive-font-family-body)',
              fontSize: 'var(--primitive-font-size-md)',
              lineHeight: 1.6,
              color: 'var(--color-fg-default)',
              margin: 0,
            }}
          >
            デザインシステムの新しいコンポーネントが追加されました。
            Storybookで詳細を確認してください。
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" size="sm" onClick={() => setOpen(false)}>
            了解
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export const Default: Story = {
  render: () => <BasicDemo />,
};

// ─── 確認ダイアログ ─────────────────────────────────────

function ConfirmDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        プロジェクトを削除
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="プロジェクトの削除"
        description="この操作は取り消せません。"
        size="sm"
      >
        <Modal.Body>
          <p
            style={{
              fontFamily: 'var(--primitive-font-family-body)',
              fontSize: 'var(--primitive-font-size-md)',
              lineHeight: 1.6,
              color: 'var(--color-fg-default)',
              margin: 0,
            }}
          >
            「Kedama Design System」を完全に削除しますか？ 関連するすべてのデータが失われます。
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button variant="danger" size="sm" onClick={() => setOpen(false)}>
            削除する
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export const ConfirmDialog: Story = {
  name: '確認ダイアログ',
  render: () => <ConfirmDemo />,
};

// ─── フォームモーダル ───────────────────────────────────

function FormDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>新規メンバーを招待</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="メンバーを招待" size="md">
        <Modal.Body>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <TextField label="メールアドレス" type="email" placeholder="user@example.com" />
            <TextField label="表示名" placeholder="山田 太郎" />
            <TextField
              label="メッセージ（任意）"
              placeholder="チームへようこそ！"
              helperText="招待メールに含まれます"
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button variant="primary" size="sm" onClick={() => setOpen(false)}>
            招待を送信
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export const FormModal: Story = {
  name: 'フォームモーダル',
  render: () => <FormDemo />,
};

// ─── サイズ比較 ─────────────────────────────────────────

function SizesDemo() {
  const [size, setSize] = useState<'sm' | 'md' | 'lg' | null>(null);
  return (
    <>
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button variant="secondary" size="sm" onClick={() => setSize('sm')}>
          Small
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setSize('md')}>
          Medium
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setSize('lg')}>
          Large
        </Button>
      </div>
      {size && (
        <Modal open onClose={() => setSize(null)} title={`サイズ: ${size}`} size={size}>
          <Modal.Body>
            <p
              style={{
                fontFamily: 'var(--primitive-font-family-body)',
                fontSize: 'var(--primitive-font-size-md)',
                lineHeight: 1.6,
                color: 'var(--color-fg-default)',
                margin: 0,
              }}
            >
              このモーダルは <strong>{size}</strong> サイズです。
              コンテンツの量に応じてサイズを選択してください。
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" size="sm" onClick={() => setSize(null)}>
              閉じる
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </>
  );
}

export const Sizes: Story = {
  name: 'サイズ比較',
  render: () => <SizesDemo />,
};
