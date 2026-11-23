"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { PROFILE_CONSENT_VERSION, PROFILE_MIN_AGE } from "@/lib/profile-consent";

export type ProfileView = {
  resumeId: string | null;
  shared: boolean;
  url: string | null;
  showCity: boolean;
  showLinks: boolean;
  showContact: boolean;
  showPersonal: boolean;
  hasPhoto: boolean;
  photoVersion: string | null;
  takenDown: boolean;
};

type Resume = { id: string; title: string };

const card = "bg-white border-2 border-rule rounded-[24px] p-5 sm:p-6 flex flex-col gap-3.5";
const btn = "inline-flex items-center justify-center min-h-12 px-5 rounded-full font-extrabold text-[15px] disabled:opacity-50";

/** Square-crops the middle of the picture and saves it as a 512px JPEG, which also removes any camera data. */
function toSquareJpeg(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That doesn't look like a picture."));
    };
    img.onload = () => {
      URL.revokeObjectURL(url);
      const side = Math.min(img.width, img.height);
      const out = Math.min(512, side);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = out;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Couldn't process that picture."));
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, out, out);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't process that picture."))), "image/jpeg", 0.85);
    };
    img.src = url;
  });
}

function Switch({ on, onChange, label, disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative h-8 w-[52px] shrink-0 rounded-full transition-colors disabled:opacity-50 ${on ? "bg-brand-blue" : "bg-[#c9c1a8]"}`}
    >
      <span className={`absolute top-1 size-6 rounded-full bg-white transition-all ${on ? "left-[24px]" : "left-1"}`} />
    </button>
  );
}

function Row({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 min-h-14 border-t border-rule py-2 first:border-t-0">
      <div className="min-w-0">
        <p className="font-bold">{title}</p>
        <p className="text-[13px] text-slate">{hint}</p>
      </div>
      {children}
    </div>
  );
}

export function ProfileSettings({ initial, resumes, name }: { initial: ProfileView | null; resumes: Resume[]; name: string }) {
  const [p, setP] = useState<ProfileView | null>(initial);
  const [resumeId, setResumeId] = useState(initial?.resumeId ?? resumes[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [asking, setAsking] = useState(false);
  const [ageOk, setAgeOk] = useState(false);
  const [photoKey, setPhotoKey] = useState(initial?.photoVersion ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  const flags = { showCity: p?.showCity ?? false, showLinks: p?.showLinks ?? false, showContact: p?.showContact ?? false, showPersonal: p?.showPersonal ?? false };
  const initials = name.split(/\s+/).filter(Boolean).map((w) => Array.from(w)[0]).slice(0, 2).join("").toUpperCase() || "?";

  async function call(path: string, init: RequestInit): Promise<{ ok: boolean; data: Record<string, unknown> }> {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(path, init);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setMsg({ ok: false, text: String(data.error ?? "Something went wrong. Try again.") });
      return { ok: res.ok, data };
    } catch {
      setMsg({ ok: false, text: "Couldn't reach Lettr. Check your connection and try again." });
      return { ok: false, data: {} };
    } finally {
      setBusy(false);
    }
  }

  async function save(next: Partial<typeof flags> & { resumeId?: string }) {
    const body = { resumeId: next.resumeId ?? resumeId, ...flags, ...next };
    const { ok, data } = await call("/api/profile", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (ok) setP(data.profile as ProfileView);
  }

  async function share() {
    const { ok, data } = await call("/api/profile/share", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ageConfirmed: true, consentVersion: PROFILE_CONSENT_VERSION }),
    });
    if (ok) {
      setP((cur) => (cur ? { ...cur, shared: true, url: String(data.url) } : cur));
      setAsking(false);
      setAgeOk(false);
      setMsg({ ok: true, text: "Your profile is shared. Copy the link to send it." });
    }
  }

  async function stop() {
    const { ok } = await call("/api/profile/revoke", { method: "POST" });
    if (ok) {
      setP((cur) => (cur ? { ...cur, shared: false, url: null } : cur));
      setMsg({ ok: true, text: "Sharing is off and the old link no longer works." });
    }
  }

  async function copy() {
    if (!p?.url) return;
    try {
      await navigator.clipboard.writeText(p.url);
      setMsg({ ok: true, text: "Link copied." });
    } catch {
      setMsg({ ok: false, text: "Couldn't copy. Select the link and copy it yourself." });
    }
  }

  async function upload(file: File) {
    setMsg(null);
    try {
      const blob = await toSquareJpeg(file);
      const form = new FormData();
      form.append("file", blob, "profile.jpg");
      const { ok, data } = await call("/api/profile/photo", { method: "POST", body: form });
      if (ok) {
        setPhotoKey(String(data.version ?? Date.now()));
        setP((cur) => ({ ...(cur ?? emptyView), hasPhoto: true }));
        setMsg({ ok: true, text: "Picture saved." });
      }
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Couldn't use that picture." });
    }
  }

  async function removePhoto() {
    const { ok } = await call("/api/profile/photo", { method: "DELETE" });
    if (ok) setP((cur) => (cur ? { ...cur, hasPhoto: false } : cur));
  }

  if (resumes.length === 0) {
    return (
      <div className={card}>
        <p className="font-extrabold text-xl">Make a resume first</p>
        <p className="text-slate">Your profile is one of your resumes. Create one and it can become your profile.</p>
        <Link href="/dashboard" className={`${btn} bg-gold text-ink self-start shadow-[0_4px_0_var(--gold-deep)]`}>Go to my resumes</Link>
      </div>
    );
  }

  const chosen = p?.resumeId ?? null;
  const saved = chosen === resumeId;

  return (
    <div className="flex flex-col gap-5 max-w-[680px]">
      <div aria-live="polite" className="min-h-6">
        {msg && <p className={`text-sm font-bold ${msg.ok ? "text-[#14663a]" : "text-[#b3261e]"}`}>{msg.text}</p>}
      </div>

      {p?.takenDown && (
        <div className="bg-[#fff1f0] border-2 border-[#b3261e] rounded-[20px] p-4 text-[15px]">
          <p className="font-extrabold">Your profile was turned off by Lettr.</p>
          <p className="mt-1">It is not public. <Link href="/support" className="underline font-bold">Contact support</Link> to ask why.</p>
        </div>
      )}

      <section className={card}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-extrabold text-lg">Sharing</h2>
          <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-extrabold ${p?.shared ? "bg-[#e9f7ee] text-[#14663a]" : "bg-[#f4f0e3] text-slate"}`}>
            <span className={`size-2 rounded-full ${p?.shared ? "bg-[#1f9d57]" : "bg-[#c9c1a8]"}`} />
            {p?.shared ? "Shared by link" : "Private"}
          </span>
        </div>

        <label htmlFor="profile-resume" className="text-sm font-bold text-slate">Resume used as my profile</label>
        <select
          id="profile-resume"
          value={resumeId}
          onChange={(e) => setResumeId(e.target.value)}
          className="min-h-12 rounded-[14px] border-2 border-rule bg-paper px-4 font-bold"
        >
          {resumes.map((r) => (
            <option key={r.id} value={r.id}>{r.title}</option>
          ))}
        </select>
        <p className="text-[13px] text-slate">Only your own resumes can be chosen, not versions made by Tailor. Changing the resume stops sharing, so you decide again.</p>
        {!saved && (
          <button type="button" disabled={busy} onClick={() => save({ resumeId })} className={`${btn} bg-ink text-white self-start`}>
            {p?.shared ? "Use this resume and stop sharing" : "Use this resume"}
          </button>
        )}

        {p?.shared && p.url && (
          <div className="flex flex-wrap items-center gap-2.5">
            <input readOnly value={p.url} aria-label="Your profile link" onFocus={(e) => e.currentTarget.select()} className="flex-1 basis-60 min-h-12 rounded-[14px] bg-[#f4f0e3] px-3.5 text-sm font-semibold text-ink-soft" />
            <button type="button" onClick={copy} className={`${btn} border-2 border-ink bg-white text-ink`}>Copy link</button>
          </div>
        )}

        <div className="flex flex-wrap gap-2.5">
          {saved && chosen && (
            // A full page load, so analytics scripts that may be running here never see this page.
            <a href="/dashboard/profile/preview" className={`${btn} bg-ink text-white`}>Preview as others see it</a>
          )}
          {p?.shared ? (
            <button type="button" disabled={busy} onClick={stop} className={`${btn} border-2 border-rule bg-white text-[#b3261e]`}>Stop sharing and revoke link</button>
          ) : (
            saved && chosen && !p?.takenDown && (
              <button type="button" disabled={busy} onClick={() => setAsking(true)} className={`${btn} bg-gold text-ink shadow-[0_4px_0_var(--gold-deep)]`}>Share my profile</button>
            )
          )}
        </div>
      </section>

      <section className={card}>
        <h2 className="font-extrabold text-lg">What people can see</h2>
        <Row title="Name, headline, summary" hint="Always shown on a shared profile."><span className="text-[13px] font-extrabold text-slate">Always on</span></Row>
        <Row title="Experience, education, skills, projects" hint="Taken from the chosen resume."><span className="text-[13px] font-extrabold text-slate">Always on</span></Row>
        <Row title="Phone number and email" hint="Hidden unless you turn this on.">
          <Switch on={flags.showContact} disabled={busy || !saved} label="Show phone number and email" onChange={(v) => save({ showContact: v })} />
        </Row>
        <Row title="City" hint="Only the city and country, never your street address.">
          <Switch on={flags.showCity} disabled={busy || !saved} label="Show city" onChange={(v) => save({ showCity: v })} />
        </Row>
        <Row title="LinkedIn, website and project links" hint="Hidden unless you turn this on.">
          <Switch on={flags.showLinks} disabled={busy || !saved} label="Show links" onChange={(v) => save({ showLinks: v })} />
        </Row>
        <Row title="Work authorization and nationality" hint="Only if you filled them in. Date of birth is never shown.">
          <Switch on={flags.showPersonal} disabled={busy || !saved} label="Show work authorization and nationality" onChange={(v) => save({ showPersonal: v })} />
        </Row>
        <Row title="Profile picture" hint="Shown on every profile. Initials until you add yours.">
          <div className="flex items-center gap-3">
            {p?.hasPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/profile/photo?v=${encodeURIComponent(photoKey)}`} alt="Your profile picture" width={48} height={48} className="size-12 rounded-full object-cover border-2 border-rule" />
            ) : (
              <div aria-hidden="true" className="size-12 rounded-full bg-ink text-gold flex items-center justify-center font-brand font-extrabold text-lg">{initials}</div>
            )}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Choose a profile picture" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void upload(f); }} />
            <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className={`${btn} min-h-11 border-2 border-ink bg-white text-ink`}>{p?.hasPhoto ? "Change" : "Upload"}</button>
            {p?.hasPhoto && <button type="button" disabled={busy} onClick={removePhoto} className="min-h-11 px-2 text-sm font-bold text-slate underline">Remove</button>}
          </div>
        </Row>
        {p?.shared && <p className="text-[13px] text-slate">These switches change your live page straight away.</p>}
      </section>

      <p className="text-[13px] text-slate">Details on a profile are provided by the owner and are not verified by Lettr. Deleting your account removes your profile page straight away.</p>

      {asking && (
        <div role="dialog" aria-modal="true" aria-labelledby="share-title" className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <div className="w-full max-w-[480px] rounded-[28px] bg-paper p-6 sm:p-7 flex flex-col gap-3.5 shadow-2xl max-h-[90vh] overflow-auto">
            <h2 id="share-title" className="font-brand font-extrabold text-2xl">Share your profile?</h2>
            <p className="text-[15px] text-ink-soft">Anyone with your link will be able to see this:</p>
            <ul className="list-disc pl-5 text-[15px] text-ink-soft flex flex-col gap-1">
              <li>Your name, profile picture, headline and summary</li>
              <li>Your experience, education, skills and projects</li>
              <li>Your languages</li>
            </ul>
            <p className="text-[15px] text-ink-soft"><b>Not shared:</b> your phone, email, city, links, work authorization and date of birth, unless you turn them on. Search engines are told not to list your page.</p>
            <p className="text-sm text-slate">You can stop sharing any time. Deleting your account removes the page straight away.</p>
            <label className="flex items-start gap-3 text-sm min-h-11">
              <input type="checkbox" checked={ageOk} onChange={(e) => setAgeOk(e.target.checked)} className="size-[22px] mt-0.5 shrink-0 accent-brand-blue" />
              <span>I am {PROFILE_MIN_AGE} or older and I understand what becomes public.</span>
            </label>
            <div className="flex flex-wrap gap-2.5 mt-1">
              <button type="button" disabled={!ageOk || busy} onClick={share} className={`${btn} bg-gold text-ink shadow-[0_4px_0_var(--gold-deep)]`}>Start sharing</button>
              <button type="button" onClick={() => { setAsking(false); setAgeOk(false); }} className={`${btn} border-2 border-rule bg-white text-ink`}>Keep it private</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const emptyView: ProfileView = {
  resumeId: null, shared: false, url: null, showCity: false, showLinks: false, showContact: false, showPersonal: false, hasPhoto: false, photoVersion: null, takenDown: false,
};
