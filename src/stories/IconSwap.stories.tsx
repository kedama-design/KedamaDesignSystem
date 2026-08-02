import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';

import { IconSwap } from '../components/IconSwap';
import { Button } from '../components/Button';
import { Copy, Check } from '../components/Icon';

/**
 * IconSwap — 文脈に応じたアイコンの差し替え
 *
 * 装飾であって通知ではない。wrapper は常に `aria-hidden` で、
 * 変化そのものは**周囲のテキスト**が伝える。
 */
const meta: Meta<typeof IconSwap> = {
  title: 'Components/IconSwap',
  component: IconSwap,
};
export default meta;

/** 押すと切り替わる。読み上げは隣の `aria-live` が担う */
export const CopyToCheck: StoryObj = {
  render: function CopyStory() {
    const [copied, setCopied] = React.useState(false);

    React.useEffect(() => {
      if (!copied) return;
      const t = setTimeout(() => setCopied(false), 1600);
      return () => clearTimeout(t);
    }, [copied]);

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button variant="secondary" onClick={() => setCopied(true)}>
          <IconSwap active={copied} base={<Copy />} swap={<Check />} />
          URLをコピー
        </Button>
        {/*
         * 状態の通知はこちら。IconSwap は aria-hidden なので、
         * 動きだけが唯一の手掛かりにならないようにする。
         */}
        <span aria-live="polite" style={{ fontSize: 13, color: 'var(--color-fg-muted)' }}>
          {copied ? 'コピーしました' : ''}
        </span>
      </div>
    );
  },
};

/** 既定は 1em 四方。周囲の文字サイズに追従する */
export const FollowsFontSize: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      {[13, 16, 24, 32].map((size) => (
        <span key={size} style={{ fontSize: size, display: 'inline-flex', alignItems: 'center' }}>
          <IconSwap active base={<Copy />} swap={<Check />} />
        </span>
      ))}
    </div>
  ),
};

/** 両状態を並べて見る（計測用） */
export const BothStates: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, fontSize: 24 }}>
      <IconSwap active={false} base={<Copy />} swap={<Check />} />
      <IconSwap active base={<Copy />} swap={<Check />} />
    </div>
  ),
};
