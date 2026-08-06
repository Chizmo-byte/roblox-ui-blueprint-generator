# LLMプロバイダ選定メモ

このツールは「参考UI画像を読んで、9セクションの厳格なJSON（DSL）を返す」という一点だけをLLMに要求します。
どのモデル・どのプロバイダを使えるかを整理した調査メモです。実装方針の根拠として残します。

調査日: 2026-08-06

---

## 1. このタスクに本当に必要な性能

先に結論を書くと、**ボトルネックは「賢さ」ではなく「構造化出力の安定性」**です。

必要なもの：

- **画像入力（vision）**
- **JSON を崩さず出す能力**（JSON mode / structured output のネイティブ対応があると激減する）
- **出力 約800トークン**（`DefaultDSL` を整形すると実測2,453文字 ≒ 770トークン）

**不要なもの**：長いコンテキスト、推論（thinking）、ツール呼び出し、コーディング能力。

つまり高価なフラッグシップモデルは過剰です。一方で、小さすぎるモデルは別の形で失敗します。

### 最低ライン：8B クラスの vision モデル

| 規模 | 実用性 |
|---|---|
| 2B〜4B | ❌ 画像は「見えている」が、9セクションのDSLを構造通りに埋められない。結果として大半が `DefaultDSL` の既定値で埋まり、**画像を読んでいないのと同じ出力**になる |
| **8B クラス** | ⭕ **実用の下限**。Qwen3-VL-8B が一般に「まず試すならここから」とされる水準 |
| 30B クラス | ◎ 余裕。無料枠でも到達可能なレンジ |
| フラッグシップ | 過剰。使ってもいいが必要ではない |

> ⚠️ **注意**: `lib/dsl/parse.ts` の既定値補完（`mergeWithDefaults`）のおかげで、モデルが一部フィールドを省略しても生成は成功します。これは小型モデルとの相性を大きく改善しました。
> **その裏返しとして、小さすぎるモデルを使うと「成功しているように見えて中身が既定値のまま」という失敗が起きます。** 出力されたDSLが `DefaultDSL` とほぼ一致していないか、目視で確認してください。

---

## 2. プロバイダ比較

> ### ⚠️ 無料枠の数値をこのドキュメントに書かない方針について
>
> 各社の無料枠は**公式が具体的な数値の公表をやめるほど流動的**です。
> 実際、Google の公式レート制限ページは現在こう書くだけになっています：
>
> > Rate limits depend on a variety of factors (such as your usage tier) and can be viewed in Google AI Studio.
> > *Specified rate limits are not guaranteed and actual capacity may vary.*
>
> NVIDIA も同様で、**build.nvidia.com の無料利用はクレジット制ではなく**、モデル・用途・その時点の全体トラフィックに応じて変動するレート制限で管理されている、と NVIDIA スタッフが開発者フォーラムで説明しています。
>
> 出回っている「◯◯ RPD」といった数値の大半は、2025年12月の各社減枠より前の情報を引き写した二次ソースです。
> **正確な制限は各自のダッシュボードでしか確認できません。** 従ってREADMEにも数値は書かず、確認先のリンクだけを案内します。

