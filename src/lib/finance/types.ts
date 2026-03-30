export type VerdictTone = "safe" | "caution" | "risky" | "not_recommended";

export type GoalPriority = "primary" | "secondary";

export type DecisionCategory =
  | "electronics"
  | "travel"
  | "move"
  | "investment"
  | "loan"
  | "lifestyle"
  | "family"
  | "housing"
  | "other";

export type DecisionTiming = "now" | "within_3_months" | "later";

export type CurrencyCode = "INR";

export interface Preferences {
  currency: CurrencyCode;
  emailInsights: boolean;
  explanationMode: "ai" | "template";
}

export interface FinancialGoal {
  id: string;
  title: string;
  priority: GoalPriority;
  targetAmount: number;
  iconKey: string;
  targetDate: string | null;
}

export interface FinancialProfileInput {
  displayName: string;
  city: string;
  monthlyInHandSalary: number;
  currentBankBalance: number;
  emergencySavings: number;
  rent: number;
  fixedMonthlyBills: number;
  emiObligations: number;
  creditCardDues: number;
  monthlyInvestments: number;
  monthlyDiscretionarySpending: number;
  preferences: Preferences;
}

export interface FinancialProfileRecord extends FinancialProfileInput {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialProfileSummary {
  minimumDuePayment: number;
  essentialBurn: number;
  totalMonthlyObligations: number;
  monthlyFreeCash: number;
  liquidBuffer: number;
  runwayMonths: number;
  obligationsRatio: number;
}

export interface DecisionInput {
  id: string;
  scenarioKey: string | null;
  title: string;
  question: string;
  amount: number;
  monthlyImpact: number;
  durationMonths: number | null;
  category: DecisionCategory;
  timing: DecisionTiming;
  currency: CurrencyCode;
}

export interface DecisionComputation {
  minimumDuePayment: number;
  essentialBurnBefore: number;
  essentialBurnAfter: number;
  totalMonthlyObligationsBefore: number;
  totalMonthlyObligationsAfter: number;
  monthlyFreeCashBefore: number;
  monthlyFreeCashAfter: number;
  runwayMonthsBefore: number;
  runwayMonthsAfter: number;
  liquidBufferBefore: number;
  liquidBufferAfter: number;
  affordabilityScore: number;
  obligationsRatioBefore: number;
  obligationsRatioAfter: number;
  upfrontImpact: number;
  goalShiftMonths: number;
  goalShiftDays: number;
  goalShiftDirection: "delay" | "accelerate" | "neutral";
  primaryGoalTitle: string;
  primaryGoalTargetAmount: number;
  estimatedMonthsToGoalBefore: number;
  estimatedMonthsToGoalAfter: number;
  betterAlternative: string;
  explanation: string;
  explanationSource: "ai" | "template";
}

export interface DecisionRecord extends DecisionInput {
  userId: string;
  createdAt: string;
  updatedAt: string;
  verdict: VerdictTone;
  verdictLabel: string;
  statusTag: string;
  explanation: string;
  explanationSource: "ai" | "template";
  betterAlternative: string;
  computed: DecisionComputation;
}

export interface AppSnapshot {
  profile: FinancialProfileRecord | null;
  goals: FinancialGoal[];
  decisions: DecisionRecord[];
}

export interface DecisionExplanationPayload {
  verdictLabel: string;
  betterAlternative: string;
  monthlyFreeCashBefore: number;
  monthlyFreeCashAfter: number;
  runwayMonthsBefore: number;
  runwayMonthsAfter: number;
  goalShiftDays: number;
  goalShiftDirection: "delay" | "accelerate" | "neutral";
  primaryGoalTitle: string;
  category: DecisionCategory;
  timing: DecisionTiming;
}
