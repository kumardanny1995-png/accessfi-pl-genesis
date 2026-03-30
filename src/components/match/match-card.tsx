import Link from "next/link";

import { ArrowUpRight } from "lucide-react";

import { Panel } from "@/components/shared/panel";
import { StatusPill } from "@/components/shared/status-pill";
import type { MatchSummary } from "@/lib/db/types";
import { countdownBand, formatMatchDate, relativeLockLabel } from "@/lib/utils/format";
import { lockscorePath } from "@/lib/utils/lockscore-routes";

export function MatchCard({ match }: { match: MatchSummary }) {
  const [teamA, teamB] = match.teams;
  const tone = countdownBand(match.lockTime) === "critical" ? "warning" : match.status;

  return (
    <Link href={lockscorePath(`/matches/${match.slug}`)} className="block">
      <Panel className="h-full transition hover:-translate-y-0.5 hover:border-white/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/42">
              {match.sport.name} · {match.competitionName}
            </p>
            <h3 className="mt-2 text-2xl font-black uppercase leading-none tracking-[0.04em] text-cream">
              {teamA?.team.shortName} vs {teamB?.team.shortName}
            </h3>
          </div>
          <StatusPill
            tone={tone}
            label={match.status === "scheduled" ? relativeLockLabel(match.lockTime) : match.status}
          />
        </div>
        <div className="mt-6 flex items-end justify-between gap-4">
          <div className="space-y-1 text-sm text-white/68">
            <p>{formatMatchDate(match.startTime)}</p>
            <p>{match.venue ?? "Venue TBA"}</p>
            {match.stageLabel ? <p>{match.stageLabel}</p> : null}
            <p>
              {match.challengeCount} open challenge{match.challengeCount === 1 ? "" : "s"}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-signal-amber">
            Enter Match
            <ArrowUpRight size={14} />
          </span>
        </div>
      </Panel>
    </Link>
  );
}