| プロバイダ | 無料枠 | 画像入力 | API形式 | 制限の確認先 |
|---|---|---|---|---|
| **Google Gemini** | あり（変動） | ⭕ | 独自 | [AI Studio Rate Limits](https://aistudio.google.com/rate-limit) |
| **OpenRouter** | あり（`:free` モデル） | ⭕（Gemma 4 系など） | OpenAI互換 | OpenRouter ダッシュボード |
| **Ollama（ローカル）** | **無制限・完全無料** | ⭕（0.18でQwen-VL / Llama-3 vision に対応） | OpenAI互換 | 制限なし |
| **Ollama Cloud** | あり。**トークンではなくGPU時間**で消費 | ⭕ | OpenAI互換 | Ollama アカウントページ |
| **NVIDIA NIM** | あり（レート制限型。クレジット制ではない） | ⭕ ただしカタログ内のvisionモデルは少ない | OpenAI互換 | [build.nvidia.com](https://build.nvidia.com) のダッシュボード |
| **OpenAI** | ❌ なし | ⭕ | Responses / Chat 両対応 | — |
| **Anthropic** | ❌ なし | ⭕ | 独自 | — |

### このツールでは制限がほぼ効かない

重要な補足です。**このツールは「生成」ボタン1回につきAPIリクエスト1回**しか発行しません。

人間が画像をアップロードし、結果を見て、指示を調整して……という使い方なので、**RPM（分あたり）制限に到達することは物理的にありません。** 効いてくるのは1日あたりの上限だけで、UI設計を集中的に詰める日でも生成は20〜50回程度です。

チャットボットやバッチ処理では各社の減枠は致命的ですが、**この使用パターンではほとんどのプロバイダの無料枠で足ります。** プロバイダ選定を無料枠の大きさで判断する必要性は低い、というのが結論です。

---

## 3. 実装方針：OpenAI互換を1本にまとめる

**現状の問題点。** `lib/llm/client.ts` の `callOpenAI` は OpenAI の **Responses API**（`/v1/responses`、`input_text` / `input_image`）を叩いています。これは OpenAI 固有の形式です。

一方、**OpenAI互換をうたうエコシステム（NIM、Ollama、Groq、Together など）が普遍的に実装しているのは Chat Completions**（`/v1/chat/completions`、`image_url` 形式のコンテンツパート）です。OpenRouter は両方に対応しています。

> 補足：2026年1月に OpenAI が Nvidia / OpenRouter / Hugging Face / LM Studio / Ollama / vLLM らと **Open Responses** 仕様を策定しており、将来的には Responses API 側に収束する可能性があります。ただし現時点での互換性の最大公約数は依然として Chat Completions です。

### 推奨する構成

**Gemini も専用実装は不要です。** Google は公式の OpenAI互換エンドポイントを提供しており、公式ドキュメントに `image_url` + base64データURL による画像入力の例がそのまま掲載されています。OpenAIと同一の形式です。

NIM も同様で、公式ドキュメントに「NIM for VLMs は画像を渡す際に OpenAI 仕様に従う」と明記されています。

```
callChatCompletions(baseURL, model, apiKey)  ← これ1本で以下すべてをカバー
    ├── OpenAI       https://api.openai.com/v1
    ├── Gemini       https://generativelanguage.googleapis.com/v1beta/openai/
    ├── OpenRouter   https://openrouter.ai/api/v1
    ├── NVIDIA NIM   https://integrate.api.nvidia.com/v1
    ├── Ollama Cloud https://ollama.com/v1
    ├── Ollamaローカル http://localhost:11434/v1
    └── Groq / Together / vLLM / LM Studio など

callClaude()  ← Anthropic のみ個別実装が必要
```

**リクエストボディは各プロバイダで一切変わりません。** 利用者が変えるのは環境変数3つ（`LLM_BASE_URL` / `LLM_MODEL` / `LLM_API_KEY`）だけです。

Anthropic だけが例外な理由：認証ヘッダが `x-api-key`、`system` がトップレベル、画像が `source: { type, media_type, data }` 形式。

### WebP に注意（対応済み）

NVIDIA NIM の公式ドキュメントがサポートを明記している画像形式は **JPG / JPEG / PNG のみ**で、WebP は含まれていません。WebP を許可したままだと、NIM を選んだ利用者がアップロード時に失敗します。

**対応：WebP をサポート対象から除外しました。** 変更箇所は以下の通りです。

| ファイル | 変更 |
|---|---|
| `lib/image/parser.ts` | `supportedMimeTypes` から除外、`ParsedImage` の型、WebPのマジックバイト判定を削除 |
| `lib/llm/client.ts` | `ImageMimeType` から除外 |
| `app/api/generate/route.ts` | エラーメッセージを「PNGまたはJPEG」に修正 |
| `app/page.tsx` | クライアント側の事前チェックを png / jpeg 限定に変更 |
| `components/UploadSection.tsx` | `accept="image/png,image/jpeg"` に変更（ファイル選択ダイアログの時点で絞る） |

将来 WebP を戻す場合は、対応していないプロバイダがある点をREADMEに明記するか、サーバー側でPNGに変換してから送信してください。

### 想定する環境変数

```env
# --- 基本形：OpenAI互換エンドポイントはすべてこの3つを変えるだけ ---
LLM_PROVIDER=openai-compatible
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_MODEL=qwen/qwen3-vl-8b-instruct
LLM_API_KEY=sk-or-...

# OpenAI
# LLM_BASE_URL=https://api.openai.com/v1

# Gemini（公式のOpenAI互換エンドポイント。画像入力も同一形式）
# LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
# LLM_MODEL=gemini-3.6-flash

# NVIDIA NIM
# LLM_BASE_URL=https://integrate.api.nvidia.com/v1

# Ollama（ローカル。APIキーは任意の文字列でよい）
# LLM_BASE_URL=http://localhost:11434/v1
# LLM_MODEL=qwen3-vl:8b

# --- Anthropic のみ形式が異なるため別扱い ---
# LLM_PROVIDER=anthropic
# LLM_MODEL=claude-haiku-4-5
# ANTHROPIC_API_KEY=sk-ant-...
```

`LLM_MODEL` を環境変数にしておけば、モデルIDが変わるたびにコードを直す必要がなくなります。今回 `claude-3-sonnet-20240229` が古くなっていた問題の再発防止にもなります。

---

## 4. 公開リポジトリとしての推奨

このリポジトリは「各自がクローンして自分のAPIキーで動かす」形で公開します。UI上でユーザーにキーを入力させる仕組み（BYOK）は不要です。

**選定の軸を「無料枠の大きさ」ではなく「API形式の互換性」に置きます。** 無料枠は毎月変わりますが、「Chat Completions がエコシステムの最大公約数」という事実は当分変わらないためです。

1. **汎用 OpenAI互換パスを主軸にする。** これ1本で NIM / Ollama（クラウド・ローカル両方）/ OpenRouter / Groq / Together を利用者が自由に選べる
2. **Gemini と Anthropic は個別実装で追加。** それぞれ形式が独自のため
3. **モデルIDは必ず環境変数化する。** コードに直接書くと今回の `claude-3-sonnet-20240229` と同じ陳腐化が起きる
4. **READMEには無料枠の数値を書かない。** 各社ダッシュボードへのリンクのみ案内する

### GPUがある場合

ローカルの Ollama が唯一「完全に無料かつ無制限」の選択肢です。8Bクラスのvisionモデルを Q4 量子化で動かす場合、必要VRAMは約6GBです。レート制限もAPIキーも不要になります。

### 実装タスク（すべて完了）

- [x] **`callOpenAI` を Chat Completions 形式に書き換え、`LLM_BASE_URL` / `LLM_MODEL` を環境変数化**
- [x] **`mergeWithDefaults` の前にトップレベルキーの実在チェックを追加**（9キー中3つ以上がオブジェクトであること）
- [x] ~~`claude-3-sonnet-20240229` → `claude-haiku-4-5`~~ → **モデルIDの直書き自体を廃止**。`callClaude` も `LLM_MODEL` を参照するようになったため、陳腐化の経路がなくなった
- [x] WebP をサポート対象外にした（上記参照）
- [x] タイムアウトを `LLM_TIMEOUT_MS` で設定可能に（既定30秒 / 範囲 1,000〜180,000ms）
- [x] `.env.example` と README を新しい変数構成に更新

### 最終的な環境変数

| 変数 | 既定値 | 説明 |
|---|---|---|
| `LLM_BASE_URL` | `https://api.openai.com/v1` | 末尾スラッシュの有無は問わない（Gemini対応） |
| `LLM_MODEL` | **なし（必須）** | 未設定なら `AI_MODEL_NOT_CONFIGURED` |
| `LLM_API_KEY` | `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` にフォールバック | |
| `LLM_PROVIDER` | `openai-compatible` | Anthropic を使うときのみ `anthropic` |
| `LLM_TIMEOUT_MS` | `30000` | 範囲外・数値でない場合は既定値 |
- [x] ~~モデル名とエンドポイントの不一致を検出する~~ → 404 を `AI_MODEL_NOT_FOUND` として専用メッセージ化＋上流エラー本文の併記を実装済み（下記参照）

### 実装済み：設定ミスの自己診断

BYOK 方式で最も起きやすいのが、**エンドポイントとモデル名の組み合わせミス**です。

```env
LLM_BASE_URL=https://integrate.api.nvidia.com/v1   # NIM
LLM_MODEL=gemini-3.6-flash                          # Gemini のモデル名 → 404
```

各プロバイダは揃って **404** を返すため、推測なしで断定できます。対応内容：

1. **404 を `AI_MODEL_NOT_FOUND` として個別に扱う** — 「指定されたモデルが見つかりません。LLM_MODEL と接続先URL（LLM_BASE_URL）の組み合わせが正しいか確認してください。」
2. **上流プロバイダのエラー本文を併記する** — 従来は HTTP ステータスしか見ずに本文を破棄していた。設定した本人が読むため、こちらで推測した文言より原文のほうが有用
3. **秘匿情報の除去** — 万一リクエスト内容がエコーバックされても鍵が漏れないよう、`sk-` / `AIza` / `Bearer` 形式のトークンを伏せ字にし、300文字で切り詰める

対応しているエラー本文の形式（各社まちまちなため）：

| 形式 | 例 |
|---|---|
| `{ error: { message } }` | OpenAI / NIM / Gemini / Anthropic |
| `{ error: "..." }` | Ollama |
| `{ message: "..." }` | 一部プロバイダ |
| 非JSON（プレーンテキスト） | プロキシ経由など |

`callGemini` の新規実装は**不要**です（OpenAI互換パスでカバーされるため）。

---

## 出典

- [Models overview - Claude Platform Docs](https://platform.claude.com/docs/en/about-claude/models/overview)
- [Rate limits - Gemini API](https://ai.google.dev/gemini-api/docs/rate-limits)（無料枠の具体的数値は非公開。ダッシュボード参照との案内のみ）
- [NVIDIA Developer Forums - Access/Accounts](https://forums.developer.nvidia.com/t/request-for-nvidia-build-api-rate-limit-increase-40-rpm-200-rpm/378450)（NIM の無料利用がクレジット制ではない旨のスタッフ回答）
- [OpenAI compatibility - Ollama](https://docs.ollama.com/api/openai-compatibility)
- [NVIDIA NIM - OpenAI Compatible Providers](https://ai-sdk.dev/providers/openai-compatible-providers/nim)
- [The Best Local Vision Language Models in 2026 | TinyWeights](https://tinyweights.dev/posts/best-local-vision-language-models-2026/)
- [Open Responses vs. Chat Completion - The New Stack](https://thenewstack.io/open-responses-vs-chat-completion-a-new-era-for-ai-apps/)
- [OpenAI compatibility - Gemini API](https://ai.google.dev/gemini-api/docs/openai)（画像入力を含むOpenAI互換エンドポイントの公式仕様）
- [NVIDIA NIM for Vision Language Models - Gemma 4 API](https://docs.nvidia.com/nim/vision-language-models/1.7.0/examples/gemma-4-31b-it/api.html)（対応画像形式と入力方式）
