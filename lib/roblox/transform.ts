import type { DSLBlueprint } from "@/lib/dsl/schema";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function clamp(value: number, minimum: number, maximum: number, fallback: number): number {
  return Number.isFinite(value) ? Math.min(Math.max(value, minimum), maximum) : fallback;
}

function colorOrFallback(value: string, fallback: string): string {
  return HEX_COLOR.test(value) ? value.toUpperCase() : fallback;
}

function percentToScale(value: string, fallback: number): number {
  const match = /^(\d+(?:\.\d+)?)%$/.exec(value.trim());
  return match ? clamp(Number(match[1]) / 100, 0.05, 0.45, fallback) : fallback;
}

function fontFor(weight: string): string {
  if (weight === "Bold") return "GothamBold";
  if (weight === "Semibold") return "GothamSemibold";
  return "Gotham";
}

/**
 * Converts validated DSL data to a client-side Luau LocalScript.
 * Dynamic values are restricted to numbers, approved colors, and mapped fonts
 * so a malformed DSL cannot inject executable Luau into the output.
 */
export function generateRobloxUI(dsl: DSLBlueprint): string {
  const panelColor = colorOrFallback(dsl.Color.Panel, "#1C1A29");
  const sidebarColor = colorOrFallback(dsl.Color.Background, "#111827");
  const accentColor = colorOrFallback(dsl.Color.AccentPositive, "#F6C453");
  const sidebarWidth = percentToScale(dsl.Components.Sidebar.Width, 0.18);
  const panelPadding = Math.round(clamp(dsl.Spacing.PaddingDefault, 8, 64, 24));
  const titleSize = Math.round(clamp(dsl.Typography.Header.Size, 12, 72, 36));
  const cornerRadius = clamp(dsl.Visual.CornerRadius.Value, 0, 0.5, 0.12);
  const strokeThickness = clamp(dsl.Visual.Stroke.Thickness, 0.5, 8, 1);
  const strokeTransparency = clamp(dsl.Visual.Stroke.Transparency, 0, 1, 0.4);
  const hoverScale = clamp(dsl.Interactions.ButtonStates.Hover.Scale, 0.9, 1.1, 1.04);
  const panelZIndex = Math.round(clamp(dsl.RobloxRules.ZIndex.Panel, 1, 100, 5));
  const baseZIndex = Math.round(clamp(dsl.RobloxRules.ZIndex.Base, 1, 99, 1));
  const titleFont = fontFor(dsl.Typography.Header.Weight);
  const buttonFont = fontFor(dsl.Typography.Button.Weight);

  return `-- Auto-generated Roblox UI blueprint
-- Paste this into a LocalScript. It creates UI only; server actions must be
-- implemented and authorized separately in your own server-side code.

local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local screenGui = Instance.new("ScreenGui")
screenGui.Name = "UIBlueprint"
screenGui.ResetOnSpawn = false
screenGui.IgnoreGuiInset = ${!dsl.Screen.SafeArea}
screenGui.Parent = playerGui

local sidebar = Instance.new("Frame")
sidebar.Name = "Sidebar"
sidebar.Size = UDim2.fromScale(${sidebarWidth}, 1)
sidebar.Position = UDim2.fromScale(0, 0)
sidebar.BackgroundColor3 = Color3.fromHex("${sidebarColor}")
sidebar.BorderSizePixel = 0
sidebar.ZIndex = ${baseZIndex}
sidebar.Parent = screenGui

local panel = Instance.new("Frame")
panel.Name = "MainPanel"
panel.AnchorPoint = Vector2.new(0.5, 0.5)
panel.Position = UDim2.fromScale(${sidebarWidth + (1 - sidebarWidth) / 2}, 0.5)
panel.Size = UDim2.fromScale(${clamp(1 - sidebarWidth - 0.08, 0.3, 0.8, 0.6)}, 0.64)
panel.BackgroundColor3 = Color3.fromHex("${panelColor}")
panel.BorderSizePixel = 0
panel.ZIndex = ${panelZIndex}
panel.Parent = screenGui

local panelPadding = Instance.new("UIPadding")
panelPadding.PaddingTop = UDim.new(0, ${panelPadding})
panelPadding.PaddingBottom = UDim.new(0, ${panelPadding})
panelPadding.PaddingLeft = UDim.new(0, ${panelPadding})
panelPadding.PaddingRight = UDim.new(0, ${panelPadding})
panelPadding.Parent = panel

local panelCorner = Instance.new("UICorner")
panelCorner.CornerRadius = UDim.new(${cornerRadius}, 0)
panelCorner.Parent = panel

${dsl.Visual.Stroke.Enabled ? `local panelStroke = Instance.new("UIStroke")
panelStroke.Thickness = ${strokeThickness}
panelStroke.Transparency = ${strokeTransparency}
panelStroke.Color = Color3.fromHex("${accentColor}")
panelStroke.Parent = panel` : "-- UIStroke is disabled by this blueprint."}

local title = Instance.new("TextLabel")
title.Name = "Title"
title.AnchorPoint = Vector2.new(0.5, 0)
title.Position = UDim2.fromScale(0.5, 0.08)
title.Size = UDim2.fromScale(0.88, 0.16)
title.BackgroundTransparency = 1
title.Text = "UI Blueprint"
title.Font = Enum.Font.${titleFont}
title.TextSize = ${titleSize}
title.TextColor3 = Color3.fromHex("${accentColor}")
title.ZIndex = ${panelZIndex + 1}
title.Parent = panel

local actionButton = Instance.new("TextButton")
actionButton.Name = "ActionButton"
actionButton.AnchorPoint = Vector2.new(0.5, 1)
actionButton.Position = UDim2.fromScale(0.5, 0.9)
actionButton.Size = UDim2.fromScale(0.72, 0.15)
actionButton.BackgroundColor3 = Color3.fromHex("${accentColor}")
actionButton.BorderSizePixel = 0
actionButton.Text = "Action"
actionButton.Font = Enum.Font.${buttonFont}
actionButton.TextSize = ${Math.round(clamp(dsl.Typography.Button.Size, 12, 48, 22))}
actionButton.TextColor3 = Color3.fromRGB(0, 0, 0)
actionButton.ZIndex = ${panelZIndex + 1}
actionButton.Parent = panel

local buttonCorner = Instance.new("UICorner")
buttonCorner.CornerRadius = UDim.new(${cornerRadius}, 0)
buttonCorner.Parent = actionButton

local originalSize = actionButton.Size
actionButton.MouseEnter:Connect(function()
    TweenService:Create(actionButton, TweenInfo.new(0.12), { Size = UDim2.fromScale(originalSize.X.Scale * ${hoverScale}, originalSize.Y.Scale * ${hoverScale}) }):Play()
end)
actionButton.MouseLeave:Connect(function()
    TweenService:Create(actionButton, TweenInfo.new(0.12), { Size = originalSize }):Play()
end)

-- Connect actionButton.Activated only to validated RemoteEvents you own.
`;
}
