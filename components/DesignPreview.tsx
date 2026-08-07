"use client";

import { useState } from "react";
import type { DSLBlueprint } from "@/lib/dsl/schema";
import { resolveStyle } from "@/lib/dsl/style";
import { theme } from "@/theme";

type DesignPreviewProps = { dsl: DSLBlueprint | undefined };

/**
 * 生成されたDSLの値だけを使って、UIの見た目を近似表示する。
 *
 * 目的は「配色と余白のバランスが破綻していないか」を実装前に確認することであり、
 * Roblox の描画を厳密に再現するものではない。フォントとスケーリング挙動は
 * ブラウザのものになるため、その旨を画面上に明記している。
 */
export default function DesignPreview({ dsl }: DesignPreviewProps) {
  const [hovered, setHovered] = useState(false);
  if (!dsl) return null;

  const s = resolveStyle(dsl);
  const rows = ["Blackhole Core", "Vacuum Nozzle", "Capacity Tank"];

  return (
    <div style={{ marginTop: "40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
        <h2 style={{ fontSize: "22px", margin: 0 }}>プレビュー</h2>
        <span style={{ fontSize: "12px", color: "#666" }}>
          DSLの値のみで描画しています。フォントと伸縮の挙動は実機と異なります。
        </span>
      </div>

      <div
        style={{
          display: "flex",
          height: "320px",
          borderRadius: "8px",
          overflow: "hidden",
          border: `1px solid ${theme.surfaceBorder}`,
        }}
      >
        {/* サイドバー */}
        <div
          style={{
            width: s.sidebarWidth,
            minWidth: "90px",
            background: s.background,
            padding: `${Math.round(s.padding * 0.6)}px ${Math.round(s.padding * 0.4)}px`,
            display: "flex",
            flexDirection: "column",
            gap: `${Math.round(s.gap * 0.6)}px`,
          }}
        >
          {s.sidebarItems.map((item, index) => (
            <div
              key={item}
              style={{
                fontSize: `${Math.max(9, Math.round(s.bodySize * 0.7))}px`,
                fontWeight: 600,
                color: index === 0 ? s.accent : "#8b86a0",
                background: index === 0 ? s.panel : "transparent",
                borderRadius: s.cornerRadius,
                padding: `${Math.round(s.padding * 0.35)}px ${Math.round(s.padding * 0.4)}px`,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {item}
            </div>
          ))}
        </div>

        {/* 本体 */}
        <div
          style={{
            flex: 1,
            background: s.backgroundBase,
            padding: `${Math.round(s.outerMargin * 0.4)}px`,
            display: "flex",
            minWidth: 0,
          }}
        >
          <div
            style={{
              flex: 1,
              background: s.panel,
              borderRadius: s.cornerRadius,
              border: s.stroke ? `${s.stroke.width}px solid ${s.stroke.color}` : "none",
              padding: `${s.padding}px`,
              display: "flex",
              flexDirection: "column",
              gap: `${s.gap}px`,
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: `${Math.min(s.headerSize, 26)}px`,
                fontWeight: s.headerWeight,
                color: s.accent,
                textAlign: "center",
              }}
            >
              UI Blueprint
            </div>

            {rows.map((row) => (
              <div
                key={row}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: `${Math.round(s.listGap * 0.8)}px`,
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: s.cornerRadius,
                  padding: `${Math.round(s.padding * 0.35)}px ${Math.round(s.padding * 0.5)}px`,
                  minWidth: 0,
                }}
              >
                <div style={{ width: "20px", height: "20px", borderRadius: "5px", background: s.accent, flex: "none", opacity: 0.85 }} />
                <div style={{ flex: 1, fontSize: `${Math.max(9, Math.round(s.bodySize * 0.8))}px`, color: "#e8e6f0", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {row}
                </div>
                <div style={{ fontSize: `${Math.max(8, Math.round(s.bodySize * 0.7))}px`, color: s.growth, flex: "none" }}>+0.03 →</div>
              </div>
            ))}

            <div style={{ marginTop: "auto", display: "flex", gap: `${s.gap}px` }}>
              {s.actionButtons.slice(0, 3).map((label) => (
                <div
                  key={label}
                  onMouseEnter={() => setHovered(true)}
                  onMouseLeave={() => setHovered(false)}
                  style={{
                    flex: 1,
                    background: s.accent,
                    color: "#000",
                    borderRadius: s.cornerRadius,
                    textAlign: "center",
                    fontSize: `${Math.min(s.buttonSize, 18)}px`,
                    fontWeight: s.buttonWeight,
                    padding: `${Math.round(s.padding * 0.45)}px`,
                    transform: hovered ? `scale(${s.hoverScale})` : "scale(1)",
                    transition: "transform 0.12s",
                    cursor: "default",
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 適用されている値 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "12px" }}>
        {[
          { label: `Panel ${s.panel}`, swatch: s.panel },
          { label: `Accent ${s.accent}`, swatch: s.accent },
          { label: `Growth ${s.growth}`, swatch: s.growth },
          { label: `角丸 ${s.cornerRadius}` },
          { label: `余白 ${s.padding} / 間隔 ${s.gap}` },
          { label: `サイドバー ${s.sidebarWidth}` },
          { label: `見出し ${s.headerSize} / 本文 ${s.bodySize}` },
          { label: s.isGradient ? "背景 グラデーション" : "背景 単色" },
        ].map((chip) => (
          <span
            key={chip.label}
            style={{
              fontSize: "11px",
              fontFamily: "ui-monospace, monospace",
              background: "#fff",
              border: `1px solid ${theme.surfaceBorder}`,
              borderRadius: "5px",
              padding: "3px 8px",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            {chip.swatch && (
              <span style={{ width: "9px", height: "9px", borderRadius: "2px", background: chip.swatch, border: "1px solid rgba(0,0,0,0.15)", display: "inline-block" }} />
            )}
            {chip.label}
          </span>
        ))}
      </div>
    </div>
  );
}
