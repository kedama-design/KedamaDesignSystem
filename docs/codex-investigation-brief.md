# Codex 調査依頼ブリーフ — 横断UIコンポーネント基盤 Phase A 着手前レビュー

作成日: 2026-07-28 / 依頼者: Yuuki / 版: v1.7.1（完成版。基準HEADをコミット後の値に更新）

## 0. この文書について

**必要な背景を要約した調査依頼書です。§7 に列挙した参照ファイルを確認することを前提とします。**
本書だけで全ての判断ができるようには作られていません（特に Q2・Q4・Q7・Q8・Q9 は親仕様書
`KedamaDesignSystem/docs/cross-product-ui-library-spec.md`（**v0.8**、以下「親仕様書」）の
該当節を読む必要があります）。頻繁に参照する Tier 分類と Phase A の範囲だけは、
参照往復を減らすため §3 に再掲しています。

目的は **Phase A（実装フェーズ）着手前に、着手後の手戻りを生む論点を潰すこと**です。
実装そのものは依頼していません。調査と方針提案をお願いします。

---

## 1. 背景

複数プロダクト（Ibuki-Code-v2／すらすらスタジオ／FP&Aデスクトップアプリ等）で共有する
UIコンポーネント基盤を作ろうとしている。直接の動機は、Ibuki-Code-v2 で
「単一HTMLファイルのプロトタイプを後からReactで再実装する」工程で、プロトタイプの簡易実装
（DOM位置依存・文字列マッチ・CSS二重定義）をそのまま写経してしまい実バグが出たこと
（`Ibuki-Code-v2/docs/planning/32_screen_spec.md` §6.5に記録）。プロトタイプ工程そのものを
「本番コンポーネントをStorybook上で組む」に置き換えて、構造的にずれを起こさなくするのが狙い。

土台は新規リポジトリではなく、**既にある `KedamaDesignSystem`（`@kedama/design-system`）**を使う。
2026年4〜5月に別文脈で構築されたもので、Calm UI というデザイン哲学・OKLCH由来の2層トークン・
Figma連携パイプライン・6コンポーネント（Button/Badge/TextField/Card/Modal/Icon）が既にある。

デザイン言語の統合方針は確定済み：
**配色（トークンの値）と設計思想は Kedama Calm UI を採用し、コンポーネント構成・レイアウト・
スペーシング・挙動は Ibuki（プロトタイプ／doc25／doc32）を正とする。**
つまりトークンの「値の出所」だけKedamaに切り替え、「型を使う側のルール」はIbukiを維持する。

配布方式も確定済み：Tier 0（基礎プリミティブ）／Tier 1（チャート）は npm パッケージ、
Tier 2（複合ブロック）は shadcn レジストリ形式でコピー配布するハイブリッド。

不足部品の調達方針も確定済み（親仕様書 §2.1.5）：AppShell・DataTable・Sheet・Command など
Kedama に無い部品は、**shadcn/ui（Base UI variant）のブロックを Kedama が一度取り込み、
Kedama トークンで再スタイルして、Kedama のレジストリから各プロダクトへ配る**。
ゼロから作らず、かつ各プロダクトが上流から個別にコピーして分岐することも防ぐ。

---

## 2. 対象リポジトリと調査基準

|                                                  | パス                                                                                              | 役割                                                                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| KedamaDesignSystem                               | `/Users/y.higashimori/Library/CloudStorage/Dropbox/100_Claude/Projects/active/KedamaDesignSystem` | 土台・変更対象                                                                                                        |
| Ibuki-Code-v2                                    | `/Users/y.higashimori/Library/CloudStorage/Dropbox/100_Claude/Projects/active/Ibuki-Code-v2`      | 移植元・参照のみ。変更しない                                                                                          |
| スラスラスタジオ（こだまポータル）**調査ルート** | `/Users/y.higashimori/Library/CloudStorage/Dropbox/100_Claude/Projects/active/スラスラスタジオ`   | **最初の適用先**・参照のみ。変更しない。**これ自体はGitリポジトリではない**（UX成果物や仕様書を含む作業ディレクトリ） |
| └ アプリ **Gitリポジトリ**                       | `.../スラスラスタジオ/surasura-seo-portal`                                                        | 上記の内側。ここが実際のGitリポジトリ                                                                                 |

GitHub: `https://github.com/Kedama-Yuuki/KedamaDesignSystem.git`（branch: main）

**調査基準**

- Kedama 基準HEAD: **`dc3901a` 以降**（本書と親仕様書がリポジトリに追加されたコミット。
  それ以前の HEAD にはこの2ファイルが存在しない）。本書の微修正で HEAD が進む場合があるが、
  調査対象のコードには影響しない。調査開始時点の実際の値を報告書に記載すること
- Ibuki 基準HEAD: 調査開始時点の値を使用し、報告書に記載すること
- すらすらスタジオ（`surasura-seo-portal`）基準HEAD: 調査開始時点の値を使用し、報告書に記載すること
- **作業ツリーの状態は3リポジトリすべてについて、調査開始時に `git status` で確認すること。**
  既存の未コミット変更がある場合は報告書に記載すること。本書執筆時点で把握しているのは1件で、
  意図的なものであり調査対象の変更ではない
  - すらすらスタジオ：`README.md` / `next-env.d.ts` / `package.json` に変更あり（HEAD `5341062` 時点）

