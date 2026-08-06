"use client";

import { useRef } from "react";
import { theme } from "@/theme";

type UploadSectionProps = { onFileSelect: (file: File | null) => void };

export default function UploadSection({ onFileSelect }: UploadSectionProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  return (
    <div style={{ border: `2px dashed ${theme.border}`, padding: "24px", borderRadius: "12px", textAlign: "center", background: theme.panel, color: theme.text }}>
      <p style={{ marginBottom: "12px", fontSize: "18px" }}>UIの参考画像をアップロードしてください</p>
      <button type="button" onClick={() => inputRef.current?.click()} style={{ padding: "12px 24px", background: theme.accentPositive, color: "#000", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: "600", border: "none" }}>画像を選択</button>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg" onChange={(event) => onFileSelect(event.target.files?.[0] || null)} style={{ display: "none" }} />
    </div>
  );
}
