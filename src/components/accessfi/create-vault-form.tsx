"use client";

import { useActionState, useState } from "react";

import { SubmitButton } from "@/components/shared/submit-button";
import { Input } from "@/components/shared/input";
import { Select } from "@/components/shared/select";
import { Textarea } from "@/components/shared/textarea";
import { createAccessFiVaultAction } from "@/lib/accessfi/actions";
import type { AccessFiIntegrationRailStatus } from "@/lib/accessfi/types";
import type { ActionState } from "@/lib/db/types";

const initialState: ActionState = {
  ok: false
};

const accessTypeOptions = [
  { value: "deposit_to_unlock", label: "Deposit to Unlock" },
  { value: "subscription_access", label: "Subscription Access" },
  { value: "token_gated_access", label: "Token-Gated Access" },
  { value: "allowlist_access", label: "Allowlist Access" },
  { value: "time_based_access", label: "Time-Based Access" }
] as const;

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return <p className="text-sm text-[#ff9a95]">{errors[0]}</p>;
}

export function AccessFiCreateVaultForm({
  integrationStatus
}: {
  integrationStatus: AccessFiIntegrationRailStatus[];
}) {
  const [accessType, setAccessType] = useState<(typeof accessTypeOptions)[number]["value"]>("deposit_to_unlock");
  const [state, formAction] = useActionState(createAccessFiVaultAction, initialState);

  return (
    <form action={formAction} className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">Vault Title</label>
          <Input name="title" placeholder="BTC Research Club" />
          <FieldError errors={state.fieldErrors?.title} />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">Asset Title</label>
          <Input name="assetTitle" placeholder="Sunday Macro Memo" />
          <FieldError errors={state.fieldErrors?.assetTitle} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">Teaser</label>
        <Textarea name="teaser" placeholder="Deposit-backed access to weekly BTC memos, dashboards, and private operator briefings." />
        <FieldError errors={state.fieldErrors?.teaser} />
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">Description</label>
        <Textarea
          name="description"
          placeholder="Explain exactly what members unlock, how the reserve works, and why this vault spreads through referrals."
        />
        <FieldError errors={state.fieldErrors?.description} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">Access Type</label>
          <Select name="accessType" value={accessType} onChange={(event) => setAccessType(event.target.value as typeof accessType)}>
            {accessTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">Deposit Amount</label>
          <Input name="depositAmount" type="number" min="0" step="0.01" placeholder="150" />
          <FieldError errors={state.fieldErrors?.depositAmount} />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">Subscription Amount</label>
          <Input name="subscriptionAmount" type="number" min="0" step="0.01" placeholder="12" />
          <FieldError errors={state.fieldErrors?.subscriptionAmount} />
        </div>
      </div>

      {accessType === "allowlist_access" ? (
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">Allowlist</label>
          <Textarea
            name="allowlistIdentifiers"
            placeholder={"member@example.com\nfounders.fund"}
            className="min-h-36"
          />
          <p className="text-sm text-white/48">One email or domain per line.</p>
        </div>
      ) : null}

      {accessType === "token_gated_access" ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">Token Symbol</label>
            <Input name="tokenSymbol" placeholder="VECTOR" />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">Token Contract</label>
            <Input name="tokenContract" placeholder="0x..." />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">Minimum Balance</label>
            <Input name="minimumTokenBalance" placeholder="250" />
          </div>
        </div>
      ) : null}

      {accessType === "time_based_access" ? (
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">Time Limit Hours</label>
          <Input name="timeLimitHours" type="number" min="1" step="1" placeholder="72" />
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">Premium Asset</label>
        <input
          name="assetFile"
          type="file"
          className="w-full rounded-[1.4rem] border border-dashed border-white/14 bg-white/[0.04] px-4 py-5 text-sm text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-white/8 file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.18em] file:text-white/70"
          required
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {integrationStatus.map((item) => (
          <div key={item.key} className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">{item.label}</p>
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/48">{item.mode}</span>
            </div>
            <p className="mt-2 text-sm leading-7 text-white/58">{item.details[0]}</p>
          </div>
        ))}
      </div>

      {state.message && !state.ok ? (
        <p className="rounded-[1.4rem] border border-[#ff716c]/20 bg-[#ff716c]/10 px-4 py-3 text-sm text-[#ff9a95]">{state.message}</p>
      ) : null}

      <SubmitButton pendingLabel="Publishing vault...">Publish Vault</SubmitButton>
    </form>
  );
}
