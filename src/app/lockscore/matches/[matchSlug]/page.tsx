import Link from "next/link";
import { notFound } from "next/navigation";

import { AutoRefresh } from "@/components/live/auto-refresh";
import { LiveMiniPicks } from "@/components/match/live-mini-picks";
import { Button } from "@/components/shared/button";
import { Panel } from "@/components/shared/panel";
import { StatusPill } from "@/components/shared/status-pill";
import { getMatchBySlug } from "@/lib/data/matches";
import { submitMiniPickAction } from "@/lib/actions/public";
import { countdownBand, formatMatchDate, relativeLockLabel } from "@/lib/utils/format";
import { getGuestContext } from "@/lib/utils/guest";
import { lockscorePath } from "@/lib/utils/lockscore-routes";

export default async function MatchDetailPage({
  params
}: {
  params: Promise<{ matchSlug: string }>;
}) {
  const { matchSlug } = await params;
  const { guestName, guestProfileId } = await getGuestContext();
  const data = await getMatchBySlug(matchSlug, guestProfileId);

  if (!data) {
    notFound();
  }

  const [teamA, teamB] = data.match.teams;
  const liveRefresh = data.match.status === "live" || data.miniPicks.some((window) => window.status !== "settled");
  const tone = countdownBand(data.match.lockTime) === "critical" ? "warning" : data.match.status;

  return (
    <div className="space-y-8">
      <AutoRefresh enabled={liveRefresh} />
      <Panel className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/42">
              {data.match.sport.name} · {data.match.competitionName}
            </p>
            <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.04em] text-cream">
              {teamA?.team.shortName ?? "A"} vs {teamB?.team.shortName ?? "B"}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68">
              {formatMatchDate(data.match.startTime)} · {data.match.venue ?? "Venue TBA"}
            </p>
            {data.match.stageLabel ? <p className="mt-1 text-sm text-white/54">{data.match.stageLabel}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill
              tone={tone}
              label={data.match.status === "scheduled" ? relativeLockLabel(data.match.lockTime) : data.match.status}
            />
            <StatusPill
              tone={data.match.settlementStatus === "settled" ? "settled" : "warning"}
              label={data.match.settlementStatus}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={lockscorePath(`/matches/${data.match.slug}/create`)}>
            <Button>Create Challenge</Button>
          </Link>
          <Link href={lockscorePath(`/sports/${data.match.sport.key}`)}>
            <Button variant="ghost">Open {data.match.sport.name} Hub</Button>
          </Link>
        </div>
      </Panel>

      <section className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Pre-Match Board</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.04em] text-cream">Five locked variables before the chaos starts</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {data.questions.map((question) => (
            <Panel key={question.id} className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Question {question.sortOrder}</p>
                <h3 className="mt-2 text-xl font-black uppercase tracking-[0.04em] text-cream">{question.prompt}</h3>
                {question.description ? <p className="mt-2 text-sm text-white/62">{question.description}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {question.options.map((option) => (
                  <span
                    key={option.id}
                    className="rounded-full border border-white/10 bg-white/6 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/74"
                  >
                    {option.label}
                  </span>
                ))}
              </div>
            </Panel>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Live Mini-Picks</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.04em] text-cream">Fast side calls while the match is on</h2>
        </div>
        {data.miniPicks.length > 0 ? (
          <LiveMiniPicks windows={data.miniPicks} guestName={guestName ?? ""} action={submitMiniPickAction} />
        ) : (
          <Panel>
            <p className="text-sm leading-7 text-white/68">
              No live mini-picks are open on this match yet. Admin can launch them from the settlement console when the moment is worth calling out.
            </p>
          </Panel>
        )}
      </section>
    </div>
  );
}
