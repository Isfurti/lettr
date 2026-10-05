/* eslint-disable @next/next/no-img-element -- resume photos are user-uploaded data URLs, not optimisable assets */
import type { ResumeData, ExperienceEntry } from "@/lib/types";
import { ExtraSectionsPreview } from "@/components/ResumeEditor";

/**
 * Templates added in the Oct 2026 batch: Ribbon, Split, Scholar, Fresher,
 * Grid and Spotlight. Each one has a matching PDF version in
 * components/templates/NewPdfs.tsx - keep the two in step.
 *
 * Colours come from the --seal / --seal-soft variables that ResumePreview
 * sets from the user's accent colour.
 */

const flags = (d: ResumeData) => ({
  showDividers: d.customization?.showDividers ?? true,
  indent: d.customization?.indentBullets ?? true,
  photo: d.customization?.showPhoto ? d.customization?.photoDataUrl : undefined,
});

const contactItems = (d: ResumeData) =>
  [d.contact.email, d.contact.phone, d.contact.location, d.contact.linkedin, d.contact.website].filter(Boolean) as string[];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "YN";

function Bullets({ items, indent, marker = "•" }: { items: string[]; indent: boolean; marker?: string }) {
  return (
    <ul className="mt-1 space-y-0.5">
      {items.filter(Boolean).map((b, i) => (
        <li key={i} className={indent ? "text-sm pl-4 relative" : "text-sm"}>
          <span aria-hidden="true" className={indent ? "absolute left-0 text-seal" : "text-seal"}>
            {indent ? marker : `${marker} `}
          </span>
          {b}
        </li>
      ))}
    </ul>
  );
}

function Job({ exp, indent, stacked = false }: { exp: ExperienceEntry; indent: boolean; stacked?: boolean }) {
  return (
    <div className="mt-3">
      <div className="flex justify-between gap-3 text-sm">
        <span className="font-semibold">
          {exp.role || "Role"}
          {!stacked && exp.company && <span className="font-normal text-ink-soft"> · {exp.company}</span>}
        </span>
        <span className="text-xs text-ink-soft whitespace-nowrap">
          {exp.startDate} – {exp.endDate}
        </span>
      </div>
      {stacked && exp.company && <p className="text-xs text-ink-soft">{exp.company}</p>}
      <Bullets items={exp.bullets} indent={indent} />
    </div>
  );
}

// ---------- Ribbon: accent ribbon beside the name, pill-shaped section labels ----------

export function RibbonPreview({ data }: { data: ResumeData }) {
  const { indent, photo } = flags(data);
  const label = "inline-block mt-6 mb-2 px-3 py-1 rounded-full bg-seal text-white text-[11px] font-bold uppercase tracking-wider";
  return (
    <div className="paper-sheet rounded-sm mx-auto max-w-2xl p-10" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="flex items-center gap-4">
        <span aria-hidden="true" className="w-2 self-stretch rounded-full bg-seal" />
        {photo && <img src={photo} alt="" className="w-16 h-16 rounded-full object-cover shrink-0" />}
        <div className="min-w-0">
          <h2 className="font-display font-bold text-3xl leading-tight">{data.contact.fullName || "Your Name"}</h2>
          <p className="text-xs text-ink-soft mt-1">{contactItems(data).join("  ·  ")}</p>
        </div>
      </div>
      {data.summary && (
        <>
          <h3 className={label}>Profile</h3>
          <p className="text-sm leading-relaxed">{data.summary}</p>
        </>
      )}
      {data.experience.length > 0 && (
        <>
          <h3 className={label}>Experience</h3>
          {data.experience.map((e) => <Job key={e.id} exp={e} indent={indent} />)}
        </>
      )}
      {data.education.length > 0 && (
        <>
          <h3 className={label}>Education</h3>
          {data.education.map((e) => (
            <div key={e.id} className="flex justify-between gap-3 text-sm mt-1">
              <span><span className="font-semibold">{e.degree || "Degree"}</span>{e.school && <span className="text-ink-soft"> · {e.school}</span>}</span>
              <span className="text-xs text-ink-soft whitespace-nowrap">{e.startDate} – {e.endDate}</span>
            </div>
          ))}
        </>
      )}
      {data.skills.length > 0 && (
        <>
          <h3 className={label}>Skills</h3>
          <p className="text-sm">{data.skills.join("  ·  ")}</p>
        </>
      )}
      <ExtraSectionsPreview data={data} headingClassName={label + " block w-fit"} />
    </div>
  );
}

