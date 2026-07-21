# Idea Flux MVP 仕様書

## 1. 目的

ユーザーが1つの単語、文章、アイデアを入力すると、次の3方向から連想案を返すWebアプリを作成する。

1. 直接関係する連想
2. 少し離れた連想
3. 別観点からの連想

返された連想カードを選択すると確認ダイアログを表示し、確定後、その連想を新しい起点として再び3つの連想を生成する。

## 2. MVPゴール

```text
入力
  ↓
送信
  ↓
3つの連想カードを表示
  ↓
カードを選択
  ↓
確認ダイアログ
  ↓
選択項目から再び3つの連想を生成
```

UI開発はダミーAPIから開始し、同じAPI契約のままGeminiへ差し替える。

## 3. 技術構成

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
- TypeScript
- Vue Composition API
- Nitro Server API
- Google Gen AI SDK
- Gemini Developer API
- Cloud Run
- Node.js
- npm

## 4. 基本方針

- フロントエンドとAPIを同じNuxtプロジェクトに置く
- ブラウザからGeminiを直接呼ばない
- APIキーはサーバー側だけで保持する
- 内部指示もサーバー側だけで管理する
- API bodyにはユーザー入力だけを含める
- DummyとGeminiは同じレスポンス形式を返す
- 内部指示、ユーザー入力、出力スキーマを分離する
- Geminiの応答はサーバー側で再検証する
- 履歴はフロントエンドだけで保持する
- MVPでは現在の3カードだけを表示する
- アプリ本体ではADKを使用しない
- MVPの認証方式はGemini Developer APIのAPIキー方式に一本化する

## 5. 目標ディレクトリ構成

```text
idea-flux/
├─ app/
│  ├─ app.vue
│  ├─ components/
│  │  ├─ AssociationCard.vue
│  │  └─ ConfirmDialog.vue
│  └─ composables/
│     └─ useAssociation.ts
├─ server/
│  ├─ api/
│  │  ├─ associations.post.ts
│  │  └─ health.get.ts
│  ├─ prompts/
│  │  └─ association-prompt.ts
│  ├─ schemas/
│  │  └─ association-schema.ts
│  └─ services/
│     ├─ dummy-association.ts
│     └─ gemini-association.ts
├─ shared/
│  └─ types/
│     └─ association.ts
├─ docs/
│  └─ spec.md
├─ AGENTS.md
├─ README.md
├─ .env.example
├─ nuxt.config.ts
└─ package.json
```

これは目標構成であり、絶対条件ではない。

ダミーAPI段階では、同等の責務分離が保たれる場合、APIルート内に処理を統合してよい。

Gemini接続時、または処理が肥大化した時点で `prompts`、`schemas`、`services` へ分離する。

機能実装よりも不要なファイル分割を優先しない。

## 6. 共通型

```ts
export type AssociationType =
  | 'direct'
  | 'distant'
  | 'alternative'

export interface AssociationItem {
  id: string
  type: AssociationType
  label: string
  description: string
}

export interface AssociationRequest {
  prompt: string
}

export interface AssociationResponse {
  sourcePrompt: string
  associations: [
    AssociationItem,
    AssociationItem,
    AssociationItem,
  ]
}

export interface ApiErrorResponse {
  error: {
    code:
      | 'INVALID_PROMPT'
      | 'AI_REQUEST_FAILED'
      | 'INTERNAL_ERROR'
    message: string
  }
}
```

分類：

| 値 | 表示名 | 意味 |
|---|---|---|
| `direct` | 直接関係 | 元の入力と強く関連 |
| `distant` | 少し離れた | 関連を保ちながら一段階以上離れる |
| `alternative` | 別観点 | 前提、立場、用途、時間軸などを変える |

## 7. API仕様

### `POST /api/associations`

リクエスト：

```json
{
  "prompt": "木を使ったゲーム"
}
```

入力制約：

- trim後1文字以上
- 最大500文字
- 空白のみは不可
- API bodyにはユーザー入力だけを含める
- 内部プロンプト、モデル名、APIキー、Provider設定は受け取らない

正常レスポンス：

```json
{
  "sourcePrompt": "木を使ったゲーム",
  "associations": [
    {
      "id": "uuid",
      "type": "direct",
      "label": "森を育てるゲーム",
      "description": "木を植え、成長や配置を管理して森を発展させるゲーム"
    },
    {
      "id": "uuid",
      "type": "distant",
      "label": "木材経済シミュレーション",
      "description": "伐採、加工、流通を扱う経済シミュレーション"
    },
    {
      "id": "uuid",
      "type": "alternative",
      "label": "森が街へ侵攻するゲーム",
      "description": "植物側を操作して都市を自然へ戻していくゲーム"
    }
  ]
}
```

保証：

