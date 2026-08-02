import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';

import { RollingText } from '../components/RollingText';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

/**
 * RollingText — 値が変わった瞬間だけ文字をロールさせる
 *
 * `slot-text/style.css` は Kedama の配布 CSS に同梱済み。消費側の追加 import は不要。
 * `aria-live` は内蔵していないので、読み上げたい箇所では外から指定する。
 */
const meta: Meta<typeof RollingText> = {
  title: 'Components/RollingText',
  component: RollingText,
};
export default meta;

const STATUSES = ['確認待ち', '修正対応中', '承認済み', '公開済み'];

/** 状態が変わった瞬間だけ動く */
export const StatusChange: StoryObj = {
  render: function StatusStory() {
    const [i, setI] = React.useState(0);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button variant="secondary" onClick={() => setI((n) => (n + 1) % STATUSES.length)}>
          次の状態へ
        </Button>
        <Badge variant="accent">
          <RollingText text={STATUSES[i]} />
        </Badge>
      </div>
    );
  },
};

/** 文字数が変わる場合（幅の変化は slot-text 内部の固定値で動く） */
export const WidthChange: StoryObj = {
  render: function WidthStory() {
    const values = ['1', '42', '1,280', '98,765'];
    const [i, setI] = React.useState(0);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button variant="secondary" onClick={() => setI((n) => (n + 1) % values.length)}>
          件数を変える
        </Button>
        <span style={{ fontSize: 24, fontVariantNumeric: 'tabular-nums' }}>
          <RollingText text={values[i]} />
        </span>
        <span style={{ fontSize: 13, color: 'var(--color-fg-muted)' }}>件</span>
      </div>
    );
  },
};

/** 向きの指定 */
export const Direction: StoryObj = {
  render: function DirectionStory() {
    const [i, setI] = React.useState(0);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Button variant="secondary" onClick={() => setI((n) => n + 1)}>
          値を変える
        </Button>
        <div style={{ display: 'flex', gap: 32, fontSize: 20 }}>
          <span>
            down: <RollingText text={String(i)} />
          </span>
          <span>
            up: <RollingText text={String(i)} direction="up" />
          </span>
        </div>
      </div>
    );
  },
};

/** 計測用（静止） */
export const Static: StoryObj = {
  render: () => (
    <div style={{ fontSize: 20 }}>
      <RollingText text="公開済み" />
    </div>
  ),
};
