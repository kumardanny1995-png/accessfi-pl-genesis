"use client";

import { useActionState } from "react";

import { Input } from "@/components/shared/input";
import { Panel } from "@/components/shared/panel";
import { Select } from "@/components/shared/select";
import { SubmitButton } from "@/components/shared/submit-button";
import type { ActionState, EventSyncStateView, MatchSummary, PredictionQuestion } from "@/lib/db/types";

const initialState: ActionState = { ok: true };

export function EditMatchForm({
  match,
  questions,
  syncState,
  action
}: {
  match: MatchSummary;
  questions: PredictionQuestion[];
  syncState: EventSyncStateView | null;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="matchId" value={match.id} />
      <input type="hidden" name="predictionTemplateKey" value={match.predictionTemplateKey} />
      <Panel className="grid gap-4">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Title</span>
          <Input name="title" defaultValue={match.title} required />
        </label>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Question Template</p>
          <p className="mt-2 text-lg font-black uppercase tracking-[0.04em] text-cream">
            {match.predictionTemplateKey === "provider_ready" ? "Provider-ready board" : "Classic social board"}
          </p>
          <p className="mt-2 text-sm text-white/62">
            Template changes are intentionally locked after creation so question keys stay stable for challenge links and settlement.
          </p>
        </div>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Competition</span>
          <Input name="competitionName" defaultValue={match.competitionName} required />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Venue</span>
          <Input name="venue" defaultValue={match.venue ?? ""} required />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Start Time</span>
            <Input
              name="startTime"
              type="datetime-local"
              defaultValue={match.startTime.slice(0, 16)}
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Lock Time</span>
            <Input
              name="lockTime"
              type="datetime-local"
              defaultValue={match.lockTime.slice(0, 16)}
              required
            />
          </label>
        </div>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Status</span>
          <Select name="status" defaultValue={match.status}>
            <option value="scheduled">Scheduled</option>
            <option value="locked">Locked</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Provider</span>
          <Select name="providerKey" defaultValue={syncState?.providerKey ?? "manual"}>
            <option value="manual">Manual only</option>
            <option value="thesportsdb">TheSportsDB</option>
          </Select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Provider Event ID</span>
          <Input name="externalEventId" defaultValue={syncState?.externalEventId ?? ""} placeholder="1854457" />
        </label>
        <label className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-4">
          <input
            type="checkbox"
            name="autoSettleSupported"
            defaultChecked={syncState?.autoSettleSupported ?? false}
            className="size-4 accent-[#23d18b]"
          />
          <span className="text-sm font-semibold uppercase tracking-[0.12em] text-white">
            Auto-settle from provider when possible
          </span>
        </label>
      </Panel>

      {questions.map((question) => (
        <Panel key={question.id} className="space-y-4">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Question Prompt</span>
            <Input name={`question_${question.id}_prompt`} defaultValue={question.prompt} required />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Question Description</span>
            <Input
              name={`question_${question.id}_description`}
              defaultValue={question.description ?? ""}
              placeholder="Optional"
            />
          </label>
          <div className="grid gap-3">
            {question.options.map((option) => (
              <div key={option.id} className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Label</span>
                  <Input
                    name={`question_${question.id}_option_${option.id}_label`}
                    defaultValue={option.label}
                    required
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Value</span>
                  <Input
                    name={`question_${question.id}_option_${option.id}_value`}
                    defaultValue={option.value}
                    required
                  />
                </label>
              </div>
            ))}
          </div>
        </Panel>
      ))}

      {state.message ? (
        <p className={state.ok ? "text-sm text-signal-green" : "text-sm text-red-200"}>{state.message}</p>
      ) : null}

      <SubmitButton pendingLabel="Saving match...">Save Match Config</SubmitButton>
    </form>
  );
}
