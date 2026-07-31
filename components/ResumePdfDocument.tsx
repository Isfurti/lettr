import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { ResumeData } from "@/lib/types";
import { DEFAULT_ACCENT_COLOR, darkenHex, softenHex } from "@/lib/customization";

const INK = "#1b2a4a";
const MUTED = "#5b6472";
const PAPER = "#faf7f0";

function contactLine(resume: ResumeData): string {
  return [resume.contact.email, resume.contact.phone, resume.contact.location, resume.contact.linkedin, resume.contact.website]
    .filter(Boolean)
    .join("  •  ");
}

function layoutFlags(resume: ResumeData) {
  return {
    showDividers: resume.customization?.showDividers ?? true,
    indent: resume.customization?.indentBullets ?? true,
    photo: resume.customization?.showPhoto ? resume.customization?.photoDataUrl : undefined,
  };
}

export function ResumePdfDocument({ resume, template = "classic" }: { resume: ResumeData; template?: string }) {
  const seal = resume.customization?.accentColor || DEFAULT_ACCENT_COLOR;
  const sealSoft = softenHex(seal);
  const sealDeep = darkenHex(seal);

  switch (template) {
    case "modern":
      return <ModernPdf resume={resume} seal={seal} sealSoft={sealSoft} />;
    case "bold":
      return <BoldPdf resume={resume} seal={seal} />;
    case "sidebar":
      return <SidebarPdf resume={resume} seal={seal} />;
    case "minimal":
      return <MinimalPdf resume={resume} />;
    case "executive":
      return <ExecutivePdf resume={resume} seal={seal} />;
    case "technical":
      return <TechnicalPdf resume={resume} seal={seal} sealSoft={sealSoft} sealDeep={sealDeep} />;
    case "timeline":
      return <TimelinePdf resume={resume} seal={seal} />;
    case "elegant":
      return <ElegantPdf resume={resume} seal={seal} />;
    default:
      return <ClassicPdf resume={resume} seal={seal} dense={template === "compact"} />;
  }
}

// ---------- Standard / Compact ----------

function ClassicPdf({ resume, seal, dense }: { resume: ResumeData; seal: string; dense: boolean }) {
  const { showDividers, indent, photo } = layoutFlags(resume);
  const s = StyleSheet.create({
    page: { padding: dense ? 28 : 36, fontSize: dense ? 9 : 10, fontFamily: "Helvetica" },
    headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    photo: { width: 56, height: 56, borderRadius: 28 },
    name: { fontSize: 20, fontWeight: 700, marginBottom: 2, color: INK },
    contactLine: { fontSize: 9, color: MUTED, marginBottom: 12 },
    sectionTitle: {
      fontSize: 11, fontWeight: 700, marginTop: 12, marginBottom: 4,
      ...(showDividers ? { borderBottom: `1 solid ${INK}` } : {}),
      paddingBottom: 2, textTransform: "uppercase", color: seal,
    },
    summary: { marginBottom: 4, lineHeight: 1.4 },
    entryHeader: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
    entryTitle: { fontSize: 10.5, fontWeight: 700 },
    entryMeta: { fontSize: 9, color: MUTED },
    bullet: { marginLeft: indent ? 10 : 0, marginTop: 2, lineHeight: 1.35 },
  });
  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <View style={s.headerRow}>
          {photo && <Image src={photo} style={s.photo} />}
          <View>
            <Text style={s.name}>{resume.contact.fullName || "Your Name"}</Text>
            <Text style={s.contactLine}>{contactLine(resume)}</Text>
          </View>
        </View>
        {resume.summary ? (<><Text style={s.sectionTitle}>Summary</Text><Text style={s.summary}>{resume.summary}</Text></>) : null}
        {resume.experience.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Experience</Text>
            {resume.experience.map((exp) => (
              <View key={exp.id} wrap={false}>
                <View style={s.entryHeader}>
                  <Text style={s.entryTitle}>{exp.role} — {exp.company}</Text>
                  <Text style={s.entryMeta}>{exp.startDate} – {exp.endDate}</Text>
                </View>
                {exp.bullets.map((b, i) => <Text key={i} style={s.bullet}>• {b}</Text>)}
              </View>
            ))}
          </>
        )}
        {resume.education.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Education</Text>
            {resume.education.map((edu) => (
              <View key={edu.id} style={s.entryHeader}>
                <Text style={s.entryTitle}>{edu.degree} — {edu.school}</Text>
                <Text style={s.entryMeta}>{edu.startDate} – {edu.endDate}</Text>
              </View>
            ))}
          </>
        )}
        {resume.skills.length > 0 && (<><Text style={s.sectionTitle}>Skills</Text><Text>{resume.skills.join(" • ")}</Text></>)}
      </Page>
    </Document>
  );
}

