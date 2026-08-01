import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/stories/**/*.mdx', '../src/stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: (config) => {
    config.optimizeDeps = config.optimizeDeps || {};
    config.optimizeDeps.exclude = [
      ...(config.optimizeDeps.exclude || []),
      '@storybook/addon-docs/blocks',
    ];

    /*
     * コンテナ内のブラウザから dev サーバへ到達できるようにする。
     *
     * Foundations/Computed Style Audit は getComputedStyle の実測を
     * レビューゲートにしているため、ヘッドレスブラウザから開けることが
     * 前提になる。Vite 6 は Host ヘッダがホスト名（IP リテラル以外）の
     * 場合 allowedHosts を照合し、未登録なら 403 を返す。
     *
     * dev サーバのみの設定で、配布物（dist）には影響しない。
     */
    config.server = config.server || {};
    config.server.allowedHosts = [
      ...(Array.isArray(config.server.allowedHosts) ? config.server.allowedHosts : []),
      'host.docker.internal',
    ];

    return config;
  },
};

export default config;
