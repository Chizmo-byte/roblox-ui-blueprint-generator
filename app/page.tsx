"use client";

import { useState } from "react";
import { generateRobloxUI } from "@/lib/roblox/transform";
import type { DSLBlueprint } from "@/lib/dsl/schema";
import PreviewSection from "@/components/PreviewSection";
import UploadSection from "@/components/UploadSection";
import PromptSection from "@/components/PromptSection";
import GenerateButton from "@/components/GenerateButton";
import ResultSection from "@/components/ResultSection";
import LayoutContainer from "@/components/LayoutContainer";
import SectionWrapper from "@/components/SectionWrapper";
import { theme } from "@/theme";

type GenerateResponse = { dsl: DSLBlueprint };

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [robloxCode, setRobloxCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("ja");
  const [userPrompt, setUserPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileSelect = (file: File | null) => {
    if (file && file.type !== "image/png" && file.type !== "image/jpeg") {
      setError("PNGまたはJPEG形式の画像を選択してください。");
      setSelectedFile(null);
      setPreview(null);
      return;
    }

    setSelectedFile(file);
    if (!file) {
      setPreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("language", language);
      formData.append("userPrompt", userPrompt);

      const response = await fetch("/api/generate", { method: "POST", body: formData });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        setError(errorBody?.error || "生成APIでエラーが発生しました。");
        return;
      }

      const json = (await response.json()) as GenerateResponse;
      if (!json.dsl) {
        setError("DSLが返されませんでした。");
        return;
      }

      setResult(json);
      setRobloxCode(generateRobloxUI(json.dsl));
      setSuccess("UI設計を生成しました。");
    } catch {
      setError("ネットワークエラーが発生しました。再度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LayoutContainer>
      <SectionWrapper>
        <h1 style={{ fontSize: "32px", marginBottom: "20px" }}>UI Blueprint Generator</h1>
      </SectionWrapper>

      <SectionWrapper>
        <label style={{ marginRight: "10px" }}>出力言語</label>
        <select value={language} onChange={(event) => setLanguage(event.target.value)} style={{ padding: "8px", borderRadius: "8px", background: theme.panel, color: theme.text, border: `1px solid ${theme.border}` }}>
          <option value="ja">日本語</option>
          <option value="en">English</option>
        </select>
      </SectionWrapper>

      <SectionWrapper><PromptSection userPrompt={userPrompt} onChange={setUserPrompt} /></SectionWrapper>
      <SectionWrapper>
        <div style={{ background: theme.panel, padding: "20px", borderRadius: "12px", border: `1px solid ${theme.border}`, color: theme.text }}>
          <p style={{ marginBottom: "12px", fontSize: "18px" }}>参考にするUI画像</p>
          <UploadSection onFileSelect={handleFileSelect} />
        </div>
      </SectionWrapper>
      <SectionWrapper><PreviewSection preview={preview} /></SectionWrapper>
      <SectionWrapper><GenerateButton onClick={handleUpload} disabled={!selectedFile || loading} loading={loading} /></SectionWrapper>

      {(error || success) && (
        <SectionWrapper>
          {error && <div style={{ background: theme.errorBg, color: theme.errorText, padding: "12px 16px", borderRadius: "8px", border: "1px solid #ffcccc", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{error}</div>}
          {success && <div style={{ background: theme.successBg, color: theme.successText, padding: "12px 16px", borderRadius: "8px", border: "1px solid #b3ffcc" }}>{success}</div>}
        </SectionWrapper>
      )}

      <SectionWrapper><ResultSection dsl={result?.dsl} robloxCode={robloxCode} loading={loading} /></SectionWrapper>
    </LayoutContainer>
  );
}