// ---------- Modern ----------

function ModernPdf({ resume, seal, sealSoft }: { resume: ResumeData; seal: string; sealSoft: string }) {
  const { showDividers, indent, photo } = layoutFlags(resume);
  const s = StyleSheet.create({
    page: { fontSize: 10, fontFamily: "Helvetica" },
    header: { backgroundColor: INK, color: PAPER, padding: 24, flexDirection: "row", alignItems: "center", gap: 14 },
    photo: { width: 56, height: 56, borderRadius: 28 },
    name: { fontSize: 20, fontWeight: 700 },
    contactLine: { fontSize: 9, marginTop: 4, opacity: 0.85 },
    body: { padding: 24 },
    sectionTitle: {
      fontSize: 10, fontWeight: 700, marginTop: 10, marginBottom: 5, textTransform: "uppercase",
      color: seal, ...(showDividers ? { borderLeft: `2 solid ${seal}`, paddingLeft: 6 } : {}),
    },
    entryHeader: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
    entryTitle: { fontSize: 10.5, fontWeight: 700 },
    entryCompany: { fontSize: 9, color: MUTED, marginBottom: 2 },
    entryMeta: { fontSize: 9, color: MUTED },
    bullet: { marginLeft: indent ? 10 : 0, marginTop: 2, lineHeight: 1.35 },
    chipsRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 2 },
    chip: { fontSize: 8.5, backgroundColor: sealSoft, color: seal, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 8, marginRight: 4, marginBottom: 4 },
  });
  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <View style={s.header}>
          {photo && <Image src={photo} style={s.photo} />}
          <View>
            <Text style={s.name}>{resume.contact.fullName || "Your Name"}</Text>
            <Text style={s.contactLine}>{contactLine(resume)}</Text>
          </View>
        </View>
        <View style={s.body}>
          {resume.summary ? (<><Text style={s.sectionTitle}>Summary</Text><Text>{resume.summary}</Text></>) : null}
          {resume.experience.length > 0 && (
            <>
              <Text style={s.sectionTitle}>Experience</Text>
              {resume.experience.map((exp) => (
                <View key={exp.id} wrap={false}>
                  <View style={s.entryHeader}>
                    <Text style={s.entryTitle}>{exp.role}</Text>
                    <Text style={s.entryMeta}>{exp.startDate} – {exp.endDate}</Text>
                  </View>
                  <Text style={s.entryCompany}>{exp.company}</Text>
                  {exp.bullets.map((b, i) => <Text key={i} style={s.bullet}>— {b}</Text>)}
                </View>
              ))}
            </>
          )}
          {resume.education.length > 0 && (
            <>
              <Text style={s.sectionTitle}>Education</Text>
              {resume.education.map((edu) => (
                <View key={edu.id} style={s.entryHeader}>
                  <Text style={s.entryTitle}>{edu.degree} — {edu.school}</Text>
                  <Text style={s.entryMeta}>{edu.startDate} – {edu.endDate}</Text>
                </View>
              ))}
            </>
          )}
          {resume.skills.length > 0 && (
            <>
              <Text style={s.sectionTitle}>Skills</Text>
              <View style={s.chipsRow}>{resume.skills.map((skill) => <Text key={skill} style={s.chip}>{skill}</Text>)}</View>
            </>
          )}
        </View>
      </Page>
    </Document>
  );
}

// ---------- Bold ----------

