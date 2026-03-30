"use client";

import type { Route } from "next";
import Link from "next/link";
import { format } from "date-fns";

import { EmptyStateCard, ProtectedAppShell } from "@/components/can-afford/route-shells";
import { DecisionListItem } from "@/components/can-afford/shared";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useCanAffordIt } from "@/components/providers/can-afford-provider";
import { categoryLabel, formatInr, verdictToneToBadge } from "@/lib/can-afford/format";

export function HistoryPage() {
  const { decisions } = useCanAffordIt();

  return (
    <ProtectedAppShell
      title="Decision History"
      eyebrow="History"
      cta={
        <Link
          href="/decisions/new"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#00677f_0%,#00d1ff_100%)] px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white"
        >
          New Decision
        </Link>
      }
    >
      {decisions.length ? (
        <div className="space-y-5">
          <Card className="bg-[#112036] px-6 py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">Stored Results</p>
                <h2 className="mt-2 font-[var(--font-manrope)] text-2xl font-bold tracking-tight text-[#d8e2ff]">
                  Reopen any previous verdict.
                </h2>
              </div>
              <p className="text-sm text-white/58">{decisions.length} saved decisions</p>
            </div>
          </Card>

          <div className="space-y-4">
            {decisions.map((decision) => (
              <Card key={decision.id} className="bg-[#0d1c32] p-0">
                <div className="space-y-4 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="truncate font-[var(--font-manrope)] text-xl font-bold tracking-tight text-white">{decision.title}</h3>
                        <Badge tone={verdictToneToBadge(decision.verdict)}>{decision.verdictLabel}</Badge>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-white/58">{decision.question}</p>
                    </div>
                    <div className="shrink-0 text-right text-sm text-white/52">
                      <p>{format(new Date(decision.createdAt), "dd MMM yyyy")}</p>
                      <p>{format(new Date(decision.createdAt), "hh:mm a")}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 rounded-[1.5rem] border border-white/6 bg-[#161b28] px-4 py-4 sm:grid-cols-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/36">Amount</p>
                      <p className="mt-2 text-sm font-semibold text-white">{formatInr(decision.amount)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/36">Category</p>
                      <p className="mt-2 text-sm font-semibold text-white">{categoryLabel(decision.category)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/36">After Free Cash</p>
                      <p className="mt-2 text-sm font-semibold text-white">{formatInr(decision.computed.monthlyFreeCashAfter)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/36">Runway After</p>
                      <p className="mt-2 text-sm font-semibold text-white">{decision.computed.runwayMonthsAfter.toFixed(1)} months</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/6 px-5 py-4">
                  <DecisionListItem decision={decision} href={`/decisions/${decision.id}` as Route} showCategory={false} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <EmptyStateCard
          title="No decisions yet"
          description="History will appear after you run your first scenario. Seeded examples are added after onboarding so you can test the flow quickly."
          action={
            <Link
              href="/decisions/new"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#00677f_0%,#00d1ff_100%)] px-5 text-sm font-semibold uppercase tracking-[0.18em] text-white"
            >
              Create a Decision
            </Link>
          }
        />
      )}
    </ProtectedAppShell>
  );
}
