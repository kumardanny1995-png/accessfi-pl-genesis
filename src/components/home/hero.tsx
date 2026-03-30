import Link from "next/link";

import { ArrowRight, Flame, ShieldCheck, Users } from "lucide-react";

import { Button } from "@/components/shared/button";
import { Panel } from "@/components/shared/panel";
import { APP_TAGLINE } from "@/lib/data/defaults";
import { lockscorePath } from "@/lib/utils/lockscore-routes";

const featureRows = [
  {
    icon: ShieldCheck,
    title: "Locked Receipts",
    copy: "Five picks. No deleting bad takes after the match starts."
  },
  {
    icon: Users,
    title: "Instant Rivalry",
    copy: "Friends join from a single share link and clash head-to-head."
  },
  {
    icon: Flame,
    title: "Public Settlements",
    copy: "Result reveal, leaderboard, and a share card built for WhatsApp flexing."
  }
];

export function Hero() {
  return (
    <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <Panel className="overflow-hidden p-0">
        <div className="relative isolate rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(255,191,60,0.16),transparent_34%),linear-gradient(160deg,#07101f_0%,#0b1629_48%,#101e35_100%)] px-5 py-6 sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(255,83,61,0.28),transparent_58%)]" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/42">
            IPL-First Social Predictions
          </p>
          <h1 className="mt-4 max-w-3xl text-[2.6rem] font-black uppercase leading-[0.92] tracking-[0.03em] text-cream sm:text-[4rem]">
            Own the take before the group chat rewrites history.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/74 sm:text-base">{APP_TAGLINE}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href={lockscorePath("/sports/cricket")}>
              <Button className="w-full gap-2 sm:w-auto">
                Enter Cricket Hub
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href={lockscorePath("/groups")}>
              <Button variant="ghost" className="w-full sm:w-auto">
                Explore Groups
              </Button>
            </Link>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {featureRows.map((feature) => (
              <div key={feature.title} className="rounded-3xl border border-white/10 bg-white/6 p-4">
                <feature.icon className="text-signal-amber" size={18} />
                <h2 className="mt-3 text-sm font-black uppercase tracking-[0.14em] text-cream">{feature.title}</h2>
                <p className="mt-2 text-sm leading-6 text-white/66">{feature.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </Panel>
      <Panel className="bg-[linear-gradient(180deg,rgba(255,83,61,0.14),rgba(255,255,255,0.03))]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/42">How It Flows</p>
        <div className="mt-4 space-y-4">
          {[
            "Pick a match from the schedule.",
            "Lock your 5 takes before toss time.",
            "Share one link into the group.",
            "Friends submit their counter-picks.",
            "Settle the board and post the receipts."
          ].map((step, index) => (
            <div key={step} className="flex gap-4 rounded-3xl border border-white/10 bg-white/5 p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xs font-black">
                0{index + 1}
              </span>
              <p className="text-sm leading-6 text-white/76">{step}</p>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}