**2つの参照リポジトリ（Kedama・Ibuki）と、すらすらスタジオ調査ルートを読める状態で調査を
開始してください。**移植元（Ibuki側）が見えないと
Q1・Q4・Q5・**Q8** に、適用先（すらすらスタジオ側）が見えないと Q9 に答えられません。
（Q8 は `packages/ui/src/components/rolling-text.tsx` と
`docs/planning/25_design_system.md` のモーション方針を参照します）

---

## 3. Tier 分類と Phase A の範囲（親仕様書 §4・§7 からの再掲）

参照往復を減らすための再掲です。**正は親仕様書**であり、齟齬があれば親仕様書を優先してください。

### Tier 0 — 基礎プリミティブ（プロダクト非依存、npm配布）

Button／Badge／Card（+ CardHeader / CardTitle / CardContent / CardFooter）／Skeleton／Spinner／
Drawer／ThemeProvider・ThemeToggle／IconSwap／RollingText／Accordion（新規）／Toast

### Tier 1 — チャート・可視化プリミティブ（npm配布）

BarH／Donut／Gauge／Sparkline／TrendLine／Waterfall／TimelineRow／Grass（GitHub草ヒートマップ）／
palette・date-math ユーティリティ／TrackBar

### Tier 2 — 複合パターン（shadcnレジストリでコピー配布。**Phase A では対象外、Phase B で作る**）

**AppShell 一式（最優先・親仕様書 §4.5）**：AppShell／SidebarNav／IconRail／AppHeader／
StatusBar／RightPane ＋ 認証前画面用の AuthShell

**shadcn から取り込んで再スタイルするもの**：DataTable（TanStack Table v8 の上に構築）／
Sheet／CommandPalette／FilterBar・SavedViewPicker（汎用部分）

**Ibuki プロトタイプ／OpenStatus 由来**：ScoreRing／ChecklistStep／FindingCard／MetricCard／
ActionCard／FormCard／Section／EmptyState

### Tier 3 — 明示的にプロダクト固有（**汎用化しない・移植対象外**）

**Ibuki 由来**：KpiCard（`@ibuki/shared` の formatNumber 依存）／SiteFaviconChip／
**Radar18**（18観点・5分類決め打ち）

**すらすらスタジオ由来**（ベンチマーク §8。Tier 2/3 の振り分けは Q9 で提案してほしい）：
ClientSwitcher／ArticleTable／ArticleRow／ArticleStatus／SavedViewPicker／ArticleWorkspace／
EditorCanvas／SelectionReviewToolbar／CommentThread／MetadataInspector／VersionTimeline／
VersionDiff／ApprovalBar／PublishStatus

### ゴールの定義（親仕様書 §1）

**すらすらスタジオ（codama portal）の本番画面が実際に新パッケージに載せ替わった状態
（親仕様書 §7 Phase C の完了）をもってゴール達成とする。**ライブラリが公開できる状態に
なっただけでは未達。

**注意（v1.3の記述を訂正）**：すらすらスタジオは「構築中」ではなく、本番用Docker構成・
Prismaデュアルスキーマ・better-auth＋MFA・BullMQワーカー・MCPサーバー・Playwright＋
Siteimprove Alfa を備えた作り込まれたアプリである。UIも実装済み。ただし
**現行UIは全面的に作り直す方針**（ユーザー判断）であり、かつ `@kedama/design-system` 0.1.0 が
既に tarball で導入済みのため、統合自体は実証済み。Phase C は
「presentational 層の再構築 ＋ tarball 運用の正式配布への昇格」が実体になる。
Ibuki への適用は Phase D/E に後置された。

### Phase A の現行スコープ（親仕様書 §7）

- **Phase A-0（意思決定）** — 本調査そのもの
- **Phase A-1（トークン層）** — primitive → semantic の順に確定。3テーマ、data-vizトークン、
  **モーショントークン（Q8）**を含む。`design-rules.md` 3.3 によりコンポーネントより先に完了させる
- **Phase A-2（Tier 0/1）** — Tier 0/1 の構築・移植、Storybook立ち上げとVercelデプロイ、npm公開

**各段階の完了条件は未定義**（Q7で扱う）。

---

## 4. すでに検証済みの事実（再調査不要）

重複作業を避けるため、確認が取れている事実を先に共有します。**これらの再検証は不要**です。

### 4.1 GitHub Packages のスコープ制約（確認済み・公式ドキュメント / 確認日 2026-07-28）

GitHub Packages の npm レジストリは、パッケージのスコープ名がリポジトリオーナー名
（ユーザーまたは組織アカウント名）と一致することを要求する。現オーナーは `Kedama-Yuuki` のため、
**確定済みのパッケージ名 `@kedama/design-system` はこのままでは publish できない。**

出典: https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry

### 4.2 Dark／Deep-dark 仮トークンのコントラスト実測結果（確認済み・計算済み）

親仕様書 §0.6 の Dark／Deep-dark 再配色マッピング（仮）について、WCAG 2.x の相対輝度式で
3テーマ全ペアを実測した。**以下4箇所が基準未達**であることが判明している。

