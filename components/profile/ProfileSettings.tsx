"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BANNER_STYLES, type BannerStyle } from "@/lib/profile-look";
import { PROFILE_CONSENT_VERSION, PROFILE_MIN_AGE, consentLines } from "@/lib/profile-consent";

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
  bannerStyle: BannerStyle;
  pronouns: string;
  openToWork: boolean;
  otwRole: string;
  otwPlace: string;
  otwNotice: string;
  showUpdated: boolean;
};

type Resume = { id: string; title: string };
type Msg = { ok: boolean; text: string; id: number };
type Confirm = "stop" | "switch" | null;

const card = "bg-white border-2 border-rule rounded-[24px] p-5 sm:p-6 flex flex-col gap-3.5";
const btn = "inline-flex items-center justify-center min-h-12 px-5 rounded-full font-extrabold text-[15px] aria-disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue";
const wide = "w-full sm:w-auto";

const MAX_PICTURE_BYTES = 20 * 1024 * 1024;
const MIN_SIDE = 64;

const emptyView: ProfileView = {
  resumeId: null, shared: false, url: null, showCity: false, showLinks: false, showContact: false, showPersonal: false, hasPhoto: false, photoVersion: null, takenDown: false,
  bannerStyle: "navy-gold", pronouns: "", openToWork: false, otwRole: "", otwPlace: "", otwNotice: "", showUpdated: false,
};

/** Square-crops the middle of the picture and saves it as a 512px JPEG on white, which also removes any camera data. */
async function toSquareJpeg(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Choose a picture (JPEG, PNG or WebP).");
  if (file.size > MAX_PICTURE_BYTES) throw new Error("That picture is too large. Choose one under 20 MB.");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("That doesn't look like a picture we can read. Try a JPEG or PNG.");
  }
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    if (side < MIN_SIDE) throw new Error(`Use a picture at least ${MIN_SIDE} pixels wide.`);
    const out = Math.min(512, side);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = out;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Couldn't process that picture.");
    ctx.fillStyle = "#ffffff"; // transparent areas would turn black as a JPEG
    ctx.fillRect(0, 0, out, out);
    ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, out, out);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    canvas.width = canvas.height = 0;
    if (!blob) throw new Error("Couldn't process that picture.");
    return blob;
  } finally {
    bitmap.close();
  }
}

function Switch({ on, onChange, labelId, hintId }: { on: boolean; onChange: (v: boolean) => void; labelId: string; hintId: string }) {
  // A 44px tap area around the 52x32 switch; the off state has a dark outline so it passes 3:1 contrast.
  return (
    <button type="button" role="switch" aria-checked={on} aria-labelledby={labelId} aria-describedby={hintId} onClick={() => onChange(!on)} className="-m-1.5 flex min-h-11 min-w-14 shrink-0 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue rounded-full">
      <span className={`relative block h-8 w-[52px] rounded-full border-2 transition-colors ${on ? "border-brand-blue bg-brand-blue" : "border-slate bg-[#c9c1a8]"}`}>
        <span className={`absolute top-[2px] size-6 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-[2px]"}`} />
      </span>
    </button>
  );
}

function Row({ title, hint, children }: { title: string; hint: string; children: (ids: { labelId: string; hintId: string }) => React.ReactNode }) {
  const id = useId();
  const ids = { labelId: `${id}-l`, hintId: `${id}-h` };
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 min-h-14 border-t border-rule py-2 first:border-t-0">
      <div className="min-w-0 flex-1 basis-48">
        <p id={ids.labelId} className="font-bold">{title}</p>
        <p id={ids.hintId} className="text-[13px] text-slate">{hint}</p>
      </div>
      {children(ids)}
    </div>
  );
}

