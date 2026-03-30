import { AutoRefresh } from "@/components/live/auto-refresh";
import { NotificationList } from "@/components/notifications/notification-list";
import { PushOptInCard } from "@/components/notifications/push-opt-in-card";
import { EmptyState } from "@/components/shared/empty-state";
import { getNotifications } from "@/lib/data/profile";
import { getGuestContext } from "@/lib/utils/guest";
import { lockscorePath } from "@/lib/utils/lockscore-routes";

export default async function NotificationsPage() {
  const { guestProfileId, guestName } = await getGuestContext();
  const items = guestProfileId ? await getNotifications(guestProfileId) : [];

  return (
    <div className="space-y-6">
      <AutoRefresh enabled={Boolean(guestProfileId)} />
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/42">Alerts</p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-[0.04em] text-cream">Rivalry notifications</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68">
          Track joins, lock reminders, live mini-picks, results, and standings movement from one stream.
        </p>
      </div>

      <PushOptInCard guestReady={Boolean(guestProfileId)} guestName={guestName} />

      {guestProfileId ? (
        <NotificationList items={items} />
      ) : (
        <EmptyState
          title="No alerts yet"
          description="Create or join a board first so LockScore knows who should receive rivalry updates."
          ctaHref={lockscorePath("/matches")}
          ctaLabel="Browse Matches"
        />
      )}
    </div>
  );
}
