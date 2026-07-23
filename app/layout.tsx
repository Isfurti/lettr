import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lettr — resumes that get past the filter",
  description: "AI-assisted resume builder with ATS scoring and tailored cover letters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-paper text-ink font-sans">{children}</body>
    </html>
  );
}
