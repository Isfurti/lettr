import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create a free account | Lettr",
  description: "Create a free Lettr account to download your resume and unlock AI writing.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
