"use client";

import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";

import { useCanAffordIt } from "@/components/providers/can-afford-provider";

export function AccessFiAuthLinks() {
  const { authLoading, dataLoading, user, signOut } = useCanAffordIt();

  if (authLoading || dataLoading) {
    return (
      <span className="hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-white/38 md:inline-flex">
        Session loading
      </span>
    );
  }

  if (!user) {
    return (
      <div className="hidden items-center gap-3 md:flex">
        <a
          href="/login?next=%2Faccessfi%2Fdashboard"
          className="rounded-full border border-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72 transition hover:bg-white/6 hover:text-white"
        >
          Sign In
        </a>
        <a
          href="/signup?next=%2Faccessfi%2Fdashboard"
          className="rounded-full border border-[#6bf4d3]/20 bg-[#6bf4d3]/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6bf4d3] transition hover:bg-[#6bf4d3]/15"
        >
          Create Account
        </a>
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-3 md:flex">
      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/58">
        <UserRound size={14} />
        {user.email ?? "member"}
      </span>
      <Link
        href="/accessfi/dashboard"
        className="rounded-full border border-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72 transition hover:bg-white/6 hover:text-white"
      >
        Library
      </Link>
      <button
        type="button"
        onClick={() => void signOut()}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72 transition hover:bg-white/6 hover:text-white"
      >
        <LogOut size={14} />
        Sign Out
      </button>
    </div>
  );
}
