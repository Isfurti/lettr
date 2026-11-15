import { describe, expect, it } from "vitest";
import { assertPreviewUsesStagingDatabase as check } from "@/lib/preview-guard";

const PROD = "postgres://u:p@ep-prod-pooler.us-east-2.aws.neon.tech/neondb";
const STAGING = "postgres://u:p@ep-staging.us-east-2.aws.neon.tech/neondb";
const preview = { VERCEL_ENV: "preview", PREVIEW_DATABASE_HOST: "ep-staging.us-east-2.aws.neon.tech" };

describe("preview database guard", () => {
  it("lets production, local development and tests use their own database", () => {
    expect(() => check(PROD, { VERCEL_ENV: "production" })).not.toThrow();
    expect(() => check("postgres://postgres:postgres@localhost:5432/x", {})).not.toThrow();
    expect(() => check(PROD, { VERCEL_ENV: "development" })).not.toThrow();
  });

  it("lets a preview use the staging database", () => {
    expect(() => check(STAGING, preview)).not.toThrow();
    expect(() => check(STAGING, { ...preview, PREVIEW_DATABASE_HOST: "  EP-Staging.us-east-2.aws.neon.tech " })).not.toThrow();
  });

  it("stops a preview that points at the production database", () => {
    expect(() => check(PROD, preview)).toThrow(/staging/);
  });

  it("stops a preview when the staging host is not set, or the URL is unreadable", () => {
    expect(() => check(STAGING, { VERCEL_ENV: "preview" })).toThrow();
    expect(() => check("not a url", preview)).toThrow();
    expect(() => check(STAGING, { ...preview, PREVIEW_DATABASE_HOST: "" })).toThrow();
  });
});
