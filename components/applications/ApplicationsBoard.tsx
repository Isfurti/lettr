"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApplicationRow, ApplicationStatus } from "@/lib/db";
import { STATUS_LABELS } from "@/lib/applications";

const STATUSES: ApplicationStatus[] = ["saved", "applied", "interview", "offer", "rejected"];

const STATUS_STYLE: Record<ApplicationStatus, string> = {
  saved: "bg-sand text-ink",
  applied: "bg-brand-blue-soft text-brand-blue-deep",
  interview: "bg-gold-soft text-ink",
  offer: "bg-[#DCF3E5] text-[#1F7A45]",
  rejected: "bg-[#F1F2F5] text-slate",
};

type ResumeOption = { id: string; title: string };

type Draft = {
  id?: string;
  company: string;
  role: string;
  url: string;
  location: string;
  status: ApplicationStatus;
  appliedOn: string;
  nextStep: string;
  nextStepOn: string;
  notes: string;
  jobPost: string;
  resumeId: string;
};

const today = () => new Date().toLocaleDateString("en-CA");

const emptyDraft = (status: ApplicationStatus = "saved"): Draft => ({
  company: "",
  role: "",
  url: "",
  location: "",
  status,
  appliedOn: status === "applied" ? today() : "",
  nextStep: "",
  nextStepOn: "",
  notes: "",
  jobPost: "",
  resumeId: "",
});

const toDraft = (a: ApplicationRow): Draft => ({
  id: a.id,
  company: a.company,
  role: a.role,
  url: a.url ?? "",
  location: a.location ?? "",
  status: a.status,
  appliedOn: a.applied_on ?? "",
  nextStep: a.next_step ?? "",
  nextStepOn: a.next_step_on ?? "",
  notes: a.notes ?? "",
  jobPost: a.job_post ?? "",
  resumeId: a.resume_id ?? "",
});

const fmtDate = (d: string | null) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";

