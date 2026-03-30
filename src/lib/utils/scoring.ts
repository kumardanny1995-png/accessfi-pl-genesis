import type {
  ChallengeParticipantView,
  OpinionQuestion,
  OutcomeAnswerView,
  ParticipantPredictionView,
  PredictionQuestion
} from "@/lib/db/types";

export function computeOpinionBoard(
  questions: PredictionQuestion[],
  participants: ChallengeParticipantView[]
): OpinionQuestion[] {
  return questions.map((question) => {
    const votes = participants
      .map((participant) => participant.predictions.find((prediction) => prediction.questionId === question.id))
      .filter((prediction): prediction is ParticipantPredictionView => Boolean(prediction?.optionId));

    const totalVotes = votes.length;
    const counts = new Map<string, number>();

    for (const vote of votes) {
      counts.set(vote.optionId!, (counts.get(vote.optionId!) ?? 0) + 1);
    }

    const minCount = totalVotes > 0 ? Math.min(...counts.values()) : 0;

    return {
      questionId: question.id,
      prompt: question.prompt,
      options: question.options.map((option) => {
        const count = counts.get(option.id) ?? 0;

        return {
          optionId: option.id,
          label: option.label,
          count,
          percentage: totalVotes === 0 ? 0 : (count / totalVotes) * 100,
          contrarian: count > 0 && count === minCount,
          loneWolf: count === 1
        };
      })
    };
  });
}

export function outcomeMap(outcomes: OutcomeAnswerView[]) {
  return new Map(outcomes.map((outcome) => [outcome.questionId, outcome.optionId]));
}

export function applyOutcomeState(
  participants: ChallengeParticipantView[],
  outcomes: OutcomeAnswerView[]
): ChallengeParticipantView[] {
  const answers = outcomeMap(outcomes);

  return participants.map((participant) => {
    const predictions = participant.predictions.map((prediction) => {
      const correctOptionId = answers.get(prediction.questionId) ?? null;
      const isCorrect = correctOptionId ? prediction.optionId === correctOptionId : null;

      return {
        ...prediction,
        isCorrect,
        pointsAwarded: isCorrect ? 1 : 0
      };
    });

    return {
      ...participant,
      predictions,
      totalPoints: predictions.reduce((sum, prediction) => sum + prediction.pointsAwarded, 0)
    };
  });
}
