"use client";

import Link from "next/link";
import { CalendarDays, CreditCard, Layers3 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { EmptyStateCard, ProtectedAppShell } from "@/components/can-afford/route-shells";
import { DarkFormCard } from "@/components/can-afford/shared";
import { useCanAffordIt } from "@/components/providers/can-afford-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createSampleDecisionInputs, getCategoryOptions } from "@/lib/can-afford/defaults";
import { deriveDecisionTitle } from "@/lib/can-afford/insights";
import type { DecisionInput, DecisionTiming } from "@/lib/finance/types";
import { cn } from "@/lib/utils/cn";

const timingOptions: Array<{ value: DecisionTiming; label: string }> = [
  { value: "now", label: "Now" },
  { value: "within_3_months", label: "Within 3 Months" },
  { value: "later", label: "Later" }
];

const blankDecision: DecisionInput = {
  id: "",
  scenarioKey: null,
  title: "",
  question: "",
  amount: 0,
  monthlyImpact: 0,
  durationMonths: 12,
  category: "electronics",
  timing: "now",
  currency: "INR"
};

export function DecisionFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, createDecision } = useCanAffordIt();
  const [form, setForm] = useState<DecisionInput>(blankDecision);
  const [hasMonthlyImpact, setHasMonthlyImpact] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const question = searchParams?.get("question");
    if (!question) {
      return;
    }

    setForm((current) => ({
      ...current,
      question,
      title: current.title || deriveDecisionTitle(question)
    }));
  }, [searchParams]);

  const samples = useMemo(() => createSampleDecisionInputs(), []);

  if (!profile) {
    return (
      <ProtectedAppShell title="New Decision" eyebrow="Decide">
        <EmptyStateCard
          title="Finish onboarding first"
          description="The engine needs your salary, obligations, savings, and goals before it can run a verdict."
          action={
            <Link
              href="/onboarding"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#00677f_0%,#00d1ff_100%)] px-5 text-sm font-semibold uppercase tracking-[0.18em] text-white"
            >
              Continue Onboarding
            </Link>
          }
        />
      </ProtectedAppShell>
    );
  }

  function updateField<Key extends keyof DecisionInput>(key: Key, value: DecisionInput[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  function applyTemplate(template: DecisionInput) {
    setForm({
      ...template,
      id: "",
      title: template.title,
      question: template.question
    });
    setHasMonthlyImpact(template.monthlyImpact !== 0);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const question = form.question.trim();
    const title = form.title.trim() || deriveDecisionTitle(question);
    if (!question && !title) {
      setError("Add a title or a question before analyzing the decision.");
      setSubmitting(false);
      return;
    }

    if (form.amount <= 0) {
      setError("Add the decision amount before continuing.");
      setSubmitting(false);
      return;
    }

    const result = await createDecision({
      ...form,
      id: crypto.randomUUID(),
      title,
      question: question || title,
      monthlyImpact: hasMonthlyImpact ? form.monthlyImpact : 0,
      durationMonths: hasMonthlyImpact ? Math.max(1, form.durationMonths ?? 12) : form.durationMonths
    });

    setSubmitting(false);

    if (!result.ok || !result.decision) {
      setError(result.message ?? "Unable to run that decision.");
      return;
    }

    router.push(`/decisions/${result.decision.id}`);
  }

  return (
    <ProtectedAppShell title="New Decision" eyebrow="Decide">
      <form className="space-y-8" onSubmit={handleSubmit}>
        <section className="rounded-[2rem] bg-[#0e1320]/70 px-2 py-2">
          <div className="rounded-[1.8rem] bg-[#1a1f2c]/85 px-6 py-8 sm:px-8">
            <h2 className="font-[var(--font-newsreader)] text-5xl leading-tight text-white sm:text-6xl">
              What&apos;s on your <span className="italic text-[#adc6ff]">mind</span>?
            </h2>
            <div className="mt-7">
              <Textarea
                value={form.question}
                onChange={(event) => updateField("question", event.target.value)}
                placeholder="Should I buy a new iPhone on EMI?"
                rows={2}
                className="min-h-[120px] border-0 bg-transparent px-0 text-3xl font-[var(--font-newsreader)] italic text-[#adc6ff] placeholder:text-white/18 focus:border-transparent focus:bg-transparent"
              />
              <div className="h-px bg-gradient-to-r from-[#adc6ff]/40 to-transparent" />
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <DarkFormCard label="Title" description="Optional if the question already says it clearly.">
            <Input value={form.title} onChange={(event) => updateField("title", event.target.value)} placeholder="iPhone on EMI" />
          </DarkFormCard>

          <DarkFormCard label="Category" description="Choose the closest decision type.">
            <Select value={form.category} onChange={(event) => updateField("category", event.target.value as DecisionInput["category"])}>
              {getCategoryOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </DarkFormCard>

          <DarkFormCard label="Amount" description="The full amount you are considering committing.">
            <div className="flex items-center gap-4 rounded-[1.4rem] bg-[#252a37] px-5 py-4">
              <span className="text-lg font-semibold text-[#adc6ff]">INR</span>
              <Input
                value={form.amount}
                onChange={(event) => updateField("amount", Number(event.target.value || 0))}
                type="number"
                min={0}
                className="border-0 bg-transparent px-0 text-2xl font-[var(--font-manrope)] font-bold focus:bg-transparent"
              />
            </div>
          </DarkFormCard>

          <DarkFormCard label="Timing" description="Model immediate impact versus a planned future purchase.">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {timingOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateField("timing", option.value)}
                  className={cn(
                    "rounded-[1.4rem] px-4 py-4 text-sm font-semibold transition",
                    form.timing === option.value
                      ? "bg-[#303442] text-[#adc6ff] ring-1 ring-[#adc6ff]/30"
                      : "bg-[#252a37] text-white/62 hover:bg-[#303442]"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </DarkFormCard>

          <DarkFormCard
            label="Recurring Monthly Impact"
            description="Turn this on for EMI, SIP increase, rent jump, or any change that affects monthly cash flow."
            className="md:col-span-1"
          >
            <button
              type="button"
              onClick={() => setHasMonthlyImpact((current) => !current)}
              className="flex w-full items-center justify-between rounded-full border border-white/8 bg-[#161b28] px-5 py-4 text-left"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-[#4fdbc8]/10 text-[#4fdbc8]">
                  <CreditCard size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{hasMonthlyImpact ? "Monthly impact enabled" : "One-time decision only"}</p>
                  <p className="text-xs text-white/46">{hasMonthlyImpact ? "EMI or recurring change is included" : "Keep monthly drag at zero"}</p>
                </div>
              </div>
              <span className={cn("h-6 w-12 rounded-full transition", hasMonthlyImpact ? "bg-[#04b4a2]" : "bg-white/12")}>
                <span
                  className={cn(
                    "mt-1 block size-4 rounded-full bg-white transition",
                    hasMonthlyImpact ? "ml-7" : "ml-1"
                  )}
                />
              </span>
            </button>
          </DarkFormCard>

          <DarkFormCard label={hasMonthlyImpact ? "EMI / Monthly Change" : "Monthly Change"} description="Positive values reduce free cash. Negative values improve it.">
            <div className="flex items-center gap-4 rounded-[1.4rem] bg-[#252a37] px-5 py-4">
              <span className="text-lg font-semibold text-[#adc6ff]">₹</span>
              <Input
                value={form.monthlyImpact}
                onChange={(event) => updateField("monthlyImpact", Number(event.target.value || 0))}
                type="number"
                className="border-0 bg-transparent px-0 text-2xl font-[var(--font-manrope)] font-bold focus:bg-transparent"
                disabled={!hasMonthlyImpact}
              />
            </div>
          </DarkFormCard>

          <DarkFormCard label="Duration" description="Use this for EMI tenure, temporary moves, or recurring changes that have an end date." className="md:col-span-2">
            <div className="space-y-4 rounded-[1.6rem] bg-[#252a37] px-5 py-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-white/64">
                  <CalendarDays size={18} />
                  <span className="text-sm">Duration in months</span>
                </div>
                <span className="text-lg font-semibold text-[#4fdbc8]">{form.durationMonths ?? 12}m</span>
              </div>
              <input
                type="range"
                min={1}
                max={48}
                value={form.durationMonths ?? 12}
                onChange={(event) => updateField("durationMonths", Number(event.target.value))}
                className="w-full accent-[#4fdbc8]"
              />
            </div>
          </DarkFormCard>
        </section>

        {error ? <p className="rounded-[1.6rem] border border-[#ff716c]/20 bg-[#ff716c]/10 px-5 py-4 text-sm text-[#ff9a95]">{error}</p> : null}

        <section className="flex flex-col items-center gap-8">
          <Button type="submit" className="min-h-14 px-10" disabled={submitting}>
            {submitting ? "Analyzing..." : "Analyze My Decision"}
          </Button>

          <div className="w-full space-y-5">
            <div className="flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/38">
              <Layers3 size={14} />
              Common Decisions
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {samples.map((sample) => (
                <button
                  key={sample.scenarioKey}
                  type="button"
                  onClick={() => applyTemplate(sample)}
                  className="rounded-full border border-white/8 bg-[#1a1f2c] px-5 py-3 text-xs text-white/64 transition hover:border-[#4fdbc8]/30 hover:text-[#4fdbc8]"
                >
                  {sample.title}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-white/6 bg-[#1a1f2c] px-6 py-5 text-center text-sm leading-7 text-white/58">
            The result is deterministic. AI, if enabled in your profile, is used only to rewrite the explanation after the calculation is complete.
          </div>
        </section>
      </form>
    </ProtectedAppShell>
  );
}
