# Idea Flux

Idea Flux は、1つのテーマから距離と観点の異なる連想を生成し、放射状のアイデア空間として探索できる Nuxt ベースのWebアプリです。

生成されたバブルは消えずに空間へ残り、選択したバブルからさらに連想を生成したり、自分のアイデアを追加したりできます。

Google AI Dojo 2026 Season 2 最終課題向けのMVPです。

## 概要

ユーザー入力に対して、次の3種類の連想を返します。

| 種類 | 説明 |
|---|---|
| 直接関係 | 元の入力から自然に導かれる連想 |
| 少し離れた | 関連性を保ちながら一段階以上離れた連想 |
| 別観点 | 立場、用途、時間軸、前提などを変えた連想 |

```text
今回のテーマ
  ↓
中心バブルと3方向の連想
  ↓
バブルを選択
  ├─ Geminiで3つ追加
  └─ 自分のアイデアを追加
```

## 技術構成

```text
ブラウザ
  ↓
Nuxt SPA
  ↓
Nuxt Nitro API
  ↓
Dummy Provider または Gemini Developer API
```

- Nuxt
- Vue
- TypeScript
- Nitro Server API
- Google Gen AI SDK
- Gemini Developer API
- Node.js 22 LTS推奨
- npm
- Cloud Run

## MVP範囲

### 実装対象

- 放射状のアイデア空間
- 3種類のAI連想バブル
- 選択項目からの再連想
- 手動バブルの追加
- パン、ズーム、選択経路表示
- フロントエンド上のグラフ状態
- ダミーAPI
- Gemini API
- Cloud Runへのデプロイ

### 後回し

- ADK
- マルチエージェントによるアプリ内処理
- データベース
- ログイン
- 履歴の永続保存
- 泡の物理アニメーション
- ラバランプ風の分裂・結合
- 管理画面
- 高度なレート制限
- Vertex AI認証への対応

## セットアップ

### 1. リポジトリへ移動

```powershell
cd D:\GitHub\idea-flux
```

### 2. 依存関係をインストール

既存の `package-lock.json` から環境を再現する場合：

```bash
npm ci
```

初期構築時や依存関係を追加する場合：

```bash
npm install
```

このプロジェクトでは npm のみを使用します。

### 3. 環境変数を作成

PowerShell：

```powershell
Copy-Item .env.example .env
```

macOS／Linux：

```bash
cp .env.example .env
```

環境変数名は `.env.example` を正とし、README、実装、Cloud Run設定で一致させてください。

## 環境変数

```dotenv
NUXT_ASSOCIATION_PROVIDER=dummy
NUXT_GEMINI_API_KEY=
NUXT_GEMINI_MODEL=
```

### ダミーAPI

```dotenv
NUXT_ASSOCIATION_PROVIDER=dummy
```

### Gemini API

```dotenv
NUXT_ASSOCIATION_PROVIDER=gemini
NUXT_GEMINI_API_KEY=your-api-key
NUXT_GEMINI_MODEL=<model-name>
```

利用するモデル名はGoogle AI Studioまたは公式ドキュメントで確認し、環境変数から設定します。

APIキーは次の場所へ置かないでください。

- `runtimeConfig.public`
- `NUXT_PUBLIC_*`
- `app/**`
- `public/**`
- クライアント側コード
- GitHub Issue
- チャット

MVPでは Gemini Developer API のAPIキー方式に一本化します。

## ローカル開発

```bash
npm run dev
```

通常の確認URL：

```text
http://localhost:3000
```

環境変数を変更した場合は、開発サーバーを再起動してください。

## API概要

### 連想生成

```http
POST /api/associations
```

リクエスト：

```json
{
  "prompt": "木を使ったゲーム"
}
```

正常レスポンス：

```json
{
  "sourcePrompt": "木を使ったゲーム",
  "associations": [
    {
      "id": "generated-id",
      "type": "direct",
      "label": "森を育てるゲーム",
      "description": "木の成長や配置を管理して森を発展させるゲーム"
    },
    {
      "id": "generated-id",
      "type": "distant",
      "label": "木材経済シミュレーション",
      "description": "伐採、加工、流通を扱う経済シミュレーション"
    },
    {
      "id": "generated-id",
      "type": "alternative",
      "label": "森が街へ侵攻するゲーム",
      "description": "植物側を操作して都市を自然へ戻していくゲーム"
    }
  ]
}
```

エラーレスポンス：

```json
{
  "error": {
    "code": "INVALID_PROMPT",
    "message": "入力内容を確認してください。"
  }
}
```

API bodyにはユーザー入力だけを含めます。

## プロンプト管理

