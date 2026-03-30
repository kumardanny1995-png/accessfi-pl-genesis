import type {
  DecisionComputation,
  DecisionExplanationPayload,
  DecisionInput,
  DecisionRecord,
  FinancialGoal,
  FinancialProfileRecord,
  FinancialProfileSummary,
  VerdictTone
} from "@/lib/finance/types";

function roundCurrency(value: number) {
  return Math.round(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function minimumDuePayment(creditCardDues: number) {
  if (creditCardDues <= 0) {
    return 0;
  }
  return Math.max(2000, creditCardDues * 0.05);
}

function essentialBurn(profile: FinancialProfileRecord, monthlyImpact = 0) {
  const creditDue = minimumDuePayment(profile.creditCardDues);
  return Math.max(1, profile.rent + profile.fixedMonthlyBills + profile.emiObligations + creditDue + Math.max(monthlyImpact, 0));
}

function totalMonthlyObligations(profile: FinancialProfileRecord, monthlyImpact = 0) {
  const creditDue = minimumDuePayment(profile.creditCardDues);
  return (
    profile.rent +
    profile.fixedMonthlyBills +
    profile.emiObligations +
    creditDue +
    profile.monthlyInvestments +
    profile.monthlyDiscretionarySpending +
    monthlyImpact
  );
}

function liquidBuffer(profile: FinancialProfileRecord, upfrontImpact = 0) {
  return Math.max(0, profile.currentBankBalance + profile.emergencySavings - profile.creditCardDues - upfrontImpact);
}

export function estimateGoalTargetAmount(title: string, profile: FinancialProfileRecord) {
  const lower = title.toLowerCase();
  if (lower.includes("house") || lower.includes("deposit") || lower.includes("down")) {
    return Math.max(profile.monthlyInHandSalary * 18, 1800000);
  }
  if (lower.includes("trip") || lower.includes("travel") || lower.includes("goa")) {
    return Math.max(profile.monthlyInHandSalary * 2, 250000);
  }
  if (lower.includes("emergency")) {
    return Math.max(essentialBurn(profile) * 6, 180000);
  }
  if (lower.includes("car")) {
    return Math.max(profile.monthlyInHandSalary * 6, 900000);
  }
  if (lower.includes("phone") || lower.includes("iphone") || lower.includes("laptop")) {
    return Math.max(profile.monthlyInHandSalary * 1.2, 120000);
  }
  return Math.max(profile.monthlyInHandSalary * 4, 400000);
}

function findPrimaryGoal(goals: FinancialGoal[], profile: FinancialProfileRecord) {
  const primary = goals.find((goal) => goal.priority === "primary") ?? goals[0];
  if (primary) {
    return {
      title: primary.title,
      targetAmount: primary.targetAmount > 0 ? primary.targetAmount : estimateGoalTargetAmount(primary.title, profile)
    };
  }
  return {
    title: "your next big goal",
    targetAmount: estimateGoalTargetAmount("goal", profile)
  };
}

function inferUpfrontImpact(profile: FinancialProfileRecord, decision: DecisionInput) {
  if (decision.category === "move") {
    return decision.amount;
  }
  if (decision.category === "loan") {
    return decision.amount;
  }
  if (decision.category === "investment" && decision.monthlyImpact > 0) {
    return 0;
  }
  if (decision.monthlyImpact > 0) {
    return 0;
  }
  if (decision.timing === "later") {
    return 0;
  }
  return decision.amount;
}

function buildBetterAlternative(args: {
  verdict: VerdictTone;
  decision: DecisionInput;
  profile: FinancialProfileRecord;
  freeCashBefore: number;
  obligationsRatioAfter: number;
  goalShiftMonths: number;
}) {
  const { verdict, decision, freeCashBefore, obligationsRatioAfter, goalShiftMonths } = args;

  if (decision.monthlyImpact > 0 && decision.durationMonths && decision.durationMonths < 18) {
    return `Stretch the plan to ${decision.durationMonths + 6} months so the monthly drag lands closer to a comfortable range instead of squeezing free cash right away.`;
  }

  if (verdict === "not_recommended" || obligationsRatioAfter > 0.45) {
    const waitMonths = Math.max(1, Math.ceil(Math.max(1, decision.amount) / Math.max(1, freeCashBefore * 0.75)));
    return `Wait ${waitMonths} month${waitMonths === 1 ? "" : "s"} and build a larger cash buffer before committing, especially while your obligations are already elevated.`;
  }

  if (decision.category === "loan") {
    return "Compare partial prepayment against keeping a stronger emergency reserve. A smaller prepayment may reduce stress without thinning your buffer too much.";
  }

  if (goalShiftMonths > 1.5) {
    return "Delay the decision until after your next bonus or salary cycle so the hit to your goal timeline is materially smaller.";
  }

  return "Keep the same decision, but earmark a dedicated sinking fund for it so the rest of your financial goals stay protected.";
}

export function buildTemplateExplanation(payload: DecisionExplanationPayload) {
  const runwayLine =
    payload.runwayMonthsAfter < payload.runwayMonthsBefore
      ? `Your emergency runway drops from ${payload.runwayMonthsBefore.toFixed(1)} months to ${payload.runwayMonthsAfter.toFixed(1)} months.`
      : `Your emergency runway stays stable at about ${payload.runwayMonthsAfter.toFixed(1)} months.`;
  const cashLine =
    payload.monthlyFreeCashAfter < payload.monthlyFreeCashBefore
      ? `Monthly free cash falls from INR ${roundCurrency(payload.monthlyFreeCashBefore).toLocaleString("en-IN")} to INR ${roundCurrency(payload.monthlyFreeCashAfter).toLocaleString("en-IN")}.`
      : `Monthly free cash improves to INR ${roundCurrency(payload.monthlyFreeCashAfter).toLocaleString("en-IN")}.`;

  const goalLine =
    payload.goalShiftDirection === "delay"
      ? `That pushes ${payload.primaryGoalTitle} back by about ${payload.goalShiftDays} days.`
      : payload.goalShiftDirection === "accelerate"
        ? `That brings ${payload.primaryGoalTitle} closer by about ${Math.abs(payload.goalShiftDays)} days.`
        : `The impact on ${payload.primaryGoalTitle} is minor.`;

  return `${payload.verdictLabel}: ${cashLine} ${runwayLine} ${goalLine} ${payload.betterAlternative}`;
}

export function summarizeFinancialProfile(
  profile: FinancialProfileRecord,
  monthlyImpact = 0,
  upfrontImpact = 0
): FinancialProfileSummary {
  const minDue = minimumDuePayment(profile.creditCardDues);
  const total = totalMonthlyObligations(profile, monthlyImpact);
  const freeCash = profile.monthlyInHandSalary - total;
  const essential = essentialBurn(profile, monthlyImpact);
  const liquid = liquidBuffer(profile, upfrontImpact);

  return {
    minimumDuePayment: minDue,
    essentialBurn: essential,
    totalMonthlyObligations: total,
    monthlyFreeCash: freeCash,
    liquidBuffer: liquid,
    runwayMonths: liquid / Math.max(essential, 1),
    obligationsRatio: total / Math.max(profile.monthlyInHandSalary, 1)
  };
}

export function evaluateDecision(
  profile: FinancialProfileRecord,
  goals: FinancialGoal[],
  decision: DecisionInput
): DecisionRecord {
  const upfrontImpact = inferUpfrontImpact(profile, decision);
  const before = summarizeFinancialProfile(profile, 0, 0);
  const after = summarizeFinancialProfile(profile, decision.monthlyImpact, upfrontImpact);

  const goal = findPrimaryGoal(goals, profile);
  const contributionBefore = Math.max(before.monthlyFreeCash * 0.6, 1);
  const contributionAfter = Math.max(after.monthlyFreeCash * 0.6, 1);
  const monthsBefore = goal.targetAmount / contributionBefore;
  const monthsAfter = goal.targetAmount / contributionAfter;
  const goalShiftMonthsRaw = monthsAfter - monthsBefore;
  const goalShiftMonths = Number.isFinite(goalShiftMonthsRaw) ? goalShiftMonthsRaw : 12;
  const goalShiftDays = Math.round(clamp(goalShiftMonths * 30, -365, 365));
  const goalShiftDirection = goalShiftDays > 3 ? "delay" : goalShiftDays < -3 ? "accelerate" : "neutral";

  let penalties = 0;

  if (after.runwayMonths < 2) penalties += 46;
  else if (after.runwayMonths < 3) penalties += 34;
  else if (after.runwayMonths < 4.5) penalties += 18;

  if (after.obligationsRatio > 0.6) penalties += 28;
  else if (after.obligationsRatio > 0.45) penalties += 18;

  if (after.monthlyFreeCash <= 0) penalties += 42;
  else if (after.monthlyFreeCash < profile.monthlyInHandSalary * 0.08) penalties += 22;
  else if (after.monthlyFreeCash < profile.monthlyInHandSalary * 0.15) penalties += 12;

  if (upfrontImpact > before.liquidBuffer * 0.55) penalties += 14;

  if (goalShiftMonths > 6) penalties += 18;
  else if (goalShiftMonths > 2) penalties += 10;

  if (decision.monthlyImpact < 0 && decision.category === "loan") {
    penalties = Math.max(0, penalties - 8);
  }

  const affordabilityScore = clamp(100 - penalties, 4, 98);

  let verdict: VerdictTone = "safe";
  let verdictLabel = "Safe";
  let statusTag = "Safe to Proceed";

  if (affordabilityScore < 35 || after.monthlyFreeCash < 0 || after.runwayMonths < 2) {
    verdict = "not_recommended";
    verdictLabel = "Not Recommended";
    statusTag = "Pause This Decision";
  } else if (affordabilityScore < 55 || after.runwayMonths < 3 || after.obligationsRatio > 0.5) {
    verdict = "risky";
    verdictLabel = "Risky";
    statusTag = "High Stress on Your Buffer";
  } else if (affordabilityScore < 76 || after.obligationsRatio > 0.45 || goalShiftMonths > 1.5) {
    verdict = "caution";
    verdictLabel = "Caution";
    statusTag = "Proceed With Caution";
  }

  const betterAlternative = buildBetterAlternative({
    verdict,
    decision,
    profile,
    freeCashBefore: before.monthlyFreeCash,
    obligationsRatioAfter: after.obligationsRatio,
    goalShiftMonths
  });

  const explanation = buildTemplateExplanation({
    verdictLabel,
    betterAlternative,
    monthlyFreeCashBefore: before.monthlyFreeCash,
    monthlyFreeCashAfter: after.monthlyFreeCash,
    runwayMonthsBefore: before.runwayMonths,
    runwayMonthsAfter: after.runwayMonths,
    goalShiftDays,
    goalShiftDirection,
    primaryGoalTitle: goal.title,
    category: decision.category,
    timing: decision.timing
  });

  const computed: DecisionComputation = {
    minimumDuePayment: before.minimumDuePayment,
    essentialBurnBefore: before.essentialBurn,
    essentialBurnAfter: after.essentialBurn,
    totalMonthlyObligationsBefore: before.totalMonthlyObligations,
    totalMonthlyObligationsAfter: after.totalMonthlyObligations,
    monthlyFreeCashBefore: before.monthlyFreeCash,
    monthlyFreeCashAfter: after.monthlyFreeCash,
    runwayMonthsBefore: before.runwayMonths,
    runwayMonthsAfter: after.runwayMonths,
    liquidBufferBefore: before.liquidBuffer,
    liquidBufferAfter: after.liquidBuffer,
    affordabilityScore,
    obligationsRatioBefore: before.obligationsRatio,
    obligationsRatioAfter: after.obligationsRatio,
    upfrontImpact,
    goalShiftMonths,
    goalShiftDays,
    goalShiftDirection,
    primaryGoalTitle: goal.title,
    primaryGoalTargetAmount: goal.targetAmount,
    estimatedMonthsToGoalBefore: monthsBefore,
    estimatedMonthsToGoalAfter: monthsAfter,
    betterAlternative,
    explanation,
    explanationSource: "template"
  };

  const timestamp = new Date().toISOString();

  return {
    ...decision,
    userId: profile.userId,
    createdAt: timestamp,
    updatedAt: timestamp,
    verdict,
    verdictLabel,
    statusTag,
    explanation,
    explanationSource: "template",
    betterAlternative,
    computed
  };
}
