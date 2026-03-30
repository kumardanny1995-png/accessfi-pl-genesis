import { Crown, Medal, Trophy } from "lucide-react";

import { Panel } from "@/components/shared/panel";
import type { ChallengeParticipantView } from "@/lib/db/types";

const icons = [Crown, Trophy, Medal];

export function Leaderboard({ participants }: { participants: ChallengeParticipantView[] }) {
  const ranked = [...participants].sort(
    (left, right) => right.totalPoints - left.totalPoints || left.displayName.localeCompare(right.displayName)
  );

  return (
    <div className="space-y-3">
      {ranked.map((participant, index) => {
        const Icon = icons[index] ?? Trophy;

        return (
          <Panel key={participant.id} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-white/8">
                <Icon size={18} className={index === 0 ? "text-signal-amber" : "text-white/70"} />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Rank #{index + 1}</p>
                <p className="mt-1 text-lg font-black uppercase tracking-[0.04em] text-cream">
                  {participant.displayName}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black uppercase leading-none tracking-[0.04em] text-cream">
                {participant.totalPoints}
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Points</p>
            </div>
          </Panel>
        );
      })}
    </div>
  );
}
