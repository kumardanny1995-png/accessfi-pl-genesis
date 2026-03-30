import type { Route } from "next";
import Link from "next/link";
import { ArrowRight, Coins, LockKeyhole, Orbit, Sparkles, UsersRound } from "lucide-react";

import { ActionLink, GlassPanel, MetricCard, SectionHeading, formatAccessFiAmount } from "@/components/accessfi/shared";
import type { AccessFiIntegrationRailStatus, AccessFiVaultBundle } from "@/lib/accessfi/types";

export function AccessFiLandingPage({
  bundles,
  featured,
  integrationStatus,
  repositoryMode
}: {
  bundles: AccessFiVaultBundle[];
  featured: AccessFiVaultBundle | null;
  integrationStatus: AccessFiIntegrationRailStatus[];
  repositoryMode: string;
}) {
  const totalAssets = bundles.reduce((sum, bundle) => sum + bundle.assets.length, 0);
  const totalMembers = bundles.reduce(
    (sum, bundle) => sum + bundle.memberships.filter((membership) => membership.status === "active").length,
    0
  );
  const metrics = [
    {
      label: "Published vaults",
      value: String(bundles.length),
      note: "Mixed across deposit-backed, subscription, allowlist, and token-gated access."
    },
    {
      label: "Premium assets",
      value: String(totalAssets),
      note: "Each one carries storage, encryption, and proof-linked metadata."
    },
    {
      label: "Member accounts",
      value: String(totalMembers),
      note: "The member library, proof console, and create flow all hang off the same domain model."
    },
    {
      label: "Persistence mode",
      value: repositoryMode === "supabase" ? "Supabase" : "Local demo",
      note: "The app stays runnable even before the AccessFi migration is applied."
    }
  ];

  return (
    <div className="pb-24 pt-10">
      <section className="mx-auto grid max-w-7xl gap-14 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.98fr] lg:items-center lg:py-20">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#ffb34f]/20 bg-[#ffb34f]/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ffd28d]">
            <Sparkles size={14} />
            Premium access should behave like fintech
          </span>
          <h1 className="mt-6 font-display text-5xl italic leading-[0.98] tracking-tight text-white sm:text-6xl lg:text-[5.25rem]">
            Deposit-backed vaults for premium communities, research, and private tools.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-9 text-white/66 sm:text-xl">
            AccessFi gives creators and communities a walletless way to sell encrypted access to files, dashboards, rooms, and
            private workflows while the buyer flow, creator flow, and proof flow all stay on one coherent product surface.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href={(featured ? `/accessfi/vaults/${featured.vault.slug}` : "/accessfi/create") as Route}
              className="inline-flex min-h-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff6a3d_0%,#ffb34f_52%,#6bf4d3_100%)] px-8 text-sm font-semibold uppercase tracking-[0.18em] text-[#09111f] shadow-[0_18px_44px_rgba(255,122,72,0.24)] transition hover:brightness-105"
            >
              Open Sample Vault
            </Link>
            <Link
              href={"/accessfi/create" as Route}
              className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/10 px-8 text-sm font-semibold uppercase tracking-[0.18em] text-white/78 transition hover:bg-white/6 hover:text-white"
            >
              Launch Vault
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">
            <span>Filecoin + Storacha storage</span>
            <span>Lit policy unlocks</span>
            <span>Flow walletless payments</span>
            <span>NEAR abstraction path</span>
          </div>
        </div>
        <GlassPanel className="relative overflow-hidden p-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,170,92,0.18),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(107,244,211,0.14),transparent_26%)]" />
          <div className="relative p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6bf4d3]">Live sample vault</p>
                <h2 className="mt-2 font-headline text-2xl font-extrabold tracking-tight text-white">{featured?.vault.title ?? "AccessFi Vault"}</h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                {featured?.vault.accessType.replace(/_/g, " ") ?? "ready"}
              </span>
            </div>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/66">{featured?.vault.teaser ?? "Programmable premium access with proof-linked storage."}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.6rem] bg-[#09111f]/66 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/36">Active seats</p>
                <p className="mt-3 text-2xl font-bold text-white">
                  {featured?.memberships.filter((membership) => membership.status === "active").length ?? 0}
                </p>
              </div>
              <div className="rounded-[1.6rem] bg-[#09111f]/66 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/36">Assets</p>
                <p className="mt-3 text-2xl font-bold text-white">{featured?.assets.length ?? 0}</p>
              </div>
              <div className="rounded-[1.6rem] bg-[#09111f]/66 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/36">Price rail</p>
                <p className="mt-3 text-2xl font-bold text-white">
                  {featured ? formatAccessFiAmount(featured.vault.depositAmount ?? featured.vault.subscriptionAmount, featured.vault.currency) : "USDC"}
                </p>
              </div>
            </div>
            <div className="mt-6 rounded-[1.8rem] border border-white/8 bg-[#09111f]/72 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">Unlock plan</p>
                  <p className="mt-2 text-xl font-semibold text-white">{featured?.vault.accessType.replace(/_/g, " ") ?? "deposit_to_unlock"}</p>
                </div>
                <Coins className="text-[#ffcf7c]" size={22} />
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.2rem] bg-white/[0.04] p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/34">Reserve</p>
                  <p className="mt-2 text-lg font-semibold text-white">{formatAccessFiAmount(featured?.vault.depositAmount ?? null, featured?.vault.currency ?? "USDC")}</p>
                </div>
                <div className="rounded-[1.2rem] bg-white/[0.04] p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/34">Seat billing</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {formatAccessFiAmount(featured?.vault.subscriptionAmount ?? null, featured?.vault.currency ?? "USDC")}
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {(featured?.assets ?? []).slice(0, 3).map((asset) => (
                  <div key={asset.id} className="flex items-start justify-between gap-4 rounded-[1.2rem] bg-white/[0.03] p-4">
                    <div>
                      <p className="text-sm font-semibold text-white">{asset.title}</p>
                      <p className="mt-1 text-sm leading-6 text-white/56">{asset.previewText}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-[#6bf4d3]/20 bg-[#6bf4d3]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6bf4d3]">
                      {asset.mimeType.split("/")[1] ?? asset.mimeType}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GlassPanel>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} label={metric.label} value={metric.value} note={metric.note} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr]">
          <SectionHeading
            eyebrow="Product surface"
            title="These are real vaults, not just sponsor badges on a README."
            description="Each sample vault already has an access rule, asset set, policy object, and proof trail. The landing page is now reading those records directly."
          />
          <div className="grid gap-4">
            {bundles.map((bundle) => (
              <GlassPanel key={bundle.vault.id}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ffcf7c]">{bundle.vault.creatorName}</p>
                    <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">{bundle.vault.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-white/64">{bundle.vault.teaser}</p>
                  </div>
                  <Link
                    href={`/accessfi/vaults/${bundle.vault.slug}` as Route}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72 transition hover:bg-white/6 hover:text-white"
                  >
                    Open Vault
                  </Link>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <span className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/54">
                    {bundle.vault.accessType.replace(/_/g, " ")}
                  </span>
                  <span className="rounded-full border border-[#6bf4d3]/20 bg-[#6bf4d3]/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6bf4d3]">
                    {bundle.assets.length} assets
                  </span>
                </div>
              </GlassPanel>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#08111d]/76 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Sponsor rails"
            title="The integration layer is visible on the product, not hidden in setup notes."
            description="Flow, Lit, Storacha/Filecoin, and NEAR all have a concrete role in the current build. Missing credentials degrade to a clean demo fallback instead of dead buttons."
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {integrationStatus.map((item) => (
              <GlassPanel key={item.key} className="h-full">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ffcf7c]">{item.label}</p>
                    <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">{item.mode}</h3>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/52">
                    {item.network ?? "runtime"}
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {item.details.map((detail) => (
                    <p key={detail} className="text-sm leading-8 text-white/66">
                      {detail}
                    </p>
                  ))}
                </div>
              </GlassPanel>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <SectionHeading
          eyebrow="What this unlocks"
          title="The same data powers the buyer flow, creator flow, and proof flow."
          description="AccessFi now ships the exact surfaces you need for the hackathon demo: landing, vault, creator dashboard, create flow, member library, and proof console."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <GlassPanel className="h-full">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-white/[0.04] text-[#6bf4d3]">
              <UsersRound size={20} />
            </span>
            <h3 className="mt-6 text-xl font-semibold text-white">Creator dashboard</h3>
            <p className="mt-4 text-sm leading-7 text-white/64">Track your vaults, member counts, and proof-linked activity without leaving the product surface.</p>
          </GlassPanel>
          <GlassPanel className="h-full">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-white/[0.04] text-[#6bf4d3]">
              <LockKeyhole size={20} />
            </span>
            <h3 className="mt-6 text-xl font-semibold text-white">Join flow</h3>
            <p className="mt-4 text-sm leading-7 text-white/64">Members can actually unlock a vault and then see the right appear in their library, not just read a pitch deck.</p>
          </GlassPanel>
          <GlassPanel className="h-full">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-white/[0.04] text-[#6bf4d3]">
              <Orbit size={20} />
            </span>
            <h3 className="mt-6 text-xl font-semibold text-white">Proof console</h3>
            <p className="mt-4 text-sm leading-7 text-white/64">Storage refs, encryption refs, memberships, and unlock events now sit on a single judge-facing page.</p>
          </GlassPanel>
        </div>
      </section>

      <section className="bg-[#08111d]/76 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeading
              eyebrow="Demo arc"
              title="The story still lands in three screens."
              description="Create the vault, unlock it as a member, then close with the proof console."
            />
            <ActionLink href="/accessfi/proof" label="Open proof console" />
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Create vault",
                body: "Upload one premium asset, define the access rail, and publish the teaser page."
              },
              {
                title: "Join vault",
                body: "Unlock access with the selected rail, then prove the right landed in the member library."
              },
              {
                title: "Show proof",
                body: "Open the proof console and show the CID, encryption ref, payment quote, and unlock event."
              }
            ].map((step, index) => (
              <GlassPanel key={step.title} className="h-full">
                <div className="flex size-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-lg font-semibold text-white">
                  {index + 1}
                </div>
                <h3 className="mt-6 text-xl font-semibold tracking-tight text-white">{step.title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/64">{step.body}</p>
              </GlassPanel>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <GlassPanel className="px-6 py-10 sm:px-10">
          <SectionHeading
            eyebrow="Build now"
            title="The product story is locked. The next move is shipping the demo path cleanly."
            description="Open the create flow, launch the sample vault, and use the proof console as the judge-facing closer."
            align="center"
            action={
              <div className="flex flex-col justify-center gap-4 pt-2 sm:flex-row">
                <Link
                  href={"/accessfi/create" as Route}
                  className="inline-flex min-h-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff6a3d_0%,#ffb34f_55%,#6bf4d3_100%)] px-8 text-sm font-semibold uppercase tracking-[0.18em] text-[#09111f] transition hover:brightness-105"
                >
                  Launch Creator Flow
                </Link>
                <Link
                  href={(featured ? `/accessfi/vaults/${featured.vault.slug}` : "/accessfi/proof") as Route}
                  className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/10 px-8 text-sm font-semibold uppercase tracking-[0.18em] text-white/78 transition hover:bg-white/6 hover:text-white"
                >
                  Walk the Buyer Flow
                  <ArrowRight className="ml-2" size={16} />
                </Link>
              </div>
            }
          />
        </GlassPanel>
      </section>
    </div>
  );
}
