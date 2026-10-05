import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { ResumeData, ExperienceEntry } from "@/lib/types";
import { extraSections } from "@/lib/types";
import { pdfFonts } from "@/lib/pdf-fonts";
import { ExtraSectionsPdf } from "@/components/ResumePdfDocument";

/**
 * PDF versions of the Ribbon, Split, Scholar, Fresher, Grid and Spotlight
 * templates. They mirror components/templates/NewPreviews.tsx.
 */

const INK = "#1b2a4a";
const MUTED = "#5b6472";
const RULE = "#d8d2c3";

type Colors = { seal: string; sealSoft: string };

const flags = (r: ResumeData) => ({
  showDividers: r.customization?.showDividers ?? true,
  indent: r.customization?.indentBullets ?? true,
  photo: r.customization?.showPhoto ? r.customization?.photoDataUrl : undefined,
});

const contactItems = (r: ResumeData) =>
  [r.contact.email, r.contact.phone, r.contact.location, r.contact.linkedin, r.contact.website].filter(Boolean) as string[];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "YN";

const base = (r: ResumeData) => {
  const f = pdfFonts(r);
  return { f, page: { padding: 36, fontSize: 10, fontFamily: f.body, color: INK } };
};

function Jobs({
  resume,
  indent,
  stacked = false,
  seal,
}: {
  resume: ResumeData;
  indent: boolean;
  stacked?: boolean;
  seal: string;
}) {
  return (
    <>
      {resume.experience.map((e: ExperienceEntry) => (
        <View key={e.id} wrap={false} style={{ marginTop: 6 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 10.5, fontWeight: 700, maxWidth: "75%" }}>
              {e.role}
              {!stacked && e.company ? <Text style={{ fontWeight: 400, color: MUTED }}>{`  ·  ${e.company}`}</Text> : null}
            </Text>
            <Text style={{ fontSize: 8.5, color: MUTED }}>
              {e.startDate} – {e.endDate}
            </Text>
          </View>
          {stacked && e.company ? <Text style={{ fontSize: 9, color: MUTED }}>{e.company}</Text> : null}
          {e.bullets.filter(Boolean).map((b, i) => (
            <Text key={i} style={{ marginLeft: indent ? 10 : 0, marginTop: 2, lineHeight: 1.35, fontSize: 9.5 }}>
              <Text style={{ color: seal }}>• </Text>
              {b}
            </Text>
          ))}
        </View>
      ))}
    </>
  );
}

function EduRows({ resume, schoolFirst = false }: { resume: ResumeData; schoolFirst?: boolean }) {
  return (
    <>
      {resume.education.map((e) => (
        <View key={e.id} style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
          <Text style={{ fontSize: 10, maxWidth: "75%" }}>
            <Text style={{ fontWeight: 700 }}>{schoolFirst ? e.school : e.degree}</Text>
            {(schoolFirst ? e.degree : e.school) ? ` — ${schoolFirst ? e.degree : e.school}` : ""}
          </Text>
          <Text style={{ fontSize: 8.5, color: MUTED }}>
            {e.startDate} – {e.endDate}
          </Text>
        </View>
      ))}
    </>
  );
}

// ---------- Ribbon ----------

export function RibbonPdf({ resume, seal }: { resume: ResumeData } & Colors) {
  const { f, page } = base(resume);
  const { indent, photo } = flags(resume);
  const s = StyleSheet.create({
    page,
    label: {
      alignSelf: "flex-start",
      backgroundColor: seal,
      color: "#ffffff",
      fontSize: 8.5,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 1,
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 9,
      marginTop: 14,
      marginBottom: 5,
    },
  });
  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 5, height: 46, backgroundColor: seal, borderRadius: 3 }} />
          {photo && <Image src={photo} style={{ width: 52, height: 52, borderRadius: 26 }} />}
          <View>
            <Text style={{ fontFamily: f.display, fontSize: 22, fontWeight: 700 }}>{resume.contact.fullName || "Your Name"}</Text>
            <Text style={{ fontSize: 8.5, color: MUTED, marginTop: 2 }}>{contactItems(resume).join("  ·  ")}</Text>
          </View>
        </View>
        {resume.summary ? (
          <>
            <Text style={s.label}>Profile</Text>
            <Text style={{ lineHeight: 1.4 }}>{resume.summary}</Text>
          </>
        ) : null}
        {resume.experience.length > 0 && (
          <>
            <Text style={s.label}>Experience</Text>
            <Jobs resume={resume} indent={indent} seal={seal} />
          </>
        )}
        {resume.education.length > 0 && (
          <>
            <Text style={s.label}>Education</Text>
            <EduRows resume={resume} />
          </>
        )}
        {resume.skills.length > 0 && (
          <>
            <Text style={s.label}>Skills</Text>
            <Text>{resume.skills.join("  ·  ")}</Text>
          </>
        )}
        <ExtraSectionsPdf resume={resume} titleStyle={s.label} />
      </Page>
    </Document>
  );
}

