import { hasRich, parseRich } from "@/lib/rich-text";

/** Text with the B / I / U formatting from the builder, for the live preview. */
export function Rich({ t }: { t: string }) {
  if (!hasRich(t)) return <>{t}</>;
  return (
    <>
      {parseRich(t).map((s, i) => {
        let n: React.ReactNode = s.text;
        if (s.u) n = <u>{n}</u>;
        if (s.i) n = <em>{n}</em>;
        if (s.b) n = <strong style={{ fontWeight: 700 }}>{n}</strong>;
        return <span key={i}>{n}</span>;
      })}
    </>
  );
}
