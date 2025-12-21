# tree_editor - プロジェクト概要

## 概要
インデント（Tab）ベースのシンプルなツリー構造エディタ。フルレスポンシブで、PC ではキーボード操作完結、モバイルではタッチ操作で直感的に階層構造を管理・閲覧できるツール。

## 目的
- AWS 学習（SAA、DVA）の過程で実際に使用
- 学習内容を階層構造で整理・管理
- 膨大なテキストでも軽く、一括開閉可能
- 既存ツール（Notion、MindMeister）の課題を解決

## ターゲットユーザー
- 階層構造データを管理したい個人
- 学習内容を体系的に整理したい学習者
- シンプルさを重視するユーザー

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

---

## 機能要件

### MVP版（優先度：高）

#### エディタ画面
- **ツリー表示パネル**
  - 左側に階層構造をツリー表示
  - 各ノードの開閉機能
  - 一括開閉ボタン（全て展開 / 全て折りたたむ）
  - ノード選択時にハイライト表示

- **テキスト編集パネル**
  - 右側に選択ノードのテキスト表示
  - インラインテキスト編集
  - 改行対応で長文も入力可能

#### 入力形式（インデント方式）
```
ノードA
  ノードB
    ノードC
      ノードD
  ノードE
ノードF
```
- Tab キーでインデント（階層深度）を認識
- Shift+Tab でインデント削除
- インデント深度 = 階層レベル

#### 操作方法

**PC（キーボード操作完結）**
- `↑/↓` — ノード選択移動
- `←/→` — ツリー開閉
- `Tab` — インデント増加（階層を深くする）
- `Shift+Tab` — インデント減少
- `Enter` — 新規ノード作成（同階層）
- `Ctrl+Enter` — 子ノード作成
- `Delete/Backspace` — ノード削除
- `Ctrl+A` / `Ctrl+Z` — 全展開 / 全折りたたみ

**モバイル（タッチ操作）**
- ノード右の `+` ボタン — 開閉
- ノードタップ — 選択
- ノード長押し — メニュー表示（編集/削除/子追加）
- スワイプ左 — インデント削除
- スワイプ右 — インデント増加

#### UIテーマ
- ダークテーマ / ライトテーマ
- トグルボタンで切り替え
- localStorage に保存

#### データ永続化
- localStorage に自動保存
- JSON フォーマットで内部管理

### 将来機能（フェーズ2以降）
- Markdown エクスポート
- マインドマップのインポート
- JSON エクスポート/インポート
- 複数ツリーの管理
- 検索機能
- ノードのラベル/タグ機能

---

## 技術スタック

### MVP版
- **フロント**: Next.js 15.x + React 19.x
- **スタイル**: Tailwind CSS
- **状態管理**: React Hooks (useState, useEffect, useReducer)
- **永続化**: localStorage
- **パッケージ管理**: npm / yarn

### AWS版（フェーズ3）
- **バックエンド**: AWS Lambda
- **データベース**: DynamoDB
- **認証**: Cognito
- **ストレージ**: S3
- **API**: API Gateway
- **フロント**: Next.js（変わらず）

---

## ディレクトリ構成（MVP版）

```
tree_editor/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── tree-editor/
│       └── page.tsx
├── components/
│   ├── TreeEditor.tsx           # メインエディタコンポーネント
│   ├── TreePanel.tsx             # ツリー表示パネル
│   ├── TreeNode.tsx              # ツリーノードコンポーネント
│   ├── TextEditorPanel.tsx        # テキスト編集パネル
│   ├── ThemeToggle.tsx            # テーマ切り替えボタン
│   └── ActionBar.tsx              # 操作ボタンバー（全展開/折りたたみ等）
├── hooks/
│   ├── useTreeState.ts            # ツリー状態管理
│   ├── useKeyboardShortcuts.ts     # キーボード操作処理
│   └── useLocalStorage.ts          # localStorage 操作
├── types/
│   └── index.ts                   # 型定義（TreeNode等）
├── utils/
│   ├── treeParser.ts              # インデント → ツリー変換
│   ├── treeSerializer.ts           # ツリー → JSON/Markdown変換
│   └── localStorage.ts             # localStorage ユーティリティ
├── styles/
│   └── tree-editor.css             # エディタ固有スタイル
├── public/
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── package.json
└── README.md
```

---

## 今後のマイルストーン

| 期間 | 目標 | 成果物 |
|------|------|--------|
| 〜1月末 | MVP完成、ローカル保存実装 | 自分が毎日使えるツール |
| 2月-3月 | SAAとDVA学習（ツール使用） | 資格取得、AWS知識習得 |
| 4月 | AWS版実装 | Lambda+DynamoDB統合版 |
| 5月 | 公開 | GitHub + デモサイト、ポートフォリオ完成 |

---

## 優先度：高い実装順

1. **ツリー状態管理** — インデント解析 + React 状態管理
2. **UI コンポーネント** — ツリー表示、テキストエディタ
3. **キーボード操作** — Tab, ↑↓, Enter など
4. **localStorage 永続化**
5. **モバイル対応**
6. **テーマ切り替え**
7. **テスト**

---

## 注意事項

- **ENTP の特性**: 途中で「こういう機能欲しい」という拡張欲望が出るが、MVP完成まで追加機能は避ける
- **実装駆動型学習**: AWS 知識が必要になった時点で学ぶ
- **ユーザーは自分**: 毎日使いながら改善していく
