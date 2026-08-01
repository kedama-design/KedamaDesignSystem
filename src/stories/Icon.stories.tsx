import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import {
  Search,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Download,
  Upload,
  Filter,
  RotateCcw,
  Check,
  AlertTriangle,
  AlertCircle,
  Info,
  CircleHelp,
  Loader2,
  Settings,
  User,
  Users,
  Mail,
  Bell,
  Calendar,
  FileText,
  Folder,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Menu,
  MoreHorizontal,
  MoreVertical,
  Grip,
} from '../components/Icon';
import type { LucideIcon } from 'lucide-react';

const meta: Meta = {
  title: 'Components/Icon',
};
export default meta;

type Story = StoryObj;

// ─── アイコン定義 ───────────────────────────────────────

const iconGroups: {
  title: string;
  titleJa: string;
  icons: { name: string; component: LucideIcon; label: string }[];
}[] = [
  {
    title: 'Navigation',
    titleJa: 'ナビゲーション',
    icons: [
      { name: 'Search', component: Search, label: '検索' },
      { name: 'X', component: X, label: '閉じる' },
      { name: 'ChevronDown', component: ChevronDown, label: '下' },
      { name: 'ChevronUp', component: ChevronUp, label: '上' },
      { name: 'ChevronLeft', component: ChevronLeft, label: '左' },
      { name: 'ChevronRight', component: ChevronRight, label: '右' },
      { name: 'ArrowLeft', component: ArrowLeft, label: '矢印左' },
      { name: 'ArrowRight', component: ArrowRight, label: '矢印右' },
      { name: 'ExternalLink', component: ExternalLink, label: '外部リンク' },
    ],
  },
  {
    title: 'Actions',
    titleJa: 'アクション',
    icons: [
      { name: 'Plus', component: Plus, label: '追加' },
      { name: 'Pencil', component: Pencil, label: '編集' },
      { name: 'Trash2', component: Trash2, label: '削除' },
      { name: 'Copy', component: Copy, label: 'コピー' },
      { name: 'Download', component: Download, label: 'ダウンロード' },
      { name: 'Upload', component: Upload, label: 'アップロード' },
      { name: 'Filter', component: Filter, label: 'フィルター' },
      { name: 'RotateCcw', component: RotateCcw, label: 'やり直し' },
    ],
  },
  {
    title: 'Status & Feedback',
    titleJa: 'ステータス・フィードバック',
    icons: [
      { name: 'Check', component: Check, label: '完了' },
      { name: 'AlertTriangle', component: AlertTriangle, label: '警告' },
      { name: 'AlertCircle', component: AlertCircle, label: 'エラー' },
      { name: 'Info', component: Info, label: '情報' },
      { name: 'CircleHelp', component: CircleHelp, label: 'ヘルプ' },
      { name: 'Loader2', component: Loader2, label: '読込中' },
    ],
  },
  {
    title: 'Objects',
    titleJa: 'オブジェクト',
    icons: [
      { name: 'Settings', component: Settings, label: '設定' },
      { name: 'User', component: User, label: 'ユーザー' },
      { name: 'Users', component: Users, label: 'チーム' },
      { name: 'Mail', component: Mail, label: 'メール' },
      { name: 'Bell', component: Bell, label: '通知' },
      { name: 'Calendar', component: Calendar, label: 'カレンダー' },
      { name: 'FileText', component: FileText, label: 'ドキュメント' },
      { name: 'Folder', component: Folder, label: 'フォルダ' },
      { name: 'Eye', component: Eye, label: '表示' },
      { name: 'EyeOff', component: EyeOff, label: '非表示' },
      { name: 'Lock', component: Lock, label: 'ロック' },
      { name: 'Unlock', component: Unlock, label: 'ロック解除' },
    ],
  },
  {
    title: 'Layout',
    titleJa: 'レイアウト',
    icons: [
      { name: 'Menu', component: Menu, label: 'メニュー' },
      { name: 'MoreHorizontal', component: MoreHorizontal, label: '他のアクション' },
      { name: 'MoreVertical', component: MoreVertical, label: '他のアクション' },
      { name: 'Grip', component: Grip, label: 'ドラッグ' },
    ],
  },
];

