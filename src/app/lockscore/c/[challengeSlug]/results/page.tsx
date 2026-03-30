import { notFound } from "next/navigation";

import { AiCopyStack } from "@/components/challenge/ai-copy-stack";
import { Leaderboard } from "@/components/challenge/leaderboard";
import { ResultsBreakdown } from "@/components/challenge/results-breakdown";
import { ShareActions } from "@/components/shared/share-actions";
import { EmptyState } from "@/components/shared/empty-state";
import { Panel } from "@/components/shared/panel";
import { getChallengePageData } from "@/lib/data/challenges";
import { getChallengeAiBundle } from "@/lib/services/recaps";
import { buildResultsShareText, getResultsUrl } from "@/lib/utils/share";

export default async function ChallengeResultsPage({
  params
}: {
  params: Promise<{ challengeSlug: string }>;
}) {
  const { challengeSlug } = await params;
  const data = await getChallengePageData(challengeSlug);

  if (!data) {
    notFound();
  }

  if (data.outcomes.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/42">Results</p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-[0.04em] text-cream">{data.challenge.title}</h1>
        </div>
        <EmptyState
          title="Settlement still pending"
          description="Admin or provider sync has not settled this board yet."
        />
      </div>
    );
  }

  const ai = await getChallengeAiBundle(data, "results");
  const aiItems = [ai.postMatchRecap, ai.rivalrySummary, ai.trashTalk].flatMap((item) => (item ? [item] : []));
  const shareText =
    ai.trashTalk?.shareLine ??
    ai.postMatchRecap?.shareLine ??
    ai.rivalrySummary?.shareLine ??
    buildResultsShareText(data);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/42">Settled Results</p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-[0.04em] text-cream">{data.challenge.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68">
          Row-by-row reveal, final leaderboard, and the share card for the group chat aftermath.
        </p>
      </div>

      <Panel className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">{data.match.competitionName}</p>
            <p className="mt-2 text-2xl font-black uppercase tracking-[0.04em] text-cream">{data.match.title}</p>
            <p className="mt-2 text-sm text-white/62">{data.challenge.stakeText ?? "Bragging rights"}</p>
          </div>
          <div className="w-full max-w-md">
            <ShareActions
              challengeId={data.challenge.id}
              challengeSlug={data.challenge.slug}
              text={shareText}
              url={getResultsUrl(data.challenge.slug)}
              stage="results"
            />
          </div>
        </div>
      </Panel>

      <AiCopyStack eyebrow="AI Recap" title="Post-match receipts" items={aiItems} />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Row By Row</p>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.04em] text-cream">Green if it landed, red if it didn’t</h2>
          </div>
          <ResultsBreakdown questions={data.questions} participants={data.participants} outcomes={data.outcomes} />
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Leaderboard</p>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.04em] text-cream">Who took the board</h2>
          </div>
          <Leaderboard participants={data.participants} />
        </section>
      </div>
    </div>
  );
}
