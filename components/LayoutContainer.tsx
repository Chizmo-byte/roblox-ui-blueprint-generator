"use client";

import { theme } from "@/theme";

export default function LayoutContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "40px",
        background: theme.background,   // ダークコズミック背景
        color: theme.text,              // 基本文字色
        minHeight: "100vh",
        fontFamily: "sans-serif",
      }}
    >
      {children}
    </div>
  );
}
