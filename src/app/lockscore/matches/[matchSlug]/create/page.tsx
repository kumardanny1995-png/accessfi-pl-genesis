import Link from "next/link";
import { notFound } from "next/navigation";

import { CreateChallengeForm } from "@/components/challenge/create-challenge-form";
import { Button } from "@/components/shared/button";
import { Panel } from "@/components/shared/panel";
import { createChallengeAction } from "@/lib/actions/public";
import { getGroupBySlug } from "@/lib/data/groups";
import { getMatchCreateContext } from "@/lib/data/challenges";
import { getGuestContext } from "@/lib/utils/guest";
import { lockscorePath } from "@/lib/utils/lockscore-routes";

function firstValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] : null;
}

export default async function CreateChallengePage({
  params,
  searchParams
}: {
  params: Promise<{ matchSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { matchSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const groupSlug = firstValue(resolvedSearchParams.groupSlug);
  const { guestName } = await getGuestContext();
  const data = await getMatchCreateContext(matchSlug);
  const group = groupSlug ? await getGroupBySlug(groupSlug) : null;

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/42">Create Challenge</p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-[0.04em] text-cream">{data.match.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68">
            Lock the five calls before the match starts, then share one link and let the counter-picks come in.
          </p>
        </div>
        <Link href={lockscorePath(`/matches/${data.match.slug}`)}>
          <Button variant="ghost">Back To Match</Button>
        </Link>
      </div>

      <Panel>
        <p className="text-sm leading-7 text-white/68">
          {group
            ? `This board will post into ${group.name} and feed its season standings.`
            : "This is a public board by default. Add a group context from a league or room to feed season tables."}
        </p>
      </Panel>

      <CreateChallengeForm
        match={data.match}
        questions={data.questions}
        guestName={guestName}
        group={group}
        action={createChallengeAction}
      />
    </div>
  );
}
