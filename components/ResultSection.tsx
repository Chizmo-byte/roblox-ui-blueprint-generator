"use client";

import type { DSLBlueprint } from "@/lib/dsl/schema";
import DesignPreview from "@/components/DesignPreview";
import DSLViewer from "@/components/DSLViewer";
import { theme } from "@/theme";

type ResultSectionProps = { dsl: DSLBlueprint | undefined; loading: boolean };

const cardStyle = {
  padding: "28px",
  background: theme.surface,
  borderRadius: "12px",
  border: `1px solid ${theme.surfaceBorder}`,
  color: theme.surfaceText,
} as const;

export default function ResultSection({ dsl, loading }: ResultSectionProps) {
  if (loading) return <div style={cardStyle}><h2>生成中…</h2></div>;
  if (!dsl) return null;

  return (
    <div style={cardStyle}>
      <h2>生成結果</h2>
      <DesignPreview dsl={dsl} />
      <DSLViewer dsl={dsl} />
    </div>
  );
}
