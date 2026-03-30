"use client";

import { useActionState } from "react";

import { Button } from "@/components/shared/button";
import { Panel } from "@/components/shared/panel";
import type { ActionState, EventSyncStateView, MatchSummary, ProviderSyncRunView } from "@/lib/db/types";

const initialState: ActionState = { ok: true };

export function MatchSyncPanel({
  match,
  syncState,
  recentSyncRuns,
  syncAction,
  autoSettleAction
}: {
  match: MatchSummary;
  syncState: EventSyncStateView | null;
  recentSyncRuns: ProviderSyncRunView[];
  syncAction: (state: ActionState, formData: FormData) => Promise<ActionState>;
  autoSettleAction: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [syncResult, syncFormAction] = useActionState(syncAction, initialState);
  const [autoResult, autoFormAction] = useActionState(autoSettleAction, initialState);

  return (
    <Panel className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Provider Sync</p>
          <h3 className="mt-2 text-2xl font-black uppercase tracking-[0.04em] text-cream">Live data control</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/66">
            {match.predictionTemplateKey === "provider_ready"
              ? "This board uses the provider-ready template, so cricket results can settle automatically once the final score lands."
              : "This match keeps the classic social template. Provider sync can pull result context, but some questions still need manual settlement."}
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Current Status</p>
          <p className="mt-2 text-lg font-black uppercase tracking-[0.04em] text-cream">
            {syncState?.syncStatus ?? "manual"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Provider</p>
          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.14em] text-white">
            {syncState?.providerKey ?? "manual"}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Event ID</p>
          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.14em] text-white">
            {syncState?.externalEventId ?? "Not linked"}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Last Sync</p>
          <p className="mt-2 text-sm text-white/70">
            {syncState?.lastSyncedAt ? new Date(syncState.lastSyncedAt).toLocaleString() : "Never"}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Auto-Settle</p>
          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.14em] text-white">
            {syncState?.autoSettleSupported ? "Enabled" : "Manual fallback"}
          </p>
        </div>
      </div>

      {syncState?.providerEventLabel ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Provider Event</p>
          <p className="mt-2 text-lg font-black uppercase tracking-[0.04em] text-cream">
            {syncState.providerEventLabel}
          </p>
          <p className="mt-2 text-sm text-white/66">
            Status: {syncState.providerEventStatus ?? syncState.syncStatus}
          </p>
          {syncState.lastError ? <p className="mt-2 text-sm text-red-200">{syncState.lastError}</p> : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <form action={syncFormAction}>
          <input type="hidden" name="matchId" value={match.id} />
          <Button variant="secondary">Sync Provider Now</Button>
        </form>
        <form action={autoFormAction}>
          <input type="hidden" name="matchId" value={match.id} />
          <Button>Sync And Auto-Settle</Button>
        </form>
      </div>

      {syncResult.message ? (
        <p className={syncResult.ok ? "text-sm text-signal-green" : "text-sm text-red-200"}>{syncResult.message}</p>
      ) : null}
      {autoResult.message ? (
        <p className={autoResult.ok ? "text-sm text-signal-green" : "text-sm text-red-200"}>{autoResult.message}</p>
      ) : null}

      {recentSyncRuns.length > 0 ? (
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Recent Sync Runs</p>
          {recentSyncRuns.map((run) => (
            <div key={run.id} className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-white">
                  {run.syncKind} · {run.status}
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">
                  {new Date(run.createdAt).toLocaleString()}
                </p>
              </div>
              {run.summary ? <p className="mt-2 text-sm leading-6 text-white/66">{run.summary}</p> : null}
            </div>
          ))}
        </div>
      ) : null}
    </Panel>
  );
}
