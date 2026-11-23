import type { ProfileRow } from "./db";
import { profileUrl } from "./profile-consent";
import { bannerOf } from "./profile-look";

/** What the owner's settings screen is told about their profile. Never the internal takedown reason. */
export function profileView(p: ProfileRow | undefined) {
  if (!p) return null;
  return {
    resumeId: p.resume_id,
    shared: p.shared,
    url: p.shared && p.slug ? profileUrl(p.slug) : null,
    showCity: p.show_city,
    showLinks: p.show_links,
    showContact: p.show_contact,
    showPersonal: p.show_personal,
    bannerStyle: bannerOf(p.banner_style),
    pronouns: p.pronouns ?? "",
    openToWork: p.open_to_work,
    otwRole: p.otw_role ?? "",
    otwPlace: p.otw_place ?? "",
    otwNotice: p.otw_notice ?? "",
    showUpdated: p.show_updated,
    hasPhoto: p.has_photo,
    photoVersion: p.photo_etag,
    // What the owner may need to know, never the internal reason text.
    takenDown: Boolean(p.disabled_at),
    consentVersion: p.consent_version,
  };
}
