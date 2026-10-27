"use client";

import { useState } from "react";
import { ProCheckoutButton, type CheckoutState } from "@/components/ProCheckoutButton";

export type PickerPlan = {
  id: "monthly" | "quarter" | "yearly";
  /** Short label for the switch, e.g. "3 months". */
  tab: string;
  name: string;
  blurb: string;
  price: string;
  period: string;
  /** "₹500 a month · you save ₹298" style line, empty for monthly. */
  note: string;
  savePercent: number;
  /** Button text when Pro is already running, e.g. "Add 3 months". */
  addLabel: string;
};

const FEATURES = (templateCount: number) => [
  "Everything in Free",
  "Unlimited resumes, clean PDFs, Word & Drive",
  `All ${templateCount} templates, any colour`,
  "Unlimited AI rewrites & cover letters (fair use)",
  "AI Resume Agent",
  "ATS analyst & interview practice",
  "All missing keywords, unlimited job tracking",
];

/**
 * The Monthly / 3 months / Yearly switch above the plan cards, and the one Pro
 * card it controls. Starts on the 3-month pass. `children` is the Free card.
 * Every plan is a one-time payment; buying while on Pro adds the time.
 */
export function ProPlanPicker({
  plans,
  templateCount,
  checkout,
  proUntil = null,
  children,
}: {
  plans: PickerPlan[];
  templateCount: number;
  checkout: CheckoutState;
  /** End date of the Pro pass this person already has, e.g. "17 Jan 2027". */
  proUntil?: string | null;
  children: React.ReactNode;
}) {
  const [selected, setSelected] = useState<PickerPlan["id"]>("quarter");
  const plan = plans.find((p) => p.id === selected) ?? plans[0];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-center mb-8">
        <div
          role="radiogroup"
          aria-label="Billing period"
          className="inline-flex gap-1 p-1.5 bg-white border-2 border-rule rounded-full max-w-full"
        >
          {plans.map((p) => {
            const active = p.id === selected;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSelected(p.id)}
                className={`min-h-10 px-3 sm:px-4 rounded-full text-[13px] sm:text-sm font-bold whitespace-nowrap ${
                  active ? "bg-ink text-white" : "text-ink hover:bg-sand"
                }`}
              >
                {p.tab}
                {p.savePercent > 0 && (
                  <span className={active ? "text-gold" : "text-brand-blue"}>
                    <span className="hidden sm:inline"> · Save</span>
                    <span className="sm:hidden"> −</span> {p.savePercent}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-stretch">
        <div className="md:order-none order-last">{children}</div>
        <div className="relative rounded-[32px] p-7 flex flex-col bg-ink text-white shadow-[8px_8px_0_var(--gold)]">
          {plan.id === "quarter" && (
            <span className="absolute -top-3.5 right-6 bg-gold text-ink text-xs font-extrabold px-3 py-1.5 rounded-full rotate-[4deg]">
              Most popular
            </span>
          )}
          {plan.id === "yearly" && (
            <span className="absolute -top-3.5 right-6 bg-gold text-ink text-xs font-extrabold px-3 py-1.5 rounded-full rotate-[4deg]">
              Best value
            </span>
          )}
          <h2 className="font-brand font-extrabold text-2xl">
            Pro <span className="text-gold">· {plan.name}</span>
          </h2>
          <p className="mt-1 text-white/70">{plan.blurb}</p>
          <div
            className="mt-4 flex flex-wrap items-baseline gap-x-1.5"
            aria-live="polite"
          >
            <span className="font-brand font-extrabold text-[44px] leading-none">
              {plan.price}
            </span>
            <span className="text-sm font-bold whitespace-nowrap text-white/70">
              {plan.period}
            </span>
          </div>
          <p className="mt-2 mb-6 text-sm font-bold min-h-5 text-gold">
            {plan.note}
          </p>
          <ul className="space-y-3 mb-8 flex-1">
            {FEATURES(templateCount).map((f) => (
              <li key={f} className="flex items-start gap-3">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--gold)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="shrink-0 mt-[3px]"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
          {proUntil && checkout === "ready" && (
            <p className="mb-3 text-sm text-white/80">
              You&apos;re on Pro until {proUntil}. Buying now adds the time after that.
            </p>
          )}
          <ProCheckoutButton
            key={plan.id}
            plan={plan.id}
            state={checkout}
            label={proUntil ? plan.addLabel : "Get Pro"}
          />
          <p className="mt-3 text-center text-xs text-white/60">
            One-time payment · No auto-renewal · UPI, cards &amp; netbanking
          </p>
        </div>
      </div>
    </div>
  );
}
