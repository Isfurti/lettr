"use client";

import { useState } from "react";
import Link from "next/link";
import { scoreResumeAgainstJob } from "@/lib/ats-score";
import { emptyResume, type ResumeData } from "@/lib/types";
import { ScoreRing } from "@/components/ScoreRing";

// A handful of realistic sample profiles. The demo compares the pasted job
// against whichever sample is closest to it, so a marketer pasting a
// marketing job isn't scored against a backend-engineer resume.
const SAMPLES: { label: string; summary: string; skills: string[] }[] = [
  {
    label: "software engineer",
    summary: "Backend engineer with 5 years building scalable APIs and cloud services.",
    skills: ["Python", "Django", "PostgreSQL", "AWS", "Docker", "REST APIs", "Git", "CI/CD"],
  },
  {
    label: "marketing",
    summary: "B2B SaaS marketer running product launches, campaigns and go-to-market strategy.",
    skills: ["SEO", "Content marketing", "HubSpot", "Google Analytics", "Campaigns", "Positioning", "Social media"],
  },
  {
    label: "sales",
    summary: "Account executive closing mid-market deals and building pipeline through outbound prospecting.",
    skills: ["Salesforce", "Pipeline management", "Negotiation", "Prospecting", "CRM", "Quota attainment"],
  },
  {
    label: "data analyst",
    summary: "Data analyst turning raw data into dashboards and insights for business teams.",
    skills: ["SQL", "Excel", "Tableau", "Power BI", "Python", "Statistics", "Reporting"],
  },
  {
    label: "product designer",
    summary: "Product designer shipping user research, wireframes and prototypes for mobile and web apps.",
    skills: ["Figma", "User research", "Prototyping", "Wireframes", "Design systems", "Usability testing"],
  },
];

function toResume(sample: (typeof SAMPLES)[number]): ResumeData {
  return { ...emptyResume, summary: sample.summary, skills: sample.skills };
}

export function HeroScoreDemo() {
  const [jd, setJd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ score: ReturnType<typeof scoreResumeAgainstJob>; sample: string } | null>(null);

  function analyze() {
    if (jd.trim().length < 30) {
      setError("Paste a few lines of a real job description to try it.");
      setResult(null);
      return;
    }
    setError(null);
    const scored = SAMPLES.map((s) => ({ sample: s.label, score: scoreResumeAgainstJob(toResume(s), jd) }));
    scored.sort((a, b) => b.score.score - a.score.score);
    setResult(scored[0]);
  }

  return (
    <div className="paper-sheet rounded-sm p-5 sm:p-6 md:rotate-1">
      <p className="text-xs uppercase tracking-wide text-ink-soft mb-3">Try it — no signup needed</p>
      <label htmlFor="hero-jd" className="sr-only">Job description</label>
      <textarea
        id="hero-jd"
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        placeholder="Paste a job description you're interested in…"
        rows={4}
        className="w-full border border-rule rounded-sm px-3 py-2 text-sm bg-paper-raised focus:outline-none focus:ring-2 focus:ring-seal/40 mb-3"
      />
      <button
        onClick={analyze}
        className="w-full bg-seal text-white text-sm font-medium py-2.5 rounded-sm hover:opacity-90 mb-3"
      >
        See what a resume would be missing
      </button>
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

      {result && (
        <div className="border-t border-rule pt-4">
          <div className="flex items-center gap-4 mb-3">
            <ScoreRing value={result.score.score} size={64} strokeWidth={8} />
            <p className="text-xs text-ink-soft">
              A sample <strong className="text-ink">{result.sample}</strong> resume matches{" "}
              {result.score.matchedKeywords.length} of {result.score.totalKeywords} key terms from this job.
            </p>
          </div>
          {result.score.missingKeywords.length > 0 && (
            <>
              <p className="text-[11px] uppercase tracking-wide text-ink-soft mb-1.5">Keywords it&apos;s missing</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {result.score.missingKeywords.slice(0, 8).map((kw) => (
                  <span key={kw} className="text-xs font-mono bg-red-50 text-red-700 px-2 py-0.5 rounded-sm">
                    {kw}
                  </span>
                ))}
              </div>
            </>
          )}
          <Link
            href="/builder/new"
            onClick={() => {
              try {
                window.localStorage.setItem("lettr_pending_jd", jd);
              } catch {
                // storage unavailable - they can paste it again in Job Match
              }
            }}
            className="block text-center w-full bg-ink text-white text-sm font-medium py-2.5 rounded-sm hover:opacity-90"
          >
            Check my own resume against this job →
          </Link>
        </div>
      )}
    </div>
  );
}