// ---------- Split ----------

export function SplitPdf({ resume, seal, sealSoft }: { resume: ResumeData } & Colors) {
  const { f } = base(resume);
  const { indent, photo, showDividers } = flags(resume);
  const s = StyleSheet.create({
    mainTitle: {
      fontSize: 9,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 1.2,
      color: seal,
      marginTop: 12,
      marginBottom: 3,
      paddingBottom: 2,
      ...(showDividers ? { borderBottom: `1 solid ${RULE}` } : {}),
    },
    sideTitle: { fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, color: seal, marginTop: 12, marginBottom: 4 },
    small: { fontSize: 8.5, marginBottom: 2, lineHeight: 1.3 },
  });
  return (
    <Document>
      <Page size="LETTER" style={{ fontSize: 10, fontFamily: f.body, color: INK }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 28, paddingTop: 28, paddingBottom: 12, borderBottom: `4 solid ${seal}` }}>
          {photo && <Image src={photo} style={{ width: 50, height: 50, borderRadius: 25 }} />}
          <Text style={{ fontFamily: f.display, fontSize: 22, fontWeight: 700 }}>{resume.contact.fullName || "Your Name"}</Text>
        </View>
        <View style={{ flexDirection: "row", flexGrow: 1 }}>
          <View style={{ width: "64%", paddingHorizontal: 28, paddingBottom: 24 }}>
            {resume.summary ? (
              <>
                <Text style={s.mainTitle}>Summary</Text>
                <Text style={{ lineHeight: 1.4, fontSize: 9.5 }}>{resume.summary}</Text>
              </>
            ) : null}
            {resume.experience.length > 0 && (
              <>
                <Text style={s.mainTitle}>Experience</Text>
                <Jobs resume={resume} indent={indent} stacked seal={seal} />
              </>
            )}
            <ExtraSectionsPdf resume={resume} titleStyle={s.mainTitle} only={["projects", "achievements"]} />
          </View>
          <View style={{ width: "36%", backgroundColor: sealSoft, paddingHorizontal: 16, paddingBottom: 24 }}>
            <Text style={s.sideTitle}>Contact</Text>
            {contactItems(resume).map((c) => (
              <Text key={c} style={s.small}>{c}</Text>
            ))}
            {resume.skills.length > 0 && (
              <>
                <Text style={s.sideTitle}>Skills</Text>
                {resume.skills.map((k) => (
                  <Text key={k} style={s.small}>{k}</Text>
                ))}
              </>
            )}
            {resume.education.length > 0 && (
              <>
                <Text style={s.sideTitle}>Education</Text>
                {resume.education.map((e) => (
                  <View key={e.id} style={{ marginBottom: 5 }}>
                    <Text style={{ fontSize: 8.5, fontWeight: 700 }}>{e.degree}</Text>
                    <Text style={{ fontSize: 8.5, color: MUTED }}>{e.school}</Text>
                    <Text style={{ fontSize: 7.5, color: MUTED }}>{e.startDate} – {e.endDate}</Text>
                  </View>
                ))}
              </>
            )}
            <ExtraSectionsPdf resume={resume} titleStyle={s.sideTitle} only={["certifications", "languages"]} />
          </View>
        </View>
      </Page>
    </Document>
  );
}

// ---------- Scholar ----------

