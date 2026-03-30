import type {
  DecisionCategory,
  DecisionInput,
  FinancialGoal,
  FinancialProfileInput,
  GoalPriority,
  Preferences
} from "@/lib/finance/types";

function createGoal(title: string, priority: GoalPriority, targetAmount: number, iconKey: string): FinancialGoal {
  return {
    id: crypto.randomUUID(),
    title,
    priority,
    targetAmount,
    iconKey,
    targetDate: null
  };
}

export function createDefaultPreferences(): Preferences {
  return {
    currency: "INR",
    emailInsights: true,
    explanationMode: "template"
  };
}

export function createSampleProfileInput(): FinancialProfileInput {
  return {
    displayName: "Aarav",
    city: "Bengaluru",
    monthlyInHandSalary: 185000,
    currentBankBalance: 220000,
    emergencySavings: 280000,
    rent: 42000,
    fixedMonthlyBills: 18000,
    emiObligations: 12000,
    creditCardDues: 18000,
    monthlyInvestments: 22000,
    monthlyDiscretionarySpending: 24000,
    preferences: createDefaultPreferences()
  };
}

export function createBlankProfileInput(): FinancialProfileInput {
  return {
    displayName: "",
    city: "",
    monthlyInHandSalary: 0,
    currentBankBalance: 0,
    emergencySavings: 0,
    rent: 0,
    fixedMonthlyBills: 0,
    emiObligations: 0,
    creditCardDues: 0,
    monthlyInvestments: 0,
    monthlyDiscretionarySpending: 0,
    preferences: createDefaultPreferences()
  };
}

export function createDefaultGoals(profile: FinancialProfileInput): FinancialGoal[] {
  return [
    createGoal("Europe Trip", "primary", 350000, "flight"),
    createGoal("Emergency Fund", "secondary", Math.max(180000, (profile.rent + profile.fixedMonthlyBills) * 6), "shield")
  ];
}

function createDecisionTemplate(
  scenarioKey: string,
  title: string,
  question: string,
  amount: number,
  monthlyImpact: number,
  durationMonths: number | null,
  category: DecisionCategory,
  timing: DecisionInput["timing"]
): DecisionInput {
  return {
    id: crypto.randomUUID(),
    scenarioKey,
    title,
    question,
    amount,
    monthlyImpact,
    durationMonths,
    category,
    timing,
    currency: "INR"
  };
}

export function createSampleDecisionInputs(): DecisionInput[] {
  return [
    createDecisionTemplate(
      "iphone-on-emi",
      "iPhone on EMI",
      "Should I buy a new iPhone on EMI?",
      154900,
      12900,
      12,
      "electronics",
      "now"
    ),
    createDecisionTemplate(
      "goa-trip",
      "Goa Trip",
      "Can I afford a Goa trip next month?",
      55000,
      0,
      1,
      "travel",
      "within_3_months"
    ),
    createDecisionTemplate(
      "sip-increase",
      "Increase SIP",
      "Should I increase my SIP by INR 5,000 per month?",
      5000,
      5000,
      12,
      "investment",
      "now"
    ),
    createDecisionTemplate(
      "moving-city",
      "Move to Another City",
      "Can I afford to move to Mumbai for a new role?",
      70000,
      18000,
      12,
      "move",
      "within_3_months"
    ),
    createDecisionTemplate(
      "prepay-loan",
      "Prepay Loan",
      "Should I prepay part of my personal loan now?",
      120000,
      -3500,
      24,
      "loan",
      "now"
    )
  ];
}

export function getCategoryOptions(): Array<{ value: DecisionCategory; label: string }> {
  return [
    { value: "electronics", label: "Electronics" },
    { value: "travel", label: "Travel" },
    { value: "move", label: "Moving City" },
    { value: "investment", label: "Investments / SIP" },
    { value: "loan", label: "Loan / Debt" },
    { value: "lifestyle", label: "Lifestyle" },
    { value: "housing", label: "Housing" },
    { value: "family", label: "Family" },
    { value: "other", label: "Other" }
  ];
}
