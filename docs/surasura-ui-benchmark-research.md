---
title: スラスラスタジオ UIベンチマーク調査
status: research
created: 2026-07-28
updated: 2026-07-28
scope: Slack / Linear / VS Code / Resend / Base UI / shadcn-ui
---

# UIベンチマーク調査

## 1. 調査の目的

本資料は、旧仕様の「社内画面／クライアント画面」「承認TODO中心」の構成を改善するための調査メモである。

目標は他製品の見た目をコピーすることではなく、次のMVPに適した情報設計・操作原則・UI基盤を選び直すことにある。

### 対象MVP

1. クライアントと記事進捗を共同管理する
2. 作成済みの記事をシステムへ登録する
3. クライアントが本文、タイトル、ディスクリプション、キーワード、アイキャッチ画像、URLを確認する
4. テキスト範囲を指定して修正依頼できる
5. 直接編集した場合も変更履歴を残す
6. 承認できる
7. 承認済み記事をWordPressへ入稿する
8. 承認権限の有無にかかわらず、参加者は同じ記事一覧と記事ワークスペースを利用する

## 2. 結論

### UXの中心

**記事一覧がダッシュボードであり、記事ワークスペースが製品の中心である。**

MVPではKPIカードやチャートを並べた独立ダッシュボードを置かない。利用者が最初に知りたいのは「どの記事が、どの状態で、次に誰が何をするか」であり、記事一覧から直接作業へ入れることの方が重要である。

### 採用する構成

- Slack / VS Codeから、安定した左サイドバーと文脈別ワークスペース
- Linear / Resendから、高密度な一覧、検索、フィルター、保存ビュー
- Linear Docs / Microsoft Wordから、範囲コメント、スレッド、解決、編集履歴、差分復元
- VS Codeから、中央の主作業領域と開閉可能な右ペイン、集中モード
- Resendから、状態と失敗理由をその場で説明する運用UI
- Base UIから、アクセシブルな振る舞いのプリミティブ
- shadcn/uiから、所有・改変できるコンポーネントコードと一貫したUIトークン

### 採用しない構成

- 利用者種別ごとに別アプリのような画面構成を作る
- 「自分の承認TODO」だけを承認担当者のホームにする
- shadcn/uiの `dashboard-01` をそのまま採用し、KPIカードとチャートを置く
- すべてをカードで囲み、一覧性を落とす
- Slackの多階層ナビゲーションをそのまま持ち込む
- VS Codeの高度なレイアウト自由度をMVPに持ち込む
- Base UIを導入しただけでプロダクト固有のデザインが完成したとみなす

## 3. 製品別分析

### 3.1 Slack

#### 優れている点

- グローバルな移動、文脈内の移動、主コンテンツを空間的に分離している
- チャンネルの中にメッセージ、Canvas、リスト、ワークフロー、ファイルを置き、関連情報を文脈から切り離さない
- サイドバーのセクションを折りたたみ、絞り込み、並べ替えできる
- キーボード移動とアクセシビリティ領域移動が設計されている
- 未読や変化は強調する一方、非アクティブ項目は静かにする

#### 今回への適用

- 「クライアント → 記事 → 記事内の情報」という文脈を保つ
- 記事本文、修正依頼、履歴、メタデータ、公開状態を別ページに散らさず、同じ記事ワークスペースに置く
- 左サイドバーは一層を基本とし、Slackのような複数レールは導入しない

#### 避ける点

- ワークスペース、チャンネル、DM、スレッドを模した過剰な階層
- コミュニケーション機能を増やし、記事管理よりチャットが主役になること

#### 参考

