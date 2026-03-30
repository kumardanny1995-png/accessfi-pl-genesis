"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect } from "react";

import { EmptyStateCard, ProtectedAppShell } from "@/components/can-afford/route-shells";
import { ResultComparisonRow, VerdictHeroBadge } from "@/components/can-afford/shared";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useCanAffordIt } from "@/components/providers/can-afford-provider";
import { categoryLabel, formatInr, formatMonths, verdictToneToBadge } from "@/lib/can-afford/format";

function getVerdictPalette(verdict: "safe" | "caution" | "risky" | "not_recommended") {
  switch (verdict) {
    case "safe":
      return {
        accent: "text-[#4fdbc8]",
        bar: "bg-[#4fdbc8]",
        glow: "shadow-[0_0_15px_rgba(79,219,200,0.45)]"
      };
    case "caution":
      return {
        accent: "text-[#e0c1a3]",
        bar: "bg-[#e0c1a3]",
        glow: "shadow-[0_0_15px_rgba(224,193,163,0.42)]"
      };
    case "risky":
      return {
        accent: "text-[#ff9a95]",
        bar: "bg-[#ff716c]",
        glow: "shadow-[0_0_15px_rgba(255,113,108,0.42)]"
      };
    default:
      return {
        accent: "text-[#ff716c]",
        bar: "bg-[#ff716c]",
        glow: "shadow-[0_0_15px_rgba(255,113,108,0.42)]"
      };
  }
}

