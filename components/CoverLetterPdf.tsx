import type { ReactElement } from "react";
import { Document, Page, Text, View, type DocumentProps } from "@react-pdf/renderer";
import type { ResumeData } from "@/lib/types";
import { contactParts } from "@/lib/contact";
import { darkenHex, resolveAccent, softenHex } from "@/lib/customization";
import { pageSize } from "@/lib/layout";
import { marketOf } from "@/lib/market";
import { letterPdfFonts } from "@/lib/pdf-fonts";
import {
  initials,
  letterDate,
  letterHeadline,
  letterParagraphs,
  type LetterTemplateId,
} from "@/lib/letter-templates";

const INK = "#041632";
const SLATE = "#4a5568";
const RULE = "#d8d2c3";

type Fonts = { display: string | string[]; body: string | string[] };

type Parts = {
  name: string;
  headline: string;
  contact: string[];
  date: string;
  recipient: string;
  paragraphs: string[];
  accent: string;
  soft: string;
  deep: string;
};

/**
 * A cover letter PDF in one of ten designs. The letter text already has its
 * greeting and sign-off (the AI writes them), so the designs only add the
 * header, the date and who it's for.
 */
export function CoverLetterPdf({
  resume,
  letter,
  design,
  company,
  now = new Date(),
}: {
  resume: ResumeData;
  letter: string;
  design: LetterTemplateId;
  company?: string;
  now?: Date;
}) {
  const accent = resolveAccent(resume.customization?.accentColor);
  const p: Parts = {
    name: resume.contact.fullName?.trim() || "Your Name",
    headline: letterHeadline(resume),
    contact: contactParts(resume.contact),
    date: letterDate(marketOf(resume.customization), now),
    recipient: company?.trim() ? `Hiring Team\n${company.trim()}` : "",
    paragraphs: letterParagraphs(letter),
    accent,
    soft: softenHex(accent),
    deep: darkenHex(accent),
  };
  return (
    <Document title={`${p.name} – Cover letter`} author={p.name}>
      <Page size={pageSize(resume.customization)} style={{ backgroundColor: "#ffffff" }}>
        <Design design={design} p={p} />
      </Page>
    </Document>
  ) as ReactElement<DocumentProps>;
}

function Design({ design, p }: { design: LetterTemplateId; p: Parts }) {
  switch (design) {
    case "modern":
      return <Modern p={p} />;
    case "minimal":
      return <Minimal p={p} />;
    case "bold":
      return <Bold p={p} />;
    case "elegant":
      return <Elegant p={p} />;
    case "executive":
      return <Executive p={p} />;
    case "sidebar":
      return <Sidebar p={p} />;
    case "editorial":
      return <Editorial p={p} />;
    case "monogram":
      return <Monogram p={p} />;
    case "corporate":
      return <Corporate p={p} />;
    default:
      return <Classic p={p} />;
  }
}

/* ---------- Shared pieces ---------- */

function Body({ p, f, size = 10.5, color = INK, gap = 10 }: { p: Parts; f: Fonts; size?: number; color?: string; gap?: number }) {
  return (
    <View>
      {p.paragraphs.map((para, i) => (
        <Text key={i} style={{ fontFamily: f.body, fontSize: size, lineHeight: 1.55, color, marginBottom: gap }}>
          {para}
        </Text>
      ))}
    </View>
  );
}

function DateAndRecipient({ p, f, align = "left", color = SLATE }: { p: Parts; f: Fonts; align?: "left" | "right"; color?: string }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ fontFamily: f.body, fontSize: 10, color, textAlign: align }}>{p.date}</Text>
      {p.recipient ? (
        <Text style={{ fontFamily: f.body, fontSize: 10, color: INK, marginTop: 10, lineHeight: 1.45 }}>{p.recipient}</Text>
      ) : null}
    </View>
  );
}

function ContactLine({ p, f, color = SLATE, align = "left", size = 9 }: { p: Parts; f: Fonts; color?: string; align?: "left" | "center" | "right"; size?: number }) {
  if (p.contact.length === 0) return null;
  return (
    <Text style={{ fontFamily: f.body, fontSize: size, color, textAlign: align, lineHeight: 1.4 }}>{p.contact.join("  ·  ")}</Text>
  );
}

/* ---------- 1. Classic (free) ---------- */

function Classic({ p }: { p: Parts }) {
  const f = letterPdfFonts("classic");
  return (
    <View style={{ paddingHorizontal: 64, paddingVertical: 56 }}>
      <Text style={{ fontFamily: f.display, fontSize: 24, color: INK, textAlign: "center" }}>{p.name}</Text>
      {p.headline ? <Text style={{ fontFamily: f.body, fontSize: 10.5, color: SLATE, textAlign: "center", marginTop: 4 }}>{p.headline}</Text> : null}
      <View style={{ marginTop: 6 }}>
        <ContactLine p={p} f={f} align="center" />
      </View>
      <View style={{ borderBottomWidth: 0.8, borderBottomColor: INK, marginTop: 14, marginBottom: 24 }} />
      <DateAndRecipient p={p} f={f} />
      <Body p={p} f={f} />
    </View>
  );
}

