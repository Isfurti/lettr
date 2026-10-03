import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resume builder | Lettr",
  description: "Build an ATS-friendly resume with live preview, job matching and AI writing.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