/** The job application tracker: a board on big screens, a filtered list on phones. */
export function ApplicationsBoard({ initial, resumes }: { initial: ApplicationRow[]; resumes: ResumeOption[] }) {
  const router = useRouter();
  const [apps, setApps] = useState(initial);
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all");
  const [view, setView] = useState<"board" | "list">("board");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const c = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<ApplicationStatus, number>;
    for (const a of apps) c[a.status]++;
    return c;
  }, [apps]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return apps.filter(
      (a) =>
        (filter === "all" || a.status === filter) &&
        (!q || `${a.company} ${a.role} ${a.location ?? ""}`.toLowerCase().includes(q))
    );
  }, [apps, filter, query]);

  const upcoming = useMemo(
    () =>
      apps
        .filter((a) => a.next_step && a.next_step_on && a.status !== "rejected")
        .sort((a, b) => (a.next_step_on! < b.next_step_on! ? -1 : 1))
        .slice(0, 5),
    [apps]
  );

  async function save() {
    if (!draft) return;
    if (!draft.company.trim()) {
      setError("Add the company name.");
      return;
    }
    setSaving(true);
    setError(null);
    const body = {
      company: draft.company,
      role: draft.role,
      url: draft.url || null,
      location: draft.location || null,
      status: draft.status,
      appliedOn: draft.appliedOn || null,
      nextStep: draft.nextStep || null,
      nextStepOn: draft.nextStepOn || null,
      notes: draft.notes || null,
      jobPost: draft.jobPost || null,
      resumeId: draft.resumeId || null,
    };
    try {
      const res = await fetch(draft.id ? `/api/applications/${draft.id}` : "/api/applications", {
        method: draft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(out.error ?? "Couldn't save. Try again.");
        return;
      }
      const row = out.application as ApplicationRow;
      setApps((list) => (draft.id ? list.map((a) => (a.id === row.id ? row : a)) : [row, ...list]));
      setDraft(null);
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(a: ApplicationRow, status: ApplicationStatus) {
    const patch: Record<string, unknown> = { status };
    // Moving to "Applied" for the first time records today's date.
    if (status === "applied" && !a.applied_on) patch.appliedOn = today();
    const before = apps;
    setApps((list) => list.map((x) => (x.id === a.id ? { ...x, status, applied_on: (patch.appliedOn as string) ?? x.applied_on } : x)));
    const res = await fetch(`/api/applications/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => null);
    if (!res?.ok) setApps(before);
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this application? This can't be undone.")) return;
    const res = await fetch(`/api/applications/${id}`, { method: "DELETE" }).catch(() => null);
    if (res?.ok) {
      setApps((list) => list.filter((a) => a.id !== id));
      setDraft(null);
    } else setError("Couldn't delete. Try again.");
  }

  function openWith(a: ApplicationRow, tab: "match" | "cover-letter") {
    if (!a.resume_id) return;
    try {
      if (a.job_post) window.localStorage.setItem("lettr_pending_jd", a.job_post);
      window.localStorage.setItem("lettr_pending_company", a.company);
    } catch {
      // storage blocked - the builder just opens without the job post
    }
    router.push(`/builder/${a.resume_id}?tab=${tab}`);
  }

  const card = (a: ApplicationRow) => {
    const overdue = a.next_step_on && a.next_step_on < today() && a.status !== "rejected" && a.status !== "offer";
    return (
      <article key={a.id} className="bg-white border-2 border-rule rounded-2xl p-4 hover:border-ink transition-colors">
        <button type="button" onClick={() => setDraft(toDraft(a))} className="block w-full text-left">
          <p className="font-extrabold leading-tight break-words">{a.company}</p>
          {a.role && <p className="text-sm text-slate break-words">{a.role}</p>}
          <p className="text-xs text-slate mt-1">
            {[a.location, a.applied_on ? `Applied ${fmtDate(a.applied_on)}` : null].filter(Boolean).join(" · ")}
          </p>
          {a.next_step && (
            <p className={`mt-2 text-xs font-bold rounded-lg px-2 py-1 inline-block ${overdue ? "bg-red-50 text-red-700" : "bg-cream text-ink"}`}>
              Next: {a.next_step}
              {a.next_step_on ? ` · ${fmtDate(a.next_step_on)}` : ""}
            </p>
          )}
        </button>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3">
          <label className="sr-only" htmlFor={`st-${a.id}`}>
            Status
          </label>
          <select
            id={`st-${a.id}`}
            value={a.status}
            onChange={(e) => setStatus(a, e.target.value as ApplicationStatus)}
            className={`min-h-9 text-xs font-bold rounded-full px-2.5 border-0 ${STATUS_STYLE[a.status]}`}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          {a.url && (
            <a href={a.url} target="_blank" rel="noreferrer noopener" className="text-xs font-bold text-brand-blue hover:underline min-h-8 inline-flex items-center">
              Job post ↗
            </a>
          )}
          {a.resume_id && a.job_post && (
            <button type="button" onClick={() => openWith(a, "match")} className="text-xs font-bold text-brand-blue hover:underline min-h-8">
              Check match
            </button>
          )}
          {a.resume_id && (a.status === "saved" || a.status === "applied") && (
            <button type="button" onClick={() => openWith(a, "cover-letter")} className="text-xs font-bold text-brand-blue hover:underline min-h-8">
              Cover letter
            </button>
          )}
        </div>
      </article>
    );
  };

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {(
          [
            ["Tracking", apps.length],
            ["Applied", counts.applied + counts.interview + counts.offer],
            ["Interviews", counts.interview],
            ["Offers", counts.offer],
          ] as const
        ).map(([label, n]) => (
          <div key={label} className="bg-white border border-rule rounded-2xl px-4 py-3">
            <p className="text-sm font-bold text-slate">{label}</p>
            <p className="font-brand font-extrabold text-3xl">{n}</p>
          </div>
        ))}
      </div>

      {upcoming.length > 0 && (
        <section className="bg-gold-soft rounded-2xl px-5 py-4 mb-6" aria-label="Coming up">
          <p className="font-extrabold mb-2">Coming up</p>
          <ul className="space-y-1 text-sm">
            {upcoming.map((a) => (
              <li key={a.id} className={a.next_step_on! < today() ? "text-red-700 font-bold" : ""}>
                {fmtDate(a.next_step_on)} · {a.next_step} — {a.company}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <button
          type="button"
          onClick={() => setDraft(emptyDraft(filter === "all" ? "saved" : filter))}
          className="btn-press inline-flex items-center min-h-11 px-5 rounded-full bg-brand-blue text-white font-bold shadow-[0_4px_0_var(--brand-blue-deep)]"
        >
          + Add application
        </button>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search company or role"
          aria-label="Search applications"
          className="field-input !w-auto flex-1 min-w-[12rem] max-w-xs"
        />
        <div className="hidden lg:flex ml-auto p-1 rounded-full bg-sand">
          {(["board", "list"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`min-h-9 px-4 rounded-full text-sm font-bold capitalize ${view === v ? "bg-white shadow" : "text-slate"}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {apps.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-rule rounded-[28px] p-8 text-center">
          <p className="font-brand font-extrabold text-2xl">Track every job you go for</p>
          <p className="text-slate mt-2 max-w-lg mx-auto">
            Save jobs you like, move them along as you apply and interview, and set a reminder for each next step. Link a resume to
            check your match or write a cover letter in one tap.
          </p>
        </div>
      ) : (
        <>
          <div className={`${view === "board" ? "lg:hidden" : ""} mb-4 flex gap-1.5 overflow-x-auto whitespace-nowrap pb-1`} role="tablist" aria-label="Filter by status">
            {(["all", ...STATUSES] as const).map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={filter === s}
                onClick={() => setFilter(s)}
                className={`min-h-10 px-4 rounded-full text-sm font-bold shrink-0 ${filter === s ? "bg-ink text-white" : "bg-white border border-rule text-slate"}`}
              >
                {s === "all" ? "All" : STATUS_LABELS[s]} {s === "all" ? apps.length : counts[s]}
              </button>
            ))}
          </div>

          {view === "board" && (
            <div className="hidden lg:grid grid-cols-5 gap-3 items-start">
              {STATUSES.map((s) => (
                <section key={s} className="bg-sand/60 rounded-2xl p-2.5 min-h-40" aria-label={STATUS_LABELS[s]}>
                  <p className="font-extrabold text-sm px-1.5 pb-2 flex justify-between">
                    {STATUS_LABELS[s]} <span className="text-slate">{counts[s]}</span>
                  </p>
                  <div className="space-y-2.5">{shown.filter((a) => a.status === s).map(card)}</div>
                </section>
              ))}
            </div>
          )}
          <div className={`${view === "board" ? "lg:hidden" : ""} grid sm:grid-cols-2 xl:grid-cols-3 gap-3`}>
            {shown.map(card)}
            {shown.length === 0 && <p className="text-slate">Nothing here yet.</p>}
          </div>
        </>
      )}

      {draft && (
        <div className="fixed inset-0 z-50 bg-ink/50 flex items-end sm:items-center justify-center p-0 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="app-editor-title">
          <div className="bg-cream w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] p-5 sm:p-7">
            <div className="flex items-center justify-between mb-4">
              <h2 id="app-editor-title" className="font-brand font-extrabold text-2xl">
                {draft.id ? "Edit application" : "Add application"}
              </h2>
              <button type="button" onClick={() => setDraft(null)} aria-label="Close" className="w-11 h-11 rounded-full hover:bg-sand text-xl">
                ✕
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Company *" value={draft.company} onChange={(v) => setDraft({ ...draft, company: v })} autoFocus />
              <Field label="Role" value={draft.role} onChange={(v) => setDraft({ ...draft, role: v })} />
              <Field label="Link to the job post" type="url" value={draft.url} onChange={(v) => setDraft({ ...draft, url: v })} placeholder="https://" />
              <Field label="Location" value={draft.location} onChange={(v) => setDraft({ ...draft, location: v })} placeholder="Bengaluru / Remote" />
              <label className="block">
                <span className="text-sm font-bold text-slate">Status</span>
                <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as ApplicationStatus })} className="field-input mt-1">
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </label>
              <Field label="Applied on" type="date" value={draft.appliedOn} onChange={(v) => setDraft({ ...draft, appliedOn: v })} />
              <Field label="Next step" value={draft.nextStep} onChange={(v) => setDraft({ ...draft, nextStep: v })} placeholder="Follow up with recruiter" />
              <Field label="Next step date" type="date" value={draft.nextStepOn} onChange={(v) => setDraft({ ...draft, nextStepOn: v })} />
              <label className="block sm:col-span-2">
                <span className="text-sm font-bold text-slate">Resume you sent</span>
                <select value={draft.resumeId} onChange={(e) => setDraft({ ...draft, resumeId: e.target.value })} className="field-input mt-1">
                  <option value="">None</option>
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-bold text-slate">Job post (paste it to check your match later)</span>
                <textarea value={draft.jobPost} onChange={(e) => setDraft({ ...draft, jobPost: e.target.value })} rows={4} className="field-input mt-1" />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-bold text-slate">Notes</span>
                <textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} rows={3} className="field-input mt-1" placeholder="Recruiter name, salary range, what they asked…" />
              </label>
            </div>
            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
            <div className="flex flex-wrap items-center gap-3 mt-5">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="btn-press inline-flex items-center min-h-11 px-6 rounded-full bg-brand-blue text-white font-bold shadow-[0_4px_0_var(--brand-blue-deep)] disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button type="button" onClick={() => setDraft(null)} className="min-h-11 px-4 font-bold text-slate">
                Cancel
              </button>
              {draft.id && (
                <button type="button" onClick={() => remove(draft.id!)} className="ml-auto min-h-11 px-4 font-bold text-red-600 hover:underline">
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} className="field-input mt-1" />
    </label>
  );
}
