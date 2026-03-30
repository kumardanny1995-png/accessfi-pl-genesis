"use client";

import { useEffect, useState } from "react";
import * as fcl from "@onflow/fcl";
import { Link2, Wallet2 } from "lucide-react";

import { Button } from "@/components/shared/button";
import { getAccessFiFlowConfig } from "@/lib/accessfi/env";

type FlowUserState = {
  addr?: string | null;
  loggedIn?: boolean | null;
};

let flowConfigured = false;

function configureFlowClient() {
  if (flowConfigured) {
    return;
  }

  const flow = getAccessFiFlowConfig();

  fcl
    .config()
    .put("flow.network", flow.network)
    .put("accessNode.api", flow.accessNode)
    .put("discovery.wallet", flow.walletDiscovery)
    .put("app.detail.title", flow.appTitle);

  flowConfigured = true;
}

export function AccessFiFlowWalletCard({
  onAddressChange,
  compact = false
}: {
  onAddressChange?: (address: string | null) => void;
  compact?: boolean;
}) {
  const [currentUser, setCurrentUser] = useState<FlowUserState>({});

  useEffect(() => {
    configureFlowClient();

    const unsubscribe = fcl.currentUser.subscribe((nextUser: FlowUserState) => {
      setCurrentUser(nextUser);
      onAddressChange?.(nextUser.loggedIn ? nextUser.addr ?? null : null);
    });

    return () => {
      unsubscribe();
    };
  }, [onAddressChange]);

  const linked = Boolean(currentUser.loggedIn && currentUser.addr);

  return (
    <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6bf4d3]">Flow rail</p>
          <p className="mt-2 text-sm leading-7 text-white/66">
            {linked ? `Linked ${currentUser.addr}` : "Optional wallet link for the Flow payment rail and proof trail."}
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/56">
          {linked ? <Link2 size={13} /> : <Wallet2 size={13} />}
          {linked ? "Linked" : "Not linked"}
        </span>
      </div>
      {!compact ? (
        <div className="mt-4">
          {linked ? (
            <Button variant="ghost" onClick={() => void fcl.unauthenticate()}>
              Unlink Flow Wallet
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => void fcl.authenticate()}>
              Link Flow Wallet
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