/* ---------- 2. Modern (free) ---------- */

function Modern({ p }: { p: Parts }) {
  const f = letterPdfFonts("sans");
  return (
    <View style={{ paddingHorizontal: 60, paddingVertical: 52 }}>
      <Text style={{ fontFamily: f.display, fontWeight: 700, fontSize: 26, color: p.accent }}>{p.name}</Text>
      {p.headline ? <Text style={{ fontFamily: f.body, fontSize: 11, color: INK, marginTop: 3 }}>{p.headline}</Text> : null}
      <View style={{ marginTop: 6 }}>
        <ContactLine p={p} f={f} />
      </View>
      <View style={{ width: 48, borderBottomWidth: 3, borderBottomColor: p.accent, marginTop: 14, marginBottom: 26 }} />
      <DateAndRecipient p={p} f={f} />
      <Body p={p} f={f} />
    </View>
  );
}

/* ---------- 3. Minimal ---------- */

function Minimal({ p }: { p: Parts }) {
  const f = letterPdfFonts("sans");
  return (
    <View style={{ paddingHorizontal: 78, paddingVertical: 72 }}>
      <Text style={{ fontFamily: f.display, fontSize: 13, letterSpacing: 3, color: INK }}>{p.name.toUpperCase()}</Text>
      <View style={{ marginTop: 6, marginBottom: 40 }}>
        <ContactLine p={p} f={f} color="#8a94a6" size={8.5} />
      </View>
      <DateAndRecipient p={p} f={f} color="#8a94a6" />
      <Body p={p} f={f} size={10} color="#1f2a3d" gap={12} />
    </View>
  );
}

/* ---------- 4. Bold ---------- */

function Bold({ p }: { p: Parts }) {
  const f = letterPdfFonts("sans");
  return (
    <View>
      <View style={{ backgroundColor: p.accent, paddingHorizontal: 60, paddingTop: 40, paddingBottom: 26 }}>
        <Text style={{ fontFamily: f.display, fontWeight: 700, fontSize: 28, color: "#ffffff" }}>{p.name}</Text>
        {p.headline ? <Text style={{ fontFamily: f.body, fontSize: 11, color: "#ffffff", marginTop: 4 }}>{p.headline}</Text> : null}
        <View style={{ marginTop: 8 }}>
          <ContactLine p={p} f={f} color="#ffffff" />
        </View>
      </View>
      <View style={{ paddingHorizontal: 60, paddingTop: 32, paddingBottom: 48 }}>
        <DateAndRecipient p={p} f={f} />
        <Body p={p} f={f} />
      </View>
    </View>
  );
}

/* ---------- 5. Elegant ---------- */

function Elegant({ p }: { p: Parts }) {
  const f = letterPdfFonts("display");
  return (
    <View style={{ paddingHorizontal: 66, paddingVertical: 56 }}>
      <Text style={{ fontFamily: f.display, fontSize: 28, color: INK, textAlign: "center" }}>{p.name}</Text>
      {p.headline ? (
        <Text style={{ fontFamily: f.body, fontSize: 9.5, letterSpacing: 2, color: p.deep, textAlign: "center", marginTop: 6 }}>
          {p.headline.toUpperCase()}
        </Text>
      ) : null}
      <View style={{ borderBottomWidth: 0.6, borderBottomColor: p.accent, marginTop: 14 }} />
      <View style={{ borderBottomWidth: 0.6, borderBottomColor: p.accent, marginTop: 2, marginBottom: 8 }} />
      <ContactLine p={p} f={f} align="center" />
      <View style={{ height: 26 }} />
      <DateAndRecipient p={p} f={f} />
      <Body p={p} f={f} />
    </View>
  );
}

/* ---------- 6. Executive ---------- */

