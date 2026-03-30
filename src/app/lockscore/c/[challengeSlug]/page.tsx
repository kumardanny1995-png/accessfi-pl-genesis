import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { JoinChallengeForm } from "@/components/challenge/join-challenge-form";
import { Button } from "@/components/shared/button";
import { Panel } from "@/components/shared/panel";
import { joinChallengeAction } from "@/lib/actions/public";
import { getChallengePageData } from "@/lib/data/challenges";
import { getGuestContext } from "@/lib/utils/guest";
import { lockscorePath } from "@/lib/utils/lockscore-routes";

export default async function ChallengeJoinPage({
  params
}: {
  params: Promise<{ challengeSlug: string }>;
}) {
  const { challengeSlug } = await params;
  const { guestName } = await getGuestContext();
  const data = await getChallengePageData(challengeSlug);

  if (!data) {
    notFound();
  }

  if (data.challenge.status === "settled" || data.outcomes.length > 0) {
    redirect(lockscorePath(`/c/${data.challenge.slug}/results`));
  }

  const creator = data.participants.find((participant) => participant.isCreator)?.displayName ?? "Creator";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/42">Challenge Invite</p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-[0.04em] text-cream">{data.challenge.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68">
            {creator} locked their five calls on {data.match.title}. Counter-pick them before the board locks.
          </p>
        </div>
        <Link href={lockscorePath(`/c/${data.challenge.slug}/compare`)}>
          <Button variant="ghost">View Current Board</Button>
        </Link>
      </div>

      <Panel className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Stake</p>
        <p className="text-lg font-black uppercase tracking-[0.04em] text-cream">
          {data.challenge.stakeText ?? "Bragging rights"}
        </p>
        <p className="text-sm text-white/62">
          {data.participants.length} participant{data.participants.length === 1 ? "" : "s"} already on the board.
        </p>
      </Panel>

      {data.challenge.status === "open" ? (
        <JoinChallengeForm
          challengeSlug={data.challenge.slug}
          guestName={guestName}
          questions={data.questions}
          action={joinChallengeAction}
        />
      ) : (
        <Panel>
          <p className="text-sm leading-7 text-white/68">
            This board is locked already. Open the compare screen to watch the receipts play out.
          </p>
        </Panel>
      )}
    </div>
  );
}
