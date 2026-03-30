import { MessageSquareText, Sparkles } from "lucide-react";

import { Panel } from "@/components/shared/panel";
import type { ChallengeAiCopy } from "@/lib/db/types";

export function AiCopyStack({
  eyebrow,
  title,
  items
}: {
  eyebrow: string;
  title: string;
  items: ChallengeAiCopy[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Panel className="space-y-5 overflow-hidden">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/42">{eyebrow}</p>
        <h2 className="text-3xl font-black uppercase leading-none tracking-[0.03em] text-cream">{title}</h2>
        <p className="text-sm leading-7 text-white/66">Generated to feel like sharp room copy, not generic AI filler.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {items.map((item, index) => (
          <div
            key={`${item.kind}-${index}`}
            className="rounded-[28px] border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_100%)] p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">{item.kind.replace(/_/g, " ")}</p>
                <h3 className="mt-2 text-xl font-black uppercase tracking-[0.04em] text-cream">{item.title}</h3>
              </div>
              {index === 0 ? <Sparkles size={18} className="text-signal-amber" /> : <MessageSquareText size={18} className="text-signal-blue" />}
            </div>
            <p className="mt-4 text-sm leading-7 text-white/70">{item.body}</p>
            {item.shareLine ? (
              <div className="mt-5 rounded-3xl border border-white/10 bg-white/6 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/82">
                {item.shareLine}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </Panel>
  );
}
