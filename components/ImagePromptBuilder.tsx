"use client";

import { useMemo, useState } from "react";
import { UI_PARTS, DEFAULT_PART_IDS, buildImagePrompt } from "@/lib/image/promptBuilder";
import { theme } from "@/theme";

/**
 * 参考画像を持っていない利用者のために、画像生成AI用のプロンプトを組み立てる。
 * API を呼ばずブラウザ内で完結するため、何度でも自由に試せる。
 */
export default function ImagePromptBuilder() {
  const [open, setOpen] = useState(false);
  const [concept, setConcept] = useState("");
  const [partIds, setPartIds] = useState<string[]>(DEFAULT_PART_IDS);
  const [copied, setCopied] = useState(false);

  const prompt = useMemo(() => buildImagePrompt(concept, partIds), [concept, partIds]);

  const toggle = (id: string) => {
    setPartIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  };

  const copy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div style={{ background: theme.panel, borderRadius: "12px", border: `1px solid ${theme.border}`, color: theme.text, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          color: theme.text,
          padding: "20px",
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          fontSize: "18px",
        }}
      >
        <span style={{ color: theme.accentPositive, fontSize: "14px" }}>{open ? "▼" : "▶"}</span>
        <span>参考にする画像がない場合</span>
        <span style={{ fontSize: "13px", color: "#9b96ad", fontWeight: "normal" }}>
          画像生成AI用のプロンプトを作ります
        </span>
      </button>

      {open && (
        <div style={{ padding: "0 20px 20px" }}>
          <p style={{ fontSize: "13px", color: "#9b96ad", lineHeight: 1.7, marginBottom: "20px" }}>
            作りたい画面のイメージと必要な部品を選ぶと、画像生成AIに貼り付けられる指示文ができます。
            出来上がった画像をこのあとアップロードしてください。
            <br />
            すでに参考画像をお持ちの方は、この項目は使わなくて構いません。
          </p>

          {/* 1. イメージ */}
          <div style={{ marginBottom: "20px" }}>
            <label htmlFor="concept" style={{ display: "block", fontSize: "15px", marginBottom: "6px" }}>
              <span style={{ color: theme.accentPositive, marginRight: "8px" }}>1.</span>
              どんな画面を作りたいですか？
            </label>
            <textarea
              id="concept"
              value={concept}
              onChange={(event) => setConcept(event.target.value)}
              placeholder="例：宇宙・ブラックホールをテーマにした暗い配色のショップ画面。金色をアクセントに使いたい。"
              style={{
                width: "100%",
                height: "80px",
                padding: "12px",
                borderRadius: "8px",
                fontSize: "14px",
                border: `1px solid ${theme.border}`,
                background: "#15131f",
                color: theme.text,
                resize: "vertical",
              }}
            />
            <p style={{ fontSize: "12px", color: "#7d7890", marginTop: "6px" }}>
              空欄でも作れます。英語で書くと画像生成AIの精度が上がりますが、日本語でも構いません。
            </p>
          </div>

          {/* 2. 部品 */}
          <div style={{ marginBottom: "20px" }}>
            <p style={{ fontSize: "15px", marginBottom: "10px" }}>
              <span style={{ color: theme.accentPositive, marginRight: "8px" }}>2.</span>
              画面に必要な部品を選んでください
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "8px" }}>
              {UI_PARTS.map((part) => {
                const checked = partIds.includes(part.id);
                return (
                  <label
                    key={part.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      background: checked ? "#241f38" : "#15131f",
                      border: `1px solid ${checked ? theme.accentPositive : theme.border}`,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(part.id)}
                      style={{ marginTop: "3px", accentColor: theme.accentPositive, cursor: "pointer" }}
                    />
                    <span>
                      <span style={{ fontSize: "14px", display: "block" }}>{part.label}</span>
                      <span style={{ fontSize: "12px", color: "#8b86a0" }}>{part.hint}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 3. 結果 */}
          <div>
            <p style={{ fontSize: "15px", marginBottom: "10px" }}>
              <span style={{ color: theme.accentPositive, marginRight: "8px" }}>3.</span>
              この文章を画像生成AIに貼り付けてください
            </p>
            <textarea
              readOnly
              value={prompt}
              style={{
                width: "100%",
                height: "220px",
                padding: "12px",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontFamily: "ui-monospace, monospace",
                lineHeight: 1.6,
                border: `1px solid ${theme.border}`,
                background: "#0f0d18",
                color: "#c9c4d8",
                resize: "vertical",
              }}
            />
            <button
              type="button"
              onClick={copy}
              style={{
                marginTop: "10px",
                padding: "10px 18px",
                background: theme.accentPositive,
                color: "#000",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              {copied ? "コピーしました" : "プロンプトをコピー"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