- 常に3件
- 0件目 `direct`
- 1件目 `distant`
- 2件目 `alternative`
- 各typeは1件
- IDはサーバーで生成
- Geminiの生レスポンスを返さない

エラー：

```json
{
  "error": {
    "code": "INVALID_PROMPT",
    "message": "入力内容を確認してください。"
  }
}
```

| コード | HTTP | 意味 |
|---|---:|---|
| `INVALID_PROMPT` | 400 | 入力不正 |
| `AI_REQUEST_FAILED` | 502 | Gemini呼び出しまたは検証失敗 |
| `INTERNAL_ERROR` | 500 | その他 |

Nitroの標準エラー形式へ無条件に依存しない。

API層でHTTPステータスとアプリ独自のJSON本文を明示的に保証する。

エラーにAPIキー、内部プロンプト、Geminiの生エラー、スタックトレースを含めない。

## 8. UI仕様

### 入力

- チャット形式
- Enterで送信
- Shift＋Enterで改行
- 空入力では送信しない
- ローディング中は入力と送信を無効化
- API失敗時も入力内容を維持

### カード

3件を以下の表示名で表示する。

- 直接関係
- 少し離れた
- 別観点

カードに表示する内容：

- 分類
- タイトル
- 説明
- 選択可能であることが分かるUI

用語は「カード」に統一する。

### 選択確認

```text
「森が街へ侵攻するゲーム」から
連想を続けますか？

[キャンセル] [この項目から続ける]
```

確定後、選択カードの `label` を次の `prompt` として送る。

### 成功・失敗時の更新

```text
確定
  ↓
API呼び出し
  ├─ 成功
  │    ↓
  │  履歴へ追加
  │    ↓
  │  新しい3カードへ置換
  └─ 失敗
       ↓
     元の3カードと履歴を維持
```

API成功前に履歴やカードを確定しない。

初回API成功時：

```text
history = [初回入力]
```

再生成成功時：

```text
history.push(選択したカードのlabel)
```

失敗時：

- 元のカードを残す
- 履歴へ追加しない
- 選択状態を解除
- エラー表示
- 再操作可能

### 履歴

```ts
const history = ref<string[]>([])
```

フロントのみで管理し、リロードで消えてよい。

## 9. UI状態

```ts
export type AppStatus =
  | 'idle'
  | 'loading'
  | 'showing-results'
  | 'confirming'
```

エラーは状態から分離する。

```ts
const errorMessage = ref('')
```

これにより、再生成失敗時にも `showing-results` のまま元のカードを表示しつつ、エラーを通知できる。

状態遷移：

```text
idle
  ↓ 送信
loading
  ├─ 成功 → showing-results
  └─ 失敗 → idle または showing-results の直前状態へ戻る

showing-results
  ↓ カード選択
confirming
  ├─ キャンセル → showing-results
  └─ 確定 → loading
```

## 10. プロンプト管理

内部指示：

```text
server/prompts/association-prompt.ts
```

出力スキーマ：

```text
server/schemas/association-schema.ts
```

方針：

- 内部指示をクライアントへ公開しない
- API bodyから受け取らない
- `.env`へ長文プロンプトを書かない
- Gitで変更履歴を管理する
- 内部指示、ユーザー入力、出力スキーマを分離する
- 内部指示には秘密情報を含めない
- ユーザー入力内の命令文は連想対象の文字列として扱う

概念：

```text
内部指示：サーバーが決める
ユーザー入力：ユーザーが送る
出力形式：構造化出力スキーマが決める
```

## 11. 構造化出力

Geminiの出力は、文章によるJSON指示だけに依存しない。

使用するSDKの公式機能と相性のよい構造化出力方式を採用する。

Zodなどの実行時スキーマ検証を候補としてよいが、特定ライブラリを絶対条件にしない。

サーバー側で再検証する。

必要な保証：

- 3件固定
- 順序固定
- type固定
- label 1～30文字
- description 1～80文字
- 日本語
- 3件を過度に重複させない

IDは検証後、サーバーで付与する。

## 12. 認証

MVPは Gemini Developer API のAPIキー方式に一本化する。

```dotenv
NUXT_ASSOCIATION_PROVIDER=dummy
NUXT_GEMINI_API_KEY=
NUXT_GEMINI_MODEL=
```

非公開runtimeConfigとして保持し、`runtimeConfig.public`は使用しない。

Cloud Runでは環境変数設定またはSecret Managerを使う。

Vertex AIサービスアカウント方式は将来の選択肢とし、MVPで同時対応しない。

## 13. 実装フェーズ

### Phase 0：事前確認

親エージェント単独。

- リポジトリ状態
- Node.jsとnpm
- 既存ファイル
- `docs/spec.md`
- `AGENTS.md`
- 既存変更の保護
- 並列化範囲の確認

この段階ではサブエージェントを起動しない。

