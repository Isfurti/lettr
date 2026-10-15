import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { findBlanks } from "@/lib/blanks";
import { extractKeywords } from "@/lib/ats-score";
import { executeTool } from "@/lib/ai-agent";
import { monthlyPriceForUser, monthlyRevenueLabel } from "@/lib/plans";
import { checkAndRecordRateLimit, isRateLimited, recordRateLimitHit, refundRateLimit } from "@/lib/rate-limit";
import { emptyResume, type ResumeData } from "@/lib/types";
import pool from "@/lib/db";

afterAll(async () => {
  await pool.end();
});

const resume = (patch: Partial<ResumeData>): ResumeData => ({ ...emptyResume, ...patch });

describe("findBlanks", () => {
  it("finds [X]-style blanks left by AI rewrites in the summary, bullets, projects and achievements", () => {
    const r = resume({
      summary: "Sales lead who grew revenue by [X]%.",
      experience: [
        { id: "1", role: "Analyst", company: "Paytm", startDate: "2021", endDate: "Present", bullets: ["Ran weekly reviews against [specific metrics or goals].", "Cut costs 10%"] },
      ],
      projects: [{ id: "p", name: "Tool", description: "Saved [number] hours a week" }],
      achievements: ["Won the <b>[award name]</b>"],
    });
    expect(findBlanks(r).map((b) => b.section)).toEqual(["summary", "experience", "projects", "achievements"]);
  });

  it("finds nothing on a finished resume", () => {
    const r = resume({
      summary: "Data analyst with 4 years in fintech.",
      experience: [{ id: "1", role: "Analyst", company: "Paytm", startDate: "2021", endDate: "Present", bullets: ["Cut reporting time from 3 days to 4 hours"] }],
    });
    expect(findBlanks(r)).toEqual([]);
  });
});

describe("job post keywords skip the hiring company and the title line", () => {
  it("leaves out the company name and generic job-ad words", () => {
    const jd =
      "Senior Data Analyst - Swiggy, Bengaluru. We are looking for a Senior Data Analyst to join our Growth Analytics team. " +
      "Build dashboards in Tableau or Looker, write complex SQL queries, design and analyse A/B experiments, partner with product " +
      "managers on funnel analysis, and present insights to leadership. Requirements: 4+ years in analytics, strong SQL and Python, " +
      "Snowflake or BigQuery, statistics and stakeholder management.";
    const keywords = extractKeywords(jd);
    for (const junk of ["swiggy", "write", "complex", "queries", "insights", "analyst", "bengaluru"]) expect(keywords).not.toContain(junk);
    expect(keywords).toEqual(expect.arrayContaining(["sql", "tableau", "looker", "python", "snowflake", "bigquery", "funnel analysis", "stakeholder management"]));
  });

  it("drops a company named in the post body, and matches Google Ads as one skill", () => {
    const jd =
      "Marketing Manager\nZomato is hiring a marketing manager to own performance marketing across Google Ads and Meta Ads. " +
      "You will run campaigns, manage budgets and report on ROAS and CAC. Zomato offers a fast-paced environment.";
    const keywords = extractKeywords(jd);
    expect(keywords).not.toContain("zomato");
    expect(keywords).toEqual(expect.arrayContaining(["performance marketing", "google ads", "meta ads", "roas", "cac"]));
  });

  it("still treats a one-line post as content, not a title", () => {
    expect(extractKeywords("Experience with AWS deployment.", 10)).toContain("deployment");
  });
});

describe("AI agent action notes name the role, not a list index", () => {
  const r = resume({
    experience: [
      { id: "a", role: "Senior Data Analyst", company: "Razorpay", startDate: "2023", endDate: "Present", bullets: ["x"] },
      { id: "b", role: "Data Analyst", company: "Paytm", startDate: "2021", endDate: "2023", bullets: ["y"] },
    ],
  });

  it("set_experience_bullets", () => {
    const { description, resume: next } = executeTool(r, "set_experience_bullets", { index: 1, bullets: ["Ran A/B tests"] });
    expect(description).toBe("Rewrote bullets for Data Analyst at Paytm");
    expect(next.experience[1].bullets).toEqual(["Ran A/B tests"]);
  });

  it("an index that doesn't exist changes nothing", () => {
    const { description, resume: next } = executeTool(r, "remove_experience", { index: 5 });
    expect(next.experience).toHaveLength(2);
    expect(description).toMatch(/nothing changed/);
  });
});

describe("admin prices match the pricing page", () => {
  it("shows India's monthly Pro price in rupees", () => {
    expect(monthlyPriceForUser({ country_code: "IN", pricing_tier: "value" }).label).toBe("₹599/mo");
    expect(monthlyPriceForUser({ country_code: "US", pricing_tier: "full" }).label).toBe("$24/mo");
  });

  it("adds revenue up per currency instead of mixing them", () => {
    const label = monthlyRevenueLabel([
      { country_code: "IN", pricing_tier: "value" },
      { country_code: "IN", pricing_tier: "value" },
      { country_code: "US", pricing_tier: "full" },
    ]);
    expect(label).toBe("₹1,198 + $24");
    expect(monthlyRevenueLabel([])).toBe("₹0");
  });
});

describe("rate limit helpers", () => {
  it("refundRateLimit gives back the last recorded use", async () => {
    const key = `test:${randomUUID()}`;
    expect((await checkAndRecordRateLimit(key, "refund-test", 1, 60)).allowed).toBe(true);
    expect((await checkAndRecordRateLimit(key, "refund-test", 1, 60)).allowed).toBe(false);
    await refundRateLimit(key, "refund-test");
    expect((await checkAndRecordRateLimit(key, "refund-test", 1, 60)).allowed).toBe(true);
  });

  it("isRateLimited only counts recorded hits (e.g. failed logins)", async () => {
    const key = `login:${randomUUID()}@example.com`;
    expect(await isRateLimited(key, "login-failed", 2, 15)).toBe(false);
    await recordRateLimitHit(key, "login-failed");
    expect(await isRateLimited(key, "login-failed", 2, 15)).toBe(false);
    await recordRateLimitHit(key, "login-failed");
    expect(await isRateLimited(key, "login-failed", 2, 15)).toBe(true);
  });
});
