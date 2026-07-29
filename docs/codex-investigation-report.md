# 横断UIコンポーネント基盤 Phase A 着手前調査報告

調査基準: Kedama HEAD `bb9921d5a4007f17e34800e762e0ba2cc4da0c93` / Ibuki HEAD `565ecb7e6d5ec38560e967718978cb6c9f3ad728` / すらすらスタジオ（`surasura-seo-portal`）HEAD `534106217c63d7e76afcd7e94e387b8c782efa1f` / 調査日 2026-07-29

既存の未コミット変更:

- Kedama: なし。
- Ibuki: `apps/web/e2e/auth-onboarding.spec.ts`、`drawer-interrupt.spec.ts`、`two-factor.spec.ts`、`turbo.json` の変更、および `.agents/`、`_bmad-output/`、`_bmad/`、E2Eヘルパー等の未追跡ファイルあり。本調査では変更していない。
- すらすらスタジオ: `README.md`、`next-env.d.ts`、`package.json` に既存変更あり。本調査では変更していない。

## 結論

Phase Aへ進む前に固定すべき結論は次のとおりである。

1. 既存Kedamaコンポーネントを破棄せず、Kedama APIを公開APIの正としてIbukiの必要機能だけ統合する。
2. Kedama semantic tokenを唯一の正とし、Ibuki名とshadcn名は生成される互換エイリアスにする。
3. Figma→Style Dictionaryパイプラインは未稼働。Phase A-1ではコード側を暫定正として整備し、Figmaへ同じ構造を戻してから自動同期を有効化する。
4. Motion、Base UI、Rechartsはすべてpeer dependencyとし、ビルドからexternal化する。ただしBase UIは必要な複合プリミティブに限定する。
5. 最初の適用先ではAppShell不足だけでなく、巨大なcontainer/presentational混在とCSS二重管理も主要因である。

## Q1 既存コンポーネントと移植対象の衝突

### 調査結果

| 対象 | Kedama | Ibuki | 差分 |
|---|---|---|---|
| Button variants | `primary/secondary/ghost/danger` | `brand/default/ghost/outline/destructive` | `outline`はIbukiのみ。名称と既定値が異なる |
| Button sizes | `sm/md/lg` = 32/40/48px | `sm/default/lg/icon` = 32/36/40px | 同名`lg`も寸法が異なる |
| Button機能 | `loading`、`iconLeft/right`、ref、`aria-disabled` | `loading`、`asChild`、ref、`inert` | KedamaはアイコンAPI、Ibukiはpolymorphic renderを持つ |
| Badge | `status` 5種 × `appearance` 2種、`icon` | `variant` 4種のみ | Kedamaが上位集合。Ibuki `brand` の意味だけ未対応 |
| Card | compound API `Card.Header/Body/Footer`、`noPadding` | named exports、`CardTitle/Content` | API形状が非互換。Ibukiはrefと見出し要素を持つ |

根拠:

- Kedama Buttonのvariant、size、既定値は `src/components/Button/Button.tsx:14-63`、propsは同`:100-109`、loading/ARIAは同`:131-160`。
- Ibuki Buttonのvariant/sizeは `packages/ui/src/components/button.tsx:14-39`、`asChild`とloadingは同`:41-90`。`asChild + disabled`の`inert`契約は `button.test.tsx:47-85`。
- Kedama Badgeの2軸variantは `src/components/Badge/Badge.tsx:23-94`、`icon`は同`:100-137`。Ibukiは単一`variant`のみ（`badge.tsx:12-32`）。
- Kedama Cardは`noPadding`とcompound API（`src/components/Card/Card.tsx:6-9,35-49,107-111`）。Ibukiは`CardTitle`等のnamed exports（`card.tsx:9-46`）。

### 推奨方針

