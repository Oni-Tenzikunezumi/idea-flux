# Idea Flux

Idea Flux は、1つの単語・文章・アイデアから、距離と観点の異なる3つの連想を生成する Nuxt ベースのWebアプリです。

生成された連想カードを選択すると、その項目を新しい起点として連想を続けられます。

Google AI Dojo 2026 Season 2 最終課題向けのMVPです。

## 概要

ユーザー入力に対して、次の3種類の連想を返します。

| 種類 | 説明 |
|---|---|
| 直接関係 | 元の入力から自然に導かれる連想 |
| 少し離れた | 関連性を保ちながら一段階以上離れた連想 |
| 別観点 | 立場、用途、時間軸、前提などを変えた連想 |

```text
入力
  ↓
3つの連想を生成
  ↓
連想カードを選択
  ↓
確認ダイアログ
  ↓
選択項目から再び3つの連想を生成
```

詳細な仕様は [`docs/spec.md`](./docs/spec.md) を参照してください。

Codexなどのエージェントが作業する場合は、先に [`AGENTS.md`](./AGENTS.md) を参照してください。

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

- チャット形式の入力欄
- 3種類の連想カード
- カード選択時の確認ダイアログ
- 選択項目からの再連想
- フロントエンド上の簡易履歴
- ダミーAPI
- Gemini API
- Cloud Runへのデプロイ

### 後回し

- ADK
- マルチエージェントによるアプリ内処理
- データベース
- ログイン
- 履歴の永続保存
- 本格的なツリー表示
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

## 実装フェーズ

```text
Phase 0：事前確認
Phase 1：Nuxt初期環境と共通型
Phase 2：UIとダミーAPI
Phase 3：親エージェントによる統合
Phase 4：レビュー
Phase 5：Gemini接続
Phase 6：Gemini統合確認
Phase 7：Cloud Run準備
Phase 8：Cloud Runデプロイ
```

詳細は `docs/spec.md` を参照してください。

編集範囲とエージェント規約は `AGENTS.md` を参照してください。

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

- 初期状態ではカードを表示しない
- Enterで送信、Shift＋Enterで改行
- ローディング中は二重送信不可
- 3枚のカードが表示される
- カード選択で確認ダイアログが開く
- キャンセル時は元のカードを維持
- 確定後に再連想
- 履歴はAPI成功後のみ更新
- 再生成失敗時は元のカードを維持
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

MVPではソースデプロイを基本とします。

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud config list
```

デプロイ例：

```bash
gcloud run deploy idea-flux   --source .   --region asia-northeast1   --allow-unauthenticated   --min 0   --max 1
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
