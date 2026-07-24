import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ResumeData } from "@/lib/types";

const INK = "#1b2a4a";
const SEAL = "#b8912c";
const SEAL_SOFT = "#f1e6c8";
const MUTED = "#5b6472";

function contactLine(resume: ResumeData): string {
  return [resume.contact.email, resume.contact.phone, resume.contact.location, resume.contact.linkedin, resume.contact.website]
    .filter(Boolean)
    .join("  •  ");
}

export function ResumePdfDocument({ resume, template = "classic" }: { resume: ResumeData; template?: string }) {
  if (template === "modern") return <ModernPdf resume={resume} />;
  if (template === "bold") return <BoldPdf resume={resume} />;
  return <ClassicPdf resume={resume} dense={template === "compact"} />;
}

// ---------- Standard / Compact ----------

const classicStyles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica" },
  pageDense: { padding: 28, fontSize: 9, fontFamily: "Helvetica" },
  name: { fontSize: 20, fontWeight: 700, marginBottom: 2, color: INK },
  contactLine: { fontSize: 9, color: MUTED, marginBottom: 12 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginTop: 12,
    marginBottom: 4,
    borderBottom: `1 solid ${INK}`,
    paddingBottom: 2,
    textTransform: "uppercase",
    color: SEAL,
  },
  summary: { marginBottom: 4, lineHeight: 1.4 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  entryTitle: { fontSize: 10.5, fontWeight: 700 },
  entryMeta: { fontSize: 9, color: MUTED },
  bullet: { marginLeft: 10, marginTop: 2, lineHeight: 1.35 },
  skills: { marginTop: 2 },
});

function ClassicPdf({ resume, dense }: { resume: ResumeData; dense: boolean }) {
  const s = classicStyles;
  return (
    <Document>
      <Page size="LETTER" style={dense ? s.pageDense : s.page}>
        <Text style={s.name}>{resume.contact.fullName || "Your Name"}</Text>
        <Text style={s.contactLine}>{contactLine(resume)}</Text>

        {resume.summary ? (
          <>
            <Text style={s.sectionTitle}>Summary</Text>
            <Text style={s.summary}>{resume.summary}</Text>
          </>
        ) : null}

        {resume.experience.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Experience</Text>
            {resume.experience.map((exp) => (
              <View key={exp.id} wrap={false}>
                <View style={s.entryHeader}>
                  <Text style={s.entryTitle}>
                    {exp.role} — {exp.company}
                  </Text>
                  <Text style={s.entryMeta}>
                    {exp.startDate} – {exp.endDate}
                  </Text>
                </View>
                {exp.bullets.map((b, i) => (
                  <Text key={i} style={s.bullet}>
                    • {b}
                  </Text>
                ))}
              </View>
            ))}
          </>
        )}

        {resume.education.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Education</Text>
            {resume.education.map((edu) => (
              <View key={edu.id} style={s.entryHeader}>
                <Text style={s.entryTitle}>
                  {edu.degree} — {edu.school}
                </Text>
                <Text style={s.entryMeta}>
                  {edu.startDate} – {edu.endDate}
                </Text>
              </View>
            ))}
          </>
        )}

        {resume.skills.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Skills</Text>
            <Text style={s.skills}>{resume.skills.join(" • ")}</Text>
          </>
        )}
      </Page>
    </Document>
  );
}

// ---------- Modern ----------

