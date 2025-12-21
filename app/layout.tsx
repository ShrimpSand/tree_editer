import type { Metadata } from "next";
import { Roboto_Mono, Source_Code_Pro } from "next/font/google";
import "./globals.css";

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code-pro",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Tree Editor - シンプルなツリー構造エディタ",
  description: "タブでインデントを作成してツリー構造を編集できるシンプルなエディタ。テキストとビジュアルの2つのモードで直感的に操作できます。",
  openGraph: {
    title: "Tree Editor",
    description: "タブでインデントを作成してツリー構造を編集できるシンプルなエディタ",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Tree Editor",
    description: "タブでインデントを作成してツリー構造を編集できるシンプルなエディタ",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${robotoMono.variable} ${sourceCodePro.variable} antialiased`}
        style={{ fontFamily: 'var(--font-roboto-mono), var(--font-source-code-pro), Consolas, Monaco, "Courier New", monospace' }}
      >
        {children}
      </body>
    </html>
  );
}
