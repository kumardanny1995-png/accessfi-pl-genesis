import { Swords } from "lucide-react";

import { Panel } from "@/components/shared/panel";
import type { RivalSummary } from "@/lib/db/types";

export function TopRivals({ rivals }: { rivals: RivalSummary[] }) {
  if (rivals.length === 0) {
    return (
      <Panel>
        <p className="text-sm text-white/68">Beat the same people a few times and your rivalry board will show up here.</p>
      </Panel>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rivals.map((rival) => (
        <Panel key={rival.displayName}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Rival</p>
              <h3 className="mt-2 text-2xl font-black uppercase tracking-[0.04em] text-cream">{rival.displayName}</h3>
              <p className="mt-2 text-sm text-white/66">{rival.winsAgainst} win{rival.winsAgainst === 1 ? "" : "s"} against them</p>
            </div>
            <Swords size={18} className="text-signal-amber" />
          </div>
        </Panel>
      ))}
    </div>
  );
}
