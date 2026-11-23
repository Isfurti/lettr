import { describe, it, expect } from "vitest";
import { buildPublicProfile, cityOf, safeHttpUrl, profileTitle } from "@/lib/public-profile";
import { emptyResume, type ResumeData } from "@/lib/types";
import type { PublicProfileSource } from "@/lib/db";

const SECRET_DOB = "01/02/1990";
const SECRET_PHOTO = "data:image/png;base64,SECRETPHOTO";

const resume: ResumeData = {
  ...emptyResume,
  contact: {
    fullName: "Asha Verma",
    email: "asha@example.com",
    phone: "+91 98765 43210",
    location: "Flat 4B, 12 MG Road, Pune, Maharashtra 411001, India",
    linkedin: "linkedin.com/in/asha",
    website: "javascript:alert(1)",
    nationality: "Indian",
    visaStatus: "Authorized",
    dateOfBirth: SECRET_DOB,
  },
  summary: "Data analyst.",
  experience: [
    { id: "e1", company: "Acme", role: "Data Analyst", startDate: "2022-06", endDate: "Present", bullets: ["Built dashboards"] },
  ],
  education: [{ id: "d1", school: "IIT Delhi", degree: "B.Tech", startDate: "2018", endDate: "2022", grade: "CGPA 8.4" }],
  skills: ["SQL", "Python", "Excel", "Tableau"],
  projects: [{ id: "p1", name: "Churn model", description: "Predicts churn", link: "https://example.com/churn" }],
  languages: ["English (Fluent)"],
  customSections: [{ id: "c1", heading: "Private notes", items: [{ id: "i1", title: "SECRET-CUSTOM", subtitle: "", bullets: [] }] }],
  customization: { photoDataUrl: SECRET_PHOTO, photoOriginalDataUrl: SECRET_PHOTO },
};

const src = (over: Partial<PublicProfileSource> = {}, data: ResumeData = resume): PublicProfileSource => ({
  user_id: "u1",
  slug: "x".repeat(22),
  show_city: false,
  show_links: false,
  show_contact: false,
  show_personal: false,
  photo_etag: null,
  has_photo: false,
  resume_id: "r1",
  data: JSON.stringify(data),
  ...over,
});

describe("buildPublicProfile leak guard", () => {
  it("never exposes date of birth, photos, custom sections or hidden contact details by default", () => {
    const json = JSON.stringify(buildPublicProfile(src()));
    for (const secret of [SECRET_DOB, "SECRETPHOTO", "SECRET-CUSTOM", "asha@example.com", "98765", "MG Road", "411001", "linkedin.com", "javascript:"]) {
      expect(json).not.toContain(secret);
    }
  });

  it("shows contact, city and links only when switched on, and never the street address", () => {
    const p = buildPublicProfile(src({ show_city: true, show_links: true, show_contact: true }));
    expect(p.email).toBe("asha@example.com");
    expect(p.phone).toBe("+91 98765 43210");
    expect(p.place).not.toMatch(/\d/);
    expect(JSON.stringify(p)).not.toContain("MG Road");
    expect(p.links.map((l) => l.label)).toEqual(["LinkedIn"]);
    expect(JSON.stringify(p)).not.toContain(SECRET_DOB);
  });

  it("builds a headline from the latest role and top three skills", () => {
    const p = buildPublicProfile(src());
    expect(p.headline).toBe("Data Analyst | SQL, Python, Excel");
    expect(profileTitle(p)).toBe("Asha Verma | Data Analyst");
  });
});

describe("owner switches and hidden sections", () => {
  it("hides visa and nationality unless the owner turns them on, and nationality outside the Gulf", () => {
    expect(JSON.stringify(buildPublicProfile(src()))).not.toContain("Authorized");
    const on = buildPublicProfile(src({ show_personal: true }));
    expect(on.facts.map((f) => f.value)).toEqual(["Authorized"]);
    const gulf = { ...resume, customization: { ...resume.customization, market: "GULF" as const } };
    const g = buildPublicProfile(src({ show_personal: true }, gulf));
    expect(g.facts.map((f) => f.label)).toEqual(["Visa status", "Nationality"]);
  });

  it("keeps hidden sections out of the headline as well as the sections", () => {
    const hid = { ...resume, customization: { ...resume.customization, hiddenSections: ["experience", "skills"] } } as ResumeData;
    const p = buildPublicProfile(src({}, hid));
    expect(p.headline).toBe("");
    expect(JSON.stringify(p)).not.toContain("Data Analyst");
    expect(JSON.stringify(p)).not.toContain("Python");
  });

  it("does not crash on odd saved data", () => {
    const odd = { ...resume, experience: {} as never, education: [null] as never, projects: "x" as never };
    expect(() => buildPublicProfile(src({}, odd))).not.toThrow();
  });

  it("gates project links behind the links switch", () => {
    expect(buildPublicProfile(src()).projects[0].url).toBe("");
    expect(buildPublicProfile(src({ show_links: true })).projects[0].url).toBe("https://example.com/churn");
  });
});

describe("helpers", () => {
  it("cityOf drops parts with digits and keeps the last two", () => {
    expect(cityOf("Flat 4B, 12 MG Road, Pune, India")).toBe("Pune, India");
    expect(cityOf("MG Road, Koregaon Park, Pune")).toBe("Koregaon Park, Pune");
    expect(cityOf("Baker Street, London")).toBe("London");
    expect(cityOf("")).toBe("");
  });
  it("safeHttpUrl only allows web addresses", () => {
    expect(safeHttpUrl("javascript:alert(1)")).toBe("");
    expect(safeHttpUrl("data:text/html,x")).toBe("");
    expect(safeHttpUrl("example.com/a")).toBe("https://example.com/a");
    expect(safeHttpUrl("http://example.com")).toBe("http://example.com/");
    expect(safeHttpUrl("https://user:pass@example.com")).toBe("");
  });
});
