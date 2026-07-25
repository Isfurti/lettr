"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ResumeData, ExperienceEntry, EducationEntry } from "@/lib/types";
import type { AtsResult } from "@/lib/ats-score";
import { scoreResumeQuality } from "@/lib/resume-score";
import type { Plan } from "@/lib/limits";
import { TopNav } from "@/components/TopNav";
import { ScoreRing } from "@/components/ScoreRing";

const TEMPLATES = ["classic", "modern", "compact", "bold"];

export function ResumeEditor({
  resumeId,
  initialTitle,
  initialTemplate,
  initialData,
  plan,
  googleDriveConnected,
}: {
  resumeId: string;
  initialTitle: string;
  initialTemplate: string;
  initialData: ResumeData;
  plan: Plan;
  googleDriveConnected: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [template, setTemplate] = useState(initialTemplate);
  const [data, setData] = useState<ResumeData>(initialData);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [tab, setTab] = useState<"edit" | "score" | "match" | "agent" | "cover-letter" | "resignation-letter">("edit");
  const [pdfUpgradeRequired, setPdfUpgradeRequired] = useState(false);
  const [docxUpgradeRequired, setDocxUpgradeRequired] = useState(false);
  const [driveStatus, setDriveStatus] = useState<"idle" | "loading" | "upgrade" | "connect">("idle");
  const [driveLink, setDriveLink] = useState<string | null>(null);

  async function save() {
    setSaveStatus("saving");
    await fetch(`/api/resumes/${resumeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, template, data }),
    });
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 1500);
  }

  async function exportPdf() {
    setPdfUpgradeRequired(false);
    const res = await fetch("/api/resumes/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume: data, template }),
    });
    if (res.status === 402) {
      setPdfUpgradeRequired(true);
      return;
    }
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(data.contact.fullName || "resume").replace(/\s+/g, "_")}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportDocx() {
    setDocxUpgradeRequired(false);
    const res = await fetch("/api/resumes/docx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume: data }),
    });
    if (res.status === 402) {
      setDocxUpgradeRequired(true);
      return;
    }
    if (!res.ok) return;
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
      alert(body.error ?? "Couldn't export to Google Drive.");
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

  return (
    <main className="flex-1 flex flex-col bg-paper">
      <TopNav active="resumes" userInitial="•" />

      <div className="border-b border-rule px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/dashboard" className="text-sm text-ink-soft hover:text-ink shrink-0">
            ← Dashboard
          </Link>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-seal font-medium">
              Project: {data.experience[0]?.role || "Untitled"}
            </p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-display font-semibold text-xl bg-transparent focus:outline-none border-b border-transparent focus:border-rule min-w-0 w-full"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="text-sm border border-rule rounded-sm px-2 py-1.5 bg-paper-raised"
          >
            {TEMPLATES.map((t) => (
              <option key={t} value={t}>
                {t[0].toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
          <span className="text-xs text-ink-soft font-mono w-14 text-right">
            {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved" : ""}
          </span>
          <button
            onClick={save}
            className="text-sm border border-rule rounded-sm px-3 py-1.5 hover:bg-paper-raised"
          >
            Save
          </button>
          {pdfUpgradeRequired ? (
            <Link href="/pricing" className="text-sm text-seal hover:underline">
              Upgrade for more PDFs →
            </Link>
          ) : (
            <button
              onClick={exportPdf}
              className="text-sm bg-seal text-white rounded-sm px-3 py-1.5 hover:opacity-90"
            >
              Export PDF
            </button>
          )}
          {docxUpgradeRequired ? (
            <Link href="/pricing" className="text-sm text-seal hover:underline">
              DOCX is Pro →
            </Link>
          ) : (
            <button
              onClick={exportDocx}
              className="text-sm border border-rule rounded-sm px-3 py-1.5 hover:bg-paper-raised"
            >
              Export DOCX
            </button>
          )}
          {driveStatus === "upgrade" ? (
            <Link href="/pricing" className="text-sm text-seal hover:underline">
              Drive is Pro →
            </Link>
          ) : driveStatus === "connect" ? (
            <a href="/api/google/connect" className="text-sm text-seal hover:underline">
              Connect Drive →
            </a>
          ) : driveLink ? (
            <a
              href={driveLink}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-seal hover:underline"
            >
              Opened in Drive ✓
            </a>
          ) : (
            <button
              onClick={exportToDrive}
              disabled={driveStatus === "loading"}
              className="text-sm border border-rule rounded-sm px-3 py-1.5 hover:bg-paper-raised disabled:opacity-60"
            >
              {driveStatus === "loading" ? "Uploading…" : googleDriveConnected ? "Save to Drive" : "Save to Drive"}
            </button>
          )}
          <button
            onClick={deleteThisResume}
            className="text-sm text-red-600 hover:underline"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="border-b border-rule px-6 flex gap-1">
        {[
          { id: "edit", label: "Edit" },
          { id: "agent", label: "AI Agent" },
          { id: "score", label: "Score" },
          { id: "match", label: "Job Match" },
          { id: "cover-letter", label: "Cover Letter", pro: true },
          { id: "resignation-letter", label: "Resignation Letter", pro: true },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`px-4 py-2.5 text-sm border-b-2 -mb-px flex items-center gap-1.5 ${
              tab === t.id ? "border-seal text-ink font-medium" : "border-transparent text-ink-soft"
            }`}
          >
            {t.label}
            {t.pro && plan === "free" && <span className="text-[10px] font-mono text-seal">PRO</span>}
          </button>
        ))}
      </div>

      <div className="flex-1 grid lg:grid-cols-2 min-h-0">
        <div className="overflow-y-auto p-6 border-r border-rule">
          {tab === "edit" && <EditForm data={data} setData={setData} />}
          {tab === "agent" && <AgentPanel data={data} setData={setData} />}
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
        <div className="overflow-y-auto p-6 bg-rule/10 relative">
          <div className="hidden xl:block absolute top-8 right-8 z-10 paper-sheet rounded-sm px-4 py-3 w-40">
            <div className="mx-auto mb-1 flex justify-center">
              <ScoreRing value={liveScore.overall} size={56} strokeWidth={8} />
            </div>
            <p className="text-center text-xs font-medium">
              {liveScore.overall >= 70 ? "ATS Ready" : "Needs work"}
            </p>
            <p className="text-center text-[10px] text-ink-soft uppercase tracking-wide mt-0.5">
              Live score
            </p>
          </div>
          <ResumePreview data={data} template={template} />
        </div>
      </div>
    </main>
  );
}

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
    <div className="max-w-xl paper-sheet rounded-sm p-8 text-center">
      <p className="text-xs uppercase tracking-wide text-seal font-mono mb-2">Pro feature</p>
      <p className="text-ink-soft mb-5">{feature} is available on the Pro plan.</p>
      <Link
        href="/pricing"
        className="inline-block bg-seal text-white px-5 py-2.5 rounded-sm text-sm font-medium hover:opacity-90"
      >
        Upgrade to Pro
      </Link>
    </div>
  );
}

// ---------- Edit form ----------

function EditForm({
  data,
  setData,
}: {
  data: ResumeData;
  setData: React.Dispatch<React.SetStateAction<ResumeData>>;
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

  return (
    <div className="space-y-8 max-w-xl">
      <Section title="Contact">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Full name" value={data.contact.fullName} onChange={(v) => updateContact("fullName", v)} />
          <Input label="Email" value={data.contact.email} onChange={(v) => updateContact("email", v)} />
          <Input label="Phone" value={data.contact.phone ?? ""} onChange={(v) => updateContact("phone", v)} />
          <Input label="Location" value={data.contact.location ?? ""} onChange={(v) => updateContact("location", v)} />
          <Input label="LinkedIn" value={data.contact.linkedin ?? ""} onChange={(v) => updateContact("linkedin", v)} />
          <Input label="Website" value={data.contact.website ?? ""} onChange={(v) => updateContact("website", v)} />
        </div>
      </Section>

      <Section title="Summary">
        <SummaryField data={data} setData={setData} />
      </Section>

      <Section title="Experience" action={<AddButton onClick={addExperience} label="Add role" />}>
        <div className="space-y-5">
          {data.experience.map((exp) => (
            <ExperienceCard
              key={exp.id}
              exp={exp}
              role={exp.role}
              onChange={(patch) => updateExperience(exp.id, patch)}
              onRemove={() => removeExperience(exp.id)}
            />
          ))}
        </div>
      </Section>

      <Section title="Education" action={<AddButton onClick={addEducation} label="Add school" />}>
        <div className="space-y-3">
          {data.education.map((edu) => (
            <div key={edu.id} className="paper-sheet rounded-sm p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input label="School" value={edu.school} onChange={(v) => updateEducation(edu.id, { school: v })} />
                <Input label="Degree" value={edu.degree} onChange={(v) => updateEducation(edu.id, { degree: v })} />
                <Input label="Start" value={edu.startDate} onChange={(v) => updateEducation(edu.id, { startDate: v })} />
                <Input label="End" value={edu.endDate} onChange={(v) => updateEducation(edu.id, { endDate: v })} />
              </div>
              <button onClick={() => removeEducation(edu.id)} className="text-xs text-red-600 hover:underline">
                Remove
              </button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Skills">
        <input
          value={data.skills.join(", ")}
          onChange={(e) =>
            setData((d) => ({
              ...d,
              skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
            }))
          }
          placeholder="Comma-separated, e.g. Python, Django, AWS"
          className="w-full border border-rule rounded-sm px-3 py-2 text-sm bg-paper-raised focus:outline-none focus:ring-2 focus:ring-seal/40"
        />
      </Section>
    </div>
  );
}

function SummaryField({
  data,
  setData,
}: {
  data: ResumeData;
  setData: React.Dispatch<React.SetStateAction<ResumeData>>;
}) {
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experience: data.experience, skills: data.skills, targetRole: data.experience[0]?.role }),
      });
      const body = await res.json();
      if (res.ok) setOptions(body.options);
      else alert(body.error ?? "Couldn't generate summary options.");
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
          className="flex-1 w-full border border-rule rounded-sm px-3 py-2 text-sm bg-paper-raised focus:outline-none focus:ring-2 focus:ring-seal/40"
        />
        <button
          onClick={generate}
          disabled={loading}
          title="Generate with AI"
          className="text-xs bg-seal-soft text-seal px-2 py-1 rounded-sm hover:opacity-80 disabled:opacity-50 shrink-0"
        >
          {loading ? "…" : "✦ AI"}
        </button>
      </div>
      {options.length > 0 && (
        <div className="mt-1.5 space-y-1">
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() => {
                setData((d) => ({ ...d, summary: opt }));
                setOptions([]);
              }}
              className="block w-full text-left text-xs bg-paper border border-rule rounded-sm px-2 py-1.5 hover:border-seal"
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
  onChange,
  onRemove,
}: {
  exp: ExperienceEntry;
  role: string;
  onChange: (patch: Partial<ExperienceEntry>) => void;
  onRemove: () => void;
}) {
  const [aiOptions, setAiOptions] = useState<Record<number, string[]>>({});
  const [loadingBullet, setLoadingBullet] = useState<number | null>(null);

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
    if (!bullet?.trim()) return;
    setLoadingBullet(index);
    try {
      const res = await fetch("/api/ai/generate-bullets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roughBullet: bullet, role: role || "professional" }),
      });
      const body = await res.json();
      if (res.ok) setAiOptions((o) => ({ ...o, [index]: body.options }));
      else alert(body.error ?? "Couldn't generate suggestions.");
    } finally {
      setLoadingBullet(null);
    }
  }

  return (
    <div className="paper-sheet rounded-sm p-4 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Input label="Role" value={exp.role} onChange={(v) => onChange({ role: v })} />
        <Input label="Company" value={exp.company} onChange={(v) => onChange({ company: v })} />
        <Input label="Start" value={exp.startDate} onChange={(v) => onChange({ startDate: v })} />
        <Input label="End" value={exp.endDate} onChange={(v) => onChange({ endDate: v })} />
      </div>

      <div className="space-y-2">
        {exp.bullets.map((b, i) => (
          <div key={i}>
            <div className="flex gap-2 items-start">
              <textarea
                value={b}
                onChange={(e) => updateBullet(i, e.target.value)}
                rows={2}
                className="flex-1 border border-rule rounded-sm px-2 py-1.5 text-sm bg-paper-raised focus:outline-none focus:ring-2 focus:ring-seal/40"
              />
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => polish(i)}
                  disabled={loadingBullet === i}
                  title="Rewrite with AI"
                  className="text-xs bg-seal-soft text-seal px-2 py-1 rounded-sm hover:opacity-80 disabled:opacity-50"
                >
                  {loadingBullet === i ? "…" : "✦ AI"}
                </button>
                <button onClick={() => removeBullet(i)} className="text-xs text-red-600">
                  ✕
                </button>
              </div>
            </div>
            {aiOptions[i] && (
              <div className="mt-1.5 space-y-1">
                {aiOptions[i].map((opt, oi) => (
                  <button
                    key={oi}
                    onClick={() => {
                      updateBullet(i, opt);
                      setAiOptions((o) => ({ ...o, [i]: [] }));
                    }}
                    className="block w-full text-left text-xs bg-paper border border-rule rounded-sm px-2 py-1.5 hover:border-seal"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <button onClick={addBullet} className="text-xs text-ink-soft hover:text-ink">
          + Add bullet
        </button>
      </div>

      <button onClick={onRemove} className="text-xs text-red-600 hover:underline">
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
      <div className="paper-sheet rounded-sm p-4 mb-3">
        <p className="text-xs uppercase tracking-wide text-seal font-mono mb-1">AI Resume Agent</p>
        <p className="text-sm text-ink-soft">
          Tell it what to change — &quot;tighten my summary&quot;, &quot;add a bullet about the Q3 migration
          project&quot;, &quot;remove my second job&quot; — and it edits the resume directly.
        </p>
      </div>

      <div className="flex-1 space-y-3 mb-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : ""}>
            <div
              className={`inline-block max-w-[85%] text-left rounded-sm px-3 py-2 text-sm ${
                m.role === "user" ? "bg-ink text-paper" : "paper-sheet"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.actions && m.actions.length > 0 && (
                <ul className="mt-2 pt-2 border-t border-rule/40 space-y-0.5">
                  {m.actions.map((a, ai) => (
                    <li key={ai} className="text-xs text-seal flex items-center gap-1">
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
          className="flex-1 border border-rule rounded-sm px-3 py-2 text-sm bg-paper-raised focus:outline-none focus:ring-2 focus:ring-seal/40"
        />
        <button
          onClick={send}
          disabled={loading}
          className="bg-seal text-white text-sm px-4 py-2 rounded-sm hover:opacity-90 disabled:opacity-60"
        >
          Send
        </button>
      </div>
    </div>
  );
}

// ---------- Score panel (Rezi Score) ----------

function ScorePanel({ data, plan }: { data: ResumeData; plan: Plan }) {
  const result = scoreResumeQuality(data);
  const isPro = plan === "pro";

  return (
    <div className="max-w-xl space-y-4">
      <div className="paper-sheet rounded-sm p-6">
        <div className="flex items-center gap-4">
          <ScoreRing value={result.overall} size={80} strokeWidth={8} />
          <div>
            <p className="font-display font-bold text-lg">Resume Score</p>
            <p className="text-sm text-ink-soft">
              {result.overall >= 80
                ? "Strong resume — minor polish left."
                : result.overall >= 50
                ? "Solid start — a few gaps to close."
                : "Early stage — fill in the sections below."}
            </p>
          </div>
        </div>
      </div>

      {!isPro && (
        <div className="paper-sheet rounded-sm p-4 text-sm text-ink-soft flex items-center justify-between">
          <span>Free plan shows your overall score only.</span>
          <Link href="/pricing" className="text-seal font-medium hover:underline shrink-0 ml-3">
            Unlock full breakdown →
          </Link>
        </div>
      )}

      {isPro && (
        <div className="space-y-3">
          {result.sections.map((s) => (
            <div key={s.key} className="paper-sheet rounded-sm p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{s.label}</span>
                <span className="font-mono text-sm text-seal">{s.score}</span>
              </div>
              <div className="h-1.5 bg-rule/40 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-seal" style={{ width: `${s.score}%` }} />
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

function JobMatchPanel({ data }: { data: ResumeData }) {
  const [jd, setJd] = useState("");
  const [result, setResult] = useState<AtsResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function check() {
    if (!jd.trim() || jd.trim().length < 10) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/ats-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume: data, jobDescription: jd }),
      });
      const body = await res.json();
      if (res.ok) setResult(body);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <Section title="Paste the job description">
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          rows={10}
          placeholder="Paste the full job posting here…"
          className="w-full border border-rule rounded-sm px-3 py-2 text-sm bg-paper-raised focus:outline-none focus:ring-2 focus:ring-seal/40"
        />
        <button
          onClick={check}
          disabled={loading}
          className="mt-2 bg-seal text-white text-sm px-4 py-2 rounded-sm hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Scoring…" : "Check match score"}
        </button>
      </Section>

      {result && (
        <div className="paper-sheet rounded-sm p-5">
          <div className="flex items-center gap-4 mb-4">
            <ScoreRing value={result.score} size={64} strokeWidth={8} />
            <p className="text-sm text-ink-soft">
              {result.matchedKeywords.length} of {result.totalKeywords} key terms found in your resume.
            </p>
          </div>

          <p className="text-xs uppercase tracking-wide text-ink-soft mb-1.5">Missing keywords</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {result.missingKeywords.length === 0 ? (
              <span className="text-sm text-ink-soft">None — great coverage.</span>
            ) : (
              result.missingKeywords.map((k) => (
                <span key={k} className="text-xs font-mono bg-red-50 text-red-700 px-2 py-1 rounded-sm">
                  {k}
                </span>
              ))
            )}
          </div>

          <p className="text-xs uppercase tracking-wide text-ink-soft mb-1.5">Matched keywords</p>
          <div className="flex flex-wrap gap-2">
            {result.matchedKeywords.map((k) => (
              <span key={k} className="text-xs font-mono bg-seal-soft text-seal px-2 py-1 rounded-sm">
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
          className="w-full border border-rule rounded-sm px-3 py-2 text-sm bg-paper-raised focus:outline-none focus:ring-2 focus:ring-seal/40 mt-2"
        />
        <button
          onClick={generate}
          disabled={loading}
          className="mt-2 bg-seal text-white text-sm px-4 py-2 rounded-sm hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Writing…" : "Generate cover letter"}
        </button>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </Section>

      {letter && (
        <div className="paper-sheet rounded-sm p-5">
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
            className="mt-0.5 w-full border border-rule rounded-sm px-2 py-1.5 text-sm bg-paper-raised"
          >
            <option value="neutral">Neutral</option>
            <option value="warm">Warm &amp; appreciative</option>
            <option value="brief">Brief</option>
          </select>
        </label>
        <button
          onClick={generate}
          disabled={loading}
          className="mt-3 bg-seal text-white text-sm px-4 py-2 rounded-sm hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Writing…" : "Generate resignation letter"}
        </button>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </Section>

      {letter && (
        <div className="paper-sheet rounded-sm p-5">
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

function ResumePreview({ data, template }: { data: ResumeData; template: string }) {
  if (template === "modern") return <ModernPreview data={data} />;
  if (template === "bold") return <BoldPreview data={data} />;
  return <ClassicPreview data={data} dense={template === "compact"} />;
}

const contactLine = (data: ResumeData) =>
  [data.contact.email, data.contact.phone, data.contact.location, data.contact.linkedin, data.contact.website]
    .filter(Boolean)
    .join("  •  ");

// Standard + Compact - serif name, understated hairline section rules
function ClassicPreview({ data, dense }: { data: ResumeData; dense: boolean }) {
  return (
    <div
      className={`paper-sheet rounded-sm mx-auto max-w-2xl ${dense ? "p-6 text-[13px]" : "p-10"}`}
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <h2 className="font-display font-bold text-2xl">{data.contact.fullName || "Your Name"}</h2>
      <p className="text-xs text-ink-soft mt-1">{contactLine(data)}</p>

      {data.summary && (
        <>
          <h3 className="text-xs uppercase tracking-wide font-mono text-seal mt-5 mb-1 border-b border-rule pb-1">
            Summary
          </h3>
          <p className="text-sm leading-relaxed">{data.summary}</p>
        </>
      )}

      {data.experience.length > 0 && (
        <>
          <h3 className="text-xs uppercase tracking-wide font-mono text-seal mt-5 mb-1 border-b border-rule pb-1">
            Experience
          </h3>
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
                  <li key={i} className="text-sm pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-seal">
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
          <h3 className="text-xs uppercase tracking-wide font-mono text-seal mt-5 mb-1 border-b border-rule pb-1">
            Education
          </h3>
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
          <h3 className="text-xs uppercase tracking-wide font-mono text-seal mt-5 mb-1 border-b border-rule pb-1">
            Skills
          </h3>
          <p className="text-sm">{data.skills.join(" • ")}</p>
        </>
      )}
    </div>
  );
}

// Modern - sans-serif, colored header band, left-accent section headers, skill chips
function ModernPreview({ data }: { data: ResumeData }) {
  return (
    <div className="paper-sheet rounded-sm mx-auto max-w-2xl overflow-hidden" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="bg-ink text-paper px-8 py-6">
        <h2 className="font-bold text-2xl tracking-tight">{data.contact.fullName || "Your Name"}</h2>
        <p className="text-xs opacity-80 mt-1">{contactLine(data)}</p>
      </div>
      <div className="p-8">
        {data.summary && (
          <>
            <h3 className="text-xs uppercase tracking-wide font-semibold text-seal mt-1 mb-1.5 pl-2 border-l-2 border-seal">
              Summary
            </h3>
            <p className="text-sm leading-relaxed mb-4">{data.summary}</p>
          </>
        )}

        {data.experience.length > 0 && (
          <>
            <h3 className="text-xs uppercase tracking-wide font-semibold text-seal mt-4 mb-1.5 pl-2 border-l-2 border-seal">
              Experience
            </h3>
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
                    <li key={i} className="text-sm pl-4 relative before:content-['—'] before:absolute before:left-0 before:text-seal">
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
            <h3 className="text-xs uppercase tracking-wide font-semibold text-seal mt-4 mb-1.5 pl-2 border-l-2 border-seal">
              Education
            </h3>
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
            <h3 className="text-xs uppercase tracking-wide font-semibold text-seal mt-4 mb-1.5 pl-2 border-l-2 border-seal">
              Skills
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {data.skills.map((s) => (
                <span key={s} className="text-xs bg-seal-soft text-seal px-2 py-0.5 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Bold - large uppercase name, heavy rule, uppercase blocked section titles
function BoldPreview({ data }: { data: ResumeData }) {
  return (
    <div className="paper-sheet rounded-sm mx-auto max-w-2xl p-10" style={{ fontFamily: "var(--font-sans)" }}>
      <h2 className="font-display font-bold text-4xl uppercase tracking-tight leading-none">
        {data.contact.fullName || "Your Name"}
      </h2>
      <div className="h-1 bg-seal w-16 my-3" />
      <p className="text-xs text-ink-soft">{contactLine(data)}</p>

      {data.summary && (
        <>
          <h3 className="text-sm uppercase tracking-widest font-bold bg-ink text-paper inline-block px-2 py-0.5 mt-6 mb-2">
            Summary
          </h3>
          <p className="text-sm leading-relaxed">{data.summary}</p>
        </>
      )}

      {data.experience.length > 0 && (
        <>
          <h3 className="text-sm uppercase tracking-widest font-bold bg-ink text-paper inline-block px-2 py-0.5 mt-6 mb-2">
            Experience
          </h3>
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
                  <li key={i} className="text-sm pl-4 relative before:content-['▸'] before:absolute before:left-0 before:text-seal before:font-bold">
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
          <h3 className="text-sm uppercase tracking-widest font-bold bg-ink text-paper inline-block px-2 py-0.5 mt-6 mb-2">
            Education
          </h3>
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
          <h3 className="text-sm uppercase tracking-widest font-bold bg-ink text-paper inline-block px-2 py-0.5 mt-6 mb-2">
            Skills
          </h3>
          <p className="text-sm font-medium">{data.skills.join("  /  ")}</p>
        </>
      )}
    </div>
  );
}

// ---------- Shared small components ----------

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display font-bold text-sm uppercase tracking-wide text-ink-soft">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="text-xs text-seal hover:underline">
      + {label}
    </button>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs text-ink-soft">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 w-full border border-rule rounded-sm px-2 py-1.5 text-sm bg-paper-raised focus:outline-none focus:ring-2 focus:ring-seal/40"
      />
    </label>
  );
}
