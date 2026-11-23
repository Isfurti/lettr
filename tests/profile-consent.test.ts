import { describe, it, expect } from "vitest";
import { consentLines } from "@/lib/profile-consent";

const off = { showCity: false, showLinks: false, showContact: false, showPersonal: false };

describe("consentLines", () => {
  it("lists contact, city, links and personal details as not shared while they are off", () => {
    const l = consentLines(off);
    expect(l.hidden).toHaveLength(4);
    expect(l.shown.join(" ")).not.toMatch(/phone|city|LinkedIn|authorization/i);
    expect(l.shown.join(" ")).toMatch(/certifications.*achievements/);
    expect(l.never).toMatch(/date of birth/i);
  });
  it("moves each one to the shared list when its switch is on", () => {
    const l = consentLines({ showCity: true, showLinks: true, showContact: true, showPersonal: true });
    expect(l.hidden).toEqual([]);
    expect(l.shown.join(" ")).toMatch(/phone number and email/);
    expect(l.shown.join(" ")).toMatch(/work authorization and nationality/);
  });
  it("never offers date of birth", () => {
    const l = consentLines({ showCity: true, showLinks: true, showContact: true, showPersonal: true });
    expect([...l.shown, ...l.hidden].join(" ")).not.toMatch(/birth/i);
  });
});
