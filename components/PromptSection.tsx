"use client";

type PromptSectionProps = { userPrompt: string; onChange: (value: string) => void };

export default function PromptSection({ userPrompt, onChange }: PromptSectionProps) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <label htmlFor="user-prompt" style={{ marginRight: "10px" }}>追加の指示</label>
      <textarea id="user-prompt" value={userPrompt} onChange={(event) => onChange(event.target.value)} placeholder="例：丸みのあるボタン、余白は広め、明るい配色にしたい" style={{ width: "100%", height: "120px", padding: "12px", borderRadius: "8px", fontSize: "16px", border: "1px solid #ccc" }} />
    </div>
  );
}
