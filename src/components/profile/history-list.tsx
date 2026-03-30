import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { Panel } from "@/components/shared/panel";
import type { ProfileHistoryEntry } from "@/lib/db/types";
import { formatMatchDate } from "@/lib/utils/format";
import { lockscorePath } from "@/lib/utils/lockscore-routes";

export function HistoryList({ items }: { items: ProfileHistoryEntry[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No challenges yet"
        description="Create a match challenge or join one from a friend link. Your settled receipts will show up here."
        ctaHref={lockscorePath("/matches")}
        ctaLabel="Browse Matches"
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Link key={`${item.challengeId}-${item.participantName}`} href={lockscorePath(`/c/${item.challengeSlug}`)}>
          <Panel className="transition hover:-translate-y-0.5 hover:border-white/18">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">
                  {item.settled ? "Settled" : "Open"}
                </p>
                <h3 className="mt-2 text-xl font-black uppercase tracking-[0.04em] text-cream">
                  {item.challengeTitle}
                </h3>
                <p className="mt-2 text-sm text-white/66">{item.matchTitle}</p>
                <p className="mt-1 text-sm text-white/52">{formatMatchDate(item.startTime)}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black uppercase leading-none tracking-[0.04em] text-cream">
                  {item.totalPoints}
                </p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">
                  {item.rank ? `Rank #${item.rank}` : "Open"}
                </p>
              </div>
            </div>
          </Panel>
        </Link>
      ))}
    </div>
  );
}
