"use client";

import { useState } from "react";
import { scoreResumeAgainstJob } from "@/lib/ats-score";
import { ScoreRing } from "@/components/ScoreRing";

const SAMPLE_RESUME_TEXT =
  "Backend engineer with 5 years building scalable APIs. Skills: Python, Django, PostgreSQL, AWS, Docker.";

export function HeroScoreDemo() {
  const [jd, setJd] = useState("");
  const [result, setResult] = useState<ReturnType<typeof scoreResumeAgainstJob> | null>(null);

  function analyze() {
    if (!jd.trim()) return;
    const scored = scoreResumeAgainstJob(
      {
        contact: { fullName: "", email: "" },
        summary: SAMPLE_RESUME_TEXT,
        experience: [],
        education: [],
        skills: ["Python", "Django", "PostgreSQL", "AWS", "Docker"],
      },
      jd
    );
    setResult(scored);
  }

  return (
    <div className="paper-sheet rounded-sm p-6 rotate-1">
      <p className="text-xs uppercase tracking-wide text-ink-soft mb-3">Try it — no signup needed</p>
      <textarea
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        placeholder="Paste a job description…"
        rows={3}
        className="w-full border border-rule rounded-sm px-3 py-2 text-sm bg-paper-raised focus:outline-none focus:ring-2 focus:ring-seal/40 mb-3"
      />
      <button
        onClick={analyze}
        className="w-full bg-seal text-white text-sm font-medium py-2 rounded-sm hover:opacity-90 mb-4"
      >
        Analyze against a sample resume
      </button>

      {result && (
        <>
          <div className="flex items-center gap-4 mb-3">
            <ScoreRing value={result.score} size={64} strokeWidth={8} />
            <p className="text-xs text-ink-soft">
              {result.matchedKeywords.length} of {result.totalKeywords} key terms matched against our sample backend-engineer resume.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.matchedKeywords.slice(0, 6).map((kw) => (
              <span key={kw} className="text-xs font-mono bg-seal-soft text-seal-deep px-2 py-1 rounded-sm">
                {kw}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