export function ProfileSettings({ initial, resumes, name }: { initial: ProfileView | null; resumes: Resume[]; name: string }) {
  const router = useRouter();
  const [p, setP] = useState<ProfileView | null>(initial);
  const [resumeId, setResumeId] = useState(initial?.resumeId ?? resumes[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [msg, setMsg] = useState<Msg | null>(null);
  const [asking, setAsking] = useState(false);
  const [ageOk, setAgeOk] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const shareBtnRef = useRef<HTMLButtonElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  const focusLinkNext = useRef(false);

  const flags = { showCity: p?.showCity ?? false, showLinks: p?.showLinks ?? false, showContact: p?.showContact ?? false, showPersonal: p?.showPersonal ?? false };
  const initials = name.split(/\s+/).filter(Boolean).map((w) => Array.from(w)[0]).slice(0, 2).join("").toUpperCase() || "?";

  const [look, setLook] = useState({
    bannerStyle: (initial?.bannerStyle ?? "navy-gold") as BannerStyle,
    pronouns: initial?.pronouns ?? "",
    openToWork: initial?.openToWork ?? false,
    otwRole: initial?.otwRole ?? "",
    otwPlace: initial?.otwPlace ?? "",
    otwNotice: initial?.otwNotice ?? "",
    showUpdated: initial?.showUpdated ?? false,
  });
  const patchLook = (next: Partial<typeof look>) => setLook((cur) => ({ ...cur, ...next }));

  const msgCount = useRef(0);
  const say = (ok: boolean, text: string) => setMsg({ ok, text, id: ++msgCount.current });

  // After a successful share, put the keyboard on the new link (the Share button is gone by then).
  useEffect(() => {
    if (focusLinkNext.current && p?.url) {
      focusLinkNext.current = false;
      linkRef.current?.focus();
    }
  }, [p?.url]);

  /** Runs one request at a time. A failed request re-reads the server's state, so the screen never drifts from it. */
  async function call(path: string, init: RequestInit): Promise<{ ok: boolean; data: Record<string, unknown> } | null> {
    if (busyRef.current) return null;
    busyRef.current = true;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(path, init);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        say(false, String(data.error ?? "Something went wrong. Try again."));
        const fresh = await fetch("/api/profile").then((r) => (r.ok ? r.json() : null)).catch(() => null);
        if (fresh?.profile) setP(fresh.profile as ProfileView);
      }
      return { ok: res.ok, data };
    } catch {
      say(false, "Couldn't reach Lettr. Check your connection and try again.");
      return { ok: false, data: {} };
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function save(next: Partial<typeof flags> & { resumeId?: string }, okText = "Saved.") {
    const body = { resumeId: next.resumeId ?? resumeId, ...flags, ...next };
    const r = await call("/api/profile", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (r?.ok) {
      setP(r.data.profile as ProfileView);
      say(true, okText);
      router.refresh(); // the page's name and initials follow the chosen resume
    }
  }

  async function saveLook() {
    const r = await call("/api/profile/look", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(look) });
    if (r?.ok) {
      const fresh = r.data.profile as ProfileView;
      setP(fresh);
      // Show what was really saved (text is tidied, and "open to work" with no text is stored as off).
      setLook({ bannerStyle: fresh.bannerStyle, pronouns: fresh.pronouns, openToWork: fresh.openToWork, otwRole: fresh.otwRole, otwPlace: fresh.otwPlace, otwNotice: fresh.otwNotice, showUpdated: fresh.showUpdated });
      say(true, fresh.openToWork === look.openToWork ? "Saved." : "Saved. Open to work stays off until you fill in at least one box.");
      router.refresh();
    }
  }

  async function share() {
    if (!ageOk) return;
    const r = await call("/api/profile/share", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ageConfirmed: true, consentVersion: PROFILE_CONSENT_VERSION }),
    });
    if (r?.ok) {
      focusLinkNext.current = true;
      setP((cur) => ({ ...(cur ?? emptyView), shared: true, url: String(r.data.url) }));
      setAsking(false);
      setAgeOk(false);
      say(true, "Your profile is shared. Copy the link to send it.");
    }
  }

  async function stop() {
    const r = await call("/api/profile/revoke", { method: "POST" });
    if (r?.ok) {
      setP((cur) => (cur ? { ...cur, shared: false, url: null } : cur));
      setConfirm(null);
      say(true, "Sharing is off and the old link no longer works.");
      requestAnimationFrame(() => shareBtnRef.current?.focus());
    }
  }

  async function copy() {
    if (!p?.url) return;
    try {
      await navigator.clipboard.writeText(p.url);
      say(true, "Link copied.");
    } catch {
      say(false, "Couldn't copy. Select the link and copy it yourself.");
    }
  }

  async function upload(file: File) {
    if (busyRef.current) return;
    busyRef.current = true; // held while the picture is prepared, so a second pick cannot run in parallel
    setBusy(true);
    let blob: Blob;
    try {
      blob = await toSquareJpeg(file);
    } catch (e) {
      busyRef.current = false;
      setBusy(false);
      say(false, e instanceof Error ? e.message : "Couldn't use that picture.");
      return;
    }
    busyRef.current = false;
    setBusy(false);
    const form = new FormData();
    form.append("file", blob, "profile.jpg");
    const r = await call("/api/profile/photo", { method: "POST", body: form });
    if (r?.ok) {
      setP((cur) => ({ ...(cur ?? emptyView), hasPhoto: true, photoVersion: String(r.data.version ?? Date.now()) }));
      say(true, "Picture saved.");
    }
  }

  async function removePhoto() {
    const r = await call("/api/profile/photo", { method: "DELETE" });
    if (r?.ok) {
      setP((cur) => (cur ? { ...cur, hasPhoto: false, photoVersion: null } : cur));
      say(true, "Picture removed.");
    }
  }

  if (resumes.length === 0) {
    return (
      <div className={card}>
        <p className="font-extrabold text-xl">Make a resume first</p>
        <p className="text-slate">Your profile is one of your resumes. Create one and it can become your profile.</p>
        <Link href="/dashboard/resumes" className={`${btn} bg-gold text-ink self-start shadow-[0_4px_0_var(--gold-deep)]`}>Go to my resumes</Link>
      </div>
    );
  }

  const chosen = p?.resumeId ?? null;
  const saved = chosen === resumeId;
  const noName = saved && !name.trim();
  const lines = consentLines(flags);

  return (
    <div className="flex flex-col gap-5 max-w-[680px]">
      <div role="status" aria-live="polite" className="min-h-6">
        {msg && <p key={msg.id} className={`text-sm font-bold ${msg.ok ? "text-[#14663a]" : "text-[#b3261e]"}`}>{msg.text}</p>}
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
        <select id="profile-resume" value={resumeId} onChange={(e) => { setResumeId(e.target.value); setConfirm(null); }} className="min-h-12 rounded-[14px] border-2 border-rule bg-paper px-4 font-bold">
          {resumes.map((r) => (
            <option key={r.id} value={r.id}>{r.title}</option>
          ))}
        </select>
        <p className="text-[13px] text-slate">Only your own resumes can be chosen, not versions made by Tailor. Changing the resume stops sharing, so you decide again.</p>

        {!saved && confirm !== "switch" && (
          <button type="button" aria-disabled={busy} onClick={() => (p?.shared ? setConfirm("switch") : void save({ resumeId }, "Resume chosen."))} className={`${btn} ${wide} bg-ink text-white self-start`}>
            Use this resume
          </button>
        )}
        {confirm === "switch" && (
          <div className="rounded-[16px] bg-[#fff7dc] border-2 border-gold p-4 flex flex-col gap-3" role="group" aria-label="Confirm changing the resume">
            <p className="text-[15px]">Your current link will stop working. Sharing again makes a new link, and you will be asked again.</p>
            <div className="flex flex-wrap gap-2.5">
              <button type="button" aria-disabled={busy} onClick={() => { setConfirm(null); void save({ resumeId }, "Resume chosen. Sharing is off."); }} className={`${btn} ${wide} bg-ink text-white`}>Use it and stop sharing</button>
              <button type="button" onClick={() => setConfirm(null)} className={`${btn} ${wide} border-2 border-rule bg-white text-ink`}>Keep the current resume</button>
            </div>
          </div>
        )}

        {p?.shared && p.url && (
          <div className="flex flex-wrap items-center gap-2.5">
            <input ref={linkRef} readOnly value={p.url} aria-label="Your profile link" onFocus={(e) => e.currentTarget.select()} className="flex-1 basis-60 min-h-12 rounded-[14px] bg-[#f4f0e3] px-3.5 text-sm font-semibold text-ink-soft" />
            <button type="button" onClick={copy} className={`${btn} ${wide} border-2 border-ink bg-white text-ink`}>Copy link</button>
          </div>
        )}

        {noName && (
          <p className="text-[15px] text-[#b3261e] font-bold">
            This resume has no name yet, so it can&apos;t be shared. <Link href={`/builder/${resumeId}`} className="underline">Add your name</Link>
          </p>
        )}

        {confirm === "stop" && (
          <div className="rounded-[16px] bg-[#fff1f0] border-2 border-[#b3261e] p-4 flex flex-col gap-3" role="group" aria-label="Confirm stopping sharing">
            <p className="text-[15px]">The current link will stop working for good. Anyone who has it will see &ldquo;not found&rdquo;. Sharing again makes a new link.</p>
            <div className="flex flex-wrap gap-2.5">
              <button type="button" aria-disabled={busy} onClick={() => void stop()} className={`${btn} ${wide} bg-[#b3261e] text-white`}>Stop sharing</button>
              <button type="button" onClick={() => setConfirm(null)} className={`${btn} ${wide} border-2 border-rule bg-white text-ink`}>Keep sharing</button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2.5">
          {saved && chosen && (
            // A full page load on purpose; this path is also kept out of analytics (lib/analytics.ts isPrivatePath).
            <a href="/dashboard/profile/preview" className={`${btn} ${wide} bg-ink text-white`}>Preview as others see it</a>
          )}
          {p?.shared ? (
            confirm !== "stop" && <button type="button" aria-disabled={busy} onClick={() => setConfirm("stop")} className={`${btn} ${wide} border-2 border-rule bg-white text-[#b3261e]`}>Stop sharing</button>
          ) : (
            saved && chosen && !p?.takenDown && !noName && (
              <button ref={shareBtnRef} type="button" aria-disabled={busy} onClick={() => setAsking(true)} className={`${btn} ${wide} bg-gold text-ink shadow-[0_4px_0_var(--gold-deep)]`}>Share my profile</button>
            )
          )}
        </div>
      </section>

      <section className={card}>
        <h2 className="font-extrabold text-lg">What people can see</h2>
        <Row title="Name, headline, summary" hint="Always shown on a shared profile.">{() => <span className="text-[13px] font-extrabold text-slate">Always on</span>}</Row>
        <Row title="Experience, education, skills, projects" hint="Taken from the chosen resume.">{() => <span className="text-[13px] font-extrabold text-slate">Always on</span>}</Row>
        <Row title="Phone number and email" hint="Hidden unless you turn this on.">
          {(ids) => <Switch on={flags.showContact} {...ids} onChange={(v) => { if (saved && !busyRef.current) void save({ showContact: v }); }} />}
        </Row>
        <Row title="City" hint="Only the city and country, never your street address.">
          {(ids) => <Switch on={flags.showCity} {...ids} onChange={(v) => { if (saved && !busyRef.current) void save({ showCity: v }); }} />}
        </Row>
        <Row title="LinkedIn, website and project links" hint="Hidden unless you turn this on.">
          {(ids) => <Switch on={flags.showLinks} {...ids} onChange={(v) => { if (saved && !busyRef.current) void save({ showLinks: v }); }} />}
        </Row>
        <Row title="Work authorization and nationality" hint="Only if you filled them in. Date of birth is never shown.">
          {(ids) => <Switch on={flags.showPersonal} {...ids} onChange={(v) => { if (saved && !busyRef.current) void save({ showPersonal: v }); }} />}
        </Row>
        <Row title="Profile picture" hint="Shown on every profile. Initials until you add yours.">
          {() => (
            <div className="flex items-center gap-3">
              {p?.hasPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/profile/photo?v=${encodeURIComponent(p.photoVersion ?? "")}`} alt="Your profile picture" width={48} height={48} className="size-12 rounded-full object-cover border-2 border-rule" />
              ) : (
                <div aria-hidden="true" className="size-12 rounded-full bg-ink text-gold flex items-center justify-center font-brand font-extrabold text-lg">{initials}</div>
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" tabIndex={-1} className="sr-only" aria-hidden="true" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void upload(f); }} />
              <button type="button" aria-disabled={busy} onClick={() => fileRef.current?.click()} className={`${btn} min-h-11 border-2 border-ink bg-white text-ink`}>{p?.hasPhoto ? "Change picture" : "Upload picture"}</button>
              {p?.hasPhoto && <button type="button" aria-disabled={busy} onClick={() => void removePhoto()} className="min-h-11 px-2 text-sm font-bold text-slate underline">Remove</button>}
            </div>
          )}
        </Row>
        {p?.shared && <p className="text-[13px] text-slate">These switches change your live page straight away.</p>}
      </section>

      {saved && chosen && (
        <section className={card}>
          <h2 className="font-extrabold text-lg">Look and job search</h2>
          <fieldset className="flex flex-col gap-2.5 border-0 p-0">
            <legend className="font-bold">Banner style</legend>
            <div className="flex flex-wrap gap-2.5">
              {BANNER_STYLES.map((b) => (
                <label key={b.id} className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-full border-2 px-3.5 text-sm font-bold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-blue ${look.bannerStyle === b.id ? "border-ink bg-[#f4f0e3]" : "border-rule bg-white"}`}>
                  <input type="radio" name="banner" value={b.id} checked={look.bannerStyle === b.id} onChange={() => patchLook({ bannerStyle: b.id })} className="sr-only" />
                  <span aria-hidden="true" className="size-5 rounded-full border border-rule" style={{ background: b.bg }} />
                  {b.label}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-col gap-1">
            <label htmlFor="pf-pronouns" className="font-bold">Pronouns <span className="font-normal text-slate">(optional)</span></label>
            <input id="pf-pronouns" maxLength={30} value={look.pronouns} onChange={(e) => patchLook({ pronouns: e.target.value })} placeholder="she/her, he/him, they/them" className="min-h-12 rounded-[14px] border-2 border-rule bg-paper px-4 font-semibold" />
          </div>
          <Row title="Open to work" hint="Shows a green chip on your page with what you are looking for.">
            {(ids) => <Switch on={look.openToWork} {...ids} onChange={(v) => patchLook({ openToWork: v })} />}
          </Row>
          {look.openToWork && (
            <div className="grid gap-3 sm:grid-cols-3">
              {([
                ["otwRole", "Role", "Data Analyst", 60],
                ["otwPlace", "City or remote", "Pune or remote", 60],
                ["otwNotice", "Notice period", "30 days notice", 40],
              ] as const).map(([key, label, ph, max]) => (
                <div key={key} className="flex flex-col gap-1">
                  <label htmlFor={`pf-${key}`} className="text-sm font-bold text-slate">{label}</label>
                  <input id={`pf-${key}`} maxLength={max} value={look[key]} onChange={(e) => patchLook({ [key]: e.target.value })} placeholder={ph} className="min-h-12 rounded-[14px] border-2 border-rule bg-paper px-4 font-semibold" />
                </div>
              ))}
            </div>
          )}
          <Row title="Last updated" hint="Shows when your resume was last changed, as “2 days ago”.">
            {(ids) => <Switch on={look.showUpdated} {...ids} onChange={(v) => patchLook({ showUpdated: v })} />}
          </Row>
          <p className="text-[13px] text-slate">Everything you type here is public once you share. Don&apos;t put a phone number or email in these boxes.{p?.shared ? " Changes show on your live page straight away." : ""}</p>
          <button type="button" aria-disabled={busy} onClick={() => { if (!busyRef.current) void saveLook(); }} className={`${btn} ${wide} bg-ink text-white self-start`}>Save look and job search</button>
        </section>
      )}

      <p className="text-[13px] text-slate">Details on a profile are provided by the owner and are not verified by Lettr. Deleting your account removes your profile page straight away.</p>

      {asking && (
        <dialog
          ref={(el) => { if (el && !el.open) el.showModal(); }}
          aria-labelledby="share-title"
          aria-describedby="share-desc"
          onCancel={(e) => { e.preventDefault(); setAsking(false); setAgeOk(false); shareBtnRef.current?.focus(); }}
          className="m-auto w-[calc(100%-2rem)] max-w-[480px] rounded-[28px] bg-paper p-0 text-ink shadow-2xl backdrop:bg-ink/50"
        >
          <div className="flex max-h-[90vh] flex-col gap-3.5 overflow-auto p-6 sm:p-7">
            <h2 id="share-title" className="font-brand font-extrabold text-2xl">Share your profile?</h2>
            <div id="share-desc" className="flex flex-col gap-3 text-[15px] text-ink-soft">
              <p>Anyone with your link will be able to see this:</p>
              <ul className="list-disc pl-5 flex flex-col gap-1">{lines.shown.map((l) => <li key={l}>{l}</li>)}</ul>
              {lines.hidden.length > 0 && (
                <>
                  <p><b>Not shared (you can turn these on):</b></p>
                  <ul className="list-disc pl-5 flex flex-col gap-1">{lines.hidden.map((l) => <li key={l}>{l}</li>)}</ul>
                </>
              )}
              <p>{lines.never} Search engines are told not to list your page.</p>
              <p className="text-sm text-slate">You can stop sharing any time. Deleting your account removes the page straight away.</p>
            </div>
            <label className="flex items-start gap-3 text-sm min-h-11">
              <input type="checkbox" checked={ageOk} onChange={(e) => setAgeOk(e.target.checked)} className="size-[22px] mt-0.5 shrink-0 accent-brand-blue" />
              <span>I am {PROFILE_MIN_AGE} or older and I understand what becomes public.</span>
            </label>
            {msg && !msg.ok && <p role="alert" key={msg.id} className="text-sm font-bold text-[#b3261e]">{msg.text}</p>}
            <div className="flex flex-wrap gap-2.5 mt-1">
              <button type="button" aria-disabled={busy || !ageOk} onClick={() => { if (ageOk && !busyRef.current) void share(); }} className={`${btn} ${wide} bg-gold text-ink shadow-[0_4px_0_var(--gold-deep)]`}>Start sharing</button>
              <button type="button" onClick={() => { setAsking(false); setAgeOk(false); shareBtnRef.current?.focus(); }} className={`${btn} ${wide} border-2 border-rule bg-white text-ink`}>Keep it private</button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
