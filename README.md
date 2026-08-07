# Roblox UI Blueprint Generator

**Turn a UI reference image into a reusable design spec for your Roblox game.**
Upload a screenshot of a UI you like and get back a structured design blueprint (JSON) — colors, spacing, typography, corner radius, interaction feel — plus a live preview so you can check the design before you build anything.

> UI reference image → LLM → DSL Blueprint (JSON) → Preview → hand to your AI coding tool

日本語の詳細は以下をご覧ください。

---

## これは何か

**Robloxゲームの「UIデザインの決めごと」を、画像1枚から作るツールです。**

参考にしたいUIの画像をアップロードすると、AIがそれを解析して **DSL（UI設計データ / JSON）** に変換します。生成されたDSLは画面上でプレビューでき、そのままAIコーディングツールへの指示書として使えます。

### 何のためにあるか

ゲームのUIは、画面ごとにバラバラだと安っぽく見えます。かといって「配色は何色、余白は何px」を毎回決めるのは大変です。

このツールは、その決めごとを**1回だけ作って、以降ずっと使い回す**ためのものです。

```
1. 好きなUIの画像から DSL を作る（このツール）
2. プレビューで配色と余白を確認する（このツール）
3. AIに「このDSLに従ってインベントリ画面を作って」と頼む
4. 画面が増えてもDSLは同じなので、ゲーム全体で見た目が揃う
```

メニューの中身（強化項目、機能）は開発中どんどん変わりますが、**デザインの決めごとは変わりません。** その変わらない部分だけを切り出したのがDSLです。

### 何が出てくるか

| 出力 | 内容 |
|---|---|
| **DSL（JSON）** | Screen / Layout / Spacing / Color / Typography / Visual / Components / Interactions / RobloxRules の9セクション。コピー・ダウンロード可能 |
| **プレビュー** | DSLの値だけで描画したUIの近似表示。実装前に配色と余白のバランスを確認できる |

### 何が出てこないか

- **Roblox のコードは生成しません。** DSLをAIコーディングツールに渡して実装してもらう想定です
- 完成したゲームUIそのものではありません。**デザインの仕様**を出すツールです

> **なぜコードを生成しないのか**
> 以前は骨組みのLocalScriptを生成していましたが、どんな画像を入れても同じ構造しか出ないうえ、AIに渡す場合はDSLのほうが情報量が多いため削除しました。コード生成はAIの得意分野なので、このツールは「AIに渡す仕様を正確に作る」ことに専念します。

### プレビューについて

DSLの値のみで描画しています。**Roblox の描画を厳密に再現するものではありません。**

- フォントは Roblox の Gotham ではなくブラウザのものになります
- 画面比率によるスケーリング挙動は再現しません
- 表示される画面構成は、デザインを確認するための代表例です

目的は「配色と余白のバランスが破綻していないか」を実装前に判断することです。

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
3. 参考画像がなければ、**「参考にする画像がない場合」**を開いて画像生成AI用のプロンプトを作る（後述）
4. **参考にするUI画像**をアップロード（PNG / JPEG、5MBまで）
5. **「UI設計を生成」**を押す
6. **プレビュー**で配色と余白を確認する。イメージと違えば、別の画像や指示で再生成
7. 納得したら **DSL** をコピー、またはダウンロード
8. AIコーディングツールにDSLを渡して「この仕様で◯◯画面を作って」と依頼する

### 参考画像がない場合

「好きなUIの画像を用意する」が最初の壁になりがちなので、**画像そのものを作るための支援**を用意しています。

1. 作りたい画面のイメージを自由に書く（例：宇宙をテーマにした暗い配色のショップ画面）
2. 必要な部品にチェックを入れる（サイドバー、一覧リスト、詳細パネル、アクションボタンなど8種類）
3. 出来上がった英語のプロンプトをコピーし、好きな画像生成AIに貼り付ける
4. 生成された画像をこのツールにアップロードする

**自分で作った画像なら、必要な部品が確実に写っています。** 「ショップの画像しか手元にないのにインベントリ画面を作りたい」といった不一致が起きません。

この機能はブラウザ内で完結し、APIを消費しません。何度でも自由に試せます。

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
components/
  ImagePromptBuilder.tsx  参考画像を作るためのプロンプト組み立てUI
  DesignPreview.tsx       DSLの値でUIを近似描画するプレビュー
  DSLViewer.tsx           DSLの表示・コピー・ダウンロード
  ...                     アップロード、画像プレビューなど
lib/
  image/parser.ts         画像の検証（サイズ・MIME・マジックバイト）
  image/promptBuilder.ts  部品リストと画像生成プロンプトの組み立て
  llm/client.ts           OpenAI互換 / Anthropic クライアントとエラー分類
  dsl/schema.ts           DSLの型定義と既定値（DefaultDSL）
  dsl/parse.ts            LLM出力のパース・既定値補完・厳格な型検証
  dsl/style.ts            DSL → 描画用の値へ解決（色・角丸・余白など）
  roblox/rules.ts         Roblox UI ルール辞書（AIへのプロンプトに使用）
theme.tsx                 アプリ側UIのカラーテーマ
```

### 安全性について

- アップロード画像は**マジックバイトで実体を検証**し、宣言されたMIMEタイプと一致しない場合は拒否します（5MB上限）
- LLMの出力は既定値で補完したうえで**厳格に型検証**します。型が不正な値は補正で隠さずエラーにします
- プレビュー描画時、DSL由来の値は**数値のクランプとカラーコードの正規表現検証**を通します。想定外の文字列がスタイルに紛れ込むことを防ぎます
- APIキーは環境変数からのみ読み込み、エラーメッセージに含まれる可能性のあるトークンは伏せ字にします

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
- [ ] 生成中にローディング表示が出る
- [ ] 「追加の指示」の内容が結果に反映される
- [ ] 出力言語の切り替え（日本語 / English）が効く
- [ ] **生成結果が毎回ほぼ同じ既定値になっていない**（モデルが画像を読めていない兆候）

### プレビュー

- [ ] アップロードした画像の配色がプレビューに反映されている
- [ ] 角丸・余白・文字サイズが画像の印象と大きくズレていない
- [ ] ボタンにマウスを乗せると拡大する
- [ ] 下部のチップに表示される値が、DSLの内容と一致している

### エラー処理

- [ ] `LLM_MODEL` を未設定にすると、モデル未設定のエラーが出る
- [ ] APIキーを間違えると、認証エラーが出る
- [ ] `LLM_MODEL` に存在しないモデル名を入れると、モデルが見つからない旨のエラーが出る
- [ ] エラー表示に上流サービスの詳細が併記される
- [ ] **エラー内容にAPIキーが表示されていない**

### コピーとダウンロード

- [ ] DSLのコピー / ダウンロード（`dsl.json`）

### AIへの受け渡し

- [ ] DSLをAIコーディングツールに渡し、意図した見た目のUIが実装される
- [ ] 同じDSLで別の画面を作っても、配色や余白が揃っている

---

## ライセンス

MIT License

---

## 状態

開発中です。画像からDSLを生成し、プレビューで確認するまでの一連の流れは動作確認済みです。

**今後の予定**

- **UITheme ModuleScript の出力** — DSLをRoblox側のModuleScriptとして書き出し、各UIスクリプトから `require` して参照できるようにする。1箇所直せばゲーム全体の見た目が変わる状態を目指します
- **必要な部品の選択** — 画像は「見た目」の指定に専念させ、「どんな部品が必要か」は別途チェックリストで指定できるようにする
