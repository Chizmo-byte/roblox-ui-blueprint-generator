import { DefaultDSL, type DSLBlueprint } from "@/lib/dsl/schema";

type UnknownRecord = Record<string, unknown>;

const TOP_LEVEL_KEYS = [
  "Screen", "Layout", "Spacing", "Color", "Typography",
  "Visual", "Components", "Interactions", "RobloxRules",
] as const;
const MIN_PRESENT_SECTIONS = 3;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasString(value: UnknownRecord, key: string): boolean {
  return typeof value[key] === "string";
}

function hasNumber(value: UnknownRecord, key: string): boolean {
  return typeof value[key] === "number" && Number.isFinite(value[key]);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isNumberPair(value: unknown): value is [number, number] {
  return Array.isArray(value) && value.length === 2 && value.every((item) => typeof item === "number" && Number.isFinite(item));
}

function requireRecord(value: UnknownRecord, key: string): UnknownRecord | null {
  const nested = value[key];
  return isRecord(nested) ? nested : null;
}

/**
 * Retains only the known DSL shape while filling omitted values from the
 * documented defaults. A supplied value with the wrong type is deliberately
 * preserved so the validation below can reject it instead of hiding errors.
 */
function mergeWithDefaults(defaultValue: unknown, value: unknown): unknown {
  if (isRecord(defaultValue)) {
    if (value !== undefined && !isRecord(value)) return value;

    const source = value as UnknownRecord | undefined;
    return Object.fromEntries(
      Object.entries(defaultValue).map(([key, nestedDefault]) => [
        key,
        mergeWithDefaults(nestedDefault, source?.[key]),
      ]),
    );
  }

  if (Array.isArray(defaultValue)) return value === undefined ? [...defaultValue] : value;
  return value === undefined ? defaultValue : value;
}

export function isDSLBlueprint(value: unknown): value is DSLBlueprint {
  if (!isRecord(value)) return false;

  const screen = requireRecord(value, "Screen");
  const layout = requireRecord(value, "Layout");
  const spacing = requireRecord(value, "Spacing");
  const color = requireRecord(value, "Color");
  const typography = requireRecord(value, "Typography");
  const visual = requireRecord(value, "Visual");
  const components = requireRecord(value, "Components");
  const interactions = requireRecord(value, "Interactions");
  const robloxRules = requireRecord(value, "RobloxRules");
  if (!screen || !layout || !spacing || !color || !typography || !visual || !components || !interactions || !robloxRules) return false;

  const automaticSize = requireRecord(layout, "AutomaticSize");
  const constraints = requireRecord(layout, "Constraints");
  const header = requireRecord(typography, "Header");
  const body = requireRecord(typography, "Body");
  const button = requireRecord(typography, "Button");
  const cornerRadius = requireRecord(visual, "CornerRadius");
  const stroke = requireRecord(visual, "Stroke");
  const sidebar = requireRecord(components, "Sidebar");
  const selectionList = requireRecord(components, "SelectionList");
  const detailPanel = requireRecord(components, "DetailPanel");
  const actionArea = requireRecord(components, "ActionArea");
  const icon = requireRecord(components, "Icon");
  const scroll = selectionList && requireRecord(selectionList, "Scroll");
  const buttonPress = requireRecord(interactions, "ButtonPress");
  const buttonStates = requireRecord(interactions, "ButtonStates");
  const hover = buttonStates && requireRecord(buttonStates, "Hover");
  const press = buttonStates && requireRecord(buttonStates, "Press");
  const disabled = buttonStates && requireRecord(buttonStates, "Disabled");
  const upgradeFeedback = requireRecord(interactions, "UpgradeFeedback");
  const zIndex = requireRecord(robloxRules, "ZIndex");
  const remoteEventFlow = requireRecord(robloxRules, "RemoteEventFlow");
  const priceSource = requireRecord(robloxRules, "PriceSource");

  return Boolean(
    automaticSize && constraints && header && body && button && cornerRadius && stroke && sidebar && selectionList && detailPanel && actionArea && icon && scroll && buttonPress && buttonStates && hover && press && disabled && upgradeFeedback && zIndex && remoteEventFlow && priceSource
    && hasString(screen, "BaseResolution") && hasString(screen, "ScaleMode") && hasString(screen, "UIScaleStrategy") && typeof screen.SafeArea === "boolean"
    && typeof layout.UseScaleOnly === "boolean" && isStringArray(layout.AllowOffset) && isNumberPair(layout.AnchorPointDefault) && hasString(layout, "NestingPolicy") && typeof automaticSize.Enabled === "boolean" && hasString(automaticSize, "Axis") && (typeof constraints.AspectRatio === "number" || constraints.AspectRatio === "Auto") && (constraints.SizeLimits === "Auto" || isRecord(constraints.SizeLimits))
    && hasNumber(spacing, "Grid") && hasNumber(spacing, "PaddingDefault") && hasNumber(spacing, "GapDefault") && hasNumber(spacing, "OuterMargin")
    && hasString(color, "Background") && hasString(color, "Sidebar") && hasString(color, "Panel") && hasString(color, "Surface") && hasString(color, "Selected") && hasString(color, "Text") && hasString(color, "AccentPositive") && hasString(color, "AccentGrowth")
    && hasString(typography, "FontFamily") && hasNumber(header, "Size") && hasString(header, "Weight") && hasNumber(body, "Size") && hasString(body, "Weight") && hasNumber(button, "Size") && hasString(button, "Weight")
    && hasString(cornerRadius, "Mode") && hasNumber(cornerRadius, "Value") && typeof stroke.Enabled === "boolean" && hasNumber(stroke, "Thickness") && hasNumber(stroke, "Transparency")
    && hasString(sidebar, "Width") && isStringArray(sidebar.Items) && typeof scroll.UseUIListLayout === "boolean" && typeof scroll.UseUIPadding === "boolean" && hasString(scroll, "AutomaticCanvasSize") && hasNumber(selectionList, "AspectRatio") && hasNumber(selectionList, "Gap") && hasString(detailPanel, "CompareMode") && typeof detailPanel.GrowthIndicator === "boolean" && isStringArray(actionArea.Buttons) && hasString(actionArea, "Layout") && hasNumber(icon, "AspectRatio") && hasNumber(icon, "SizeScale")
    && hasNumber(buttonPress, "Scale") && hasNumber(buttonPress, "StartWithinMs") && hasNumber(hover, "Scale") && hasNumber(press, "Scale") && hasNumber(disabled, "Transparency") && typeof upgradeFeedback.Particle === "boolean" && typeof upgradeFeedback.Sound === "boolean" && hasNumber(upgradeFeedback, "CompleteWithin")
    && hasNumber(zIndex, "Modal") && hasNumber(zIndex, "Panel") && hasNumber(zIndex, "Base") && typeof remoteEventFlow.UseRemoteEvent === "boolean" && hasString(remoteEventFlow, "ServerHandler") && hasString(priceSource, "UseConfigModule") && typeof priceSource.HardcodeForbidden === "boolean"
  );
}

export function parseDSLResponse(response: string): DSLBlueprint {
  const withoutCodeFence = response.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const firstBrace = withoutCodeFence.indexOf("{");
  const lastBrace = withoutCodeFence.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace < firstBrace) throw new Error("INVALID_DSL");

  let parsed: unknown;
  try {
    parsed = JSON.parse(withoutCodeFence.slice(firstBrace, lastBrace + 1));
  } catch {
    throw new Error("INVALID_DSL");
  }

  if (!isRecord(parsed)) throw new Error("INVALID_DSL");
  const presentSections = TOP_LEVEL_KEYS.filter((key) => isRecord(parsed[key])).length;
  if (presentSections < MIN_PRESENT_SECTIONS) throw new Error("INVALID_DSL");

  const completeDsl = mergeWithDefaults(DefaultDSL, parsed);
  if (!isDSLBlueprint(completeDsl)) throw new Error("INVALID_DSL");
  return completeDsl;
}
