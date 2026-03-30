import { Panel } from "@/components/shared/panel";
import type { OpinionQuestion } from "@/lib/db/types";
import { formatPercentage } from "@/lib/utils/format";

export function OpinionBoard({ items }: { items: OpinionQuestion[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Panel key={item.questionId} className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/42">Group Split</p>
            <h3 className="mt-2 text-lg font-black uppercase tracking-[0.04em] text-cream">{item.prompt}</h3>
          </div>
          <div className="space-y-3">
            {item.options.map((option) => (
              <div key={option.optionId} className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <span className="font-semibold uppercase tracking-[0.12em] text-white">{option.label}</span>
                    {option.loneWolf ? (
                      <span className="ml-2 rounded-full bg-signal-amber/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-signal-amber">
                        Lone Wolf
                      </span>
                    ) : option.contrarian ? (
                      <span className="ml-2 rounded-full bg-signal-blue/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-signal-blue">
                        Contrarian
                      </span>
                    ) : null}
                  </div>
                  <span className="text-white/70">
                    {formatPercentage(option.percentage)} · {option.count}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#ff533d_0%,#ffbf3c_45%,#41a4ff_100%)]"
                    style={{ width: `${option.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ))}
    </div>
  );
}