export function ScholarPdf({ resume, seal }: { resume: ResumeData } & Colors) {
  const { f, page } = base(resume);
  const { indent } = flags(resume);
  const s = StyleSheet.create({
    page,
    title: {
      fontSize: 8.5,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 2,
      color: seal,
      textAlign: "center",
      marginTop: 14,
      marginBottom: 5,
      paddingBottom: 3,
      borderBottom: `0.75 solid ${RULE}`,
    },
  });
  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <Text style={{ fontFamily: f.display, fontSize: 22, textAlign: "center", letterSpacing: 0.5 }}>
          {resume.contact.fullName || "Your Name"}
        </Text>
        <Text style={{ fontSize: 8.5, color: MUTED, textAlign: "center", marginTop: 4 }}>{contactItems(resume).join("  |  ")}</Text>
        {resume.summary ? (
          <>
            <Text style={s.title}>Profile</Text>
            <Text style={{ lineHeight: 1.4, textAlign: "center" }}>{resume.summary}</Text>
          </>
        ) : null}
        {resume.education.length > 0 && (
          <>
            <Text style={s.title}>Education</Text>
            <EduRows resume={resume} schoolFirst />
          </>
        )}
        {resume.experience.length > 0 && (
          <>
            <Text style={s.title}>Experience</Text>
            <Jobs resume={resume} indent={indent} seal={seal} />
          </>
        )}
        <ExtraSectionsPdf resume={resume} titleStyle={s.title} only={["projects", "certifications", "achievements"]} />
        {resume.skills.length > 0 && (
          <>
            <Text style={s.title}>Skills</Text>
            <Text style={{ textAlign: "center" }}>{resume.skills.join("  ·  ")}</Text>
          </>
        )}
        <ExtraSectionsPdf resume={resume} titleStyle={s.title} only={["languages"]} align="center" />
      </Page>
    </Document>
  );
}

// ---------- Fresher ----------

export function FresherPdf({ resume, seal, sealSoft }: { resume: ResumeData } & Colors) {
  const { f, page } = base(resume);
  const { indent, photo, showDividers } = flags(resume);
  const s = StyleSheet.create({
    page,
    title: {
      fontSize: 9.5,
      fontWeight: 700,
      textTransform: "uppercase",
      color: seal,
      marginTop: 12,
      marginBottom: 4,
      paddingBottom: 2,
      ...(showDividers ? { borderBottom: `1.5 solid ${sealSoft}` } : {}),
    },
  });
  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingBottom: 8, borderBottom: `2 solid ${seal}` }}>
          {photo && <Image src={photo} style={{ width: 50, height: 50, borderRadius: 25 }} />}
          <View>
            <Text style={{ fontFamily: f.display, fontSize: 19, fontWeight: 700 }}>{resume.contact.fullName || "Your Name"}</Text>
            <Text style={{ fontSize: 8.5, color: MUTED, marginTop: 2 }}>{contactItems(resume).join("  •  ")}</Text>
          </View>
        </View>
        {resume.summary ? (
          <>
            <Text style={s.title}>Career objective</Text>
            <Text style={{ lineHeight: 1.4 }}>{resume.summary}</Text>
          </>
        ) : null}
        {resume.education.length > 0 && (
          <>
            <Text style={s.title}>Education</Text>
            <EduRows resume={resume} />
          </>
        )}
        <ExtraSectionsPdf resume={resume} titleStyle={s.title} only={["projects"]} />
        {resume.skills.length > 0 && (
          <>
            <Text style={s.title}>Skills</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
              {resume.skills.map((k) => (
                <Text key={k} style={{ fontSize: 8.5, backgroundColor: sealSoft, paddingVertical: 2, paddingHorizontal: 5, borderRadius: 3 }}>
                  {k}
                </Text>
              ))}
            </View>
          </>
        )}
        {resume.experience.length > 0 && (
          <>
            <Text style={s.title}>Internships & experience</Text>
            <Jobs resume={resume} indent={indent} seal={seal} />
          </>
        )}
        <ExtraSectionsPdf resume={resume} titleStyle={s.title} only={["certifications", "achievements", "languages"]} />
      </Page>
    </Document>
  );
}

// ---------- Grid ----------

const gridLabel = (seal: string) => ({ width: 82, fontSize: 8, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 1.2, color: seal, paddingTop: 1 });

