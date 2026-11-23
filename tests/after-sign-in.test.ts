import { describe, it, expect } from "vitest";
import { afterSignIn } from "@/lib/after-sign-in";

describe("afterSignIn", () => {
  it("sends checker and builder sign-ups to the dashboard that saves their draft", () => {
    expect(afterSignIn("builder")).toBe("/dashboard?draft=save");
    expect(afterSignIn("export")).toBe("/dashboard?draft=save");
  });
  it("keeps the other fixed destinations", () => {
    expect(afterSignIn("import")).toBe("/dashboard?import=1");
    expect(afterSignIn("pricing")).toBe("/pricing");
    expect(afterSignIn(null)).toBe("/dashboard");
    expect(afterSignIn("https://evil.example")).toBe("/dashboard");
  });
});
