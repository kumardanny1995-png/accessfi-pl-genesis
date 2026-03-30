import Link from "next/link";
import { notFound } from "next/navigation";

import { GroupCard } from "@/components/group/group-card";
import { MatchCard } from "@/components/match/match-card";
import { Button } from "@/components/shared/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Panel } from "@/components/shared/panel";
import { getSportHubData } from "@/lib/data/sports";
import { lockscorePath } from "@/lib/utils/lockscore-routes";
import { getSportTheme } from "@/lib/utils/sport-meta";

export default async function SportHubPage({
  params
}: {
  params: Promise<{ sportKey: string }>;
}) {
  const { sportKey } = await params;
  const data = await getSportHubData(sportKey);

  if (!data) {
    notFound();
  }

  const theme = getSportTheme(data.sport.key);

  return (
    <div className="space-y-8">
      <Panel
        className="overflow-hidden border-white/12"
        style={{ background: theme.panelGradient }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/42">{theme.statLabel}</p>
        <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.04em] text-cream">{theme.label} Hub</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-white/72">{theme.tagline}</p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/62">{theme.description}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={lockscorePath("/matches")}>
            <Button>Open Fixtures</Button>
          </Link>
          <Link href={lockscorePath("/groups")}>
            <Button variant="ghost">Open Groups</Button>
          </Link>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {data.currentSeason ? (
            <span className="rounded-full border border-white/10 bg-white/8 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
              {data.currentSeason.name}
            </span>
          ) : null}
          {data.competitions.slice(0, 4).map((competition) => (
            <span
              key={competition.id}
              className="rounded-full border border-white/10 bg-white/8 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70"
            >
              {competition.name}
            </span>
          ))}
        </div>
      </Panel>

      <section className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Featured Fixtures</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.04em] text-cream">Where the next receipts are coming from</h2>
        </div>
        {data.featuredMatches.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {data.featuredMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No fixtures in this hub yet"
            description="Load matches for this sport from admin or the provider sync flow."
            ctaHref={lockscorePath("/admin")}
            ctaLabel="Open Admin"
          />
        )}
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Featured Groups</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.04em] text-cream">Recurring rooms and season tables</h2>
        </div>
        {data.featuredGroups.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {data.featuredGroups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No groups in this sport yet"
            description="Create a new room or league and anchor it to this sport."
            ctaHref={lockscorePath("/groups/new")}
            ctaLabel="Create Group"
          />
        )}
      </section>
    </div>
  );
}
