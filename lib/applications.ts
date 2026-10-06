import { z } from "zod";
import { APPLICATION_STATUSES } from "./application-status";

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable()
  .optional()
  .or(z.literal("").transform(() => null));
const text = (max: number) =>
  z
    .string()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (typeof v === "string" ? v.trim() || null : v));

/** What the tracker accepts when creating or editing an application. */
export const ApplicationSchema = z.object({
  company: z.string().trim().min(1, "Add the company name").max(200),
  role: z.string().trim().max(200).optional(),
  url: text(1000).refine((v) => !v || /^https?:\/\//i.test(v), "Links must start with http:// or https://"),
  location: text(200),
  status: z.enum(APPLICATION_STATUSES).optional(),
  appliedOn: date,
  nextStep: text(300),
  nextStepOn: date,
  notes: text(5000),
  jobPost: text(15000),
  resumeId: z.string().max(100).nullable().optional(),
});

export const ApplicationPatchSchema = ApplicationSchema.partial();

export const MAX_APPLICATIONS = 500;

export const STATUS_LABELS: Record<(typeof APPLICATION_STATUSES)[number], string> = {
  saved: "Saved",
  applied: "Applied",
  interview: "Interviewing",
  offer: "Offer",
  rejected: "Closed",
};
