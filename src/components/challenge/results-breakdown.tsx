import { CheckCircle2, XCircle } from "lucide-react";

import { Panel } from "@/components/shared/panel";
import type { ChallengeParticipantView, OutcomeAnswerView, PredictionQuestion } from "@/lib/db/types";
import { cn } from "@/lib/utils/cn";

export function ResultsBreakdown({
  questions,
  participants,
  outcomes
}: {
  questions: PredictionQuestion[];
  participants: ChallengeParticipantView[];
  outcomes: OutcomeAnswerView[];
}) {
  const outcomeMap = new Map(outcomes.map((outcome) => [outcome.questionId, outcome.optionLabel]));

  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <Panel key={question.id} className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/42">
                Reveal {index + 1}
              </p>
              <h3 className="mt-2 text-lg font-black uppercase tracking-[0.04em] text-cream">{question.prompt}</h3>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Actual</p>
              <p className="mt-1 text-sm font-semibold uppercase tracking-[0.12em] text-signal-green">
                {outcomeMap.get(question.id) ?? "Pending"}
              </p>
            </div>
          </div>
          <div className="grid gap-3">
            {participants.map((participant) => {
              const prediction = participant.predictions.find((entry) => entry.questionId === question.id);

              return (
                <div
                  key={`${participant.id}-${question.id}`}
                  className={cn(
                    "flex items-center justify-between gap-4 rounded-3xl border px-4 py-4",
                    prediction?.isCorrect
                      ? "border-signal-green/30 bg-signal-green/10"
                      : "border-signal-red/20 bg-signal-red/8"
                  )}
                >
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">
                      {participant.displayName}
                    </p>
                    <p className="mt-1 text-sm font-semibold uppercase tracking-[0.12em] text-white">
                      {prediction?.optionLabel ?? "No pick"}
                    </p>
                  </div>
                  {prediction?.isCorrect ? (
                    <CheckCircle2 className="text-signal-green" size={20} />
                  ) : (
                    <XCircle className="text-signal-red" size={20} />
                  )}
                </div>
              );
            })}
          </div>
        </Panel>
      ))}
    </div>
  );
}
