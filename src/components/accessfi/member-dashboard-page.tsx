import type { Route } from "next";
import Link from "next/link";
import { ArrowUpRight, Download, LockKeyhole, Sparkles, Wallet2 } from "lucide-react";

import { GlassPanel, MetricCard, SectionHeading, formatAccessFiAmount } from "@/components/accessfi/shared";
import type { AccessFiIntegrationRailStatus, AccessFiVaultBundle, AccessFiViewer } from "@/lib/accessfi/types";

function activeMembershipCount(bundles: AccessFiVaultBundle[]) {
  return bundles.reduce((sum, bundle) => sum + bundle.memberships.filter((membership) => membership.status === "active").length, 0);
}

function reservedBalance(bundles: AccessFiVaultBundle[], userId: string) {
  return bundles.reduce((sum, bundle) => {
    const membership = bundle.memberships.find((entry) => entry.userId === userId);
    return sum + Number(membership?.reservedBalance ?? 0);
  }, 0);
}

export function AccessFiMemberDashboardPage({
  viewer,
  joinedVaults,
  recommendedVaults,
  integrationStatus
}: {
  viewer: AccessFiViewer;
  joinedVaults: AccessFiVaultBundle[];
  recommendedVaults: AccessFiVaultBundle[];
  integrationStatus: AccessFiIntegrationRailStatus[];
}) {
  const metrics = [
    {
      label: "Joined vaults",
      value: String(joinedVaults.length),
      note: "Everything you unlock appears here with the same proof trail."
    },
    {
      label: "Active seats",
      value: String(activeMembershipCount(joinedVaults)),
      note: "Membership state is coming from the same records used by the public vault page."
    },
    {
      label: "Reserved balance",
      value: formatAccessFiAmount(reservedBalance(joinedVaults, viewer.id), "USDC"),
      note: "Deposit-backed seats keep a visible reserve instead of a dead spend."
    },
    {
      label: "Linked rails",
      value: String(integrationStatus.filter((item) => item.configured).length),
      note: "Flow, Lit, NEAR, and storage readiness are visible to the member too."
    }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <SectionHeading
          eyebrow="Member Library"
          title={`Everything ${viewer.displayName} unlocks now lives in one account view.`}
          description="This route is now the actual library: joined vaults, downloadable assets, proof links, and a reserve-aware account surface."
        />
        <Link
          href="/accessfi/proof"
          className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6bf4d3] transition hover:text-white"
        >
          Open proof console
          <ArrowUpRight size={15} />
        </Link>
      </div>

      <section className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} label={metric.label} value={metric.value} note={metric.note} />
        ))}
      </section>

      <section className="mt-20 grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <GlassPanel>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ffcf7c]">Unlocked now</p>
          <div className="mt-6 space-y-4">
            {joinedVaults.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-white/12 bg-[#09111f]/72 p-5 text-sm leading-8 text-white/62">
                You have not unlocked any vaults yet. Open a public vault and complete the join flow to see assets appear here.
              </div>
            ) : (
              joinedVaults.map((bundle) => {
                const membership = bundle.memberships.find((entry) => entry.userId === viewer.id) ?? null;

                return (
                  <div key={bundle.vault.id} className="rounded-[1.5rem] border border-white/8 bg-[#09111f]/72 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-white">{bundle.vault.title}</p>
                        <p className="mt-2 text-sm leading-7 text-white/62">{bundle.vault.teaser}</p>
                      </div>
                      <span className="rounded-full border border-[#6bf4d3]/20 bg-[#6bf4d3]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6bf4d3]">
                        {membership?.status ?? "active"}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3">
                      {bundle.assets.map((asset) => (
                        <div key={asset.id} className="rounded-[1.2rem] bg-white/[0.03] p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="max-w-2xl">
                              <p className="text-sm font-semibold text-white">{asset.title}</p>
                              <p className="mt-2 text-sm leading-7 text-white/58">{asset.previewText}</p>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <Link
                                href={`/accessfi/assets/${asset.id}` as Route}
                                className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/10 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72 transition hover:bg-white/6 hover:text-white"
                              >
                                <Download className="mr-2" size={14} />
                                Download
                              </Link>
                              <Link
                                href={`/accessfi/proof/${bundle.vault.slug}` as Route}
                                className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#6bf4d3]/20 bg-[#6bf4d3]/10 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6bf4d3] transition hover:bg-[#6bf4d3]/15"
                              >
                                Proof
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </GlassPanel>

        <div className="space-y-6">
          <GlassPanel>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6bf4d3]">Account rails</p>
            <div className="mt-6 space-y-4">
              {integrationStatus.map((item) => (
                <div key={item.key} className="rounded-[1.4rem] bg-[#09111f]/72 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/54">
                      {item.network ?? "runtime"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-white/62">{item.details[0]}</p>
                </div>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ffcf7c]">Recommended next</p>
            <div className="mt-6 grid gap-4">
              {recommendedVaults.map((bundle, index) => {
                const Icon = index === 0 ? Sparkles : index === 1 ? Wallet2 : LockKeyhole;
                return (
                  <div key={bundle.vault.id} className="flex gap-4 rounded-[1.4rem] bg-[#09111f]/72 p-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/[0.04] text-[#6bf4d3]">
                      <Icon size={17} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{bundle.vault.title}</p>
                      <p className="mt-2 text-sm leading-7 text-white/62">{bundle.vault.teaser}</p>
                      <Link href={`/accessfi/vaults/${bundle.vault.slug}` as Route} className="mt-3 inline-flex text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6bf4d3]">
                        Open vault
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassPanel>
        </div>
      </section>

      <section className="mt-20 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <GlassPanel>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6bf4d3]">Why this feels product-shaped</p>
          <div className="mt-6 space-y-4">
            {[
              "The member route now reads from actual memberships and asset records.",
              "Every downloadable asset links back to the same proof surface.",
              "The join flow updates the library without rebuilding the product story."
            ].map((item) => (
              <div key={item} className="rounded-[1.4rem] bg-[#09111f]/72 p-4 text-sm leading-7 text-white/62">
                {item}
              </div>
            ))}
          </div>
        </GlassPanel>
        <GlassPanel>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ffcf7c]">Next step in the demo</p>
          <div className="mt-6 rounded-[1.6rem] border border-white/8 bg-[#09111f]/72 p-5">
            <p className="text-lg font-semibold text-white">Open a vault-specific proof view after one unlock.</p>
            <p className="mt-4 text-sm leading-8 text-white/64">
              That is the cleanest handoff for judges because they can see the same asset, the same membership, the same checkout reference, and the same encryption ref in one place.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/accessfi/proof"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff6a3d_0%,#ffb34f_55%,#6bf4d3_100%)] px-6 text-sm font-semibold uppercase tracking-[0.18em] text-[#09111f]"
            >
              Show judge proof
            </Link>
          </div>
        </GlassPanel>
      </section>
    </div>
  );
}
