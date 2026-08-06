"use client";

import type { DSLBlueprint } from "@/lib/dsl/schema";
import DSLViewer from "@/components/DSLViewer";
import RobloxCodeViewer from "@/components/RobloxCodeViewer";
import { theme } from "@/theme";

type ResultSectionProps = { dsl: DSLBlueprint | undefined; robloxCode: string | null; loading: boolean };

export default function ResultSection({ dsl, robloxCode, loading }: ResultSectionProps) {
  if (loading) return <div style={{ padding: "28px", background: theme.surface, borderRadius: "12px", border: `1px solid ${theme.surfaceBorder}` }}><h2>生成中…</h2></div>;
  if (!dsl && !robloxCode) return null;
  return <div style={{ padding: "28px", background: theme.surface, borderRadius: "12px", border: `1px solid ${theme.surfaceBorder}` }}><h2>生成結果</h2><DSLViewer dsl={dsl} /><RobloxCodeViewer robloxCode={robloxCode} /></div>;
}