- **Button: 統合。Kedamaを正とする。** `primary/secondary/danger`を正規名として維持し、Ibukiの`brand/default/destructive`は1 major期間だけdeprecated aliasにする。`outline`と`icon` sizeを追加する。`asChild`はBase UIの`render`へ置換し、アンカー無効化時の`inert`契約を維持する。既定variantはKedamaの`primary`を維持し、暗黙の見た目変更を避ける。
- **Badge: Kedamaを維持。** `brand`は`status="success"`へ機械的に潰さず、ブランド/選択と成功状態を区別する`accent`（または`tone="brand"`）を追加するかをPhase A-1で決める。Ibukiのwarning/destructiveは既存statusへ対応可能。
- **Card: 統合。** named exports `CardHeader/CardTitle/CardContent/CardFooter`を正規APIとし、`Card.Header/Body/Footer`を互換aliasとして残す。`Body`は`CardContent`へdeprecated alias化。rootと各partへrefを通す。Ibukiの「影なし」を採用し、Kedamaの`shadow-sm`は削除する（確定済みデザイン言語と整合）。

既存テスト・Storyへの影響:

1. 修正が必要: Buttonのvariant/size optionsを増やす `src/stories/Button.stories.tsx:9-20`、Cardのcompound使用 `src/stories/Card.stories.tsx:37-74`。影なしへ変える場合Cardのスナップショット/視覚確認。
2. 維持すべき回帰: Kedama Buttonのloading、ARIA、アイコン、ref（`Button.test.tsx:67-159`）、Ibukiの`asChild`/`inert`契約、Badgeの全status/appearance、Cardの`noPadding`とfooter border。
3. 実装後判定: Base UI `render`でref・イベント合成・disabled anchorが同じ契約を満たすか、CSS aliasによる見た目差、Storybook visual regression。

### 未確定

- deprecated aliasの除去major version。
- Cardのroot paddingをKedama 24pxとIbuki 16pxのどちらにするか。Ibukiの構成を正とする既定方針なら16pxを推奨する。

## Q2 トークン命名体系の一本化

### 調査結果

Kedamaはsemanticがprimitiveを参照し、コンポーネントはsemanticのみを使う契約である（`src/tokens/semantic/colors.ts:1-19`、`docs/design-rules.md:13-37`）。現在の主要対応は次のとおり。

| Ibuki | Kedama semantic | 判定 |
|---|---|---|
| `--text` | `fg.default` | 1:1 |
| `--text-light` | `fg.muted`候補 | 非1:1。Kedamaにはsecondary textが1段しかない |
| `--text-muted` | `fg.muted` | 用途が重複。階調追加が必要 |
| `--text-faint` | `fg.placeholder/disabled` | 非1:1。用途混在 |
| `--bg` | `bg.page` | 1:1 |
| `--surface` | `bg.surface` | 1:1 |
| `--surface-200/300` | `bg.subtle/hover` | 非1:1。状態と階層が混在 |
| `--border/-muted/-strong` | `border.default/muted/strong` | 1:1 |
| `--brand` | `accent.primary` | 1:1 |
| `--brand-600` | `accent.primary-hover`または`border.active` | 非1:1 |
| `--on-primary` | `accent.primary-fg` | 1:1だが現値はIbukiがnear-black、Kedamaは暖白 |
| warning/destructive + bg | `status.warning/danger` + `-bg` | ほぼ1:1 |
| `--chart-1..3`、`--heatmap-0..4` | なし | data-vizカテゴリ新設が必要 |

Kedama自身にもsemantic違反が残る。`bg.scrim`はrgba直値（`semantic/colors.ts:53-56`）であり、Buttonのdanger hoverはprimitive Tailwind名を直接使用している（`Button.tsx:46-49`）。これらもPhase A-1で解消対象に含めるべきである。

### 推奨方針

候補(a)を採用する。

- TypeScript/Figmaの正: `semanticColors`。
- 正規CSS API: `--color-fg-default`等。
- Ibuki互換: `--text: var(--color-fg-default)`のような生成alias。
- shadcn互換: `--foreground: var(--color-fg-default)`等の別生成マッピング。

候補(b)は既存6コンポーネントとFigma名を全面変更するため不採用。候補(c)の「独立した値を持つ併存」はテーマ間ドリフトを再発させるため不採用。aliasは値を持たないので二重の正にはならない。

