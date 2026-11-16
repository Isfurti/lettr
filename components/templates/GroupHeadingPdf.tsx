import { Text } from "@react-pdf/renderer";
import type { ExperienceEntry } from "@/lib/types";

/** Heading above the first job of a group. It sits inside the job's own block, so it can never be left alone at the bottom of a page. */
export function GroupHeadingPdf({ exp }: { exp: ExperienceEntry }) {
  if (!exp.groupHeading) return null;
  return <Text style={{ fontSize: 8, fontWeight: 700, color: "#5b6472", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 2, marginTop: 2 }}>{exp.groupHeading}</Text>;
}