function BoldPdf({ resume, seal }: { resume: ResumeData; seal: string }) {
  const { showDividers, indent, photo } = layoutFlags(resume);
  const s = StyleSheet.create({
    page: { padding: 36, fontSize: 10, fontFamily: "Helvetica" },
    headerRow: { flexDirection: "row", alignItems: "center", gap: 14 },
    photo: { width: 64, height: 64, borderRadius: 32 },
    name: { fontSize: 26, fontWeight: 700, textTransform: "uppercase", color: INK },
    rule: { height: 3, backgroundColor: seal, width: 60, marginTop: 6, marginBottom: 6 },
    contactLine: { fontSize: 9, color: MUTED, marginBottom: 8 },
    sectionTitle: showDividers
      ? {
          fontSize: 10, fontWeight: 700, marginTop: 12, marginBottom: 6, textTransform: "uppercase",
          color: PAPER, backgroundColor: INK, alignSelf: "flex-start", paddingVertical: 3, paddingHorizontal: 6,
        }
      : { fontSize: 10, fontWeight: 700, marginTop: 12, marginBottom: 6, textTransform: "uppercase", color: INK },
    entryHeader: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
    entryTitle: { fontSize: 10.5, fontWeight: 700, textTransform: "uppercase" },
    entryMeta: { fontSize: 9, color: MUTED },
    bullet: { marginLeft: indent ? 10 : 0, marginTop: 2, lineHeight: 1.35 },
  });
  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <View style={s.headerRow}>
          {photo && <Image src={photo} style={s.photo} />}
          <View>
            <Text style={s.name}>{resume.contact.fullName || "Your Name"}</Text>
            <View style={s.rule} />
            <Text style={s.contactLine}>{contactLine(resume)}</Text>
          </View>
        </View>
        {resume.summary ? (<><Text style={s.sectionTitle}>Summary</Text><Text>{resume.summary}</Text></>) : null}
        {resume.experience.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Experience</Text>
            {resume.experience.map((exp) => (
              <View key={exp.id} wrap={false}>
                <View style={s.entryHeader}>
                  <Text style={s.entryTitle}>{exp.role} — {exp.company}</Text>
                  <Text style={s.entryMeta}>{exp.startDate} – {exp.endDate}</Text>
                </View>
                {exp.bullets.map((b, i) => <Text key={i} style={s.bullet}>▸ {b}</Text>)}
              </View>
            ))}
          </>
        )}
        {resume.education.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Education</Text>
            {resume.education.map((edu) => (
              <View key={edu.id} style={s.entryHeader}>
                <Text style={s.entryTitle}>{edu.degree} — {edu.school}</Text>
                <Text style={s.entryMeta}>{edu.startDate} – {edu.endDate}</Text>
              </View>
            ))}
          </>
        )}
        {resume.skills.length > 0 && (<><Text style={s.sectionTitle}>Skills</Text><Text style={{ fontWeight: 700 }}>{resume.skills.join("  /  ")}</Text></>)}
      </Page>
    </Document>
  );
}

// ---------- Sidebar ----------

