"use client";

import { useActionState } from "react";

import { Panel } from "@/components/shared/panel";
import { SubmitButton } from "@/components/shared/submit-button";
import { Textarea } from "@/components/shared/textarea";
import type { ActionState, MatchSummary, OutcomeAnswerView, PredictionQuestion } from "@/lib/db/types";

const initialState: ActionState = { ok: true };

export function SettlementForm({
  match,
  questions,
  outcomes,
  action
}: {
  match: MatchSummary;
  questions: PredictionQuestion[];
  outcomes: OutcomeAnswerView[];
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, initialState);
  const outcomeMap = new Map(outcomes.map((item) => [item.questionId, item.optionId]));

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="matchId" value={match.id} />
      {questions.map((question) => (
        <Panel key={question.id} className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Settled Answer</p>
            <h3 className="mt-2 text-xl font-black uppercase tracking-[0.04em] text-cream">{question.prompt}</h3>
          </div>
          <div className="grid gap-3">
            {question.options.map((option) => (
              <label
                key={option.id}
                className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-4"
              >
                <input
                  type="radio"
                  name={`outcome_${question.id}`}
                  value={option.id}
                  defaultChecked={outcomeMap.get(question.id) === option.id}
                  className="size-4 accent-[#23d18b]"
                  required
                />
                <span className="text-sm font-semibold uppercase tracking-[0.12em] text-white">{option.label}</span>
              </label>
            ))}
          </div>
        </Panel>
      ))}

      <Panel className="space-y-3">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Ops Notes</span>
          <Textarea name="notes" placeholder="Rain shortened innings, settled from official scorecard." />
        </label>
        <p className="text-sm text-white/56">
          Settlement updates every participant score and marks the challenge leaderboard final.
        </p>
      </Panel>

      {state.message ? (
        <p className={state.ok ? "text-sm text-signal-green" : "text-sm text-red-200"}>{state.message}</p>
      ) : null}

      <SubmitButton pendingLabel="Calculating scores...">Settle Match</SubmitButton>
    </form>
  );
}
