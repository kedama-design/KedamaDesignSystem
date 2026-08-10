import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'node:path';

export default defineConfig({
  /*
   * `public/` は Storybook Pages へ Tier 2 レジストリを配るための置き場で、
   * Tier 0 の npm パッケージへ入れるものではない。Vite は既定で publicDir を
   * `dist/` へコピーするため、無効にしないと `dist/r/*.json`（ブロックの
   * ソース本文を含む）が tarball に混入する。
   *
   * Storybook 側は `.storybook/main.ts` の `staticDirs` で明示的にコピーする。
   */
  publicDir: false,
  plugins: [
    react(),
    tailwindcss(),
    dts({
      include: ['src/**/*'],
      // テストとストーリーの型宣言は配布物に入れない。
      // 消費側が使うことはなく、tarball に載るだけ無駄になる
      // （`*.test.d.ts` が 15 ファイル同梱されていたのを実測で発見）。
      //
      // src/blocks/ は **Tier 2**。配布経路は npm ではなく shadcn レジストリで、
      // `src/index.ts` からも公開していない（§2.1・§4.5）。型宣言だけ dist に
      // 残ると「npm からも使える」ように見えるので除外する。
      exclude: ['src/stories/**/*', 'src/blocks/**/*', 'src/**/*.test.*'],
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      /*
       * Tier 2 ブロック（src/blocks/）は Tier 0 を**公開 API 経由でだけ**使う。
       * レジストリでコピーされた先では npm パッケージとして解決されるので、
       * リポジトリ内でも同じ綴りで書けるように自パッケージ名を向ける。
       * 深い import を書けなくする効果もある。tsconfig.json の paths と対。
       */
      '@kedama-design/design-system': resolve(__dirname, 'src/index.ts'),
    },
  },
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        tokens: resolve(__dirname, 'src/tokens/index.ts'),
      },
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'lucide-react'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
});
