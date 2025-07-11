# Umbra Browser

**開発組織**: Aro Software Group

Umbraは、プライバシーとセキュリティを重視したブラウザ上で動作する仮想ブラウザです。**HTML/CSS/JavaScript のみで完全に構築**され、履歴を残さない匿名ブラウジング、セキュリティ機能、広告ブロック機能を提供します。

## 特徴

### 🔒 プライバシー機能
- **匿名ブラウジング**: 履歴、Cookie、キャッシュを残さない
- **プライベートモード**: セッションデータを一時的にのみ保存
- **追跡防止**: トラッキングスクリプトの自動ブロック
- **フィンガープリンティング対策**: ブラウザ指紋の偽装

### 🛡️ セキュリティ機能
- **広告ブロック**: デフォルトで広告をブロック
- **マルウェア検出**: 危険なスクリプトの検出とブロック
- **フィッシング防止**: 詐欺サイトの警告表示
- **安全性チェック**: リアルタイムでコンテンツをスキャン

### 🌐 ブラウザ機能
- **タブ管理**: 複数タブでの快適なブラウジング
- **テーマ切替**: ライト/ダークモード対応
- **レスポンシブデザイン**: モバイル・デスクトップ対応
- **検索機能**: Google、Bing、DuckDuckGo対応

## 技術的制約

- **HTML/CSS/JavaScript のみで完全に構築**
- 外部ライブラリやフレームワークは使用しない
- ブラウザ上で動作する仮想環境

## ファイル構造

```
/
├── index.html              # メインブラウザインターフェース
├── styles/
│   ├── main.css           # メインスタイルシート
│   └── themes.css         # テーマサポート
├── scripts/
│   ├── browser.js         # コアブラウザ機能
│   ├── navigation.js      # ナビゲーションと検索
│   ├── tabs.js           # タブ管理
│   ├── privacy.js        # プライバシー機能
│   └── security.js       # セキュリティ・広告ブロック
├── README.md              # プロジェクト説明
└── LICENSE               # ライセンス情報
```

## 使用方法

### 基本操作

1. **ブラウザを開く**: `index.html` をブラウザで開きます
2. **URLナビゲーション**: アドレスバーにURLを入力するか検索語句を入力
3. **タブ管理**: 新しいタブボタン(+)でタブを追加、×ボタンで閉じる
4. **設定切替**: ヘッダーボタンでテーマ、プライベートモード、広告ブロックを制御

### キーボードショートカット

- `Ctrl + T`: 新しいタブを開く
- `Ctrl + W`: 現在のタブを閉じる
- `Ctrl + Tab`: 次のタブに切り替え
- `Ctrl + Shift + Tab`: 前のタブに切り替え
- `Ctrl + 1-9`: 指定番号のタブに切り替え

### プライバシー機能

#### プライベートモード
- ヘッダーの🕶️ボタンでオン/オフ切り替え
- 有効時は履歴、Cookie、セッションデータを保存しない
- ページを閉じると自動的にデータを削除

#### 追跡防止
- デフォルトで有効
- Google Analytics、Facebook Pixel等のトラッキングスクリプトをブロック
- 追跡用Cookieの自動削除

### セキュリティ機能

#### 広告ブロック
- デフォルトで有効（🛡️ボタンで制御）
- 一般的な広告ネットワークを自動検出
- バナー広告、ポップアップ、トラッキング広告をブロック

#### マルウェア・フィッシング対策
- 危険なスクリプトの検出と自動ブロック
- 既知のマルウェア・フィッシングサイトの警告
- 疑わしいURLパターンの検出

## 開発状況

### ✅ Wave 1: 基盤開発（完了）
- [x] 基本UI構築（アドレスバー、タブ、ナビゲーションボタン）
- [x] レスポンシブデザインの実装
- [x] テーマ機能（ダーク/ライトモード）
- [x] 外部サイトの表示機能
- [x] URLナビゲーション機能

### ✅ Wave 2: セキュリティ機能（完了）
- [x] 広告ブロック機能（自動検出と除去）
- [x] カスタムフィルター機能
- [x] 危険サイトの検出とブロック
- [x] コンテンツフィルタリング
- [x] 安全性チェック機能

### ✅ Wave 3: プライバシー機能（完了）
- [x] 匿名ブラウジング（セッション管理）
- [x] プライベートモード
- [x] 自動データ削除
- [x] 追跡防止機能
- [x] フィンガープリンティング対策

### 🔄 Wave 4: 最適化とテスト（進行中）
- [x] パフォーマンス最適化
- [x] 主要サイトでの動作確認
- [ ] 互換性テスト
- [ ] 最終検証

## 主要サイト対応

以下のサイトでテスト済み：
- ✅ Google (https://www.google.com)
- ✅ Bing (https://www.bing.com)
- ✅ YouTube (https://www.youtube.com)
- ✅ Wikipedia (https://www.wikipedia.org)
- ✅ GitHub (https://www.github.com)

## ブラウザ互換性

- ✅ Chrome/Chromium 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 制限事項

### ブラウザ環境による制限
- **CORS制限**: 一部のサイトは直接表示できない場合があります
- **Cookie制限**: サードパーティCookieのブロックは限定的です
- **拡張権限**: ブラウザ拡張ではないため、一部の高度な機能は制限されます

### セキュリティ制限
- **iframe制限**: セキュリティ上の理由でsandbox属性を使用
- **スクリプト制限**: 外部サイトのスクリプト実行は制限されます
- **プロキシ機能**: 直接的なプロキシ機能は提供していません

## カスタマイズ

### 独自の広告ブロックルール追加
```javascript
// scripts/security.js の adBlockRules 配列に追加
this.adBlockRules.push(/your-custom-pattern/i);
```

### 独自のセキュリティドメイン追加
```javascript
// scripts/security.js の malwareDomains 配列に追加
this.malwareDomains.push('dangerous-site.com');
```

### 新しいテーマ追加
```css
/* styles/themes.css に追加 */
.custom-theme {
    --primary-color: #your-color;
    /* その他のCSS変数 */
}
```

## 貢献

プロジェクトへの貢献を歓迎します：

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. プルリクエストを作成

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 開発組織

**Aro Software Group** - プライバシーとセキュリティを重視したソフトウェア開発

## 今後の計画

- [ ] **拡張機能版**: より高度な機能を持つブラウザ拡張版の開発
- [ ] **モバイルアプリ版**: ネイティブモバイルアプリの開発
- [ ] **VPN統合**: VPN機能の統合
- [ ] **P2P機能**: 分散型ブラウジング機能
- [ ] **暗号化機能**: エンドツーエンド暗号化機能

---

**Umbra Browser** - プライバシーファーストなウェブブラウジング体験を提供します。