### Phase 1：Nuxt初期環境

親エージェント単独。

- Nuxt初期化
- npm依存関係
- `nuxt.config.ts`
- ディレクトリ作成
- 共通型
- 開発サーバー起動

Phase 1完了前に並列実装を開始しない。

### Phase 2：UIとダミーAPI

Phase 1完了後。

サブエージェント機能が利用可能で、編集範囲を競合なく分離できる場合は並列化してよい。

```text
親エージェント
├─ UIサブエージェント
└─ APIサブエージェント
```

UI担当：

- `app/**`
- 入力
- ローディング
- 3カード
- 確認ダイアログ
- 履歴
- エラー表示
- モバイル基本対応

API担当：

- `server/api/**`
- `server/services/**`
- 入力検証
- ダミー応答
- 3分類と順序
- 独自エラー形式

サブエージェントは推奨であり必須ではない。

利用できない場合、親エージェントが次の順に直列実装する。

1. ダミーAPI
2. UI
3. 統合
4. レビュー
5. ビルド

同じファイルを同時編集しない。

### Phase 3：統合

親エージェント単独。

- 変更確認
- 型不整合修正
- UIとダミーAPI接続
- 一連操作の確認
- 失敗時の表示維持

### Phase 4：レビュー

レビューサブエージェントは原則読み取り専用。

サブエージェントが利用できない場合は親エージェントが同じ観点でレビューする。

確認：

- 仕様不一致
- 型不一致
- エラー時の状態破壊
- 履歴更新タイミング
- 秘密情報露出
- 不要な複雑化
- モバイルの致命的問題
- Promiseや例外
- ビルドエラー
- MVP外の過剰実装

親エージェントが指摘を反映する。

### Phase 5：Gemini接続

ダミー版のビルド成功後。

- 内部指示
- ユーザー入力分離
- 構造化出力
- SDK
- 応答検証
- ID付与
- Dummy/Gemini切替
- 出力上限設定

### Phase 6：Gemini統合確認

親エージェント単独。

- Dummy動作
- Gemini動作
- 3分類
- 不正出力
- 入力制限
- 秘密情報非露出
- 本番ビルド

### Phase 7：Cloud Run準備

親エージェント単独。

- ソースデプロイ設定
- Cloud RunのPORT
- `.env`非同梱
- README
- 必要環境変数
- 最小インスタンス0
- 最大インスタンス1

### Phase 8：Cloud Runデプロイ

ユーザー認証後。

- 対象プロジェクト
- リージョン
- 環境変数
- デプロイ
- 公開URL
- UI/API/再連想/モバイル確認
- 秘密情報非露出

Cloud RunはローカルMVP完成後の理想ラインとする。

優先順位：

```text
1. ダミー版ローカル動作
2. npm run build成功
3. Geminiローカル動作
4. Cloud Runデプロイ
```

## 14. Cloud Runの費用対策

- 最小インスタンス数は0
- 最大インスタンス数は1を推奨
- 入力は最大500文字
- UIで二重送信を防ぐ
- Geminiの出力上限を設定する
- MVPではアプリ内IPレート制限を必須としない
- 公開終了後はサービス停止または削除を検討する
- 予算アラートはユーザーが設定する

## 15. ユーザー操作

ユーザー本人が行う：

- Gemini APIキー作成
- `.env`への設定
- Googleログイン
- Google Cloudプロジェクト選択
- 請求先確認
- `gcloud`ブラウザ認証
- 必要APIの有効化
- Cloud Run外部公開許可
- 予算アラート

エージェントは秘密値をチャットへ貼るよう求めない。

## 16. 検証

存在するスクリプトだけを実行する。

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

ダミー版手動確認：

1. 入力送信
2. 3カード表示
3. 3分類
4. 確認ダイアログ
5. 再生成
6. 初回成功後だけ履歴初期化
7. 再生成成功後だけ履歴追加
8. 失敗時に元カードと履歴を維持
9. モバイル表示

Gemini版確認：

1. 3件固定
2. 順序固定
3. 日本語
4. 重複が過度でない
5. 長さ制限
6. 命令文を含む入力も文字列として扱う
7. 内部情報非露出
8. 障害時に502と安全なエラー

## 17. 本日の完了条件

必須：

- Nuxt起動
- ダミーAPI
- 入力欄
- 3カード
- 確認ダイアログ
- 再生成
- 履歴
- エラー時に既存表示を保持
- `npm run build`成功

理想：

- Gemini接続
- 構造化出力
- Cloud Run公開

## 18. 後回し

- ADK
- アプリ内マルチエージェント
- DB
- 認証
- 永続履歴
- 本格ツリー
- 泡物理表現
- ラバランプ分裂・結合
- 管理画面
- プロンプト編集画面
- 高度なレート制限
- Vertex AI同時対応