追加semanticは `fg.secondary`、`fg.muted`、`fg.placeholder`、`fg.disabled`を用途別に定義し、surfaceは`bg.surface/base/sunken/raised`の階層と`bg.hover/selected`の状態を分ける。`on-primary`は採用する背景色との実測で決め、名前だけで白/黒を固定しない。

既存6コンポーネントへの影響は原則CSS生成結果だけで、JSX API変更は不要。ただしButtonのdanger直参照、Cardのshadow、Modal scrim、TextFieldのcontrol borderを修正する必要がある。

### 未確定

- Ibuki aliasを公開APIとして何major維持するか。
- `fg.secondary`と`fg.muted`の具体的なprimitive割当（Q7と同時決定）。

## Q3 Figmaトークンパイプライン

### 調査結果

**部分実装（コード内生成のみ）であり、Figma同期は未着手。**

- `.github/workflows/`にworkflowがない。
- ルート`tokens/`とStyle Dictionary設定がない。
- `package.json:38-48`には自作`generate:tokens`があるが、Style Dictionary依存はない。
- buildは毎回自作generatorを実行する（`package.json:39-42`）。
- `src/tokens/`は通常のTSソースで、生成ヘッダがない。`src/styles/tokens.css`だけが生成物。
- `semantic/colors.ts:9-16`自身がdarkを「将来」と記述している。

### 推奨方針

Phase A-1ではコードを暫定SoTとして3テーマとmotion/data-vizを整える。その確定内容をFigma Variablesへ同じキーで反映し、エクスポート形式・差分検証・一方向同期が動くまで「FigmaがSoT」と表現しない。自動化稼働後は、生成物にヘッダとCIの`generate → git diff --exit-code`を追加する。

### 未確定

- Tokens Studioを継続採用するか、Figma API/MCPから独自生成するか。
- Figma側更新権限と同期方向。双方向同期は衝突源になるため推奨しない。

## Q8 モーショントークンとMotion

### 調査結果

Ibukiの原則は「値・状態が変わった瞬間だけ」であり、reduced motionでは即時反映する（`25_design_system.md:165-175`）。これは物理演算採用と矛盾せず、**適用場面を制限する上位原則**である。

Nexvynの`lib/motion-tokens.ts:13-18`（2026-07-29確認）は `fast 400/30/0.8`、`press 700/32/1`、`moderate 300/24/1`、`settle 260/26/1` を持つ。参考値としては有用だが、Kedamaの非直接操作にovershootを持ち込まないよう再調整が必要。

