import Link from "next/link";

import { GroupCard } from "@/components/group/group-card";
import { Hero } from "@/components/home/hero";
import { MatchCard } from "@/components/match/match-card";
import { Button } from "@/components/shared/button";
import { EmptyState } from "@/components/shared/empty-state";
import { SportCard } from "@/components/sports/sport-card";
import { getFeaturedMatches } from "@/lib/data/matches";
import { getFeaturedGroups, getSportsOverview } from "@/lib/data/sports";
import { lockscorePath } from "@/lib/utils/lockscore-routes";

export default async function LockScoreHomePage() {
  const [featuredMatches, sports, featuredGroups] = await Promise.all([
    getFeaturedMatches(),
    getSportsOverview(),
    getFeaturedGroups(4)
  ]);

  return (
    <div className="space-y-10">
      <Hero />

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/42">Featured Fixtures</p>
            <h2 className="mt-2 text-3xl font-black uppercase tracking-[0.04em] text-cream">Upcoming boards worth starting now</h2>
          </div>
          <Link href={lockscorePath("/matches")}>
            <Button variant="ghost">All Matches</Button>
          </Link>
        </div>
        {featuredMatches.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {featuredMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No fixtures loaded"
            description="Seed or create matches from the admin panel to start new rivalry boards."
            ctaHref={lockscorePath("/admin")}
            ctaLabel="Open Admin"
          />
        )}
      </section>

      <section className="space-y-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/42">Sport Hubs</p>
          <h2 className="mt-2 text-3xl font-black uppercase tracking-[0.04em] text-cream">Cricket leads. The rest are ready to scale.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {sports.map((sport) => (
            <SportCard
              key={sport.id}
              sport={sport}
              matchCount={sport.matchCount}
              groupCount={sport.groupCount}
            />
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/42">Recurring Rivalry</p>
            <h2 className="mt-2 text-3xl font-black uppercase tracking-[0.04em] text-cream">Office leagues, creator rooms, and college ladders</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={lockscorePath("/groups/new")}>
              <Button>Create Group</Button>
            </Link>
            <Link href={lockscorePath("/groups")}>
              <Button variant="ghost">Explore Groups</Button>
            </Link>
          </div>
        </div>
        {featuredGroups.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {featuredGroups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No groups yet"
            description="Create an office league or creator room to start a recurring season table."
            ctaHref={lockscorePath("/groups/new")}
            ctaLabel="Create Group"
          />
        )}
      </section>
    </div>
  );
}
