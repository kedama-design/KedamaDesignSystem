# AppShell デザインレビュー

> 2026-08-15。Phase B の初回実装に対する「全体に洗練された感じがなく違和感がある」
> というレビューを、VS Code / Linear の公式資料と実画面から分解した記録。

## 診断

初回実装は必要な領域を正しく備えていたが、すべてのクロームが同じ強さで並んでいた。

- 48px の単一ヘッダーにパンくず、検索、通知、テーマ切替、ペイン操作が同居していた
- IconRail に小さな可視ラベルがあり、SidebarNav と情報量が重複していた
- 選択中のレール項目を大きな色面で示し、作業内容よりクロームが目立っていた
- 既定ストーリーが一覧全体を Card に入れ、アプリの作業面より「部品の見本」に見えた
- 現在開いている作業の単位が無く、現在地と操作の階層が一段に潰れていた
- 初回の改善では Linear の丸いタブを強く採り、VS Code 型ワークベンチとしては
  Title Bar と Editor 領域の境界がまだ不足していた

違和感の正体は、余白や角丸ひとつではなく、**作業面とアプリクロームの主従が曖昧**なことだった。

## 公式資料から採ること

### VS Code

[UX Guidelines overview](https://code.visualstudio.com/api/ux-guidelines/overview) と
[User Interface](https://code.visualstudio.com/docs/editing/userinterface) は、Activity Bar が
Primary Sidebar の View Container を選び、editor tabs が editor group の上部で開いている
作業を整理する構造を示している。

- Title Bar / Command Center はワークベンチ全体の移動と検索を受け持つ
- IconRail は領域の切替だけを担い、SidebarNav の内容を繰り返さない
- タブはアプリ全体ではなく、作業領域の上に置く
- Editor tabs は隙間のあるピルではなく、連続した矩形と上辺アクセントで現在地を示す
- Status Bar は常設するが、主コンテンツより強く見せない
- Sidebar / editor / secondary sidebar は別々の責務として扱う

[Activity Bar](https://code.visualstudio.com/api/ux-guidelines/activity-bar) と
[Sidebars](https://code.visualstudio.com/api/ux-guidelines/sidebars) の指針に沿い、レールの各項目は
重複しない明確なアイコンと名前を持つ。名前は視覚ラベルではなく `aria-label` / `title` に残す。

### Linear

[How we redesigned the Linear UI](https://linear.app/now/how-we-redesigned-the-linear-ui) は、
sidebar、tabs、app headers、view headers、panels を別の領域として定義し、視覚ノイズを減らしながら
階層と密度を整えた過程を説明している。

[Behind the latest design refresh](https://linear.app/now/behind-the-latest-design-refresh) では、
ナビゲーションのクロームを後退させ、内容を主役にすること、タブを小さく丸くコンパクトにすることが
明記されている。

- 作業タブと現在ビューのヘッダーを分ける
- 背景面と細い境界で階層を作り、影や大きな選択面を増やさない
- グローバル検索は常時入力欄ではなく、コンパクトなコマンド入口として置く
- 作業内容は余分な Card で囲わず、主サーフェスへ直接置く

## Kedama での決定

1. `IconRail` は常に視覚的にアイコンのみ。`showLabels` は持たない。現在地は細い
   アクセントインジケーターと `aria-current` で示す。
2. `AppTitleBar` を任意スロットとして追加する。全体の履歴移動・Command Center・
   レイアウト操作はここへ置き、Editor 内の操作と分ける。
3. `AppHeader` は連続する矩形の作業タブを持つ。View Header はビュー固有の現在地・
   検索・操作がある場合だけ加える。タブと同じ現在地を繰り返すだけなら描かず、
   横段を増やさない。モバイルは必要な View Header だけを残す。
4. タブ API は ID、選択、閉じるまで。別画面を開いたときにプロダクト側がタブを追加し、
   既に開いていれば選択する。対象が曖昧な汎用の `+` は置かない。履歴、並べ替え、
   ピン留め、永続化はルーターや保存先を持つ各プロダクトの責務とする。
5. Title Bar / タブ / View Header は36px、Activity Bar は48pxセル、Sidebar の項目は
   24pxを密度の基準にする。表示文字列によって寸法を変えない。
6. Sidebar の非選択項目と StatusBar は一段後退させる。主コンテンツは `bg-surface` の
   連続した作業面にする。
7. 既定ストーリーは Card のショーケースにせず、実際の一覧作業を評価できる密度で組む。
8. `IconRail` の下部にはアカウントと**アプリ全体設定**を置く。選択中サイトだけに効く
   **サイト設定**は SiteSwitcher と同じスコープの `SidebarNav` に置く。逆にすると、サイトを
   切り替える前のレールにサイト固有操作が現れ、対象が曖昧になる。
9. `RightPane` の見出しは隣接する一覧の列見出しと同じ40pxに揃え、`bg-sidebar` で本文とは
   別のシェル面だと示す。デスクトップは幅と不透明度、モバイルの `Drawer` は移動と不透明度を
   補間して現れる。いずれも既存のセマンティックモーションを使う。

### 記事管理ワークフローへの適用（2026-08-16）

`税理士法人みずほ記事/01_記事管理表/index.html` を参照すると、元画面はサマリーカード、
全体検索、6つの独立select、件数、18列の表を縦に積んでいた。データの棚卸しには有効だが、
日常の共有・編集では操作面が増え、記事そのものへ到達するまでが長い。

- SidebarNav の `header` はクライアント名ではなく現在の**サイト名**にする。複数サイトを
  持つプロダクトはこのスロットへ SiteSwitcher を置く。切替状態とサイト一覧はプロダクト側が持つ
- 一覧上部の独立ツールバーは置かない。タイトル検索・カテゴリ・ステータスは `DataTable` の
  対応する列ヘッダーを押して操作する
- 件数は StatusBar に置き、フィルタ後件数 / サイト内全件数を常時確認できるようにする
- 記事名と行末へ編集を置き、共有URLのコピーを同じ行から実行できるようにする
- 一括操作が必要な一覧では選択列を先頭に置く。選択中だけ StatusBar に件数と一括操作を
  表示し、常設の操作段は増やさない
- 列見出しと本文は同じセル余白を使う。見出しボタンへ追加の横余白を入れず、文字の
  開始位置を揃える
- 列見出しはホバーで面全体を反転させない。低コントラストの chevron を常設し、ホバーは
  文字と記号の濃度だけを変える。フィルタ・ソート適用時は記号とアクセント色で状態を残す
- 記事一覧は `ID / 区分 / カテゴリ / タイトル / ステータス / 想定KW / 関連KW /
連携クラスター / 優先度 / CTA該当目的 / 公開フェーズ / 親（ピラー） / ライブURL /
記事URL / 公開日 / ターゲット読者 / 記事概要 / 備考` の18列を列IDで定義する
- サイト設定では18列の表示・非表示をサイトごとに保持する。列の順序や日本語ラベルではなく
  安定した列IDを保存する
- 既定の縦構造は `Editor tabs → DataTable header` の2段とする。横断的な複合条件が
  本当に必要な画面だけ、Tier 2 の FilterBar を追加する

これは Linear / VS Code の画面を複製する決定ではない。両者から借りるのは、クロームの責務分離、
情報階層、反復作業に適した密度である。色、タイポグラフィ、モーションは Kedama の
セマンティックトークンと Calm UI に従う。

## 今回は持たないもの

- タブのドラッグ並べ替え、ピン留め、履歴スタック、セッション復元
- Tooltip コンポーネント（Tier 0 に無いため、IconRail は当面 `title` を使う）
- プロダクト固有の検索実装、ルーター、通知、アカウントメニュー
- OS 固有のウィンドウボタン、ドラッグ領域（Web / Electron の実装先で決める）
- Linear / VS Code 固有のブランド表現やピクセル単位の模倣
