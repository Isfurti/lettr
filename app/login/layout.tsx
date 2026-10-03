import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in | Lettr",
  description: "Sign in to Lettr to edit your resumes, cover letters and job matches.",
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
