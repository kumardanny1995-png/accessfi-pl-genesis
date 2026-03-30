"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { EmptyStateCard, ProtectedAppShell } from "@/components/can-afford/route-shells";
import { DarkFormCard, MetricCard, StorageModeBadge } from "@/components/can-afford/shared";
import { useCanAffordIt } from "@/components/providers/can-afford-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createDefaultGoals } from "@/lib/can-afford/defaults";
import { formatInr, formatMonths } from "@/lib/can-afford/format";
import { summarizeFinancialProfile } from "@/lib/finance/engine";
import type { FinancialGoal, FinancialProfileInput } from "@/lib/finance/types";

function ensureGoalSet(profile: FinancialProfileInput, goals: FinancialGoal[]) {
  if (goals.length) {
    return goals.slice(0, 2);
  }
  return createDefaultGoals(profile);
}

export function ProfilePage() {
  const { profile, goals, updateSettings } = useCanAffordIt();
  const [form, setForm] = useState<FinancialProfileInput | null>(profile);
  const [goalDrafts, setGoalDrafts] = useState<FinancialGoal[]>(profile ? ensureGoalSet(profile, goals) : []);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      setForm(null);
      setGoalDrafts([]);
      return;
    }

    setForm(profile);
    setGoalDrafts(ensureGoalSet(profile, goals));
  }, [goals, profile]);

  const summary = useMemo(() => (profile ? summarizeFinancialProfile(profile) : null), [profile]);

  if (!profile || !form || !summary) {
    return (
      <ProtectedAppShell title="Profile & Settings" eyebrow="Profile">
        <EmptyStateCard
          title="Finish onboarding first"
          description="You need a saved financial profile before settings can be edited."
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

  function updateField<Key extends keyof FinancialProfileInput>(key: Key, value: FinancialProfileInput[Key]) {
    setForm((current) =>
      current
        ? {
            ...current,
            [key]: value
          }
        : current
    );
  }

  function updateGoal(index: number, next: Partial<FinancialGoal>) {
    setGoalDrafts((current) =>
      current.map((goal, goalIndex) =>
        goalIndex === index
          ? {
              ...goal,
              ...next
            }
          : goal
      )
    );
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) {
      return;
    }
    setSaving(true);
    setFeedback(null);
    setError(null);

    const cleanGoals: FinancialGoal[] = goalDrafts
      .map((goal, index) => ({
        ...goal,
        priority: (index === 0 ? "primary" : "secondary") as FinancialGoal["priority"],
        title: goal.title.trim()
      }))
      .filter((goal) => goal.title.length > 0);

    const result = await updateSettings(form, cleanGoals);
    setSaving(false);

    if (!result.ok) {
      setError(result.message ?? "Unable to save settings.");
      return;
    }

    setFeedback("Profile updated.");
  }

  return (
    <ProtectedAppShell title="Profile & Settings" eyebrow="Profile">
      <div className="space-y-8">
        <section className="grid gap-6 md:grid-cols-3">
          <MetricCard label="Monthly Free Cash" value={formatInr(summary.monthlyFreeCash)} />
          <MetricCard label="Runway" value={formatMonths(summary.runwayMonths)} />
          <MetricCard
            label="Storage"
            value="Supabase"
            footer={<StorageModeBadge />}
          />
        </section>

        <form className="space-y-6" onSubmit={handleSave}>
          <div className="grid gap-6 lg:grid-cols-2">
            <DarkFormCard label="Identity" description="Used across your dashboard and decision history.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input value={form.displayName} onChange={(event) => updateField("displayName", event.target.value)} placeholder="Display name" />
                <Input value={form.city} onChange={(event) => updateField("city", event.target.value)} placeholder="Current city" />
              </div>
            </DarkFormCard>

            <DarkFormCard label="Preferences" description="Choose how explanations and alerts should behave.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  value={form.preferences.explanationMode}
                  onChange={(event) =>
                    updateField("preferences", {
                      ...form.preferences,
                      explanationMode: event.target.value as FinancialProfileInput["preferences"]["explanationMode"]
                    })
                  }
                >
                  <option value="template">Deterministic Copy</option>
                  <option value="ai">AI Rewrite Enabled</option>
                </Select>
                <button
                  type="button"
                  onClick={() =>
                    updateField("preferences", {
                      ...form.preferences,
                      emailInsights: !form.preferences.emailInsights
                    })
                  }
                  className="flex min-h-14 items-center justify-between rounded-[1.4rem] border border-white/10 bg-white/5 px-4 text-left"
                >
                  <span className="text-sm text-white/72">Email insights</span>
                  <span className={form.preferences.emailInsights ? "text-[#4fdbc8]" : "text-white/36"}>
                    {form.preferences.emailInsights ? "On" : "Off"}
                  </span>
                </button>
              </div>
            </DarkFormCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <DarkFormCard label="Income & Cash">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  type="number"
                  value={form.monthlyInHandSalary}
                  onChange={(event) => updateField("monthlyInHandSalary", Number(event.target.value || 0))}
                  placeholder="Monthly in-hand salary"
                />
                <Input
                  type="number"
                  value={form.currentBankBalance}
                  onChange={(event) => updateField("currentBankBalance", Number(event.target.value || 0))}
                  placeholder="Current bank balance"
                />
                <Input
                  type="number"
                  value={form.emergencySavings}
                  onChange={(event) => updateField("emergencySavings", Number(event.target.value || 0))}
                  placeholder="Emergency savings"
                />
                <Input
                  type="number"
                  value={form.creditCardDues}
                  onChange={(event) => updateField("creditCardDues", Number(event.target.value || 0))}
                  placeholder="Credit card dues"
                />
              </div>
            </DarkFormCard>

            <DarkFormCard label="Monthly Commitments">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input type="number" value={form.rent} onChange={(event) => updateField("rent", Number(event.target.value || 0))} placeholder="Rent" />
                <Input
                  type="number"
                  value={form.fixedMonthlyBills}
                  onChange={(event) => updateField("fixedMonthlyBills", Number(event.target.value || 0))}
                  placeholder="Fixed monthly bills"
                />
                <Input
                  type="number"
                  value={form.emiObligations}
                  onChange={(event) => updateField("emiObligations", Number(event.target.value || 0))}
                  placeholder="EMI obligations"
                />
                <Input
                  type="number"
                  value={form.monthlyInvestments}
                  onChange={(event) => updateField("monthlyInvestments", Number(event.target.value || 0))}
                  placeholder="Monthly investments"
                />
                <Input
                  type="number"
                  value={form.monthlyDiscretionarySpending}
                  onChange={(event) => updateField("monthlyDiscretionarySpending", Number(event.target.value || 0))}
                  placeholder="Discretionary spending"
                  className="sm:col-span-2"
                />
              </div>
            </DarkFormCard>
          </div>

          <DarkFormCard label="Financial Goals" description="The engine uses these to estimate delay or acceleration after each decision.">
            <div className="grid gap-4 lg:grid-cols-2">
              {goalDrafts.map((goal, index) => (
                <div key={goal.id} className="space-y-4 rounded-[1.6rem] border border-white/8 bg-[#161b28] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">{index === 0 ? "Primary Goal" : "Secondary Goal"}</p>
                  <Input value={goal.title} onChange={(event) => updateGoal(index, { title: event.target.value })} placeholder="Goal title" />
                  <Input
                    type="number"
                    value={goal.targetAmount}
                    onChange={(event) => updateGoal(index, { targetAmount: Number(event.target.value || 0) })}
                    placeholder="Target amount"
                  />
                </div>
              ))}
            </div>
          </DarkFormCard>

          {error ? <p className="rounded-[1.6rem] border border-[#ff716c]/20 bg-[#ff716c]/10 px-5 py-4 text-sm text-[#ff9a95]">{error}</p> : null}
          {feedback ? <p className="rounded-[1.6rem] border border-[#4fdbc8]/20 bg-[#4fdbc8]/10 px-5 py-4 text-sm text-[#4fdbc8]">{feedback}</p> : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </div>
    </ProtectedAppShell>
  );
}
