"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { Button } from "@/components/shared/button";
import { Input } from "@/components/shared/input";
import { Select } from "@/components/shared/select";
import { SubmitButton } from "@/components/shared/submit-button";
import { unlockAccessFiVaultAction } from "@/lib/accessfi/actions";
import type { AccessFiAccessType, AccessFiCheckoutProvider } from "@/lib/accessfi/types";
import { AccessFiFlowWalletCard } from "@/components/accessfi/flow-wallet-card";
import type { ActionState } from "@/lib/db/types";

const initialState: ActionState = {
  ok: false
};

export function AccessFiJoinVaultForm({
  vaultSlug,
  accessType,
  currency,
  depositAmount,
  subscriptionAmount,
  isLoggedIn
}: {
  vaultSlug: string;
  accessType: AccessFiAccessType;
  currency: string;
  depositAmount: number | null;
  subscriptionAmount: number | null;
  isLoggedIn: boolean;
}) {
  const [provider, setProvider] = useState<AccessFiCheckoutProvider>(
    accessType === "allowlist_access" ? "email_passkey" : "flow_wallet"
  );
  const [flowAddress, setFlowAddress] = useState<string | null>(null);
  const [state, formAction] = useActionState(unlockAccessFiVaultAction.bind(null, vaultSlug), initialState);

  if (!isLoggedIn) {
    return (
      <div className="space-y-4">
        <p className="text-sm leading-7 text-white/62">Sign in first so AccessFi can bind the vault right to your member account and proof trail.</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a href={`/login?next=${encodeURIComponent(`/accessfi/vaults/${vaultSlug}`)}`}>
            <Button>Sign In To Unlock</Button>
          </a>
          <a href={`/signup?next=${encodeURIComponent(`/accessfi/vaults/${vaultSlug}`)}`}>
            <Button variant="secondary">Create Account</Button>
          </a>
        </div>
      </div>
    );
  }

  const amount = depositAmount ?? subscriptionAmount ?? 0;
  const amountLabel =
    accessType === "deposit_to_unlock"
      ? `${amount} ${currency} reserve`
      : accessType === "subscription_access"
        ? `${amount} ${currency} recurring`
        : accessType === "allowlist_access"
          ? "Invite-only"
          : accessType === "token_gated_access"
            ? "Token proof required"
            : "Timed access";

  return (
    <form action={formAction} className="space-y-5">
      <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">Unlock requirement</p>
        <p className="mt-3 text-xl font-semibold text-white">{amountLabel}</p>
      </div>

      {accessType !== "allowlist_access" ? (
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">Checkout Rail</label>
          <Select name="provider" value={provider} onChange={(event) => setProvider(event.target.value as AccessFiCheckoutProvider)}>
            <option value="flow_wallet">Flow Wallet</option>
            <option value="near_intent">NEAR Intent</option>
            <option value="email_passkey">Walletless Email Rail</option>
          </Select>
        </div>
      ) : (
        <input type="hidden" name="provider" value="email_passkey" />
      )}

      {provider === "flow_wallet" ? (
        <>
          <AccessFiFlowWalletCard onAddressChange={setFlowAddress} />
          <input type="hidden" name="flowAddress" value={flowAddress ?? ""} />
        </>
      ) : null}

      {provider === "near_intent" ? (
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">NEAR Account</label>
          <Input name="nearAccountId" placeholder="yourname.testnet" />
        </div>
      ) : null}

      {accessType === "token_gated_access" ? (
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">Token Proof Note</label>
          <Input
            name="tokenProof"
            placeholder="Optional: linked Flow address, NEAR account, or proof string"
          />
        </div>
      ) : null}

      {state.message && !state.ok ? (
        <p className="rounded-[1.4rem] border border-[#ff716c]/20 bg-[#ff716c]/10 px-4 py-3 text-sm text-[#ff9a95]">{state.message}</p>
      ) : null}

      <SubmitButton pendingLabel="Activating access...">Unlock Vault</SubmitButton>

      <p className="text-sm leading-7 text-white/48">
        Unlocks land in your{" "}
        <Link href="/accessfi/dashboard" className="text-[#6bf4d3] transition hover:text-white">
          member library
        </Link>{" "}
        with a payment reference and access event trail.
      </p>
    </form>
  );
}