function Executive({ p }: { p: Parts }) {
  const f = letterPdfFonts("classic");
  return (
    <View style={{ paddingHorizontal: 60, paddingVertical: 52 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
        <View style={{ flexShrink: 1, paddingRight: 16 }}>
          <Text style={{ fontFamily: f.display, fontSize: 26, color: INK }}>{p.name}</Text>
          {p.headline ? <Text style={{ fontFamily: f.body, fontSize: 10.5, color: p.deep, marginTop: 3 }}>{p.headline}</Text> : null}
        </View>
        <View style={{ maxWidth: 210 }}>
          {p.contact.map((c, i) => (
            <Text key={i} style={{ fontFamily: f.body, fontSize: 8.5, color: SLATE, textAlign: "right", lineHeight: 1.4 }}>
              {c}
            </Text>
          ))}
        </View>
      </View>
      <View style={{ borderBottomWidth: 3, borderBottomColor: INK, marginTop: 12, marginBottom: 26 }} />
      <DateAndRecipient p={p} f={f} />
      <Body p={p} f={f} />
    </View>
  );
}

/* ---------- 7. Sidebar ---------- */

function Sidebar({ p }: { p: Parts }) {
  const f = letterPdfFonts("sans");
  return (
    <View style={{ flexDirection: "row", minHeight: "100%" }}>
      <View style={{ width: 170, backgroundColor: p.accent, paddingHorizontal: 18, paddingTop: 52 }}>
        <Text style={{ fontFamily: f.display, fontWeight: 700, fontSize: 18, color: "#ffffff", lineHeight: 1.2 }}>{p.name}</Text>
        {p.headline ? <Text style={{ fontFamily: f.body, fontSize: 9.5, color: "#ffffff", marginTop: 6, lineHeight: 1.35 }}>{p.headline}</Text> : null}
        <View style={{ borderBottomWidth: 0.8, borderBottomColor: "#ffffff", marginVertical: 16, width: 30 }} />
        {p.contact.map((c, i) => (
          <Text key={i} style={{ fontFamily: f.body, fontSize: 8.5, color: "#ffffff", marginBottom: 6, lineHeight: 1.35 }}>
            {c}
          </Text>
        ))}
      </View>
      <View style={{ flex: 1, paddingHorizontal: 40, paddingTop: 52, paddingBottom: 48 }}>
        <DateAndRecipient p={p} f={f} />
        <Body p={p} f={f} />
      </View>
    </View>
  );
}

/* ---------- 8. Editorial ---------- */

function Editorial({ p }: { p: Parts }) {
  const f = letterPdfFonts("serif");
  return (
    <View style={{ paddingHorizontal: 62, paddingVertical: 54 }}>
      <Text style={{ fontFamily: f.display, fontSize: 32, color: INK, lineHeight: 1.05 }}>{p.name}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
        <View style={{ width: 28, borderBottomWidth: 2, borderBottomColor: p.accent, marginRight: 10 }} />
        {p.headline ? <Text style={{ fontFamily: f.body, fontSize: 10.5, color: p.deep }}>{p.headline}</Text> : null}
      </View>
      <View style={{ marginTop: 8 }}>
        <ContactLine p={p} f={f} />
      </View>
      <View style={{ borderBottomWidth: 0.6, borderBottomColor: RULE, marginTop: 16, marginBottom: 24 }} />
      <DateAndRecipient p={p} f={f} />
      <Body p={p} f={f} size={10.5} />
    </View>
  );
}

/* ---------- 9. Monogram ---------- */

function Monogram({ p }: { p: Parts }) {
  const f = letterPdfFonts("display");
  return (
    <View style={{ paddingHorizontal: 62, paddingVertical: 52 }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            width: 54,
            height: 54,
            borderRadius: 27,
            backgroundColor: p.soft,
            borderWidth: 1.5,
            borderColor: p.accent,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 16,
          }}
        >
          <Text style={{ fontFamily: f.display, fontSize: 20, color: p.deep }}>{initials(p.name)}</Text>
        </View>
        <View style={{ flexShrink: 1 }}>
          <Text style={{ fontFamily: f.display, fontSize: 22, color: INK }}>{p.name}</Text>
          {p.headline ? <Text style={{ fontFamily: f.body, fontSize: 10, color: SLATE, marginTop: 2 }}>{p.headline}</Text> : null}
        </View>
      </View>
      <View style={{ marginTop: 12 }}>
        <ContactLine p={p} f={f} />
      </View>
      <View style={{ borderBottomWidth: 0.6, borderBottomColor: p.accent, marginTop: 14, marginBottom: 24 }} />
      <DateAndRecipient p={p} f={f} />
      <Body p={p} f={f} />
    </View>
  );
}

/* ---------- 10. Corporate ---------- */

function Corporate({ p }: { p: Parts }) {
  const f = letterPdfFonts("sans");
  return (
    <View>
      <View style={{ height: 6, backgroundColor: p.accent }} />
      <View style={{ paddingHorizontal: 60, paddingTop: 40, paddingBottom: 48 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flexShrink: 1, paddingRight: 16 }}>
            <Text style={{ fontFamily: f.display, fontWeight: 700, fontSize: 22, color: INK }}>{p.name}</Text>
            {p.headline ? <Text style={{ fontFamily: f.body, fontSize: 10.5, color: p.deep, marginTop: 3 }}>{p.headline}</Text> : null}
          </View>
          <Text style={{ fontFamily: f.body, fontSize: 10, color: SLATE }}>{p.date}</Text>
        </View>
        <View style={{ marginTop: 6, marginBottom: 26 }}>
          <ContactLine p={p} f={f} />
        </View>
        {p.recipient ? (
          <Text style={{ fontFamily: f.body, fontSize: 10, color: INK, marginBottom: 18, lineHeight: 1.45 }}>{p.recipient}</Text>
        ) : null}
        <Body p={p} f={f} />
      </View>
    </View>
  );
}