| 箇所                     | 現案の値                                 | 実測   | 必要基準       |
| ------------------------ | ---------------------------------------- | ------ | -------------- |
| Light `--border-strong`  | birch/300 `#A29E93`                      | 2.50:1 | 非テキスト 3:1 |
| Dark `--text-muted`      | birch/400 `#858073` on surface birch/700 | 3.45:1 | 本文 4.5:1     |
| Dark `--text-faint`      | birch/600 `#4B473D` on surface birch/700 | 1.47:1 | ほぼ不可視     |
| Deep-dark `--text-faint` | birch/600 `#4B473D` on surface birch/800 | 1.95:1 | ほぼ不可視     |

特に Light の `--border-strong` は、Kedama の `semantic/colors.ts` が唯一
「WCAG 非テキストコントラスト 3:1 確保」とコメントを付けて設計していた `border.strong`
（birch/400）を、Ibukiのヘアライン志向に合わせて1段薄くした結果、その保証を壊していた。

**修正案（実測で基準充足を確認済み）**

- Light: `--border-strong` を birch/300 → **birch/400**（3.68:1）に戻す。
  `--border`／`--border-muted` の1段薄めは維持
- Dark・Deep-dark 共通: `--text-muted` → **birch/300**（5.08 / 6.76:1）、
  `--text-faint` → **birch/400**（3.45 / 4.59:1）。結果として両テーマで
  text=birch/50・text-light=birch/200・text-muted=birch/300・text-faint=birch/400 に揃う
- 運用ルール: `--text-faint` は本文用でなく装飾ティアとして 3:1 を目標とし、コントラストテストで
  例外扱いにする。入力コントロールの枠線は `--border`（1.75:1）でなく `--border-strong` を使う

→ **Q7 でこの修正案の妥当性レビューをお願いします。**

---

## 5. 調査依頼事項

各項目に「なぜ知りたいか」「見てほしいもの」「答えてほしいこと」を書いています。

**注意：Q番号は識別子であり、優先度順ではありません**（他文書から Q番号で参照されているため、
追加時も番号を振り直していません）。着手順は下表に従ってください。

| 優先度     | 設問                                                                                            | ブロックしている工程                                                                     |
| ---------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **最優先** | Q1（既存コンポーネントの衝突）・Q2（トークン命名の一本化）                                      | Phase A-1／A-2 の両方。ここが未決だと全コンポーネントの書き換えが発生する                |
| **高**     | Q3（Figmaパイプラインの稼働状況）・**Q8（モーショントークン）**・Q9（すらすらスタジオの棚卸し） | Q3/Q8 は Phase A-1（トークン層）を直接ブロックする。Q9 は Phase B/C の作るものを規定する |
| **中**     | Q4（Base UIの振り分け）・Q5（Tier 1の棚卸し）・Q6（公開方式）・Q7（コントラスト修正と完了条件） | Phase A-2 以降                                                                           |

### Q1【最優先】既存コンポーネントと移植対象の衝突をどう解消するか

**なぜ**: KedamaDesignSystem には Button／Badge／Card が実装・テスト・Storybook化済みで存在する。
一方、移植予定の Tier 0 にも Ibuki `packages/ui` 由来の同名3コンポーネントがある。
親仕様書は移植元を書いているだけで、既存 Kedama 版の扱い（置換／APIマージ／機能追加）を
定義していない。このまま実装に入るとテスト済みの既存資産が黙って上書きされる恐れがある。

**見てほしいもの**

- `KedamaDesignSystem/src/components/Button/`, `Badge/`, `Card/`（実装・テスト・stories）
- `Ibuki-Code-v2/packages/ui/src/components/button.tsx`, `badge.tsx`, `card.tsx`

**答えてほしいこと**

- 3コンポーネントそれぞれについて、Props API・バリアント・状態の対応表（どちらに何があるか）
- 各コンポーネントの推奨方針：Kedama版を正としてIbukiの不足機能を足す／Ibuki版で置換／統合。
  判断根拠つきで
- 既存テスト・stories への影響を、次の3つに**分類して**列挙すること
  1. **API変更により修正が必要になるもの**（変更内容を具体的に）
  2. **意図的に維持すべき回帰テスト**（壊してはいけない振る舞いを担保しているもの）
  3. **実装後にのみ判定可能なもの**（現時点では断定できない旨を明記）

### Q2【最優先】トークンの命名体系が二重化している問題をどう一本化するか

**なぜ**: Kedama のセマンティック層は `fg.default` / `bg.surface` / `border.default` /
`accent.primary` という命名で、既存6コンポーネントはこれを参照している。一方、親仕様書 §0.6 の
再配色マッピング表は `--text` / `--surface` / `--border` / `--brand` という **Ibuki の CSS変数名**で
書かれ、しかも Kedama のセマンティック層を経由せず primitive の値へ直結している。

Kedama 自身の `docs/design-rules.md` 1.1 は「セマンティックトークンに直接値を書かない／
コンポーネントは必ずセマンティックトークン経由で参照する」を**禁止事項**として明文化しており、
§0.6 をそのまま実装すると自らのルールに抵触する。ここを決めずにコンポーネントを作り始めると、
後で全コンポーネントの書き換えになる。

**見てほしいもの**

