import { Panel } from "@/components/shared/panel";
import type { StandingRow } from "@/lib/db/types";

export function StandingsTable({ rows }: { rows: StandingRow[] }) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <Panel key={row.groupMemberId} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-white/8 text-sm font-black text-cream">
              {row.rank ?? "-"}
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">{row.role}</p>
              <p className="mt-1 text-lg font-black uppercase tracking-[0.04em] text-cream">{row.displayName}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-right text-sm text-white/70">
            <div>
              <p className="text-lg font-black text-cream">{row.totalPoints}</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Points</p>
            </div>
            <div>
              <p className="text-lg font-black text-cream">{row.wins}-{row.losses}</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">W-L</p>
            </div>
            <div>
              <p className="text-lg font-black text-cream">{Math.round(row.accuracyPct)}%</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Accuracy</p>
            </div>
          </div>
        </Panel>
      ))}
    </div>
  );
}
