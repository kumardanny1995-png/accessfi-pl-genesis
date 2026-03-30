"use client";

import { useActionState } from "react";

import { Input } from "@/components/shared/input";
import { Panel } from "@/components/shared/panel";
import { SubmitButton } from "@/components/shared/submit-button";
import type { ActionState, PredictionQuestion } from "@/lib/db/types";

const initialState: ActionState = { ok: true };

export function JoinChallengeForm({
  challengeSlug,
  guestName,
  questions,
  action
}: {
  challengeSlug: string;
  guestName?: string | null;
  questions: PredictionQuestion[];
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="challengeSlug" value={challengeSlug} />
      <Panel className="space-y-4">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Your Name</span>
          <Input name="participantName" placeholder="Riya" defaultValue={guestName ?? ""} required />
        </label>
      </Panel>

      {questions.map((question) => (
        <Panel key={question.id} className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/42">
              Counter-Pick {question.sortOrder}
            </p>
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
                  name={`question_${question.id}`}
                  value={option.id}
                  className="size-4 accent-[#41a4ff]"
                  required
                />
                <span className="text-sm font-semibold uppercase tracking-[0.12em] text-white">{option.label}</span>
              </label>
            ))}
          </div>
        </Panel>
      ))}

      {state.message ? (
        <p className="rounded-2xl border border-signal-red/30 bg-signal-red/10 px-4 py-3 text-sm text-red-100">
          {state.message}
        </p>
      ) : null}

      <SubmitButton pendingLabel="Joining rivalry...">Join Challenge</SubmitButton>
    </form>
  );
}
