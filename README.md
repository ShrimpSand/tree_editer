# Tree Editor

インデント（Tab）ベースのシンプルなツリー構造エディタ。フルレスポンシブで、PCではキーボード操作完結、モバイルではタッチ操作で直感的に階層構造を管理・閲覧できるツール。

## プロジェクト概要

AWS学習（SAA、DVA）の過程で実際に使用するため、学習内容を階層構造で整理・管理するツールとして開発。膨大なテキストでも軽く、一括開閉可能で、既存ツール（Notion、MindMeister）の課題を解決します。

詳細は [tree_editor_PROJECT_OVERVIEW.md](./tree_editor_PROJECT_OVERVIEW.md) を参照してください。

## 技術スタック

- **フロント**: Next.js 16.x + React 19.x
- **スタイル**: Tailwind CSS
- **状態管理**: React Hooks (useState, useEffect, useCallback, useMemo)
- **永続化**: localStorage
- **言語**: TypeScript
- **アイコン**: Heroicons

## 主な機能

### 2つの表示モード

#### エディタモード
- タブインデントベースのプレーンテキスト編集
- リアルタイム保存（localStorage）
- ファイルインポート対応（RTF, Markdown, TXT）
- フォントサイズ調整
- 自動インデント（Enterキーで現在行のインデントを引き継ぎ）
- Tab/Shift+Tabでインデント調整

#### ブラウザモード
- ツリー構造の可視化・閲覧
- ノードの展開/折りたたみ
- インライン編集
- ドラッグ&ドロップによる並べ替え
- キーボードショートカットによる高速操作
- アンドゥ/リドゥ機能（最大50履歴）
- フォントサイズ調整

### ドラッグ&ドロップ機能

マウスでノードをドラッグして、ドロップ位置により異なる動作を実現：

- **ノードの上部30%**: 同階層の前に挿入
- **ノードの中央40%**: 子階層として追加
- **ノードの下部30%**: 同階層の後に挿入
- 子ノード全体を引き連れて移動可能
- ドロップ位置を視覚的にプレビュー表示

### キーボードショートカット（ブラウザモード）

#### ナビゲーション
- `↑/↓`: 上下のノードに移動
- `Ctrl+↑/↓`: 同階層の前後ノードにジャンプ
- `←`: 折りたたみ、または親ノードへ移動
- `→`: 展開、または最初の子ノードへ移動
- `Space`: ノードの展開/折りたたみ

#### 編集
- `Enter`: 同階層に新規ノードを追加
- `Tab`: 子階層に新規ノードを追加
- `Shift+Tab`: 親の階層に新規ノードを追加（1つ上の階層）
- `F2`: ノードをインライン編集モード
- `Delete`: ノードを削除

#### インライン編集中
- `Enter`: テキストを確定してフォーカス移動
- `Tab`: テキストを確定して子ノードを追加
- `Esc`: 編集をキャンセル

#### その他
- `Ctrl+Z`: 元に戻す（アンドゥ）
- `Ctrl+Y` / `Ctrl+Shift+Z`: やり直し（リドゥ）
- `Ctrl+E`: 全て展開
- `Ctrl+C`: 全て折りたたみ

### ファイルインポート

以下のファイル形式に対応：
- **RTF**: リッチテキスト形式（インデント情報を保持）
- **Markdown**: `.md`、`.markdown`
- **プレーンテキスト**: `.txt`

### データ永続化

- localStorageに自動保存
- 最終更新日時を記録
- ブラウザを閉じても内容を保持

## Getting Started

まず、開発サーバーを起動します：

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いて結果を確認できます。

`app/page.tsx` を編集することでページをカスタマイズできます。ファイルを編集すると、ページが自動更新されます。

## ディレクトリ構成

```
tree_editor/
├── app/                    # Next.js App Router
│   ├── page.tsx           # トップページ
│   ├── layout.tsx         # ルートレイアウト
│   └── globals.css        # グローバルスタイル
├── components/             # UIコンポーネント
│   ├── TreeEditor.tsx     # メインコンポーネント（モード切替）
│   ├── EditorView.tsx     # エディタモード
│   ├── BrowserView.tsx    # ブラウザモード
│   └── FontSizeControl.tsx # フォントサイズ調整
├── contexts/               # Contextプロバイダー
│   └── FontSizeContext.tsx # フォントサイズ管理
├── types/                  # 型定義
│   └── index.ts           # TreeNode, TreeState, TreeAction等
├── utils/                  # ユーティリティ関数
│   ├── treeParser.ts      # テキスト⇔ツリー構造の変換
│   ├── localStorage.ts    # ローカルストレージ操作
│   └── fileImporter.ts    # ファイルインポート処理
└── public/                 # 静的ファイル
```

## 開発フェーズ

### フェーズ1: MVP（ローカル保存版）- 1月末までに完成
- Next.js + React
- localStorage で永続化
- 自分で毎日使いながら磨く

### フェーズ2: SAAとDVA学習 - 2月-3月
- ツール使いながら AWS を学ぶ
- AWS 最適化の設計検討

### フェーズ3: AWS 版実装 - 4月
- Lambda + DynamoDB + Cognito
- 学習内容の実践

### フェーズ4: リリース・公開 - 5月
- ポートフォリオとして GitHub + デモサイト公開

## Learn More

Next.js について詳しく学ぶには以下のリソースを参照してください：

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
