import { GroupCard } from "@/components/group/group-card";
import { EmptyState } from "@/components/shared/empty-state";
import { getGroupsDirectory } from "@/lib/data/groups";
import { lockscorePath } from "@/lib/utils/lockscore-routes";

export default async function LeaguesPage() {
  const leagues = await getGroupsDirectory({ types: ["office", "college", "community"] });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/42">League Tables</p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-[0.04em] text-cream">Office, college, and community seasons</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68">
          Recurring tables are the retention loop. Keep the same people coming back every fixture and let the standings do the work.
        </p>
      </div>

      {leagues.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {leagues.map((league) => (
            <GroupCard key={league.id} group={league} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No leagues yet"
          description="Create an office or college league to start a recurring season table."
          ctaHref={lockscorePath("/groups/new")}
          ctaLabel="Create League"
        />
      )}
    </div>
  );
}
