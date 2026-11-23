import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PublicProfileView } from "@/components/profile/PublicProfileView";
import { buildPublicProfile } from "@/lib/public-profile";
import { emptyResume, type ResumeData } from "@/lib/types";

const resume: ResumeData = {
  ...emptyResume,
  contact: { fullName: "Asha Verma", email: "asha@example.com", phone: "+91 98765 43210", location: "Pune, India", dateOfBirth: "01/02/1990" },
  summary: "<script>alert(1)</script> Data analyst.",
  experience: [{ id: "e", company: "Acme", role: "Data Analyst", startDate: "2022-06", endDate: "Present", bullets: ["Built dashboards"] }],
  skills: ["SQL"],
  languages: ["Hindi (Native)"],
};
const src = (over = {}) => ({
  user_id: "u", slug: "s".repeat(22), show_city: true, show_links: false, show_contact: false, show_personal: false,
  photo_etag: null, has_photo: false, resume_id: "r", data: JSON.stringify(resume),
  banner_style: "navy-gold", pronouns: null, open_to_work: false, otw_role: null, otw_place: null, otw_notice: null, show_updated: true, resume_updated_at: null, ...over,
});
const html = (over = {}) => renderToStaticMarkup(<PublicProfileView profile={buildPublicProfile(src(over))} photoSrc="/p/x/photo?v=1" />);

describe("PublicProfileView", () => {
  it("renders name, initials avatar, sections and the not-verified notice", () => {
    const h = html();
    expect(h).toContain("Asha Verma");
    expect(h).toContain(">AV<");
    expect(h).toContain("Experience");
    expect(h).toContain("Details provided by the profile owner, not verified by Lettr");
    expect(h).toContain("Contact details are hidden by Asha");
  });

  it("escapes user text and never prints hidden details", () => {
    const h = html();
    expect(h).not.toContain("<script>alert");
    expect(h).toContain("&lt;script&gt;");
    for (const secret of ["asha@example.com", "98765", "01/02/1990"]) expect(h).not.toContain(secret);
  });

  it("shows contact only when switched on, and the photo only when there is one", () => {
    const on = html({ show_contact: true, has_photo: true, photo_etag: "e1" });
    expect(on).toContain("mailto:asha@example.com");
    expect(on).toContain('src="/p/x/photo?v=1"');
    expect(html()).not.toContain("<img");
  });

  it("does not turn a messy email into extra recipients, and says nothing false when contact is on but empty", () => {
    const messy = { ...resume, contact: { ...resume.contact, email: "a@b.com?cc=x@y.com&body=hi", phone: "ab" } };
    const h = html({ show_contact: true, data: JSON.stringify(messy) });
    expect(h).not.toContain("mailto:");
    expect(h).not.toContain("tel:");
    const none = html({ show_contact: true, data: JSON.stringify({ ...resume, contact: { fullName: "Asha Verma", email: "" } }) });
    expect(none).not.toContain("hidden by");
  });

  it("links out only with nofollow/ugc/noopener/noreferrer and says so for screen readers", () => {
    const h = html({ show_links: true, data: JSON.stringify({ ...resume, contact: { ...resume.contact, linkedin: "linkedin.com/in/asha" } }) });
    expect(h).toContain('rel="nofollow ugc noopener noreferrer"');
    expect(h).toContain('target="_blank"');
    expect(h).toContain("(opens in a new tab)");
  });

  it("shows banner, pronouns, open to work and last updated only when set", () => {
    const off = html();
    expect(off).not.toContain("Open to work");
    expect(off).not.toContain("Last updated");
    const now = new Date(Date.now() - 3 * 86_400_000).toISOString();
    const on = html({ pronouns: "she/her", open_to_work: true, otw_role: "Data Analyst", otw_place: "Pune or remote", otw_notice: "30 days notice", resume_updated_at: now });
    expect(on).toContain("(she/her)");
    expect(on).toContain("Open to work · Data Analyst · Pune or remote · 30 days notice");
    expect(on).toContain("Last updated 3 days ago");
    expect(html({ resume_updated_at: now, show_updated: false })).not.toContain("Last updated");
  });
  it("keeps owner-typed chip text as plain text", () => {
    const h = html({ pronouns: "<b>x</b>", open_to_work: true, otw_role: "<img src=x onerror=1>" });
    expect(h).not.toContain("<b>x");
    expect(h).not.toContain("<img src=x");
  });
  it("falls back to the default banner for an unknown style and uses colour variables for dark mode", () => {
    const h = html({ banner_style: "javascript:alert(1)" });
    expect(h).toContain("pp-root");
    expect(h).toContain("var(--pp-card)");
    expect(h).not.toContain("javascript:");
  });
});
