import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Roblox UI Blueprint Generator",
  description:
    "参考UI画像から Roblox ゲーム用の UI 設計データ（DSL）を生成し、プレビューで確認できるツール。",
  applicationName: "Roblox UI Blueprint Generator",
  openGraph: {
    title: "Roblox UI Blueprint Generator",
    description:
      "参考UI画像から Roblox ゲーム用の UI 設計データ（DSL）を生成し、プレビューで確認できるツール。",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
