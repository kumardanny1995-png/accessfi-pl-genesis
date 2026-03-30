import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AiCopyStack } from "@/components/challenge/ai-copy-stack";
import { ComparisonTable } from "@/components/challenge/comparison-table";
import { OpinionBoard } from "@/components/challenge/opinion-board";
import { ShareActions } from "@/components/shared/share-actions";
import { Button } from "@/components/shared/button";
import { Panel } from "@/components/shared/panel";
import { getChallengePageData } from "@/lib/data/challenges";
import { getChallengeAiBundle } from "@/lib/services/recaps";
import { buildChallengeShareText, getChallengeUrl } from "@/lib/utils/share";
import { lockscorePath } from "@/lib/utils/lockscore-routes";

function firstValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] : null;
}

export default async function ChallengeComparePage({
  params,
  searchParams
}: {
  params: Promise<{ challengeSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { challengeSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const viewerCode = firstValue(resolvedSearchParams.me);
  const data = await getChallengePageData(challengeSlug);

  if (!data) {
    notFound();
  }

  if (data.challenge.status === "settled" || data.outcomes.length > 0) {
    const suffix = viewerCode ? `?me=${encodeURIComponent(viewerCode)}` : "";
    redirect(lockscorePath(`/c/${data.challenge.slug}/results${suffix}`));
  }

  const ai = await getChallengeAiBundle(data, "compare");
  const shareText = ai.preMatchStoryline?.shareLine ?? buildChallengeShareText(data);
  const aiItems = ai.preMatchStoryline ? [ai.preMatchStoryline] : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/42">Compare Board</p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-[0.04em] text-cream">{data.challenge.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68">
            Locked picks, side-by-side. No deleted takes, no backtracking.
          </p>
        </div>
        <Link href={lockscorePath(`/c/${data.challenge.slug}`)}>
          <Button variant="ghost">Invite Rival</Button>
        </Link>
      </div>

      <Panel className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">{data.match.competitionName}</p>
            <p className="mt-2 text-2xl font-black uppercase tracking-[0.04em] text-cream">{data.match.title}</p>
            <p className="mt-2 text-sm text-white/62">
              {data.participants.length} participant{data.participants.length === 1 ? "" : "s"} · {data.challenge.stakeText ?? "Bragging rights"}
            </p>
          </div>
          <div className="w-full max-w-md">
            <ShareActions
              challengeId={data.challenge.id}
              challengeSlug={data.challenge.slug}
              text={shareText}
              url={getChallengeUrl(data.challenge.slug)}
              stage="pre_match"
            />
          </div>
        </div>
      </Panel>

      <AiCopyStack eyebrow="AI Storyline" title="Pre-match narrative" items={aiItems} />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Head To Head</p>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.04em] text-cream">Who picked what</h2>
          </div>
          <ComparisonTable questions={data.questions} participants={data.participants} viewerCode={viewerCode} />
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Opinion Split</p>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.04em] text-cream">Where the room is leaning</h2>
          </div>
          <OpinionBoard items={data.opinionBoard} />
        </section>
      </div>
    </div>
  );
}
