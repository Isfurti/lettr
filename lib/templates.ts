/**
 * The full list of resume template IDs. This is the ONLY place this list
 * should be defined - everywhere else (the editor's template picker, the
 * guest builder, the public template gallery, the admin templates page)
 * imports from here.
 *
 * Why this matters: this list drifted out of sync once already (the admin
 * templates page was hardcoded separately and silently fell 6 templates
 * behind when Sidebar/Minimal/Executive/Technical/Timeline/Elegant were
 * added). Importing from one place instead of copy-pasting the array
 * makes that class of bug structurally impossible going forward - adding
 * a new template only requires updating it here, and every consumer picks
 * it up automatically.
 *
 * If you add a new template, you MUST also add its rendering logic to
 * both components/ResumeEditor.tsx (ResumePreview) and
 * components/ResumePdfDocument.tsx (ResumePdfDocument) - this list alone
 * doesn't create the template, it just makes existing UI aware it exists.
 */
export const TEMPLATE_IDS = [
  "classic",
  "modern",
  "compact",
  "bold",
  "sidebar",
  "minimal",
  "executive",
  "technical",
  "timeline",
  "elegant",
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

/**
 * Free plan gets 2 templates - one conservative/traditional, one visually
 * distinct - rather than a single forced option. The other 8 are Pro-only.
 * This list is checked server-side at every point a template actually gets
 * used (create, save, PDF export, DOCX export, Drive export) - not just
 * the gallery UI - since export endpoints take the template as a raw
 * request parameter and don't re-derive it from what's saved in the DB.
 */
export const FREE_TEMPLATE_IDS: readonly TemplateId[] = ["classic", "modern"];

export function isTemplateFree(id: string): boolean {
  return (FREE_TEMPLATE_IDS as readonly string[]).includes(id);
}
