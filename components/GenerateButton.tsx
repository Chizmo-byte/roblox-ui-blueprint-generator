"use client";

import { theme } from "@/theme";

type GenerateButtonProps = { onClick: () => void; disabled: boolean; loading: boolean };

export default function GenerateButton({ onClick, disabled, loading }: GenerateButtonProps) {
  return <button type="button" onClick={onClick} disabled={disabled} style={{ padding: "14px 28px", fontSize: "18px", fontWeight: "600", background: disabled ? "#8c8c8c" : theme.accentPositive, color: "#000", borderRadius: "10px", border: "none", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1 }}>{loading ? "生成中…" : "UI設計を生成"}</button>;
}
