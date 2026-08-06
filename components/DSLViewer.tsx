"use client";

import type { DSLBlueprint } from "@/lib/dsl/schema";
import { theme } from "@/theme";

type DSLViewerProps = { dsl: DSLBlueprint | undefined };

export default function DSLViewer({ dsl }: DSLViewerProps) {
  if (!dsl) return null;
  const content = JSON.stringify(dsl, null, 2);
  const download = () => {
    const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "dsl.json";
    link.click();
    URL.revokeObjectURL(url);
  };
  return <div style={{ marginTop: "40px" }}><h2 style={{ marginBottom: "12px", fontSize: "22px" }}>DSL（UI設計データ）</h2><pre style={{ background: "#111", color: "#0f0", padding: "20px", borderRadius: "8px", overflowX: "auto", fontSize: "14px", lineHeight: "1.5" }}>{content}</pre><div style={{ display: "flex", gap: "12px", marginTop: "16px" }}><button type="button" onClick={() => navigator.clipboard.writeText(content)} style={{ padding: "10px 16px", background: theme.accentPositive, color: "#000", borderRadius: "8px", cursor: "pointer", border: "none" }}>DSLをコピー</button><button type="button" onClick={download} style={{ padding: "10px 16px", background: theme.accentPositive, color: "#000", borderRadius: "8px", cursor: "pointer", border: "none" }}>DSLをダウンロード</button></div></div>;
}
