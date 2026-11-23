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
  photo_etag: null, has_photo: false, resume_id: "r", data: JSON.stringify(resume), ...over,
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
});
