import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/stories/**/*.mdx', '../src/stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials'],

  /*
   * `public/` をそのまま配信する。**Tier 2 レジストリの配信経路がこれ。**
   *
   * `pnpm build:registry`（= `shadcn build`）が `public/r/*.json` を出し、
   * ここを経由して `storybook-static/r/*.json` に入る。GitHub Pages に載れば
   * `https://kedama-design.github.io/KedamaDesignSystem/r/app-shell.json` で
   * 引けるようになり、消費側は `shadcn add <その URL>` で取り込める。
   * （こちらで検証するときは固定版を使う: `pnpm dlx shadcn@4.16.1 add <URL>`。
   *   `npx` や `@latest` だと版が動き、何を確かめたのかが残らない）
   *
   * つまり Storybook のホスティングが、そのままレジストリの配信元を兼ねる
   * （仕様書 §2.1「ショーケースサイトと同一デプロイ」の最小構成）。
   * `apps/showcase` を作ったら、配信元を移すか併存させるかを決める。
   *
   * ⚠️ `public/r/` は .gitignore 対象の生成物。`dev` / `build:storybook` は
   *    どちらも先に `build:registry` を走らせる（package.json）。
   */
  staticDirs: ['../public'],

  /*
   * iframe.html の favicon 要求を止める。
   *
   * 宣言が無いとブラウザが既定で `/favicon.ico` を取りにいき、**404 が
   * コンソールに出る**。マネージャ（index.html）は favicon を参照していて
   * 404 にならないので通常の Storybook UI では見えない。出るのは
   * `iframe.html?id={storyId}` を**直接開いたとき**——
   * `.claude/rules/figma-design-system.md` が個別確認の手順として書いている
   * 経路であり、実測ハーネスがまさに使う経路である。
   *
   * 「コンソールをきれいに保つ」を検証の合格条件にしている以上、恒常的に出る
   * 404 を残すと本物の異常が埋もれる。
   *
   * ⚠️ 実体のファイルは指さない。ビルド出力には `favicon.svg` があるが、
   *    **dev サーバには無い**（実測: build 200 / dev 404）。実体を指すと
   *    dev だけ 404 が残り、直したつもりで直っていない状態になる。
   *    `data:,` は空のデータ URI で、要求そのものを発生させない。
   *    ブランドのマークを持つなら `apps/showcase` の設計と一緒に決める。
   */
  previewHead: (head) => `${head}\n<link rel="icon" href="data:," />`,
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
