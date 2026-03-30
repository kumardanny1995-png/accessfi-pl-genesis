import Link from "next/link";
import { notFound } from "next/navigation";

import { StandingsTable } from "@/components/group/standings-table";
import { Button } from "@/components/shared/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Panel } from "@/components/shared/panel";
import { getGroupPageData } from "@/lib/data/groups";
import { getGuestContext } from "@/lib/utils/guest";
import { lockscorePath } from "@/lib/utils/lockscore-routes";

export default async function GroupPage({
  params
}: {
  params: Promise<{ groupSlug: string }>;
}) {
  const { groupSlug } = await params;
  const { guestProfileId } = await getGuestContext();
  const data = await getGroupPageData(groupSlug, guestProfileId);

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <Panel className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/42">{data.group.type}</p>
            <h1 className="mt-2 text-4xl font-black uppercase tracking-[0.04em] text-cream">{data.group.name}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68">
              {data.group.headline ?? data.group.description ?? "Recurring rivalry, season tables, and structured punishments."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.group.sport ? (
              <span className="rounded-full border border-white/10 bg-white/8 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
                {data.group.sport.name}
              </span>
            ) : null}
            {data.group.season ? (
              <span className="rounded-full border border-white/10 bg-white/8 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                {data.group.season.name}
              </span>
            ) : null}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Visibility</p>
            <p className="mt-2 text-sm font-semibold uppercase tracking-[0.14em] text-white">{data.group.visibility}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Stake</p>
            <p className="mt-2 text-sm text-white/70">{data.group.stakeTemplate ?? "Bragging rights"}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Punishment</p>
            <p className="mt-2 text-sm text-white/70">{data.group.punishmentTemplate ?? "Optional social punishment"}</p>
          </div>
        </div>
        {data.group.inviteCode && data.viewerRole ? (
          <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/72">
            Invite code: <span className="font-semibold uppercase text-cream">{data.group.inviteCode}</span>
          </div>
        ) : null}
      </Panel>

      <section className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Season Table</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.04em] text-cream">Standings that keep score across fixtures</h2>
        </div>
        {data.standings.length > 0 ? (
          <StandingsTable rows={data.standings} />
        ) : (
          <EmptyState
            title="No standings yet"
            description="Settled challenges linked to this group will start populating the season table."
          />
        )}
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Linked Challenges</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.04em] text-cream">Boards already feeding this table</h2>
        </div>
        {data.challenges.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {data.challenges.map((challenge) => (
              <Link
                key={challenge.id}
                href={lockscorePath(`/c/${challenge.slug}/${challenge.status === "settled" ? "results" : "compare"}`)}
                className="block"
              >
                <Panel className="space-y-3 transition hover:-translate-y-0.5 hover:border-white/18">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">{challenge.status}</p>
                  <h3 className="text-2xl font-black uppercase tracking-[0.04em] text-cream">{challenge.title}</h3>
                  <p className="text-sm text-white/66">{challenge.matchTitle}</p>
                  <p className="text-sm text-white/52">{challenge.participantCount} participants</p>
                </Panel>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No linked boards yet"
            description="Start the first challenge inside this group from one of the suggested matches below."
          />
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Suggested Matches</p>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.04em] text-cream">Launch the next board into this group</h2>
          </div>
          <Link href={lockscorePath("/matches")}>
            <Button variant="ghost">All Matches</Button>
          </Link>
        </div>
        {data.suggestedMatches.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {data.suggestedMatches.map((match) => (
              <Link
                key={match.id}
                href={lockscorePath(`/matches/${match.slug}/create?groupSlug=${data.group.slug}`)}
                className="block"
              >
                <Panel className="space-y-3 transition hover:-translate-y-0.5 hover:border-white/18">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">{match.competitionName}</p>
                  <h3 className="text-2xl font-black uppercase tracking-[0.04em] text-cream">{match.title}</h3>
                  <p className="text-sm text-white/66">{new Date(match.startTime).toLocaleString()}</p>
                </Panel>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No suggested fixtures"
            description="Create new matches from admin to seed fresh boards for this group."
            ctaHref={lockscorePath("/admin/matches/new")}
            ctaLabel="Create Match"
          />
        )}
      </section>
    </div>
  );
}
