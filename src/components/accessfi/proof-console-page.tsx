import type { Route } from "next";
import Link from "next/link";
import { CheckCircle2, FileKey2, GitBranchPlus, LockKeyhole, WalletCards } from "lucide-react";

import { GlassPanel, SectionHeading } from "@/components/accessfi/shared";
import type { AccessFiIntegrationRailStatus, AccessFiVaultBundle } from "@/lib/accessfi/types";

const protocolIcons = {
  flow: WalletCards,
  lit: LockKeyhole,
  storacha: GitBranchPlus,
  near: CheckCircle2,
  persistence: FileKey2
} as const;

export function AccessFiProofConsolePage({
  bundles,
  integrationStatus,
  repositoryMode,
  focused
}: {
  bundles: AccessFiVaultBundle[];
  integrationStatus: AccessFiIntegrationRailStatus[];
  repositoryMode: string;
  focused?: AccessFiVaultBundle | null;
}) {
  const subject = focused ?? bundles[0] ?? null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <SectionHeading
        eyebrow="Proof console"
        title={focused ? `${focused.vault.title} proof detail` : "This is the judge-facing closer."}
        description={
          focused
            ? "This detail view ties one vault’s storage refs, encryption refs, membership state, and unlock history together."
            : "The buyer action, the payment state, the access condition, and the storage proof all sit in one place."
        }
      />

      <section className="mt-12 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <GlassPanel>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ffcf7c]">What judges should notice</p>
          <div className="mt-6 grid gap-4">
            {[
              "The same vault and asset records drive the landing, public vault, creator dashboard, library, and proof routes.",
              "Encrypted asset refs are stored alongside a policy summary and a payment/event trail.",
              "The app cleanly downgrades when sponsor credentials are missing instead of leaving dead ends."
            ].map((item) => (
              <div key={item} className="rounded-[1.4rem] bg-[#09111f]/72 p-4 text-sm leading-7 text-white/64">
                {item}
              </div>
            ))}
          </div>
        </GlassPanel>
        <GlassPanel>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6bf4d3]">System path</p>
          <div className="mt-8 grid gap-4">
            {integrationStatus.map((item) => (
              <div key={item.key} className="rounded-[1.4rem] bg-[#09111f]/72 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/36">{item.label}</p>
                <p className="mt-2 text-sm leading-7 text-white/66">{item.details[0]}</p>
              </div>
            ))}
          </div>
        </GlassPanel>
      </section>

      <section className="mt-20">
        <SectionHeading
          eyebrow="Sponsor stack"
          title="Every protocol has a visible role in the demo."
          description="This prevents the common hackathon problem where the stack exists only in the README but not in the product experience."
        />
        <div className="mt-12 grid gap-6 xl:grid-cols-2">
          {integrationStatus.map((integration) => {
            const Icon = protocolIcons[integration.key as keyof typeof protocolIcons] ?? CheckCircle2;
            return (
              <GlassPanel key={integration.key} className="h-full">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-white/[0.04] text-[#6bf4d3]">
                      <Icon size={19} />
                    </span>
                    <div>
                      <p className="text-xl font-semibold text-white">{integration.label}</p>
                      <p className="mt-2 text-sm leading-7 text-white/62">{integration.details[0]}</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/56">
                    {integration.network ?? "runtime"}
                  </span>
                </div>
                <div className="mt-5 rounded-[1.3rem] bg-[#09111f]/72 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/36">Demo moment</p>
                  <p className="mt-2 text-sm leading-7 text-white/66">{integration.details[1] ?? integration.details[0]}</p>
                </div>
              </GlassPanel>
            );
          })}
        </div>
      </section>

      <section className="mt-20">
        <SectionHeading
          eyebrow="Vault map"
          title="Every public vault has its own proof surface."
          description="This list is driven by actual vault records and proof-linked metadata."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {bundles.map((bundle) => (
            <GlassPanel key={bundle.vault.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ffcf7c]">{bundle.vault.creatorName}</p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">{bundle.vault.title}</h3>
                  <p className="mt-3 text-sm leading-8 text-white/64">{bundle.vault.teaser}</p>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/56">
                  {bundle.unlockEvents.length} events
                </span>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/accessfi/vaults/${bundle.vault.slug}` as Route}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/10 px-6 text-sm font-semibold uppercase tracking-[0.18em] text-white/78 transition hover:bg-white/6 hover:text-white"
                >
                  Open Vault
                </Link>
                <Link
                  href={`/accessfi/proof/${bundle.vault.slug}` as Route}
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff6a3d_0%,#ffb34f_55%,#6bf4d3_100%)] px-6 text-sm font-semibold uppercase tracking-[0.18em] text-[#09111f]"
                >
                  Proof Detail
                </Link>
              </div>
            </GlassPanel>
          ))}
        </div>
      </section>

      {subject ? (
        <section className="mt-20">
          <SectionHeading
            eyebrow="Event trail"
            title={`A single unlock path for ${subject.vault.title}.`}
            description="This is the exact sequence to show judges after the buyer joins."
          />
          <div className="mt-12 grid gap-4">
            {subject.unlockEvents.length === 0 ? (
              <GlassPanel className="p-5 text-sm leading-7 text-white/62">
                No unlocks yet. Use the public vault page to generate the first membership and event trail.
              </GlassPanel>
            ) : (
              subject.unlockEvents.map((event) => (
                <GlassPanel key={event.id} className="p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-white">{event.message}</p>
                      <p className="mt-2 text-sm leading-7 text-white/64">Provider: {event.provider}</p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 text-left md:text-right">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                        {new Date(event.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit"
                        })}
                      </span>
                      <span className="rounded-full border border-[#6bf4d3]/20 bg-[#6bf4d3]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6bf4d3]">
                        {event.txRef ?? "policy event"}
                      </span>
                    </div>
                  </div>
                </GlassPanel>
              ))
            )}
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <GlassPanel>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ffcf7c]">Stored assets</p>
              <div className="mt-6 grid gap-4">
                {subject.assets.map((asset) => (
                  <div key={asset.id} className="rounded-[1.4rem] bg-[#09111f]/72 p-4">
                    <p className="text-sm font-semibold text-white">{asset.title}</p>
                    <p className="mt-2 text-sm leading-7 text-white/62">{asset.previewText}</p>
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6bf4d3]">{asset.storageRef}</p>
                  </div>
                ))}
              </div>
            </GlassPanel>
            <GlassPanel>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ffcf7c]">Vault snapshot</p>
              <div className="mt-6 grid gap-4">
                <div className="rounded-[1.4rem] bg-[#09111f]/72 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/36">Persistence mode</p>
                  <p className="mt-2 text-sm leading-7 text-white/66">{repositoryMode}</p>
                </div>
                <div className="rounded-[1.4rem] bg-[#09111f]/72 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/36">Access type</p>
                  <p className="mt-2 text-sm leading-7 text-white/66">{subject.vault.accessType.replace(/_/g, " ")}</p>
                </div>
                <div className="rounded-[1.4rem] bg-[#09111f]/72 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/36">Creator</p>
                  <p className="mt-2 text-sm leading-7 text-white/66">{subject.vault.creatorName}</p>
                </div>
              </div>
            </GlassPanel>
          </div>
        </section>
      ) : null}
    </div>
  );
}
