import Link from "next/link";

import { ArrowUpRight } from "lucide-react";

import { Panel } from "@/components/shared/panel";
import type { SportKey, SportSummary } from "@/lib/db/types";
import { lockscorePath } from "@/lib/utils/lockscore-routes";
import { getSportTheme } from "@/lib/utils/sport-meta";

export function SportCard({
  sport,
  matchCount,
  groupCount
}: {
  sport: SportSummary;
  matchCount: number;
  groupCount: number;
}) {
  const theme = getSportTheme(sport.key as SportKey);

  return (
    <Link href={lockscorePath(`/sports/${sport.key}`)} className="block">
      <Panel className="h-full overflow-hidden transition hover:-translate-y-0.5 hover:border-white/18">
        <div
          className="rounded-[24px] border border-white/8 px-5 py-5"
          style={{ background: theme.panelGradient }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/45">{theme.statLabel}</p>
          <h3 className="mt-3 text-3xl font-black uppercase leading-none tracking-[0.04em] text-cream">
            {theme.label}
          </h3>
          <p className="mt-3 text-sm leading-7 text-white/70">{theme.description}</p>
          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="space-y-1 text-sm text-white/66">
              <p>{matchCount} live or upcoming fixtures</p>
              <p>{groupCount} active leagues and rooms</p>
            </div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-white">
              Open Hub
              <ArrowUpRight size={14} style={{ color: theme.accentSoft }} />
            </span>
          </div>
        </div>
      </Panel>
    </Link>
  );
}
