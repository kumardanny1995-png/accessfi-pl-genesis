import type { Route } from "next";
import Link from "next/link";
import type { PropsWithChildren, ReactNode } from "react";
import { ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react";

import { AccessFiAuthLinks } from "@/components/accessfi/auth-links";
import { ACCESSFI_FEATURED_VAULT_SLUG } from "@/lib/accessfi/env";
import { cn } from "@/lib/utils/cn";

const navItems: Array<{
  href: string;
  label: string;
}> = [
  { href: "/accessfi", label: "Product" },
  { href: "/accessfi/creator", label: "Creator Dashboard" },
  { href: "/accessfi/create", label: "Create Vault" },
  { href: `/accessfi/vaults/${ACCESSFI_FEATURED_VAULT_SLUG}`, label: "Sample Vault" },
  { href: "/accessfi/dashboard", label: "Member Library" },
  { href: "/accessfi/proof", label: "Proof Console" }
];

export function AccessFiShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,162,75,0.14),transparent_24%),radial-gradient(circle_at_top_right,rgba(79,219,200,0.12),transparent_26%),linear-gradient(180deg,#07101d_0%,#0a1628_46%,#081220_100%)] text-[#f2f4ff]">
      <header className="sticky top-0 z-40 border-b border-white/6 bg-[#07101d]/78 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/accessfi" className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff6a3d_0%,#ffb34f_45%,#6bf4d3_100%)] text-[#09111f] shadow-[0_18px_40px_rgba(255,120,64,0.2)]">
              <Sparkles size={18} />
            </span>
            <div>
              <p className="font-display text-[1.85rem] italic tracking-tight text-white">AccessFi</p>
              <p className="-mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/42">PL Genesis demo build</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/52 lg:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href as Route} className="transition hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <AccessFiAuthLinks />
            <Link
              href="/accessfi/proof"
              className="hidden rounded-full border border-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72 transition hover:bg-white/6 sm:inline-flex"
            >
              Judge View
            </Link>
            <Link
              href={`/accessfi/vaults/${ACCESSFI_FEATURED_VAULT_SLUG}` as Route}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff6a3d_0%,#ffb34f_55%,#6bf4d3_100%)] px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#09111f] shadow-[0_16px_34px_rgba(255,126,77,0.22)] transition hover:brightness-105"
            >
              Open Demo Vault
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-white/6 bg-[#07101d]/92">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-8 text-sm text-white/50 sm:px-6 md:flex-row md:items-center md:justify-between">
          <p>AccessFi turns premium access into a financial product with programmable rights and consumer-grade onboarding.</p>
          <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.18em]">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href as Route} className="transition hover:text-white">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

export function formatAccessFiAmount(amount: number | null, currency = "USDC") {
  if (amount === null || Number.isNaN(amount)) {
    return "Not required";
  }

  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2
  }).format(amount)} ${currency}`;
}

export function Eyebrow({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/64",
        className
      )}
    >
      {children}
    </span>
  );
}

export function GlassPanel({
  children,
  className
}: PropsWithChildren<{
  className?: string;
}>) {
  return (
    <div
      className={cn(
        "rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.025))] p-6 shadow-[0_28px_90px_rgba(3,9,18,0.26)] backdrop-blur-xl",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  action
}: {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
  action?: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-5", align === "center" && "items-center text-center")}>
      <Eyebrow className={cn(align === "center" && "justify-center")}>{eyebrow}</Eyebrow>
      <div className={cn("max-w-3xl space-y-4", align === "center" && "items-center")}>
        <h2 className="font-display text-4xl italic leading-[1.02] tracking-tight text-white sm:text-5xl">{title}</h2>
        <p className="text-base leading-8 text-white/64 sm:text-lg">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  note,
  className
}: {
  label: string;
  value: string;
  note: string;
  className?: string;
}) {
  return (
    <GlassPanel className={cn("h-full bg-white/[0.03] p-5", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/42">{label}</p>
      <p className="mt-3 font-headline text-3xl font-extrabold tracking-tight text-white">{value}</p>
      <p className="mt-3 text-sm leading-7 text-white/62">{note}</p>
    </GlassPanel>
  );
}

export function BulletStack({ items, tone = "default" }: { items: string[]; tone?: "default" | "bright" }) {
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span
            className={cn(
              "mt-1 flex size-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]",
              tone === "bright" && "bg-[#6bf4d3]/10 text-[#6bf4d3]"
            )}
          >
            <ShieldCheck size={14} />
          </span>
          <span className="text-sm leading-7 text-white/68">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function ActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href as Route}
      className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6bf4d3] transition hover:text-white"
    >
      {label}
      <ArrowUpRight size={15} />
    </Link>
  );
}
