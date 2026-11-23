/* eslint-disable @next/next/no-img-element, @next/next/no-html-link-for-pages -- the picture is served by our own route and already resized; links out of a profile are plain <a> on purpose, so the private link is not kept in this tab's history or in router breadcrumbs */
import type { PublicProfile } from "@/lib/public-profile";

/**
 * The public profile page body. A server component with no scripts of its own:
 * the same view is used for the public link and for the owner's preview.
 * Everything shown comes from the PublicProfile allowlist, never the raw resume.
 */

const card = "rounded-[28px] border-2 border-[#e8e2d2] bg-white p-6 sm:p-8";
const h2 = "font-brand text-[26px] font-extrabold leading-tight text-[#041632]";
const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f5bea]";
const h3 = "font-brand text-xl font-extrabold text-[#041632]";

const EMAIL_OK = /^[^\s@?&,;:<>]+@[^\s@?&,;:<>]+\.[^\s@?&,;:<>]+$/;
const digits = (v: string) => v.replace(/\D/g, "");

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts;
  return letters.map((p) => Array.from(p)[0]?.toUpperCase() ?? "").join("") || "?";
}

function Avatar({ p, photoSrc }: { p: PublicProfile; photoSrc: string }) {
  if (p.hasPhoto) {
    return <img src={photoSrc} alt="" width={96} height={96} className="size-24 shrink-0 rounded-full border-2 border-[#e8e2d2] object-cover" />;
  }
  return (
    <div aria-hidden="true" className="flex size-24 shrink-0 items-center justify-center rounded-full bg-[#041632] font-brand text-4xl font-extrabold text-[#ffc94d]">
      {initials(p.name)}
    </div>
  );
}

