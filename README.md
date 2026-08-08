# Roblox UI Blueprint Generator

**Turn a UI reference image into a reusable design spec for your Roblox game.**
Upload a screenshot of a UI you like and get back a structured design blueprint (JSON) — colors, spacing, typography, corner radius, interaction feel — plus a live preview so you can check the design before you build anything.

> UI reference image → LLM → DSL Blueprint (JSON) → Preview → hand to your AI coding tool

以下は日本語の説明です。

---

## どんなツールか

**参考にしたいUIの画像を1枚渡すと、そのデザインの決まりごとを取り出してくれるツールです。**

アップロードした画像をAIが読み取り、配色や余白といった要素を **DSL（UI設計データ / JSON）** にまとめます。結果はその場でプレビューでき、そのままAIコーディングツールへの指示書として使えます。

### 何のためにあるか

画面ごとに配色や余白がバラついていると、ゲームは一気に安っぽく見えます。とはいえ、画面を作るたびに「この色は何番、余白は何px」と決め直すのは骨が折れます。

そこで、**最初に一度だけ決めて、あとはずっと使い回す**という形にしたのがこのツールです。

```
1. 好きなUIの画像から DSL を作る（このツール）
2. プレビューで配色と余白を確認する（このツール）
3. AIに「このDSLに従ってインベントリ画面を作って」と頼む
4. 画面が増えてもDSLは同じなので、ゲーム全体で見た目が揃う
```

開発が進めば、メニューの中身（強化項目や機能）はどんどん入れ替わります。でも**配色や余白のルールは変わりません。** その変わらない部分だけを抜き出したものがDSLです。

### できること

| 出力 | 内容 |
|---|---|
| **DSL（JSON）** | Screen / Layout / Spacing / Color / Typography / Visual / Components / Interactions / RobloxRules の9セクション。コピー・ダウンロード可能 |
| **プレビュー** | DSLの値だけで描画したUIの近似表示。実装前に配色と余白のバランスを確認できる |

### できないこと

- **Roblox のコードは作りません。** DSLをAIコーディングツールに渡し、実装はそちらに任せる想定です
- 出てくるのは完成したUIではなく、あくまで**デザインの仕様**です

> **なぜコードを作らないのか**
> かつては骨組みだけのLocalScriptを出力していました。ただ、どんな画像を入れても構造が変わらないうえ、AIに渡すならDSLのほうが情報量で勝ります。そのため廃止しました。コードを書くのはAIが得意な仕事です。このツールは、そのAIに渡す仕様を正確に作ることへ専念します。

### プレビューについて

プレビューはDSLの値だけで描いています。**Roblox の画面を厳密に再現するものではありません。**

- フォントは Roblox の Gotham ではなく、ブラウザで使えるものに置き換わります
- 画面比率に応じた伸縮の挙動までは再現しません
- 表示している画面構成は、デザインを見比べるための一例です

実装に入る前に「配色と余白のバランスが崩れていないか」を見極める、という用途を想定しています。

---

## セットアップ

### 必要なもの

- Node.js 20 以上
- AIサービスのAPIキー（下の表から好きなものを選べます）

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

**OpenAI互換のエンドポイントであれば、この3つを差し替えるだけで動きます。** 送るリクエストの中身は、どのサービスでも変わりません。

| サービス | `LLM_BASE_URL` | `LLM_MODEL` の例 |
|---|---|---|
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta/openai/` | `gemini-3.6-flash` |
| OpenRouter | `https://openrouter.ai/api/v1` | `qwen/qwen3-vl-8b-instruct` |
| NVIDIA NIM | `https://integrate.api.nvidia.com/v1` | `qwen/qwen3-vl-8b-instruct` |
| Ollama（ローカル） | `http://localhost:11434/v1` | `qwen3-vl:8b` |
| Ollama Cloud | `https://ollama.com/v1` | `qwen3-vl:8b` |

**Anthropic（Claude）だけはAPIの形式が違う**ので、指定を1行足してください。

```env
LLM_PROVIDER=anthropic
LLM_MODEL=claude-haiku-4-5
LLM_API_KEY=sk-ant-...
```