export function DecisionResultPage({ decisionId }: { decisionId: string }) {
  const { getDecision, profile, refreshDecisionExplanation } = useCanAffordIt();
  const decision = getDecision(decisionId);

  useEffect(() => {
    if (!decision || decision.explanationSource === "ai") {
      return;
    }
    void refreshDecisionExplanation(decision.id);
  }, [decision, refreshDecisionExplanation]);

  if (!decision || !profile) {
    return (
      <ProtectedAppShell title="Decision Result" eyebrow="Verdict">
        <EmptyStateCard
          title="Decision not found"
          description="This result may have been cleared from local storage or belongs to a different session."
          action={
            <Link
              href="/history"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#00677f_0%,#00d1ff_100%)] px-5 text-sm font-semibold uppercase tracking-[0.18em] text-white"
            >
              Go to History
            </Link>
          }
        />
      </ProtectedAppShell>
    );
  }

  const palette = getVerdictPalette(decision.verdict);
  const score = Math.round(decision.computed.affordabilityScore);
  const goalShiftLabel =
    decision.computed.goalShiftDirection === "delay"
      ? `${decision.computed.primaryGoalTitle} delayed by ${Math.abs(decision.computed.goalShiftDays)} days`
      : decision.computed.goalShiftDirection === "accelerate"
        ? `${decision.computed.primaryGoalTitle} gets closer by ${Math.abs(decision.computed.goalShiftDays)} days`
        : `${decision.computed.primaryGoalTitle} stays broadly on track`;

  return (
    <ProtectedAppShell
      title="Decision Result"
      eyebrow="Verdict"
      cta={
        <Link
          href="/decisions/new"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/82"
        >
          New Decision
        </Link>
      }
    >
      <div className="space-y-8">
        <section className="space-y-8 text-center">
          <VerdictHeroBadge label={decision.statusTag} />
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <h2 className="font-[var(--font-newsreader)] text-6xl leading-none text-white sm:text-8xl">{decision.verdictLabel.toUpperCase()}</h2>
              <Badge tone={verdictToneToBadge(decision.verdict)}>{categoryLabel(decision.category)}</Badge>
            </div>
            <p className="mx-auto max-w-3xl font-[var(--font-newsreader)] text-xl italic leading-9 text-white/66 sm:text-2xl">
              {decision.explanation}
            </p>
          </div>
        </section>

        <section className="rounded-[2rem] bg-[#161b28] px-6 py-8 sm:px-8">
          <div className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">Affordability Index</span>
              <span className={`font-[var(--font-newsreader)] text-4xl ${palette.accent}`}>{score}%</span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-[#090e1a]">
              <div className={`${palette.bar} ${palette.glow} h-full rounded-full`} style={{ width: `${score}%` }} />
            </div>
            <p className="text-right text-sm font-medium text-white/52">Confidence based on cash flow, runway, obligations, and goal impact.</p>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-12">
          <Card className="space-y-10 bg-[#252a37] p-8 md:col-span-7">
            <div className="space-y-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e0c1a3]">Monthly Cash Flow Impact</span>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-white/46">Before</p>
                  <p className="font-[var(--font-newsreader)] text-3xl text-white">{formatInr(decision.computed.monthlyFreeCashBefore)}</p>
                </div>
                <span className="text-white/24">→</span>
                <div>
                  <p className="text-sm text-white/46">After</p>
                  <p className={`font-[var(--font-newsreader)] text-3xl ${palette.accent}`}>{formatInr(decision.computed.monthlyFreeCashAfter)}</p>
                </div>
              </div>
            </div>
            <div className="rounded-[1.5rem] border-l-2 border-[#4fdbc8]/50 bg-[#090e1a]/60 px-5 py-4 text-sm italic leading-7 text-white/62">
              {decision.computed.monthlyFreeCashAfter >= decision.computed.monthlyFreeCashBefore
                ? "This decision improves monthly breathing room."
                : `This reduces free cash by ${formatInr(Math.abs(decision.computed.monthlyFreeCashAfter - decision.computed.monthlyFreeCashBefore))} each month.`}
            </div>
          </Card>

          <Card className="space-y-7 bg-[#252a37] p-8 md:col-span-5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#adc6ff]">Emergency Runway</span>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="font-[var(--font-newsreader)] text-5xl text-white">{decision.computed.runwayMonthsAfter.toFixed(1)}</span>
                <span className="text-lg text-white/54">Months</span>
              </div>
              <p className="text-xs text-white/46">
                Down from {decision.computed.runwayMonthsBefore.toFixed(1)} months
                {" • "}
                {decision.computed.runwayMonthsAfter < 3 ? "below the preferred 3-month line" : "still above the warning zone"}
              </p>
            </div>
            <div className={`text-xs font-bold uppercase tracking-[0.18em] ${palette.accent}`}>{decision.statusTag}</div>
          </Card>

          <Card className="flex items-center gap-6 bg-[#252a37] p-8 md:col-span-12">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[#090e1a] text-[#e0c1a3]">✦</div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">Goal Trajectory</span>
              <h3 className="mt-2 font-[var(--font-manrope)] text-2xl font-bold tracking-tight text-white">{goalShiftLabel}</h3>
              <p className="mt-2 text-sm leading-7 text-white/58">
                Before: {formatMonths(decision.computed.estimatedMonthsToGoalBefore)}. After: {formatMonths(decision.computed.estimatedMonthsToGoalAfter)}.
              </p>
            </div>
          </Card>
        </section>

        <section className="space-y-6">
          <h3 className="text-center font-[var(--font-newsreader)] text-3xl text-white">Before vs After</h3>
          <div className="grid gap-px overflow-hidden rounded-[2rem] border border-white/6 bg-white/6 md:grid-cols-2">
            <Card className="rounded-none border-0 bg-[#161b28] p-8 shadow-none">
              <div className="space-y-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">Current State</p>
                <div className="space-y-1">
                  <ResultComparisonRow
                    label="Monthly free cash"
                    before={formatInr(decision.computed.monthlyFreeCashBefore)}
                    after={formatInr(decision.computed.monthlyFreeCashBefore)}
                  />
                  <ResultComparisonRow
                    label="Emergency runway"
                    before={decision.computed.runwayMonthsBefore.toFixed(1)}
                    after={decision.computed.runwayMonthsBefore.toFixed(1)}
                  />
                  <ResultComparisonRow
                    label="Obligations ratio"
                    before={`${Math.round(decision.computed.obligationsRatioBefore * 100)}%`}
                    after={`${Math.round(decision.computed.obligationsRatioBefore * 100)}%`}
                  />
                </div>
              </div>
            </Card>
            <Card className="rounded-none border-0 bg-[#161b28] p-8 shadow-none">
              <div className="space-y-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4fdbc8]">Post-Decision</p>
                <div className="space-y-1">
                  <ResultComparisonRow
                    label="Monthly free cash"
                    before={formatInr(decision.computed.monthlyFreeCashBefore)}
                    after={formatInr(decision.computed.monthlyFreeCashAfter)}
                    emphasizeAfter
                  />
                  <ResultComparisonRow
                    label="Emergency runway"
                    before={decision.computed.runwayMonthsBefore.toFixed(1)}
                    after={decision.computed.runwayMonthsAfter.toFixed(1)}
                    emphasizeAfter
                  />
                  <ResultComparisonRow
                    label="Obligations ratio"
                    before={`${Math.round(decision.computed.obligationsRatioBefore * 100)}%`}
                    after={`${Math.round(decision.computed.obligationsRatioAfter * 100)}%`}
                    emphasizeAfter
                  />
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="rounded-[2rem] bg-[#001130] p-1">
          <div className="flex flex-col gap-6 rounded-[1.8rem] bg-[#303442] px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#adc6ff]">Better Alternative</p>
              <h3 className="mt-3 font-[var(--font-newsreader)] text-3xl text-white">A safer version of the same decision.</h3>
              <p className="mt-3 text-sm leading-7 text-white/62">{decision.betterAlternative}</p>
            </div>
            <Link
              href={`/decisions/new?question=${encodeURIComponent(decision.question)}` as Route}
              className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#00677f_0%,#00d1ff_100%)] px-6 text-sm font-semibold uppercase tracking-[0.18em] text-white"
            >
              Rework Decision
            </Link>
          </div>
        </section>
      </div>
    </ProtectedAppShell>
  );
}
