import "server-only";

import { getSupabaseAdmin } from "@/lib/db/supabase";
import { completeSettlementPostProcessing } from "@/lib/services/engagement";

type ResolvedOutcomeInput = {
  questionId: string;
  optionId: string;
};

type SettlementSource = {
  providerKey?: string | null;
  summary?: string | null;
};

export async function settleMatchWithResolvedAnswers(args: {
  matchId: string;
  notes?: string | null;
  selectedOutcomes: ResolvedOutcomeInput[];
  source?: SettlementSource;
}) {
  const supabase = getSupabaseAdmin();
  const { data: questionRows, error: questionError } = await supabase
    .from("prediction_questions")
    .select("id")
    .eq("match_id", args.matchId);

  if (questionError) {
    throw questionError;
  }

  const questionCount = questionRows?.length ?? 0;
  if (questionCount === 0) {
    throw new Error("This match has no prediction questions.");
  }

  if (args.selectedOutcomes.length !== questionCount) {
    throw new Error("Settlement answers do not cover every question.");
  }

  const { data: matchOutcome, error: outcomeError } = await supabase
    .from("match_outcomes")
    .upsert(
      {
        match_id: args.matchId,
        notes: args.notes || null,
        settled_at: new Date().toISOString()
      },
      { onConflict: "match_id" }
    )
    .select("id")
    .single();

  if (outcomeError) {
    throw outcomeError;
  }

  const { error: deleteOutcomeError } = await supabase
    .from("match_outcome_answers")
    .delete()
    .eq("match_outcome_id", matchOutcome.id);

  if (deleteOutcomeError) {
    throw deleteOutcomeError;
  }

  const { error: answerError } = await supabase.from("match_outcome_answers").insert(
    args.selectedOutcomes.map((answer) => ({
      match_outcome_id: matchOutcome.id,
      question_id: answer.questionId,
      resolved_option_id: answer.optionId
    }))
  );

  if (answerError) {
    throw answerError;
  }

  const { data: challenges, error: challengeError } = await supabase
    .from("challenges")
    .select("id, slug")
    .eq("match_id", args.matchId);

  if (challengeError) {
    throw challengeError;
  }

  const outcomeMap = new Map(args.selectedOutcomes.map((answer) => [answer.questionId, answer.optionId]));

  for (const challenge of challenges ?? []) {
    const { data: participants, error: participantError } = await supabase
      .from("challenge_participants")
      .select("id")
      .eq("challenge_id", challenge.id);

    if (participantError) {
      throw participantError;
    }

    const participantIds = (participants ?? []).map((participant) => participant.id);
    if (participantIds.length === 0) {
      continue;
    }

    const { data: predictions, error: predictionError } = await supabase
      .from("participant_predictions")
      .select("id, participant_id, question_id, selected_option_id")
      .in("participant_id", participantIds);

    if (predictionError) {
      throw predictionError;
    }

    const scoreEntries = new Map<string, number>();

    for (const prediction of predictions ?? []) {
      const isCorrect = outcomeMap.get(prediction.question_id) === prediction.selected_option_id;
      scoreEntries.set(
        prediction.participant_id,
        (scoreEntries.get(prediction.participant_id) ?? 0) + (isCorrect ? 1 : 0)
      );

      const { error: predictionUpdateError } = await supabase
        .from("participant_predictions")
        .update({
          is_correct: isCorrect,
          points_awarded: isCorrect ? 1 : 0
        })
        .eq("id", prediction.id);

      if (predictionUpdateError) {
        throw predictionUpdateError;
      }
    }

    const ranked = [...scoreEntries.entries()].sort((left, right) => right[1] - left[1]);
    let currentRank = 0;
    let previousScore: number | null = null;

    for (const [index, [participantId, totalPoints]] of ranked.entries()) {
      if (previousScore !== totalPoints) {
        currentRank = index + 1;
        previousScore = totalPoints;
      }

      const scorePayload = {
        challenge_id: challenge.id,
        participant_id: participantId,
        correct_count: totalPoints,
        total_points: totalPoints,
        accuracy_pct: questionCount ? (totalPoints / questionCount) * 100 : 0,
        result_rank: currentRank,
        calculated_at: new Date().toISOString()
      };

      const [{ error: scoreError }, { error: participantUpdateError }] = await Promise.all([
        supabase.from("challenge_scores").upsert(scorePayload, { onConflict: "challenge_id,participant_id" }),
        supabase
          .from("challenge_participants")
          .update({ total_points: totalPoints, rank: currentRank })
          .eq("id", participantId)
      ]);

      if (scoreError || participantUpdateError) {
        throw scoreError ?? participantUpdateError;
      }
    }

    const { error: challengeStatusError } = await supabase
      .from("challenges")
      .update({ status: "settled" })
      .eq("id", challenge.id);

    if (challengeStatusError) {
      throw challengeStatusError;
    }

    await completeSettlementPostProcessing(challenge.id, challenge.slug);
  }

  const { error: matchUpdateError } = await supabase
    .from("matches")
    .update({
      settlement_status: "settled",
      status: "completed"
    })
    .eq("id", args.matchId);

  if (matchUpdateError) {
    throw matchUpdateError;
  }

  if (args.source?.providerKey && args.source.providerKey !== "manual") {
    const { error: syncStateError } = await supabase
      .from("event_sync_state")
      .update({
        sync_status: "auto_settled",
        last_auto_settled_at: new Date().toISOString(),
        last_error: null
      })
      .eq("match_id", args.matchId);

    if (syncStateError) {
      throw syncStateError;
    }
  }

  return {
    questionCount,
    challengeCount: challenges?.length ?? 0
  };
}
