import Link from "next/link";
import type { PropsWithChildren } from "react";

import { Trophy } from "lucide-react";

import { APP_NAME } from "@/lib/data/defaults";
import { lockscorePath } from "@/lib/utils/lockscore-routes";

export function SiteShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-hero text-white">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-ink/82 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href={lockscorePath("/")} className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ff533d_0%,#ff9d2f_50%,#ffe083_100%)] text-ink">
              <Trophy size={18} />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/40">Social Predictions</p>
              <p className="text-lg font-black uppercase tracking-[0.08em] text-cream">{APP_NAME}</p>
            </div>
          </Link>
          <nav className="flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/60">
            <Link href={lockscorePath("/sports")} className="hover:text-white">
              Sports
            </Link>
            <Link href={lockscorePath("/groups")} className="hover:text-white">
              Groups
            </Link>
            <Link href={lockscorePath("/rooms")} className="hover:text-white">
              Rooms
            </Link>
            <Link href={lockscorePath("/leagues")} className="hover:text-white">
              Leagues
            </Link>
            <Link href={lockscorePath("/matches")} className="hover:text-white">
              Matches
            </Link>
            <Link href={lockscorePath("/profile")} className="hover:text-white">
              Profile
            </Link>
            <Link href={lockscorePath("/notifications")} className="hover:text-white">
              Alerts
            </Link>
            <Link href={lockscorePath("/admin")} className="hover:text-white">
              Admin
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