- `KedamaDesignSystem/src/tokens/primitive/colors.ts`, `src/tokens/semantic/colors.ts`
- `KedamaDesignSystem/docs/design-rules.md` 1.1・1.2
- `KedamaDesignSystem/docs/cross-product-ui-library-spec.md` §0.6・§3
- `Ibuki-Code-v2/docs/planning/25_design_system.md`（Ibuki側のCSS変数の定義元）
- `Ibuki-Code-v2/packages/ui/src/styles/globals.css`

**答えてほしいこと**

- Kedama semantic のキーと Ibuki CSS変数の**対応表**（1:1にならない箇所を明示）
- 一本化の方式として現実的な選択肢と推奨案。想定される候補は次の3つだが、他にあれば提案可
  - (a) Kedama semantic を正とし、Ibuki CSS変数は semantic を参照するエイリアス層として生成する
  - (b) Ibuki CSS変数群を semantic 層そのものと見なし、Kedama の既存キーをそちらへ寄せる
  - (c) 両者を併存させ、コンポーネントは Kedama semantic のみを参照する（CSS変数は消費側向けAPI）
- 推奨案を採った場合の既存6コンポーネントへの影響範囲

### Q3【高】Figma トークンパイプラインは実際に稼働しているか

**なぜ**: Kedama は Figma を single source of truth とし、Tokens Studio → GitHub Actions →
Style Dictionary で `variables.css` / `tokens.ts` を生成する設計になっている
（`docs/design-system-pipeline.md`）。**もしこれが実稼働しているなら、今回コード側で
Dark トークンを直接追加すると、次のFigma同期で上書き・消失するリスクがある。**
設計文書だけあって未実装なのか、実際にワークフローが動いているのかを確認したい。

**見てほしいもの**

- `KedamaDesignSystem/.github/workflows/`（存在するか、`tokens/**` を監視しているか）
- `KedamaDesignSystem/` 直下の `tokens/` ディレクトリや `style-dictionary` 関連設定の有無
- `package.json` の scripts・devDependencies に Style Dictionary があるか
- `src/tokens/` の各ファイルが手書きか生成物か（ヘッダコメント・gitログで判断）

**答えてほしいこと**

- パイプラインの実装状況（未着手／部分実装／稼働中）
- 稼働中の場合、Dark トークンを追加する正しい経路（Figma側に先に足すべきか、
  コード側で足してもよいか、パイプラインを一時停止すべきか）
- 未着手の場合、今回コード側で先行してトークンを整備することの将来的な影響

### Q4【中】Base UI をコンポーネント単位でどう要否判断するか

**このQは「確定事項を覆して再評価してよい」範囲です。** 理由は、親仕様書の中で方針が
**内部矛盾しているため**。

なお前提が1つ確定しました（親仕様書 §2.1.5）：**低層プリミティブは shadcn/ui の Base UI
variant に統一する**（Radix版とBase UI版を無秩序に混在させない）。したがって本Qは
「Base UI を使うか否か」ではなく、**「各コンポーネントを shadcn から取り込むか、ネイティブ要素で
自作するか、Ibuki から移植するか」**の振り分けを問うものになります。特に Kedama の Modal は
ネイティブ `<dialog>` で自作済みであり、これを維持するか shadcn の Dialog/Sheet に寄せるかが
実際の論点です：

- §4（Tier 0 一覧）は「Drawer → Base UI Dialog に置換」「Accordion → Base UI の Accordion
  primitive に載せ替え」と記載
- §2.2（後から追記された節）は「必要になったコンポーネントから都度 Base UI を追加し、依存を
  先取りしない」とし、Drawer は「ネイティブ `<dialog>` を横からスライドさせる形で拡張できる
  可能性がある（要検証）」と記載

**この矛盾の解消も含めて提案してください。**親仕様書のどちらの記述を残すべきかを明示すること。

**なぜ（背景）**: Kedama の Modal はネイティブ `<dialog>` + 自前フォーカストラップで、Radix にも
Base UI にも依存していない。一方 Tier 0 には Drawer・Accordion・Toast など自作コストの高いものが
含まれる。どこまで自作し、どこから Base UI に頼るかの線引きが実質未決。

なお Ibuki の Drawer（`packages/ui/src/components/drawer.tsx`）は Radix Dialog ベースで、
`hideOthers` / `Presence` / `forceMount` の挙動について長いハードニングのコメントが残っている。
これを失わずに移すのが要件。

**見てほしいもの**

- `KedamaDesignSystem/src/components/Modal/`（ネイティブ実装の完成度）
- `Ibuki-Code-v2/packages/ui/src/components/drawer.tsx`（コメント含めて全文）
- `Ibuki-Code-v2/docs/prototypes/ibuki_prototype.html` の `.acc`（アコーディオン）
- Tier 0 の対象一覧は §3 を参照

**答えてほしいこと**

- Tier 0 の各コンポーネントについて「ネイティブ/自作で十分」「Base UI 推奨」「要検証」の3分類
- 特に Drawer について、Kedama の Modal（`<dialog>`）を拡張する案と Base UI Dialog を導入する案の
  比較（Ibuki drawer.tsx が担保しているフォーカストラップ・`aria-hidden` の他要素適用・
  マウント/アンマウントのタイミングを、それぞれで再現できるか）