- 内部指示：`server/prompts/association-prompt.ts`
- ユーザー入力：`POST /api/associations` の `prompt`
- 出力形式：`server/schemas/association-schema.ts`

上記は目標構成です。ダミーAPI段階では、責務が明確であればファイルを統合して構いません。

内部プロンプトには秘密情報を含めません。

## テスト

`package.json` に存在するスクリプトだけを実行します。

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

存在しないスクリプトは、未実施として報告してください。

### API手動テスト

PowerShell：

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/associations" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"prompt":"木を使ったゲーム"}'
```

curl：

```bash
curl -X POST   http://localhost:3000/api/associations   -H "Content-Type: application/json"   -d '{"prompt":"木を使ったゲーム"}'
```

正常系の確認：

- HTTP 200
- `sourcePrompt`が入力値と一致
- `associations`が3件
- 順番が `direct`、`distant`、`alternative`
- 各項目に `id`、`label`、`description` がある

異常系：

- 空入力：HTTP 400、`INVALID_PROMPT`
- 空白のみ：HTTP 400、`INVALID_PROMPT`
- 501文字以上：HTTP 400、`INVALID_PROMPT`
- 内部情報やスタックトレースを返さない

### UI手動テスト

- 初期状態ではバブルを表示しない
- Enterで送信、Shift＋Enterで改行
- ローディング中は二重送信不可
- 中心バブルと3つの連想バブルが表示される
- バブル選択ではフォーカスだけが移動する
- 生成成功後も既存バブルが残る
- 手動バブルを追加できる
- パン、ホイールズーム、テーマへ戻る操作ができる
- 再生成失敗時も既存バブルを維持する
- 360～430px幅で致命的な崩れがない

### Gemini固有テスト

- 常に3件返る
- 3分類の順序が正しい
- 日本語で返る
- 3件の内容が過度に重複しない
- labelとdescriptionが制限内
- 命令文を含む入力も連想対象の文字列として扱う
- APIキーや内部情報を出力しない
- Gemini障害時はHTTP 502、`AI_REQUEST_FAILED`
- Geminiの生エラーをクライアントへ返さない

## 本番ビルド

```bash
npm run build
```

ローカルで本番サーバーを起動する場合：

PowerShell：

```powershell
$env:PORT=8080
node .output/server/index.mjs
```

macOS／Linux：

```bash
PORT=8080 node .output/server/index.mjs
```

## Cloud Run

本番サービスは、GitHubの `main` ブランチとCloud Buildトリガーを接続して継続的にデプロイします。

```text
develop
  ↓ リリース時にmainへ統合
main
  ↓ pushをCloud Buildが検知
Dockerfileでコンテナをビルド
  ↓
Cloud Run: idea-flux
```

Cloud Runの推奨設定：

| 項目 | 設定 |
|---|---|
| サービス名 | `idea-flux` |
| 対象ブランチ | `^main$` |
| ビルド方式 | リポジトリ直下の `Dockerfile` |
| リージョン | `asia-northeast1` |
| 未認証アクセス | 許可（提出用公開URL） |
| 最小インスタンス数 | `0` |
| 最大インスタンス数 | `1` |

本番環境変数：

```dotenv
NUXT_ASSOCIATION_PROVIDER=gemini
NUXT_GEMINI_MODEL=gemini-3.5-flash-lite
```

`NUXT_GEMINI_API_KEY` はソースコードやCloud Build設定へ書かず、Secret Managerの `idea-flux-gemini-api-key` からCloud Runへ渡します。

Cloud Runは `PORT` を自動設定するため、手動で `PORT` を設定する必要はありません。

緊急時や継続的デプロイを使わない場合に限り、ローカルから手動デプロイできます。

```powershell
gcloud run deploy idea-flux `
  --source . `
  --region asia-northeast1
```

費用対策：

- 最小インスタンス数は0
- 最大インスタンス数は1を推奨
- 入力は最大500文字
- UIで二重送信を防ぐ
- Geminiの出力上限を設定する
- MVPではアプリ内IPレート制限を必須としない
- 公開終了後はサービス停止または削除を検討する
- 予算アラートはユーザーが設定する

APIキーはコマンドへ直書きせず、Cloud Runの環境変数設定またはSecret Managerへ登録してください。

## ユーザー本人の操作

- Gemini APIキーの作成
- `.env`への設定
- Googleアカウントへのログイン
- Google Cloudプロジェクトの選択
- 請求先アカウントの確認
- `gcloud`のブラウザ認証
- 必要なAPIの有効化
- Cloud Runの外部公開許可
- 予算アラートの設定

APIキーそのものをエージェントやチャットへ渡す必要はありません。

## ライセンス

未設定です。