function SidebarPdf({ resume, seal }: { resume: ResumeData; seal: string }) {
  const { showDividers, indent, photo } = layoutFlags(resume);
  const s = StyleSheet.create({
    page: { fontSize: 10, fontFamily: "Helvetica", flexDirection: "row" },
    sidebar: { width: "34%", backgroundColor: seal, color: "#ffffff", padding: 18 },
    main: { width: "66%", padding: 20 },
    photo: { width: 64, height: 64, borderRadius: 32, marginBottom: 10 },
    name: { fontSize: 16, fontWeight: 700, marginBottom: 8 },
    contactLine: { fontSize: 8.5, marginBottom: 3, opacity: 0.95 },
    sideSection: showDividers ? { marginTop: 14, borderTop: "1 solid rgba(255,255,255,0.3)", paddingTop: 10 } : { marginTop: 14 },
    sideHeading: { fontSize: 8, fontWeight: 700, textTransform: "uppercase", marginBottom: 5, opacity: 0.85 },
    sideSkill: { fontSize: 8.5, backgroundColor: "rgba(255,255,255,0.18)", padding: 3, borderRadius: 3, marginBottom: 3 },
    eduName: { fontSize: 8.5, fontWeight: 700 },
    eduSchool: { fontSize: 8, opacity: 0.85, marginBottom: 6 },
    sectionTitle: { fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: seal, marginTop: 10, marginBottom: 5 },
    entryHeader: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
    entryTitle: { fontSize: 10, fontWeight: 700 },
    entryMeta: { fontSize: 8.5, color: MUTED },
    entryCompany: { fontSize: 8.5, color: MUTED, marginBottom: 2 },
    bullet: { marginLeft: indent ? 8 : 0, marginTop: 2, fontSize: 9.5, lineHeight: 1.35 },
  });
  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <View style={s.sidebar}>
          {photo && <Image src={photo} style={s.photo} />}
          <Text style={s.name}>{resume.contact.fullName || "Your Name"}</Text>
          {[resume.contact.email, resume.contact.phone, resume.contact.location, resume.contact.linkedin, resume.contact.website]
            .filter(Boolean)
            .map((line, i) => <Text key={i} style={s.contactLine}>{line}</Text>)}
          {resume.skills.length > 0 && (
            <View style={s.sideSection}>
              <Text style={s.sideHeading}>Skills</Text>
              {resume.skills.map((skill) => <Text key={skill} style={s.sideSkill}>{skill}</Text>)}
            </View>
          )}
          {resume.education.length > 0 && (
            <View style={s.sideSection}>
              <Text style={s.sideHeading}>Education</Text>
              {resume.education.map((edu) => (
                <View key={edu.id}>
                  <Text style={s.eduName}>{edu.degree}</Text>
                  <Text style={s.eduSchool}>{edu.school}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={s.main}>
          {resume.summary ? (<><Text style={s.sectionTitle}>Summary</Text><Text style={{ fontSize: 9.5, lineHeight: 1.4 }}>{resume.summary}</Text></>) : null}
          {resume.experience.length > 0 && (
            <>
              <Text style={s.sectionTitle}>Experience</Text>
              {resume.experience.map((exp) => (
                <View key={exp.id} wrap={false}>
                  <View style={s.entryHeader}>
                    <Text style={s.entryTitle}>{exp.role}</Text>
                    <Text style={s.entryMeta}>{exp.startDate} – {exp.endDate}</Text>
                  </View>
                  <Text style={s.entryCompany}>{exp.company}</Text>
                  {exp.bullets.map((b, i) => <Text key={i} style={s.bullet}>• {b}</Text>)}
                </View>
              ))}
            </>
          )}
        </View>
      </Page>
    </Document>
  );
}

// ---------- Minimal ----------

function MinimalPdf({ resume }: { resume: ResumeData }) {
  const { showDividers, indent, photo } = layoutFlags(resume);
  const s = StyleSheet.create({
    page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#000000" },
    headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    photo: { width: 44, height: 44, borderRadius: 22 },
    name: { fontSize: 18, fontWeight: 700 },
    contactLine: { fontSize: 9, marginBottom: 10 },
    sectionTitle: {
      fontSize: 9, fontWeight: 700, textTransform: "uppercase", marginTop: 12, marginBottom: 3,
      ...(showDividers ? { borderBottom: "1 solid #000000", paddingBottom: 1 } : {}),
    },
    entryTitle: { fontSize: 9.5, fontWeight: 700 },
    entryMeta: { fontSize: 9 },
    bullet: { fontSize: 9.5, marginTop: 1, marginLeft: indent ? 8 : 0 },
  });
  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <View style={s.headerRow}>
          {photo && <Image src={photo} style={s.photo} />}
          <View>
            <Text style={s.name}>{resume.contact.fullName || "Your Name"}</Text>
            <Text style={s.contactLine}>{contactLine(resume)}</Text>
          </View>
        </View>
        {resume.summary ? (<><Text style={s.sectionTitle}>Summary</Text><Text style={{ fontSize: 9.5, lineHeight: 1.35 }}>{resume.summary}</Text></>) : null}
        {resume.experience.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Experience</Text>
            {resume.experience.map((exp) => (
              <View key={exp.id} wrap={false} style={{ marginTop: 4 }}>
                <Text style={s.entryTitle}>{exp.role}, {exp.company}</Text>
                <Text style={s.entryMeta}>{exp.startDate} - {exp.endDate}</Text>
                {exp.bullets.map((b, i) => <Text key={i} style={s.bullet}>- {b}</Text>)}
              </View>
            ))}
          </>
        )}
        {resume.education.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Education</Text>
            {resume.education.map((edu) => (
              <Text key={edu.id} style={{ fontSize: 9.5 }}>{edu.degree}, {edu.school} ({edu.startDate} - {edu.endDate})</Text>
            ))}
          </>
        )}
        {resume.skills.length > 0 && (<><Text style={s.sectionTitle}>Skills</Text><Text style={{ fontSize: 9.5 }}>{resume.skills.join(", ")}</Text></>)}
      </Page>
    </Document>
  );
}

// ---------- Executive ----------

function ExecutivePdf({ resume, seal }: { resume: ResumeData; seal: string }) {
  const { showDividers, indent, photo } = layoutFlags(resume);
  const s = StyleSheet.create({
    page: { padding: 44, fontSize: 10, fontFamily: "Helvetica", textAlign: "center" },
    photo: { width: 60, height: 60, borderRadius: 30, marginHorizontal: "auto", marginBottom: 10 },
    name: { fontSize: 22, marginBottom: 4 },
    rule: { height: 1, backgroundColor: seal, width: 80, marginHorizontal: "auto", marginVertical: 8 },
    contactLine: { fontSize: 9, color: MUTED, marginBottom: 16 },
    summary: { fontSize: 9.5, lineHeight: 1.5, marginBottom: 16, marginHorizontal: 40 },
    sectionTitle: { fontSize: 9, textTransform: "uppercase", letterSpacing: 2, color: seal, marginTop: 10, marginBottom: 8 },
    entryTitle: { fontSize: 10.5, fontWeight: 700 },
    entryMeta: { fontSize: 8.5, color: MUTED, marginBottom: 4 },
    bullet: { fontSize: 9.5, textAlign: "left", marginHorizontal: 60, lineHeight: 1.35, marginLeft: indent ? 60 : 40 },
  });
  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        {photo && <Image src={photo} style={s.photo} />}
        <Text style={s.name}>{resume.contact.fullName || "Your Name"}</Text>
        {showDividers && <View style={s.rule} />}
        <Text style={s.contactLine}>{contactLine(resume)}</Text>
        {resume.summary ? <Text style={s.summary}>{resume.summary}</Text> : null}
        {resume.experience.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Experience</Text>
            {resume.experience.map((exp) => (
              <View key={exp.id} wrap={false} style={{ marginBottom: 8 }}>
                <Text style={s.entryTitle}>{exp.role}</Text>
                <Text style={s.entryMeta}>{exp.company} · {exp.startDate} – {exp.endDate}</Text>
                {exp.bullets.map((b, i) => <Text key={i} style={s.bullet}>— {b}</Text>)}
              </View>
            ))}
          </>
        )}
        {resume.education.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Education</Text>
            {resume.education.map((edu) => <Text key={edu.id} style={{ fontSize: 9.5 }}>{edu.degree} — {edu.school}</Text>)}
          </>
        )}
        {resume.skills.length > 0 && <Text style={{ fontSize: 9.5, color: MUTED, marginTop: 12 }}>{resume.skills.join(" · ")}</Text>}
      </Page>
    </Document>
  );
}

