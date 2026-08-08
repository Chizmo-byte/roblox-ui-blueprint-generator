# 考察用の資料リスト

NotebookLM などで検討するための出典をまとめたもの。
「どの判断に効くか」で並べてあり、上ほど優先度が高い。

調査日: 2026-08-08

---

## いま決めようとしていること

1. **色の枠をどこまで増やすか** — UIは面が入れ子になっており、際限がない。どこで線を引くか
2. **UITheme ModuleScript をどう書き出すか** — DSLをRoblox側で使える形にする
3. **DSLの値が Roblox で本当に使えるか** — 単位や仕様の確認

---

## A. 色の枠問題（最優先）

**この問題には既に完成された答えがある。** Material Design 3 の color roles は、まさに「面が入れ子になったときにどう名前を付けるか」を解いた体系。
`surface` / `surface-container` / `surface-container-high` / `on-surface` という命名で層と前景を表現している。

いま自作している `Background` / `Sidebar` / `Panel` / `Surface` / `Text` は、この体系の再発明になっている可能性が高い。既存の解を確認してから決めたほうが早い。

- [Material Design 3 — Color roles](https://m3.material.io/styles/color/roles)
  各ロールが何を指すかの定義。`on-*`（面の上に載る前景色）という考え方が特に参考になる
- [Material Design 3 — Color system overview](https://m3.material.io/styles/color/system/overview)
  ロール同士の関係と、なぜその数に落ち着いたか
- [W3C Design Tokens Format Module](https://tr.designtokens.org/format/)
  デザイントークンの標準フォーマット。DSLの構造を標準に寄せるかの判断材料

**確認したい問い**
- 面のロールは最低いくつ必要か。Material 3 はいくつで足りているか
- 「選択中」「無効」などの状態色は、面のロールとは別建てか
- 文字色を面ごとに持つ（`on-surface`）方式と、1つだけ持つ方式の得失

---

## B. Roblox の UI 仕様

### 最重要

- [UI appearance modifiers](https://create.roblox.com/docs/ui/appearance-modifiers)
  UICorner / UIStroke / UIGradient / UIPadding の一次情報。
  **角丸の単位問題の答えがここにある。** UICorner の `CornerRadius` は Scale と Offset の両方を取り、Scale 0.5 以上でピル型になる。個別の角（`TopLeftRadius` など）も指定できる

- [Roblox creator-docs / content/en-us/ui](https://github.com/Roblox/creator-docs/tree/main/content/en-us/ui)
  公式ドキュメントのMarkdown原本。**NotebookLM に取り込むならこちらが扱いやすい。**
  レイアウト、制約、スタイリング、レスポンシブ対応がまとまっている

### フォント

- [Font enum](https://create.roblox.com/docs/reference/engine/enums/Font)
  現在 `Enum.Font.GothamBold` を使っているが、**これは旧方式。**
  新しいフォントはアセットID方式に移行しており、`FontFace` プロパティと `Font` データ型を使うのが現行。
  UITheme を作るならどちらで持つか決める必要がある

**確認したい問い**
- `FontFace` に移行すべきか。Enum.Font はいつまで使えるか
- DSLの `Typography.FontFamily`（現在は文字列 "Gotham"）を、どう Roblox の型に対応させるか

---

## C. UITheme ModuleScript

- [Roblox creator-docs / luau](https://github.com/Roblox/creator-docs/tree/main/content/en-us/luau)
  ModuleScript の基本、`require` の挙動、型注釈

**確認したい問い**
- ModuleScript を `ReplicatedStorage` に置く場合の参照方法と、クライアント／サーバー双方から読む際の注意
- 型付き（`--!strict`）にする価値はあるか
- 色を `Color3` として持つか、HEX文字列として持って使用時に変換するか

---

## D. 自分のプロジェクトの資料

NotebookLM に一緒に入れておくと、既存の設計を踏まえた考察になる。

- `lib/dsl/schema.ts` — 現在のDSLの型定義と既定値
- `lib/dsl/fieldGuide.ts` — 各フィールドの定義文（AIに渡しているもの）
- `docs/llm-providers.md` — プロバイダ選定の経緯
- `README.md` — ツールの位置づけ

---

## 集めなくてよいもの

考察を複雑にするだけなので、今回は外す。

- **Luau の言語仕様全般** — UITheme はテーブルを返すだけなので、深い知識は不要
- **Roblox のスクリプト実行モデル、RemoteEvent、DataStore** — このツールはUIの見た目しか扱わない
- **LLM のプロンプト技法一般** — フィールド定義を書く方式で既に効果が出ている
- **他のUIフレームワーク（React、Flutter など）の設計** — Material 3 で足りる

---

## 進め方の提案

**Aだけ先に読むのが効率的。** 色の枠問題はいま手が止まっている箇所で、しかも既存の答えがある可能性が高い。

B・C は「作ると決めてから」で間に合う。先に読むと、判断材料ではなく実装知識になってしまい、考察が長くなる。
