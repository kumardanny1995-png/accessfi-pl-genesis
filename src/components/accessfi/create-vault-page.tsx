import { Layers3, ShieldCheck, Sparkles } from "lucide-react";

import { AccessFiCreateVaultForm } from "@/components/accessfi/create-vault-form";
import { GlassPanel, MetricCard, SectionHeading } from "@/components/accessfi/shared";
import type { AccessFiIntegrationRailStatus, AccessFiViewer } from "@/lib/accessfi/types";

export function AccessFiCreateVaultPage({
  viewer,
  integrationStatus,
  repositoryMode
}: {
  viewer: AccessFiViewer;
  integrationStatus: AccessFiIntegrationRailStatus[];
  repositoryMode: string;
}) {
  const summaryCards = [
    {
      label: "Creator",
      value: viewer.displayName,
      note: viewer.email
    },
    {
      label: "Persistence",
      value: repositoryMode === "supabase" ? "Supabase" : "Local demo",
      note: "The app auto-falls back while the migration is unapplied."
    },
    {
      label: "Encryption",
      value: integrationStatus.find((item) => item.key === "lit")?.configured ? "Lit-ready" : "Local fallback",
      note: "Assets stay encrypted even when sponsor credentials are missing."
    }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-8">
          <SectionHeading
            eyebrow="Create Vault"
            title="Publish one narrow premium vault that feels like a real product."
            description="This is the shipping surface for the hackathon. Upload one premium asset, set the access right, and let the same app generate the public teaser, member unlock flow, and proof trail."
          />

          <div className="grid gap-4 md:grid-cols-3">
            {summaryCards.map((card) => (
              <MetricCard key={card.label} label={card.label} value={card.value} note={card.note} />
            ))}
          </div>

          <GlassPanel>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-white/[0.04] text-[#6bf4d3]">
                  <Sparkles size={18} />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">Winning constraint</p>
                  <p className="mt-1 text-lg font-semibold text-white">One good wedge beats five half-built ideas.</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.4rem] bg-white/[0.03] p-4 text-sm leading-7 text-white/64">
                  Pick a vault that has a clear buyer, a clear asset, and a clear access rule. Research club, operator room, and cohort toolkit are still the best wedges.
                </div>
                <div className="rounded-[1.4rem] bg-white/[0.03] p-4 text-sm leading-7 text-white/64">
                  The proof console matters because it shows the judge where storage, encryption, policy, and payment state meet in one place.
                </div>
              </div>
            </div>
          </GlassPanel>
        </div>

        <GlassPanel className="p-8">
          <div className="mb-8 flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-white/[0.04] text-[#ffcf7c]">
              <Layers3 size={18} />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">Creator form</p>
              <p className="mt-1 text-lg font-semibold text-white">Upload, price, and publish.</p>
            </div>
          </div>

          <AccessFiCreateVaultForm integrationStatus={integrationStatus} />

          <div className="mt-8 rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck size={16} className="text-[#6bf4d3]" />
              <p className="text-sm leading-7 text-white/62">
                Real SDK hooks are already wired for Flow, Lit, Storacha/Filecoin, and NEAR. Missing credentials downgrade cleanly instead of breaking the demo path.
              </p>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
