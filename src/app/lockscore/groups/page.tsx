import Link from "next/link";

import { GroupCard } from "@/components/group/group-card";
import { Button } from "@/components/shared/button";
import { EmptyState } from "@/components/shared/empty-state";
import { getGroupsDirectory } from "@/lib/data/groups";
import { lockscorePath } from "@/lib/utils/lockscore-routes";

export default async function GroupsDirectoryPage() {
  const groups = await getGroupsDirectory();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/42">Recurring Groups</p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-[0.04em] text-cream">Leagues built for people who keep receipts</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68">
            Run office ladders, creator rooms, or invite-only crews that keep showing up every matchday.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={lockscorePath("/groups/new")}>
            <Button>Create Group</Button>
          </Link>
          <Link href={lockscorePath("/groups/join")}>
            <Button variant="ghost">Join With Invite</Button>
          </Link>
        </div>
      </div>

      {groups.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No groups live yet"
          description="Create the first office league, college rivalry, or creator room."
          ctaHref={lockscorePath("/groups/new")}
          ctaLabel="Create Group"
        />
      )}
    </div>
  );
}