// ---------- Technical ----------

function TechnicalPdf({ resume, seal, sealSoft, sealDeep }: { resume: ResumeData; seal: string; sealSoft: string; sealDeep: string }) {
  const { showDividers, indent, photo } = layoutFlags(resume);
  const s = StyleSheet.create({
    page: { padding: 32, fontSize: 10, fontFamily: "Courier" },
    headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    photo: { width: 48, height: 48, borderRadius: 4 },
    name: { fontSize: 16, fontWeight: 700 },
    contactLine: { fontSize: 8.5, color: seal, marginBottom: 10 },
    sectionTitle: { fontSize: 9, color: MUTED, marginTop: 10, marginBottom: 4 },
    entryTitle: { fontSize: 9.5, fontWeight: 700 },
    entryMeta: { fontSize: 8, color: MUTED, marginBottom: 2 },
    bullet: { fontSize: 9, marginLeft: indent ? 8 : 0, marginTop: 1 },
    chip: { fontSize: 8, backgroundColor: sealSoft, color: sealDeep, padding: 3, borderRadius: 2, marginRight: 4, marginBottom: 4 },
    chipsRow: { flexDirection: "row", flexWrap: "wrap" },
  });
  const entryStyle = showDividers
    ? { marginTop: 6, borderLeft: `2 solid ${seal}`, paddingLeft: 6 }
    : { marginTop: 6 };
  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <View style={s.headerRow}>
          {photo && <Image src={photo} style={s.photo} />}
          <View>
            <Text style={s.name}>{resume.contact.fullName || "Your Name"}</Text>
            <Text style={s.contactLine}>{contactLine(resume)}</Text>
          </View>
        </View>
        {resume.summary ? (<><Text style={s.sectionTitle}>// summary</Text><Text style={{ fontSize: 9.5, fontFamily: "Helvetica", lineHeight: 1.35 }}>{resume.summary}</Text></>) : null}
        {resume.experience.length > 0 && (
          <>
            <Text style={s.sectionTitle}>// experience</Text>
            {resume.experience.map((exp) => (
              <View key={exp.id} wrap={false} style={entryStyle}>
                <Text style={s.entryTitle}>{exp.role}() @ {exp.company}</Text>
                <Text style={s.entryMeta}>{exp.startDate} – {exp.endDate}</Text>
                {exp.bullets.map((b, i) => <Text key={i} style={{ ...s.bullet, fontFamily: "Helvetica" }}>&gt; {b}</Text>)}
              </View>
            ))}
          </>
        )}
        {resume.education.length > 0 && (
          <>
            <Text style={s.sectionTitle}>// education</Text>
            {resume.education.map((edu) => <Text key={edu.id} style={{ fontSize: 9.5, fontFamily: "Helvetica" }}>{edu.degree} — {edu.school}</Text>)}
          </>
        )}
        {resume.skills.length > 0 && (
          <>
            <Text style={s.sectionTitle}>// stack</Text>
            <View style={s.chipsRow}>{resume.skills.map((skill) => <Text key={skill} style={s.chip}>{skill}</Text>)}</View>
          </>
        )}
      </Page>
    </Document>
  );
}

// ---------- Timeline ----------

function TimelinePdf({ resume, seal }: { resume: ResumeData; seal: string }) {
  const { showDividers, indent, photo } = layoutFlags(resume);
  const s = StyleSheet.create({
    page: { padding: 36, fontSize: 10, fontFamily: "Helvetica" },
    headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    photo: { width: 56, height: 56, borderRadius: 28 },
    name: { fontSize: 18, fontWeight: 700 },
    contactLine: { fontSize: 9, color: MUTED, marginBottom: 10 },
    sectionTitle: { fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: seal, marginTop: 10, marginBottom: 6 },
    entryWrap: { flexDirection: "row", marginBottom: 8 },
    dotCol: { width: 14, alignItems: "center" },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: seal, marginTop: 3 },
    line: { width: 1, backgroundColor: "#dcd5c4", flexGrow: 1, marginTop: 2 },
    entryBody: { flex: 1 },
    entryHeader: { flexDirection: "row", justifyContent: "space-between" },
    entryTitle: { fontSize: 10, fontWeight: 700 },
    entryMeta: { fontSize: 8.5, color: MUTED },
    bullet: { fontSize: 9.5, marginLeft: indent ? 6 : 0, marginTop: 1 },
  });
  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <View style={s.headerRow}>
          {photo && <Image src={photo} style={s.photo} />}
          <View>
            <Text style={s.name}>{resume.contact.fullName || "Your Name"}</Text>
            <Text style={s.contactLine}>{contactLine(resume)}</Text>
          </View>
        </View>
        {resume.summary ? <Text style={{ fontSize: 9.5, lineHeight: 1.4, marginBottom: 8 }}>{resume.summary}</Text> : null}
        {resume.experience.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Experience</Text>
            {resume.experience.map((exp, idx) => (
              <View key={exp.id} style={s.entryWrap} wrap={false}>
                <View style={s.dotCol}>
                  <View style={s.dot} />
                  {showDividers && idx < resume.experience.length - 1 && <View style={s.line} />}
                </View>
                <View style={s.entryBody}>
                  <View style={s.entryHeader}>
                    <Text style={s.entryTitle}>{exp.role}</Text>
                    <Text style={s.entryMeta}>{exp.startDate} – {exp.endDate}</Text>
                  </View>
                  <Text style={s.entryMeta}>{exp.company}</Text>
                  {exp.bullets.map((b, i) => <Text key={i} style={s.bullet}>• {b}</Text>)}
                </View>
              </View>
            ))}
          </>
        )}
        {resume.education.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Education</Text>
            {resume.education.map((edu) => <Text key={edu.id} style={{ fontSize: 9.5 }}>{edu.degree} — {edu.school}</Text>)}
          </>
        )}
        {resume.skills.length > 0 && <Text style={{ fontSize: 9.5, color: MUTED, marginTop: 8 }}>{resume.skills.join(" • ")}</Text>}
      </Page>
    </Document>
  );
}