// ---------- Split: header across the top, main column left, light details column right ----------

export function SplitPreview({ data }: { data: ResumeData }) {
  const { indent, photo, showDividers } = flags(data);
  const main = `text-xs uppercase tracking-widest font-bold text-seal mt-5 mb-1 ${showDividers ? "pb-1 border-b border-rule" : ""}`;
  const side = "text-[10px] uppercase tracking-widest font-bold text-seal mt-5 mb-1.5";
  return (
    <div className="paper-sheet rounded-sm mx-auto max-w-2xl overflow-hidden" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="px-8 pt-8 pb-5 flex items-center gap-4 border-b-4 border-seal">
        {photo && <img src={photo} alt="" className="w-16 h-16 rounded-full object-cover shrink-0" />}
        <h2 className="font-display font-bold text-3xl leading-tight">{data.contact.fullName || "Your Name"}</h2>
      </div>
      <div className="grid grid-cols-[1.75fr_1fr]">
        <div className="px-8 pb-8">
          {data.summary && (
            <>
              <h3 className={main}>Summary</h3>
              <p className="text-sm leading-relaxed">{data.summary}</p>
            </>
          )}
          {data.experience.length > 0 && (
            <>
              <h3 className={main}>Experience</h3>
              {data.experience.map((e) => <Job key={e.id} exp={e} indent={indent} stacked />)}
            </>
          )}
          <ExtraSectionsPreview data={data} headingClassName={main} only={["projects", "achievements"]} />
        </div>
        <div className="bg-seal-soft px-6 pb-8">
          <h3 className={side}>Contact</h3>
          <div className="space-y-0.5 text-xs break-words">
            {contactItems(data).map((c) => <p key={c}>{c}</p>)}
          </div>
          {data.skills.length > 0 && (
            <>
              <h3 className={side}>Skills</h3>
              <ul className="space-y-0.5 text-xs">
                {data.skills.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </>
          )}
          {data.education.length > 0 && (
            <>
              <h3 className={side}>Education</h3>
              {data.education.map((e) => (
                <div key={e.id} className="text-xs mb-2">
                  <p className="font-semibold">{e.degree}</p>
                  <p className="text-ink-soft">{e.school}</p>
                  <p className="text-ink-soft text-[10px]">{e.startDate} – {e.endDate}</p>
                </div>
              ))}
            </>
          )}
          <div className="text-xs [&_p]:text-xs [&_li]:text-xs">
            <ExtraSectionsPreview data={data} headingClassName={side} only={["certifications", "languages"]} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Scholar: centred, academic, education first ----------

export function ScholarPreview({ data }: { data: ResumeData }) {
  const { indent } = flags(data);
  const heading =
    "flex items-center gap-3 mt-6 mb-2 text-[11px] uppercase tracking-[0.2em] font-semibold text-seal before:flex-1 before:h-px before:bg-rule after:flex-1 after:h-px after:bg-rule";
  return (
    <div className="paper-sheet rounded-sm mx-auto max-w-2xl p-10" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="text-center">
        <h2 className="font-display text-3xl tracking-wide">{data.contact.fullName || "Your Name"}</h2>
        <p className="text-xs text-ink-soft mt-2">{contactItems(data).join("  |  ")}</p>
      </div>
      {data.summary && (
        <>
          <h3 className={heading}>Profile</h3>
          <p className="text-sm leading-relaxed text-center">{data.summary}</p>
        </>
      )}
      {data.education.length > 0 && (
        <>
          <h3 className={heading}>Education</h3>
          {data.education.map((e) => (
            <div key={e.id} className="flex justify-between gap-3 text-sm mt-1.5">
              <span><span className="font-semibold">{e.school || "School"}</span>{e.degree && <span className="italic"> — {e.degree}</span>}</span>
              <span className="text-xs text-ink-soft whitespace-nowrap">{e.startDate} – {e.endDate}</span>
            </div>
          ))}
        </>
      )}
      {data.experience.length > 0 && (
        <>
          <h3 className={heading}>Experience</h3>
          {data.experience.map((e) => <Job key={e.id} exp={e} indent={indent} />)}
        </>
      )}
      <ExtraSectionsPreview data={data} headingClassName={heading} only={["projects", "certifications", "achievements"]} />
      {data.skills.length > 0 && (
        <>
          <h3 className={heading}>Skills</h3>
          <p className="text-sm text-center">{data.skills.join("  ·  ")}</p>
        </>
      )}
      <ExtraSectionsPreview data={data} headingClassName={heading} only={["languages"]} variant="center" />
    </div>
  );
}

// ---------- Fresher: education, projects and skills before experience ----------

export function FresherPreview({ data }: { data: ResumeData }) {
  const { indent, photo, showDividers } = flags(data);
  const heading = `text-xs uppercase tracking-wide font-bold text-seal mt-5 mb-1.5 ${showDividers ? "pb-1 border-b-2 border-seal-soft" : ""}`;
  return (
    <div className="paper-sheet rounded-sm mx-auto max-w-2xl p-9" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="flex items-center gap-4 pb-4 border-b-2 border-seal">
        {photo && <img src={photo} alt="" className="w-16 h-16 rounded-full object-cover shrink-0" />}
        <div className="min-w-0">
          <h2 className="font-display font-bold text-2xl">{data.contact.fullName || "Your Name"}</h2>
          <p className="text-xs text-ink-soft mt-1">{contactItems(data).join("  •  ")}</p>
        </div>
      </div>
      {data.summary && (
        <>
          <h3 className={heading}>Career objective</h3>
          <p className="text-sm leading-relaxed">{data.summary}</p>
        </>
      )}
      {data.education.length > 0 && (
        <>
          <h3 className={heading}>Education</h3>
          {data.education.map((e) => (
            <div key={e.id} className="flex justify-between gap-3 text-sm mt-1">
              <span><span className="font-semibold">{e.degree || "Degree"}</span>{e.school && <span> — {e.school}</span>}</span>
              <span className="text-xs text-ink-soft whitespace-nowrap">{e.startDate} – {e.endDate}</span>
            </div>
          ))}
        </>
      )}
      <ExtraSectionsPreview data={data} headingClassName={heading} only={["projects"]} />
      {data.skills.length > 0 && (
        <>
          <h3 className={heading}>Skills</h3>
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map((s) => (
              <span key={s} className="text-xs bg-seal-soft rounded px-2 py-0.5">{s}</span>
            ))}
          </div>
        </>
      )}
      {data.experience.length > 0 && (
        <>
          <h3 className={heading}>Internships & experience</h3>
          {data.experience.map((e) => <Job key={e.id} exp={e} indent={indent} />)}
        </>
      )}
      <ExtraSectionsPreview data={data} headingClassName={heading} only={["certifications", "achievements", "languages"]} />
    </div>
  );
}

// ---------- Grid: section labels in a left column, content on the right ----------

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-5 border-t border-rule pt-3 mt-4">
      <h3 className="text-[11px] uppercase tracking-widest font-bold text-seal pt-0.5">{label}</h3>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function GridPreview({ data }: { data: ResumeData }) {
  const { indent, photo } = flags(data);
  return (
    <div className="paper-sheet rounded-sm mx-auto max-w-2xl p-10" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="grid grid-cols-[110px_1fr] gap-5 items-end">
        {photo ? <img src={photo} alt="" className="w-20 h-20 rounded-sm object-cover" /> : <span className="block w-10 h-1 bg-seal mb-3" />}
        <div>
          <h2 className="font-display font-bold text-3xl leading-tight">{data.contact.fullName || "Your Name"}</h2>
          <p className="text-xs text-ink-soft mt-1">{contactItems(data).join("   ")}</p>
        </div>
      </div>
      {data.summary && <Row label="Profile"><p className="text-sm leading-relaxed">{data.summary}</p></Row>}
      {data.experience.length > 0 && (
        <Row label="Experience">
          <div className="-mt-3">{data.experience.map((e) => <Job key={e.id} exp={e} indent={indent} stacked />)}</div>
        </Row>
      )}
      {data.education.length > 0 && (
        <Row label="Education">
          {data.education.map((e) => (
            <div key={e.id} className="text-sm mb-1.5">
              <p className="font-semibold">{e.degree || "Degree"}</p>
              <p className="text-xs text-ink-soft">{e.school} · {e.startDate} – {e.endDate}</p>
            </div>
          ))}
        </Row>
      )}
      {data.skills.length > 0 && <Row label="Skills"><p className="text-sm">{data.skills.join(", ")}</p></Row>}
      <div className="[&_h3]:hidden">
        {(["projects", "certifications", "achievements", "languages"] as const).map((k) => {
          const has =
            k === "projects" ? (data.projects ?? []).some((p) => p.name.trim() || p.description.trim())
            : k === "certifications" ? (data.certifications ?? []).some((c) => c.name.trim())
            : k === "achievements" ? (data.achievements ?? []).some((a) => a.trim())
            : (data.languages ?? []).some((l) => l.trim());
          if (!has) return null;
          return (
            <Row key={k} label={k[0].toUpperCase() + k.slice(1)}>
              <div className="-mt-2">
                <ExtraSectionsPreview data={data} headingClassName="" only={[k]} />
              </div>
            </Row>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Spotlight: tinted header card with initials, summary called out ----------

export function SpotlightPreview({ data }: { data: ResumeData }) {
  const { indent, photo, showDividers } = flags(data);
  const heading = `flex items-center gap-2 text-sm font-bold text-ink mt-6 mb-1.5 before:w-2 before:h-2 before:rounded-full before:bg-seal ${showDividers ? "" : ""}`;
  return (
    <div className="paper-sheet rounded-sm mx-auto max-w-2xl p-8" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="bg-seal-soft rounded-2xl p-6 flex items-center gap-5">
        {photo ? (
          <img src={photo} alt="" className="w-20 h-20 rounded-full object-cover shrink-0" />
        ) : (
          <span className="w-16 h-16 rounded-full bg-seal text-white font-display font-bold text-xl flex items-center justify-center shrink-0">
            {initials(data.contact.fullName)}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="font-display font-bold text-2xl leading-tight">{data.contact.fullName || "Your Name"}</h2>
          <p className="text-xs text-ink-soft mt-1.5 leading-relaxed">{contactItems(data).join("  ·  ")}</p>
        </div>
      </div>
      {data.summary && (
        <p className="mt-5 text-[15px] leading-relaxed border-l-4 border-seal pl-4 italic">{data.summary}</p>
      )}
      {data.experience.length > 0 && (
        <>
          <h3 className={heading}>Experience</h3>
          {data.experience.map((e) => <Job key={e.id} exp={e} indent={indent} />)}
        </>
      )}
      {data.education.length > 0 && (
        <>
          <h3 className={heading}>Education</h3>
          {data.education.map((e) => (
            <div key={e.id} className="flex justify-between gap-3 text-sm mt-1">
              <span><span className="font-semibold">{e.degree || "Degree"}</span>{e.school && <span className="text-ink-soft"> · {e.school}</span>}</span>
              <span className="text-xs text-ink-soft whitespace-nowrap">{e.startDate} – {e.endDate}</span>
            </div>
          ))}
        </>
      )}
      {data.skills.length > 0 && (
        <>
          <h3 className={heading}>Skills</h3>
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map((s) => (
              <span key={s} className="text-xs border border-seal text-seal rounded-full px-2.5 py-0.5">{s}</span>
            ))}
          </div>
        </>
      )}
      <ExtraSectionsPreview data={data} headingClassName={heading} />
    </div>
  );
}