function GridRow({ title, seal, children }: { title: string; seal: string; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", gap: 14, borderTop: `0.75 solid ${RULE}`, paddingTop: 7, marginTop: 9 }}>
      <Text style={gridLabel(seal)}>{title}</Text>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

export function GridPdf({ resume, seal }: { resume: ResumeData } & Colors) {
  const { f, page } = base(resume);
  const { indent, photo } = flags(resume);
  const extras = extraSections(resume);
  const label = gridLabel(seal);
  return (
    <Document>
      <Page size="LETTER" style={page}>
        <View style={{ flexDirection: "row", gap: 14, alignItems: "flex-end" }}>
          <View style={{ width: 82 }}>
            {photo ? <Image src={photo} style={{ width: 60, height: 60, borderRadius: 3 }} /> : <View style={{ width: 28, height: 3, backgroundColor: seal, marginBottom: 8 }} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: f.display, fontSize: 22, fontWeight: 700 }}>{resume.contact.fullName || "Your Name"}</Text>
            <Text style={{ fontSize: 8.5, color: MUTED, marginTop: 2 }}>{contactItems(resume).join("    ")}</Text>
          </View>
        </View>
        {resume.summary ? (
          <GridRow seal={seal} title="Profile">
            <Text style={{ lineHeight: 1.4 }}>{resume.summary}</Text>
          </GridRow>
        ) : null}
        {resume.experience.length > 0 && (
          <GridRow seal={seal} title="Experience">
            <View style={{ marginTop: -6 }}>
              <Jobs resume={resume} indent={indent} stacked seal={seal} />
            </View>
          </GridRow>
        )}
        {resume.education.length > 0 && (
          <GridRow seal={seal} title="Education">
            {resume.education.map((e) => (
              <View key={e.id} style={{ marginBottom: 4 }}>
                <Text style={{ fontWeight: 700 }}>{e.degree}</Text>
                <Text style={{ fontSize: 8.5, color: MUTED }}>
                  {e.school} · {e.startDate} – {e.endDate}
                </Text>
              </View>
            ))}
          </GridRow>
        )}
        {resume.skills.length > 0 && (
          <GridRow seal={seal} title="Skills">
            <Text>{resume.skills.join(", ")}</Text>
          </GridRow>
        )}
        {(["projects", "certifications", "achievements", "languages"] as const).map((k) =>
          extras[k].length > 0 ? (
            <GridRow key={k} seal={seal} title={k[0].toUpperCase() + k.slice(1)}>
              <ExtraSectionsPdf resume={resume} titleStyle={label} only={[k]} hideTitle />
            </GridRow>
          ) : null
        )}
      </Page>
    </Document>
  );
}

// ---------- Spotlight ----------

function SpotTitle({ seal, children }: { seal: string; children: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 14, marginBottom: 4 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: seal }} />
      <Text style={{ fontSize: 10.5, fontWeight: 700 }}>{children}</Text>
    </View>
  );
}

export function SpotlightPdf({ resume, seal, sealSoft }: { resume: ResumeData } & Colors) {
  const { f, page } = base(resume);
  const { indent, photo } = flags(resume);
  const s = StyleSheet.create({
    page: { ...page, padding: 30 },
    title: { fontSize: 10.5, fontWeight: 700, marginTop: 14, marginBottom: 4, color: INK },
  });
  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <View style={{ backgroundColor: sealSoft, borderRadius: 10, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
          {photo ? (
            <Image src={photo} style={{ width: 56, height: 56, borderRadius: 28 }} />
          ) : (
            <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: seal, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: "#ffffff", fontFamily: f.display, fontSize: 15, fontWeight: 700 }}>{initials(resume.contact.fullName)}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: f.display, fontSize: 19, fontWeight: 700 }}>{resume.contact.fullName || "Your Name"}</Text>
            <Text style={{ fontSize: 8.5, color: MUTED, marginTop: 3 }}>{contactItems(resume).join("  ·  ")}</Text>
          </View>
        </View>
        {resume.summary ? (
          <Text style={{ marginTop: 12, borderLeft: `3 solid ${seal}`, paddingLeft: 9, lineHeight: 1.45, fontSize: 10.5 }}>{resume.summary}</Text>
        ) : null}
        {resume.experience.length > 0 && (
          <>
            <SpotTitle seal={seal}>Experience</SpotTitle>
            <Jobs resume={resume} indent={indent} seal={seal} />
          </>
        )}
        {resume.education.length > 0 && (
          <>
            <SpotTitle seal={seal}>Education</SpotTitle>
            <EduRows resume={resume} />
          </>
        )}
        {resume.skills.length > 0 && (
          <>
            <SpotTitle seal={seal}>Skills</SpotTitle>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
              {resume.skills.map((k) => (
                <Text key={k} style={{ fontSize: 8.5, color: seal, border: `0.75 solid ${seal}`, borderRadius: 8, paddingVertical: 2, paddingHorizontal: 6 }}>
                  {k}
                </Text>
              ))}
            </View>
          </>
        )}
        <ExtraSectionsPdf resume={resume} titleStyle={s.title} />
      </Page>
    </Document>
  );
}
