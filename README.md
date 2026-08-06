# UI Blueprint Generator

**Turn a UI reference image into a Roblox UI blueprint (JSON DSL) and ready-to-paste Luau LocalScript code.**
Upload a screenshot of a UI you like, add optional instructions, and get back a structured design spec plus generated Roblox UI code that follows a consistent set of layout, scaling, and ZIndex rules.

> UI reference image → LLM (OpenAI / Anthropic) → DSL Blueprint (JSON) → Luau LocalScript

日本語の詳細は以下をご覧ください。

---

## これは何か

Robloxゲーム開発でUIを作るときの「デザインの言語化」と「実装の初速」を助けるツールです。

参考にしたいUIの画像をアップロードすると、AIがそのUIを解析して **DSL（UI設計データ / JSON）** に変換します。さらにそのDSLから、Roblox Studioにそのまま貼り付けられる **Luau の LocalScript** を自動生成します。

「なんとなくいい感じのUI」を、余白・角丸・配色・フォントサイズ・ZIndexといった**再現可能な数値仕様**に落とし込むのが目的です。

### 何が出てくるか

| 出力 | 内容 |
|---|---|
| **DSL（JSON）** | Screen / Layout / Spacing / Color / Typography / Visual / Components / Interactions / RobloxRules の9セクションからなるUI設計データ。コピー・ダウンロード可能 |
| **Luauコード** | 上記DSLから生成される LocalScript。ScreenGui・サイドバー・パネル・タイトル・ボタン（ホバーTween付き）を構築。コピー・ダウンロード可能 |

### 何が出てこないか

- 完成したゲームUIそのものではありません。**土台と設計の指針**を出すツールです
- サーバーサイドの処理（RemoteEvent のハンドラ、購入処理など）は生成しません。生成コードにもその旨のコメントが入ります

---

## セットアップ

### 必要なもの

- Node.js 20 以上
- お好きなAIサービスのAPIキー（下記のいずれか）

### 手順

```bash
git clone https://github.com/Chizmo-byte/roblox-ui-blueprint-generator.git
cd roblox-ui-blueprint-generator
npm install

cp .env.example .env.local
# .env.local を開いて設定（次項参照）

npm run dev
```

http://localhost:3000 を開いてください。

> `.env.local` はコミットされません（`.gitignore` 済み）。APIキーは絶対にリポジトリに含めないでください。

### AIサービスの設定

設定するのは**基本的に3つだけ**です。

```env
LLM_BASE_URL=https://api.openai.com/v1   # 接続先
LLM_MODEL=gpt-4o-mini                    # 使うモデル（必須）
LLM_API_KEY=sk-...                       # そのサービスのAPIキー
```

**OpenAI互換のエンドポイントなら、この3つを差し替えるだけで動きます。** リクエストの中身は変わりません。

| サービス | `LLM_BASE_URL` | `LLM_MODEL` の例 |
|---|---|---|
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta/openai/` | `gemini-3.6-flash` |
| OpenRouter | `https://openrouter.ai/api/v1` | `qwen/qwen3-vl-8b-instruct` |
| NVIDIA NIM | `https://integrate.api.nvidia.com/v1` | `qwen/qwen3-vl-8b-instruct` |
| Ollama（ローカル） | `http://localhost:11434/v1` | `qwen3-vl:8b` |
| Ollama Cloud | `https://ollama.com/v1` | `qwen3-vl:8b` |

**Anthropic（Claude）だけはAPI形式が異なる**ため、追加の指定が必要です。

```env
LLM_PROVIDER=anthropic
LLM_MODEL=claude-haiku-4-5
LLM_API_KEY=sk-ant-...
```

その他の設定項目は `.env.example` にコメント付きで一覧しています。

### モデル選びの目安

このツールがAIに求めるのは「画像を読んで、決まった構造のJSONを返す」ことだけです。推論力や長文処理は不要な代わりに、**構造化出力の安定性**が効きます。

- **8Bクラスのvisionモデルが実用の下限**です（例: Qwen3-VL-8B）
- それより小さいモデルはDSLの構造を埋めきれず、**大半が既定値のまま出力される**ことがあります。生成結果が毎回ほぼ同じ内容になる場合はこれを疑ってください
- 無料枠の上限は各サービスのダッシュボードで確認してください。公表値は頻繁に変わります。なお本ツールは「生成」1回につきAPIリクエスト1回のみのため、分あたりの制限に達することはまずありません

詳しい比較は [docs/llm-providers.md](docs/llm-providers.md) を参照してください。

---

## 使い方

1. **出力言語**を選ぶ（日本語 / English）
2. **追加の指示**を入力（任意）— 例：「丸みのあるボタン、余白は広め、明るい配色にしたい」
3. **参考にするUI画像**をアップロード（PNG / JPEG、5MBまで）
4. **「UI設計を生成」**を押す
5. 生成された **DSL** と **Luauコード** をコピー、またはダウンロード
6. Luauコードを Roblox Studio の `StarterPlayer > StarterPlayerScripts` などに LocalScript として貼り付け

