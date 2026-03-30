import { EmptyState } from "@/components/shared/empty-state";
import { SportCard } from "@/components/sports/sport-card";
import { getSportsOverview } from "@/lib/data/sports";
import { lockscorePath } from "@/lib/utils/lockscore-routes";

export default async function SportsDirectoryPage() {
  const sports = await getSportsOverview();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/42">Multi-Sport</p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-[0.04em] text-cream">Pick your arena</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68">
          Cricket is the deepest product today, but football, Formula 1, and basketball already have their own themed hubs and live mini-pick architecture.
        </p>
      </div>

      {sports.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {sports.map((sport) => (
            <SportCard key={sport.id} sport={sport} matchCount={sport.matchCount} groupCount={sport.groupCount} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No sports configured"
          description="Add sports and fixtures from the admin flow to light up these hubs."
          ctaHref={lockscorePath("/admin")}
          ctaLabel="Open Admin"
        />
      )}
    </div>
  );
}
