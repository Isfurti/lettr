import { describe, it, expect } from "vitest";
import { analyzeResumeText } from "@/lib/ats-read";

const GOOD = `Aisha Mehra
aisha@email.com | +91 98765 43210 | Bengaluru | linkedin.com/in/aisha-mehra

SUMMARY
Product marketer with 6 years in B2B software who turns complex features into launches people understand.

EXPERIENCE
Product Marketing Manager, Brightline   Jun 2022 – Present
• Led 4 product launches that brought in 1,800 qualified leads
• Rebuilt the email programme, lifting open rates from 18% to 27%
• Wrote the sales playbook used by a 20-person team
Marketing Associate, Northwind   2019 – 2022
• Wrote and tested landing pages for 3 regional campaigns

EDUCATION
MBA, Marketing, Symbiosis Pune, 2019

SKILLS
Positioning, SEO, HubSpot, SQL, A/B testing
${"Extra words to pass the length check. ".repeat(20)}`;

const byId = (r: ReturnType<typeof analyzeResumeText>, id: string) => r.checks.find((c) => c.id === id)!;

describe("analyzeResumeText", () => {
  it("passes a clean, well-structured resume", () => {
    const r = analyzeResumeText(GOOD);
    expect(r.sectionsMissing).toEqual([]);
    expect(r.sectionsFound).toEqual(expect.arrayContaining(["Summary", "Experience", "Education", "Skills"]));
    for (const id of ["text", "email", "phone", "linkedin", "sections", "dates", "bullets", "chars"]) {
      expect(byId(r, id).status).toBe("pass");
    }
  });

  it("flags missing contact details and headings", () => {
    const r = analyzeResumeText("Just a paragraph about me with no headings or contact details at all.");
    expect(byId(r, "email").status).toBe("fail");
    expect(byId(r, "phone").status).toBe("warn");
    expect(byId(r, "sections").status).toBe("fail");
    expect(byId(r, "text").status).toBe("warn");
  });

  it("recognises Indian-style and LinkedIn-export headings", () => {
    const r = analyzeResumeText("Career Objective\nAcademic Qualifications\nInternships\nTop Skills\n");
    expect(r.sectionsFound).toEqual(expect.arrayContaining(["Summary", "Education", "Experience", "Skills"]));
  });

  it("warns about icon-font gibberish", () => {
    const r = analyzeResumeText(GOOD + "   �");
    expect(byId(r, "chars").status).toBe("warn");
  });

  it("warns when a resume is very long", () => {
    const r = analyzeResumeText(GOOD + " word".repeat(1200));
    expect(byId(r, "length").status).toBe("warn");
  });
});
