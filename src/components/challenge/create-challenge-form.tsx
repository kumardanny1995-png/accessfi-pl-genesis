"use client";

import { useActionState } from "react";

import { Panel } from "@/components/shared/panel";
import { Input } from "@/components/shared/input";
import { SubmitButton } from "@/components/shared/submit-button";
import { Textarea } from "@/components/shared/textarea";
import type { ActionState, GroupSummary, MatchSummary, PredictionQuestion } from "@/lib/db/types";

const initialState: ActionState = { ok: true };

type CreateChallengeFormProps = {
  match: MatchSummary;
  questions: PredictionQuestion[];
  guestName?: string | null;
  group?: GroupSummary | null;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
};

export function CreateChallengeForm({ match, questions, guestName, group, action }: CreateChallengeFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="matchId" value={match.id} />
      {group ? <input type="hidden" name="groupId" value={group.id} /> : null}
      <Panel className="space-y-4">
        {group ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Posting Into</p>
            <p className="mt-2 text-lg font-black uppercase tracking-[0.04em] text-cream">{group.name}</p>
            <p className="mt-2 text-sm text-white/62">
              {group.punishmentTemplate ?? group.stakeTemplate ?? "This board will feed the group standings."}
            </p>
          </div>
        ) : null}
        <div className="grid gap-4">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Your Name</span>
            <Input name="creatorName" placeholder="Aakash" defaultValue={guestName ?? ""} required />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Challenge Title</span>
            <Input
              name="challengeTitle"
              placeholder={`${match.title} faceoff`}
              defaultValue={`${match.title} faceoff`}
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Social Stake</span>
            <Input name="stakeText" placeholder="Loser owes biryani" />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Share Message</span>
            <Textarea
              name="shareMessage"
              placeholder="I’ve locked mine. Take the counter-picks if you dare."
            />
          </label>
        </div>
      </Panel>

      {questions.map((question) => (
        <Panel key={question.id} className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/42">
              Pick {question.sortOrder}
            </p>
            <h3 className="mt-2 text-xl font-black uppercase tracking-[0.04em] text-cream">{question.prompt}</h3>
            {question.description ? <p className="mt-1 text-sm text-white/62">{question.description}</p> : null}
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
                  className="size-4 accent-[#ff9d2f]"
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

      <SubmitButton pendingLabel="Locking picks...">Create Challenge Link</SubmitButton>
    </form>
  );
}
