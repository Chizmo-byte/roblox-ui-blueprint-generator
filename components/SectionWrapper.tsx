"use client";

export default function SectionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "32px" }}>
      {children}
    </div>
  );
}
