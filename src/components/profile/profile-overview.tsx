import { Panel } from "@/components/shared/panel";
import type { ProfileStatsView } from "@/lib/db/types";

const statLabels = [
  ["Challenges", "totalChallengesPlayed"],
  ["Win Rate", "winRate"],
  ["Accuracy", "accuracyPct"],
  ["Reputation", "reputationScore"],
  ["Contrarian Hits", "contrarianHits"],
  ["Current Streak", "currentStreak"]
] as const;

export function ProfileOverview({ stats }: { stats: ProfileStatsView | null }) {
  if (!stats) {
    return (
      <Panel>
        <p className="text-sm text-white/68">Join or create a settled board to unlock your rivalry stats.</p>
      </Panel>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {statLabels.map(([label, key]) => {
        const value =
          key === "winRate" || key === "accuracyPct"
            ? `${Math.round(stats[key])}%`
            : `${stats[key]}`;

        return (
          <Panel key={label}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">{label}</p>
            <p className="mt-3 text-3xl font-black uppercase leading-none tracking-[0.04em] text-cream">{value}</p>
            {label === "Reputation" ? (
              <p className="mt-2 text-sm text-white/62">
                {stats.bestSport ? `Best sport: ${stats.bestSport.name}` : "Best sport builds as you play more."}
              </p>
            ) : null}
          </Panel>
        );
      })}
    </div>
  );
}
