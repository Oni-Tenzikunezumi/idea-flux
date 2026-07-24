# Idea Flux

ひとつのテーマから、思考を放射状に広げるアイデア探索アプリです。

Geminiが「直接関係」「少し離れた連想」「別観点」の3方向からアイデアを生成します。気になるバブルを選んで探索を続けたり、自分のアイデアを追加したりしながら、発想のつながりをひとつの空間に残せます。

Google AI Dojo 2026 Season 2 最終課題として開発しています。

## Features

- テーマから3方向のアイデアを生成
- 生成済みのアイデアを消さずに残す放射状グラフ
- 選択したバブルからさらに連想を展開
- ユーザー自身のアイデアを追加
- 選択経路のハイライト
- ドラッグによる移動とホイールによるズーム
- デスクトップ・モバイル対応
- 最大50バブルまで探索可能

## How it works

```text
今回のテーマを入力
  ↓
中心バブルと3方向の連想を生成
  ↓
気になるバブルを選択
  ├─ Geminiで3つの連想を追加
  └─ 自分のアイデアを追加
  ↓
つながりを残したまま探索を続ける
```

### Association types

| 種類 | 意味 |
|---|---|
| 直接関係 | 元のテーマから自然につながるアイデア |
| 少し離れた連想 | 関連を保ちながら一段階以上離れたアイデア |
| 別観点 | 立場、用途、時間軸、前提などを変えたアイデア |
| あなたのアイデア | ユーザーが手動で追加したアイデア |

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
  "prompt": "雨の日の図書館"
}
```

APIは常に次の順序で3件の連想を返します。

```text
direct → distant → alternative
```

## Deployment

本番環境はCloud Runで稼働します。コンテナはリポジトリの `Dockerfile` からビルドし、Gemini APIキーはSecret Managerで管理します。

## Project status

`v0.1.0` は、永続的な放射状アイデア空間を備えたMVPリリースです。

## License

This project is licensed under the [MIT License](./LICENSE).
