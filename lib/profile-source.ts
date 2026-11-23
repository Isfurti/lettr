import type { ProfileRow, PublicProfileSource } from "./db";

/** The owner's own view of their profile (preview and home) is built from the same input the public page uses. */
export function ownerSource(userId: string, profile: ProfileRow | undefined, resume: { id: string; data: string; updated_at: string | Date }): PublicProfileSource {
  return {
    user_id: userId,
    slug: profile?.slug ?? "",
    show_city: profile?.show_city ?? false,
    show_links: profile?.show_links ?? false,
    show_contact: profile?.show_contact ?? false,
    show_personal: profile?.show_personal ?? false,
    photo_etag: profile?.photo_etag ?? null,
    has_photo: profile?.has_photo ?? false,
    resume_id: resume.id,
    data: resume.data,
    banner_style: profile?.banner_style ?? "navy-gold",
    pronouns: profile?.pronouns ?? null,
    open_to_work: profile?.open_to_work ?? false,
    otw_role: profile?.otw_role ?? null,
    otw_place: profile?.otw_place ?? null,
    otw_notice: profile?.otw_notice ?? null,
    show_updated: profile?.show_updated ?? false,
    resume_updated_at: resume.updated_at ? new Date(resume.updated_at).toISOString() : null,
  };
}
