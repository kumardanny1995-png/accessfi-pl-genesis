"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  AppSnapshot,
  DecisionRecord,
  FinancialGoal,
  FinancialProfileInput,
  FinancialProfileRecord
} from "@/lib/finance/types";

export type StorageMode = "supabase";

function isMissingTableError(message: string | null | undefined) {
  return Boolean(message && message.toLowerCase().includes("schema cache"));
}

function assertSupabase(client: SupabaseClient | null): asserts client is SupabaseClient {
  if (!client) {
    throw new Error("Supabase is not configured in this environment.");
  }
}

function migrationErrorMessage() {
  return "Can I Afford It database tables are missing. Apply the Supabase migration before using the app.";
}

function mapProfileRow(row: Record<string, unknown>): FinancialProfileRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    displayName: String(row.display_name ?? ""),
    city: String(row.city ?? ""),
    monthlyInHandSalary: Number(row.monthly_in_hand_salary ?? 0),
    currentBankBalance: Number(row.current_bank_balance ?? 0),
    emergencySavings: Number(row.emergency_savings ?? 0),
    rent: Number(row.rent ?? 0),
    fixedMonthlyBills: Number(row.fixed_monthly_bills ?? 0),
    emiObligations: Number(row.emi_obligations ?? 0),
    creditCardDues: Number(row.credit_card_dues ?? 0),
    monthlyInvestments: Number(row.monthly_investments ?? 0),
    monthlyDiscretionarySpending: Number(row.monthly_discretionary_spending ?? 0),
    preferences: (row.preferences as FinancialProfileRecord["preferences"]) ?? {
      currency: "INR",
      emailInsights: true,
      explanationMode: "template"
    },
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString())
  };
}

function mapGoalRow(row: Record<string, unknown>): FinancialGoal {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    priority: row.priority === "secondary" ? "secondary" : "primary",
    targetAmount: Number(row.target_amount ?? 0),
    iconKey: String(row.icon_key ?? "sparkles"),
    targetDate: row.target_date ? String(row.target_date) : null
  };
}

function mapDecisionRow(row: Record<string, unknown>): DecisionRecord {
  return {
    id: String(row.id),
    scenarioKey: row.scenario_key ? String(row.scenario_key) : null,
    title: String(row.title ?? ""),
    question: String(row.question ?? ""),
    amount: Number(row.amount ?? 0),
    monthlyImpact: Number(row.monthly_impact ?? 0),
    durationMonths: row.duration_months ? Number(row.duration_months) : null,
    category: String(row.category ?? "other") as DecisionRecord["category"],
    timing: String(row.timing ?? "now") as DecisionRecord["timing"],
    currency: "INR",
    userId: String(row.user_id),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
    verdict: String(row.verdict ?? "safe") as DecisionRecord["verdict"],
    verdictLabel: String(row.verdict_label ?? "Safe"),
    statusTag: String(row.status_tag ?? "Safe to Proceed"),
    explanation: String(row.explanation ?? ""),
    explanationSource: row.explanation_source === "ai" ? "ai" : "template",
    betterAlternative: String(row.better_alternative ?? ""),
    computed: (row.result_payload as DecisionRecord["computed"]) ?? ({} as DecisionRecord["computed"])
  };
}

export async function detectStorageMode(client: SupabaseClient | null): Promise<StorageMode> {
  assertSupabase(client);

  const { error } = await client.from("financial_profiles").select("id", { head: true, count: "exact" });
  if (error && isMissingTableError(error.message)) {
    throw new Error(migrationErrorMessage());
  }
  if (error) {
    throw new Error(error.message);
  }
  return "supabase";
}

