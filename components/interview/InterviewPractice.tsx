"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { InterviewQuestion, InterviewSessionRow } from "@/lib/db";

const KIND_LABEL: Record<string, string> = { behavioural: "Behavioural", role: "About the role", resume: "About your resume" };

/** Form that starts a new practice interview. */
export function StartInterview({
  resumes,
  defaultRole,
  limitNote,
}: {
  resumes: { id: string; title: string }[];
  defaultRole: string;
  limitNote: string;
}) {
  const router = useRouter();
  const [role, setRole] = useState(defaultRole);
  const [company, setCompany] = useState("");
  const [jobPost, setJobPost] = useState("");
  const [resumeId, setResumeId] = useState(resumes[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; upgrade?: boolean } | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, company: company || undefined, jobPost: jobPost || undefined, resumeId: resumeId || undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError({ text: body.error ?? "Couldn't start. Try again.", upgrade: body.upgradeRequired });
        return;
      }
      router.push(`/dashboard/interview/${body.session.id}`);
    } catch {
      setError({ text: "Couldn't reach the server. Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white border-2 border-ink rounded-[28px] shadow-[6px_6px_0_var(--ink)] p-5 sm:p-7">
      <h2 className="font-brand font-extrabold text-2xl">Start a practice interview</h2>
      <p className="text-slate mt-1 mb-5">You get 6 questions like a real interviewer would ask. Answer in your own words, out loud or typed, and get honest feedback on each.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-bold text-slate">Job title *</span>
          <input value={role} onChange={(e) => setRole(e.target.value)} className="field-input mt-1" placeholder="Product Manager" />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate">Company (optional)</span>
          <input value={company} onChange={(e) => setCompany(e.target.value)} className="field-input mt-1" placeholder="Flipkart" />
        </label>
        {resumes.length > 0 && (
          <label className="block sm:col-span-2">
            <span className="text-sm font-bold text-slate">Your resume (for one question about your own background)</span>
            <select value={resumeId} onChange={(e) => setResumeId(e.target.value)} className="field-input mt-1">
              <option value="">Don&apos;t use a resume</option>
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="block sm:col-span-2">
          <span className="text-sm font-bold text-slate">Job post (optional, makes the questions sharper)</span>
          <textarea value={jobPost} onChange={(e) => setJobPost(e.target.value)} rows={4} className="field-input mt-1" />
        </label>
      </div>
      {error && (
        <p className="text-sm text-red-600 mt-3">
          {error.text}{" "}
          {error.upgrade && (
            <Link href="/pricing" className="font-bold underline">
              See Pro
            </Link>
          )}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4 mt-5">
        <button
          type="button"
          onClick={start}
          disabled={busy || role.trim().length < 2}
          className="btn-press inline-flex items-center min-h-12 px-6 rounded-full bg-brand-blue text-white font-bold shadow-[0_4px_0_var(--brand-blue-deep)] disabled:opacity-60"
        >
          {busy ? "Writing your questions…" : "Start practising"}
        </button>
        <span className="text-sm text-slate">{limitNote}</span>
      </div>
    </div>
  );
}

type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getSpeech(): (new () => SpeechRec) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** One practice interview: answer each question and get feedback. */
export function InterviewSession({ initial }: { initial: InterviewSessionRow }) {
  const [questions, setQuestions] = useState<InterviewQuestion[]>(initial.questions);
  const firstOpen = Math.max(0, questions.findIndex((q) => !q.feedback));
  const [index, setIndex] = useState(firstOpen === -1 ? 0 : firstOpen);
  const q = questions[index];
  const [answer, setAnswer] = useState(q?.answer ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; upgrade?: boolean } | null>(null);
  const [listening, setListening] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const recRef = useRef<SpeechRec | null>(null);

  useEffect(() => {
    // Voice input only exists in some browsers, so check after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only feature check
    setCanSpeak(Boolean(getSpeech()));
    return () => recRef.current?.stop();
  }, []);

  function go(i: number) {
    recRef.current?.stop();
    setIndex(i);
    setAnswer(questions[i]?.answer ?? "");
    setError(null);
  }

  function toggleVoice() {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const Rec = getSpeech();
    if (!Rec) return;
    const rec = new Rec();
    rec.lang = "en-IN";
    rec.continuous = true;
    rec.interimResults = false;
    const startText = answer ? answer.trimEnd() + " " : "";
    let heard = "";
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) heard += e.results[i][0].transcript + " ";
      }
      setAnswer(startText + heard.trim());
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  }

  async function submit() {
    recRef.current?.stop();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/interview/${initial.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: q.id, answer }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError({ text: body.error ?? "Couldn't review your answer.", upgrade: body.upgradeRequired });
        return;
      }
      setQuestions((list) => list.map((x) => (x.id === q.id ? { ...x, answer, feedback: body.feedback } : x)));
    } catch {
      setError({ text: "Couldn't reach the server. Try again." });
    } finally {
      setBusy(false);
    }
  }

  const done = questions.filter((x) => x.feedback);
  const avg = done.length ? Math.round((done.reduce((n, x) => n + (x.feedback?.score ?? 0), 0) / done.length) * 10) / 10 : null;
  if (!q) return null;

  return (
    <div className="grid lg:grid-cols-[1fr_18rem] gap-6 items-start">
      <section className="bg-white border-2 border-ink rounded-[28px] shadow-[6px_6px_0_var(--ink)] p-5 sm:p-7">
        <p className="text-sm font-bold text-slate">
          Question {index + 1} of {questions.length} · {KIND_LABEL[q.kind] ?? "Question"}
        </p>
        <h2 className="font-brand font-extrabold text-2xl sm:text-[28px] leading-snug mt-2">{q.question}</h2>
        <p className="text-sm text-slate mt-3">
          Tip: tell a real story. What was the situation, what did <i>you</i> do, and what was the result (with a number if you can)?
        </p>
        <label className="block mt-4">
          <span className="sr-only">Your answer</span>
          <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={7} className="field-input" placeholder="Type your answer, or press Speak and say it out loud." />
        </label>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <button
            type="button"
            onClick={submit}
            disabled={busy || answer.trim().length < 20}
            className="btn-press inline-flex items-center min-h-11 px-5 rounded-full bg-brand-blue text-white font-bold shadow-[0_4px_0_var(--brand-blue-deep)] disabled:opacity-60"
          >
            {busy ? "Reviewing…" : q.feedback ? "Review again" : "Get feedback"}
          </button>
          {canSpeak && (
            <button
              type="button"
              onClick={toggleVoice}
              aria-pressed={listening}
              className={`inline-flex items-center gap-2 min-h-11 px-5 rounded-full border-2 font-bold ${listening ? "border-red-500 text-red-600 bg-red-50" : "border-ink bg-white"}`}
            >
              <span aria-hidden="true" className={`w-2.5 h-2.5 rounded-full ${listening ? "bg-red-500 animate-pulse" : "bg-ink"}`} />
              {listening ? "Stop" : "Speak"}
            </button>
          )}
          <span className="text-sm text-slate">{answer.trim().split(/\s+/).filter(Boolean).length} words</span>
        </div>
        {error && (
          <p className="text-sm text-red-600 mt-3">
            {error.text}{" "}
            {error.upgrade && (
              <Link href="/pricing" className="font-bold underline">
                See Pro
              </Link>
            )}
          </p>
        )}

        {q.feedback && (
          <div className="mt-6 border-t-2 border-rule pt-5" aria-live="polite">
            <div className="flex items-center gap-3">
              <span className={`w-14 h-14 rounded-full flex items-center justify-center font-brand font-extrabold text-2xl ${q.feedback.score >= 8 ? "bg-[#DCF3E5] text-[#1F7A45]" : q.feedback.score >= 5 ? "bg-gold-soft" : "bg-red-50 text-red-700"}`}>
                {q.feedback.score}
              </span>
              <p className="font-extrabold">
                {q.feedback.score >= 8 ? "Strong answer." : q.feedback.score >= 5 ? "Good start. A few things would make it stronger." : "Needs work. Here's how to fix it."}
              </p>
            </div>
            {q.feedback.strengths.length > 0 && (
              <>
                <p className="font-bold mt-4">What worked</p>
                <ul className="list-disc pl-5 text-slate">
                  {q.feedback.strengths.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </>
            )}
            {q.feedback.improve.length > 0 && (
              <>
                <p className="font-bold mt-3">Make it better</p>
                <ul className="list-disc pl-5 text-slate">
                  {q.feedback.improve.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </>
            )}
            {q.feedback.better && (
              <details className="mt-3 bg-cream rounded-2xl px-4 py-3">
                <summary className="font-bold cursor-pointer min-h-10 flex items-center">See a stronger version</summary>
                <p className="mt-2 leading-relaxed whitespace-pre-wrap">{q.feedback.better}</p>
              </details>
            )}
          </div>
        )}

        <div className="flex justify-between gap-3 mt-6">
          <button type="button" onClick={() => go(index - 1)} disabled={index === 0} className="min-h-11 px-4 font-bold text-slate disabled:opacity-30">
            ← Previous
          </button>
          {index < questions.length - 1 ? (
            <button type="button" onClick={() => go(index + 1)} className="min-h-11 px-5 rounded-full border-2 border-ink font-bold bg-white">
              Next question →
            </button>
          ) : (
            <Link href="/dashboard/interview" className="min-h-11 px-5 rounded-full border-2 border-ink font-bold bg-white inline-flex items-center">
              Finish
            </Link>
          )}
        </div>
      </section>

      <aside aria-label="Questions" className="bg-white border border-rule rounded-[24px] p-5">
        <p className="font-extrabold">{initial.role}</p>
        {initial.company && <p className="text-sm text-slate">{initial.company}</p>}
        {avg !== null && (
          <p className="mt-3 text-sm">
            Average so far: <span className="font-extrabold text-lg">{avg}</span>/10
          </p>
        )}
        <ol className="mt-4 space-y-1.5">
          {questions.map((x, i) => (
            <li key={x.id}>
              <button
                type="button"
                onClick={() => go(i)}
                className={`w-full text-left text-sm rounded-xl px-3 py-2 min-h-10 flex items-center gap-2 ${i === index ? "bg-ink text-white" : "hover:bg-sand"}`}
              >
                <span className={`w-6 h-6 shrink-0 rounded-full text-xs font-extrabold flex items-center justify-center ${x.feedback ? "bg-[#1F9D55] text-white" : i === index ? "bg-white text-ink" : "bg-sand"}`}>
                  {x.feedback ? "✓" : i + 1}
                </span>
                <span className="line-clamp-2">{x.question}</span>
              </button>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
