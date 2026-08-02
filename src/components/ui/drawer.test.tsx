import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from './drawer';

/**
 * Drawer は**唯一の汎用エッジパネル**（2026-08-02 確定・仕様書 §2.2）。
 * 左右・上下、スワイプ、スナップポイントを扱えるため Sheet の用途を包含し、
 * Sheet は廃止した。同じ役割の部品を2つ置かないための判断。
 *
 * Base UI Drawer に載せている理由は hideOthers・フォーカス／dismiss レイヤ・
 * Presence の unmount 保証（報告書 Q4）。ここで守るのは Kedama 側の契約だけで、
 * Base UI の内部実装は対象にしない。
 */
describe('Drawer', () => {
  it('renders its content when open', () => {
    render(
      <Drawer open>
        <DrawerContent>
          <DrawerTitle>詳細</DrawerTitle>
          <DrawerDescription>記事の詳細を表示する</DrawerDescription>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByText('詳細')).toBeInTheDocument();
    expect(screen.getByText('記事の詳細を表示する')).toBeInTheDocument();
  });

  it('renders nothing when closed（Presence の unmount 保証）', () => {
    render(
      <Drawer>
        <DrawerContent>
          <DrawerTitle>詳細</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.queryByText('詳細')).not.toBeInTheDocument();
  });

  it('uses the overlay elevation（primitive の段を直に書かない）', () => {
    const { baseElement } = render(
      <Drawer open>
        <DrawerContent>
          <DrawerTitle>詳細</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    const popup = baseElement.querySelector('[data-slot="drawer-popup"]');
    expect(popup).toBeInTheDocument();
    expect(popup?.className).toContain('shadow-overlay');
    expect(popup?.className).not.toMatch(/\bshadow-(sm|md|lg)\b/);
  });

  it('carries the expected slots', () => {
    const { baseElement } = render(
      <Drawer open>
        <DrawerContent>
          <DrawerTitle>詳細</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(baseElement.querySelector('[data-slot="drawer-content"]')).toBeInTheDocument();
    expect(baseElement.querySelector('[data-slot="drawer-popup"]')).toBeInTheDocument();
  });
});
