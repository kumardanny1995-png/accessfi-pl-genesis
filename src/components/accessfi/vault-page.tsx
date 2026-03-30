import type { Route } from "next";
import Link from "next/link";
import { ArrowRight, Download, LockKeyhole, Orbit, ShieldCheck, UsersRound } from "lucide-react";

import { AccessFiJoinVaultForm } from "@/components/accessfi/join-vault-form";
import { GlassPanel, SectionHeading, formatAccessFiAmount } from "@/components/accessfi/shared";
import type { AccessFiIntegrationRailStatus, AccessFiMembership, AccessFiVaultBundle, AccessFiViewer } from "@/lib/accessfi/types";

export function AccessFiVaultPage({
  viewer,
  bundle,
  membership,
  policySummary,
  integrationStatus
}: {
  viewer: AccessFiViewer | null;
  bundle: AccessFiVaultBundle;
  membership: AccessFiMembership | null;
  policySummary: string[];
  integrationStatus: AccessFiIntegrationRailStatus[];
}) {
  const { vault, assets, unlockEvents } = bundle;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <section className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
        <div>
          <SectionHeading eyebrow="Buyer Flow" title={vault.title} description={vault.teaser} />
          <div className="mt-8 flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            <span className="rounded-full border border-white/10 px-3 py-2">{vault.creatorName}</span>
            <span className="rounded-full border border-white/10 px-3 py-2">{vault.accessType.replace(/_/g, " ")}</span>
            <span className="rounded-full border border-[#6bf4d3]/20 bg-[#6bf4d3]/10 px-3 py-2 text-[#6bf4d3]">
              {assets.length} protected assets
            </span>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <GlassPanel className="p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/36">Active seats</p>
              <p className="mt-3 text-2xl font-bold text-white">{bundle.memberships.filter((entry) => entry.status === "active").length}</p>
            </GlassPanel>
            <GlassPanel className="p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/36">Storage refs</p>
              <p className="mt-3 text-2xl font-bold text-white">{assets.length}</p>
            </GlassPanel>
            <GlassPanel className="p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/36">Unlock events</p>
              <p className="mt-3 text-2xl font-bold text-white">{unlockEvents.length}</p>
            </GlassPanel>
          </div>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/accessfi/dashboard"
              className="inline-flex min-h-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff6a3d_0%,#ffb34f_55%,#6bf4d3_100%)] px-8 text-sm font-semibold uppercase tracking-[0.18em] text-[#09111f] transition hover:brightness-105"
            >
              Unlock as Member
            </Link>
            <Link
              href="/accessfi/proof"
              className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/10 px-8 text-sm font-semibold uppercase tracking-[0.18em] text-white/78 transition hover:bg-white/6 hover:text-white"
            >
              Inspect Proof Rail
            </Link>
          </div>
        </div>

        <GlassPanel className="overflow-hidden p-0">
          <div className="border-b border-white/6 px-6 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ffcf7c]">Unlock vault</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Join this vault without breaking the demo flow.</h2>
          </div>
          <div className="space-y-4 p-6">
            <div className="rounded-[1.7rem] border border-white/8 bg-[#09111f]/72 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xl font-semibold text-white">{vault.title}</p>
                  <p className="mt-2 text-sm leading-7 text-white/60">{vault.description}</p>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/56">
                  {vault.accessType.replace(/_/g, " ")}
                </span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.2rem] bg-white/[0.04] p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/36">Reserve</p>
                  <p className="mt-2 text-lg font-semibold text-white">{formatAccessFiAmount(vault.depositAmount, vault.currency)}</p>
                </div>
                <div className="rounded-[1.2rem] bg-white/[0.04] p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/36">Billing</p>
                  <p className="mt-2 text-lg font-semibold text-white">{formatAccessFiAmount(vault.subscriptionAmount, vault.currency)}</p>
                </div>
              </div>
              <div className="mt-6">
                {membership ? (
                  <div className="rounded-[1.4rem] border border-[#6bf4d3]/20 bg-[#6bf4d3]/10 p-4 text-sm leading-7 text-[#dffef6]">
                    Access is already active for this account. Jump to your library or open the proof detail next.
                  </div>
                ) : (
                  <AccessFiJoinVaultForm
                    vaultSlug={vault.slug}
                    accessType={vault.accessType}
                    currency={vault.currency}
                    depositAmount={vault.depositAmount}
                    subscriptionAmount={vault.subscriptionAmount}
                    isLoggedIn={Boolean(viewer)}
                  />
                )}
              </div>
            </div>
          </div>
        </GlassPanel>
      </section>

      <section className="mt-20 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <GlassPanel>
          <SectionHeading
            eyebrow="What unlocks today"
            title="Members see actual protected assets, not abstract membership copy."
            description="This surface now reads from the same uploaded asset records that power the library and download route."
          />
          <div className="mt-8 space-y-4">
            {assets.map((asset) => (
              <div key={asset.id} className="rounded-[1.5rem] border border-white/8 bg-[#09111f]/72 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="max-w-2xl">
                    <p className="text-lg font-semibold text-white">{asset.title}</p>
                    <p className="mt-2 text-sm leading-7 text-white/62">{asset.previewText}</p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/56">
                    {asset.mimeType.split("/")[1] ?? asset.mimeType}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1rem] bg-white/[0.04] p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/34">Unlock</p>
                    <p className="mt-2 text-sm font-medium text-white">{vault.accessType.replace(/_/g, " ")}</p>
                  </div>
                  <div className="rounded-[1rem] bg-white/[0.04] p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/34">CID</p>
                    <p className="mt-2 truncate text-sm font-medium text-white">{asset.storageRef}</p>
                  </div>
                  <div className="rounded-[1rem] bg-white/[0.04] p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/34">Size</p>
                    <p className="mt-2 text-sm font-medium text-white">{Math.max(1, Math.round(asset.sizeBytes / 1024))} KB</p>
                  </div>
                </div>
                {membership ? (
                  <div className="mt-4">
                    <Link
                      href={`/accessfi/assets/${asset.id}` as Route}
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72 transition hover:bg-white/6 hover:text-white"
                    >
                      <Download className="mr-2" size={14} />
                      Download asset
                    </Link>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </GlassPanel>
        <div className="space-y-6">
          <GlassPanel>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ffcf7c]">Access policy</p>
            <div className="mt-6 grid gap-4">
              {policySummary.map((item) => (
                <div key={item} className="rounded-[1.4rem] bg-[#09111f]/72 p-4 text-sm leading-7 text-white/64">
                  {item}
                </div>
              ))}
            </div>
          </GlassPanel>
          <GlassPanel>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ffcf7c]">Sponsor rails on this page</p>
            <div className="mt-6 grid gap-4">
              {integrationStatus.slice(0, 3).map((item, index) => {
                const Icon = index === 0 ? UsersRound : index === 1 ? ShieldCheck : Orbit;
                return (
                  <div key={item.key} className="flex gap-4 rounded-[1.4rem] bg-[#09111f]/72 p-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.04] text-[#6bf4d3]">
                      <Icon size={18} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      <p className="mt-2 text-sm leading-7 text-white/64">{item.details[0]}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassPanel>
        </div>
      </section>

      <section className="mt-20 grid gap-6 lg:grid-cols-[0.94fr_1.06fr]">
        <GlassPanel>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6bf4d3]">If access is already active</p>
          <div className="mt-6 grid gap-4">
            {[
              "Open the member library and show the vault there.",
              "Download one asset to prove gated content really moves through the product.",
              "Open the vault-specific proof screen and show the event trail."
            ].map((moment) => (
              <div key={moment} className="flex items-start gap-3 rounded-[1.4rem] bg-[#09111f]/72 p-4">
                <span className="mt-1 flex size-8 items-center justify-center rounded-full bg-white/[0.04] text-[#ffcf7c]">
                  <LockKeyhole size={15} />
                </span>
                <p className="text-sm leading-7 text-white/64">{moment}</p>
              </div>
            ))}
          </div>
        </GlassPanel>
        <GlassPanel>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ffcf7c]">Proof rail snapshot</p>
          <div className="mt-6 space-y-4">
            {unlockEvents.length === 0 ? (
              <div className="rounded-[1.4rem] border border-white/8 bg-[#09111f]/72 p-4 text-sm leading-7 text-white/62">
                No unlock event yet. Join the vault once to generate the checkout reference and event trail.
              </div>
            ) : (
              unlockEvents.slice(0, 3).map((event) => (
                <div key={event.id} className="rounded-[1.4rem] border border-white/8 bg-[#09111f]/72 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-white">{event.message}</p>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">
                      {new Date(event.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-white/62">Provider: {event.provider}</p>
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6bf4d3]">
                    {event.txRef ?? "Proof-linked policy event"}
                  </p>
                </div>
              ))
            )}
          </div>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/accessfi/dashboard"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff6a3d_0%,#ffb34f_55%,#6bf4d3_100%)] px-6 text-sm font-semibold uppercase tracking-[0.18em] text-[#09111f]"
            >
              Continue to dashboard
            </Link>
            <Link
              href={`/accessfi/proof/${vault.slug}` as Route}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/10 px-6 text-sm font-semibold uppercase tracking-[0.18em] text-white/78 transition hover:bg-white/6 hover:text-white"
            >
              Open vault proof
              <ArrowRight className="ml-2" size={16} />
            </Link>
          </div>
        </GlassPanel>
      </section>
    </div>
  );
}