- [Slack サイドバー設定](https://slack.com/help/articles/212596808-Adjust-your-sidebar-preferences)
- [Slack キーボードショートカット](https://slack.com/help/articles/201374536-Slack-keyboard-shortcuts)
- [Slack Canvas](https://slack.com/intl/ja-jp/features/canvas)
- [チャンネルとDMのタブ](https://slack.com/help/articles/32562841868307-Add-and-manage-tabs-in-channels-and-direct-messages)
- [Slackのアクセシビリティ](https://slack.com/help/articles/4455747966739-Accessibility-in-Slack)

### 3.2 Linear

#### 優れている点

- オブジェクト一覧の密度が高く、行、細い区切り、最小限のメタデータで全体像を把握できる
- フィルターがURLに反映され、保存ビューを共有できる
- 表示方法、グルーピング、並べ替え、表示プロパティをユーザーが選べる
- タイトルと説明をその場で編集でき、説明の履歴と復元を持つ
- 選択テキストへのインラインコメント、返信、解決、履歴、共同カーソルを備える
- コマンドメニューが現在の文脈に応じて操作候補を変える
- 「最初は単純、必要に応じて強力」という設計思想が明確

#### 今回への適用

- 記事一覧はカードグリッドではなく、グループ化可能な高密度リスト／テーブルにする
- 「すべて」「確認待ち」「修正中」「承認済み」「公開済み」を保存ビューとして扱う
- 「自分の確認待ち」はホームではなく、共有一覧に対する派生ビューとする
- 記事編集では、テキスト範囲への修正依頼と直接編集履歴を同じ変更モデルで扱う
- 検索・記事移動・状態変更の補助として `Cmd/Ctrl + K` を用意する

#### 避ける点

- 暗色・小サイズ・高密度を表面的にコピーし、長文の日本語記事を読みにくくすること
- ショートカットを唯一の操作経路にすること

#### 参考

- [Editing issues](https://linear.app/docs/editing-issues)
- [Filters](https://linear.app/docs/filters)
- [Custom views](https://linear.app/docs/custom-views)
- [Display options](https://linear.app/docs/display-options)
- [Issue documents](https://linear.app/docs/issue-documents)
- [Command menu](https://linear.app/changelog/2019-12-18-new-command-menu)
- [Linear Method](https://linear.app/method/introduction)

### 3.3 VS Code

#### 優れている点

- Activity Bar、Primary Sidebar、Editor、Secondary Sidebar、Panel、Status Barの役割が明快
- 中央の編集対象を主役にし、補助情報は周辺ペインへ置く
- ペインを開閉・リサイズでき、必要な時だけ情報量を増やせる
- Zen Modeで主作業以外を隠せる
- Command Paletteが操作の横断入口になる
- 差分、複数選択、選択範囲内検索など、編集対象への直接操作が強い
- 領域移動、ツールバー操作、差分ビューのアクセシビリティが設計されている

#### 今回への適用

- 中央に記事エディタ、右側に「レビュー／詳細／履歴」ペインを置く
- 右ペインと左サイドバーを閉じられる集中モードを用意する
- WordPress入稿状態や自動保存状態は、作業を邪魔しない小さな状態表示にする
- 差分比較はアクセシブルなテキスト表現を持ち、色だけで変更を示さない

#### 避ける点

- 任意の多分割エディタ
- ユーザーが自由にすべての領域を移動できる高度な設定
- アイコンだけで意味を推測させるナビゲーション

#### 参考

- [VS Code User Interface](https://code.visualstudio.com/docs/editing/userinterface)
- [Basic Editing](https://code.visualstudio.com/docs/editing/codebasics)
- [Accessibility](https://code.visualstudio.com/docs/configure/accessibility/accessibility)
- [Default Keyboard Shortcuts](https://code.visualstudio.com/docs/reference/default-keybindings)

### 3.4 Resend

#### 優れている点

- Logsは、検索、フィルター、高密度テーブル、詳細の順で構成される
- エラーを状態色だけで終わらせず、原因と対処につながる説明を見せる
- キーボードショートカットを隠さず表示する
- 一括操作を提供しつつ、破壊的操作は明示確認する
- 製品内ドキュメントによって、作業中のタブ移動を減らす
- コンセプト、実データによる早期実装、コード上でのポリッシュという設計工程を採用する

#### 今回への適用

- 記事一覧はタイトル、検索、絞り込み、テーブルから始める
- WordPress入稿失敗は「失敗」だけでなく、認証、URL、権限、通信などの原因と再試行導線を示す
- 一括状態変更は必要な場合だけ導入し、削除や公開は必ず確認する
- デザインは静的モックだけで完結させず、実際の記事データを入れたHTMLプロトタイプで検証する

#### 避ける点

- メール配信メトリクスを模した無意味なグラフ
- 黒背景とモノクロ表現をブランドとしてそのままコピーすること

#### 参考

- [Improved Logs Visibility](https://resend.com/changelog/improved-logs-visibility)
- [Enhanced Metrics Dashboard](https://resend.com/changelog/enhanced-metrics-dashboard)
- [Keyboard Shortcut Visibility](https://resend.com/changelog/keyboard-shortcut-visibility)
- [Bulk Actions](https://resend.com/changelog/bulk-actions)
- [In-app Docs](https://resend.com/changelog/in-app-docs)
- [Resend Design Handbook](https://resend.com/handbook/design)

## 4. Base UI分析

### Base UIの役割

Base UIは、見た目を完成させるデザインシステムではなく、スタイルを持たないReact UIプリミティブ群である。

主な価値は次の通り。

- ARIA属性
- キーボード操作
- フォーカス管理
- ポインター操作
- Dialog、Menu、Popover、Combobox、Tabs、Toolbarなどの振る舞い
- CSSや既存デザインシステムに依存しない構成

したがって、Base UIを採用しても、余白、色、階層、密度、タイポグラフィ、状態表現は別途設計する必要がある。

### 今回への適用

- Dialog：承認確認、WordPress公開確認
- Popover：選択範囲からの修正依頼
- Menu / Context Menu：記事行やコメントの追加操作
- Combobox：クライアント、担当者、ステータス選択
- Tabs：右ペインのレビュー／詳細／履歴
- Toolbar：エディタ書式とレビュー操作
- Tooltip：意味が自明でないアイコンの補足

### 実装上の注意

- フォーカスリング、コントラスト、ラベルはアプリ側で設計する
- 水平Toolbarではテキスト入力と矢印キー移動の競合に注意する
- アニメーションは中断・反転しやすいtransitionを基本とする
- 右クリックだけに依存せず、同じ操作を通常メニューからも提供する

### 参考

- [About Base UI](https://base-ui.com/react/overview/about)
- [Accessibility](https://base-ui.com/react/overview/accessibility)
- [Animation](https://base-ui.com/react/handbook/animation)
- [Toolbar](https://base-ui.com/react/components/toolbar)
- [Context Menu](https://base-ui.com/react/components/context-menu)
- [Dialog](https://base-ui.com/react/components/dialog)
- [Base UI](https://base-ui.com/)

## 5. shadcn/ui分析

### 優れている点

- パッケージのブラックボックスではなく、アプリ側が所有・改変できるソースコード
- Sidebar、Data Table、Command、SheetなどMVPに必要な基礎部品が揃う
- レスポンシブ、アクセシビリティ、構成可能性を前提にしたBlocks
- Data Tableを一つの万能コンポーネントにせず、用途別に組み立てる方針
- 2026年7月時点では新規プロジェクトの標準基盤がBase UI

### 注意点

公式の `dashboard-01` は、サイドバー、4枚のKPIカード、大きなチャート、データテーブルという汎用ダッシュボード構成である。記事共同管理MVPにそのまま使うと、最も重要な記事一覧が画面下へ押し下げられる。

**利用すべきなのはプリミティブと実装品質であり、汎用ダッシュボードの構図ではない。**

### 推奨方針

- 新規UIは `shadcn/ui + Base UI variant` に統一する
- Radix版とBase UI版を無秩序に混在させない
- Tailwindのトークンをプロダクト固有の意味で定義する
- TanStack Tableを記事一覧の状態・並べ替え・絞り込みに使う
- モバイルでは右ペインをSheetへ変換する
- Commandは補助入口として使い、主要操作は画面上にも残す

### 参考

- [Dashboard Blocks](https://ui.shadcn.com/blocks?category=dashboard)
- [Sidebar Blocks](https://ui.shadcn.com/blocks/sidebar)
- [Sidebar Component](https://ui.shadcn.com/docs/components/base/sidebar)
- [Data Table](https://ui.shadcn.com/docs/components/base/data-table)
- [Command](https://ui.shadcn.com/docs/components/base/command)
- [Sheet](https://ui.shadcn.com/docs/components/base/sheet)
- [Base UI is now the default](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default)
- [Blocks for Base UI](https://ui.shadcn.com/docs/changelog/2026-02-blocks)

## 6. shadcn/ui系SaaS・ダッシュボードの実例

### OpenStatus

OpenStatusは、Next.js、Tailwind、shadcn/uiを明示したオープンソースの監視SaaSである。

新ダッシュボードでは、トップタブ中心の構成から左サイドバーへ変更し、各オブジェクトをサイドバーから直接移動可能にした。トップにはパンくずとサブページ切り替えを置き、補足情報の右サイドバーは初期状態で隠している。

今回との相性が良い点：

- オブジェクト中心の左ナビゲーション
- 必要時だけ開く右サイドバー
- 状態を一覧上に表示
- 履歴をTimeline Tableとして可視化
- 使われない上位機能を削り、対象領域を絞る姿勢

参考：

- [OpenStatus GitHub](https://github.com/openstatusHQ/openstatus)
- [New Dashboard](https://www.openstatus.dev/blog/new-dashboard-we-are-so-back)
- [Data Table Filters](https://github.com/openstatusHQ/data-table-filters)
- [OpenStatus Changelog](https://www.openstatus.dev/changelog)

### Midday

Middayは、Shadcnを利用していることを明示したオープンソースSaaSである。取引、請求、顧客、ファイルなどの業務オブジェクトを、密度の高いテーブルと一貫したオブジェクト操作で扱う。

今回との相性が良い点：

- 業務オブジェクトを主役にする
- データテーブルの静かな階層表現
- 一つの製品内で複数オブジェクトを同じ文法で扱う

注意点：

MiddayのKPIウィジェットは財務状態そのものが主要価値だから成立する。記事管理では同じ構成を採用する理由がない。

参考：

- [Midday GitHub](https://github.com/midday-ai/midday)
- [Midday](https://midday.ai/)

### Open SaaS / shadcn-admin-kit

これらは認証、CRUD、テーブル、サイドバーを短時間で組み立てる参考になる。一方、プロダクト固有の作業導線より「一般的な管理画面」が中心であり、最終UXの見本にはしない。

- [Open SaaS](https://github.com/wasp-lang/open-saas)
- [shadcn-admin-kit](https://github.com/marmelab/shadcn-admin-kit)

## 7. MVP向け推奨情報設計

### 7.1 主要サーフェス

MVPの主要画面は4系統に絞る。

1. **記事一覧**
   - ログイン後のホーム
   - 全記事と進捗を共有
   - クライアント、ステータス、担当者、期限、更新日時を表示
2. **記事ワークスペース**
   - 本文編集
   - 修正依頼
   - メタデータ確認
   - 履歴と差分
   - 承認
   - WordPress入稿状態
3. **クライアント**
   - クライアント一覧と基本情報
   - 記事一覧への絞り込み入口
4. **設定**
   - メンバー
   - 承認権限
   - WordPress接続
   - 組織設定

認証、招待、エラー、確認Dialog、モバイルSheetは主要画面ではなく状態として設計する。

### 7.2 アプリシェル

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Global: パンくず / 検索 / Cmd+K / 通知 / ユーザー                   │
├───────────────┬─────────────────────────────────────────────────────┤
│ 左サイドバー   │ 記事一覧 または 記事ワークスペース                  │
│               │                                                     │
│ 記事          │ 記事ワークスペース時：                              │
│ クライアント   │ ┌───────────────────────┬───────────────────────┐ │
│ 保存ビュー     │ │ 記事本文・編集           │ レビュー/詳細/履歴     │ │
│               │ │                       │ 開閉可能な右ペイン     │ │
│ 設定          │ └───────────────────────┴───────────────────────┘ │
└───────────────┴─────────────────────────────────────────────────────┘
```

- 左サイドバー：224〜240px
- 右ペイン：320〜400px、開閉可能
- 記事本文：読みやすい最大幅720〜780px
- モバイル：左ナビはオフキャンバス、右ペインはSheet

### 7.3 記事一覧

#### 上部

- ページ名と件数
- 新規記事／記事を追加
- 検索
- クライアント、ステータス、担当者、期限のフィルター
- 保存ビュー
- 表示オプション

#### 推奨ビュー

- すべての記事
- 自分の確認待ち
- 修正対応中
- 承認済み／入稿待ち
- 公開済み
- ユーザーが保存したカスタムビュー

「自分の確認待ち」は共通記事一覧にフィルターを適用したビューであり、別アプリや別権限画面にはしない。

#### 行に表示する情報

- 記事タイトル
- クライアント
- 制作／確認／公開ステータス
- 担当者
- 期限
- 未解決コメント数
- 最終更新者と更新日時
- WordPress入稿状態

初期表示の列を絞り、補助項目は表示オプションから追加できるようにする。

### 7.4 記事ワークスペース

#### 上部バー

- クライアント / 記事タイトルのパンくず
- 自動保存／保存完了／競合の状態
- 現在のバージョン
- 共有／その他
- 修正を依頼
- 承認権限がある場合のみ「承認」

承認ボタンの有無以外は、原則として同じ画面・同じ情報を表示する。

#### 中央

- タイトル
- ディスクリプション
- キーワード
- URL
- アイキャッチ
- 本文

表示モードと編集モードを完全な別ページに分けず、権限と状態に応じてインライン編集する。

#### 右ペイン

1. **レビュー**
   - 未解決コメント
   - 解決済みコメント
   - 記事全体への修正依頼
2. **詳細**
   - メタデータ
   - ステータス
   - 担当者
   - 期限
   - WordPress
3. **履歴**
   - 編集、コメント、承認、差し戻し、入稿の時系列
   - バージョン比較
   - 復元

### 7.5 修正依頼と編集履歴

#### 範囲指定

1. 本文をドラッグして選択
2. 浮動ツールバーに「修正依頼」「コメント」を表示
3. 右ペインにコメント入力を開く
4. 送信後、本文の対象範囲とコメントを双方向に関連付ける
5. 返信、解決、再オープンを可能にする

キーボード利用者には、選択後のショートカットまたはエディタツールバーから同じ操作を提供する。

#### 直接編集

- 直接編集は必ず新しいバージョンとして記録する
- 誰が、いつ、どこを変更したかを残す
- 変更前後を比較できる
- 復元しても過去を上書きせず、新しいバージョンとして残す
- 承認は特定バージョンに紐付け、承認後の編集は承認状態を再確認待ちに戻す

### 7.6 WordPress入稿

- 承認されたバージョンだけを入稿対象にする
- 入稿中、成功、失敗、再試行を記事ワークスペース内に表示する
- 成功時はWordPress記事URLと入稿日時を表示する
- 失敗時は原因と対処を説明する
- 自動入稿であっても、誰が承認し、どのバージョンが入稿されたかを履歴に残す

## 8. 推奨コンポーネント構成

### 基盤

- shadcn/ui Base UI variant
- Base UI primitives
- Tailwind CSS
- TanStack Table
- Tiptapなど、範囲コメントと履歴を拡張できるリッチテキストエディタ

### プロダクト固有コンポーネント

- `AppShell`
- `ClientSwitcher`
- `ArticleTable`
- `ArticleRow`
- `ArticleStatus`
- `FilterBar`
- `SavedViewPicker`
- `ArticleWorkspace`
- `EditorCanvas`
- `SelectionReviewToolbar`
- `ReviewRail`
- `CommentThread`
- `MetadataInspector`
- `VersionTimeline`
- `VersionDiff`
- `ApprovalBar`
- `PublishStatus`

Base UI／shadcn/uiは土台として使い、上記の業務コンポーネントを製品固有のデザイン言語として設計する。

## 9. ビジュアル原則

### 推奨

- ライトモードを基準に長文の読みやすさを優先
- ニュートラルな背景と控えめな区切り
- 4〜8px程度の小さな角丸
- 主要アクションだけにアクセントカラーを使用
- ステータス色は狭い面積で使い、必ずテキストやアイコンを併用
- 一覧は高密度、本文はゆとりを持たせる
- 日本語本文に適した行長、行間、文字サイズ
- 選択、フォーカス、未解決、保存中、失敗を明確に区別

### 避ける

- グラデーション、ガラス表現、強い装飾
- すべてをカードやピルにする
- 大きなKPIカード
- 一覧より前に置かれる大きなチャート
- 色だけで状態を伝える
- 意味が曖昧なアイコンのみの操作
- 過剰な余白で一画面の情報量を落とす
- Linear／Resend風の黒い画面を理由なくコピーする

## 10. アクセシビリティの最低条件

- すべての操作をキーボードで実行できる
- フォーカス位置を常に視認できる
- サイドバー、本文、右ペイン、Dialog間を規則的に移動できる
- コメント対象範囲を色以外でも識別できる
- 差分を追加／削除のテキストと記号でも説明する
- ステータスを色だけで区別しない
- `prefers-reduced-motion` に対応する
- Dialog、Popover、Sheetを閉じた時に元の操作位置へフォーカスを戻す
- ドラッグ操作にはキーボードで実行できる代替操作を持つ
- モバイルで44px程度のタップ領域を確保する

## 11. 検証すべきプロトタイプ

次の順でHTMLプロトタイプを作成・検証する。

1. **記事一覧**
   - 全記事の俯瞰
   - フィルター
   - 保存ビュー
   - 行から記事へ移動
2. **記事レビュー**
   - テキスト選択
   - 修正依頼
   - コメント返信／解決
   - 直接編集
3. **履歴と承認**
   - バージョン比較
   - 承認
   - 承認後編集による再確認
4. **WordPress入稿**
   - 入稿中
   - 成功
   - 失敗と再試行

プロトタイプには実際に近い日本語記事、長いタイトル、複数クライアント、複数状態を入れ、静的な理想状態だけでなく未解決コメント、保存中、競合、入稿失敗も検証する。

## 12. 次の仕様化で確定が必要な項目

以下は調査では確定できないため、UX仕様化前に決める。

1. **記事の登録方法**
   - コピー＆ペースト
   - Markdown
   - Wordファイル
   - Google Docs
   - 既存URL
2. **クライアントの直接編集範囲**
   - 本文と全メタデータを編集可能にするか
   - 一部項目を修正依頼だけにするか
3. **コメントの公開範囲**
   - すべて共同コメントにするか
   - 社内メモを別に残すか
4. **モバイルMVPの範囲**
   - 閲覧、コメント、承認まで
   - 本文の本格編集まで
5. **承認ルール**
   - 一人の承認で完了か
   - 複数承認者が存在するか
   - 修正後に誰が再承認するか

## 13. 現時点の推奨仮説

- デスクトップWebを主対象にする
- モバイルは閲覧、コメント、修正依頼、承認を優先する
- 記事登録は、初期MVPでは貼り付けまたはMarkdownを最短経路とする
- 全参加者が本文とメタデータを閲覧できる
- 直接編集の可否は承認権限とは分離する
- 記事業務上の権限差は承認可否だけにし、組織設定とWordPress設定は管理権限として別に扱う

これらは調査からの推奨であり、仕様決定ではない。
