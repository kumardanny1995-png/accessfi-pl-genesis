import type { DecisionCategory, VerdictTone } from "@/lib/finance/types";

export function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Math.round(value));
}

export function formatMonths(value: number) {
  if (!Number.isFinite(value)) {
    return "0 months";
  }
  return value >= 10 ? `${Math.round(value)} months` : `${value.toFixed(1)} months`;
}

export function verdictToneToBadge(tone: VerdictTone) {
  if (tone === "safe") return "safe";
  if (tone === "caution") return "caution";
  if (tone === "risky") return "risky";
  return "not_recommended";
}

export function categoryLabel(category: DecisionCategory) {
  switch (category) {
    case "electronics":
      return "Electronics";
    case "travel":
      return "Travel";
    case "move":
      return "Moving City";
    case "investment":
      return "Investments / SIP";
    case "loan":
      return "Loan / Debt";
    case "lifestyle":
      return "Lifestyle";
    case "housing":
      return "Housing";
    case "family":
      return "Family";
    default:
      return "Other";
  }
}
