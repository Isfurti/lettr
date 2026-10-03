import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Choose a new password | Lettr",
  description: "Set a new password for your Lettr account.",
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
