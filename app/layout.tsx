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
  title: "UI Blueprint Generator",
  description:
    "参考UI画像から Roblox の UI 設計データ（DSL）と Luau コードを生成するツール。",
  applicationName: "UI Blueprint Generator",
  openGraph: {
    title: "UI Blueprint Generator",
    description:
      "参考UI画像から Roblox の UI 設計データ（DSL）と Luau コードを生成するツール。",
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
