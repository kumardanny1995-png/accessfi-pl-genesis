import Link from "next/link";

import { ArrowUpRight, Flame, Shield, Users } from "lucide-react";

import { Panel } from "@/components/shared/panel";
import type { GroupSummary } from "@/lib/db/types";
import { lockscorePath } from "@/lib/utils/lockscore-routes";

const typeMeta = {
  office: { label: "Office League", icon: Users },
  college: { label: "College League", icon: Flame },
  creator: { label: "Creator Room", icon: Shield },
  community: { label: "Community Group", icon: Users },
  private: { label: "Private Group", icon: Shield }
} as const;

export function GroupCard({ group }: { group: GroupSummary }) {
  const meta = typeMeta[group.type];
  const Icon = meta.icon;

  return (
    <Link href={lockscorePath(`/groups/${group.slug}`)} className="block">
      <Panel className="h-full transition hover:-translate-y-0.5 hover:border-white/18">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/42">{meta.label}</p>
            <h3 className="mt-2 text-2xl font-black uppercase leading-none tracking-[0.04em] text-cream">
              {group.name}
            </h3>
          </div>
          <span className="flex size-10 items-center justify-center rounded-2xl bg-white/8">
            <Icon size={18} className="text-signal-amber" />
          </span>
        </div>
        <p className="mt-4 text-sm leading-7 text-white/68">
          {group.headline ?? group.description ?? "Recurring rivalry, season table, and shared punishments."}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {group.sport ? (
            <span className="rounded-full border border-white/10 bg-white/6 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">
              {group.sport.name}
            </span>
          ) : null}
          {group.season ? (
            <span className="rounded-full border border-white/10 bg-white/6 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">
              {group.season.name}
            </span>
          ) : null}
        </div>
        <div className="mt-6 flex items-end justify-between gap-4">
          <div className="space-y-1 text-sm text-white/66">
            <p>{group.memberCount} members</p>
            <p>{group.challengeCount} linked challenges</p>
          </div>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-white">
            Open Table
            <ArrowUpRight size={14} />
          </span>
        </div>
      </Panel>
    </Link>
  );
}