const modernStyles = StyleSheet.create({
  page: { fontSize: 10, fontFamily: "Helvetica" },
  header: { backgroundColor: INK, color: "#faf7f0", padding: 24 },
  name: { fontSize: 20, fontWeight: 700 },
  contactLine: { fontSize: 9, marginTop: 4, opacity: 0.85 },
  body: { padding: 24 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginTop: 10,
    marginBottom: 5,
    textTransform: "uppercase",
    color: SEAL,
    borderLeft: `2 solid ${SEAL}`,
    paddingLeft: 6,
  },
  summary: { marginBottom: 4, lineHeight: 1.4 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  entryTitle: { fontSize: 10.5, fontWeight: 700 },
  entryCompany: { fontSize: 9, color: MUTED, marginBottom: 2 },
  entryMeta: { fontSize: 9, color: MUTED },
  bullet: { marginLeft: 10, marginTop: 2, lineHeight: 1.35 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 2 },
  chip: {
    fontSize: 8.5,
    backgroundColor: SEAL_SOFT,
    color: SEAL,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 4,
  },
});

function ModernPdf({ resume }: { resume: ResumeData }) {
  const s = modernStyles;
  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <View style={s.header}>
          <Text style={s.name}>{resume.contact.fullName || "Your Name"}</Text>
          <Text style={s.contactLine}>{contactLine(resume)}</Text>
        </View>
        <View style={s.body}>
          {resume.summary ? (
            <>
              <Text style={s.sectionTitle}>Summary</Text>
              <Text style={s.summary}>{resume.summary}</Text>
            </>
          ) : null}

          {resume.experience.length > 0 && (
            <>
              <Text style={s.sectionTitle}>Experience</Text>
              {resume.experience.map((exp) => (
                <View key={exp.id} wrap={false}>
                  <View style={s.entryHeader}>
                    <Text style={s.entryTitle}>{exp.role}</Text>
                    <Text style={s.entryMeta}>
                      {exp.startDate} – {exp.endDate}
                    </Text>
                  </View>
                  <Text style={s.entryCompany}>{exp.company}</Text>
                  {exp.bullets.map((b, i) => (
                    <Text key={i} style={s.bullet}>
                      — {b}
                    </Text>
                  ))}
                </View>
              ))}
            </>
          )}

          {resume.education.length > 0 && (
            <>
              <Text style={s.sectionTitle}>Education</Text>
              {resume.education.map((edu) => (
                <View key={edu.id} style={s.entryHeader}>
                  <Text style={s.entryTitle}>
                    {edu.degree} — {edu.school}
                  </Text>
                  <Text style={s.entryMeta}>
                    {edu.startDate} – {edu.endDate}
                  </Text>
                </View>
              ))}
            </>
          )}

          {resume.skills.length > 0 && (
            <>
              <Text style={s.sectionTitle}>Skills</Text>
              <View style={s.chipsRow}>
                {resume.skills.map((skill) => (
                  <Text key={skill} style={s.chip}>
                    {skill}
                  </Text>
                ))}
              </View>
            </>
          )}
        </View>
      </Page>
    </Document>
  );
}

// ---------- Bold ----------

const boldStyles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica" },
  name: { fontSize: 26, fontWeight: 700, textTransform: "uppercase", color: INK },
  rule: { height: 3, backgroundColor: SEAL, width: 60, marginTop: 6, marginBottom: 6 },
  contactLine: { fontSize: 9, color: MUTED, marginBottom: 8 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginTop: 12,
    marginBottom: 6,
    textTransform: "uppercase",
    color: "#faf7f0",
    backgroundColor: INK,
    alignSelf: "flex-start",
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  summary: { marginBottom: 4, lineHeight: 1.4 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  entryTitle: { fontSize: 10.5, fontWeight: 700, textTransform: "uppercase" },
  entryMeta: { fontSize: 9, color: MUTED },
  bullet: { marginLeft: 10, marginTop: 2, lineHeight: 1.35 },
  skills: { marginTop: 2, fontWeight: 700 },
});

function BoldPdf({ resume }: { resume: ResumeData }) {
  const s = boldStyles;
  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <Text style={s.name}>{resume.contact.fullName || "Your Name"}</Text>
        <View style={s.rule} />
        <Text style={s.contactLine}>{contactLine(resume)}</Text>

        {resume.summary ? (
          <>
            <Text style={s.sectionTitle}>Summary</Text>
            <Text style={s.summary}>{resume.summary}</Text>
          </>
        ) : null}

        {resume.experience.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Experience</Text>
            {resume.experience.map((exp) => (
              <View key={exp.id} wrap={false}>
                <View style={s.entryHeader}>
                  <Text style={s.entryTitle}>
                    {exp.role} — {exp.company}
                  </Text>
                  <Text style={s.entryMeta}>
                    {exp.startDate} – {exp.endDate}
                  </Text>
                </View>
                {exp.bullets.map((b, i) => (
                  <Text key={i} style={s.bullet}>
                    ▸ {b}
                  </Text>
                ))}
              </View>
            ))}
          </>
        )}

        {resume.education.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Education</Text>
            {resume.education.map((edu) => (
              <View key={edu.id} style={s.entryHeader}>
                <Text style={s.entryTitle}>
                  {edu.degree} — {edu.school}
                </Text>
                <Text style={s.entryMeta}>
                  {edu.startDate} – {edu.endDate}
                </Text>
              </View>
            ))}
          </>
        )}

        {resume.skills.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Skills</Text>
            <Text style={s.skills}>{resume.skills.join("  /  ")}</Text>
          </>
        )}
      </Page>
    </Document>
  );
}
