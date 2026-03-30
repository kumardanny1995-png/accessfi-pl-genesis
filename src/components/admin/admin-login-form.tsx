"use client";

import { useActionState } from "react";

import { Input } from "@/components/shared/input";
import { Panel } from "@/components/shared/panel";
import { SubmitButton } from "@/components/shared/submit-button";
import type { ActionState } from "@/lib/db/types";

const initialState: ActionState = { ok: true };

export function AdminLoginForm({
  action
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction}>
      <Panel className="space-y-4">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Admin Passcode</span>
          <Input name="passcode" type="password" placeholder="••••••••" required />
        </label>
        {state.message ? <p className="text-sm text-red-200">{state.message}</p> : null}
        <SubmitButton pendingLabel="Unlocking...">Enter Admin</SubmitButton>
      </Panel>
    </form>
  );
}
