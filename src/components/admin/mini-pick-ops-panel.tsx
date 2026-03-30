"use client";

import { useActionState } from "react";

import { Panel } from "@/components/shared/panel";
import { Input } from "@/components/shared/input";
import { Select } from "@/components/shared/select";
import { StatusPill } from "@/components/shared/status-pill";
import { SubmitButton } from "@/components/shared/submit-button";
import { Textarea } from "@/components/shared/textarea";
import type { ActionState, MiniPickWindowView, SportKey } from "@/lib/db/types";

const initialState: ActionState = { ok: true };

const templateOptionsBySport: Record<string, Array<{ value: string; label: string }>> = {
  cricket: [
    { value: "next_over_runs", label: "Next Over Runs" },
    { value: "wicket_next_over", label: "Wicket Radar" },
    { value: "next_boundary_side", label: "Next Boundary Side" },
    { value: "powerplay_score_range", label: "Powerplay Score Range" }
  ],
  football: [
    { value: "next_goal_team", label: "Next Goal Team" },
    { value: "next_corner_team", label: "Next Corner Team" },
    { value: "next_booking_team", label: "Next Booking Team" }
  ],
  formula1: [
    { value: "safety_car_window", label: "Safety Car Window" },
    { value: "next_pit_team", label: "Next Pit Stop" },
    { value: "podium_shakeup", label: "Podium Shakeup" }
  ],
  basketball: [
    { value: "next_scoring_team", label: "Next Scoring Team" },
    { value: "next_scoring_play", label: "Next Scoring Play" },
    { value: "next_three_team", label: "Next Three Team" }
  ]
};

function toLocalInputValue(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function MiniPickSettleForm({
  window,
  action
}: {
  window: MiniPickWindowView;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
      <input type="hidden" name="windowId" value={window.id} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Live Window</p>
          <h3 className="mt-2 text-xl font-black uppercase tracking-[0.04em] text-cream">{window.title}</h3>
          <p className="mt-2 text-sm text-white/66">{window.prompt}</p>
        </div>
        <StatusPill tone={window.status === "settled" ? "settled" : window.status} label={window.status} />
      </div>
      <div className="grid gap-3">
        {window.options.map((option) => (
          <label key={option.id} className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-4">
            <input
              type="radio"
              name={`mini_pick_outcome_${window.id}`}
              value={option.id}
              defaultChecked={window.outcomeOptionId === option.id}
              className="size-4 accent-[#23d18b]"
              required
            />
            <span className="text-sm font-semibold uppercase tracking-[0.12em] text-white">{option.label}</span>
          </label>
        ))}
      </div>
      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Resolution Note</span>
        <Textarea name="resolutionNote" placeholder="Boundary off the third ball, settled from manual scorer note." defaultValue={window.resolutionNote ?? ""} />
      </label>
      {state.message ? (
        <p className={state.ok ? "text-sm text-signal-green" : "text-sm text-red-200"}>{state.message}</p>
      ) : null}
      <SubmitButton pendingLabel="Settling live board...">Settle Live Window</SubmitButton>
    </form>
  );
}

export function MiniPickOpsPanel({
  matchId,
  sportKey,
  windows,
  createAction,
  settleAction
}: {
  matchId: string;
  sportKey: SportKey | string;
  windows: MiniPickWindowView[];
  createAction: (state: ActionState, formData: FormData) => Promise<ActionState>;
  settleAction: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [createState, createFormAction] = useActionState(createAction, initialState);
  const templates = templateOptionsBySport[sportKey] ?? templateOptionsBySport.cricket;
  const now = new Date();
  const defaultOpen = toLocalInputValue(now);
  const defaultLock = toLocalInputValue(new Date(now.getTime() + 10 * 60 * 1000));

  return (
    <Panel className="space-y-5">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/42">Live Mini Picks</p>
        <h2 className="text-2xl font-black uppercase tracking-[0.04em] text-cream">Launch quick crowd calls during the match</h2>
        <p className="text-sm leading-7 text-white/68">
          Use sport templates to open a fast side board, then settle it once the moment passes.
        </p>
      </div>

      <form action={createFormAction} className="grid gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
        <input type="hidden" name="matchId" value={matchId} />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Template</span>
            <Select name="templateKey" defaultValue={templates[0]?.value}>
              {templates.map((template) => (
                <option key={template.value} value={template.value}>
                  {template.label}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Social Stake</span>
            <Input name="stakeText" placeholder="Loser posts the apology meme" />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Opens At</span>
            <Input name="opensAt" type="datetime-local" defaultValue={defaultOpen} />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Locks At</span>
            <Input name="lockAt" type="datetime-local" defaultValue={defaultLock} />
          </label>
        </div>
        {createState.message ? (
          <p className={createState.ok ? "text-sm text-signal-green" : "text-sm text-red-200"}>{createState.message}</p>
        ) : null}
        <SubmitButton pendingLabel="Launching mini-pick...">Launch Live Mini-Pick</SubmitButton>
      </form>

      <div className="space-y-4">
        {windows.length > 0 ? (
          windows.map((window) => <MiniPickSettleForm key={window.id} window={window} action={settleAction} />)
        ) : (
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 text-sm text-white/66">
            No live mini-picks on this match yet. Launch one when the live moment is worth calling out.
          </div>
        )}
      </div>
    </Panel>
  );
}
