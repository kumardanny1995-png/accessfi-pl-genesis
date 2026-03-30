"use client";

import { useActionState } from "react";

import { Input } from "@/components/shared/input";
import { Panel } from "@/components/shared/panel";
import { SubmitButton } from "@/components/shared/submit-button";
import type { ActionState } from "@/lib/db/types";

const initialState: ActionState = { ok: true };

export function JoinGroupForm({
  action,
  guestName,
  inviteCode
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  guestName?: string | null;
  inviteCode?: string | null;
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <Panel className="grid gap-4">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Your Name</span>
          <Input name="displayName" defaultValue={guestName ?? ""} placeholder="Riya" required />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Invite Code</span>
          <Input name="inviteCode" defaultValue={inviteCode ?? ""} placeholder="a1b2c3d4" required />
        </label>
      </Panel>

      {state.message ? (
        <p className={state.ok ? "text-sm text-signal-green" : "text-sm text-red-200"}>{state.message}</p>
      ) : null}

      <SubmitButton pendingLabel="Joining group...">Join Group</SubmitButton>
    </form>
  );
}