Motion公式はphysics springを`stiffness/damping/mass`、inertiaを`power/timeConstant`で定義する。[Transitions](https://motion.dev/docs/react-transitions)（2026-07-29確認）。公式ドキュメント表示版はv12.42.1である。[Motion docs](https://motion.dev/docs)（同日確認）。

### 推奨方針

primitive:

```ts
motionSpring = {
  fast:   { type: 'spring', stiffness: 400, damping: 34, mass: 0.8 },
  settle: { type: 'spring', stiffness: 260, damping: 30, mass: 1 },
  press:  { type: 'spring', stiffness: 500, damping: 38, mass: 0.8 },
  directRelease: { type: 'spring', stiffness: 300, damping: 24, mass: 1 },
}
motionInertia = { directRelease: { type: 'inertia', power: 0.25, timeConstant: 250 } }
```

semantic:

- `motion.feedback.press → spring.fast`
- `motion.overlay.enter/exit → spring.settle`
- `motion.disclosure.expand/collapse → spring.settle`
- `motion.value.change → spring.fast`
- `motion.drag.release → inertia.directRelease`（境界衝突springのみovershoot可）

割当: Button=press、Badge/Card/Skeleton/Spinner/Icon=原則なし、Drawer/Toast=overlay、Accordion=disclosure、ThemeToggle/IconSwap/RollingText=value-change。Spinnerの連続回転は機能状態だがreduced motion時は静止アイコン＋ラベルを使う。

`motion`はpeer dependency `^12.42.1`を採用候補とし、Vite externalへ追加する。公開コンポーネントは`LazyMotion + m`を前提にせず、ライブラリ内で通常`motion`を混ぜることも避ける。推奨は`KedamaProvider`（client component）がThemeProviderと`MotionConfig reducedMotion="user"`を束ねる案(c)。個別providerもexportし、既存利用者は段階移行できるようにする。Motion公式ではreduced motion時にtransform/layoutが無効になりopacity/colorは残るため、opacityの短い遷移は許容できる。[MotionConfig](https://motion.dev/docs/react-motion-config)（2026-07-29確認）。

バンドルを重視する場合、`m` + `LazyMotion`は初期約4.6KB、`motion` componentは約34KBと公式が説明する。ただしdragには`domMax`が必要である。[Reduce bundle size](https://motion.dev/docs/react-reduce-bundle-size)（2026-07-29確認）。KedamaProviderで`LazyMotion strict features={domMax}`を一度だけ置く案をPhase A-2のbundle計測で採否決定する。

### 未確定

- 上記値はStorybookで実機評価が必要。
- Next.js RSC境界でproviderをどのlayoutに置くか。
- Motionのpeer範囲を12系固定にするか次majorを許容するか。

## Q9 すらすらスタジオ

### 調査結果

実装済みpageは10ルート（内部: dashboard、記事一覧、記事詳細、login、2FA、MFA、step-up。client: 記事レビュー、todo、invite）。主要12というmemlogとの差は、仕様上の画面とNext.js routeの数え方が異なるためで、未実装画面は仕様書の状態と突合が必要。

ログインにsidebarが出る直接原因は、`(internal)/layout.tsx`がsidebarを無条件描画し、コメントでもloginが同配下と明記していること（同`:1-5,36-64`）。client側は既に`invite/layout.tsx:1-11`と`(app)/layout.tsx:1-24`を分離しており正しい原型がある。

Kedama 0.1.0は6コンポーネントとtokens/stylesを含むtgzで、アプリは`Button/TextField/Modal`を複数画面で利用し、`kedama-theme.css:16-25`でpackage CSSの後にローカル`design-tokens.css`を重ねている。つまり統合は実証済みだが、ローカル上書きが第二のsemantic層になっている。

`review-shell.tsx`は約46KBで、DOM text mapping、highlight、fetch、MFA、sheet、comment、approval、queue navigationを同居させる（同`:50-242,338-601,637-949`）。これはシェル以外の主要な構造問題である。`article-table.tsx`もURL filter、TanStack状態、セル描画を同居させるが、props境界は比較的明確（同`:27-54,88-114`）。

### 推奨方針

- `(internal)`直下からlogin/2FAを`(auth)`へ移し`AuthShell`を適用。認証済み画面だけ`(app)` + `AppShell`へ置く。layoutで認可ロジックは増やさない。
- containerとして残す: pageの認可・DB取得、mutation/fetch、MFA/approval業務状態、URL filter。
- presentationalへ抽出: ArticleTable表示、FilterBar、ArticleWorkspace、EditorCanvas、SelectionReviewToolbar、CommentThread、MetadataInspector、VersionTimeline/Diff、ApprovalBar、PublishStatus。
- `review-shell`は`useReviewWorkflow`等のcontainer hookと、上記表示部品へ分割する。DOM anchor/highlightは純粋adapterとして独立させ、見た目の部品へ入れない。
- ローカルCSSは、製品固有のarticle proseとshell寸法だけ残す。色・radius・focus・状態色はKedama semanticへ移し、Ibuki/shadcn alias経由で消費する。

17件の分類:

- Tier 2: AppShell、FilterBar、SavedViewPicker、ArticleTable（generic DataTable wrapper）、ReviewRail（generic RightPane pattern）。
- Tier 3: ClientSwitcher、ArticleRow、ArticleStatus、ArticleWorkspace、EditorCanvas、SelectionReviewToolbar、CommentThread、MetadataInspector、VersionTimeline、VersionDiff、ApprovalBar、PublishStatus。

AppShell仮説は**一部支持だが単独原因として不十分**。支持証拠は無条件sidebar layoutとshell chromeの分散。反証/説明外はclient側が既にshell分離しても46KBのreview shellが残ること。その他の原因はCSSの二重semantic層、container/presentation混在、画面固有の固定position/right pane、状態とDOM highlightingの密結合である。

a11y: 現行テストはWCAG 2.2 A/AAに紐づくAlfa ruleだけをblockingにする（`test/a11y-e2e/a11y.spec.ts:23-41,52-95`）。意味のある通常テキストに`text-faint`を使えば1.4.3で失敗し得る。装飾図形なら1.4.11の3:1対象になり得るが、非active/disabledや純装飾は文脈依存である。実装後に全3テーマで本文、placeholder、disabled、軸ラベル、control boundaryを個別fixtureとして追加する。

### 未確定

- 仕様書上12画面の「部分/未実装」定義。
- Tier 2のArticleTableがどこまで業務列を知らないAPIにできるか。
- UI全面再構築の受入用visual baseline。

## Q4 Base UI振り分け

### 調査結果

Kedama Modalはnative dialogの`showModal/close`に依存（`Modal.tsx:72-109`）し、基本的なmodalには十分。一方Ibuki Drawerは`hideOthers`、focus/dismiss layer、Presence unmountを保証し、`forceMount`が閉じたlayerを残す危険まで記録している（`drawer.tsx:39-51`）。

公式最新安定は`@base-ui/react` v1.6.0（2026-07-29確認）。Drawerはv1.3でstable、v1.6でmobile改善。[Base UI releases](https://base-ui.com/react/overview/releases)。単一tree-shakable packageである。[Quick start](https://base-ui.com/react/overview/quick-start)。

### 推奨方針

| Tier 0 | 方針 |
|---|---|
| Button | Base UI Buttonの`render`を利用 |
| Badge/Card/Skeleton/Spinner/IconSwap/RollingText | 自作/移植 |
| ThemeProvider/Toggle | 自作維持 |
| Drawer | Base UI Drawer推奨 |
| Accordion | Base UI Accordion推奨 |
| Toast | Base UI Toast推奨 |

横スワイプ、mount lifecycle、他要素inertまでModalへ自作追加するよりBase UI Drawerを使う方が低リスクである。したがって親仕様書§4を残し、§2.2のnative Drawer候補を削除する。Modalはnativeのまま別用途として維持する。

### 未確定

- shadcn Base UI variantがv1.6のDrawer APIを追随しているか。
- native ModalとBase UI overlayを同時に開く場合のlayer policy。

## Q5 Tier 1

### 調査結果

- 公開Tier 1: BarH、Donut、Gauge、Grass、Sparkline、Timeline/TimelineRow、TrendLine、Waterfall、TrackBar = 9ファミリー。
- 内部utility: palette、date-math、grass-math。
- 対象外: Radar18、radar-math（Tier 3）。
- Recharts実依存はSparkline（`sparkline.tsx:4`）とTrendLine（`trend-line.tsx:4`）だけ。他はCSS/自前SVG。
- Ibuki catalog指定は`^3.8.1`、lock解決は3.9.1。Kedama Viteは現在React等だけexternal（`vite.config.ts:22-35`）。

### 推奨方針

Rechartsはoptional peer dependency `^3.9.1`とし、`recharts`をexternal化する。さらに`./charts` subpathを設け、core importがRechartsを要求しない構成にする。Sparkline/TrendLineだけRecharts entryへ置く方法も検討する。

data-viz semantic:

```text
dataViz.categorical.neutral.{primary,secondary,previous}
dataViz.emphasis.positive
dataViz.axis.default
dataViz.grid.default
dataViz.heatmap.{empty,low,medium,high,max}
```

すべてprimitive aliasとし、status colorを系列色に流用しない。

### 未確定

- RechartsなしでSparkline/TrendLineも自前SVGへ寄せるか（依存削減との比較）。
- 9ファミリーという数え方を公開APIの正式な在庫表へ反映するか。

## Q6 公開方式

### 調査結果

GitHubは旧URLをredirectしclone/fetch/pushも動くが、remote更新を推奨する。issues/PR/secrets/webhooksは移る一方、Pages URLはredirectされず、package link/Actions accessは再確認が必要。[Repository transfer](https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository)、[package permissions](https://docs.github.com/en/packages/learn-github-packages/about-permissions-for-github-packages)（2026-07-29確認）。

### 推奨方針

**(a) `kedama` Organizationを作成して移管**を推奨する。ブランド名を維持でき、将来のregistry/APIを同一organization配下に置けるため、外販時の再改名コストが最小である。

| 案 | 評価 |
|---|---|
| (a) org移管 | 初期設定は必要だが長期的に最良 |
| (b) rename | 最短。ただし全consumer importと将来ブランドを個人名へ固定 |
| (c) git依存 | version/lock/配布CSS/認証/リリース管理が弱く、本番正式配布には不適 |

### 未確定

- `kedama` organization名の取得可否、プラン、所有者/復旧者。
- private packageを消費する各repoのtoken運用。

## Q7 コントラストとDoD

### 調査結果

現行のcontrast testはLightテーマ固定の配列で、Dark/High Contrastを同じ基準で検証していない（`tests/contrast.test.ts:52-157`）。またブリーフ記載の`text-faint` 3:1案は、意味のある通常テキストへ適用するとWCAG AAの4.5:1要件を満たさない。

### 推奨方針

提示されたborder/text-muted修正は妥当。ただし`text-faint`を「テキスト」と呼びながら3:1へ緩和する案は不採用とする。`fg.decorative`へ分離し、意味のある文字には使用禁止。placeholderは既存`fg.placeholder`、disabledは`fg.disabled`、軸ラベルは読ませるなら4.5:1を満たす`fg.muted`を使う。Dark surfaceをbirch/700からbirch/800へ下げる案をStorybookで比較し、本文階調の余地を優先する。

テストはtheme定義を引数にした表駆動へ変更し、caseを `{theme, role, fg, bg, threshold, rationale}` とする。例外はtoken名のallowlistではなく、具体的なpairと用途、WCAG criterion、期限を持たせる。現在はLight固定配列である（`tests/contrast.test.ts:52-157`）。

DoD:

- A-0: Q1〜Q9の人間決定、ADR、未確定事項owner/期限、公開名確定。
- A-1: primitive→semantic→aliases生成、3テーマ・data-viz・motion、全contrast test、Figma反映方針、生成差分ゼロ。
- A-2: Tier 0/1 API・test・Story、keyboard/focus/reduced-motion、bundle/peer検証、packageをclean consumerへ導入、Vercel Storybook。
- B: AppShell/AuthShellと必要Tier 2をregistryからfresh installでき、すらすらの主要2画面をStorybookで構成可能。
- C: presentational層を正式packageへ置換、既存業務/E2E/a11yを維持、tarballと重複semantic CSSを除去、受入visual比較合格。

### 未確定

- Dark surfaceの最終段。
- visual regressionをChromaticにするかPlaywright screenshotにするか。

## 着手順

1. A-0: Q1 API、Q2 alias方式、Q6 package ownerを人間が確定。
2. Q3の暫定SoT方針を確定し、primitiveの不足（scrim/data-viz/motion）を追加。
3. semanticを3テーマ分定義し、Q7 contrastを合格させる。
4. CSS/shadcn/Ibuki aliasをgeneratorから生成する。
5. Q8 providerとpeer/external構成を確定。
6. Q1統合後、Q4の低層部品、Q5 chartの順にTier 0/1を実装。
7. Storybook・package publish・clean consumer smoke testでA-2を閉じる。
8. AppShell/AuthShellを最初にPhase Bへ進め、Q9のTier 2を追加。
9. すらすらスタジオのpresentational層を段階的に置換しPhase Cの受入を行う。

この順序は `primitive → semantic → component`（`docs/design-rules.md:15-25`および同`:208-218`）を守り、適用先の検証までをゴールに含める。
