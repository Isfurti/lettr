import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ProfileSettings, type ProfileView } from "@/components/profile/ProfileSettings";

const base: ProfileView = {
  resumeId: "r1", shared: false, url: null, showCity: false, showLinks: false, showContact: false, showPersonal: false,
  hasPhoto: false, photoVersion: null, takenDown: false,
};
const resumes = [{ id: "r1", title: "Data Analyst resume" }, { id: "r2", title: "Other" }];
const html = (initial: ProfileView | null, rs = resumes) => renderToStaticMarkup(<ProfileSettings initial={initial} resumes={rs} name="Asha Verma" />);

describe("ProfileSettings", () => {
  it("is private by default, shows initials, offers sharing, and keeps the consent dialog closed", () => {
    const h = html(base);
    expect(h).toContain("Private");
    expect(h).toContain(">AV<");
    expect(h).toContain("Share my profile");
    expect(h).not.toContain('role="dialog"');
    expect(h).not.toContain("Stop sharing");
  });

  it("shows the link and the stop button only while shared", () => {
    const h = html({ ...base, shared: true, url: "https://getlettr.com/p/abcdefghijklmnopqrstuv" });
    expect(h).toContain("Shared by link");
    expect(h).toContain("getlettr.com/p/abcdefghijklmnopqrstuv");
    expect(h).toContain("Stop sharing and revoke link");
    expect(h).toContain("change your live page straight away");
    expect(h).not.toContain("Share my profile");
  });

  it("explains a takedown and offers no share button", () => {
    const h = html({ ...base, takenDown: true });
    expect(h).toContain("turned off by Lettr");
    expect(h).not.toContain("Share my profile");
  });

  it("asks for a resume first when there is none", () => {
    const h = html(null, []);
    expect(h).toContain("Make a resume first");
    expect(h).not.toContain("Share my profile");
  });

  it("every switch has an accessible name", () => {
    const h = html(base);
    const switches = h.match(/role="switch"[^>]*/g) ?? [];
    expect(switches.length).toBe(4);
    for (const s of switches) expect(s).toContain("aria-label=");
  });
});
