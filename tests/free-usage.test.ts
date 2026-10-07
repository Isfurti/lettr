import { describe, expect, it } from "vitest";
import { emailHash, normaliseEmail } from "@/lib/email-normalise";

describe("normaliseEmail", () => {
  it("treats Gmail dots, +tags and googlemail as the same inbox", () => {
    expect(normaliseEmail(" Priya.Sharma+jobs@Gmail.com ")).toBe("priyasharma@gmail.com");
    expect(normaliseEmail("priyasharma@googlemail.com")).toBe("priyasharma@gmail.com");
  });
  it("keeps dots for other providers but drops +tags", () => {
    expect(normaliseEmail("a.b+x@outlook.com")).toBe("a.b@outlook.com");
  });
});

describe("emailHash", () => {
  it("matches the same person and never contains the address", () => {
    const a = emailHash("Priya.Sharma@gmail.com");
    expect(a).toBe(emailHash("priyasharma+2@gmail.com"));
    expect(a).not.toContain("priya");
    expect(emailHash(null)).toBeNull();
  });
});
