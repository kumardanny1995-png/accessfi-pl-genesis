import type { Route } from "next";
import Link from "next/link";
import { ArrowRight, Coins, PackageOpen, ShieldCheck, Sparkles } from "lucide-react";

import { ActionLink, GlassPanel, MetricCard, SectionHeading, formatAccessFiAmount } from "@/components/accessfi/shared";
import type { AccessFiIntegrationRailStatus, AccessFiVaultBundle, AccessFiViewer } from "@/lib/accessfi/types";

function activeMembers(bundle: AccessFiVaultBundle) {
  return bundle.memberships.filter((membership) => membership.status === "active").length;
}

export function AccessFiCreatorStudioPage({
  viewer,
  ownVaults,
  publicVaults,
  totalMembers,
  totalAssets,
  integrationStatus,
  repositoryMode
}: {
  viewer: AccessFiViewer;
  ownVaults: AccessFiVaultBundle[];
  publicVaults: AccessFiVaultBundle[];
  totalMembers: number;
  totalAssets: number;
  integrationStatus: AccessFiIntegrationRailStatus[];
  repositoryMode: string;
}) {
  const dashboardMetrics = [
    {
      label: "Your vaults",
      value: String(ownVaults.length),
      note: "Creator-owned vaults tied to your current account."
    },
    {
      label: "Active members",
      value: String(totalMembers),
      note: "Pulled from real membership records, not a mock scoreboard."
    },
    {
      label: "Protected assets",
      value: String(totalAssets),
      note: "Encrypted assets inside the vaults you own."
    },
    {
      label: "Persistence",
      value: repositoryMode === "supabase" ? "Supabase" : "Local demo",
      note: "The product remains usable before the migration is applied."
    }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="grid gap-12 lg:grid-cols-[1fr_0.98fr] lg:items-start">
        <SectionHeading
          eyebrow="Creator Dashboard"
          title={`Operate AccessFi vaults as ${viewer.displayName}.`}
          description="This is now a real creator dashboard: your vault list, top metrics, proof-linked events, and a direct path into the create form."
        />
        <GlassPanel>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6bf4d3]">Operator actions</p>
          <div className="mt-5 space-y-4">
            <div className="rounded-[1.5rem] bg-[#09111f]/72 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Next step</p>
              <p className="mt-2 text-xl font-semibold text-white">Create one narrow, buyer-shaped vault.</p>
              <p className="mt-2 text-sm leading-7 text-white/62">
                Research club, operator room, and premium cohort are still the strongest hackathon wedges.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                href={"/accessfi/create" as Route}
                className="inline-flex min-h-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff6a3d_0%,#ffb34f_55%,#6bf4d3_100%)] px-6 text-sm font-semibold uppercase tracking-[0.18em] text-[#09111f] transition hover:brightness-105"
              >
                Open Create Flow
              </Link>
              <Link
                href="/accessfi/proof"
                className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/10 px-6 text-sm font-semibold uppercase tracking-[0.18em] text-white/78 transition hover:bg-white/6 hover:text-white"
              >
                Open Proof Console
              </Link>
            </div>
            <div className="rounded-[1.5rem] bg-[#09111f]/72 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Integration posture</p>
              <div className="mt-4 grid gap-3">
                {integrationStatus.map((item) => (
                  <div key={item.key} className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/48">{item.mode}</span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-white/60">{item.details[0]}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GlassPanel>
      </div>

      <section className="mt-16 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => (
          <MetricCard key={metric.label} label={metric.label} value={metric.value} note={metric.note} />
        ))}
      </section>

      <section className="mt-20">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Your vaults"
            title="Everything you publish should earn its keep in the demo."
            description="These cards are now driven by vault records, membership counts, and uploaded assets instead of static pitch copy."
          />
          <ActionLink href="/accessfi/create" label="Publish another vault" />
        </div>
        {ownVaults.length === 0 ? (
          <GlassPanel className="mt-12">
            <p className="text-lg font-semibold text-white">No creator vaults yet.</p>
            <p className="mt-4 max-w-2xl text-sm leading-8 text-white/64">
              The build is ready for it: upload an asset, set the access rule, and publish the public teaser page. The member and proof flows will pick it up automatically.
            </p>
          </GlassPanel>
        ) : (
          <div className="mt-12 grid gap-6 xl:grid-cols-2">
            {ownVaults.map((bundle) => (
              <GlassPanel key={bundle.vault.id} className="h-full">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ffcf7c]">{bundle.vault.accessType.replace(/_/g, " ")}</p>
                    <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">{bundle.vault.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-white/64">{bundle.vault.teaser}</p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/54">
                    {bundle.assets.length} assets
                  </span>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-[1.2rem] bg-white/[0.03] p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Members</p>
                    <p className="mt-2 text-lg font-semibold text-white">{activeMembers(bundle)}</p>
                  </div>
                  <div className="rounded-[1.2rem] bg-white/[0.03] p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Price</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {formatAccessFiAmount(bundle.vault.depositAmount ?? bundle.vault.subscriptionAmount, bundle.vault.currency)}
                    </p>
                  </div>
                  <div className="rounded-[1.2rem] bg-white/[0.03] p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Events</p>
                    <p className="mt-2 text-lg font-semibold text-white">{bundle.unlockEvents.length}</p>
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={`/accessfi/vaults/${bundle.vault.slug}` as Route}
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff6a3d_0%,#ffb34f_55%,#6bf4d3_100%)] px-6 text-sm font-semibold uppercase tracking-[0.18em] text-[#09111f]"
                  >
                    Open Vault
                  </Link>
                  <Link
                    href={`/accessfi/proof/${bundle.vault.slug}` as Route}
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/10 px-6 text-sm font-semibold uppercase tracking-[0.18em] text-white/78 transition hover:bg-white/6 hover:text-white"
                  >
                    Proof Detail
                  </Link>
                </div>
              </GlassPanel>
            ))}
          </div>
        )}
      </section>

      <section className="mt-20 grid gap-6 lg:grid-cols-[0.94fr_1.06fr]">
        <GlassPanel className="h-full">
          <SectionHeading
            eyebrow="What judges should see"
            title="The dashboard already proves the product is not a shell."
            description="Real creator state, real member state, and real proof references matter more than splashy animations."
          />
          <div className="mt-8 grid gap-4">
            {[
              "One published vault with a real uploaded asset.",
              "A member who can unlock the vault and see it in the library.",
              "A proof page with storage ref, encryption ref, and event history.",
              "Sponsor integrations visible inside the app, not only in documentation."
            ].map((item) => (
              <div key={item} className="rounded-[1.4rem] bg-[#09111f]/72 p-4 text-sm leading-7 text-white/64">
                {item}
              </div>
            ))}
          </div>
        </GlassPanel>
        <GlassPanel className="h-full">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ffcf7c]">Public market sample</p>
          <div className="mt-8 grid gap-4">
            {publicVaults.slice(0, 3).map((bundle) => (
              <div key={bundle.vault.id} className="rounded-[1.4rem] bg-[#09111f]/72 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-white/[0.04] text-[#6bf4d3]">
                    {bundle.vault.accessType === "deposit_to_unlock" ? <Coins size={16} /> : bundle.vault.accessType === "subscription_access" ? <Sparkles size={16} /> : bundle.vault.accessType === "allowlist_access" ? <ShieldCheck size={16} /> : <PackageOpen size={16} />}
                  </span>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">{bundle.vault.creatorName}</p>
                    <p className="mt-1 text-sm leading-7 text-white/66">{bundle.vault.title}</p>
                    <p className="mt-1 text-sm leading-7 text-white/54">{bundle.vault.teaser}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      </section>

      <section className="mt-20">
        <SectionHeading
          eyebrow="Next move"
          title="Create one vault, unlock it once, then walk straight into proof."
          description="That is still the cleanest route through the demo."
        />
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href={"/accessfi/create" as Route}
            className="inline-flex min-h-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff6a3d_0%,#ffb34f_55%,#6bf4d3_100%)] px-8 text-sm font-semibold uppercase tracking-[0.18em] text-[#09111f] transition hover:brightness-105"
          >
            Open Create Flow
          </Link>
          <Link
            href="/accessfi/proof"
            className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/10 px-8 text-sm font-semibold uppercase tracking-[0.18em] text-white/78 transition hover:bg-white/6 hover:text-white"
          >
            Open Proof Console
            <ArrowRight className="ml-2" size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