残りの設定項目は、`.env.example` にコメント付きで一覧しています。

### モデル選びの目安

AIに任せているのは「画像を読んで、決まった形のJSONを返す」ことだけです。込み入った推論も長文の処理も要りません。代わりに効いてくるのが**構造化出力の安定性**です。

- **8Bクラスのvisionモデルが実用の下限**です（例: Qwen3-VL-8B）
- これより小さいモデルはDSLの構造を埋めきれず、**中身の大半が既定値のまま出てくる**ことがあります。生成のたびに似たような結果しか返らないときは、まずここを疑ってください
- 無料枠の上限は、各サービスのダッシュボードで確認してください。公表値は頻繁に変わります。なお、このツールは「生成」1回につきAPIリクエストを1回しか送らないため、分あたりの制限に引っかかることはまずありません

詳しい比較は [docs/llm-providers.md](docs/llm-providers.md) を参照してください。

---

## 使い方

1. **出力言語**を選ぶ（日本語 / English）
2. **追加の指示**を書く（任意）— 例：「丸みのあるボタン、余白は広め、明るい配色にしたい」
3. 参考画像が手元になければ、**「参考にする画像がない場合」**を開いて画像生成AI用のプロンプトを作る（後述）
4. **参考にするUI画像**をアップロードする（PNG / JPEG、5MBまで）
5. **「UI設計を生成」**を押す
6. **プレビュー**で配色と余白を確かめる。思っていたものと違えば、画像や指示を変えて作り直す
7. 納得できたら **DSL** をコピー、またはダウンロードする
8. AIコーディングツールにDSLを渡し、「この仕様で◯◯画面を作って」と頼む

### 参考画像がない場合

「参考にする画像を用意する」ところが、最初の壁になりがちです。そこで、**その画像自体を作るための手助け**を用意しました。

1. 作りたい画面のイメージを自由に書く（例：宇宙をテーマにした暗い配色のショップ画面）
2. 必要な部品にチェックを入れる（サイドバー、一覧リスト、詳細パネル、アクションボタンなど8種類）
3. 出来上がった英語のプロンプトをコピーし、好きな画像生成AIに貼り付ける
4. 生成された画像を、このツールにアップロードする

**自分で作った画像なら、欲しい部品が必ず写っています。** 「手元にあるのはショップの画像だけなのに、作りたいのはインベントリ画面」という食い違いが起きません。

この機能はブラウザの中だけで動くので、APIを消費しません。何度でも作り直せます。

---

## DSL の構成

生成されるDSLは、次の9セクションからできています。既定値は `lib/dsl/schema.ts` の `DefaultDSL` にあり、AIが一部のフィールドを省略した場合はここから補われます。

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

Roblox実装の基準となるルール辞書は `lib/roblox/rules.ts` にあり、AIへのプロンプトへそのまま渡しています。DSLのスキーマと内容を揃えてあります。

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

- アップロードされた画像は**マジックバイトで中身を検証**します。申告されたMIMEタイプと食い違っていれば受け付けません（5MB上限）
- LLMの出力は、既定値で補ったうえで**厳格に型検証**します。型が合わない値は、補正で覆い隠さずエラーとして扱います
- プレビューを描くとき、DSL由来の値は**数値のクランプとカラーコードの正規表現検証**を通します。想定外の文字列がスタイルに紛れ込むのを防ぐためです
- APIキーは環境変数からのみ読み込みます。エラーメッセージにトークンらしき文字列が混じっていた場合は、表示する前に伏せ字へ置き換えます

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

実機での確認や、コードに手を入れたあとの点検に使ってください。

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

開発中です。画像からDSLを作り、プレビューで確かめるまでの流れは動作を確認済みです。

**これから作るもの**

- **UITheme ModuleScript の出力** — DSLをRoblox側のModuleScriptとして書き出し、各UIスクリプトから `require` で参照できるようにします。1箇所を直せばゲーム全体の見た目が変わる、という状態が目標です
- **必要な部品の選択** — 画像には「見た目」の指定に専念してもらい、「どの部品が要るか」は別のチェックリストで指定できるようにします