export async function loadAppSnapshot(
  client: SupabaseClient | null,
  userId: string
): Promise<AppSnapshot> {
  assertSupabase(client);

  const [profileRes, goalsRes, decisionsRes] = await Promise.all([
    client.from("financial_profiles").select("*").eq("user_id", userId).maybeSingle(),
    client.from("financial_goals").select("*").eq("user_id", userId).order("priority"),
    client.from("decisions").select("*").eq("user_id", userId).order("created_at", { ascending: false })
  ]);

  if (
    isMissingTableError(profileRes.error?.message) ||
    isMissingTableError(goalsRes.error?.message) ||
    isMissingTableError(decisionsRes.error?.message)
  ) {
    throw new Error(migrationErrorMessage());
  }

  if (profileRes.error) {
    throw new Error(profileRes.error.message);
  }

  if (goalsRes.error) {
    throw new Error(goalsRes.error.message);
  }

  if (decisionsRes.error) {
    throw new Error(decisionsRes.error.message);
  }

  return {
    profile: profileRes.data ? mapProfileRow(profileRes.data) : null,
    goals: (goalsRes.data ?? []).map((goal) => mapGoalRow(goal as Record<string, unknown>)),
    decisions: (decisionsRes.data ?? []).map((decision) => mapDecisionRow(decision as Record<string, unknown>))
  };
}

export async function saveProfileAndGoals(args: {
  client: SupabaseClient | null;
  mode: StorageMode;
  userId: string;
  existingProfileId?: string;
  profile: FinancialProfileInput;
  goals: FinancialGoal[];
}): Promise<{ mode: StorageMode; profile: FinancialProfileRecord; goals: FinancialGoal[] }> {
  const timestamp = new Date().toISOString();
  const profileRecord: FinancialProfileRecord = {
    id: args.existingProfileId ?? crypto.randomUUID(),
    userId: args.userId,
    ...args.profile,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  assertSupabase(args.client);

  const profilePayload = {
    id: profileRecord.id,
    user_id: args.userId,
    display_name: profileRecord.displayName,
    city: profileRecord.city,
    monthly_in_hand_salary: profileRecord.monthlyInHandSalary,
    current_bank_balance: profileRecord.currentBankBalance,
    emergency_savings: profileRecord.emergencySavings,
    rent: profileRecord.rent,
    fixed_monthly_bills: profileRecord.fixedMonthlyBills,
    emi_obligations: profileRecord.emiObligations,
    credit_card_dues: profileRecord.creditCardDues,
    monthly_investments: profileRecord.monthlyInvestments,
    monthly_discretionary_spending: profileRecord.monthlyDiscretionarySpending,
    preferences: profileRecord.preferences
  };

  const { error: profileError } = await args.client
    .from("financial_profiles")
    .upsert(profilePayload, { onConflict: "user_id" });

  if (profileError && isMissingTableError(profileError.message)) {
    throw new Error(migrationErrorMessage());
  }

  if (profileError) {
    throw new Error(profileError.message);
  }

  await args.client.from("financial_goals").delete().eq("user_id", args.userId);
  const goalsPayload = args.goals.map((goal) => ({
    id: goal.id,
    user_id: args.userId,
    title: goal.title,
    priority: goal.priority,
    target_amount: goal.targetAmount,
    icon_key: goal.iconKey,
    target_date: goal.targetDate
  }));
  const { error: goalsError } = await args.client.from("financial_goals").insert(goalsPayload);

  if (goalsError && isMissingTableError(goalsError.message)) {
    throw new Error(migrationErrorMessage());
  }

  if (goalsError) {
    throw new Error(goalsError.message);
  }

  return { mode: "supabase", profile: profileRecord, goals: args.goals };
}

export async function saveDecision(args: {
  client: SupabaseClient | null;
  userId: string;
  decision: DecisionRecord;
}): Promise<StorageMode> {
  assertSupabase(args.client);

  const payload = {
    id: args.decision.id,
    user_id: args.userId,
    scenario_key: args.decision.scenarioKey,
    title: args.decision.title,
    question: args.decision.question,
    amount: args.decision.amount,
    monthly_impact: args.decision.monthlyImpact,
    duration_months: args.decision.durationMonths,
    category: args.decision.category,
    timing: args.decision.timing,
    verdict: args.decision.verdict,
    verdict_label: args.decision.verdictLabel,
    status_tag: args.decision.statusTag,
    explanation: args.decision.explanation,
    explanation_source: args.decision.explanationSource,
    better_alternative: args.decision.betterAlternative,
    result_payload: args.decision.computed
  };

  const { error } = await args.client.from("decisions").insert(payload);

  if (error && isMissingTableError(error.message)) {
    throw new Error(migrationErrorMessage());
  }

  if (error) {
    throw new Error(error.message);
  }

  return "supabase";
}
