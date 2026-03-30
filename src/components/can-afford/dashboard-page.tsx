"use client";

import type { Route } from "next";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import { EmptyStateCard, ProtectedAppShell } from "@/components/can-afford/route-shells";
import { DecisionListItem, GoalProgressCard, InlineSectionHeader, MetricCard, StorageModeBadge } from "@/components/can-afford/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCanAffordIt } from "@/components/providers/can-afford-provider";
import { formatInr, formatMonths } from "@/lib/can-afford/format";
import { getRecentDecisions, getRunwayMessage } from "@/lib/can-afford/insights";
import { summarizeFinancialProfile } from "@/lib/finance/engine";

export function DashboardPage() {
  const router = useRouter();
  const { profile, goals, decisions } = useCanAffordIt();
  const [question, setQuestion] = useState("");

  const summary = useMemo(() => (profile ? summarizeFinancialProfile(profile) : null), [profile]);
  const recentDecisions = useMemo(() => getRecentDecisions(decisions, 4), [decisions]);

  function handleQuickAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = question.trim() ? `?question=${encodeURIComponent(question.trim())}` : "";
    router.push(`/decisions/new${params}`);
  }

  if (!profile || !summary) {
    return (
      <ProtectedAppShell title="Dashboard" eyebrow="Your Snapshot">
        <EmptyStateCard
          title="Finish onboarding first"
          description="Your dashboard will unlock after your salary, cash, obligations, and goals are set."
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

  return (
    <ProtectedAppShell
      title="Dashboard"
      eyebrow="Your Snapshot"
      cta={
        <Link
          href="/decisions/new"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#00677f_0%,#00d1ff_100%)] px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white"
        >
          New Decision
        </Link>
      }
    >
      <div className="space-y-8">
        <section className="rounded-[2rem] bg-[#0d1c32] p-6 sm:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-white/56">Welcome, {profile.displayName || "there"}</p>
                <h2 className="mt-2 font-[var(--font-manrope)] text-3xl font-bold tracking-tight text-[#b6ebff]">Ask your future self.</h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-white/60">
                  Run a new purchase, EMI, trip, move, SIP change, or loan prepayment against your current financial profile.
                </p>
              </div>
              <StorageModeBadge />
            </div>
            <form className="flex flex-col gap-4 md:flex-row md:items-center" onSubmit={handleQuickAsk}>
              <Input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Can I afford an iPhone on EMI?"
                className="min-h-16 rounded-full bg-[#010e24] px-7 text-base"
              />
              <Button type="submit" className="min-h-16 whitespace-nowrap px-8">
                Ask Future
              </Button>
            </form>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <MetricCard
            label="Monthly Free Cash"
            value={formatInr(summary.monthlyFreeCash)}
            detail="What is left after rent, bills, EMIs, minimum card due, SIPs, and discretionary spend."
            footer={
              <div className="inline-flex items-center gap-2 rounded-full bg-[#4fdbc8]/10 px-4 py-2 text-sm font-semibold text-[#4fdbc8]">
                <span className="size-2 rounded-full bg-[#4fdbc8]" />
                Decision-ready
              </div>
            }
          />
          <MetricCard
            label="Runway Score"
            value={formatMonths(summary.runwayMonths)}
            detail={getRunwayMessage(summary.runwayMonths)}
            footer={
              <div className="space-y-3">
                <div className="h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#00d2ff_0%,#00f0e8_100%)]"
                    style={{ width: `${Math.min(100, Math.max(8, summary.runwayMonths * 7))}%` }}
                  />
                </div>
                <p className="text-sm text-white/56">Safe zone starts at roughly 6 months of runway.</p>
              </div>
            }
          />
        </section>

        <section className="space-y-5">
          <InlineSectionHeader
            title="Your Active Goals"
            action={
              <Link href="/profile" className="text-sm font-semibold text-[#a5e7ff] hover:text-white">
                Edit Goals
              </Link>
            }
          />
          {goals.length ? (
            <div className="flex gap-5 overflow-x-auto pb-2">
              {goals.map((goal) => (
                <GoalProgressCard key={goal.id} goal={goal} profile={profile} />
              ))}
            </div>
          ) : (
            <EmptyStateCard
              title="No active goals yet"
              description="Add one or two goals in your profile so every result can tell you what this decision changes."
              action={
                <Link
                  href="/profile"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/10 px-5 text-sm font-semibold uppercase tracking-[0.18em] text-white"
                >
                  Add Goals
                </Link>
              }
            />
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-5">
            <InlineSectionHeader
              title="Recent Decisions"
              action={
                <Link href="/history" className="text-sm font-semibold text-[#a5e7ff] hover:text-white">
                  View All
                </Link>
              }
            />
            {recentDecisions.length ? (
              <div className="space-y-4">
                {recentDecisions.map((decision) => (
                  <DecisionListItem key={decision.id} decision={decision} href={`/decisions/${decision.id}` as Route} />
                ))}
              </div>
            ) : (
              <EmptyStateCard
                title="No decisions yet"
                description="Start with a seeded scenario or ask a new question from your dashboard."
                action={
                  <Link
                    href="/decisions/new"
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#00677f_0%,#00d1ff_100%)] px-5 text-sm font-semibold uppercase tracking-[0.18em] text-white"
                  >
                    Run First Decision
                  </Link>
                }
              />
            )}
          </div>

          <Card className="bg-[#112036] px-6 py-6">
            <div className="space-y-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">Current Snapshot</p>
                <h3 className="mt-2 font-[var(--font-manrope)] text-2xl font-bold tracking-tight text-[#d8e2ff]">Today&apos;s Baseline</h3>
              </div>
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between gap-4 border-b border-white/6 pb-3">
                  <span className="text-white/60">Monthly obligations</span>
                  <span className="font-semibold text-white">{formatInr(summary.totalMonthlyObligations)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-white/6 pb-3">
                  <span className="text-white/60">Liquid buffer</span>
                  <span className="font-semibold text-white">{formatInr(summary.liquidBuffer)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-white/6 pb-3">
                  <span className="text-white/60">Minimum card due</span>
                  <span className="font-semibold text-white">{formatInr(summary.minimumDuePayment)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/60">Income committed</span>
                  <span className="font-semibold text-white">{Math.round(summary.obligationsRatio * 100)}%</span>
                </div>
              </div>
              <Link
                href="/decisions/new"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-white/10 px-5 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/6"
              >
                <PlusCircle size={16} />
                Run Another Decision
              </Link>
            </div>
          </Card>
        </section>
      </div>
    </ProtectedAppShell>
  );
}
