import type { DSLBlueprint } from "@/lib/dsl/schema";

/**
 * DSL の値を、そのまま画面描画に使える形へ解決する。
 *
 * DSL は「デザインの数値仕様」であって表示形式ではないため、
 * 単色とグラデーションの混在や、単位が曖昧な角丸などを吸収する必要がある。
 * ここに解決処理を集約しておくことで、プレビューと（将来の）Roblox 向け
 * 出力が同じ解釈を共有できる。
 */

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
/** "#000000-#1E1E3C" のような2色グラデーション記法。 */
const HEX_GRADIENT = /^(#[0-9a-fA-F]{6})\s*-\s*(#[0-9a-fA-F]{6})$/;
const PERCENT = /^(\d+(?:\.\d+)?)%$/;

function clamp(value: number, minimum: number, maximum: number, fallback: number): number {
  return Number.isFinite(value) ? Math.min(Math.max(value, minimum), maximum) : fallback;
}

/** HEX として妥当な値だけを通す。想定外の文字列は既定色に落とす。 */
function color(value: string | undefined, fallback: string): string {
  return typeof value === "string" && HEX_COLOR.test(value.trim()) ? value.trim().toUpperCase() : fallback;
}

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

/** sRGB の相対輝度。0（黒）〜1（白）。 */
function luminance(hex: string): number {
  const channel = (value: number) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/**
 * 暗い文字と明るい文字のコントラストが釣り合う相対輝度。
 *
 * 白とのコントラスト (1.05)/(L+0.05) と黒とのコントラスト (L+0.05)/0.05 が
 * 等しくなる点で、L ≒ 0.179。これより明るい背景には暗い文字を載せたほうが読める。
 */
const CONTRAST_PIVOT = 0.179;

/** 背景が明るいかどうか。文字色や重ね色の向きを決めるのに使う。 */
function isLight(hex: string): boolean {
  return luminance(hex) > CONTRAST_PIVOT;
}

/** 2色を混ぜる。amount が 0 で from、1 で to。 */
function mix(from: string, to: string, amount: number): string {
  const [r1, g1, b1] = hexToRgb(from);
  const [r2, g2, b2] = hexToRgb(to);
  const channel = (a: number, b: number) => Math.round(a + (b - a) * amount);
  return `#${[channel(r1, r2), channel(g1, g2), channel(b1, b2)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
}

/** WCAG のコントラスト比。1（同色）〜21（黒と白）。 */
function contrastRatio(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

/** 本文は 4.5:1、補助テキストは 3:1 を目標にする（WCAG AA 相当）。 */
const TEXT_TARGET = 4.5;
const MUTED_TARGET = 3;

/**
 * ある背景色の上で読める文字色の組を返す。
 *
 * DSL は文字色を持たないため、背景の明るさから導出する。これがないと
 * 明るい配色のとき、暗い配色向けに決め打ちした文字色が沈んで読めなくなる。
 *
 * まず見た目の柔らかい準黒・準白を試し、目標のコントラストに届かない場合だけ
 * 純黒・純白へ落とす。純黒と純白の切り替えは、どんな背景でも 4.58:1 以上を
 * 数学的に保証できるため、最後の砦として機能する。
 */
function textColorsFor(background: string): { text: string; muted: string; overlay: string } {
  const light = isLight(background);
  const soft = light ? "#26251f" : "#f2f0f7";
  const hard = light ? "#000000" : "#ffffff";
  const text = contrastRatio(soft, background) >= TEXT_TARGET ? soft : hard;

  // 本文色を背景側へ寄せて補助色を作る。届かなければ寄せ幅を段階的に縮める。
  let muted = text;
  for (const amount of [0.42, 0.34, 0.26, 0.18, 0.1, 0]) {
    muted = mix(text, background, amount);
    if (contrastRatio(muted, background) >= MUTED_TARGET) break;
  }

  return {
    text,
    muted,
    overlay: light ? "rgba(0, 0, 0, 0.055)" : "rgba(255, 255, 255, 0.055)",
  };
}

export type ResolvedStyle = {
  /** CSS の background に直接指定できる値。グラデーションなら linear-gradient。 */
  background: string;
  /** グラデーションの場合の開始色。単色ならその色。 */
  backgroundBase: string;
  isGradient: boolean;
  /** グラデーションの開始色と終了色。単色ならどちらも同じ値。 */
  gradientFrom: string;
  gradientTo: string;
  panel: string;
  /** サイドバーの帯の面。 */
  sidebar: string;
  /** Panel の上に重なる、通常の行やカードの面。 */
  surface: string;
  /** 選択中の項目のハイライト色。 */
  selected: string;
  /** 選択中の項目に載せる文字色。 */
  selectedText: string;
  accent: string;
  growth: string;
  /** 文字色を DSL から取れたか。false なら背景から導出した値。 */
  textFromDsl: boolean;
  /** パネル上の文字色。パネルの明るさから導出する。 */
  panelText: string;
  panelTextMuted: string;
  /** パネル上に重ねる行などの薄い面。 */
  panelOverlay: string;
  /** サイドバー上の文字色。背景の明るさから導出する。 */
  sidebarText: string;
  sidebarTextMuted: string;
  /** アクセント色のボタンに載せる文字色。 */
  accentText: string;
  /** "22%" 形式。 */
  sidebarWidth: string;
  /** "10px" 形式。 */
  cornerRadius: string;
  padding: number;
  gap: number;
  outerMargin: number;
  headerSize: number;
  bodySize: number;
  buttonSize: number;
  headerWeight: number;
  buttonWeight: number;
  /** 枠線。無効なら null。 */
  stroke: { width: number; color: string } | null;
  hoverScale: number;
  sidebarItems: string[];
  actionButtons: string[];
  listGap: number;
  listAspectRatio: number;
};

/**
 * 角丸を CSS の長さに変換する。
 *
 * DSL の CornerRadius.Value は単位が曖昧で、モデルは Mode に応じて
 * 割合（0〜0.5）とピクセルのどちらでも返してくる。Mode を優先しつつ、
 * Rounded のときだけ値の大きさで単位を判定する。
 */
function resolveCornerRadius(corner: DSLBlueprint["Visual"]["CornerRadius"]): string {
  if (corner.Mode === "Square") return "0px";
  if (corner.Mode === "Pill") return "999px";

  const value = corner.Value;
  // 1以下なら割合指定とみなし、パネル高さに対する概算ピクセルへ換算する。
  if (Number.isFinite(value) && value > 0 && value <= 1) {
    return `${Math.round(clamp(value, 0, 0.5, 0.12) * 100)}px`;
  }
  return `${Math.round(clamp(value, 0, 64, 12))}px`;
}

function resolveBackground(
  value: string,
  fallback: string,
): Pick<ResolvedStyle, "background" | "backgroundBase" | "isGradient" | "gradientFrom" | "gradientTo"> {
  const match = HEX_GRADIENT.exec(value.trim());
  if (match) {
    const from = match[1].toUpperCase();
    const to = match[2].toUpperCase();
    return {
      background: `linear-gradient(180deg, ${from}, ${to})`,
      backgroundBase: from,
      isGradient: true,
      gradientFrom: from,
      gradientTo: to,
    };
  }
  const solid = color(value, fallback);
  return { background: solid, backgroundBase: solid, isGradient: false, gradientFrom: solid, gradientTo: solid };
}

function resolveWeight(weight: string): number {
  if (weight === "Bold") return 700;
  if (weight === "Semibold") return 600;
  return 400;
}

function resolveStrings(values: unknown, fallback: string[]): string[] {
  if (!Array.isArray(values)) return fallback;
  const cleaned = values.filter((v): v is string => typeof v === "string" && v.trim().length > 0).slice(0, 8);
  return cleaned.length > 0 ? cleaned : fallback;
}

export function resolveStyle(dsl: DSLBlueprint): ResolvedStyle {
  const background = resolveBackground(dsl.Color.Background, "#111827");

  const sidebarMatch = PERCENT.exec(dsl.Components.Sidebar.Width.trim());
  const sidebarWidth = sidebarMatch ? clamp(Number(sidebarMatch[1]), 8, 45, 18) : 18;

  // Roblox の Transparency は 0 が不透明。CSS の alpha とは向きが逆になる。
  const strokeAlpha = 1 - clamp(dsl.Visual.Stroke.Transparency, 0, 1, 0.4);
  const accent = color(dsl.Color.AccentPositive, "#F6C453");
  const [r, g, b] = hexToRgb(accent);

  const panel = color(dsl.Color.Panel, "#1C1A29");
  const sidebar = color(dsl.Color.Sidebar, panel);
  const surface = color(dsl.Color.Surface, panel);
  const selected = color(dsl.Color.Selected, accent);
  const panelColors = textColorsFor(surface);
  const sidebarColors = textColorsFor(sidebar);

  // DSL の文字色を優先する。ただし行の面に対して明らかに読めない場合は、
  // 画面が破綻するのを避けるため導出した色に落とす。
  const dslText = color(dsl.Color.Text, "");
  const useDslText = dslText !== "" && contrastRatio(dslText, surface) >= MUTED_TARGET;

  return {
    ...background,
    panel,
    sidebar,
    surface,
    selected,
    selectedText: textColorsFor(selected).text,
    accent,
    growth: color(dsl.Color.AccentGrowth, "#A6FF4D"),
    textFromDsl: useDslText,
    panelText: useDslText ? dslText : panelColors.text,
    panelTextMuted: useDslText ? mix(dslText, surface, 0.4) : panelColors.muted,
    panelOverlay: panelColors.overlay,
    sidebarText: sidebarColors.text,
    sidebarTextMuted: sidebarColors.muted,
    accentText: textColorsFor(accent).text,
    sidebarWidth: `${sidebarWidth}%`,
    cornerRadius: resolveCornerRadius(dsl.Visual.CornerRadius),
    padding: Math.round(clamp(dsl.Spacing.PaddingDefault, 4, 64, 24)),
    gap: Math.round(clamp(dsl.Spacing.GapDefault, 2, 48, 16)),
    outerMargin: Math.round(clamp(dsl.Spacing.OuterMargin, 0, 96, 48)),
    headerSize: Math.round(clamp(dsl.Typography.Header.Size, 10, 72, 36)),
    bodySize: Math.round(clamp(dsl.Typography.Body.Size, 8, 32, 18)),
    buttonSize: Math.round(clamp(dsl.Typography.Button.Size, 8, 48, 22)),
    headerWeight: resolveWeight(dsl.Typography.Header.Weight),
    buttonWeight: resolveWeight(dsl.Typography.Button.Weight),
    stroke: dsl.Visual.Stroke.Enabled
      ? { width: clamp(dsl.Visual.Stroke.Thickness, 0.5, 8, 1), color: `rgba(${r}, ${g}, ${b}, ${strokeAlpha.toFixed(2)})` }
      : null,
    hoverScale: clamp(dsl.Interactions.ButtonStates.Hover.Scale, 0.9, 1.2, 1.04),
    sidebarItems: resolveStrings(dsl.Components.Sidebar.Items, ["Category"]),
    actionButtons: resolveStrings(dsl.Components.ActionArea.Buttons, ["Action"]),
    listGap: Math.round(clamp(dsl.Components.SelectionList.Gap, 2, 48, 16)),
    listAspectRatio: clamp(dsl.Components.SelectionList.AspectRatio, 0.5, 12, 1.4),
  };
}
