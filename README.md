# Idea Flux

Idea Fluxは、Geminiを使ってアイデア探索を支援するWebアプリです。

ユーザーが入力したテーマから、AIが「深掘る」「広げる」「別角度」の3方向で次のアイデアを生成します。生成されたアイデアは画面上に残り、ブランチでつながっていきます。

AIが答えを決めるのではなく、ユーザー自身が次に考える方向を選びながら、思考の道筋を広げていくことを目的にしています。

Google AI Dojo 2026 Season 2 最終課題として開発しています。

## Features

- テーマから3方向のアイデアを生成
- 生成済みのアイデアを消さずに残すアイデア空間
- 気になるアイデアからさらに派生生成
- ユーザー自身のアイデアを追加
- AI生成アイデアの説明表示
- 選択経路のハイライト
- ドラッグによる移動、ホイールやピンチによるズーム
- デスクトップ・モバイル対応
- 最大50アイデアまで探索可能

## How it works

```text
今回のテーマを入力
  ↓
AIが3方向のアイデアを生成
  ↓
気になるアイデアを選択
  ├─ Geminiでさらに3つのアイデアを生成
  └─ 自分のアイデアを追加
  ↓
つながりを残したまま探索を続ける
```

### Association types

| 表示 | 内部値 | 意味 |
|---|---|---|
| 深掘る | `direct` | 今のテーマやアイデアを具体化する |
| 広げる | `distant` | 関連する仕組み、素材、別分野へ広げる |
| 別角度 | `alternative` | 前提や立場を変えて見る |
| あなたのアイデア | `custom` | ユーザーが手動で追加したアイデア |

## Technology

- Nuxt
- Vue
- TypeScript
- Tailwind CSS
- Nitro Server API
- Google Gen AI SDK
- Gemini Developer API
- Cloud Run

Gemini APIはサーバー側からのみ呼び出します。APIキー、内部プロンプト、モデル固有の応答はブラウザへ公開しません。

## Local development

### Requirements

- Node.js 22 LTS
- npm

### Setup

```powershell
git clone https://github.com/Oni-Tenzikunezumi/idea-flux.git
cd idea-flux
npm ci
Copy-Item .env.example .env
npm run dev
```

通常は以下のURLで起動します。

```text
http://localhost:3000
```

### Environment variables

```dotenv
NUXT_ASSOCIATION_PROVIDER=dummy
NUXT_GEMINI_API_KEY=
NUXT_GEMINI_MODEL=gemini-3.5-flash-lite
```

ダミー応答を使う場合：

```dotenv
NUXT_ASSOCIATION_PROVIDER=dummy
```

Geminiを使う場合：

```dotenv
NUXT_ASSOCIATION_PROVIDER=gemini
```

APIキーは `.env` へ設定し、Gitへコミットしないでください。

## Commands

```bash
npm run dev
npm run typecheck
npm run build
npm run start
```

## API

```http
POST /api/associations
```

```json
{
  "theme": "雨の日の図書館で遊ぶ方法",
  "prompt": "静かに探検する",
  "focusedCell": {
    "label": "静かに探検する",
    "description": "音を立てずに館内を巡る遊びとして考える",
    "source": "user",
    "kind": "custom"
  }
}
```

`theme` と `prompt` は必須です。`focusedCell` は、選択中のアイデアに関する短い説明を渡すための任意項目です。

APIは常に次の順序で3件のアイデアを返します。

```text
direct → distant → alternative
```

## Deployment

本番環境はCloud Runで稼働します。コンテナはリポジトリの `Dockerfile` からビルドし、Gemini APIキーは環境変数またはSecret Managerで管理します。

## Project status

`v1.0.0` は、テーマからアイデアを広げる提出版リリースです。

## License

This project is licensed under the [MIT License](./LICENSE).
