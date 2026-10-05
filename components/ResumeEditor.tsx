"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { extraSections, type ResumeData, type ExperienceEntry, type EducationEntry, type ProjectEntry, type CertificationEntry } from "@/lib/types";
import { scoreResumeAgainstJob, type AtsResult } from "@/lib/ats-score";
import { scoreResumeQuality } from "@/lib/resume-score";
import type { Plan } from "@/lib/limits";
import { BuilderTabs, MobileViewToggle, LettrNotes, ScoreStamp, goToSection } from "@/components/builder/BuilderChrome";
import { ScoreRing } from "@/components/ScoreRing";
import { DEFAULT_ACCENT_COLOR, getFontPair, darkenHex, softenHex, ACCENT_COLORS, FONT_PAIRS } from "@/lib/customization";
import { PhotoUpload } from "@/components/PhotoUpload";

import { TEMPLATE_IDS, isTemplateFree } from "@/lib/templates";
const TEMPLATES: readonly string[] = TEMPLATE_IDS;

export function ResumeEditor({
  resumeId,
  initialTitle,
  initialTemplate,
  initialData,
  plan,
  googleDriveConnected,
  userInitial,
  aiWritingAssistsUsed,
  initialTab = "edit",
}: {
  resumeId: string;
  initialTitle: string;
  initialTemplate: string;
  initialData: ResumeData;
  plan: Plan;
  googleDriveConnected: boolean;
  userInitial: string;
  aiWritingAssistsUsed?: number;
  initialTab?: "edit" | "score" | "match" | "agent" | "cover-letter" | "resignation-letter";
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [template, setTemplate] = useState(initialTemplate);
  const [data, setData] = useState<ResumeData>(initialData);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [tab, setTab] = useState<"edit" | "score" | "match" | "agent" | "cover-letter" | "resignation-letter">(initialTab);
  const [pdfUpgradeRequired, setPdfUpgradeRequired] = useState<string | null>(null);
  const [docxUpgradeRequired, setDocxUpgradeRequired] = useState<string | null>(null);
  const [driveStatus, setDriveStatus] = useState<"idle" | "loading" | "upgrade" | "connect">("idle");
  const [driveLink, setDriveLink] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"form" | "preview">("form");

  async function save() {
    setSaveStatus("saving");
    setSaveError(null);
    const res = await fetch(`/api/resumes/${resumeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, template, data }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setSaveStatus("error");
      setSaveError(body.error ?? "Couldn't save. Try again.");
      return;
    }
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 1500);
  }

  async function exportPdf() {
    setPdfUpgradeRequired(null);
    const res = await fetch("/api/resumes/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume: data, template }),
    });
    if (res.status === 402) {
      const body = await res.json().catch(() => ({}));
      setPdfUpgradeRequired(body.error ?? "Upgrade to Pro to export this.");
      return;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setSaveError(body.error ?? "Couldn't create the PDF. Please try again.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(data.contact.fullName || "resume").replace(/\s+/g, "_")}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportDocx() {
    setDocxUpgradeRequired(null);
    const res = await fetch("/api/resumes/docx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume: data }),
    });
    if (res.status === 402) {
      const body = await res.json().catch(() => ({}));
      setDocxUpgradeRequired(body.error ?? "DOCX export is a Pro feature.");
      return;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setSaveError(body.error ?? "Couldn't create the Word file. Please try again.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(data.contact.fullName || "resume").replace(/\s+/g, "_")}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportToDrive() {
    if (!googleDriveConnected) {
      setDriveStatus("connect");
      return;
    }
    setDriveStatus("loading");
    setDriveLink(null);
    const res = await fetch("/api/resumes/drive-export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume: data, template }),
    });
    const body = await res.json();

    if (res.status === 402) {
      setDriveStatus("upgrade");
      return;
    }
    if (res.status === 428) {
      setDriveStatus("connect");
      return;
    }
    if (!res.ok) {
      setDriveStatus("idle");
      setSaveError(body.error ?? "Couldn't export to Google Drive.");
      return;
    }
    setDriveStatus("idle");
    setDriveLink(body.webViewLink);
  }

  async function deleteThisResume() {
    if (!confirm("Delete this resume? This cannot be undone.")) return;
    await fetch(`/api/resumes/${resumeId}`, { method: "DELETE" });
    router.push("/dashboard");
  }

  const liveScore = scoreResumeQuality(data);
  const upgradeMessage = pdfUpgradeRequired || docxUpgradeRequired;

  function goFix(sectionKey: string) {
    setTab("edit");
    setMobileView("form");
    goToSection(sectionKey);
  }

  const pillOutline =
    "btn-press inline-flex items-center justify-center min-h-11 px-4 rounded-full bg-white border-2 border-ink text-ink text-sm font-bold";

  return (
    <main className="flex-1 flex flex-col bg-cream text-ink">
      <header className="border-b border-rule bg-cream px-3 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-[16rem] flex-1">
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            title="Back to dashboard"
            className="w-11 h-11 shrink-0 rounded-full bg-ink text-gold font-brand font-extrabold text-xl flex items-center justify-center -rotate-6 hover:rotate-0 transition-transform"
          >
            L
          </Link>
          <div className="min-w-0 flex-1">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="Resume title"
              className="font-brand font-extrabold text-xl sm:text-2xl tracking-tight bg-transparent focus:outline-none border-b-2 border-transparent focus:border-brand-blue min-w-0 w-full py-1"
            />
            <p className="text-xs font-bold text-slate h-4" aria-live="polite">
              {saveStatus === "saving"
                ? "Saving…"
                : saveStatus === "saved"
                ? "✓ Saved"
                : saveStatus === "error"
                ? "Not saved"
                : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            aria-label="Template"
            className="min-h-11 max-w-[8rem] sm:max-w-none text-sm font-bold border-2 border-rule rounded-full px-3 bg-white focus:outline-none focus:border-brand-blue"
          >
            {TEMPLATES.map((t) => (
              <option key={t} value={t}>
                {t[0].toUpperCase() + t.slice(1)}
                {plan === "free" && !isTemplateFree(t) ? " (Pro)" : ""}
              </option>
            ))}
          </select>
          <button onClick={save} className={pillOutline}>
            Save
          </button>
          <button
            onClick={exportPdf}
            className="btn-press inline-flex items-center justify-center min-h-11 px-5 rounded-full bg-brand-blue text-white text-sm font-bold shadow-[0_4px_0_var(--brand-blue-deep)]"
          >
            <span className="sm:hidden">PDF</span>
            <span className="hidden sm:inline">Download PDF</span>
          </button>
          <details className="relative">
            <summary className={`${pillOutline} list-none cursor-pointer select-none [&::-webkit-details-marker]:hidden`}>
              More
            </summary>
            <div className="absolute right-0 mt-2 z-30 bg-white border-2 border-ink rounded-2xl py-2 w-60 max-w-[calc(100vw-2rem)] text-[15px] shadow-[5px_5px_0_var(--ink)]">
              <button onClick={exportDocx} className="flex items-center gap-2 w-full text-left px-4 min-h-11 hover:bg-sand">
                Download Word (.docx)
                {plan === "free" && <span className="text-[10px] font-extrabold bg-ink text-gold px-1.5 py-0.5 rounded-full">Pro</span>}
              </button>
              {driveStatus === "connect" ? (
                <a href="/api/google/connect" className="flex items-center px-4 min-h-11 font-bold text-brand-blue hover:bg-sand">
                  Connect Google Drive →
                </a>
              ) : driveLink ? (
                <a href={driveLink} target="_blank" rel="noreferrer" className="flex items-center px-4 min-h-11 font-bold text-brand-blue hover:bg-sand">
                  Open in Drive ✓
                </a>
              ) : (
                <button
                  onClick={exportToDrive}
                  disabled={driveStatus === "loading"}
                  className="flex items-center gap-2 w-full text-left px-4 min-h-11 hover:bg-sand disabled:opacity-60"
                >
                  {driveStatus === "loading" ? "Uploading…" : "Save to Google Drive"}
                  {plan === "free" && <span className="text-[10px] font-extrabold bg-ink text-gold px-1.5 py-0.5 rounded-full">Pro</span>}
                </button>
              )}
              <div className="border-t border-rule my-1" />
              <button onClick={deleteThisResume} className="flex items-center w-full text-left px-4 min-h-11 text-red-600 hover:bg-red-50">
                Delete resume
              </button>
            </div>
          </details>
        </div>
      </header>

      {(saveError || upgradeMessage || driveStatus === "upgrade") && (
        <div className="bg-red-50 text-red-700 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <span>{saveError || upgradeMessage || "Google Drive export is a Pro feature."}</span>
          <div className="flex items-center gap-3 shrink-0">
            {(upgradeMessage || driveStatus === "upgrade" || saveError?.toLowerCase().includes("pro")) && (
              <Link href="/pricing" className="underline font-bold">Upgrade →</Link>
            )}
            <button
              onClick={() => {
                setSaveError(null);
                setPdfUpgradeRequired(null);
                setDocxUpgradeRequired(null);
                if (driveStatus === "upgrade") setDriveStatus("idle");
              }}
              aria-label="Dismiss"
              className="w-10 h-10 rounded-full hover:bg-red-100 text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <BuilderTabs
        tabs={[
          { id: "edit", label: "Edit" },
          { id: "agent", label: "AI Agent", pro: true },
          { id: "score", label: "Score" },
          { id: "match", label: "Job match" },
          { id: "cover-letter", label: "Cover letter", pro: true },
          { id: "resignation-letter", label: "Resignation letter", pro: true },
        ]}
        active={tab}
        onChange={(id) => setTab(id as typeof tab)}
        showPro={plan === "free"}
      />

      <MobileViewToggle view={mobileView} setView={setMobileView} />

      <div className="flex-1 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] min-h-0">
        <div className={`overflow-y-auto px-4 sm:px-8 py-6 sm:py-8 ${mobileView === "preview" ? "hidden lg:block" : ""}`}>
          {tab === "edit" && <EditForm data={data} setData={setData} plan={plan} aiWritingAssistsUsed={aiWritingAssistsUsed} />}
          {tab === "agent" && (
            <UpgradeGate locked={plan === "free"} feature="The AI Resume Agent">
              <AgentPanel data={data} setData={setData} />
            </UpgradeGate>
          )}
          {tab === "score" && <ScorePanel data={data} plan={plan} />}
          {tab === "match" && <JobMatchPanel data={data} />}
          {tab === "cover-letter" && (
            <UpgradeGate locked={plan === "free"} feature="The cover letter builder">
              <CoverLetterPanel data={data} />
            </UpgradeGate>
          )}
          {tab === "resignation-letter" && (
            <UpgradeGate locked={plan === "free"} feature="The resignation letter builder">
              <ResignationLetterPanel initialName={data.contact.fullName} />
            </UpgradeGate>
          )}
        </div>
        <div
          className={`bg-sand border-l border-rule px-4 sm:px-8 py-6 sm:py-8 lg:sticky lg:top-0 lg:self-start lg:h-screen lg:overflow-y-auto ${
            mobileView === "form" ? "hidden lg:block" : ""
          }`}
        >
          <div className="max-w-2xl mx-auto flex flex-col gap-6">
            <LettrNotes data={data} fullAccess={plan === "pro"} onGo={goFix} />
            <div className="relative">
              <div className="absolute -top-4 -right-2 sm:-right-4 z-10">
                <ScoreStamp score={liveScore.overall} />
              </div>
              <ResumePreview data={data} template={template} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export { MobileViewToggle };

// ---------- Upgrade gate ----------

function UpgradeGate({
  locked,
  feature,
  children,
}: {
  locked: boolean;
  feature: string;
  children: React.ReactNode;
}) {
  if (!locked) return <>{children}</>;
  return (
    <div className="max-w-xl bg-white border-2 border-ink rounded-[28px] shadow-[6px_6px_0_var(--ink)] p-8 text-center">
      <span className="inline-block bg-ink text-gold text-xs font-extrabold px-3 py-1 rounded-full mb-3">Pro feature</span>
      <p className="text-lg text-slate mb-6">{feature} is available on the Pro plan.</p>
      <Link
        href="/pricing"
        className="btn-press inline-flex items-center min-h-12 px-6 rounded-full bg-gold text-ink font-extrabold shadow-[0_4px_0_var(--gold-deep)]"
      >
        See Pro
      </Link>
    </div>
  );
}

// ---------- Edit form ----------

export function EditForm({
  data,
  setData,
  plan,
  aiWritingAssistsUsed,
  guest = false,
}: {
  data: ResumeData;
  setData: React.Dispatch<React.SetStateAction<ResumeData>>;
  plan?: Plan;
  aiWritingAssistsUsed?: number;
  /** Not signed in - AI buttons explain how to unlock them instead of calling the API. */
  guest?: boolean;
}) {
  function updateContact<K extends keyof ResumeData["contact"]>(key: K, value: string) {
    setData((d) => ({ ...d, contact: { ...d.contact, [key]: value } }));
  }

  function addExperience() {
    const entry: ExperienceEntry = {
      id: crypto.randomUUID(),
      company: "",
      role: "",
      startDate: "",
      endDate: "Present",
      bullets: [""],
    };
    setData((d) => ({ ...d, experience: [...d.experience, entry] }));
  }

  function updateExperience(id: string, patch: Partial<ExperienceEntry>) {
    setData((d) => ({
      ...d,
      experience: d.experience.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }

  function removeExperience(id: string) {
    setData((d) => ({ ...d, experience: d.experience.filter((e) => e.id !== id) }));
  }

  function addEducation() {
    const entry: EducationEntry = {
      id: crypto.randomUUID(),
      school: "",
      degree: "",
      startDate: "",
      endDate: "",
    };
    setData((d) => ({ ...d, education: [...d.education, entry] }));
  }

  function updateEducation(id: string, patch: Partial<EducationEntry>) {
    setData((d) => ({
      ...d,
      education: d.education.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }

  function removeEducation(id: string) {
    setData((d) => ({ ...d, education: d.education.filter((e) => e.id !== id) }));
  }

  function addProject() {
    const entry: ProjectEntry = { id: crypto.randomUUID(), name: "", link: "", description: "" };
    setData((d) => ({ ...d, projects: [...(d.projects ?? []), entry] }));
  }

  function updateProject(id: string, patch: Partial<ProjectEntry>) {
    setData((d) => ({ ...d, projects: (d.projects ?? []).map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  }

  function removeProject(id: string) {
    setData((d) => ({ ...d, projects: (d.projects ?? []).filter((p) => p.id !== id) }));
  }

  function addCertification() {
    const entry: CertificationEntry = { id: crypto.randomUUID(), name: "", issuer: "", date: "" };
    setData((d) => ({ ...d, certifications: [...(d.certifications ?? []), entry] }));
  }

  function updateCertification(id: string, patch: Partial<CertificationEntry>) {
    setData((d) => ({
      ...d,
      certifications: (d.certifications ?? []).map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }

  function removeCertification(id: string) {
    setData((d) => ({ ...d, certifications: (d.certifications ?? []).filter((c) => c.id !== id) }));
  }

  function updateCustomization<K extends keyof NonNullable<ResumeData["customization"]>>(
    key: K,
    value: NonNullable<ResumeData["customization"]>[K]
  ) {
    setData((d) => ({ ...d, customization: { ...d.customization, [key]: value } }));
  }

  return (
    <div className="space-y-10 max-w-xl mx-auto lg:mx-0">
      {plan === "free" && aiWritingAssistsUsed !== undefined && (
        <div className="bg-white border border-rule rounded-xl p-3 flex items-center justify-between text-xs">
          <span className="text-ink-soft">
            AI bullet/summary rewrites: <strong className="text-ink">{Math.min(aiWritingAssistsUsed, 5)} of 5</strong> free uses
          </span>
          {aiWritingAssistsUsed >= 5 ? (
            <Link href="/pricing" className="text-brand-blue font-medium hover:underline">Upgrade for unlimited →</Link>
          ) : (
            <span className="text-ink-soft">{5 - aiWritingAssistsUsed} left</span>
          )}
        </div>
      )}
      <ProgressChecklist data={data} />

      <details className="group bg-white border-2 border-rule rounded-2xl px-5 py-2 open:pb-5">
        <summary className="cursor-pointer list-none flex items-center justify-between min-h-11 font-extrabold [&::-webkit-details-marker]:hidden">
          Design: colours, fonts, photo
          <span className="text-sm font-bold text-brand-blue group-open:hidden">Show</span>
          <span className="text-sm font-bold text-brand-blue hidden group-open:inline">Hide</span>
        </summary>
        <div className="space-y-8 mt-5">
      <Section title="Design">
        <p className="text-xs text-ink-soft mb-2">Accent color</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {ACCENT_COLORS.map((c) => {
            const active = (data.customization?.accentColor || DEFAULT_ACCENT_COLOR) === c.hex;
            return (
              <button
                key={c.id}
                onClick={() => updateCustomization("accentColor", c.hex)}
                title={c.label}
                aria-label={`Accent colour: ${c.label}`}
                aria-pressed={active}
                className={`w-10 h-10 rounded-full border-[3px] transition-transform ${active ? "border-ink scale-110" : "border-white hover:scale-105"} shadow-[0_0_0_1px_var(--rule)]`}
                style={{ backgroundColor: c.hex }}
              />
            );
          })}
        </div>
        <p className="text-xs text-ink-soft mb-2">Font pair</p>
        <div className="flex flex-wrap gap-2">
          {FONT_PAIRS.map((f) => {
            const active = (data.customization?.fontChoice || "editorial") === f.id;
            return (
              <button
                key={f.id}
                onClick={() => updateCustomization("fontChoice", f.id)}
                aria-pressed={active}
                className={`inline-flex items-center min-h-10 text-sm font-bold px-4 rounded-full border-2 ${active ? "border-ink bg-ink text-white" : "border-rule hover:border-ink"}`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Layout">
        <p className="text-xs text-ink-soft mb-2">Profile photo</p>
        <PhotoUpload
          state={{
            photoDataUrl: data.customization?.photoDataUrl,
            photoOriginalDataUrl: data.customization?.photoOriginalDataUrl,
            photoZoom: data.customization?.photoZoom,
            photoOffsetX: data.customization?.photoOffsetX,
            photoOffsetY: data.customization?.photoOffsetY,
            showPhoto: data.customization?.showPhoto,
          }}
          onChange={(next) => {
            setData((d) => ({ ...d, customization: { ...d.customization, ...next } }));
          }}
        />

        <div className="flex gap-6 mt-5">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={data.customization?.showDividers ?? true}
              onChange={(e) => updateCustomization("showDividers", e.target.checked)}
            />
            Section dividers
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={data.customization?.indentBullets ?? true}
              onChange={(e) => updateCustomization("indentBullets", e.target.checked)}
            />
            Indent bullets
          </label>
        </div>
      </Section>
        </div>
      </details>

      <Section title="Contact" id="section-contact">
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Full name" autoComplete="name" placeholder="Priya Sharma" value={data.contact.fullName} onChange={(v) => updateContact("fullName", v)} />
          <Input label="Email" type="email" autoComplete="email" placeholder="priya@email.com" value={data.contact.email} onChange={(v) => updateContact("email", v)} />
          <Input label="Phone" type="tel" autoComplete="tel" placeholder="+91 98765 43210" value={data.contact.phone ?? ""} onChange={(v) => updateContact("phone", v)} />
          <Input label="Location" autoComplete="address-level2" placeholder="Bengaluru, India" value={data.contact.location ?? ""} onChange={(v) => updateContact("location", v)} />
          <Input label="LinkedIn" type="url" placeholder="linkedin.com/in/yourname" value={data.contact.linkedin ?? ""} onChange={(v) => updateContact("linkedin", v)} />
          <Input label="Website" type="url" autoComplete="url" placeholder="yourname.com" value={data.contact.website ?? ""} onChange={(v) => updateContact("website", v)} />
        </div>
      </Section>

      <Section title="Summary" id="section-summary">
        <SummaryField data={data} setData={setData} guest={guest} />
      </Section>

      <Section title="Experience" id="section-experience" action={<AddButton onClick={addExperience} label="Add role" />}>
        {data.experience.length === 0 && (
          <EmptyHint onClick={addExperience} text="Add your most recent job first — internships and freelance work count too." />
        )}
        <div className="space-y-5">
          {data.experience.map((exp) => (
            <ExperienceCard
              key={exp.id}
              exp={exp}
              role={exp.role}
              guest={guest}
              onChange={(patch) => updateExperience(exp.id, patch)}
              onRemove={() => removeExperience(exp.id)}
            />
          ))}
        </div>
      </Section>

      <Section title="Education" id="section-education" action={<AddButton onClick={addEducation} label="Add school" />}>
        {data.education.length === 0 && (
          <EmptyHint onClick={addEducation} text="Add your degree, college or school." />
        )}
        <div className="space-y-3">
          {data.education.map((edu) => (
            <div key={edu.id} className="bg-white border border-rule rounded-xl p-3 space-y-2">
              <div className="grid sm:grid-cols-2 gap-2">
                <Input label="School / college" value={edu.school} onChange={(v) => updateEducation(edu.id, { school: v })} />
                <Input label="Degree" placeholder="B.Tech, Computer Science" value={edu.degree} onChange={(v) => updateEducation(edu.id, { degree: v })} />
                <MonthYearInput label="Start" value={edu.startDate} onChange={(v) => updateEducation(edu.id, { startDate: v })} />
                <MonthYearInput label="End (or expected)" value={edu.endDate} onChange={(v) => updateEducation(edu.id, { endDate: v })} />
              </div>
              <button onClick={() => removeEducation(edu.id)} className="min-h-10 text-sm font-bold text-red-600 hover:underline">
                Remove
              </button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Skills" id="section-skills">
        <CommaListInput
          value={data.skills}
          onChange={(skills) => setData((d) => ({ ...d, skills }))}
          placeholder="Comma-separated, e.g. Python, Excel, Project management"
        />
      </Section>

      <div className="pt-2 border-t border-rule">
        <p className="text-xs text-ink-soft mb-6">
          Optional sections — add the ones that help your story. Empty sections don&apos;t appear on your resume.
        </p>
        <div className="space-y-8">
          <Section title="Projects" action={<AddButton onClick={addProject} label="Add project" />}>
            <div className="space-y-3">
              {(data.projects ?? []).map((p) => (
                <div key={p.id} className="bg-white border border-rule rounded-xl p-3 space-y-2">
                  <div className="grid sm:grid-cols-2 gap-2">
                    <Input label="Project name" value={p.name} onChange={(v) => updateProject(p.id, { name: v })} />
                    <Input label="Link (optional)" type="url" placeholder="github.com/you/project" value={p.link ?? ""} onChange={(v) => updateProject(p.id, { link: v })} />
                  </div>
                  <label className="block">
                    <span className="text-sm font-bold text-slate">What you did and the result</span>
                    <textarea
                      value={p.description}
                      onChange={(e) => updateProject(p.id, { description: e.target.value })}
                      rows={2}
                      className="mt-1 w-full border-2 border-rule rounded-xl px-3 py-2.5 text-[15px] bg-white focus:outline-none focus:border-brand-blue"
                    />
                  </label>
                  <button onClick={() => removeProject(p.id)} className="min-h-10 text-sm font-bold text-red-600 hover:underline">Remove</button>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Certifications" action={<AddButton onClick={addCertification} label="Add certification" />}>
            <div className="space-y-3">
              {(data.certifications ?? []).map((c) => (
                <div key={c.id} className="bg-white border border-rule rounded-xl p-3 space-y-2">
                  <div className="grid sm:grid-cols-3 gap-2">
                    <Input label="Certification" placeholder="AWS Solutions Architect" value={c.name} onChange={(v) => updateCertification(c.id, { name: v })} />
                    <Input label="Issued by" placeholder="Amazon Web Services" value={c.issuer ?? ""} onChange={(v) => updateCertification(c.id, { issuer: v })} />
                    <MonthYearInput label="Date" value={c.date ?? ""} onChange={(v) => updateCertification(c.id, { date: v })} />
                  </div>
                  <button onClick={() => removeCertification(c.id)} className="min-h-10 text-sm font-bold text-red-600 hover:underline">Remove</button>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Achievements & awards">
            <LineListInput
              value={data.achievements ?? []}
              onChange={(achievements) => setData((d) => ({ ...d, achievements }))}
              placeholder={"One per line, e.g.\nEmployee of the Quarter, Q2 2025\nWon Smart India Hackathon 2023"}
            />
          </Section>

          <Section title="Languages">
            <CommaListInput
              value={data.languages ?? []}
              onChange={(languages) => setData((d) => ({ ...d, languages }))}
              placeholder="e.g. English (fluent), Hindi (native), German (basic)"
            />
          </Section>
        </div>
      </div>

    </div>
  );
}

// ---------- Guided progress ----------
// A lightweight step guide at the top of the form: shows which core sections
// are done and jumps to the next one, so a blank form never feels like a wall.

function ProgressChecklist({ data }: { data: ResumeData }) {
  const steps = [
    { id: "section-contact", label: "Contact", done: Boolean(data.contact.fullName.trim() && data.contact.email.trim()) },
    { id: "section-summary", label: "Summary", done: data.summary.trim().length > 0 },
    {
      id: "section-experience",
      label: "Experience",
      done: data.experience.some((e) => e.role.trim() && e.bullets.some((b) => b.trim())),
    },
    { id: "section-education", label: "Education", done: data.education.some((e) => e.school.trim() || e.degree.trim()) },
    { id: "section-skills", label: "Skills", done: data.skills.length >= 3 },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done);

  function jump(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="bg-white border border-rule rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="font-extrabold">
          {doneCount === steps.length ? "All core sections done ✓" : `Step ${doneCount + 1} of ${steps.length}`}
        </p>
        {next && (
          <button onClick={() => jump(next.id)} className="min-h-10 text-sm text-brand-blue font-bold hover:underline">
            Next: {next.label} →
          </button>
        )}
      </div>
      <div className="h-2.5 bg-sand rounded-full overflow-hidden mb-3">
        <div className="h-full bg-brand-blue rounded-full transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {steps.map((s) => (
          <button
            key={s.id}
            onClick={() => jump(s.id)}
            className={`inline-flex items-center min-h-9 text-sm font-bold px-3 rounded-full border-2 ${
              s.done ? "bg-brand-blue-soft border-transparent text-brand-blue-deep" : "border-rule text-slate hover:border-ink"
            }`}
          >
            {s.done ? "✓ " : ""}
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptyHint({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left text-[15px] text-slate border-2 border-dashed border-[#C9D1E3] rounded-2xl px-4 py-4 hover:border-brand-blue hover:text-ink bg-white/60"
    >
      + {text}
    </button>
  );
}

/** Shown in place of a real AI call when nobody is signed in - an explanation, not an error. */
function AiSignInHint() {
  return (
    <p className="text-xs text-ink-soft mt-1.5 bg-brand-blue-soft rounded-xl px-2 py-1.5">
      ✦ AI writing is free with an account (5 rewrites included).{" "}
      <Link href="/signup?continue=builder" className="text-brand-blue font-medium hover:underline">
        Create a free account
      </Link>{" "}
      — your draft comes with you.
    </p>
  );
}

function SummaryField({
  data,
  setData,
  guest = false,
}: {
  data: ResumeData;
  setData: React.Dispatch<React.SetStateAction<ResumeData>>;
  guest?: boolean;
}) {
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignInHint, setShowSignInHint] = useState(false);

  async function generate() {
    if (guest) {
      setShowSignInHint(true);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experience: data.experience, skills: data.skills, targetRole: data.experience[0]?.role }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) setOptions(body.options);
      else setError(body.error ?? "Couldn't generate summary options.");
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex gap-2 items-start">
        <textarea
          value={data.summary}
          onChange={(e) => setData((d) => ({ ...d, summary: e.target.value }))}
          rows={3}
          placeholder="2-3 sentence pitch: your role, years of experience, and what you're great at."
          className="flex-1 w-full border-2 border-rule rounded-xl px-3 py-2.5 text-[15px] bg-white focus:outline-none focus:border-brand-blue"
        />
        <button
          onClick={generate}
          disabled={loading}
          title="Generate with AI"
          className="btn-press inline-flex items-center min-h-10 px-3.5 rounded-full bg-brand-blue text-white text-sm font-bold shadow-[0_3px_0_var(--brand-blue-deep)] disabled:opacity-50 shrink-0"
        >
          {loading ? "…" : "✦ AI"}
        </button>
      </div>
      {showSignInHint && <AiSignInHint />}
      {error && (
        <p className="text-xs text-red-600 mt-1">
          {error}{" "}
          {error.toLowerCase().includes("upgrade") && (
            <Link href="/pricing" className="underline font-medium">See Pro →</Link>
          )}
        </p>
      )}
      {options.length > 0 && (
        <div className="mt-1.5 space-y-1">
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() => {
                setData((d) => ({ ...d, summary: opt }));
                setOptions([]);
              }}
              className="block w-full text-left text-sm bg-gold-soft border-2 border-transparent rounded-xl px-3 py-2.5 hover:border-gold-deep"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ExperienceCard({
  exp,
  role,
  guest = false,
  onChange,
  onRemove,
}: {
  exp: ExperienceEntry;
  role: string;
  guest?: boolean;
  onChange: (patch: Partial<ExperienceEntry>) => void;
  onRemove: () => void;
}) {
  const [signInHintFor, setSignInHintFor] = useState<number | null>(null);
  const [aiOptions, setAiOptions] = useState<Record<number, string[]>>({});
  const [loadingBullet, setLoadingBullet] = useState<number | null>(null);
  const [bulletError, setBulletError] = useState<Record<number, string>>({});

  function updateBullet(index: number, value: string) {
    const bullets = [...exp.bullets];
    bullets[index] = value;
    onChange({ bullets });
  }

  function addBullet() {
    onChange({ bullets: [...exp.bullets, ""] });
  }

  function removeBullet(index: number) {
    onChange({ bullets: exp.bullets.filter((_, i) => i !== index) });
  }

  async function polish(index: number) {
    const bullet = exp.bullets[index];
    if (!bullet?.trim()) {
      // Was previously a silent no-op here - clicking AI on an empty
      // bullet did nothing with zero feedback, which just looked broken.
      setBulletError((e) => ({ ...e, [index]: "Write something first, then click AI to polish it." }));
      return;
    }
    if (guest) {
      setSignInHintFor(index);
      return;
    }
    setBulletError((e) => ({ ...e, [index]: "" }));
    setLoadingBullet(index);
    try {
      const res = await fetch("/api/ai/generate-bullets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roughBullet: bullet, role: role || "professional" }),
      });
      const body = await res.json();
      if (res.ok) setAiOptions((o) => ({ ...o, [index]: body.options }));
      else setBulletError((e) => ({ ...e, [index]: body.error ?? "Couldn't generate suggestions." }));
    } catch {
      setBulletError((e) => ({ ...e, [index]: "Couldn't reach the server. Try again." }));
    } finally {
      setLoadingBullet(null);
    }
  }

  return (
    <div className="bg-white border-2 border-rule rounded-2xl p-4 sm:p-5 space-y-3">
      <div className="grid sm:grid-cols-2 gap-2">
        <Input label="Job title" placeholder="Marketing Manager" value={exp.role} onChange={(v) => onChange({ role: v })} />
        <Input label="Company" value={exp.company} onChange={(v) => onChange({ company: v })} />
        <MonthYearInput label="Start" value={exp.startDate} onChange={(v) => onChange({ startDate: v })} />
        <MonthYearInput label="End" value={exp.endDate} onChange={(v) => onChange({ endDate: v })} allowPresent />
      </div>
      <p className="text-xs text-ink-soft">
        Bullets: what you did + the result, with a number if you can (&ldquo;Cut onboarding time 30%&rdquo;).
      </p>

      <div className="space-y-2">
        {exp.bullets.map((b, i) => (
          <div key={i}>
            <div className="flex gap-2 items-start">
              <textarea
                value={b}
                onChange={(e) => updateBullet(i, e.target.value)}
                rows={2}
                aria-label={`Bullet ${i + 1}`}
                placeholder={i === 0 ? "e.g. Launched referral program that brought in 1,200 new users in 3 months" : ""}
                className="flex-1 border-2 border-rule rounded-xl px-3 py-2 text-[15px] bg-white focus:outline-none focus:border-brand-blue"
              />
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => polish(i)}
                  disabled={loadingBullet === i}
                  title="Rewrite with AI"
                  className="btn-press inline-flex items-center min-h-10 px-3.5 rounded-full bg-brand-blue text-white text-sm font-bold shadow-[0_3px_0_var(--brand-blue-deep)] disabled:opacity-50"
                >
                  {loadingBullet === i ? "…" : "✦ AI"}
                </button>
                <button onClick={() => removeBullet(i)} className="inline-flex items-center justify-center min-h-10 min-w-10 px-2 text-sm font-bold text-red-600 rounded-full hover:bg-red-50" aria-label="Remove bullet" title="Remove bullet">
                  ✕
                </button>
              </div>
            </div>
            {signInHintFor === i && <AiSignInHint />}
            {bulletError[i] && (
              <p className="text-xs text-red-600 mt-1">
                {bulletError[i]}{" "}
                {bulletError[i].toLowerCase().includes("upgrade") && (
                  <Link href="/pricing" className="underline font-medium">See Pro →</Link>
                )}
              </p>
            )}
            {aiOptions[i] && (
              <div className="mt-1.5 space-y-1">
                {aiOptions[i].map((opt, oi) => (
                  <button
                    key={oi}
                    onClick={() => {
                      updateBullet(i, opt);
                      setAiOptions((o) => ({ ...o, [i]: [] }));
                    }}
                    className="block w-full text-left text-sm bg-gold-soft border-2 border-transparent rounded-xl px-3 py-2.5 hover:border-gold-deep"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <button onClick={addBullet} className="min-h-10 text-sm font-bold text-brand-blue hover:underline">
          + Add bullet
        </button>
      </div>

      <button onClick={onRemove} className="min-h-10 text-sm font-bold text-red-600 hover:underline">
        Remove role
      </button>
    </div>
  );
}

// ---------- AI Agent panel ----------

type ChatMessage = { role: "user" | "assistant"; content: string; actions?: string[] };

function AgentPanel({
  data,
  setData,
}: {
  data: ResumeData;
  setData: React.Dispatch<React.SetStateAction<ResumeData>>;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeData: data,
          history: nextMessages.map((m) => ({ role: m.role, content: m.content })),
          userMessage: text,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setMessages((m) => [...m, { role: "assistant", content: body.error ?? "Something went wrong." }]);
        return;
      }
      setData(body.resumeData);
      setMessages((m) => [...m, { role: "assistant", content: body.reply, actions: body.actionsTaken }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl flex flex-col h-full">
      <div className="bg-white border border-rule rounded-xl p-4 mb-3">
        <p className="text-xs uppercase tracking-wide text-brand-blue font-bold mb-1">AI Resume Agent</p>
        <p className="text-sm text-ink-soft">
          Tell it what to change — &quot;tighten my summary&quot;, &quot;add a bullet about the Q3 migration
          project&quot;, &quot;remove my second job&quot; — and it edits the resume directly.
        </p>
      </div>

      <div className="flex-1 space-y-3 mb-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : ""}>
            <div
              className={`inline-block max-w-[85%] text-left rounded-xl px-3 py-2 text-sm ${
                m.role === "user" ? "bg-ink text-paper" : "bg-white border border-rule"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.actions && m.actions.length > 0 && (
                <ul className="mt-2 pt-2 border-t border-rule/40 space-y-0.5">
                  {m.actions.map((a, ai) => (
                    <li key={ai} className="text-xs text-brand-blue flex items-center gap-1">
                      <span>✓</span> {a}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
        {loading && <p className="text-sm text-ink-soft">Thinking…</p>}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="e.g. Add a bullet about leading the migration"
          className="flex-1 border-2 border-rule rounded-xl px-3 py-2.5 text-[15px] bg-white focus:outline-none focus:border-brand-blue"
        />
        <button
          onClick={send}
          disabled={loading}
          className="bg-brand-blue text-white text-sm px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-60"
        >
          Send
        </button>
      </div>
    </div>
  );
}

// ---------- Score panel (Rezi Score) ----------

export function ScorePanel({ data, plan }: { data: ResumeData; plan: Plan }) {
  const result = scoreResumeQuality(data);
  const isPro = plan === "pro";

  return (
    <div className="max-w-xl space-y-4">
      <div className="bg-white border border-rule rounded-xl p-6">
        <div className="flex items-center gap-4">
          <ScoreRing value={result.overall} size={80} strokeWidth={8} />
          <div>
            <p className="font-brand font-bold text-lg">Resume Score</p>
            <p className="text-sm text-ink-soft">
              {result.overall >= 80
                ? "Strong resume — minor polish left."
                : result.overall >= 50
                ? "Solid start — a few gaps to close."
                : "Early stage — fill in more sections on the Edit tab."}
            </p>
          </div>
        </div>
      </div>

      {!isPro && (() => {
        // Free users still get the single most useful next step - a score
        // with zero guidance is frustrating. The full per-section breakdown
        // stays Pro.
        const topTip = [...result.sections].sort((a, b) => a.score - b.score).find((sec) => sec.tips.length > 0);
        return (
          <>
            {topTip && (
              <div className="bg-white border border-rule rounded-xl p-4">
                <p className="text-xs uppercase tracking-wide text-brand-blue font-medium mb-1">Your next best fix</p>
                <p className="text-sm">
                  <span className="font-medium">{topTip.label}:</span> {topTip.tips[0]}
                </p>
              </div>
            )}
            <div className="bg-white border border-rule rounded-xl p-4 text-sm text-ink-soft flex items-center justify-between gap-3">
              <span>Pro shows a section-by-section breakdown with every tip.</span>
              <Link href="/pricing" className="text-brand-blue font-medium hover:underline shrink-0">
                See Pro →
              </Link>
            </div>
          </>
        );
      })()}

      {isPro && (
        <div className="space-y-3">
          {result.sections.map((s) => (
            <div key={s.key} className="bg-white border border-rule rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{s.label}</span>
                <span className="font-bold text-sm text-brand-blue">{s.score}</span>
              </div>
              <div className="h-1.5 bg-sand rounded-full overflow-hidden mb-2">
                <div className="h-full bg-brand-blue" style={{ width: `${s.score}%` }} />
              </div>
              {s.tips.length > 0 && (
                <ul className="space-y-1 mt-2">
                  {s.tips.map((tip, i) => (
                    <li key={i} className="text-xs text-ink-soft pl-3 relative before:content-['•'] before:absolute before:left-0">
                      {tip}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Job match panel ----------

export function JobMatchPanel({ data }: { data: ResumeData }) {
  const [jd, setJd] = useState("");
  const [result, setResult] = useState<AtsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Carry over a job description pasted into the homepage demo.
  useEffect(() => {
    try {
      const pending = window.localStorage.getItem("lettr_pending_jd");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only storage, must run after mount
      if (pending) setJd((current) => current || pending);
    } catch {
      // storage unavailable - nothing to restore
    }
  }, []);

  // Keyword matching is pure text analysis - it runs right here in the
  // browser, so it works for guests too and never fails silently on a
  // network/auth error.
  function check() {
    if (jd.trim().length < 30) {
      setError("Paste the full job description (at least a few sentences) to get a useful match.");
      setResult(null);
      return;
    }
    setError(null);
    setResult(scoreResumeAgainstJob(data, jd));
  }

  return (
    <div className="max-w-xl space-y-4">
      <Section title="Paste the job description">
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          rows={10}
          placeholder="Paste the full job posting here…"
          className="w-full border-2 border-rule rounded-xl px-3 py-2.5 text-[15px] bg-white focus:outline-none focus:border-brand-blue"
        />
        <button
          onClick={check}
          className="mt-2 bg-brand-blue text-white text-sm px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-60"
        >
          Check match score
        </button>
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </Section>

      {result && (
        <div className="bg-white border border-rule rounded-xl p-5">
          <div className="flex items-center gap-4 mb-4">
            <ScoreRing value={result.score} size={64} strokeWidth={8} />
            <p className="text-sm text-ink-soft">
              {result.matchedKeywords.length} of {result.totalKeywords} key terms found in your resume.
            </p>
          </div>

          <p className="text-xs uppercase tracking-wide text-ink-soft mb-1.5">Missing keywords</p>
          {result.missingKeywords.length > 0 && (
            <p className="text-xs text-ink-soft mb-2">
              Add the ones that are true for you to your skills, summary or bullets — then check again.
            </p>
          )}
          <div className="flex flex-wrap gap-2 mb-4">
            {result.missingKeywords.length === 0 ? (
              <span className="text-sm text-ink-soft">None — great coverage.</span>
            ) : (
              result.missingKeywords.map((k) => (
                <span key={k} className="text-xs font-bold bg-red-50 text-red-700 px-2 py-1 rounded-xl">
                  {k}
                </span>
              ))
            )}
          </div>

          <p className="text-xs uppercase tracking-wide text-ink-soft mb-1.5">Matched keywords</p>
          <div className="flex flex-wrap gap-2">
            {result.matchedKeywords.map((k) => (
              <span key={k} className="text-xs font-bold bg-brand-blue-soft text-brand-blue px-2 py-1 rounded-xl">
                {k}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Cover letter panel ----------

function CoverLetterPanel({ data }: { data: ResumeData }) {
  const [jd, setJd] = useState("");
  const [company, setCompany] = useState("");
  const [letter, setLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!jd.trim() || jd.trim().length < 10) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume: data, jobDescription: jd, companyName: company || undefined }),
      });
      const body = await res.json();
      if (res.ok) setLetter(body.letter);
      else setError(body.error ?? "Couldn't generate a cover letter.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <Section title="Target role">
        <Input label="Company (optional)" value={company} onChange={setCompany} />
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          rows={8}
          placeholder="Paste the job description…"
          className="w-full border-2 border-rule rounded-xl px-3 py-2.5 text-[15px] bg-white focus:outline-none focus:border-brand-blue mt-2"
        />
        <button
          onClick={generate}
          disabled={loading}
          className="mt-2 bg-brand-blue text-white text-sm px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Writing…" : "Generate cover letter"}
        </button>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </Section>

      {letter && (
        <div className="bg-white border border-rule rounded-xl p-5">
          <div className="flex justify-end mb-2">
            <button
              onClick={() => navigator.clipboard.writeText(letter)}
              className="text-xs text-ink-soft hover:text-ink"
            >
              Copy
            </button>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{letter}</p>
        </div>
      )}
    </div>
  );
}

// ---------- Resignation letter panel ----------

function ResignationLetterPanel({ initialName }: { initialName: string }) {
  const [employeeName, setEmployeeName] = useState(initialName);
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [lastDay, setLastDay] = useState("");
  const [tone, setTone] = useState<"warm" | "neutral" | "brief">("neutral");
  const [letter, setLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!employeeName.trim() || !companyName.trim() || !jobTitle.trim() || !lastDay.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/resignation-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeName, companyName, jobTitle, lastDay, tone }),
      });
      const body = await res.json();
      if (res.ok) setLetter(body.letter);
      else setError(body.error ?? "Couldn't generate a resignation letter.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <Section title="Details">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Your name" value={employeeName} onChange={setEmployeeName} />
          <Input label="Job title" value={jobTitle} onChange={setJobTitle} />
          <Input label="Company" value={companyName} onChange={setCompanyName} />
          <Input label="Last working day" value={lastDay} onChange={setLastDay} />
        </div>
        <label className="block mt-3">
          <span className="text-xs text-ink-soft">Tone</span>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as typeof tone)}
            className="mt-0.5 w-full border border-rule rounded-xl px-2 py-1.5 text-sm bg-white"
          >
            <option value="neutral">Neutral</option>
            <option value="warm">Warm &amp; appreciative</option>
            <option value="brief">Brief</option>
          </select>
        </label>
        <button
          onClick={generate}
          disabled={loading}
          className="mt-3 bg-brand-blue text-white text-sm px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Writing…" : "Generate resignation letter"}
        </button>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </Section>

      {letter && (
        <div className="bg-white border border-rule rounded-xl p-5">
          <div className="flex justify-end mb-2">
            <button
              onClick={() => navigator.clipboard.writeText(letter)}
              className="text-xs text-ink-soft hover:text-ink"
            >
              Copy
            </button>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{letter}</p>
        </div>
      )}
    </div>
  );
}

// ---------- Live preview ----------

export function ResumePreview({ data, template }: { data: ResumeData; template: string }) {
  const accentColor = data.customization?.accentColor || DEFAULT_ACCENT_COLOR;
  const fontPair = getFontPair(data.customization?.fontChoice);

  const overrideStyle = {
    "--seal": accentColor,
    "--seal-soft": softenHex(accentColor),
    "--seal-deep": darkenHex(accentColor),
    "--font-display": fontPair.display,
    "--font-sans": fontPair.body,
  } as React.CSSProperties;

  return (
    <div style={overrideStyle}>
      {template === "modern" ? (
        <ModernPreview data={data} />
      ) : template === "bold" ? (
        <BoldPreview data={data} />
      ) : template === "sidebar" ? (
        <SidebarPreview data={data} />
      ) : template === "minimal" ? (
        <MinimalPreview data={data} />
      ) : template === "executive" ? (
        <ExecutivePreview data={data} />
      ) : template === "technical" ? (
        <TechnicalPreview data={data} />
      ) : template === "timeline" ? (
        <TimelinePreview data={data} />
      ) : template === "elegant" ? (
        <ElegantPreview data={data} />
      ) : (
        <ClassicPreview data={data} dense={template === "compact"} />
      )}
    </div>
  );
}

const contactLine = (data: ResumeData) =>
  [data.contact.email, data.contact.phone, data.contact.location, data.contact.linkedin, data.contact.website]
    .filter(Boolean)
    .join("  •  ");

// Standard + Compact - serif name, understated hairline section rules
function ClassicPreview({ data, dense }: { data: ResumeData; dense: boolean }) {
  const showDividers = data.customization?.showDividers ?? true;
  const indent = data.customization?.indentBullets ?? true;
  const photo = data.customization?.showPhoto ? data.customization?.photoDataUrl : undefined;
  const heading = `text-xs uppercase tracking-wide font-mono text-seal mt-5 mb-1 pb-1 ${showDividers ? "border-b border-rule" : ""}`;

  return (
    <div
      className={`paper-sheet rounded-sm mx-auto max-w-2xl ${dense ? "p-6 text-[13px]" : "p-10"}`}
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <div className="flex items-center gap-4">
        {photo && <img src={photo} alt="" className="w-16 h-16 rounded-full object-cover shrink-0" />}
        <div>
          <h2 className="font-display font-bold text-2xl">{data.contact.fullName || "Your Name"}</h2>
          <p className="text-xs text-ink-soft mt-1">{contactLine(data)}</p>
        </div>
      </div>

      {data.summary && (
        <>
          <h3 className={heading}>Summary</h3>
          <p className="text-sm leading-relaxed">{data.summary}</p>
        </>
      )}

      {data.experience.length > 0 && (
        <>
          <h3 className={heading}>Experience</h3>
          {data.experience.map((exp) => (
            <div key={exp.id} className="mt-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">
                  {exp.role || "Role"} {exp.company && `— ${exp.company}`}
                </span>
                <span className="text-xs text-ink-soft font-mono">
                  {exp.startDate} – {exp.endDate}
                </span>
              </div>
              <ul className="mt-1 space-y-0.5">
                {exp.bullets.filter(Boolean).map((b, i) => (
                  <li
                    key={i}
                    className={indent ? "text-sm pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-seal" : "text-sm"}
                  >
                    {!indent && <span className="text-seal">• </span>}
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}

      {data.education.length > 0 && (
        <>
          <h3 className={heading}>Education</h3>
          {data.education.map((edu) => (
            <div key={edu.id} className="flex justify-between text-sm mt-1">
              <span className="font-medium">
                {edu.degree || "Degree"} {edu.school && `— ${edu.school}`}
              </span>
              <span className="text-xs text-ink-soft font-mono">
                {edu.startDate} – {edu.endDate}
              </span>
            </div>
          ))}
        </>
      )}

      {data.skills.length > 0 && (
        <>
          <h3 className={heading}>Skills</h3>
          <p className="text-sm">{data.skills.join(" • ")}</p>
        </>
      )}
      <ExtraSectionsPreview data={data} headingClassName={heading} />
    </div>
  );
}

// Modern - sans-serif, colored header band, left-accent section headers, skill chips
function ModernPreview({ data }: { data: ResumeData }) {
  const showDividers = data.customization?.showDividers ?? true;
  const indent = data.customization?.indentBullets ?? true;
  const modernHeading = `text-xs uppercase tracking-wide font-semibold text-seal mt-4 mb-1.5 ${showDividers ? "pl-2 border-l-2 border-seal" : ""}`;

  return (
    <div className="paper-sheet rounded-sm mx-auto max-w-2xl overflow-hidden" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="bg-ink text-paper px-8 py-6 flex items-center gap-4">
        {(data.customization?.showPhoto && data.customization?.photoDataUrl) && (
          <img src={data.customization.photoDataUrl} alt="" className="w-16 h-16 rounded-full object-cover shrink-0 border-2 border-white/30" />
        )}
        <div>
          <h2 className="font-bold text-2xl tracking-tight">{data.contact.fullName || "Your Name"}</h2>
          <p className="text-xs opacity-80 mt-1">{contactLine(data)}</p>
        </div>
      </div>
      <div className="p-8">
        {data.summary && (
          <>
            <h3 className={modernHeading}>Summary</h3>
            <p className="text-sm leading-relaxed mb-4">{data.summary}</p>
          </>
        )}

        {data.experience.length > 0 && (
          <>
            <h3 className={modernHeading}>Experience</h3>
            {data.experience.map((exp) => (
              <div key={exp.id} className="mt-3">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">{exp.role || "Role"}</span>
                  <span className="text-xs text-ink-soft font-mono">
                    {exp.startDate} – {exp.endDate}
                  </span>
                </div>
                <p className="text-xs text-ink-soft mb-1">{exp.company}</p>
                <ul className="space-y-0.5">
                  {exp.bullets.filter(Boolean).map((b, i) => (
                    <li
                      key={i}
                      className={indent ? "text-sm pl-4 relative before:content-['—'] before:absolute before:left-0 before:text-seal" : "text-sm"}
                    >
                      {!indent && <span className="text-seal">— </span>}
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </>
        )}

        {data.education.length > 0 && (
          <>
            <h3 className={modernHeading}>Education</h3>
            {data.education.map((edu) => (
              <div key={edu.id} className="flex justify-between text-sm mt-1">
                <span className="font-medium">
                  {edu.degree || "Degree"} {edu.school && `— ${edu.school}`}
                </span>
                <span className="text-xs text-ink-soft font-mono">
                  {edu.startDate} – {edu.endDate}
                </span>
              </div>
            ))}
          </>
        )}

        {data.skills.length > 0 && (
          <>
            <h3 className={modernHeading}>Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {data.skills.map((s) => (
                <span key={s} className="text-xs bg-seal-soft text-seal px-2 py-0.5 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          </>
        )}
        <ExtraSectionsPreview data={data} headingClassName={modernHeading} />
      </div>
    </div>
  );
}

// Bold - large uppercase name, heavy rule, uppercase blocked section titles
function BoldPreview({ data }: { data: ResumeData }) {
  const showDividers = data.customization?.showDividers ?? true;
  const indent = data.customization?.indentBullets ?? true;
  const photo = data.customization?.showPhoto ? data.customization?.photoDataUrl : undefined;
  const boldHeading = showDividers
    ? "text-sm uppercase tracking-widest font-bold bg-ink text-paper inline-block px-2 py-0.5 mt-6 mb-2"
    : "text-sm uppercase tracking-widest font-bold text-ink mt-6 mb-2";

  return (
    <div className="paper-sheet rounded-sm mx-auto max-w-2xl p-10" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="flex items-center gap-4">
        {photo && <img src={photo} alt="" className="w-20 h-20 rounded-full object-cover shrink-0" />}
        <div>
          <h2 className="font-display font-bold text-4xl uppercase tracking-tight leading-none">
            {data.contact.fullName || "Your Name"}
          </h2>
          <div className="h-1 bg-seal w-16 my-3" />
          <p className="text-xs text-ink-soft">{contactLine(data)}</p>
        </div>
      </div>

      {data.summary && (
        <>
          <h3 className={boldHeading}>Summary</h3>
          <p className="text-sm leading-relaxed">{data.summary}</p>
        </>
      )}

      {data.experience.length > 0 && (
        <>
          <h3 className={boldHeading}>Experience</h3>
          {data.experience.map((exp) => (
            <div key={exp.id} className="mt-3">
              <div className="flex justify-between text-sm">
                <span className="font-bold uppercase tracking-wide">
                  {exp.role || "Role"} <span className="font-normal normal-case text-ink-soft">— {exp.company}</span>
                </span>
                <span className="text-xs text-ink-soft font-mono">
                  {exp.startDate} – {exp.endDate}
                </span>
              </div>
              <ul className="mt-1 space-y-0.5">
                {exp.bullets.filter(Boolean).map((b, i) => (
                  <li
                    key={i}
                    className={indent ? "text-sm pl-4 relative before:content-['▸'] before:absolute before:left-0 before:text-seal before:font-bold" : "text-sm"}
                  >
                    {!indent && <span className="text-seal font-bold">▸ </span>}
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}

      {data.education.length > 0 && (
        <>
          <h3 className={boldHeading}>Education</h3>
          {data.education.map((edu) => (
            <div key={edu.id} className="flex justify-between text-sm mt-1">
              <span className="font-bold">
                {edu.degree || "Degree"} <span className="font-normal text-ink-soft">— {edu.school}</span>
              </span>
              <span className="text-xs text-ink-soft font-mono">
                {edu.startDate} – {edu.endDate}
              </span>
            </div>
          ))}
        </>
      )}

      {data.skills.length > 0 && (
        <>
          <h3 className={boldHeading}>Skills</h3>
          <p className="text-sm font-medium">{data.skills.join("  /  ")}</p>
        </>
      )}
      <ExtraSectionsPreview data={data} headingClassName={boldHeading} />
    </div>
  );
}

// Sidebar - two-column, contact/skills in a colored side rail
function SidebarPreview({ data }: { data: ResumeData }) {
  const showDividers = data.customization?.showDividers ?? true;
  const indent = data.customization?.indentBullets ?? true;
  const photo = data.customization?.showPhoto ? data.customization?.photoDataUrl : undefined;
  const sideDivider = showDividers ? "border-t border-white/20 pt-4" : "";

  return (
    <div className="paper-sheet rounded-sm mx-auto max-w-2xl overflow-hidden grid grid-cols-[1fr_2fr]" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="bg-seal text-white p-6">
        {photo && (
          <img src={photo} alt="" className="w-20 h-20 rounded-full object-cover mb-4 border-2 border-white/40" />
        )}
        <h2 className="font-display font-bold text-xl leading-tight mb-4">{data.contact.fullName || "Your Name"}</h2>
        <div className="space-y-1 text-xs opacity-90 mb-6">
          {[data.contact.email, data.contact.phone, data.contact.location, data.contact.linkedin, data.contact.website]
            .filter(Boolean)
            .map((line, i) => (
              <p key={i} className="break-words">{line}</p>
            ))}
        </div>
        {data.skills.length > 0 && (
          <div className={`mt-6 ${sideDivider}`}>
            <h3 className="text-[10px] uppercase tracking-widest font-bold mb-2 opacity-80">Skills</h3>
            <div className="flex flex-wrap gap-1">
              {data.skills.map((s) => (
                <span key={s} className="text-[10px] bg-white/15 rounded-sm px-1.5 py-0.5">{s}</span>
              ))}
            </div>
          </div>
        )}
        {data.education.length > 0 && (
          <div className={`mt-6 ${sideDivider}`}>
            <h3 className="text-[10px] uppercase tracking-widest font-bold mb-2 opacity-80">Education</h3>
            {data.education.map((edu) => (
              <div key={edu.id} className="text-xs mb-2">
                <p className="font-semibold">{edu.degree}</p>
                <p className="opacity-80">{edu.school}</p>
                <p className="opacity-70 text-[10px]">{edu.startDate} – {edu.endDate}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="p-6">
        {data.summary && (
          <>
            <h3 className="text-xs uppercase tracking-wide text-seal font-semibold mb-1.5">Summary</h3>
            <p className="text-sm leading-relaxed mb-4">{data.summary}</p>
          </>
        )}
        {data.experience.length > 0 && (
          <>
            <h3 className="text-xs uppercase tracking-wide text-seal font-semibold mb-1.5">Experience</h3>
            {data.experience.map((exp) => (
              <div key={exp.id} className="mt-3">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">{exp.role || "Role"}</span>
                  <span className="text-xs text-ink-soft font-mono">{exp.startDate} – {exp.endDate}</span>
                </div>
                <p className="text-xs text-ink-soft mb-1">{exp.company}</p>
                <ul className="space-y-0.5">
                  {exp.bullets.filter(Boolean).map((b, i) => (
                    <li
                      key={i}
                      className={indent ? "text-sm pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-seal" : "text-sm"}
                    >
                      {!indent && <span className="text-seal">• </span>}
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </>
        )}
        <ExtraSectionsPreview data={data} headingClassName="text-xs uppercase tracking-wide text-seal font-semibold mt-4 mb-1.5" />
      </div>
    </div>
  );
}

// Minimal - zero color, maximum ATS-parser safety, pure typographic hierarchy
function MinimalPreview({ data }: { data: ResumeData }) {
  const showDividers = data.customization?.showDividers ?? true;
  const indent = data.customization?.indentBullets ?? true;
  const minimalHeading = `text-xs font-bold uppercase mt-5 mb-1 ${showDividers ? "border-b border-black pb-0.5" : ""}`;

  return (
    <div className="paper-sheet rounded-sm mx-auto max-w-2xl p-10 text-black" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div className="flex items-center gap-4 mb-1">
        {(data.customization?.showPhoto && data.customization?.photoDataUrl) && (
          <img src={data.customization.photoDataUrl} alt="" className="w-14 h-14 rounded-full object-cover shrink-0 grayscale" />
        )}
        <div>
          <h2 className="text-2xl font-bold">{data.contact.fullName || "Your Name"}</h2>
          <p className="text-xs mt-1">{contactLine(data)}</p>
        </div>
      </div>

      {data.summary && (
        <>
          <h3 className={minimalHeading}>Summary</h3>
          <p className="text-sm leading-relaxed">{data.summary}</p>
        </>
      )}
      {data.experience.length > 0 && (
        <>
          <h3 className={minimalHeading}>Experience</h3>
          {data.experience.map((exp) => (
            <div key={exp.id} className="mt-2">
              <p className="text-sm font-bold">{exp.role || "Role"}, {exp.company}</p>
              <p className="text-xs">{exp.startDate} - {exp.endDate}</p>
              <ul className="mt-1">
                {exp.bullets.filter(Boolean).map((b, i) => (
                  <li key={i} className={indent ? "text-sm pl-3" : "text-sm"}>- {b}</li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}
      {data.education.length > 0 && (
        <>
          <h3 className={minimalHeading}>Education</h3>
          {data.education.map((edu) => (
            <p key={edu.id} className="text-sm">{edu.degree}, {edu.school} ({edu.startDate} - {edu.endDate})</p>
          ))}
        </>
      )}
      {data.skills.length > 0 && (
        <>
          <h3 className={minimalHeading}>Skills</h3>
          <p className="text-sm">{data.skills.join(", ")}</p>
        </>
      )}
      <ExtraSectionsPreview data={data} headingClassName={minimalHeading} />
    </div>
  );
}

// Executive - large refined serif name, generous whitespace, thin accent rule
function ExecutivePreview({ data }: { data: ResumeData }) {
  const showDividers = data.customization?.showDividers ?? true;
  const indent = data.customization?.indentBullets ?? true;
  const photo = data.customization?.showPhoto ? data.customization?.photoDataUrl : undefined;

  return (
    <div className="paper-sheet rounded-sm mx-auto max-w-2xl p-12" style={{ fontFamily: "var(--font-sans)" }}>
      {photo && (
        <img src={photo} alt="" className="w-20 h-20 rounded-full object-cover mx-auto mb-3" />
      )}
      <h2 className="font-display text-3xl text-center mb-1">{data.contact.fullName || "Your Name"}</h2>
      {showDividers && <div className="h-px bg-seal w-24 mx-auto my-3" />}
      <p className="text-xs text-ink-soft text-center mb-8">{contactLine(data)}</p>

      {data.summary && <p className="text-sm text-center leading-relaxed mb-8 italic text-ink-soft">{data.summary}</p>}

      {data.experience.length > 0 && (
        <>
          <h3 className="text-xs uppercase tracking-[0.2em] text-seal text-center mb-4">Experience</h3>
          {data.experience.map((exp) => (
            <div key={exp.id} className="mt-4 text-center">
              <p className="font-display text-base">{exp.role || "Role"}</p>
              <p className="text-xs text-ink-soft mb-1">{exp.company} · {exp.startDate} – {exp.endDate}</p>
              <ul className="text-sm max-w-md mx-auto text-left mt-2 space-y-0.5">
                {exp.bullets.filter(Boolean).map((b, i) => (
                  <li
                    key={i}
                    className={indent ? "pl-3 relative before:content-['—'] before:absolute before:left-0 before:text-seal" : ""}
                  >
                    {!indent && <span className="text-seal">— </span>}
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}
      {data.education.length > 0 && (
        <>
          <h3 className="text-xs uppercase tracking-[0.2em] text-seal text-center mt-8 mb-3">Education</h3>
          {data.education.map((edu) => (
            <p key={edu.id} className="text-sm text-center">{edu.degree} — {edu.school}</p>
          ))}
        </>
      )}
      {data.skills.length > 0 && (
        <p className="text-sm text-center mt-8 text-ink-soft">{data.skills.join(" · ")}</p>
      )}
      <ExtraSectionsPreview data={data} headingClassName="text-xs uppercase tracking-[0.2em] text-seal text-center mt-8 mb-3" variant="center" />
    </div>
  );
}

// Technical - monospace accents for engineers, left-aligned dense structure
function TechnicalPreview({ data }: { data: ResumeData }) {
  const showDividers = data.customization?.showDividers ?? true;
  const indent = data.customization?.indentBullets ?? true;
  const photo = data.customization?.showPhoto ? data.customization?.photoDataUrl : undefined;

  return (
    <div className="paper-sheet rounded-sm mx-auto max-w-2xl p-8" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="flex items-center gap-4">
        {photo && <img src={photo} alt="" className="w-14 h-14 rounded-sm object-cover shrink-0" />}
        <div>
          <h2 className="font-mono font-bold text-xl">{data.contact.fullName || "Your Name"}</h2>
          <p className="font-mono text-xs text-seal mt-1">{contactLine(data)}</p>
        </div>
      </div>

      {data.summary && (
        <>
          <h3 className="font-mono text-xs text-ink-soft mt-5 mb-1">// summary</h3>
          <p className="text-sm leading-relaxed">{data.summary}</p>
        </>
      )}
      {data.experience.length > 0 && (
        <>
          <h3 className="font-mono text-xs text-ink-soft mt-5 mb-1">// experience</h3>
          {data.experience.map((exp) => (
            <div key={exp.id} className={`mt-3 ${showDividers ? "border-l-2 border-seal pl-3" : ""}`}>
              <p className="font-mono text-sm font-semibold">{exp.role || "role"}<span className="text-seal">()</span> <span className="text-ink-soft font-normal">@ {exp.company}</span></p>
              <p className="font-mono text-[10px] text-ink-soft">{exp.startDate} – {exp.endDate}</p>
              <ul className="mt-1 space-y-0.5">
                {exp.bullets.filter(Boolean).map((b, i) => (
                  <li
                    key={i}
                    className={indent ? "text-sm pl-3 relative before:content-['>'] before:absolute before:left-0 before:text-seal before:font-mono" : "text-sm"}
                  >
                    {!indent && <span className="text-seal font-mono">&gt; </span>}
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}
      {data.education.length > 0 && (
        <>
          <h3 className="font-mono text-xs text-ink-soft mt-5 mb-1">// education</h3>
          {data.education.map((edu) => (
            <p key={edu.id} className="text-sm">{edu.degree} — {edu.school}</p>
          ))}
        </>
      )}
      {data.skills.length > 0 && (
        <>
          <h3 className="font-mono text-xs text-ink-soft mt-5 mb-1">// stack</h3>
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map((s) => (
              <span key={s} className="font-mono text-xs bg-seal-soft text-seal-deep px-1.5 py-0.5 rounded-sm">{s}</span>
            ))}
          </div>
        </>
      )}
      <ExtraSectionsPreview data={data} headingClassName="font-mono text-xs text-ink-soft mt-5 mb-1" variant="code" />
    </div>
  );
}

// Timeline - visual connecting line down the left of experience entries
function TimelinePreview({ data }: { data: ResumeData }) {
  const showDividers = data.customization?.showDividers ?? true;
  const indent = data.customization?.indentBullets ?? true;
  const photo = data.customization?.showPhoto ? data.customization?.photoDataUrl : undefined;

  return (
    <div className="paper-sheet rounded-sm mx-auto max-w-2xl p-10" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="flex items-center gap-4">
        {photo && <img src={photo} alt="" className="w-16 h-16 rounded-full object-cover shrink-0" />}
        <div>
          <h2 className="font-display font-bold text-2xl">{data.contact.fullName || "Your Name"}</h2>
          <p className="text-xs text-ink-soft mt-1">{contactLine(data)}</p>
        </div>
      </div>
      <div className="mb-6" />

      {data.summary && <p className="text-sm leading-relaxed mb-6">{data.summary}</p>}

      {data.experience.length > 0 && (
        <>
          <h3 className="text-xs uppercase tracking-wide text-seal font-semibold mb-3">Experience</h3>
          <div className={`relative pl-5 space-y-5 ${showDividers ? "border-l-2 border-rule" : ""}`}>
            {data.experience.map((exp) => (
              <div key={exp.id} className="relative">
                <span className="absolute -left-[26px] top-1 w-3 h-3 rounded-full bg-seal border-2 border-paper-raised" />
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">{exp.role || "Role"}</span>
                  <span className="text-xs text-ink-soft font-mono">{exp.startDate} – {exp.endDate}</span>
                </div>
                <p className="text-xs text-ink-soft mb-1">{exp.company}</p>
                <ul className="space-y-0.5">
                  {exp.bullets.filter(Boolean).map((b, i) => (
                    <li
                      key={i}
                      className={indent ? "text-sm pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-seal" : "text-sm"}
                    >
                      {!indent && <span className="text-seal">• </span>}
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
      {data.education.length > 0 && (
        <>
          <h3 className="text-xs uppercase tracking-wide text-seal font-semibold mt-6 mb-2">Education</h3>
          {data.education.map((edu) => (
            <p key={edu.id} className="text-sm">{edu.degree} — {edu.school} <span className="text-ink-soft text-xs">({edu.startDate}–{edu.endDate})</span></p>
          ))}
        </>
      )}
      {data.skills.length > 0 && (
        <p className="text-sm mt-6 text-ink-soft">{data.skills.join(" • ")}</p>
      )}
      <ExtraSectionsPreview data={data} headingClassName="text-xs uppercase tracking-wide text-seal font-semibold mt-6 mb-2" />
    </div>
  );
}

// Elegant - thin hairlines, italic role titles, understated color
function ElegantPreview({ data }: { data: ResumeData }) {
  const showDividers = data.customization?.showDividers ?? true;
  const indent = data.customization?.indentBullets ?? true;
  const photo = data.customization?.showPhoto ? data.customization?.photoDataUrl : undefined;

  return (
    <div className="paper-sheet rounded-sm mx-auto max-w-2xl p-10" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="flex items-center gap-4">
        {photo && <img src={photo} alt="" className="w-16 h-16 rounded-full object-cover shrink-0" />}
        <h2 className="font-display text-2xl">{data.contact.fullName || "Your Name"}</h2>
      </div>
      <p className={`text-xs text-ink-soft mt-1 pb-4 ${showDividers ? "border-b border-rule" : ""}`}>{contactLine(data)}</p>

      {data.summary && <p className="text-sm leading-relaxed mt-4 mb-2">{data.summary}</p>}

      {data.experience.length > 0 && (
        <>
          <h3 className="text-[11px] uppercase tracking-[0.15em] text-seal mt-6 mb-2">Experience</h3>
          {data.experience.map((exp) => (
            <div key={exp.id} className={`mt-3 pb-3 ${showDividers ? "border-b border-rule/60 last:border-0" : ""}`}>
              <div className="flex justify-between">
                <span className="text-sm italic">{exp.role || "Role"}, {exp.company}</span>
                <span className="text-xs text-ink-soft">{exp.startDate} – {exp.endDate}</span>
              </div>
              <ul className="mt-1 space-y-0.5">
                {exp.bullets.filter(Boolean).map((b, i) => (
                  <li
                    key={i}
                    className={indent ? "text-sm pl-3 relative before:content-['·'] before:absolute before:left-0 before:text-seal" : "text-sm"}
                  >
                    {!indent && <span className="text-seal">· </span>}
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}
      {data.education.length > 0 && (
        <>
          <h3 className="text-[11px] uppercase tracking-[0.15em] text-seal mt-6 mb-2">Education</h3>
          {data.education.map((edu) => (
            <p key={edu.id} className="text-sm italic">{edu.degree}, {edu.school}</p>
          ))}
        </>
      )}
      {data.skills.length > 0 && (
        <p className="text-sm mt-6 text-ink-soft">{data.skills.join("  ·  ")}</p>
      )}
      <ExtraSectionsPreview data={data} headingClassName="text-[11px] uppercase tracking-[0.15em] text-seal mt-6 mb-2" />
    </div>
  );
}

// ---------- Optional sections (Projects, Certifications, Languages, Achievements) ----------
// Shared by every template so a new optional section only has to be added
// once. Each template passes its own heading style so it still looks native.

function ExtraSectionsPreview({
  data,
  headingClassName,
  variant,
}: {
  data: ResumeData;
  headingClassName: string;
  variant?: "center" | "code";
}) {
  const { projects, certifications, languages, achievements } = extraSections(data);
  const center = variant === "center";
  const title = (t: string) => (variant === "code" ? `// ${t.toLowerCase()}` : t);
  const align = center ? "text-center" : "";

  return (
    <>
      {projects.length > 0 && (
        <>
          <h3 className={headingClassName}>{title("Projects")}</h3>
          {projects.map((p) => (
            <div key={p.id} className={`mt-2 text-sm ${align}`}>
              <p className="font-medium">
                {p.name}
                {p.link && <span className="text-xs text-ink-soft font-normal"> · {p.link}</span>}
              </p>
              {p.description && <p className="text-sm text-ink-soft leading-relaxed">{p.description}</p>}
            </div>
          ))}
        </>
      )}
      {certifications.length > 0 && (
        <>
          <h3 className={headingClassName}>{title("Certifications")}</h3>
          {certifications.map((c) => (
            <p key={c.id} className={`text-sm mt-1 ${align}`}>
              <span className="font-medium">{c.name}</span>
              {c.issuer && <span className="text-ink-soft"> — {c.issuer}</span>}
              {c.date && <span className="text-xs text-ink-soft"> ({c.date})</span>}
            </p>
          ))}
        </>
      )}
      {achievements.length > 0 && (
        <>
          <h3 className={headingClassName}>{title("Achievements")}</h3>
          <ul className={`space-y-0.5 ${align}`}>
            {achievements.map((a, i) => (
              <li key={i} className="text-sm">• {a}</li>
            ))}
          </ul>
        </>
      )}
      {languages.length > 0 && (
        <>
          <h3 className={headingClassName}>{title("Languages")}</h3>
          <p className={`text-sm ${align}`}>{languages.join(" • ")}</p>
        </>
      )}
    </>
  );
}

// ---------- Shared small components ----------

function Section({
  title,
  action,
  children,
  id,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <div id={id} className="scroll-mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-brand font-extrabold text-xl tracking-tight text-ink">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="inline-flex items-center min-h-10 px-3.5 rounded-full bg-brand-blue-soft text-brand-blue-deep text-sm font-bold hover:bg-brand-blue hover:text-white transition-colors">
      + {label}
    </button>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "email" | "tel" | "url";
  placeholder?: string;
  autoComplete?: string;
}) {
  // URLs are typed without "https://" by most people - a strict type="url"
  // field would reject that, so we only borrow its mobile keyboard.
  const inputMode = type === "url" ? "url" : type === "tel" ? "tel" : type === "email" ? "email" : undefined;
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate">{label}</span>
      <input
        type={type === "url" ? "text" : type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border-2 border-rule rounded-xl px-3 min-h-11 text-[15px] bg-white placeholder:text-ink-soft/50 focus:outline-none focus:border-brand-blue invalid:border-red-400"
      />
    </label>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Parses the formats people actually type ("Jan 2022", "January 2022", "01/2022", "2022-01", "2022"). */
function parseMonthYear(value: string): { month: string; year: string } | null {
  const v = value.trim();
  if (!v) return { month: "", year: "" };
  let m = v.match(/^([A-Za-z]{3,9})\.?\s+(\d{4})$/);
  if (m) {
    const idx = MONTHS.findIndex((mo) => mo.toLowerCase() === m![1].slice(0, 3).toLowerCase());
    return idx >= 0 ? { month: MONTHS[idx], year: m[2] } : null;
  }
  m = v.match(/^(\d{1,2})[/-](\d{4})$/);
  if (m && +m[1] >= 1 && +m[1] <= 12) return { month: MONTHS[+m[1] - 1], year: m[2] };
  m = v.match(/^(\d{4})-(\d{1,2})$/);
  if (m && +m[2] >= 1 && +m[2] <= 12) return { month: MONTHS[+m[2] - 1], year: m[1] };
  m = v.match(/^(\d{4})$/);
  if (m) return { month: "", year: m[1] };
  return null;
}

/**
 * Month + year dropdowns that still store a plain, human-readable string
 * ("Jan 2022") so every template, the PDF and the DOCX keep working
 * unchanged. Anything we can't parse (e.g. an old "Summer 2019" entry) is
 * left as editable text rather than silently wiped.
 */
function MonthYearInput({
  label,
  value,
  onChange,
  allowPresent = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  allowPresent?: boolean;
}) {
  const isPresent = allowPresent && value.trim().toLowerCase() === "present";
  const parsed = isPresent ? { month: "", year: "" } : parseMonthYear(value);
  const [freeText, setFreeText] = useState(parsed === null);
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 60 }, (_, i) => String(thisYear + 5 - i));
  const selectCls =
    "border-2 border-rule rounded-xl px-2 min-h-11 text-[15px] bg-white focus:outline-none focus:border-brand-blue disabled:opacity-50";

  if (freeText) {
    return (
      <label className="block">
        <span className="text-sm font-bold text-slate">{label}</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full border-2 border-rule rounded-xl px-3 min-h-11 text-[15px] bg-white focus:outline-none focus:border-brand-blue"
        />
        <button type="button" onClick={() => { setFreeText(false); onChange(""); }} className="text-[11px] text-brand-blue hover:underline mt-0.5">
          Use month/year picker
        </button>
      </label>
    );
  }

  const month = parsed?.month ?? "";
  const year = parsed?.year ?? "";
  const emit = (m: string, y: string) => onChange(y ? (m ? `${m} ${y}` : y) : "");

  return (
    <div>
      <span className="text-sm font-bold text-slate">{label}</span>
      <div className="mt-0.5 flex gap-1.5">
        <select
          aria-label={`${label} month`}
          value={month}
          disabled={isPresent}
          onChange={(e) => emit(e.target.value, year || String(thisYear))}
          className={`${selectCls} flex-1 min-w-0`}
        >
          <option value="">Month</option>
          {MONTHS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          aria-label={`${label} year`}
          value={year}
          disabled={isPresent}
          onChange={(e) => emit(month, e.target.value)}
          className={`${selectCls} flex-1 min-w-0`}
        >
          <option value="">Year</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      {allowPresent && (
        <label className="flex items-center gap-1.5 text-xs text-ink-soft mt-1">
          <input type="checkbox" checked={isPresent} onChange={(e) => onChange(e.target.checked ? "Present" : "")} />
          I currently work here
        </label>
      )}
    </div>
  );
}

/**
 * Comma-separated list input that keeps the raw text while typing - parsing
 * on every keystroke would eat a trailing comma/space and make it
 * impossible to type the next item naturally.
 */
function CommaListInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  // While focused we show exactly what they typed; otherwise we show the
  // canonical list (so changes from the AI agent or an import still appear).
  const [text, setText] = useState(value.join(", "));
  const [focused, setFocused] = useState(false);
  return (
    <input
      value={focused ? text : value.join(", ")}
      onFocus={() => {
        setText(value.join(", "));
        setFocused(true);
      }}
      onChange={(e) => {
        setText(e.target.value);
        onChange(e.target.value.split(",").map((x) => x.trim()).filter(Boolean));
      }}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      className="w-full border-2 border-rule rounded-xl px-3 py-2.5 text-[15px] bg-white placeholder:text-ink-soft/50 focus:outline-none focus:border-brand-blue"
    />
  );
}

/** One item per line - for achievements, where items often contain commas. */
function LineListInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState(value.join("\n"));
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      value={focused ? text : value.join("\n")}
      rows={3}
      onFocus={() => {
        setText(value.join("\n"));
        setFocused(true);
      }}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        setText(e.target.value);
        onChange(e.target.value.split("\n").map((x) => x.trim()).filter(Boolean));
      }}
      placeholder={placeholder}
      className="w-full border-2 border-rule rounded-xl px-3 py-2.5 text-[15px] bg-white placeholder:text-ink-soft/50 focus:outline-none focus:border-brand-blue"
    />
  );
}
