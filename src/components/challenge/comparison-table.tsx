import { Panel } from "@/components/shared/panel";
import type { ChallengeParticipantView, PredictionQuestion } from "@/lib/db/types";
import { cn } from "@/lib/utils/cn";

export function ComparisonTable({
  questions,
  participants,
  viewerCode
}: {
  questions: PredictionQuestion[];
  participants: ChallengeParticipantView[];
  viewerCode?: string | null;
}) {
  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <Panel key={question.id} className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/42">
                Pick {index + 1}
              </p>
              <h3 className="mt-2 text-lg font-black uppercase tracking-[0.04em] text-cream">{question.prompt}</h3>
            </div>
          </div>
          <div className="grid gap-3">
            {participants.map((participant) => {
              const prediction = participant.predictions.find((entry) => entry.questionId === question.id);

              return (
                <div
                  key={`${participant.id}-${question.id}`}
                  className={cn(
                    "rounded-3xl border px-4 py-4",
                    participant.publicCode === viewerCode
                      ? "border-signal-blue/35 bg-signal-blue/8"
                      : participant.isCreator
                        ? "border-signal-amber/28 bg-signal-amber/8"
                        : "border-white/10 bg-white/5"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">
                        {participant.isCreator ? "Creator" : participant.publicCode === viewerCode ? "You" : "Player"}
                      </p>
                      <p className="mt-1 text-lg font-black uppercase tracking-[0.04em] text-cream">
                        {participant.displayName}
                      </p>
                    </div>
                    <p className="text-sm font-semibold uppercase tracking-[0.12em] text-white/72">
                      {prediction?.optionLabel ?? "No pick"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      ))}
    </div>
  );
}
