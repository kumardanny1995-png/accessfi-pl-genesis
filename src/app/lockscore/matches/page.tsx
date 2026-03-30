import { EmptyState } from "@/components/shared/empty-state";
import { MatchCard } from "@/components/match/match-card";
import { getUpcomingMatches } from "@/lib/data/matches";
import { lockscorePath } from "@/lib/utils/lockscore-routes";

export default async function MatchesPage() {
  const matches = await getUpcomingMatches(24);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/42">Schedule</p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-[0.04em] text-cream">Upcoming fixtures and live boards</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68">
          Start a board before lock time, jump into live mini-picks during the event, and settle the receipts after the whistle or final over.
        </p>
      </div>

      {matches.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No fixtures loaded"
          description="Use admin to create matches or seed the database with sample boards."
          ctaHref={lockscorePath("/admin")}
          ctaLabel="Open Admin"
        />
      )}
    </div>
  );
}
