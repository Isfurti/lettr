/* eslint-disable @next/next/no-img-element, @next/next/no-html-link-for-pages -- the picture is served by our own route and already resized; links out of a profile are plain <a> on purpose, so the private link is not kept in this tab's history or in router breadcrumbs */
import type { PublicProfile } from "@/lib/public-profile";
import { BANNER_STYLES } from "@/lib/profile-look";

/**
 * The public profile page body. A server component with no scripts of its own:
 * the same view is used for the public link and for the owner's preview.
 * Everything shown comes from the PublicProfile allowlist, never the raw resume.
 */

const card = "rounded-[28px] border-2 border-[var(--pp-line)] bg-[var(--pp-card)] p-6 sm:p-8";
const h2 = "font-brand text-[26px] font-extrabold leading-tight text-[var(--pp-ink)]";
const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f5bea]";
const h3 = "font-brand text-xl font-extrabold text-[var(--pp-ink)]";

const EMAIL_OK = /^[^\s@?&,;:<>]+@[^\s@?&,;:<>]+\.[^\s@?&,;:<>]+$/;
const digits = (v: string) => v.replace(/\D/g, "");

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts;
  return letters.map((p) => Array.from(p)[0]?.toUpperCase() ?? "").join("") || "?";
}

function Avatar({ p, photoSrc }: { p: PublicProfile; photoSrc: string }) {
  if (p.hasPhoto) {
    return <img src={photoSrc} alt="" width={96} height={96} className="size-24 shrink-0 rounded-full border-4 border-[var(--pp-card)] object-cover" />;
  }
  return (
    <div aria-hidden="true" className="flex size-24 shrink-0 items-center justify-center rounded-full border-4 border-[var(--pp-card)] bg-[#041632] font-brand text-4xl font-extrabold text-[#ffc94d]">
      {initials(p.name)}
    </div>
  );
}

function Banner({ style }: { style: PublicProfile["bannerStyle"] }) {
  const bg = BANNER_STYLES.find((b) => b.id === style)?.bg ?? "#041632";
  return (
    <div aria-hidden="true" className="relative h-24 overflow-hidden sm:h-32" style={{ background: bg }}>
      {style === "navy-gold" && (
        <svg width="100%" height="100%" viewBox="0 0 800 128" preserveAspectRatio="xMaxYMid slice" className="absolute inset-0">
          <circle cx="700" cy="30" r="110" fill="#ffc94d" />
          <circle cx="700" cy="30" r="72" fill="#041632" />
          <circle cx="700" cy="30" r="36" fill="#e0a800" />
        </svg>
      )}
      {style === "gold-sun" && (
        <svg width="100%" height="100%" viewBox="0 0 800 128" preserveAspectRatio="xMidYMid slice" className="absolute inset-0">
          <circle cx="620" cy="128" r="150" fill="#e0a800" />
          <circle cx="620" cy="128" r="90" fill="#041632" />
        </svg>
      )}
      {style === "blue-wave" && (
        <svg width="100%" height="100%" viewBox="0 0 800 128" preserveAspectRatio="none" className="absolute inset-0">
          <path d="M0 80 Q100 40 200 80 T400 80 T600 80 T800 80 V128 H0Z" fill="#041632" />
          <path d="M0 100 Q100 70 200 100 T400 100 T600 100 T800 100 V128 H0Z" fill="#ffc94d" />
        </svg>
      )}
    </div>
  );
}

