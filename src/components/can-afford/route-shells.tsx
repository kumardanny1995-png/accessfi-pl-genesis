"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { PropsWithChildren, ReactNode } from "react";
import { useEffect } from "react";
import { ArrowLeft, BarChart3, CircleUserRound, Home, Landmark, LogOut, PlusCircle, ShieldCheck, Sparkles } from "lucide-react";

import { useCanAffordIt } from "@/components/providers/can-afford-provider";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

type AppNavHref = "/dashboard" | "/decisions/new" | "/history" | "/profile" | "/onboarding";

const appNavItems: Array<{
  href: AppNavHref;
  label: string;
  icon: typeof Home;
}> = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/decisions/new", label: "Decide", icon: PlusCircle },
  { href: "/history", label: "History", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: CircleUserRound },
  { href: "/onboarding", label: "Profile+", icon: Landmark }
];

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0e1320]/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#307aed_0%,#00d1ff_100%)] text-white shadow-[0_16px_28px_rgba(48,122,237,0.18)]">
            <Sparkles size={18} />
          </span>
          <div>
            <p className="font-[var(--font-newsreader)] text-2xl italic tracking-tight text-[#adc6ff]">Can I Afford It</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-7 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52 md:flex">
          <a href="#engine" className="hover:text-[#adc6ff]">
            The Engine
          </a>
          <a href="#decisions" className="hover:text-[#adc6ff]">
            Scenarios
          </a>
          <a href="#verdict" className="hover:text-[#adc6ff]">
            Verdicts
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-white/70 hover:text-white">
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#00677f_0%,#00d1ff_100%)] px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_18px_34px_rgba(0,103,127,0.18)] transition hover:opacity-95"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/6 bg-[#0b101a]">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-center text-sm text-white/46 sm:px-6 md:flex-row md:text-left">
        <p>(c) 2026 Can I Afford It. Built for decision clarity, not expense guilt.</p>
        <div className="flex items-center gap-5 text-[11px] font-semibold uppercase tracking-[0.18em]">
          <Link href="/signup" className="hover:text-white">
            Start
          </Link>
          <Link href="/login" className="hover:text-white">
            Log in
          </Link>
          <Link href="/dashboard" className="hover:text-white">
            Dashboard
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function AuthPageShell({
  title,
  eyebrow,
  description,
  children,
  footer
}: PropsWithChildren<{
  title: string;
  eyebrow: string;
  description: string;
  footer?: ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(173,198,255,0.14),transparent_24%),radial-gradient(circle_at_top_right,rgba(79,219,200,0.12),transparent_20%),linear-gradient(180deg,#0e1320_0%,#101524_40%,#0c1019_100%)] text-white">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-12 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="space-y-8">
          <Badge tone="neutral" className="border-[#adc6ff]/16 bg-[#adc6ff]/10 text-[#adc6ff]">
            {eyebrow}
          </Badge>
          <div className="space-y-5">
            <h1 className="max-w-xl font-[var(--font-newsreader)] text-5xl italic leading-[1.02] tracking-tight text-white sm:text-6xl">
              {title}
            </h1>
            <p className="max-w-lg text-base leading-8 text-white/68">{description}</p>
          </div>
          <Card className="max-w-md border-white/6 bg-white/[0.03]">
            <div className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4fdbc8]">What changes here</p>
              <ul className="space-y-3 text-sm leading-7 text-white/72">
                <li>Real Supabase auth and stored finance profiles</li>
                <li>Decision history with deterministic verdicts</li>
                <li>Dashboard and result pages connected end to end</li>
              </ul>
            </div>
          </Card>
        </div>
        <div className="rounded-[2.5rem] border border-white/8 bg-white/[0.03] p-2 shadow-[0_24px_80px_rgba(8,15,28,0.28)] backdrop-blur-xl">
          <div className="rounded-[2.1rem] border border-white/6 bg-[#111827]/75 p-6 sm:p-8">{children}</div>
          {footer ? <div className="px-6 pb-6 pt-4 text-sm text-white/58 sm:px-8">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}

export function ProtectedAppShell({
  title,
  eyebrow,
  children,
  allowWithoutOnboarding = false,
  cta
}: PropsWithChildren<{
  title: string;
  eyebrow?: string;
  allowWithoutOnboarding?: boolean;
  cta?: ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const { authLoading, dataLoading, user, isOnboardingComplete, signOut } = useCanAffordIt();

  useEffect(() => {
    if (authLoading || dataLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!allowWithoutOnboarding && !isOnboardingComplete) {
      router.replace("/onboarding");
    }
  }, [allowWithoutOnboarding, authLoading, dataLoading, isOnboardingComplete, router, user]);

  if (authLoading || dataLoading) {
    return <AppLoadingScreen />;
  }

  if (!user) {
    return <AppLoadingScreen />;
  }

  if (!allowWithoutOnboarding && !isOnboardingComplete) {
    return <AppLoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,210,255,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(0,240,232,0.1),transparent_24%),linear-gradient(180deg,#041329_0%,#07192d_48%,#06111d_100%)] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-28 pt-5 sm:px-6">
        <header className="sticky top-0 z-40 mb-8 flex items-center justify-between gap-4 rounded-[2rem] border border-white/6 bg-[#041329]/72 px-4 py-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex size-11 items-center justify-center rounded-full bg-white/5 text-[#adc6ff] transition hover:bg-white/8"
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">{eyebrow}</p> : null}
              <h1 className="font-[var(--font-manrope)] text-xl font-extrabold tracking-tight text-[#d8e2ff] sm:text-2xl">
                {title}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {cta}
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex size-11 items-center justify-center rounded-full bg-white/5 text-white/70 transition hover:bg-white/8 hover:text-white"
              aria-label="Log out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <nav className="fixed inset-x-3 bottom-0 z-40 mx-auto grid max-w-5xl grid-cols-5 rounded-t-[2.3rem] border border-white/8 bg-[#0d1c32]/88 px-3 py-3 backdrop-blur-xl sm:inset-x-6">
          {appNavItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/56 transition hover:text-white",
                  active && "bg-[#00d2ff]/10 text-[#00d2ff]"
                )}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export function AppLoadingScreen() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#041329_0%,#07192d_48%,#06111d_100%)] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 px-4 py-8 sm:px-6">
        <Skeleton className="h-20 w-full rounded-[2rem]" />
        <Skeleton className="h-48 w-full rounded-[2rem]" />
        <div className="grid gap-5 md:grid-cols-2">
          <Skeleton className="h-52 w-full rounded-[2rem]" />
          <Skeleton className="h-52 w-full rounded-[2rem]" />
        </div>
        <Skeleton className="h-72 w-full rounded-[2rem]" />
      </div>
    </div>
  );
}

export function EmptyStateCard({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="border-white/6 bg-white/[0.03] text-center">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-6">
        <span className="flex size-14 items-center justify-center rounded-full bg-[#4fdbc8]/10 text-[#4fdbc8]">
          <ShieldCheck size={24} />
        </span>
        <div className="space-y-2">
          <h3 className="font-[var(--font-manrope)] text-2xl font-bold text-white">{title}</h3>
          <p className="text-sm leading-7 text-white/66">{description}</p>
        </div>
        {action}
      </div>
    </Card>
  );
}
