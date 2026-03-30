"use client";

import { useActionState } from "react";

import { Input } from "@/components/shared/input";
import { SubmitButton } from "@/components/shared/submit-button";
import type { ActionState, MiniPickWindowView } from "@/lib/db/types";

const initialState: ActionState = { ok: true };

export function MiniPickSubmitForm({
  window,
  defaultName,
  action
}: {
  window: MiniPickWindowView;
  defaultName: string;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-[24px] border border-white/10 bg-white/5 p-4">
      <input type="hidden" name="windowId" value={window.id} />
      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Name</span>
        <Input name="displayName" placeholder="Your name" defaultValue={defaultName} />
      </label>
      <div className="grid gap-3">
        {window.options.map((option) => (
          <label
            key={option.id}
            className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/6 px-4 py-4"
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name={`mini_pick_${window.id}`}
                value={option.id}
                defaultChecked={window.viewerEntry?.optionId === option.id}
                className="size-4 accent-[#ff9d2f]"
                required
              />
              <span className="text-sm font-semibold uppercase tracking-[0.12em] text-white">{option.label}</span>
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/52">
              {option.percentage}% lean
            </span>
          </label>
        ))}
      </div>
      {state.message ? (
        <p className={state.ok ? "text-sm text-signal-green" : "text-sm text-red-200"}>{state.message}</p>
      ) : null}
      <SubmitButton pendingLabel="Locking live pick...">
        {window.viewerEntry ? "Update Live Pick" : "Lock Live Pick"}
      </SubmitButton>
    </form>
  );
}
