"use client";

import { useActionState } from "react";

import { Input } from "@/components/shared/input";
import { Panel } from "@/components/shared/panel";
import { Select } from "@/components/shared/select";
import { SubmitButton } from "@/components/shared/submit-button";
import { Textarea } from "@/components/shared/textarea";
import type { ActionState } from "@/lib/db/types";

const initialState: ActionState = { ok: true };

export function CreateGroupForm({
  action,
  guestName
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  guestName?: string | null;
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <Panel className="grid gap-4">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Your Name</span>
          <Input name="displayName" defaultValue={guestName ?? ""} placeholder="Aman" required />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Group Name</span>
          <Input name="name" placeholder="Friday Biryani League" required />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Type</span>
            <Select name="groupType" defaultValue="office">
              <option value="office">Office League</option>
              <option value="college">College League</option>
              <option value="creator">Creator Room</option>
              <option value="community">Community Group</option>
              <option value="private">Private Group</option>
            </Select>
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Visibility</span>
            <Select name="visibility" defaultValue="invite_only">
              <option value="invite_only">Invite only</option>
              <option value="public">Public discovery</option>
              <option value="private">Private</option>
            </Select>
          </label>
        </div>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Sport</span>
          <Select name="sportKey" defaultValue="cricket">
            <option value="cricket">Cricket / IPL</option>
            <option value="football">Football</option>
            <option value="formula1">Formula 1</option>
            <option value="basketball">Basketball</option>
          </Select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Headline</span>
          <Input name="headline" placeholder="Every wrong call gets remembered on Monday." />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Description</span>
          <Textarea name="description" placeholder="Office season table for the IPL run-in." />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Stake Copy</span>
            <Input name="stakeTemplate" placeholder="Winner gets Monday bragging rights" />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Punishment Copy</span>
            <Input name="punishmentTemplate" placeholder="Loser owes chai" />
          </label>
        </div>
      </Panel>

      {state.message ? (
        <p className={state.ok ? "text-sm text-signal-green" : "text-sm text-red-200"}>{state.message}</p>
      ) : null}

      <SubmitButton pendingLabel="Creating group...">Create Group</SubmitButton>
    </form>
  );
}