- Base UI を導入する場合の推奨バージョンとパッケージ名。
  **バージョン情報は陳腐化するため、確認日と公式情報のURLを必ず併記すること**

### Q5【中】Tier 1（チャート）の棚卸しと、移植時の依存・トークンの受け皿

**なぜ**: Tier 1 は Recharts と自前SVGベースで、Kedama の現行 `package.json` に Recharts は無い。
新規依存の追加方針（dependencies か peerDependencies か）が未決。加えて、チャートが使う
`--chart-1..3` / `--hm0..hm4`（草ヒートマップ5段階）に相当する **data-viz カテゴリが
Kedama のセマンティック層に存在しない**ため、追加設計が要る。

**また、Tier 1 の対象範囲には本書側の記載揺れがある。**`TrackBar` は Tier 1 に挙げられているが
`charts/` 配下ではない可能性があり、逆に `radar-18` / `radar-math` は **Tier 3（Radar18）に
分類されるため移植対象外**である。ファイル単位の棚卸しから始めてほしい。

**見てほしいもの**

- `Ibuki-Code-v2/packages/ui/src/charts/` 配下の**全ファイル**
- `Ibuki-Code-v2/packages/ui/src/components/track-bar.tsx`
- `Ibuki-Code-v2/packages/ui/src/index.ts`, `src/charts/index.ts`, `src/components/index.ts`（公開API）
- `Ibuki-Code-v2/packages/ui/package.json`（Recharts のバージョン）
- `KedamaDesignSystem/package.json`, `vite.config.ts`（library mode のビルド設定）

**答えてほしいこと**

- **`charts/` 配下および TrackBar の全ファイル棚卸し**。各ファイルを次の3つに分類すること
  1. Tier 1 として移植する公開コンポーネント
  2. 内部ユーティリティ（公開せず一緒に移すもの。palette / date-math / grass-math 等）
  3. 対象外（Tier 3 に属するもの、または不要なもの）

  分類の結果として「Tier 1 は結局いくつのコンポーネントか」を確定させてほしい
  （親仕様書の記載は概数であり、正確な数え方が定まっていない）

- Recharts を dependencies / peerDependencies どちらにすべきかの判断と根拠
  （ライブラリのバンドルサイズ・消費側での重複インストール回避の観点）
- Recharts に実依存しているチャートと、自前SVGのみで完結しているチャートの切り分け
- data-viz セマンティックトークンの追加設計案（Kedama の2層構造・命名規則に沿った形で）
- Vite library mode のビルド設定に必要な変更（external 指定等）

### Q6【中】パッケージ公開方式の最終決定

**なぜ**: 4.1 の通り `@kedama/design-system` は GitHub Packages でそのまま公開できない。

**答えてほしいこと** — 次の3案の比較と推奨（他案があれば提案可）

- (a) GitHub Organization `kedama` を作成しリポジトリを移管して `@kedama/design-system` を維持
- (b) パッケージ名を `@kedama-yuuki/design-system` に変更
- (c) git依存（`github:Kedama-Yuuki/KedamaDesignSystem#main`）に切り替えてスコープ制約を回避

判断材料として、将来の外部販売（shadcn レジストリ形式での配布、認証付きAPI化）を視野に入れた
場合にどれが最も移行コストが低いか、および (a) の場合のリポジトリ移管に伴う実務上の影響
（既存クローン・GitHub Actions・リモートURLへの影響）も含めてほしい。

### Q7【中】コントラスト修正案のレビュー／トークン命名／Phase A の分割と完了条件

**答えてほしいこと**

**(1) コントラスト修正案のレビュー** — 4.2 の修正案について

- `--text-faint` を装飾ティアとして 3:1 基準に緩める判断の是非
- Dark の `surface`=birch/700 が明るく、テキスト階調の余地が構造的に圧迫されている点。
  bg/surface のステップ選定自体を見直す案があれば提示してほしい

**(2) `text-faint` の命名の妥当性** — 装飾専用トークンとする場合、`text-faint` という
`text-` プレフィックスを維持したままで良いか。将来テキスト用途に誤用されるリスクがあるため、
`fg.decorative` 等へ分離すべきかを評価すること。あわせて、
**「意味のある文字・プレースホルダー・補助説明には使用しない」**という制約を、命名・
ドキュメント・Lint/テストのどのレイヤーで担保すべきかを提案すること。
（参考：Kedama の `semantic/colors.ts` には `fg.placeholder` が別途存在し、
「WCAG 3:1 以上を確保」とコメントされている。この既存トークンとの役割分担も整理すること）

**(3) コントラストテストの拡張設計** — `KedamaDesignSystem/tests/` の既存コントラストテストの
構造を確認し、3テーマ対応に拡張する際の設計案（例外リストの持ち方を含む）

**(4) Phase A の分割と完了条件** — §3 に再掲した Phase A-0/A-1/A-2 の各段階について、
完了判定基準（Definition of Done）を提案してほしい。
**前提**：ゴールは「すらすらスタジオの本番画面が新パッケージに載せ替わった状態（Phase C 完了）」
であり、Phase A/B の完了は中間マイルストーンにすぎない。したがって各DoDは
「Phase C に進めるだけの状態か」を判定できるものにしてほしい。分割案そのものに改善余地が
あれば、そちらも提案可

### Q8【高】モーショントークンの設計と Motion の導入方針