// ─── 全アイコン一覧 ─────────────────────────────────────

export const AllIcons: Story = {
  name: '全アイコン一覧',
  render: () => (
    <div style={{ padding: '24px' }}>
      <h2
        style={{
          fontFamily: 'var(--primitive-font-family-heading)',
          fontSize: '32px',
          fontWeight: 700,
          marginBottom: '8px',
          color: 'var(--color-fg-default)',
        }}
      >
        アイコン
      </h2>
      <p
        style={{
          fontFamily: 'var(--primitive-font-family-body)',
          color: 'var(--color-fg-muted)',
          marginBottom: '32px',
          lineHeight: 1.6,
        }}
      >
        Lucide React ベースのアイコンセット。stroke ベース、24×24 viewBox。
        <br />
        <code style={{ fontFamily: 'var(--primitive-font-family-mono)', fontSize: '13px' }}>
          {"import { Search, Plus } from '@kedama/design-system';"}
        </code>
      </p>

      {iconGroups.map((group) => (
        <div key={group.title} style={{ marginBottom: '32px' }}>
          <h3
            style={{
              fontFamily: 'var(--primitive-font-family-heading)',
              fontSize: '18px',
              fontWeight: 500,
              color: 'var(--color-fg-default)',
              marginBottom: '12px',
            }}
          >
            {group.titleJa}
            <span
              style={{
                color: 'var(--color-fg-muted)',
                fontWeight: 400,
                marginLeft: '8px',
                fontSize: '14px',
              }}
            >
              {group.title}
            </span>
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
              gap: '12px',
            }}
          >
            {group.icons.map(({ name, component: IconComp, label }) => (
              <div
                key={name}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '12px 8px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border-muted)',
                }}
              >
                <IconComp size={20} />
                <span
                  style={{
                    fontFamily: 'var(--primitive-font-family-mono)',
                    fontSize: '10px',
                    color: 'var(--color-fg-muted)',
                    textAlign: 'center',
                  }}
                >
                  {name}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--primitive-font-family-body)',
                    fontSize: '11px',
                    color: 'var(--color-fg-placeholder)',
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};

// ─── サイズ ─────────────────────────────────────────────

export const Sizes: Story = {
  name: 'サイズ',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px' }}>
      {[12, 16, 20, 24, 32, 40].map((size) => (
        <div key={size} style={{ textAlign: 'center' }}>
          <Search size={size} />
          <div
            style={{
              fontFamily: 'var(--primitive-font-family-mono)',
              fontSize: '11px',
              color: 'var(--color-fg-muted)',
              marginTop: '4px',
            }}
          >
            {size}px
          </div>
        </div>
      ))}
    </div>
  ),
};

// ─── カラー ─────────────────────────────────────────────

export const Colors: Story = {
  name: 'カラー',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px' }}>
      <Check size={24} className="text-[var(--color-status-success)]" />
      <AlertTriangle size={24} className="text-[var(--color-status-warning)]" />
      <AlertCircle size={24} className="text-[var(--color-status-danger)]" />
      <Info size={24} className="text-[var(--color-status-info)]" />
      <Settings size={24} className="text-fg-muted" />
      <User size={24} className="text-accent-primary" />
    </div>
  ),
};

// ─── Spinner ────────────────────────────────────────────

export const Spinner: Story = {
  name: 'ローディングスピナー',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px' }}>
      <Loader2 size={20} className="animate-spin text-fg-muted" />
      <Loader2 size={24} className="animate-spin text-accent-primary" />
      <Loader2 size={32} className="animate-spin text-[var(--color-status-info)]" />
    </div>
  ),
};
