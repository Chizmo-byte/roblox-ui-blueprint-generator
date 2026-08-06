"use client";

type RobloxCodeViewerProps = { robloxCode: string | null };

export default function RobloxCodeViewer({ robloxCode }: RobloxCodeViewerProps) {
  if (!robloxCode) return null;
  const download = () => {
    const url = URL.createObjectURL(new Blob([robloxCode], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "ui.lua";
    link.click();
    URL.revokeObjectURL(url);
  };
  return <div style={{ marginTop: "40px" }}><h2>Roblox UIコード（Luau）</h2><pre style={{ background: "#000", color: "#0ff", padding: "20px", borderRadius: "8px", overflowX: "auto", whiteSpace: "pre-wrap" }}>{robloxCode}</pre><div style={{ display: "flex", gap: "12px", marginTop: "16px" }}><button type="button" onClick={() => navigator.clipboard.writeText(robloxCode)} style={{ padding: "10px 16px", background: "#00AAFF", color: "white", borderRadius: "8px", cursor: "pointer", border: "none" }}>コードをコピー</button><button type="button" onClick={download} style={{ padding: "10px 16px", background: "#00AAFF", color: "white", borderRadius: "8px", cursor: "pointer", border: "none" }}>コードをダウンロード</button></div></div>;
}
