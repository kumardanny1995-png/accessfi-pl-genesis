"use client";

import { ArrowLeft, ArrowRight, CreditCard, Home, Info, Landmark, ReceiptText, ShieldPlus, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AppLoadingScreen } from "@/components/can-afford/route-shells";
import { LightFieldCard } from "@/components/can-afford/shared";
import { useCanAffordIt } from "@/components/providers/can-afford-provider";
import { createDefaultGoals, createSampleProfileInput } from "@/lib/can-afford/defaults";
import type { FinancialGoal, FinancialProfileInput } from "@/lib/finance/types";
import { cn } from "@/lib/utils/cn";

type GoalDraft = FinancialGoal;

function buildGoalDrafts(profile: FinancialProfileInput, goals: FinancialGoal[]): GoalDraft[] {
  if (goals.length >= 2) {
    return goals.slice(0, 2);
  }

  if (goals.length === 1) {
    return [
      goals[0],
      {
        id: crypto.randomUUID(),
        title: "",
        priority: "secondary" as const,
        targetAmount: 0,
        iconKey: "sparkles",
        targetDate: null
      }
    ];
  }

  const defaults = createDefaultGoals(profile);
  return [
    defaults[0],
    {
      id: crypto.randomUUID(),
      title: "",
      priority: "secondary" as const,
      targetAmount: defaults[1]?.targetAmount ?? 0,
      iconKey: "sparkles",
      targetDate: null
    }
  ];
}

const suggestionGoals = ["House Deposit", "Emergency Fund", "Travel", "Loan Freedom", "MBA", "Wedding"];

function LightNumberInput({
  value,
  placeholder,
  onChange,
  currency = true
}: {
  value: number;
  placeholder?: string;
  onChange: (value: number) => void;
  currency?: boolean;
}) {
  return (
    <div className="relative flex items-center">
      {currency ? <span className="absolute left-0 text-2xl font-bold text-[#6c797f]">₹</span> : null}
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={Number.isFinite(value) ? value : 0}
        placeholder={placeholder}
        onChange={(event) => onChange(Number(event.target.value || 0))}
        className={cn(
          "w-full border-0 bg-transparent py-2 text-3xl font-[var(--font-manrope)] font-extrabold text-[#181c22] outline-none placeholder:text-[#d7dae3]",
          currency ? "pl-7" : "pl-0"
        )}
      />
    </div>
  );
}

