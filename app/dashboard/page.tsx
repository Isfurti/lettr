import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin-auth";
import { getProfile, getResume, getUserById, listOriginalResumeTitles } from "@/lib/db";
import { formatProDate } from "@/lib/pro-pass";
import type { Plan } from "@/lib/limits";
import { buildPublicProfile, type PublicProfile } from "@/lib/public-profile";
import { profileUrl } from "@/lib/profile-consent";
import { AppSidebar } from "@/components/AppSidebar";
import { VerifyEmailBanner } from "@/components/VerifyEmailBanner";
import { GuestDraftRescue } from "@/components/GuestDraftRescue";
import { CopyLinkButton } from "@/components/profile/CopyLinkButton";

export const metadata: Metadata = { title: "My profile | Lettr", robots: { index: false } };
export const dynamic = "force-dynamic";

const OLD_DASHBOARD_PARAMS = ["drive_connected", "drive_error", "import", "upgraded", "draft"];
const card = "rounded-[24px] border-2 border-rule bg-white p-5 sm:p-6";
const h2 = "font-brand text-[22px] font-extrabold";
const pill = "inline-flex min-h-11 items-center rounded-full px-5 text-[15px] font-extrabold";

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts;
  return letters.map((p) => Array.from(p)[0]?.toUpperCase() ?? "").join("") || "?";
}

