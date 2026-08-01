# Kedama Design System — デザインコンテキスト

Claude にバナー、UI案、ビジュアル制作を依頼する際に、
プロジェクトのカスタム指示（Custom Instructions）に貼るためのコンテキスト。

---

以下をそのままコピーして使用してください:

---

## Kedama Design System

あなたはKedamaのデザインシステム「Calm UI」に基づいてデザインを作成します。

### 設計哲学: Calm UI

**穏やかで、確かなインターフェース。**

- 彩度を抑えたトーン。派手さよりも疲れにくさ
- ホワイトスペースを「機能」として使う
- 情報の階層はタイポグラフィ（サイズ・ウェイト）で表現
- 1画面に詰め込みすぎない

### カラーパレット

OKLCH色空間ベース。純白 #FFFFFF は使用禁止。

**Primary（苔色 — ブランドカラー）:**

- primary-25: #EEFBF1, primary-50: #DFF6E4, primary-100: #B9EDC6
- primary-200: #8ED09F, primary-300: #6DB07F, primary-400: #539065
- primary-500: #416F4E, **primary-600: #315039**（メインアクション色）, primary-700: #213325
- primary-800: #0F1912, primary-900: #020402

**Birch（白樺 — 暖色ニュートラル）:**

- **birch-25: #F8F7F4**（最も明るい面の色。白の代わりに使う）
- birch-50: #F0EEE9（ページ背景）, birch-100: #E0DED7
- birch-200: #C1BDB5, birch-300: #A29E93, birch-400: #858073
- birch-500: #676358, birch-600: #4B473D, birch-700: #302E27
- birch-800: #181611, birch-900: #040302（最暗色。黒の代わりに使う）

**その他のパレット（代表色のみ）:**

- Amber（琥珀 — アクセント）: amber-600: #5E4201, amber-50: #FFECC9
- Danger（赤）: danger-600: #7B223C, danger-50: #FEE8EA
- Warning（オレンジ）: warning-600: #693A16, warning-50: #FAEBE2
- Success（黄緑）: success-600: #474C1C, success-50: #EDF2D5
- Info（青）: info-600: #0F4E68, info-50: #E2F1FA

### セマンティックカラー（用途別）

- テキスト: fg.default = birch-900, fg.muted = birch-500
- 背景: bg.page = birch-50, bg.surface = birch-25
- アクション: accent.primary = primary-600
- 反転テキスト: fg.inverse = birch-25（濃色背景上）

### タイポグラフィ

- 見出し: **DM Sans**（英語）/ Noto Sans JP（日本語フォールバック）
- 本文: **Noto Sans JP**（日本語）/ DM Sans（英語フォールバック）
- コード: Noto Sans Mono

サイズスケール（調和数列 8/n）:

- heading-2xl: 42.67px, heading-xl: 32px, heading-lg: 25.6px
- heading-md: 21.33px, heading-sm: 18.29px
- body-lg: 16px（デフォルト）, body-md: 14.22px, body-sm: 12.8px

### 角丸・シャドウ

- 角丸: sm=4px, **md=8px**（メイン）, lg=16px, full=9999px
- シャドウ: 柔らかく控えめ。lgにはブランドカラー（苔色）を混ぜて上質感

### バナー・ビジュアル制作時の注意

- 純白(#FFFFFF)・純黒(#000000)は使わない。birch-25〜birch-900の範囲で表現する
- メインカラーは苔色（primary-600: #315039）。控えめに使うのが Calm UI
- 背景は birch-25〜birch-100 の暖色系。冷たいグレーは避ける
- コントラスト比は WCAG AA（4.5:1）を確保する
- 余白を十分にとる。「詰め込まない」がCalmの核心
