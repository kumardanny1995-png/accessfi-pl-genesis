import Link from "next/link";

import { NotificationList } from "@/components/notifications/notification-list";
import { BadgeGrid } from "@/components/profile/badge-grid";
import { HistoryList } from "@/components/profile/history-list";
import { ProfileOverview } from "@/components/profile/profile-overview";
import { TopRivals } from "@/components/profile/top-rivals";
import { Button } from "@/components/shared/button";
import { EmptyState } from "@/components/shared/empty-state";
import { getProfileDashboard } from "@/lib/data/profile";
import { getGuestContext } from "@/lib/utils/guest";
import { lockscorePath } from "@/lib/utils/lockscore-routes";

export default async function LockScoreProfilePage() {
  const { guestProfileId, guestName } = await getGuestContext();

  if (!guestProfileId) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/42">Profile</p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-[0.04em] text-cream">Your rivalry record starts with one board</h1>
        </div>
        <EmptyState
          title="No profile unlocked yet"
          description="Create or join a challenge so LockScore can start tracking badges, streaks, rivals, and settled history."
          ctaHref={lockscorePath("/matches")}
          ctaLabel="Browse Matches"
        />
      </div>
    );
  }

  const dashboard = await getProfileDashboard(guestProfileId);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/42">Profile</p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-[0.04em] text-cream">
            {dashboard.stats?.displayName ?? guestName ?? "Guest"}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68">
            Badges, streaks, contrarian hits, and the people you keep beating.
          </p>
        </div>
        <Link href={lockscorePath("/notifications")}>
          <Button variant="ghost">View Alerts</Button>
        </Link>
      </div>

      <ProfileOverview stats={dashboard.stats} />

      <section className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Badges</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.04em] text-cream">Flex-worthy moments</h2>
        </div>
        <BadgeGrid badges={dashboard.badges} />
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Top Rivals</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.04em] text-cream">People you keep cooking</h2>
        </div>
        <TopRivals rivals={dashboard.topRivals} />
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Recent Receipts</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.04em] text-cream">Settled boards and open challenges</h2>
        </div>
        <HistoryList items={dashboard.history} />
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Recent Alerts</p>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.04em] text-cream">Latest pings around your boards</h2>
          </div>
          <Link href={lockscorePath("/notifications")}>
            <Button variant="ghost">All Alerts</Button>
          </Link>
        </div>
        <NotificationList items={dashboard.recentNotifications} />
      </section>
    </div>
  );
}