export function PublicProfileView({ profile: p, photoSrc, footer }: { profile: PublicProfile; photoSrc: string; footer?: React.ReactNode }) {
  const hidden = !p.contactShared;
  return (
    <div className="flex min-h-screen flex-col bg-[#fffdf8] text-[#041632]">
      <header className="flex items-center justify-between border-b border-[#e8e2d2] px-5 py-4 sm:px-12">
        <a href="/" className={`flex min-h-11 items-center gap-2.5 no-underline ${focus}`}>
          <span className="flex size-[34px] items-center justify-center rounded-[10px] bg-[#041632] font-brand text-xl font-extrabold text-[#ffc94d]">L</span>
          <span className="font-brand text-2xl font-extrabold text-[#041632]">lettr</span>
        </a>
        <a href="/signup" className={`inline-flex min-h-11 items-center rounded-full bg-[#ffc94d] px-5 font-extrabold text-[#041632] no-underline shadow-[0_4px_0_#e0a800] sm:px-6 ${focus}`}>
          Build your own resume
        </a>
      </header>

      <main className="mx-auto flex w-full max-w-[1184px] flex-1 flex-wrap items-start gap-8 px-5 pb-16 pt-8 sm:px-6 sm:pt-10">
        <div className="flex min-w-0 flex-[999_1_620px] flex-col gap-6">
          <section className={`${card} flex flex-col gap-5`}>
            <div className="flex flex-wrap items-center gap-6">
              <Avatar p={p} photoSrc={photoSrc} />
              <div className="flex min-w-0 flex-col gap-1.5">
                <h1 className="font-brand text-[34px] font-extrabold leading-[1.1] tracking-tight text-[#041632] sm:text-[40px]">{p.name || "Lettr profile"}</h1>
                {p.headline && <p className="text-lg font-semibold sm:text-xl">{p.headline}</p>}
                {p.place && <p className="text-[15px] text-[#4a5878]">{p.place}</p>}
              </div>
            </div>
            {p.summary && <p className="whitespace-pre-line text-[17px] leading-relaxed text-[#27344f]">{p.summary}</p>}
            {hidden ? (
              <p className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border-2 border-dashed border-[#c9c1a8] px-4 text-sm font-bold text-[#4a5878]">
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
                  <a href={`mailto:${p.email}`} className="inline-flex min-h-11 items-center rounded-full border-2 border-[#041632] px-4 text-[#041632]">
                    {p.email}
                  </a>
                )}
                {p.phone && digits(p.phone).length >= 4 && (
                  <a href={`tel:${p.phone.replace(/[^\d+]/g, "")}`} className="inline-flex min-h-11 items-center rounded-full border-2 border-[#041632] px-4 text-[#041632]">
                    {p.phone}
                  </a>
                )}
              </div>
            )}
          </section>

          {p.experience.length > 0 && (
            <section className={`${card} flex flex-col gap-6`}>
              <h2 className={h2}>Experience</h2>
              {p.experience.map((e, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap justify-between gap-x-3">
                    <h3 className="text-lg font-extrabold">{e.role}</h3>
                    {e.dates && <p className="text-sm text-[#4a5878]">{e.dates}</p>}
                  </div>
                  {e.company && <p className="text-[15px] font-semibold text-[#2f5bea]">{e.company}</p>}
                  {e.bullets.length > 0 && (
                    <ul className="mt-2 flex list-disc flex-col gap-2 pl-5 text-base leading-relaxed text-[#27344f]">
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
                      <a href={pr.url} rel="nofollow ugc noopener noreferrer" target="_blank" className={`text-[#2f5bea] underline underline-offset-4 ${focus}`}>
                        {pr.name}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    ) : (
                      pr.name
                    )}
                  </h3>
                  {pr.description && <p className="text-base leading-relaxed text-[#27344f]">{pr.description}</p>}
                  {pr.tech && <p className="text-sm text-[#4a5878]">{pr.tech}</p>}
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
                    {e.school && <p className="mt-0.5 text-[15px] font-semibold text-[#2f5bea]">{e.school}</p>}
                    {e.grade && <p className="text-sm text-[#4a5878]">{e.grade}</p>}
                  </div>
                  {e.dates && <p className="text-sm text-[#4a5878]">{e.dates}</p>}
                </div>
              ))}
            </section>
          )}

          {p.achievements.length > 0 && (
            <section className={`${card} flex flex-col gap-4`}>
              <h2 className={h2}>Achievements and activities</h2>
              <ul className="flex list-disc flex-col gap-2 pl-5 text-base leading-relaxed text-[#27344f]">
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
                  <li key={i} className="rounded-full bg-[#eef2ff] px-3.5 py-1.5 text-sm font-bold text-[#1f3fb0]">
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {p.facts.length > 0 && (
            <section className={`${card} !p-6 flex flex-col gap-3.5`}>
              <h2 className={h3}>Details</h2>
              <dl className="flex flex-col gap-2.5 text-[15px] text-[#27344f]">
                {p.facts.map((f, i) => (
                  <div key={i} className="flex justify-between gap-3">
                    <dt className="text-[#4a5878]">{f.label}</dt>
                    <dd className="text-right font-bold">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {p.languages.length > 0 && (
            <section className={`${card} !p-6 flex flex-col gap-3.5`}>
              <h2 className={h3}>Languages</h2>
              <ul className="flex flex-col gap-2.5 text-[15px] text-[#27344f]">
                {p.languages.map((l, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span className="font-bold">{l.name}</span>
                    {l.level && <span className="text-[#4a5878]">{l.level}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {p.links.length > 0 && (
            <section className={`${card} !p-6 flex flex-col gap-2`}>
              <h2 className={h3}>Links</h2>
              {p.links.map((l, i) => (
                <a key={i} href={l.url} rel="nofollow ugc noopener noreferrer" target="_blank" className={`flex min-h-11 items-center text-[15px] font-bold text-[#2f5bea] underline underline-offset-4 ${focus}`}>
                  {l.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ))}
            </section>
          )}

          {p.certifications.length > 0 && (
            <section className={`${card} !p-6 flex flex-col gap-3.5`}>
              <h2 className={h3}>Certifications</h2>
              <ul className="flex flex-col gap-2 text-[15px] leading-snug text-[#27344f]">
                {p.certifications.map((c, i) => (
                  <li key={i}>
                    <span className="font-bold">{c.name}</span>
                    {c.detail && <span className="text-[#4a5878]">, {c.detail}</span>}
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

      <footer className="flex flex-wrap justify-between gap-x-6 gap-y-2 border-t border-[#e8e2d2] px-5 py-5 text-sm text-[#4a5878] sm:px-12">
        <span>Details provided by the profile owner, not verified by Lettr. Made with Lettr. From Lettr to your offer letter.</span>
        {footer ?? (
          <span className="flex gap-5">
            <a href="/support" className={`inline-flex min-h-11 items-center text-[#4a5878] underline ${focus}`}>
              Report this profile
            </a>
            <a href="/privacy" className={`inline-flex min-h-11 items-center text-[#4a5878] underline ${focus}`}>
              Privacy
            </a>
          </span>
        )}
      </footer>
    </div>
  );
}
