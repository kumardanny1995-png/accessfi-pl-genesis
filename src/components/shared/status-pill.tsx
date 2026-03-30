import type { MatchStatus } from "@/lib/db/types";
import { cn } from "@/lib/utils/cn";

const styles: Record<MatchStatus | "open" | "settled" | "warning", string> = {
  scheduled: "bg-signal-blue/18 text-signal-blue",
  locked: "bg-signal-amber/18 text-signal-amber",
  live: "bg-signal-red/18 text-signal-red",
  completed: "bg-signal-green/18 text-signal-green",
  cancelled: "bg-white/12 text-white/60",
  open: "bg-signal-green/18 text-signal-green",
  settled: "bg-signal-green/18 text-signal-green",
  warning: "bg-signal-amber/18 text-signal-amber"
};

export function StatusPill({
  label,
  tone
}: {
  label: string;
  tone: keyof typeof styles;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]",
        styles[tone]
      )}
    >
      {label}
    </span>
  );
}