> **Phase A-1（トークン層）を直接ブロックします。**`design-rules.md` 3.3 の
> 「primitive → semantic → component の順序厳守」により、モーショントークンは
> コンポーネント実装より先に確定させる必要があるためです。

**なぜ**: 物理演算ベースのUIアニメーション（spring physics / inertia）を体験価値として
本基盤に組み込むことが決まった（親仕様書 §3.5）。ただし Kedama の `docs/design-rules.md` 1.1 が
定める2層トークン構造の適用範囲は「カラー／タイポグラフィ／スペーシング／シャドウ／角丸」で、
**モーションが含まれていない**。同ルール 3.3 の「primitive → semantic → component の順序厳守」に
従うなら、モーショントークンは Phase A-1 で確定させる必要があり、コンポーネント実装後に
足すのは順序違反になる。

**確定済みの前提**（覆さないでほしい）

- ライブラリは **Motion**（パッケージ名 `motion`、旧 `framer-motion`）
- 依存は **peerDependency**（消費側との二重インストール回避）
- 物理演算は **spring と inertia の2つ**。弾性・バウンス・減衰は spring のパラメータ違いであり
  独立した種類ではない。**重力（gravity）は Motion に存在しないため採用しない**
- **overshoot は「指やカーソルで対象を直接つかんで動かしている操作（ドラッグ・スワイプ）の
  余韻」としてのみ使う。それ以外はすべて damped**（Calm UI の第1原則との整合のため）
- `prefers-reduced-motion` の担保は必須。`MotionConfig reducedMotion="user"` をプロバイダ層で
  一括適用し、個別コンポーネントに実装させない