export function OnboardingFlow() {
  const router = useRouter();
  const {
    authLoading,
    dataLoading,
    user,
    profileDraft,
    goals,
    saveOnboarding,
    applySampleProfile,
    isOnboardingComplete
  } = useCanAffordIt();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FinancialProfileInput>(profileDraft);
  const [goalDrafts, setGoalDrafts] = useState<GoalDraft[]>(buildGoalDrafts(profileDraft, goals));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(profileDraft);
    setGoalDrafts(buildGoalDrafts(profileDraft, goals));
  }, [goals, profileDraft]);

  useEffect(() => {
    if (authLoading || dataLoading || user) {
      return;
    }

    router.replace("/signup");
  }, [authLoading, dataLoading, router, user]);

  const progress = useMemo(() => `${Math.round((step / 4) * 100)}% Complete`, [step]);

  if (authLoading || dataLoading) {
    return <AppLoadingScreen />;
  }

  if (!user) {
    return null;
  }

  function updateField<Key extends keyof FinancialProfileInput>(key: Key, value: FinancialProfileInput[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  function updateGoal(index: number, next: Partial<GoalDraft>) {
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

  function handleSampleFill() {
    applySampleProfile();
    const sample = createSampleProfileInput();
    setForm({
      ...sample,
      displayName: profileDraft.displayName || sample.displayName,
      city: profileDraft.city || sample.city,
      preferences: profileDraft.preferences
    });
    setGoalDrafts(buildGoalDrafts(sample, createDefaultGoals(sample)));
  }

  function validateCurrentStep() {
    if (step === 1 && form.monthlyInHandSalary <= 0) {
      return "Add your monthly in-hand salary to continue.";
    }
    if (step === 1 && form.currentBankBalance < 0) {
      return "Current bank balance cannot be negative.";
    }
    if (step === 4 && !goalDrafts[0]?.title.trim()) {
      return "Add at least one primary financial goal.";
    }
    return null;
  }

  async function handleNext() {
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);

    if (step < 4) {
      setStep((current) => current + 1);
      return;
    }

    setSaving(true);
    const cleanGoals: FinancialGoal[] = goalDrafts
      .map((goal, index) => ({
        ...goal,
        priority: (index === 0 ? "primary" : "secondary") as FinancialGoal["priority"],
        title: goal.title.trim()
      }))
      .filter((goal) => goal.title.length > 0);

    const result = await saveOnboarding(form, cleanGoals);
    setSaving(false);

    if (!result.ok) {
      setError(result.message ?? "Unable to save your profile.");
      return;
    }

    router.push("/dashboard");
  }

  function handleBack() {
    if (step > 1) {
      setStep((current) => current - 1);
      setError(null);
      return;
    }

    router.push(isOnboardingComplete ? "/dashboard" : "/login");
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(0,209,255,0.08),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(37,254,168,0.07),transparent_28%),linear-gradient(180deg,#f8f9ff_0%,#f5f7ff_100%)] text-[#181c22]">
      <header className="sticky top-0 z-40 border-b border-[#bbc9cf]/30 bg-[#f8f9ff]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex size-11 items-center justify-center rounded-full text-[#00677f] transition hover:bg-[#f1f3fc]"
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <p className="font-[var(--font-manrope)] text-lg font-extrabold tracking-tight text-[#00677f]">Can I Afford It?</p>
          <button type="button" onClick={handleSampleFill} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#00677f]">
            Sample
          </button>
        </div>
      </header>

      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-40 pt-8 sm:px-6">
        <div className="mb-10">
          <div className="mb-3 flex items-end justify-between gap-4">
            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[#00677f]">Step {step} of 4</span>
            <span className="text-xs text-[#6c797f]">{progress}</span>
          </div>
          <div className="relative h-1.5 overflow-hidden rounded-full bg-[#dfe2eb]">
            <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#00677f] to-[#00d1ff]" style={{ width: `${step * 25}%` }} />
          </div>
        </div>

        {step === 1 ? (
          <>
            <section className="mb-12 space-y-5">
              <h1 className="max-w-xl font-[var(--font-manrope)] text-4xl font-extrabold leading-tight tracking-tight text-[#181c22] sm:text-5xl">
                Let&apos;s build your financial roadmap.
              </h1>
              <p className="max-w-lg text-lg leading-8 text-[#3c494e]">
                Tell us about your current monthly earnings and available bank balance.
              </p>
            </section>
            <div className="space-y-6">
              <LightFieldCard label="Monthly In-Hand Salary" hint="After-tax income that actually lands in your account." icon={<Landmark size={20} />}>
                <LightNumberInput value={form.monthlyInHandSalary} placeholder="0" onChange={(value) => updateField("monthlyInHandSalary", value)} />
              </LightFieldCard>
              <LightFieldCard label="Current Bank Balance" hint="Your liquid cash across day-to-day bank accounts." icon={<Wallet size={20} />}>
                <LightNumberInput value={form.currentBankBalance} placeholder="0" onChange={(value) => updateField("currentBankBalance", value)} />
              </LightFieldCard>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <section className="mb-10 space-y-4">
              <h1 className="font-[var(--font-manrope)] text-4xl font-extrabold leading-tight tracking-tight text-[#181c22]">
                What are your monthly essentials?
              </h1>
              <p className="max-w-lg text-lg leading-8 text-[#3c494e]">This helps us understand your baseline monthly burn.</p>
            </section>
            <div className="space-y-6">
              <LightFieldCard label="Rent" hint="Rent or mortgage outflow every month." icon={<Home size={20} />}>
                <LightNumberInput value={form.rent} placeholder="0" onChange={(value) => updateField("rent", value)} />
              </LightFieldCard>
              <LightFieldCard label="Fixed Monthly Bills" hint="Utilities, subscriptions, insurance, school fees, and other fixed bills." icon={<ReceiptText size={20} />}>
                <LightNumberInput value={form.fixedMonthlyBills} placeholder="0" onChange={(value) => updateField("fixedMonthlyBills", value)} />
              </LightFieldCard>
              <LightFieldCard label="EMI Obligations" hint="All existing EMIs and loan repayments already committed." icon={<CreditCard size={20} />}>
                <LightNumberInput value={form.emiObligations} placeholder="0" onChange={(value) => updateField("emiObligations", value)} />
              </LightFieldCard>
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <section className="mb-10 space-y-4">
              <h1 className="max-w-xl font-[var(--font-manrope)] text-4xl font-extrabold leading-tight tracking-tight text-[#181c22]">
                Let&apos;s look at your future safety net.
              </h1>
              <p className="max-w-lg text-lg leading-8 text-[#3c494e]">
                Emergency cash, credit card dues, investments, and discretionary spend shape how much room you actually have.
              </p>
            </section>
            <div className="grid gap-6 md:grid-cols-2">
              <LightFieldCard label="Emergency Savings" hint="Liquid cash reserved for emergencies." icon={<ShieldPlus size={20} />}>
                <LightNumberInput value={form.emergencySavings} placeholder="0" onChange={(value) => updateField("emergencySavings", value)} />
              </LightFieldCard>
              <LightFieldCard label="Credit Card Dues" hint="Your current outstanding card dues." icon={<CreditCard size={20} />}>
                <LightNumberInput value={form.creditCardDues} placeholder="0" onChange={(value) => updateField("creditCardDues", value)} />
              </LightFieldCard>
              <LightFieldCard label="Monthly SIP / Investments" hint="Recurring investment commitments that already go out monthly." icon={<TrendingUp size={20} />}>
                <LightNumberInput value={form.monthlyInvestments} placeholder="0" onChange={(value) => updateField("monthlyInvestments", value)} />
              </LightFieldCard>
              <LightFieldCard label="Discretionary Spending" hint="Food, cabs, shopping, subscriptions, entertainment, and other flexible spend." icon={<Sparkles size={20} />}>
                <LightNumberInput
                  value={form.monthlyDiscretionarySpending}
                  placeholder="0"
                  onChange={(value) => updateField("monthlyDiscretionarySpending", value)}
                />
              </LightFieldCard>
            </div>
            <div className="mt-10 flex items-start gap-4 rounded-[2rem] bg-[#e5e8f1] px-6 py-6">
              <span className="mt-1 flex size-10 items-center justify-center rounded-full bg-white text-[#00677f]">
                <Info size={18} />
              </span>
              <div>
                <h3 className="font-[var(--font-manrope)] text-lg font-bold text-[#181c22]">Why this matters</h3>
                <p className="mt-2 text-sm leading-7 text-[#3c494e]">
                  A healthy emergency fund usually covers three to six months of essential expenses. These numbers tell the engine what
                  cushion the next decision would really leave you with.
                </p>
              </div>
            </div>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <section className="mb-10 space-y-4">
              <h1 className="font-[var(--font-manrope)] text-4xl font-extrabold leading-tight tracking-tight text-[#181c22]">
                What are you saving for?
              </h1>
              <p className="max-w-lg text-lg leading-8 text-[#3c494e]">
                Add one or two goals so every verdict can show what the next decision does to your timeline.
              </p>
            </section>
            <div className="grid gap-6">
              <div className="rounded-[2rem] bg-white p-8 shadow-[0_4px_40px_rgba(0,103,127,0.04)] ring-1 ring-[#bbc9cf]/30">
                <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-[#00677f]">
                  <Sparkles size={18} />
                  Primary Goal
                </label>
                <input
                  value={goalDrafts[0]?.title ?? ""}
                  onChange={(event) => updateGoal(0, { title: event.target.value })}
                  placeholder="e.g. House deposit"
                  className="mt-5 w-full rounded-[1.4rem] border-0 bg-[#f1f3fc] px-5 py-5 text-xl font-[var(--font-manrope)] font-bold text-[#181c22] outline-none ring-0 placeholder:text-[#6c797f]"
                />
                <div className="mt-4 rounded-[1.4rem] bg-[#f1f3fc] px-5 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6c797f]">Target Amount</p>
                  <LightNumberInput value={goalDrafts[0]?.targetAmount ?? 0} onChange={(value) => updateGoal(0, { targetAmount: value })} />
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {suggestionGoals.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => updateGoal(0, { title: suggestion })}
                      className="rounded-full bg-[#f1f3fc] px-4 py-2 text-xs font-medium text-[#3c494e] transition hover:bg-[#00d1ff] hover:text-white"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] bg-[#ebeef7]/70 px-8 py-8 ring-1 ring-[#bbc9cf]/30">
                <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-[#6c797f]">
                  <Landmark size={18} />
                  Secondary Goal
                </label>
                <input
                  value={goalDrafts[1]?.title ?? ""}
                  onChange={(event) => updateGoal(1, { title: event.target.value })}
                  placeholder="Optional"
                  className="mt-5 w-full rounded-[1.4rem] border-0 bg-white px-5 py-5 text-lg font-[var(--font-manrope)] font-semibold text-[#181c22] outline-none placeholder:text-[#6c797f]"
                />
                <div className="mt-4 rounded-[1.4rem] bg-white px-5 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6c797f]">Target Amount</p>
                  <LightNumberInput value={goalDrafts[1]?.targetAmount ?? 0} onChange={(value) => updateGoal(1, { targetAmount: value })} />
                </div>
              </div>
            </div>
          </>
        ) : null}

        {error ? <p className="mt-8 rounded-[1.6rem] bg-[#ffdad6] px-5 py-4 text-sm text-[#93000a]">{error}</p> : null}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#bbc9cf]/30 bg-[#ffffff]/82 px-4 pb-8 pt-4 backdrop-blur-2xl sm:px-6">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-full px-2 py-4 text-sm font-semibold text-[#6c797f] transition hover:text-[#181c22]"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <button
            type="button"
            onClick={() => void handleNext()}
            disabled={saving}
            className="inline-flex min-h-14 min-w-[180px] items-center justify-center rounded-full bg-gradient-to-br from-[#00677f] to-[#00d1ff] px-8 text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-[0_18px_34px_rgba(0,103,127,0.18)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : step === 4 ? "Finish" : "Next Step"}
            <ArrowRight size={16} className="ml-2" />
          </button>
        </div>
      </nav>
    </div>
  );
}
