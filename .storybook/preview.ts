import type { Preview } from '@storybook/react';
import '../src/styles/tailwind.css';

/**
 * Web フォントの読み込み — **Storybook 専用**
 *
 * npm パッケージ（`@kedama/design-system`）はフォントを同梱せず、読み込みもしない。
 * フォントの調達と読み込みは**消費側プロダクトの責任**である
 * （README「フォントの扱い」・primitive/typography.ts 参照）。
 *
 * ここで読み込むのは、Storybook がトークンのレビューゲートを兼ねており、
 * system フォントのままでは書体・字幅・字面を目視で判断できないため。
 *
 * 読み込む3書体は primitive/typography.ts の fontFamily に対応する:
 *   - DM Sans        … heading（見出し・UI英語）
 *   - Noto Sans JP   … body / numeric（日本語全般・桁を揃える数値）
 *   - Noto Sans Mono … mono（ログ・コード・ID）
 *
 * `display=block` を使う理由: 既定の `swap` では一度フォールバック（system フォント）で
 * 描画されてから差し替わる。DM Sans と system フォントでは数字の字幅が違うため、
 * 字幅揃えの検証ページで一瞬ずれて見えて紛らわしい。レビュー目的のため
 * 「入れ替わりが見えない」ことを優先する。
 */
const GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2' +
  '?family=DM+Sans:wght@400;500;700' +
  '&family=Noto+Sans+JP:wght@400;500;700' +
  '&family=Noto+Sans+Mono:wght@400' +
  '&display=block';

if (typeof document !== 'undefined') {
  const links: [rel: string, href: string, crossOrigin?: string][] = [
    ['preconnect', 'https://fonts.googleapis.com'],
    ['preconnect', 'https://fonts.gstatic.com', 'anonymous'],
    ['stylesheet', GOOGLE_FONTS_HREF],
  ];

  for (const [rel, href, crossOrigin] of links) {
    if (document.head.querySelector(`link[rel="${rel}"][href="${href}"]`)) continue;
    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    if (crossOrigin) link.crossOrigin = crossOrigin;
    document.head.appendChild(link);
  }
}

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'page',
      values: [
        { name: 'page', value: '#F0EEE9' },
        { name: 'surface', value: '#F8F7F4' },
        { name: 'inverse', value: '#040302' },
      ],
    },
  },
};

export default preview;