// ---------- Elegant ----------

function ElegantPdf({ resume, seal }: { resume: ResumeData; seal: string }) {
  const { showDividers, indent, photo } = layoutFlags(resume);
  const s = StyleSheet.create({
    page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
    headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    photo: { width: 52, height: 52, borderRadius: 26 },
    name: { fontSize: 18 },
    contactLine: {
      fontSize: 9, color: MUTED, marginBottom: 8, paddingBottom: 8,
      ...(showDividers ? { borderBottom: "1 solid #dcd5c4" } : {}),
    },
    sectionTitle: { fontSize: 8.5, textTransform: "uppercase", letterSpacing: 1.5, color: seal, marginTop: 12, marginBottom: 5 },
    entryHeader: { flexDirection: "row", justifyContent: "space-between" },
    entryTitle: { fontSize: 9.5, fontStyle: "italic" },
    entryMeta: { fontSize: 8.5, color: MUTED },
    bullet: { fontSize: 9.5, marginLeft: indent ? 6 : 0, marginTop: 1, lineHeight: 1.35 },
    entryBlock: showDividers
      ? { marginBottom: 6, paddingBottom: 6, borderBottom: "1 solid #ece6d8" }
      : { marginBottom: 6, paddingBottom: 6 },
  });
  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <View style={s.headerRow}>
          {photo && <Image src={photo} style={s.photo} />}
          <Text style={s.name}>{resume.contact.fullName || "Your Name"}</Text>
        </View>
        <Text style={s.contactLine}>{contactLine(resume)}</Text>
        {resume.summary ? <Text style={{ fontSize: 9.5, lineHeight: 1.4, marginBottom: 4 }}>{resume.summary}</Text> : null}
        {resume.experience.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Experience</Text>
            {resume.experience.map((exp) => (
              <View key={exp.id} wrap={false} style={s.entryBlock}>
                <View style={s.entryHeader}>
                  <Text style={s.entryTitle}>{exp.role}, {exp.company}</Text>
                  <Text style={s.entryMeta}>{exp.startDate} – {exp.endDate}</Text>
                </View>
                {exp.bullets.map((b, i) => <Text key={i} style={s.bullet}>· {b}</Text>)}
              </View>
            ))}
          </>
        )}
        {resume.education.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Education</Text>
            {resume.education.map((edu) => <Text key={edu.id} style={{ fontSize: 9.5, fontStyle: "italic" }}>{edu.degree}, {edu.school}</Text>)}
          </>
        )}
        {resume.skills.length > 0 && <Text style={{ fontSize: 9.5, color: MUTED, marginTop: 10 }}>{resume.skills.join("  ·  ")}</Text>}
      </Page>
    </Document>
  );
}
