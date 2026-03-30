import { z } from "zod";

import type { DecisionInput, FinancialGoal, FinancialProfileInput } from "@/lib/finance/types";

const moneyValue = z
  .number()
  .finite("Enter a valid number.")
  .min(0, "Amounts cannot be negative.")
  .max(1000000000, "Amount is too large.")
  .transform((value) => Math.round(value));

const signedMonthlyValue = z
  .number()
  .finite("Enter a valid monthly impact.")
  .min(-100000000, "Monthly impact is too negative.")
  .max(100000000, "Monthly impact is too large.")
  .transform((value) => Math.round(value));

const preferencesSchema = z.object({
  currency: z.literal("INR"),
  emailInsights: z.boolean(),
  explanationMode: z.enum(["template", "ai"])
});

const profileSchema = z
  .object({
    displayName: z.string().trim().max(80, "Display name is too long."),
    city: z.string().trim().max(80, "City is too long."),
    monthlyInHandSalary: moneyValue.refine((value) => value > 0, "Monthly in-hand salary must be greater than zero."),
    currentBankBalance: moneyValue,
    emergencySavings: moneyValue,
    rent: moneyValue,
    fixedMonthlyBills: moneyValue,
    emiObligations: moneyValue,
    creditCardDues: moneyValue,
    monthlyInvestments: moneyValue,
    monthlyDiscretionarySpending: moneyValue,
    preferences: preferencesSchema
  })
  .superRefine((profile, ctx) => {
    const recurringCommitments =
      profile.rent +
      profile.fixedMonthlyBills +
      profile.emiObligations +
      profile.monthlyInvestments +
      profile.monthlyDiscretionarySpending;

    if (recurringCommitments > profile.monthlyInHandSalary * 1.5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Monthly commitments look too high for the salary entered. Please review the numbers."
      });
    }
  });

const goalSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1, "Add at least one financial goal.").max(80, "Goal title is too long."),
  priority: z.enum(["primary", "secondary"]),
  targetAmount: moneyValue,
  iconKey: z.string().trim().max(50),
  targetDate: z.string().nullable()
});

const decisionSchema = z
  .object({
    id: z.string().trim().min(1),
    scenarioKey: z.string().trim().max(120).nullable(),
    title: z.string().trim().max(80, "Title is too long."),
    question: z.string().trim().max(240, "Question is too long."),
    amount: moneyValue.refine((value) => value > 0, "Amount must be greater than zero."),
    monthlyImpact: signedMonthlyValue,
    durationMonths: z.number().int().min(1, "Duration must be at least 1 month.").max(120, "Duration is too long.").nullable(),
    category: z.enum(["electronics", "travel", "move", "investment", "loan", "lifestyle", "family", "housing", "other"]),
    timing: z.enum(["now", "within_3_months", "later"]),
    currency: z.literal("INR")
  })
  .superRefine((decision, ctx) => {
    if (!decision.title && !decision.question) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add a title or a question before analyzing the decision."
      });
    }

    if (decision.monthlyImpact !== 0 && !decision.durationMonths) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add a duration when there is a monthly impact."
      });
    }
  });

function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid input.";
}

export function validateOnboardingSubmission(profile: FinancialProfileInput, goals: FinancialGoal[]) {
  const cleanedGoals = goals
    .map((goal, index) => ({
      ...goal,
      title: goal.title.trim(),
      priority: index === 0 ? "primary" : "secondary"
    }))
    .filter((goal) => goal.title.length > 0)
    .slice(0, 2);

  const parsed = z
    .object({
      profile: profileSchema,
      goals: z.array(goalSchema).min(1, "Add at least one financial goal.").max(2, "You can set up to two goals.")
    })
    .safeParse({
      profile,
      goals: cleanedGoals
    });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: firstIssue(parsed.error)
    };
  }

  return {
    ok: true as const,
    data: parsed.data
  };
}

export function validateDecisionSubmission(decision: DecisionInput) {
  const parsed = decisionSchema.safeParse({
    ...decision,
    title: decision.title.trim(),
    question: decision.question.trim()
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: firstIssue(parsed.error)
    };
  }

  return {
    ok: true as const,
    data: parsed.data
  };
}
