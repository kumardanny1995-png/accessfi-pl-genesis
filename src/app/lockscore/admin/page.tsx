import Link from "next/link";

import { Button } from "@/components/shared/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Panel } from "@/components/shared/panel";
import {
  adminLogoutAction,
  runNotificationSweepAction,
  syncPendingMatchesAction
} from "@/lib/actions/admin";
import { getAdminDashboardData } from "@/lib/data/admin";
import { requireAdminSession } from "@/lib/utils/admin";
import { lockscorePath } from "@/lib/utils/lockscore-routes";

export default async function LockScoreAdminDashboardPage() {
  await requireAdminSession();
  const data = await getAdminDashboardData();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/42">Admin Console</p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-[0.04em] text-cream">Match ops, settlement, and sync</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68">
            Keep the sports product fed with fixtures, settle boards, trigger notification sweeps, and verify provider sync health.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={lockscorePath("/admin/matches/new")}>
            <Button>Create Match</Button>
          </Link>
          <form action={syncPendingMatchesAction}>
            <Button variant="secondary" type="submit">
              Sync Providers
            </Button>
          </form>
          <form action={runNotificationSweepAction}>
            <Button variant="ghost" type="submit">
              Run Alerts
            </Button>
          </form>
          <form action={adminLogoutAction}>
            <Button variant="ghost" type="submit">
              Logout
            </Button>
          </form>
        </div>
      </div>

      <section className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Upcoming Matches</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.04em] text-cream">Edit or settle the next boards</h2>
        </div>
        {data.upcomingMatches.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {data.upcomingMatches.map((match) => (
              <Panel key={match.id} className="space-y-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">
                    {match.sport.name} · {match.competitionName}
                  </p>
                  <h3 className="mt-2 text-2xl font-black uppercase tracking-[0.04em] text-cream">{match.title}</h3>
                  <p className="mt-2 text-sm text-white/66">{new Date(match.startTime).toLocaleString()}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href={lockscorePath(`/admin/matches/${match.id}/edit`)}>
                    <Button variant="secondary">Edit</Button>
                  </Link>
                  <Link href={lockscorePath(`/admin/matches/${match.id}/settle`)}>
                    <Button variant="ghost">Settle</Button>
                  </Link>
                </div>
              </Panel>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No matches in ops queue"
            description="Create or seed matches to populate the admin dashboard."
            ctaHref={lockscorePath("/admin/matches/new")}
            ctaLabel="Create Match"
          />
        )}
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Open Challenges</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.04em] text-cream">Boards still waiting on lock or settlement</h2>
        </div>
        {data.liveChallenges.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {data.liveChallenges.map((challenge) => (
              <Link key={challenge.id} href={lockscorePath(`/c/${challenge.slug}/compare`)} className="block">
                <Panel className="space-y-3 transition hover:-translate-y-0.5 hover:border-white/18">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">{challenge.matchTitle}</p>
                  <h3 className="text-2xl font-black uppercase tracking-[0.04em] text-cream">{challenge.title}</h3>
                  <p className="text-sm text-white/66">{challenge.participantCount} participants</p>
                </Panel>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No open challenges"
            description="Once players start creating boards, they will surface here."
          />
        )}
      </section>
    </div>
  );
}
