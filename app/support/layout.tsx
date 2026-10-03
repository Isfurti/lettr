import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact support | Lettr",
  description: "Questions, bugs or billing help - send the Lettr team a message.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
