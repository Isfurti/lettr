import { describe, it, expect } from "vitest";
import { ProfileLook, openToWorkLine, updatedAgo, bannerOf } from "@/lib/profile-look";

const ok = { bannerStyle: "navy-gold", pronouns: "she/her", openToWork: true, otwRole: "Analyst", otwPlace: "Pune", otwNotice: "30 days", showUpdated: true };

describe("ProfileLook", () => {
  it("accepts good input and tidies spaces", () => {
    const r = ProfileLook.parse({ ...ok, pronouns: "  she /  her " });
    expect(r.pronouns).toBe("she / her");
  });
  it("rejects angle brackets, long text and unknown banners", () => {
    expect(ProfileLook.safeParse({ ...ok, otwRole: "<script>" }).success).toBe(false);
    expect(ProfileLook.safeParse({ ...ok, pronouns: "x".repeat(31) }).success).toBe(false);
    expect(ProfileLook.safeParse({ ...ok, bannerStyle: "photo" }).success).toBe(false);
  });
  it("bannerOf falls back", () => {
    expect(bannerOf("gold-sun")).toBe("gold-sun");
    expect(bannerOf("nope")).toBe("navy-gold");
  });
  it("builds the open-to-work line", () => {
    expect(openToWorkLine({ role: "A", place: "", notice: "B" })).toBe("A · B");
  });
  it("words the last-updated time", () => {
    const now = new Date("2026-11-23T10:00:00Z");
    expect(updatedAgo("2026-11-23T01:00:00Z", now)).toBe("today");
    expect(updatedAgo("2026-11-21T09:00:00Z", now)).toBe("2 days ago");
    expect(updatedAgo("2026-10-20T09:00:00Z", now)).toBe("4 weeks ago");
    expect(updatedAgo("2026-03-01T09:00:00Z", now)).toBe("Mar 2026");
    expect(updatedAgo(null, now)).toBe("");
    expect(updatedAgo("garbage", now)).toBe("");
  });
});

describe("hidden characters", () => {
  it("are removed from owner text", () => {
    expect(ProfileLook.parse({ ...ok, pronouns: "sh‮e/her​" }).pronouns).toBe("she/her");
  });
});
