import { EmptyState } from "@/components/shared/empty-state";
import { lockscorePath } from "@/lib/utils/lockscore-routes";

export default function OfflinePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/42">Offline</p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-[0.04em] text-cream">Connection dropped</h1>
      </div>
      <EmptyState
        title="The board needs signal"
        description="You can still reopen the last loaded shell, but live sync, join actions, and settlement all need a connection."
        ctaHref={lockscorePath("/")}
        ctaLabel="Back To LockScore"
      />
    </div>
  );
}
