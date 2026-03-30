import Link from "next/link";
import { notFound } from "next/navigation";

import { EditMatchForm } from "@/components/admin/edit-match-form";
import { MatchSyncPanel } from "@/components/admin/match-sync-panel";
import { Button } from "@/components/shared/button";
import { updateMatchAction, syncMatchProviderAction, autoSettleMatchProviderAction } from "@/lib/actions/admin";
import { getAdminMatch } from "@/lib/data/admin";
import { requireAdminSession } from "@/lib/utils/admin";
import { lockscorePath } from "@/lib/utils/lockscore-routes";

export default async function LockScoreEditMatchPage({
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/42">Admin Match Edit</p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-[0.04em] text-cream">{data.match.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68">
            Update match metadata, question copy, and provider sync settings without breaking the existing challenge lifecycle.
          </p>
        </div>
        <Link href={lockscorePath(`/admin/matches/${data.match.id}/settle`)}>
          <Button variant="ghost">Go To Settlement</Button>
        </Link>
      </div>

      <MatchSyncPanel
        match={data.match}
        syncState={data.syncState}
        recentSyncRuns={data.recentSyncRuns}
        syncAction={syncMatchProviderAction}
        autoSettleAction={autoSettleMatchProviderAction}
      />

      <EditMatchForm
        match={data.match}
        questions={data.questions}
        syncState={data.syncState}
        action={updateMatchAction}
      />
    </div>
  );
}
