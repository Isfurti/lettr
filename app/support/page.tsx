"use client";

import { useState } from "react";
import { Footer } from "@/components/Footer";
import { PublicNav } from "@/components/PublicNav";
import { COMPANY } from "@/lib/company";

export default function SupportPage() {
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, subject, message }),
    });
    setStatus(res.ok ? "sent" : "error");
    if (res.ok) {
      setSubject("");
      setMessage("");
    }
  }

  return (
    <>
      <PublicNav />
      <main className="flex-1 bg-cream text-ink px-4 sm:px-8 lg:px-14 py-10 sm:py-16">
        <div className="max-w-[1180px] mx-auto grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-12 items-start">
          <div className="rise">
            <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-brand-blue mb-3">Help</p>
            <h1 className="font-brand font-extrabold text-[40px] sm:text-[56px] leading-[1.02] tracking-tight">
              How can we help?
            </h1>
            <p className="mt-4 text-lg text-slate">Quick answers first. If yours isn&apos;t here, send us a message.</p>
            <div className="mt-8 flex flex-col gap-3">
              {HELP.map((f) => (
                <details key={f.q} className="group bg-white rounded-2xl border border-rule open:border-ink transition-colors">
                  <summary className="cursor-pointer list-none flex items-center justify-between gap-4 min-h-14 px-5 py-4 font-bold text-lg [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span aria-hidden="true" className="shrink-0 w-8 h-8 rounded-full bg-brand-blue-soft text-brand-blue flex items-center justify-center text-xl font-extrabold transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="px-5 pb-5 -mt-1 text-slate leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
            <div className="mt-8 bg-white rounded-2xl border border-rule p-5 text-slate leading-relaxed">
              <p className="font-extrabold text-ink">Contact and grievances</p>
              <p className="mt-1">
                Lettr is run by {COMPANY.legalName}, {COMPANY.addressLines.join(", ")}.
              </p>
              <p className="mt-1">
                Email{" "}
                <a href={`mailto:${COMPANY.contactEmail}`} className="font-bold text-brand-blue hover:underline">
                  {COMPANY.contactEmail}
                </a>
                . Grievance officer: {COMPANY.grievanceOfficer.name}.
              </p>
            </div>
          </div>

          <div className="bg-white border-2 border-ink rounded-[32px] shadow-[8px_8px_0_var(--ink)] p-7 sm:p-10 lg:sticky lg:top-8">
            {status === "sent" ? (
              <div className="text-center py-6">
                <p className="mx-auto mb-4 w-14 h-14 rounded-full bg-gold text-ink text-2xl font-extrabold flex items-center justify-center shadow-[0_4px_0_var(--gold-deep)]">✓</p>
                <h2 className="font-brand font-extrabold text-3xl tracking-tight">Message sent</h2>
                <p className="mt-2 text-slate">We&apos;ll get back to you at {email}.</p>
                <button
                  onClick={() => setStatus("idle")}
                  className="mt-6 min-h-11 font-bold text-brand-blue hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <div>
                  <h2 className="font-brand font-extrabold text-3xl tracking-tight">Contact support</h2>
                  <p className="mt-1 text-slate">A real person reads every message.</p>
                </div>
                <label className="block">
                  <span className="text-sm font-bold text-slate">Your email</span>
                  <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field-input mt-1.5" />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate">Subject</span>
                  <input required value={subject} onChange={(e) => setSubject(e.target.value)} className="field-input mt-1.5" />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate">Message</span>
                  <textarea required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className="field-input mt-1.5" />
                </label>

                {status === "error" && <p className="text-sm font-bold text-red-600">Something went wrong. Please try again.</p>}

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="btn-press w-full min-h-12 rounded-full bg-brand-blue text-white font-bold shadow-[0_5px_0_var(--brand-blue-deep)] disabled:opacity-60"
                >
                  {status === "sending" ? "Sending…" : "Send message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

const HELP = [
  {
    q: "How do I download my resume?",
    a: "Open your resume in the builder and press Download PDF. Free accounts get 3 PDF downloads; Pro is unlimited and adds Word (.docx) and Google Drive.",
  },
  {
    q: "Can I import the resume I already have?",
    a: "Yes. Create a free account, then upload a PDF or Word file from your dashboard. Lettr fills in the sections for you to check and edit.",
  },
  {
    q: "What does the resume score check?",
    a: "Your contact details, summary, how your bullets are written (action verbs and numbers), education and skills. Lettr's notes tell you what to fix next.",
  },
  {
    q: "How does job match work?",
    a: "Paste a job post in the Job match tab. Lettr shows your match score, the keywords you already cover and the ones you're missing. Add only what's true for you.",
  },
  {
    q: "How do I cancel Pro?",
    a: "Open the billing portal from your dashboard. You keep Pro until the end of the period you've paid for.",
  },
  {
    q: "How do I delete my account?",
    a: "Go to your dashboard and use Delete my account at the bottom. This removes your account and your resumes.",
  },
];
