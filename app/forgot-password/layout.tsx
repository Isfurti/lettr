import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset your password | Lettr",
  description: "Get a link to reset your Lettr password.",
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
