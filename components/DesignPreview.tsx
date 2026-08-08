"use client";

import { useEffect, useRef, useState } from "react";
import type { DSLBlueprint } from "@/lib/dsl/schema";
import { resolveStyle } from "@/lib/dsl/style";
import { theme } from "@/theme";

type DesignPreviewProps = { dsl: DSLBlueprint | undefined };

/**
 * DSLのピクセル値は、この幅の画面を前提にしている（Screen.BaseResolution）。
 * プレビューはこれより狭いので、実寸で描くと角丸や余白が実機より大きく見える。
 */
const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;

/**
 * 生成されたDSLの値だけを使って、UIの見た目を近似表示する。
 *
 * 目的は「配色と余白のバランスが破綻していないか」を実装前に確認することであり、
 * Roblox の描画を厳密に再現するものではない。フォントとスケーリング挙動は
 * ブラウザのものになるため、その旨を画面上に明記している。
 */
export default function DesignPreview({ dsl }: DesignPreviewProps) {
  const [hovered, setHovered] = useState(false);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0);

  // 表示幅に合わせた縮小率を測る。1920x1080 の舞台を丸ごと縮めることで、
  // 角丸・余白・文字サイズの比率が実機と一致する。
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / BASE_WIDTH);
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  if (!dsl) return null;

  const s = resolveStyle(dsl);
  const rows = ["Blackhole Core", "Vacuum Nozzle", "Capacity Tank"];

  return (
    <div style={{ marginTop: "40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
        <h2 style={{ fontSize: "22px", margin: 0 }}>プレビュー</h2>
        <span style={{ fontSize: "12px", color: "#666" }}>
          1920×1080を基準に縮小表示しています。フォントは実機と異なります。
        </span>
      </div>

      <div
        ref={frameRef}
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: `${BASE_WIDTH} / ${BASE_HEIGHT}`,
          borderRadius: "8px",
          overflow: "hidden",
          border: `1px solid ${theme.surfaceBorder}`,
          background: s.backgroundBase,
        }}
      >
      <div
        style={{
          display: "flex",
          width: `${BASE_WIDTH}px`,
          height: `${BASE_HEIGHT}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          visibility: scale > 0 ? "visible" : "hidden",
        }}
      >
        {/* サイドバー */}
        <div
          style={{
            width: s.sidebarWidth,
            background: s.sidebar,
            padding: `${s.padding}px ${Math.round(s.padding * 0.7)}px`,
            display: "flex",
            flexDirection: "column",
            gap: `${s.gap}px`,
          }}
        >
          {s.sidebarItems.map((item, index) => (
            <div
              key={item}
              style={{
                fontSize: `${s.bodySize}px`,
                fontWeight: 600,
                color: index === 0 ? s.selectedText : s.sidebarTextMuted,
                background: index === 0 ? s.selected : "transparent",
                borderRadius: s.cornerRadius,
                padding: `${Math.round(s.padding * 0.6)}px ${Math.round(s.padding * 0.7)}px`,
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
            background: s.background,
            padding: `${s.outerMargin}px`,
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
                fontSize: `${s.headerSize}px`,
                fontWeight: s.headerWeight,
                color: s.accent,
                textAlign: "center",
                marginBottom: `${Math.round(s.gap * 0.5)}px`,
              }}
            >
              UI Blueprint
            </div>

            {rows.map((row, index) => (
              <div
                key={row}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: `${s.listGap}px`,
                  background: index === 0 ? s.selected : s.surface,
                  borderRadius: s.cornerRadius,
                  padding: `${Math.round(s.padding * 0.7)}px ${s.padding}px`,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    width: `${Math.round(s.bodySize * 2.2)}px`,
                    height: `${Math.round(s.bodySize * 2.2)}px`,
                    borderRadius: s.cornerRadius,
                    background: s.accent,
                    flex: "none",
                    opacity: 0.85,
                  }}
                />
                <div style={{ flex: 1, fontSize: `${s.bodySize}px`, color: index === 0 ? s.selectedText : s.panelText, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {row}
                </div>
                <div style={{ fontSize: `${s.bodySize}px`, color: index === 0 ? s.selectedText : s.growth, flex: "none" }}>+0.03 →</div>
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
                    color: s.accentText,
                    borderRadius: s.cornerRadius,
                    textAlign: "center",
                    fontSize: `${s.buttonSize}px`,
                    fontWeight: s.buttonWeight,
                    padding: `${Math.round(s.padding * 0.9)}px`,
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
      </div>

      {/* 適用されている値 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "12px" }}>
        {[
          { label: `Background ${s.isGradient ? `${s.gradientFrom} → ${s.gradientTo}` : s.backgroundBase}`, swatch: s.backgroundBase },
          { label: `Sidebar ${s.sidebar}`, swatch: s.sidebar },
          { label: `Panel ${s.panel}`, swatch: s.panel },
          { label: `Surface ${s.surface}`, swatch: s.surface },
          { label: `Selected ${s.selected}`, swatch: s.selected },
          { label: `Text ${s.panelText}${s.textFromDsl ? "" : "（導出）"}`, swatch: s.panelText },
          { label: `Accent ${s.accent}`, swatch: s.accent },
          { label: `Growth ${s.growth}`, swatch: s.growth },
          { label: `角丸 ${s.cornerRadius}` },
          { label: `余白 ${s.padding} / 間隔 ${s.gap}` },
          { label: `サイドバー ${s.sidebarWidth}` },
          { label: `見出し ${s.headerSize} / 本文 ${s.bodySize}` },
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
