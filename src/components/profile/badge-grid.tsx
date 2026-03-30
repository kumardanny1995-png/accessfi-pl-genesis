import { Panel } from "@/components/shared/panel";
import type { ProfileBadgeView } from "@/lib/db/types";

export function BadgeGrid({ badges }: { badges: ProfileBadgeView[] }) {
  if (badges.length === 0) {
    return (
      <Panel>
        <p className="text-sm text-white/68">No badges yet. Land a lone-wolf hit or a clean sweep to start flexing.</p>
      </Panel>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {badges.map((badge) => (
        <Panel key={`${badge.id}-${badge.awardedAt}`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">{badge.rarity}</p>
          <h3 className="mt-3 text-xl font-black uppercase tracking-[0.04em] text-cream">{badge.name}</h3>
          <p className="mt-2 text-sm leading-6 text-white/68">{badge.description}</p>
          {badge.reason ? <p className="mt-3 text-sm text-signal-amber">{badge.reason}</p> : null}
        </Panel>
      ))}
    </div>
  );
}
