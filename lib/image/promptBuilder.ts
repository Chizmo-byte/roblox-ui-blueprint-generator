/**
 * 参考画像を作るための、画像生成AI向けプロンプトを組み立てる。
 *
 * このツールは参考画像を入力に取るが、「そもそも参考画像を持っていない」
 * という入口の問題がある。ここでは利用者のイメージと必要な部品から
 * 画像生成用の指示文を作り、その問題を解消する。
 *
 * LLM を呼ばずブラウザ内で完結させるため、組み立ては純粋な文字列操作で行う。
 */

export type UIPart = {
  id: string;
  /** 画面に表示する日本語ラベル。 */
  label: string;
  /** 補足説明。何のための部品かを一言で。 */
  hint: string;
  /** プロンプトに差し込む英語の記述。 */
  en: string;
};

/**
 * Roblox のメニュー画面で使われる代表的な部品。
 * 画像生成AIが描き分けられる粒度に揃えている。
 */
export const UI_PARTS: UIPart[] = [
  {
    id: "sidebar",
    label: "サイドバー",
    hint: "左側のカテゴリ切り替え",
    en: "a vertical sidebar on the left listing category buttons, with the active category clearly highlighted",
  },
  {
    id: "list",
    label: "一覧リスト",
    hint: "スクロールする項目の並び",
    en: "a scrollable list filling the main area, where each row shows a small icon, an item name, and a value on the right",
  },
  {
    id: "detail",
    label: "詳細パネル",
    hint: "選択中の項目と数値の比較",
    en: "a detail panel for the selected item, including a before/after stat comparison table with arrows",
  },
  {
    id: "action",
    label: "アクションボタン",
    hint: "購入・決定などの主ボタン",
    en: "one large primary action button at the bottom, visually the strongest call to action on the screen",
  },
  {
    id: "grid",
    label: "アイコングリッド",
    hint: "四角いアイテムの格子並び",
    en: "a grid of square item icons with rarity-colored borders",
  },
  {
    id: "currency",
    label: "通貨バー",
    hint: "所持金の表示",
    en: "a top bar displaying the player's currency amounts with small coin icons",
  },
  {
    id: "header",
    label: "ヘッダー",
    hint: "画面タイトルと閉じるボタン",
    en: "a header row with the screen title on the left and a close (X) button in the top-right corner",
  },
  {
    id: "progress",
    label: "進捗バー",
    hint: "レベルや強化段階の表示",
    en: "progress bars indicating level or upgrade progression",
  },
];

/** 最初から選ばれている部品。多くのメニュー画面で共通して使われるもの。 */
export const DEFAULT_PART_IDS = ["sidebar", "list", "action"];

const FALLBACK_CONCEPT = "A shop or upgrade menu for a Roblox game";

/**
 * 画像生成AIに貼り付けるプロンプトを組み立てる。
 *
 * @param concept 利用者が書いた、作りたい画面のイメージ
 * @param partIds 選択された部品のID
 */
export function buildImagePrompt(concept: string, partIds: string[]): string {
  const trimmed = concept.trim();
  const selected = UI_PARTS.filter((part) => partIds.includes(part.id));

  const partLines = selected.length > 0
    ? selected.map((part) => `- ${part.en}`).join("\n")
    : "- a clean menu panel with a title and one primary button";

  return `A user interface mockup for a Roblox game. Landscape 16:9, 1920x1080.

Concept:
${trimmed || FALLBACK_CONCEPT}

The interface must clearly include:
${partLines}

Style requirements:
- Flat game UI design with rounded corners and generous padding
- Strong visual hierarchy: the primary action must stand out
- High contrast, large readable text
- Consistent accent color used for highlights and the main button
- Subtle borders or glow on panels, no heavy drop shadows

Render it as a clean front-facing interface screenshot.
No perspective or tilt, no photorealism, no 3D characters, no hands,
no watermark, no surrounding browser or device frame.`;
}
