# 引き継ぎ — Phase A-2 の残作業と Phase B（app-shell）

作成日: 2026-08-03 / 対象コミット: `d1c23ff`（ワークツリーはクリーン・**未 push**）

> 次のセッションの冒頭でこの文書を読むこと。
> 実装の判断根拠は `docs/cross-product-ui-library-spec.md`（v0.12）にある。
> 本書は「いま何が終わっていて、次に何をするか」だけを書く。

---

## 1. 現在地

**Tier 0 の部品在庫は完成。配布経路も実装済み。**
残っているのは**ユーザー環境でしか実行できない5手順**だけで、それが済めば Phase A-2 は正式完了。

### 揃っているもの

| 層               | 内容                                                                                                                                                                                                                                                |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| トークン         | primitive / semantic の2層。**公開3テーマ**（light / dark / deep-dark）＋ dark テーマの検証用 alt surface（`[data-theme='dark'][data-surface='alt']`）。alt surface は**第4のテーマではなく属性の組み合わせ**で、`ThemeProvider` の選択肢に含めない |
| Kedama 製 Tier 0 | Button / Badge / TextField / Card / Modal / Icon                                                                                                                                                                                                    |
| 取り込み Tier 0  | Accordion / Drawer / Skeleton / Spinner / Table / Toast（`src/components/ui/`）                                                                                                                                                                     |
| 移植 Tier 0      | ThemeProvider / ThemeToggle / IconSwap / RollingText                                                                                                                                                                                                |
| 配布             | `@kedama-design/design-system`。release / canary / storybook の3ワークフロー                                                                                                                                                                        |
| 検証             | 635 テスト。`format:check` / `typecheck` / `lint` / `test` の4ゲート                                                                                                                                                                                |

### 直近のコミット

```
d1c23ff fix: use the official SemVer regex, grant Pages read to the build job
2e734c4 fix: make the canary actually runnable, and follow the official Pages setup
35a3a35 feat: close out Phase A-2 distribution
d103aa0 feat: add RollingText with motion fixed to the value-change token
a09483c feat: add IconSwap (data-active, no blur, motion tokens)
```

---

## 2. 次にやること（ユーザー操作。エージェントは実行しない）

`AGENTS.md` の運用ルールどおり、**commit / push / タグ作成はユーザーが自分の端末から行う**。

1. `main` へ push
2. Settings → Pages → Source を **「GitHub Actions」** に設定
3. Storybook の実表示とブラウザコンソールを確認
4. `d1c23ff` を含むコミットへ **`v0.1.0`** タグを作成して push
5. Release → publish → canary の成功を確認

**ここまで通れば Phase A-2 正式完了。**

### 失敗したときに見る場所

| 症状                   | 見る場所                                                             |
| ---------------------- | -------------------------------------------------------------------- |
| Release がタグで止まる | タグ名（`v0.1.0`）と `package.json` の version が一致しているか      |
| publish が 403         | `packages: write` 権限と、Organization 側のパッケージ作成許可        |
| canary が 404          | publish が本当に成功しているか（dry-run では canary を呼ばない設計） |
| Storybook が素の見た目 | `pnpm generate:tokens` が走っているか（`build:storybook` に内包）    |

**ローカルで等価な検証は済んでいる。** `pnpm build && pnpm pack` した tarball を空の
プロジェクトへ入れ、root / `/tokens` / `/styles` の3経路で typecheck と build が通ることを
実測済み（雛形は `.github/consumer-check/`）。Actions 上での実行だけが未確認。

---

## 3. Phase B — `registry:block` の `app-shell`

### 進め方（確定済み）

1. **`AppShell` / `AuthShell` の契約を先に固定する**
2. 続いて `SidebarNav` / `IconRail` / `AppHeader` / `StatusBar` / `RightPane` を
   **同じレジストリアイテム**へまとめる
3. **Tier 2 は `src/index.ts` から公開しない**（npm ではなくレジストリ配布）

### 前提

- 現行 shadcn は static `shadcn build` と `/public/r` を正式サポート
- Sidebar を含むブロックは Base UI 版も提供されている
- 要件と参照元は Ibuki のプロトタイプ（`.app` / `.side` / `.apphead` / `.statusbar`）と
  ベンチマーク §7.2（`docs/surasura-ui-benchmark-research.md`）
- **構造と挙動の正は shadcn**。Ibuki とベンチマークは要件・参照元であって実装の形ではない
  （§4.5。2026-07-30 の方針転換の帰結）

---

## 4. この基盤の作業規律（守ること）

`docs/design-rules.md` 3.5 と 1.1.1 に昇格済み。要点だけ再掲する。

1. **CSS の生成・解決を grep で判定しない。** 描画して `getComputedStyle` で読む
   （`Foundations/Computed Style Audit`）。逆向きの誤判定が実際に2回出ている
2. **「〜のはず」で次の作業に進まない**
3. **primitive は在庫、semantic は約束。** 未参照の primitive を消さない
4. **コミット前に4ゲート**（`format:check` / `typecheck` / `lint` / `test`）を揃えて実行する。
   一度 lint だけ飛ばして壊れたコミットを作っている
5. **仕様書の本文を変更したら必ず報告する。** 条項を撤回したら冒頭の
   「方針変更の履歴（索引）」に1行足す

### 実測でしか出なかった不具合の例（同じ轍を踏まないために）

- `transition-[opacity,transform]` … Tailwind v4 の `scale-*` は独立した `scale`
  プロパティを使うため、スケールが補間されず飛んでいた
- ghost から文字色を外したら**純黒 `#000`** に落ちた（`@layer base` に既定文字色が無かった）
- tarball に `*.test.d.ts` が15ファイル同梱されていた
- `require('@kedama-design/design-system/package.json')` は `exports` に無く throw する

---

## 5. 判断待ち・未着手として残しているもの

| 項目                          | 状態                                                            |
| ----------------------------- | --------------------------------------------------------------- |
| deprecated alias の除去 major | 据え置き。最初の本番適用が済んで移行コストが見えてから決める    |
| Toast を Modal の上に出す     | 保留。ネイティブ `<dialog>` の top layer は z-index で覆せない  |
| `tailwind-merge`              | 見送り。`tests/classConflict.test.ts` が落ちたら再検討          |
| Motion（`motion` パッケージ） | 未導入。Drawer のスワイプ等 `drag-release` が必要になるまで遅延 |
| `shadow.md`                   | 在庫のまま（用途未割当）                                        |
| Figma → コードのパイプライン  | 未稼働（報告書 Q3）                                             |

---

## 6. 最初に読むもの

1. `docs/cross-product-ui-library-spec.md` — v0.12。**冒頭の「方針変更の履歴（索引）」を先に読む**
2. `docs/q1-tier0-unification.md` — Tier 0 統合の決定と実測
3. `docs/design-rules.md` 1.1.1 / 3.3 / 3.5 — トークンの性質と作業規律
4. `docs/motion-token-mapping.md` — モーション割当と取り込みチェックリスト
5. `AGENTS.md` — 運用ルール（git・node_modules・仕様書編集）
