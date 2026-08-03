# consumer-check

**公開済みの `@kedama-design/design-system` を、消費側の立場で新規導入して確かめる最小プロジェクト。**

`.github/workflows/canary.yml` が Release の後に走らせる。ここでは
リポジトリのソースを一切使わず、GitHub Packages から**完全固定のバージョン**を
入れて型チェックとビルドを通す。

## なぜ要るか

CI のビルドが通ることと、消費側が実際に入れて使えることは別問題である。

- `exports` の書き漏らし（`/tokens` や `/styles` が引けない）
- `files` の取りこぼし（`dist` に入っていない）
- `peerDependencies` の不足

これらはリポジトリの中では気づけない。ソースが手元にあるので解決してしまうため。

## 手元で試すとき

```bash
# 基盤側で
pnpm build && pnpm pack --pack-destination /tmp

# こちらで
npm install /tmp/kedama-design-design-system-<version>.tgz react@19 react-dom@19 vite@6 typescript@5 @types/react@19
npx tsc --noEmit && npx vite build
```

## src/main.tsx が触るもの

3つの export 先すべて。増やしたら**ここにも足す**こと。足さないと、
公開したつもりで引けない export に気づけない。

- ルート … コンポーネントと `cn`
- `/tokens` … `semanticColors` / `elevation` / `spacing` / `semanticMotion`
- `/styles` … 配布 CSS（`slot-text` のスタイルも同梱されている）
