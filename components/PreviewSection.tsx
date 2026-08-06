"use client";

import { theme } from "@/theme";

type PreviewSectionProps = { preview: string | null };

export default function PreviewSection({ preview }: PreviewSectionProps) {
  if (!preview) return null;
  return <div style={{ marginTop: "20px", padding: "20px", background: theme.panel, borderRadius: "12px", border: `1px solid ${theme.border}`, color: theme.text }}><p style={{ marginBottom: "12px", fontSize: "18px" }}>プレビュー</p><img src={preview} alt="アップロードしたUIのプレビュー" style={{ width: "300px", borderRadius: "8px", border: `2px solid ${theme.accentPositive}` }} /></div>;
}
