import { notFound } from "next/navigation";

import { MiniPickOpsPanel } from "@/components/admin/mini-pick-ops-panel";
import { SettlementForm } from "@/components/admin/settlement-form";
import {
  createMiniPickWindowAction,
  settleMatchAction,
  settleMiniPickWindowAction
} from "@/lib/actions/admin";
import { getAdminMatch } from "@/lib/data/admin";
import { requireAdminSession } from "@/lib/utils/admin";

export default async function LockScoreSettleMatchPage({
  params
}: {
  params: Promise<{ matchId: string }>;
}) {
  await requireAdminSession();
  const { matchId } = await params;
  const data = await getAdminMatch(matchId);

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/42">Admin Settlement</p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-[0.04em] text-cream">{data.match.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68">
          Settle the main board, launch or resolve live mini-picks, and let the standings and badges recompute automatically.
        </p>
      </div>

      <SettlementForm
        match={data.match}
        questions={data.questions}
        outcomes={data.outcomes}
        action={settleMatchAction}
      />

      <MiniPickOpsPanel
        matchId={data.match.id}
        sportKey={data.match.sport.key}
        windows={data.miniPicks}
        createAction={createMiniPickWindowAction}
        settleAction={settleMiniPickWindowAction}
      />
    </div>
  );
}