export function PublicProfileView({ profile: p, photoSrc, footer, reportHref = "/support" }: { profile: PublicProfile; photoSrc: string; footer?: React.ReactNode; reportHref?: string }) {
  const hidden = !p.contactShared;
  return (
    <div className="pp-root flex min-h-screen flex-col bg-[var(--pp-bg)] text-[var(--pp-ink)]">
      <header className="flex items-center justify-between border-b border-[var(--pp-line)] px-5 py-4 sm:px-12">
        <a href="/" className={`flex min-h-11 items-center gap-2.5 no-underline ${focus}`}>
          <span className="flex size-[34px] items-center justify-center rounded-[10px] bg-[#041632] font-brand text-xl font-extrabold text-[#ffc94d]">L</span>
          <span className="font-brand text-2xl font-extrabold text-[var(--pp-ink)]">lettr</span>
        </a>
        <a href="/signup" className={`inline-flex min-h-11 items-center rounded-full bg-[#ffc94d] px-5 font-extrabold text-[#041632] no-underline shadow-[0_4px_0_#e0a800] sm:px-6 ${focus}`}>
          Build your own resume
        </a>
      </header>

      <main className="mx-auto flex w-full max-w-[1184px] flex-1 flex-wrap items-start gap-8 px-5 pb-16 pt-8 sm:px-6 sm:pt-10">
        <div className="flex min-w-0 flex-[999_1_620px] flex-col gap-6">
          <section className={`${card} flex flex-col gap-5 overflow-hidden !p-0`}>
            <Banner style={p.bannerStyle} />
            <div className="flex flex-col gap-5 px-6 pb-6 sm:px-8 sm:pb-8">
            <div className="-mt-12 flex flex-wrap items-end gap-6 sm:-mt-14">
              <Avatar p={p} photoSrc={photoSrc} />
              <div className="flex min-w-0 flex-col gap-1.5 pt-2">
                <h1 className="font-brand text-[34px] font-extrabold leading-[1.1] tracking-tight text-[var(--pp-ink)] sm:text-[40px]">
                  {p.name || "Lettr profile"}
                  {p.pronouns && <span className="ml-3 align-middle text-base font-semibold text-[var(--pp-muted)]">({p.pronouns})</span>}
                </h1>
                {p.headline && <p className="text-lg font-semibold sm:text-xl">{p.headline}</p>}
                {p.place && <p className="text-[15px] text-[var(--pp-muted)]">{p.place}{p.updated ? ` · Last updated ${p.updated}` : ""}</p>}
                {!p.place && p.updated && <p className="text-[15px] text-[var(--pp-muted)]">Last updated {p.updated}</p>}
              </div>
            </div>
            {p.openToWork && (
              <p className="inline-flex min-h-9 w-fit max-w-full items-center gap-2 rounded-full bg-[#e9f7ee] px-3.5 py-1.5 text-[13px] font-extrabold text-[#14663a]">
                <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-[#1f9d57]" />
                <span>Open to work · {p.openToWork}</span>
              </p>
            )}
            {p.summary && <p className="whitespace-pre-line text-[17px] leading-relaxed text-[var(--pp-body)]">{p.summary}</p>}
            {hidden ? (
              <p className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border-2 border-dashed border-[var(--pp-dash)] px-4 text-sm font-bold text-[var(--pp-muted)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="4" y="11" width="16" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
                Contact details are hidden by {p.name.split(/\s+/)[0] || "the owner"}
              </p>
            ) : (
              <div className="flex flex-wrap gap-3 text-[15px] font-bold">
                {p.email && !EMAIL_OK.test(p.email) && <span className="inline-flex min-h-11 items-center">{p.email}</span>}
                {p.phone && digits(p.phone).length < 4 && <span className="inline-flex min-h-11 items-center">{p.phone}</span>}
                {p.email && EMAIL_OK.test(p.email) && (
                  <a href={`mailto:${p.email}`} className="inline-flex min-h-11 items-center rounded-full border-2 border-[var(--pp-ink)] px-4 text-[var(--pp-ink)]">
                    {p.email}
                  </a>
                )}
                {p.phone && digits(p.phone).length >= 4 && (
                  <a href={`tel:${p.phone.replace(/[^\d+]/g, "")}`} className="inline-flex min-h-11 items-center rounded-full border-2 border-[var(--pp-ink)] px-4 text-[var(--pp-ink)]">
                    {p.phone}
                  </a>
                )}
              </div>
            )}
            </div>
          </section>

          {p.experience.length > 0 && (
            <section className={`${card} flex flex-col gap-6`}>
              <h2 className={h2}>Experience</h2>
              {p.experience.map((e, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap justify-between gap-x-3">
                    <h3 className="text-lg font-extrabold">{e.role}</h3>
                    {e.dates && <p className="text-sm text-[var(--pp-muted)]">{e.dates}</p>}
                  </div>
                  {e.company && <p className="text-[15px] font-semibold text-[var(--pp-link)]">{e.company}</p>}
                  {e.bullets.length > 0 && (
                    <ul className="mt-2 flex list-disc flex-col gap-2 pl-5 text-base leading-relaxed text-[var(--pp-body)]">
                      {e.bullets.map((b, j) => (
                        <li key={j}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          )}

          {p.projects.length > 0 && (
            <section className={`${card} flex flex-col gap-5`}>
              <h2 className={h2}>Projects</h2>
              {p.projects.map((pr, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <h3 className="text-lg font-extrabold">
                    {pr.url ? (
                      <a href={pr.url} rel="nofollow ugc noopener noreferrer" target="_blank" className={`text-[var(--pp-link)] underline underline-offset-4 ${focus}`}>
                        {pr.name}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    ) : (
                      pr.name
                    )}
                  </h3>
                  {pr.description && <p className="text-base leading-relaxed text-[var(--pp-body)]">{pr.description}</p>}
                  {pr.tech && <p className="text-sm text-[var(--pp-muted)]">{pr.tech}</p>}
                </div>
              ))}
            </section>
          )}

          {p.education.length > 0 && (
            <section className={`${card} flex flex-col gap-4`}>
              <h2 className={h2}>Education</h2>
              {p.education.map((e, i) => (
                <div key={i} className="flex flex-wrap justify-between gap-x-3">
                  <div>
                    <h3 className="text-lg font-extrabold">{e.degree}</h3>
                    {e.school && <p className="mt-0.5 text-[15px] font-semibold text-[var(--pp-link)]">{e.school}</p>}
                    {e.grade && <p className="text-sm text-[var(--pp-muted)]">{e.grade}</p>}
                  </div>
                  {e.dates && <p className="text-sm text-[var(--pp-muted)]">{e.dates}</p>}
                </div>
              ))}
            </section>
          )}

          {p.achievements.length > 0 && (
            <section className={`${card} flex flex-col gap-4`}>
              <h2 className={h2}>Achievements and activities</h2>
              <ul className="flex list-disc flex-col gap-2 pl-5 text-base leading-relaxed text-[var(--pp-body)]">
                {p.achievements.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="flex min-w-[280px] flex-[1_1_300px] flex-col gap-6">
          {p.skills.length > 0 && (
            <section className={`${card} !p-6 flex flex-col gap-3.5`}>
              <h2 className={h3}>Skills</h2>
              <ul className="flex flex-wrap gap-2">
                {p.skills.map((s, i) => (
                  <li key={i} className="rounded-full bg-[var(--pp-chip)] px-3.5 py-1.5 text-sm font-bold text-[var(--pp-chip-ink)]">
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {p.facts.length > 0 && (
            <section className={`${card} !p-6 flex flex-col gap-3.5`}>
              <h2 className={h3}>Details</h2>
              <dl className="flex flex-col gap-2.5 text-[15px] text-[var(--pp-body)]">
                {p.facts.map((f, i) => (
                  <div key={i} className="flex justify-between gap-3">
                    <dt className="text-[var(--pp-muted)]">{f.label}</dt>
                    <dd className="text-right font-bold">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {p.languages.length > 0 && (
            <section className={`${card} !p-6 flex flex-col gap-3.5`}>
              <h2 className={h3}>Languages</h2>
              <ul className="flex flex-col gap-2.5 text-[15px] text-[var(--pp-body)]">
                {p.languages.map((l, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span className="font-bold">{l.name}</span>
                    {l.level && <span className="text-[var(--pp-muted)]">{l.level}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {p.links.length > 0 && (
            <section className={`${card} !p-6 flex flex-col gap-2`}>
              <h2 className={h3}>Links</h2>
              {p.links.map((l, i) => (
                <a key={i} href={l.url} rel="nofollow ugc noopener noreferrer" target="_blank" className={`flex min-h-11 items-center text-[15px] font-bold text-[var(--pp-link)] underline underline-offset-4 ${focus}`}>
                  {l.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ))}
            </section>
          )}

          {p.certifications.length > 0 && (
            <section className={`${card} !p-6 flex flex-col gap-3.5`}>
              <h2 className={h3}>Certifications</h2>
              <ul className="flex flex-col gap-2 text-[15px] leading-snug text-[var(--pp-body)]">
                {p.certifications.map((c, i) => (
                  <li key={i}>
                    <span className="font-bold">{c.name}</span>
                    {c.detail && <span className="text-[var(--pp-muted)]">, {c.detail}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="flex flex-col gap-3 rounded-[28px] bg-[#041632] p-6 text-[#fffdf8]">
            <p className="font-brand text-[22px] font-extrabold leading-tight">Your resume can be your profile too.</p>
            <p className="text-[15px] leading-normal text-[#d6dcea]">Build a resume on Lettr and share it as a private-by-default link.</p>
            <a href="/signup" className={`inline-flex min-h-12 items-center justify-center rounded-full bg-[#ffc94d] px-6 font-extrabold text-[#041632] no-underline shadow-[0_4px_0_#e0a800] ${focus}`}>
              Build mine
            </a>
          </section>
        </aside>
      </main>

      <footer className="flex flex-wrap justify-between gap-x-6 gap-y-2 border-t border-[var(--pp-line)] px-5 py-5 text-sm text-[var(--pp-muted)] sm:px-12">
        <span>Details provided by the profile owner, not verified by Lettr. Made with Lettr. From Lettr to your offer letter.</span>
        {footer ?? (
          <span className="flex gap-5">
            <a href={reportHref} className={`inline-flex min-h-11 items-center text-[var(--pp-muted)] underline ${focus}`}>
              Report this profile
            </a>
            <a href="/privacy" className={`inline-flex min-h-11 items-center text-[var(--pp-muted)] underline ${focus}`}>
              Privacy
            </a>
          </span>
        )}
      </footer>
    </div>
  );
}
