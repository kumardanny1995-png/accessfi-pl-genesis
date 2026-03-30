import { GroupCard } from "@/components/group/group-card";
import { EmptyState } from "@/components/shared/empty-state";
import { getGroupsDirectory } from "@/lib/data/groups";
import { lockscorePath } from "@/lib/utils/lockscore-routes";

export default async function CreatorRoomsPage() {
  const rooms = await getGroupsDirectory({ types: ["creator"] });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/42">Creator Rooms</p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-[0.04em] text-cream">Rooms with a host, a leaderboard, and public cooking rights</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68">
          Creator rooms turn an audience into a repeatable prediction league without adding chat or fantasy complexity.
        </p>
      </div>

      {rooms.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {rooms.map((room) => (
            <GroupCard key={room.id} group={room} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No creator rooms yet"
          description="Create a creator-type group to launch a room with its own rivalry table."
          ctaHref={lockscorePath("/groups/new")}
          ctaLabel="Create Creator Room"
        />
      )}
    </div>
  );
}