- 参照実装 [Nexvyn UI](https://github.com/Nexvyn/nexvyn-ui) からは **spring パラメータの値と
  用途の対応づけという設計知のみを借り、コードは借りない**（NexvynはRadixベースのため）。
  同リポジトリの図版類は CC BY-NC のため持ち込み厳禁

**見てほしいもの**

- 親仕様書 §3.5（本Qの前提すべて）
- `KedamaDesignSystem/docs/design-rules.md` 1.1・1.2・3.3
- `KedamaDesignSystem/src/tokens/` の既存2層構造（motionカテゴリを足す先）
- `Ibuki-Code-v2/packages/ui/src/components/rolling-text.tsx`
  （既存の reduced-motion 対応・アンチフラッシュ実装。ハウスルールの原型にする）
- `Ibuki-Code-v2/docs/planning/25_design_system.md` のモーション方針
  （「slot-text は値/状態が変わった瞬間だけ」という既存の禁欲的な方針との整合）
- Nexvyn UI のリポジトリ（**パラメータ値の調査目的のみ**）

**答えてほしいこと**

- **モーショントークンの2層設計案**。primitive層に何を置き（spring設定の実体：
  `stiffness`/`damping`/`mass` の組、または `bounce`/`visualDuration` の組、inertia設定の実体）、
  semantic層にどんな用途名を置くか（`motion.enter` / `motion.exit` / `motion.value-change` /
  `motion.drag-release` 等）。Kedama の既存命名規則（`{カテゴリ}.{要素}.{状態/バリアント}`）に
  沿った形で
- 各セマンティックトークンの**具体的な推奨パラメータ値**。Nexvyn の実装値を調査し、
  参考にしてよい（ファイルパスと値を引用すること）
- Tier 0 の各コンポーネントについて、**どのモーショントークンを使うべきかの割り当て案**。
  特に Drawer（Q4と連動）、Toast、Accordion、RollingText
- Motion の導入形態。`motion/react` をそのまま使うか、`LazyMotion` + `m` でバンドルを
  削るか。ライブラリとして配布する立場での推奨と、消費側に要求される設定
- **`MotionConfig` の所有・公開設計**。親仕様書 §3.5 は「プロバイダ層で一括適用する」ことまでを
  確定しているが、**誰がそのプロバイダを提供するかは未定**。次を比較して提案してほしい
  - (a) 既存の `ThemeProvider`（Tier 0）に統合し、テーマとモーションを1つのプロバイダで扱う
  - (b) 独立した `MotionProvider` を Tier 0 に追加する
  - (c) 上位に `KedamaProvider` を新設し、Theme と Motion をその内部に束ねる
  - (d) プロバイダは提供せず、消費側が `MotionConfig` を直接設置する

  比較には **SSR（Next.js App Router の Server/Client 境界）での扱い**、**複数配置された場合の
  挙動**、**既存 `ThemeProvider` の API とテストへの影響**を含めること

- `prefers-reduced-motion` 時のフォールバック方針（アニメーションを完全に切るのか、
  duration を極小にするのか、opacity のみ残すのか）
- **推奨バージョンは確認日と公式URLを併記すること**
- Ibuki の doc25 モーション方針（禁欲的）と §3.5（物理演算採用）が矛盾しないかの検証。
  矛盾する場合はどちらを正とすべきかの提案

### Q9【高】すらすらスタジオ：再構築対象の棚卸しと、残す層の境界

**なぜ**: Phase C で すらすらスタジオ の UI を全面再構築する。そのために (a) 何を作るのか、
(b) どこまで壊してよいのか、(c) 既存の `@kedama/design-system` 0.1.0 統合をどう昇格させるか、
を確定する必要がある。

**確定済みの前提**（覆さないでほしい）

- 作り直すのは **presentational 層のみ**。API route・認可・Prisma のスキーマ分離・
  better-auth の認証フロー・BullMQ ワーカー・MCPサーバーは触らない
- 不足部品は **shadcn/ui（Base UI variant）を Kedama が取り込み・再スタイルして配る**（親仕様書 §2.1.5）。
  すらすらスタジオが shadcn 公式レジストリから直接導入することはしない
- Phase B では **AppShell 一式を最優先とする**（親仕様書 §4.5）。これは人間の判断として固定する
  —— シェルは Tier 在庫から実際に欠落しており、ベンチマーク §7.2 も Ibuki のプロトタイプも
  シェルを前提としている以上、原因診断の結果によらず作る必要があるため。
  **ただし、その判断根拠となる「現行UIへの不満の主因はシェル未設計である」という因果関係は
  確定事項ではなく、Q9 で検証する仮説として扱うこと**
- 独立KPIダッシュボードは作らない。記事一覧をホーム兼ダッシュボードとする
- bmad-ux 側の discovery は中断済み。**「Kedama から段階移行する」という旧仮説は破棄済み**

**見てほしいもの**

- `surasura-seo-portal/src/app/` 配下の全ルート（特に `(internal)` と `(client)` のルートグループ構成）
- `(client)/client/(app)/articles/[id]/review-shell.tsx`（46KB。最大の塊）
- `(internal)/articles/article-table.tsx`（TanStack Table の既存利用）
- `src/app/design-tokens.css`（23KB）と `src/app/kedama-theme.css`
- `surasura-seo-portal/vendor/kedama-design-system/`（0.1.0 の tgz と README）
- `surasura-seo-portal/package.json`
- `test/`、`playwright.config.ts`、Siteimprove Alfa（`@siteimprove/alfa-*`）の設定
- `_bmad-output/planning-artifacts/ux-designs/ux-スラスラスタジオ-2026-07-27/`
  （`.working/research-ui-benchmarks.md` 25KB、`.working/screen-inventory-flow.html`、`.memlog.md`）
- `seo-portal-dev-spec-v2.3-FINAL.md` §10（画面一覧の正本）

**答えてほしいこと**

- **画面インベントリ**（ルート単位）と、各画面が使っている UI パターンの抽出。
  memlog に「主要画面12・実装済み9・部分実装1・未実装2」とあるので、その裏取りも含めて
- **ルートグループとレイアウトの構成分析**。ログイン画面にサイドバーが出る不具合の原因を
  コードレベルで特定し、`AppShell` / `AuthShell` をどう分離すべきかの提案（親仕様書 §4.5）
- **presentational / container の境界線の提案**。再構築で壊してよい範囲と、触ってはいけない
  範囲をファイル単位で明示
- **`@kedama/design-system` 0.1.0 が実際に提供しているもの**と、現行アプリでの使われ方。
  これから作る版との差分＝アップグレードパス。
  **tgz はリポジトリ内に展開しないこと**（「報告書以外のファイルを作成しない」という指示に
  抵触するため）。`tar -tf` で一覧を、`tar -xOf <tgz> <path>` で個別ファイルの内容を
  標準出力に取り出すか、`/tmp` 等のリポジトリ外の一時ディレクトリへ展開すること
- **`design-tokens.css` / `kedama-theme.css` が encode している判断**のうち、
  捨てるものと引き継ぐものの切り分け。Q2 の一本化方針との整合
- **Siteimprove Alfa / Playwright の既存 a11y テストが新コンポーネントに課す制約**の整理。
  §4.2 のコントラスト修正（`text-faint` の 3:1 例外）について、次の3つを**分けて**提示すること。
  新コンポーネントはまだ存在しないため「テストに通るか」は現時点では判定できない
  1. **静的に判断できる適合性**（Alfa が適用する ACT ルールと、3:1 例外の関係）
  2. **想定されるリスク**（どのルールに抵触しうるか、どの使われ方をすると落ちるか）
  3. **実装後に追加すべきテストケース**

  実装後にしか判定できないものは、その旨を明記すること

- ベンチマーク調査 §8 の「プロダクト固有コンポーネント」17件について、
  **Tier 2（汎用ブロック）／Tier 3（プロダクト固有）のどちらに振り分けるべきか**の提案
- **既存仮説の反証可能性の検証**：本書と親仕様書 §4.6 は「現行UIへの不満の主因はアプリシェルが
  設計されていないこと」という仮説を立てている。**この仮説に同意することを前提とせず**、
  次の3つを分けてコードから整理してほしい
  1. 仮説を**支持する**証拠（ファイルパスと該当箇所つき）
  2. 仮説を**反証する**証拠、または仮説では説明できない現象
  3. **シェル以外の原因**として考えられるもの（情報設計・状態管理・データ取得の粒度・
     スタイルの適用方法・コンポーネント分割の粒度など、範囲を限定せず）

  仮説が主因の説明として不十分だと判断した場合は、そう明言してほしい。
  （本来は仮説を伏せたブラインド診断が望ましいが、本書は既に仮説を複数箇所で明示しており
  それは成立しない。ブラインド診断が必要なら、コードのみを渡した別担当に依頼する）

---

## 6. 期待する成果物

**保存先: `KedamaDesignSystem/docs/codex-investigation-report.md`（Markdown 1ファイル）**

冒頭に調査基準を明記してください。

```
調査基準: Kedama HEAD bb0890a / Ibuki HEAD <調査開始時点の値>
        / すらすらスタジオ(surasura-seo-portal) HEAD <調査開始時点の値>
        / 調査日 <YYYY-MM-DD>
既存の未コミット変更: <3リポジトリそれぞれの git status 要約>
```

Q1〜Q9 それぞれについて次の3点を記載してください。

1. **調査結果**（事実。ファイルパスと行番号・該当コードの引用を伴うこと）
2. **推奨方針**（判断根拠つき。トレードオフがある場合は選択肢を並べたうえで推奨を明示）
3. **未確定として残るもの**（人間の判断が必要な論点／実装後にのみ判定可能な項目）

外部の情報（ライブラリのバージョン・公式ドキュメントの記述など）を根拠にする場合は、
**確認日とURLを必ず併記**してください。時間とともに変化する情報のため、報告書の再現性に必要です。

加えて、**「この順序で着手すべき」という作業順の提案**を末尾に付けてください。
Kedama 自身のルール（`docs/design-rules.md` 3.3）が
「primitive（Variables）→ semantic（Styles）→ component の順序を厳守」を定めているため、
これと矛盾しない順序であることを確認してください。

**実装は行わないでください。**コードの変更・ファイルの新規作成は、上記の報告書1ファイルを除いて
行わないようお願いします。

---

## 7. 参照ファイル一覧

### KedamaDesignSystem（土台）

- `docs/cross-product-ui-library-spec.md` — 親仕様書 **v0.8**（本件の全体像。**Q2/Q4/Q7/Q8/Q9で必読**）
- `docs/design-principles.md` — Calm UI のデザイン哲学と優先順位
- `docs/design-rules.md` — トークン2層ルール・命名規則・AI協業ルール（**特に 1.1 / 1.2 / 3.3**）
- `docs/design-system-pipeline.md` — Figma→コードのトークン管理パイプライン設計
- `docs/claude-code-consumer-context.md` — 消費側プロジェクト向けの導入文テンプレート
- `src/tokens/primitive/colors.ts` — 7色パレット×11段階（OKLCH由来、純白/純黒を使わない）
- `src/tokens/semantic/colors.ts` — fg / bg / border / accent / status のセマンティック割当
- `src/components/` — Button / Badge / TextField / Card / Modal / Icon
- `tests/` — トークン値テスト・WCAGコントラストテスト
- `ROADMAP.md`, `CLAUDE.md`, `AGENTS.md`

### Ibuki-Code-v2（移植元・参照のみ）

- `docs/planning/25_design_system.md` — Ibuki のデザイントークン仕様（CSS変数の定義元）
- `docs/planning/32_screen_spec.md` — 画面仕様。**§6.5 に本件の発端となった6つのアンチパターン**
- `docs/planning/30_uiux_implementation_guide.md`, `37_uiux_completion_wbs.md`
- `docs/prototypes/ibuki_prototype.html` — 見た目の正（2659行・全27画面・3テーマのCSS変数定義を含む）
- `packages/ui/src/components/` — Tier 0 の移植元
- `packages/ui/src/charts/` — Tier 1 の移植元
- `packages/ui/src/styles/globals.css` — CSS変数の実体

### スラスラスタジオ（最初の適用先・参照のみ）

- `surasura-seo-portal/src/app/` — 全ルート。`(internal)` / `(client)` のルートグループ構成
- `surasura-seo-portal/src/app/design-tokens.css`（23KB）／`kedama-theme.css` — 既存のトークン統合の試み
- `surasura-seo-portal/vendor/kedama-design-system/` — 導入済みの `@kedama/design-system` 0.1.0
- `surasura-seo-portal/package.json` — TanStack Table v8 / Tiptap / Tailwind v4 / lucide-react。**Radix・shadcn・Base UI は未導入**
- `_bmad-output/planning-artifacts/ux-designs/ux-スラスラスタジオ-2026-07-27/.working/research-ui-benchmarks.md`
  — **Slack / Linear / VS Code / Resend / Base UI / shadcn系SaaS のベンチマーク調査（25KB）。
  §2 結論、§7.2 アプリシェル、§8 コンポーネント構成、§9 ビジュアル原則は Q9 の必読箇所**
- 同ディレクトリ `.memlog.md` — UX discovery の意思決定ログ（中断済み。破棄された仮説あり）
- 同ディレクトリ `.working/screen-inventory-flow.html` — 画面一覧と遷移図
- `seo-portal-dev-spec-v2.3-FINAL.md` §10 — 画面一覧の正本
- `.claude/skills/ui-ux-library-selector/` — 本プロジェクトのライブラリ選定ルールとカタログ
- `CLAUDE.md` §9 — 新規本番依存の追加には承認が必要、MIT優先、等

### 外部参照

- [OpenStatusHQ/openstatus-template](https://github.com/OpenStatusHQ/openstatus-template) — Tier 2 の参考実装
- [GitHub Packages / npm registry ドキュメント](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry) — Q6 の制約の根拠（確認日 2026-07-28）