/** Home: the person's profile. The old dashboard (their resumes) moved to /dashboard/resumes. */
export default async function DashboardHome({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Links made before the move (Drive callback, checkout, import) still land on the resume list.
  const params = await searchParams;
  if (OLD_DASHBOARD_PARAMS.some((k) => k in params)) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) for (const x of [v].flat()) if (typeof x === "string") qs.append(k, x);
    redirect(`/dashboard/resumes?${qs.toString()}`);
  }

  const userId = (session.user as { id: string }).id;
  const [user, profile, resumes] = await Promise.all([getUserById(userId), getProfile(userId), listOriginalResumeTitles(userId)]);
  const plan = (user?.plan ?? "free") as Plan;
  // Only the resume the owner chose. Without one, the page asks them to choose, rather than guessing.
  const chosen = profile?.resume_id ?? undefined;
  const resume = chosen ? await getResume(chosen, userId) : undefined;

  // Built the same way as the public page, so what the owner sees here is what visitors get.
  let view: PublicProfile | null = null;
  if (resume && !resume.parent_id) {
    try {
      view = buildPublicProfile({
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
      });
    } catch {
      view = null; // saved data this version cannot read: show the empty state, not an error page
    }
  }

  const takenDown = Boolean(profile?.disabled_at);
  const link = profile?.shared && profile.slug && !takenDown ? profileUrl(profile.slug) : null;
  // The public page is a 404 without a name, so say so instead of "Shared by link".
  const broken = Boolean(link) && !view?.name;
  const status = takenDown ? "Taken down" : broken ? "Link not working" : link ? "Shared by link" : "Private";
  const statusClass = takenDown || broken ? "bg-[#fde8e6] text-[#8a1c14]" : link ? "bg-[#e9f7ee] text-[#14663a]" : "bg-[#f4f0e3] text-[#27344f]";
  const resumeTitle = resumes.find((r) => r.id === chosen)?.title ?? "your resume";
  const name = view?.name || session.user.name || "Your profile";
  const heroBtn = `${pill} border-2 border-white text-white hover:bg-white/10`;

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-cream text-ink">
      <AppSidebar isAdmin={isAdminEmail(session.user.email)} plan={plan} proUntil={plan === "pro" && user?.pro_until ? formatProDate(user.pro_until) : null} />
      <main className="flex-1 min-w-0 px-4 sm:px-8 lg:px-12 py-6 sm:py-10 max-w-[1200px] w-full">
        {user && !user.email_verified && <VerifyEmailBanner />}
        <Suspense fallback={null}>
          <GuestDraftRescue />
        </Suspense>

        <section className="mb-6 flex flex-wrap items-center gap-6 rounded-[28px] bg-[#041632] p-6 text-white sm:p-8">
          {view?.hasPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element -- served by our own route, already resized
            <img src={`/api/profile/photo?v=${encodeURIComponent(view.photoVersion)}`} alt="" width={96} height={96} className="size-24 shrink-0 rounded-full object-cover" />
          ) : (
            <div aria-hidden="true" className="flex size-24 shrink-0 items-center justify-center rounded-full bg-gold font-brand text-4xl font-extrabold text-ink">{initials(name)}</div>
          )}
          <div className="min-w-0 flex-[1_1_260px]">
            <h1 className="font-brand text-[32px] font-extrabold leading-[1.1] tracking-tight sm:text-[38px]">{name}</h1>
            {view?.headline && <p className="mt-1.5 text-[17px] font-semibold text-[#ffe9a8]">{view.headline}</p>}
            {view?.place && <p className="mt-1 text-sm text-[#c9d3ea]">{view.place}</p>}
          </div>
          <div className="flex flex-col items-start gap-3">
            <span className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-extrabold ${statusClass}`}>
              <span aria-hidden="true" className="size-2 rounded-full bg-current" />
              {status}
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              {link && !broken && <CopyLinkButton url={link} className={`${pill} bg-gold text-ink shadow-[0_4px_0_var(--gold-deep)]`} />}
              {view && <Link href="/dashboard/profile/preview" className={heroBtn}>Preview</Link>}
              <Link href="/dashboard/profile" className={link ? heroBtn : `${pill} bg-gold text-ink shadow-[0_4px_0_var(--gold-deep)]`}>{link || takenDown ? "Settings" : "Set up sharing"}</Link>
            </div>
          </div>
        </section>

        {broken && (
          <p role="status" className="mb-6 rounded-2xl border-2 border-[#8a1c14] bg-[#fde8e6] px-5 py-4 text-sm font-bold text-[#8a1c14]">
            Your link shows a &quot;not found&quot; page until your resume has your name on it. Add it, then check the preview.
          </p>
        )}
        {takenDown && (
          <p role="status" className="mb-6 rounded-2xl border-2 border-[#8a1c14] bg-[#fde8e6] px-5 py-4 text-sm font-bold text-[#8a1c14]">
            This profile was taken down and is not visible to anyone. If you think that was a mistake, contact support.
          </p>
        )}

        {!view ? (
          <section className={`${card} max-w-2xl`}>
            <h2 className={h2}>Your profile is made from a resume</h2>
            <p className="mt-2 text-slate">{resumes.length === 0 ? "Create your first resume and your profile fills in from it." : "Choose one of your resumes and your profile fills in from it."}</p>
            <Link href={resumes.length === 0 ? "/dashboard/resumes" : "/dashboard/profile"} className={`${pill} mt-4 bg-gold text-ink shadow-[0_4px_0_var(--gold-deep)]`}>
              {resumes.length === 0 ? "Create a resume" : "Choose a resume"}
            </Link>
          </section>
        ) : (
          <div className="flex flex-wrap items-start gap-6">
            <div className="flex min-w-0 flex-[999_1_420px] flex-col gap-4">
              {view.summary && (
                <section className={card}>
                  <h2 className={`${h2} mb-2`}>Summary</h2>
                  <p className="whitespace-pre-line leading-relaxed text-[#27344f]">{view.summary}</p>
                </section>
              )}
              {view.experience.length > 0 && (
                <section className={`${card} flex flex-col gap-4`}>
                  <h2 className={h2}>Experience</h2>
                  {view.experience.slice(0, 3).map((e, i) => (
                    <div key={i} className={i ? "border-t border-rule pt-4" : ""}>
                      <p className="font-extrabold">{[e.role, e.company].filter(Boolean).join(", ")}</p>
                      {e.dates && <p className="text-sm text-slate">{e.dates}</p>}
                      {e.bullets[0] && <p className="mt-1.5 text-[#27344f]">{e.bullets[0]}</p>}
                    </div>
                  ))}
                  {view.experience.length > 3 && <p className="text-sm text-slate">and {view.experience.length - 3} more. Visitors see them all.</p>}
                </section>
              )}
              {view.skills.length > 0 && (
                <section className={card}>
                  <h2 className={`${h2} mb-3`}>Skills</h2>
                  <ul className="flex flex-wrap gap-2">
                    {view.skills.slice(0, 16).map((s, i) => <li key={`${i}-${s}`} className="rounded-full bg-[#f4f0e3] px-3.5 py-1.5 text-sm font-bold">{s}</li>)}
                  </ul>
                </section>
              )}
            </div>

            <aside className="flex min-w-0 flex-[1_1_280px] flex-col gap-4">
              <section className="rounded-[24px] border-2 border-gold bg-[#fff7dc] p-5">
                <h2 className="font-extrabold">Profile is made from</h2>
                <p className="mt-1 text-[#27344f]">{resumeTitle}</p>
                <Link href="/dashboard/profile" className="mt-2 inline-flex min-h-11 items-center font-extrabold text-brand-blue underline">Change resume</Link>
              </section>
              <section className={card}>
                <h2 className="font-extrabold">{link ? "What people can see" : "What people will see if you share"}</h2>
                <p className="mt-2 text-sm text-[#27344f]">Name, picture, summary, experience, education, skills</p>
                <p className="mt-1 text-sm text-slate">
                  {view.contactShared ? "Shown: phone and email." : "Hidden: phone and email."}
                </p>
                <Link href="/dashboard/profile" className="mt-2 inline-flex min-h-11 items-center font-extrabold text-brand-blue underline">Change in settings</Link>
              </section>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
