"use client";

import type { ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  CircleDollarSign,
  CreditCard,
  HandCoins,
  House,
  Landmark,
  Plane,
  Sparkles,
  Smartphone,
  TrendingUp
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { formatInr, formatMonths, verdictToneToBadge } from "@/lib/can-afford/format";
import { getGoalProjection } from "@/lib/can-afford/insights";
import type { DecisionCategory, DecisionRecord, FinancialGoal, FinancialProfileRecord } from "@/lib/finance/types";

const categoryIconMap: Record<DecisionCategory, LucideIcon> = {
  electronics: Smartphone,
  travel: Plane,
  move: BriefcaseBusiness,
  investment: TrendingUp,
  loan: HandCoins,
  lifestyle: Sparkles,
  family: Landmark,
  housing: House,
  other: CircleDollarSign
};

function categoryIconTone(category: DecisionCategory) {
  switch (category) {
    case "travel":
      return "text-[#4fdbc8] bg-[#4fdbc8]/10";
    case "loan":
      return "text-[#ffba49] bg-[#ffba49]/10";
    case "electronics":
      return "text-[#adc6ff] bg-[#adc6ff]/10";
    case "investment":
      return "text-[#25fea8] bg-[#25fea8]/10";
    case "move":
      return "text-[#e0c1a3] bg-[#e0c1a3]/10";
    default:
      return "text-white/76 bg-white/8";
  }
}

export function StorageModeBadge() {
  return (
    <Badge tone="neutral" className="border-[#4fdbc8]/20 bg-[#4fdbc8]/10 text-[#4fdbc8]">
      Supabase Live
    </Badge>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  footer,
  className
}: {
  label: string;
  value: string;
  detail?: string;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("flex min-h-[220px] flex-col justify-between bg-[#112036] px-7 py-7", className)}>
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/44">{label}</p>
        <p className="font-[var(--font-manrope)] text-4xl font-extrabold tracking-tight text-[#d8e2ff] sm:text-5xl">{value}</p>
        {detail ? <p className="max-w-sm text-sm leading-7 text-white/62">{detail}</p> : null}
      </div>
      {footer ? <div>{footer}</div> : null}
    </Card>
  );
}

export function GoalProgressCard({
  goal,
  profile,
  className
}: {
  goal: FinancialGoal;
  profile: FinancialProfileRecord;
  className?: string;
}) {
  const projection = getGoalProjection(goal, profile);
  const palette =
    goal.priority === "primary"
      ? {
          ring: "bg-[#00d2ff]",
          glow: "shadow-[0_0_14px_rgba(0,210,255,0.42)]",
          icon: "text-[#00d2ff] bg-[#00d2ff]/10"
        }
      : {
          ring: "bg-[#4fdbc8]",
          glow: "shadow-[0_0_14px_rgba(79,219,200,0.38)]",
          icon: "text-[#4fdbc8] bg-[#4fdbc8]/10"
        };

  return (
    <Card className={cn("min-w-[280px] bg-[#0d1c32] p-6", className)}>
      <div className="space-y-8">
        <div className="flex items-start justify-between gap-4">
          <span className={cn("flex size-12 items-center justify-center rounded-2xl", palette.icon)}>
            <Sparkles size={20} />
          </span>
          <span className="text-sm font-semibold text-white">{Math.round(projection.progress * 100)}%</span>
        </div>
        <div className="space-y-2">
          <h3 className="font-[var(--font-manrope)] text-xl font-bold tracking-tight text-white">{goal.title || "Untitled goal"}</h3>
          <p className="text-sm text-white/58">{formatInr(projection.leftAmount)} left to save</p>
        </div>
        <div className="space-y-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className={cn("h-full rounded-full", palette.ring, palette.glow)} style={{ width: `${Math.max(10, projection.progress * 100)}%` }} />
          </div>
          <p className="text-xs uppercase tracking-[0.16em] text-white/42">
            Approx. {formatMonths(projection.monthsToGoal)} at your current pace
          </p>
        </div>
      </div>
    </Card>
  );
}

export function DecisionListItem({
  decision,
  href,
  showCategory = true
}: {
  decision: DecisionRecord;
  href: Route;
  showCategory?: boolean;
}) {
  const Icon = categoryIconMap[decision.category] ?? CircleDollarSign;
  const stamp = formatDistanceToNow(new Date(decision.createdAt), { addSuffix: true });

  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 rounded-[1.6rem] border border-white/6 bg-[#0d1c32] px-5 py-5 transition hover:bg-[#112036]"
    >
      <div className="flex min-w-0 items-center gap-4">
        <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-full", categoryIconTone(decision.category))}>
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-white">{decision.title}</p>
          <p className="truncate text-sm text-white/54">
            {stamp}
            {showCategory ? ` • ${decision.verdictLabel}` : ""}
          </p>
        </div>
      </div>
      <Badge tone={verdictToneToBadge(decision.verdict)}>{decision.verdictLabel}</Badge>
    </Link>
  );
}

export function LightFieldCard({
  label,
  hint,
  children,
  icon
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-[2rem] bg-white p-1 shadow-[0_4px_20px_rgba(0,103,127,0.03)] ring-1 ring-[#bbc9cf]/30">
      <div className="rounded-[1.6rem] bg-white px-6 py-6">
        <div className="mb-4 flex items-center gap-3">
          {icon ? <span className="flex size-12 items-center justify-center rounded-full bg-[#f1f3fc] text-[#00677f]">{icon}</span> : null}
          <label className="text-sm font-bold uppercase tracking-[0.16em] text-[#00677f]">{label}</label>
        </div>
        <div>{children}</div>
        {hint ? <p className="mt-3 text-xs font-medium leading-6 text-[#6c797f]">{hint}</p> : null}
      </div>
    </div>
  );
}

export function ResultComparisonRow({
  label,
  before,
  after,
  emphasizeAfter = false
}: {
  label: string;
  before: string;
  after: string;
  emphasizeAfter?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/6 py-3 last:border-b-0">
      <span className="text-sm text-white/66">{label}</span>
      <div className="flex items-center gap-3 text-sm font-semibold">
        <span className="text-white">{before}</span>
        <span className="text-white/24">→</span>
        <span className={cn(emphasizeAfter ? "text-[#4fdbc8]" : "text-white")}>{after}</span>
      </div>
    </div>
  );
}

export function InlineSectionHeader({
  title,
  action
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="font-[var(--font-manrope)] text-2xl font-bold tracking-tight text-[#d8e2ff]">{title}</h2>
      {action}
    </div>
  );
}

export function CurrencyPill({ value }: { value: string }) {
  return <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/38">{value}</span>;
}

export function DarkFormCard({
  label,
  description,
  children,
  className
}: {
  label: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("bg-[#1a1f2c]/90 px-6 py-6", className)}>
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">{label}</p>
          {description ? <p className="text-sm leading-7 text-white/58">{description}</p> : null}
        </div>
        {children}
      </div>
    </Card>
  );
}

export function VerdictHeroBadge({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-[#4fdbc8]/20 bg-[#4fdbc8]/10 px-6 py-2 text-[#4fdbc8] shadow-[0_0_30px_rgba(79,219,200,0.15)]">
      <CreditCard size={16} />
      <span className="text-xs font-bold uppercase tracking-[0.2em]">{label}</span>
    </div>
  );
}
