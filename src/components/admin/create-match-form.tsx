"use client";

import { useActionState } from "react";

import { Input } from "@/components/shared/input";
import { Panel } from "@/components/shared/panel";
import { Select } from "@/components/shared/select";
import { SubmitButton } from "@/components/shared/submit-button";
import type { ActionState } from "@/lib/db/types";

const initialState: ActionState = { ok: true };

export function CreateMatchForm({
  action
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <Panel className="grid gap-4">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Sport</span>
          <Select name="sportKey" defaultValue="cricket">
            <option value="cricket">Cricket</option>
            <option value="football">Football</option>
            <option value="formula1">Formula 1</option>
            <option value="basketball">Basketball</option>
          </Select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Question Template</span>
          <Select name="predictionTemplateKey" defaultValue="classic_social">
            <option value="classic_social">Classic social board</option>
            <option value="provider_ready">Provider-ready cricket board</option>
          </Select>
          <p className="text-sm text-white/56">
            Use provider-ready when you want cricket questions that can auto-settle from the final score feed.
          </p>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Provider</span>
          <Select name="providerKey" defaultValue="manual">
            <option value="manual">Manual only</option>
            <option value="thesportsdb">TheSportsDB</option>
          </Select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Provider Event ID</span>
          <Input name="externalEventId" placeholder="1854457" />
          <p className="text-sm text-white/56">
            Optional now. Add the external event ID if you want sync and auto-settlement later.
          </p>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Competition</span>
          <Input name="competitionName" placeholder="IPL 2026" required />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Venue</span>
          <Input name="venue" placeholder="Wankhede Stadium" required />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Team A</span>
            <Input name="teamAName" placeholder="Mumbai Indians" required />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Short</span>
            <Input name="teamAShortName" placeholder="MI" required />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Team B</span>
            <Input name="teamBName" placeholder="Chennai Super Kings" required />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Short</span>
            <Input name="teamBShortName" placeholder="CSK" required />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Start Time</span>
            <Input name="startTime" type="datetime-local" required />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Lock Time</span>
            <Input name="lockTime" type="datetime-local" required />
          </label>
        </div>
        {state.message ? <p className="text-sm text-red-200">{state.message}</p> : null}
      </Panel>
      <SubmitButton pendingLabel="Creating match...">Create Match</SubmitButton>
    </form>
  );
}
