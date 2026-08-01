import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

/**
 * このチェックアウトがクラウドストレージの File Provider 上にあるか。
 *
 * true のときだけワーカー数を絞る（下の maxWorkers のコメント参照）。
 * GitHub Actions や Dropbox 外の開発マシンでは false になり、既定の
 * 並列度に戻る。リポジトリを Dropbox 外へ移せば自動的に無効化される。
 *
 * macOS の Dropbox / OneDrive / Google Drive は ~/Library/CloudStorage/ 配下、
 * 旧世代の Dropbox は ~/Dropbox/ 配下にマウントされる。
 */
const isCloudStorageCheckout = /\/Library\/CloudStorage\/|\/Dropbox\//.test(__dirname);

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],

    /**
     * クラウドストレージ上のチェックアウトでのみワーカーを 1 本に絞る
     * （2026-07-31 調査）
     *
     * これが無いと、**ファイルキャッシュが冷えている状態で全テストが失敗する**。
     * 症状は全 8 ファイルが次のエラーで落ちる:
     *   [vitest-pool]: Failed to start forks worker for test files ...
     *   Caused by: [vitest-pool-runner]: Timeout waiting for worker to respond
     *
     * 原因は vitest 4 の pool 実装でワーカー応答待ちが 60 秒固定（延長する
     * オプションが無い。migration guide で確認済み）。一方この作業コピーは
     * node_modules が 24,131 ファイル / 400MB あり、全ファイルに
     * com.dropbox.attrs / com.dropbox.internal が付いている＝読み込みが
     * すべて Dropbox の File Provider を経由する。そのためキャッシュが
     * 冷えていると 1 ワーカーの初期化に 37 秒かかる。
     * 実測 setup: 37.11s（コールド） → 0.07s（ウォーム）。約 530 倍差。
     *
     * 8 コアで既定どおり全並列にすると 8 ワーカーが同時に同じ 400MB を
     * 読みにいって競合し、全員が 60 秒閾値を超えて共倒れになる。
     *
     * 実測比較（ウォーム時の所要時間 / 結果）:
     *   maxWorkers 8（既定）  3.12s  通過   ← コールドでは全滅
     *   maxWorkers 4          3.65s  通過   ← コールド未検証
     *   maxWorkers 2          2.88s  通過   ← コールド未検証
     *   maxWorkers 1          4.84s  通過   ← コールドでも通過（実測）
     *   maxWorkers 1 + isolate:false
     *                         1.58s  34件失敗 ← 採用不可
     *
     * 1 を選んだのはコールド状態での通過を実測できている唯一の設定だから。
     * 代償はウォーム時の +1.7 秒のみ。
     *
     * isolate:false は最速だが jsdom の状態がファイル間で漏れて 34 件落ちる。
     * 速度目的で外さないこと。
     *
     * 参考: https://github.com/vitest-dev/vitest/issues/8766
     *
     * これは**この作業コピーの置き場所**に対する調整であって、プロジェクトの
     * 性質でもマシン性能の話でもない。配布は GitHub / npm 経由であり、
     * CI（GitHub Actions）では node_modules が通常のディスクに載るので
     * 制約は不要 — そこで並列度を落とすと純粋に遅くなるだけになる。
     * そのため isCloudStorageCheckout が false の環境では既定に戻す。
     */
    maxWorkers: isCloudStorageCheckout ? 1 : undefined,
  },
});