---

## DSL の構成

生成されるDSLは以下の9セクションで構成されます。既定値は `lib/dsl/schema.ts` の `DefaultDSL` に定義されており、AIが一部フィールドを省略した場合はここから補完されます。

| セクション | 役割 |
|---|---|
| `Screen` | 基準解像度、スケールモード、セーフエリア |
| `Layout` | Scale優先ポリシー、AnchorPoint既定値、AutomaticSize、制約 |
| `Spacing` | グリッド単位、パディング、ギャップ、外側マージン |
| `Color` | 背景・パネル・アクセントカラー |
| `Typography` | フォントファミリ、見出し / 本文 / ボタンのサイズとウェイト |
| `Visual` | 角丸のモードと値、UIStroke |
| `Components` | Sidebar / SelectionList / DetailPanel / ActionArea / Icon の仕様 |
| `Interactions` | ボタンの押下・ホバー・無効状態、フィードバック演出 |
| `RobloxRules` | ZIndex階層、RemoteEventフロー、価格の参照元モジュール |

Roblox実装の基準となるルール辞書は `lib/roblox/rules.ts` にあり、AIへのプロンプトにそのまま渡されます。DSLのスキーマと同期しています。

---

## 技術構成

- **Next.js 16**（App Router）/ **React 19** / **TypeScript**
- **Tailwind CSS v4**（PostCSS経由）
- LLM API は `fetch` で直接呼び出し（SDK依存なし）
- 依存パッケージは `next` / `react` / `react-dom` のみ

```
app/
  api/generate/route.ts   API本体：画像受信 → LLM呼び出し → DSL返却
  page.tsx                画面全体の状態管理
components/               UI部品（アップロード、プレビュー、結果表示など）
lib/
  image/parser.ts         画像の検証（サイズ・MIME・マジックバイト）
  llm/client.ts           OpenAI互換 / Anthropic クライアントとエラー分類
  dsl/schema.ts           DSLの型定義と既定値（DefaultDSL）
  dsl/parse.ts            LLM出力のパース・既定値補完・厳格な型検証
  roblox/rules.ts         Roblox UI ルール辞書
  roblox/transform.ts     DSL → Luau LocalScript 変換
theme.tsx                 アプリ側UIのカラーテーマ
```

### 安全性について

- アップロード画像は**マジックバイトで実体を検証**し、宣言されたMIMEタイプと一致しない場合は拒否します（5MB上限）
- LLMの出力は既定値で補完したうえで**厳格に型検証**します。型が不正な値は補正で隠さずエラーにします
- Luauコード生成時、DSL由来の値は**数値のクランプ・カラーコードの正規表現検証・フォント名のマッピング**を通します。不正なDSLから実行可能なLuauが注入されることを防ぎます

---

## スクリプト

```bash
npm run dev     # 開発サーバー
npm run build   # 本番ビルド
npm run start   # 本番サーバー
npm run lint    # ESLint
```

---

## 動作チェックリスト

実機検証や、変更を加えた後の確認に使ってください。

### アップロード

- [ ] PNG / JPEG の画像をアップロードできる
- [ ] 画像以外のファイルを選ぶとエラーが表示される
- [ ] アップロード後にプレビューが表示される
- [ ] 5MBを超える画像でエラーが表示される
- [ ] 拡張子だけPNGに変えた偽の画像が拒否される（マジックバイト検証）

### 生成

- [ ] DSLが生成される
- [ ] Luauコードが生成される
- [ ] 生成中にローディング表示が出る
- [ ] 「追加の指示」の内容が結果に反映される
- [ ] 出力言語の切り替え（日本語 / English）が効く
- [ ] **生成結果が毎回ほぼ同じ既定値になっていない**（モデルが画像を読めていない兆候）

### エラー処理

- [ ] `LLM_MODEL` を未設定にすると、モデル未設定のエラーが出る
- [ ] APIキーを間違えると、認証エラーが出る
- [ ] `LLM_MODEL` に存在しないモデル名を入れると、モデルが見つからない旨のエラーが出る
- [ ] エラー表示に上流サービスの詳細が併記される
- [ ] **エラー内容にAPIキーが表示されていない**

### コピーとダウンロード

- [ ] DSLのコピー / ダウンロード（`dsl.json`）
- [ ] Luauコードのコピー / ダウンロード（`ui.lua`）

### Roblox Studio での確認

- [ ] `ui.lua` を LocalScript として `StarterPlayer > StarterPlayerScripts` に配置
- [ ] プレイ時に ScreenGui が生成される
- [ ] サイドバー・パネル・タイトル・ボタンが表示される
- [ ] ボタンのホバーでスケールアニメーションが動く
- [ ] 異なる画面解像度でレイアウトが崩れない

---

## ライセンス

MIT License

---

## 状態

開発中です。ロジックの実装とエラー処理は一通り完了していますが、**Roblox Studio での実機検証は未実施**です。生成されたLuauコードは、本番のゲームに入れる前に必ずStudioで動作確認してください。
