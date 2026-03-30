import { estimateGoalTargetAmount, summarizeFinancialProfile } from "@/lib/finance/engine";
import type { DecisionRecord, FinancialGoal, FinancialProfileRecord, VerdictTone } from "@/lib/finance/types";

export function getGoalTargetAmount(goal: FinancialGoal, profile: FinancialProfileRecord) {
  return goal.targetAmount > 0 ? goal.targetAmount : estimateGoalTargetAmount(goal.title || "goal", profile);
}

export function getGoalProjection(goal: FinancialGoal, profile: FinancialProfileRecord) {
  const summary = summarizeFinancialProfile(profile);
  const targetAmount = getGoalTargetAmount(goal, profile);
  const protectedReserve = summary.essentialBurn * 3;
  const allocatable = Math.max(profile.currentBankBalance + profile.emergencySavings - protectedReserve - profile.creditCardDues, 0);
  const savedAmount = Math.min(targetAmount, allocatable * (goal.priority === "primary" ? 1 : 0.55));
  const leftAmount = Math.max(targetAmount - savedAmount, 0);
  const monthlyContribution = Math.max(summary.monthlyFreeCash * 0.6, 1);

  return {
    targetAmount,
    savedAmount,
    leftAmount,
    progress: targetAmount > 0 ? Math.min(savedAmount / targetAmount, 1) : 0,
    monthsToGoal: leftAmount / monthlyContribution
  };
}

export function getRunwayMessage(months: number) {
  if (months < 3) {
    return "Thin buffer";
  }
  if (months < 6) {
    return "Watch this closely";
  }
  if (months < 10) {
    return "Stable cushion";
  }
  return "Excellent runway";
}

export function getRunwayTone(months: number): VerdictTone {
  if (months < 2) {
    return "not_recommended";
  }
  if (months < 3) {
    return "risky";
  }
  if (months < 6) {
    return "caution";
  }
  return "safe";
}

export function getFreeCashTone(monthlyFreeCash: number, salary: number): VerdictTone {
  if (monthlyFreeCash <= 0) {
    return "not_recommended";
  }
  if (monthlyFreeCash < salary * 0.08) {
    return "risky";
  }
  if (monthlyFreeCash < salary * 0.15) {
    return "caution";
  }
  return "safe";
}

export function deriveDecisionTitle(question: string, fallback = "New Decision") {
  const clean = question.trim();
  if (!clean) {
    return fallback;
  }

  const withoutQuestion = clean.replace(/^can i afford\s+/i, "").replace(/\?+$/, "").trim();
  if (!withoutQuestion) {
    return fallback;
  }

  const normalized = withoutQuestion.charAt(0).toUpperCase() + withoutQuestion.slice(1);
  return normalized.length > 48 ? `${normalized.slice(0, 45).trim()}...` : normalized;
}

export function getRecentDecisions(decisions: DecisionRecord[], count = 4) {
  return decisions.slice(0, count);
}
