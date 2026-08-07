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
function color(value: string, fallback: string): string {
  return HEX_COLOR.test(value.trim()) ? value.trim().toUpperCase() : fallback;
}

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

export type ResolvedStyle = {
  /** CSS の background に直接指定できる値。グラデーションなら linear-gradient。 */
  background: string;
  /** グラデーションの場合の開始色。単色ならその色。 */
  backgroundBase: string;
  isGradient: boolean;
  panel: string;
  accent: string;
  growth: string;
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

function resolveBackground(value: string, fallback: string): Pick<ResolvedStyle, "background" | "backgroundBase" | "isGradient"> {
  const match = HEX_GRADIENT.exec(value.trim());
  if (match) {
    const from = match[1].toUpperCase();
    const to = match[2].toUpperCase();
    return { background: `linear-gradient(180deg, ${from}, ${to})`, backgroundBase: from, isGradient: true };
  }
  const solid = color(value, fallback);
  return { background: solid, backgroundBase: solid, isGradient: false };
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

  return {
    ...background,
    panel: color(dsl.Color.Panel, "#1C1A29"),
    accent,
    growth: color(dsl.Color.AccentGrowth, "#A6FF4D"),
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
