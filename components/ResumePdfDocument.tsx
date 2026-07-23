import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ResumeData } from "@/lib/types";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica" },
  name: { fontSize: 20, fontWeight: 700, marginBottom: 2 },
  contactLine: { fontSize: 9, color: "#444", marginBottom: 12 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginTop: 12,
    marginBottom: 4,
    borderBottom: "1 solid #333",
    paddingBottom: 2,
    textTransform: "uppercase",
  },
  summary: { marginBottom: 4, lineHeight: 1.4 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  entryTitle: { fontSize: 10.5, fontWeight: 700 },
  entryMeta: { fontSize: 9, color: "#555" },
  bullet: { marginLeft: 10, marginTop: 2, lineHeight: 1.35 },
  skills: { marginTop: 2 },
});

export function ResumePdfDocument({ resume }: { resume: ResumeData }) {
  const contactParts = [
    resume.contact.email,
    resume.contact.phone,
    resume.contact.location,
    resume.contact.linkedin,
    resume.contact.website,
  ].filter(Boolean);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.name}>{resume.contact.fullName || "Your Name"}</Text>
        <Text style={styles.contactLine}>{contactParts.join("  •  ")}</Text>

        {resume.summary ? (
          <>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.summary}>{resume.summary}</Text>
          </>
        ) : null}

        {resume.experience.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Experience</Text>
            {resume.experience.map((exp) => (
              <View key={exp.id} wrap={false}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>
                    {exp.role} — {exp.company}
                  </Text>
                  <Text style={styles.entryMeta}>
                    {exp.startDate} – {exp.endDate}
                  </Text>
                </View>
                {exp.bullets.map((b, i) => (
                  <Text key={i} style={styles.bullet}>
                    • {b}
                  </Text>
                ))}
              </View>
            ))}
          </>
        )}

        {resume.education.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Education</Text>
            {resume.education.map((edu) => (
              <View key={edu.id} style={styles.entryHeader}>
                <Text style={styles.entryTitle}>
                  {edu.degree} — {edu.school}
                </Text>
                <Text style={styles.entryMeta}>
                  {edu.startDate} – {edu.endDate}
                </Text>
              </View>
            ))}
          </>
        )}

        {resume.skills.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Skills</Text>
            <Text style={styles.skills}>{resume.skills.join(" • ")}</Text>
          </>
        )}
      </Page>
    </Document>
  );
}
