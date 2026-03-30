import { CircleCheck, CircleX, Flame } from "lucide-react";

import { MiniPickSubmitForm } from "@/components/match/mini-pick-submit-form";
import { Panel } from "@/components/shared/panel";
import { StatusPill } from "@/components/shared/status-pill";
import type { ActionState, MiniPickWindowView } from "@/lib/db/types";

function relativeWindowLabel(lockAt: string) {
  const diff = new Date(lockAt).getTime() - Date.now();
  const minutes = Math.max(Math.round(diff / 60_000), 0);

  if (minutes >= 60) {
    return `${Math.round(minutes / 60)}h left`;
  }

  if (minutes <= 1) {
    return "closing now";
  }

  return `${minutes}m left`;
}

export function LiveMiniPicks({
  windows,
  guestName,
  action
}: {
  windows: MiniPickWindowView[];
  guestName: string;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  return (
    <div className="grid gap-4">
      {windows.map((window) => (
        <Panel key={window.id} className="space-y-5 overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/42">{window.title}</p>
              <h3 className="mt-2 text-2xl font-black uppercase tracking-[0.04em] text-cream">{window.prompt}</h3>
              {window.description ? <p className="mt-2 max-w-2xl text-sm text-white/66">{window.description}</p> : null}
              {window.stakeText ? <p className="mt-3 text-sm text-signal-amber">{window.stakeText}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusPill tone={window.status === "settled" ? "settled" : window.status} label={window.status} />
              {window.status === "open" ? <StatusPill tone="warning" label={relativeWindowLabel(window.lockAt)} /> : null}
            </div>
          </div>

          <div className="grid gap-3">
            {window.options.map((option) => (
              <div key={option.id} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold uppercase tracking-[0.12em] text-white">{option.label}</span>
                    {option.loneWolf ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-signal-amber/12 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-signal-amber">
                        <Flame size={12} /> Lone wolf
                      </span>
                    ) : null}
                  </div>
                  <span className="text-sm font-semibold text-white/72">
                    {option.count} pick{option.count === 1 ? "" : "s"} · {option.percentage}%
                  </span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/8">
                  <div
                    className={`h-full rounded-full ${option.leading ? "bg-[linear-gradient(90deg,#ff9d2f_0%,#ffe083_100%)]" : "bg-white/20"}`}
                    style={{ width: `${Math.max(option.percentage, option.count > 0 ? 10 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {window.status === "open" ? (
            <MiniPickSubmitForm window={window} defaultName={guestName} action={action} />
          ) : null}

          {window.status === "locked" ? (
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-white/66">
              This window is locked. Waiting for settlement.
            </div>
          ) : null}

          {window.status === "settled" ? (
            <div className="space-y-3 rounded-[24px] border border-signal-green/20 bg-signal-green/8 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-signal-green">Settled Call</p>
                  <p className="mt-2 text-xl font-black uppercase tracking-[0.04em] text-cream">
                    {window.outcomeOptionLabel ?? "Pending"}
                  </p>
                </div>
                <p className="text-sm text-white/62">{window.resolutionNote ?? "Settled from the live match event."}</p>
              </div>
              <div className="grid gap-3">
                {window.entries.slice(0, 6).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">{entry.displayName}</p>
                      <p className="mt-1 text-sm font-semibold uppercase tracking-[0.12em] text-white">{entry.optionLabel}</p>
                    </div>
                    {entry.isCorrect ? (
                      <CircleCheck className="text-signal-green" size={18} />
                    ) : (
                      <CircleX className="text-signal-red" size={18} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </Panel>
      ))}
    </div>
  );
}
