import "server-only";

import type { PredictionQuestion } from "@/lib/db/types";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import { getSportsProvider } from "@/lib/providers";
import type { ProviderEventSnapshot } from "@/lib/providers/types";
import { settleMatchWithResolvedAnswers } from "@/lib/services/settlement";

type ProviderMatchContext = {
  id: string;
  title: string;
  sportKey: string;
  settlementStatus: string;
  predictionTemplateKey: string;
  questions: PredictionQuestion[];
  syncState: {
    providerKey: string;
    externalEventId: string | null;
    autoSettleSupported: boolean;
  } | null;
};

type ResolvedOutcome = {
  questionId: string;
  optionId: string;
};

type SupabaseLikeError = {
  message?: string;
  details?: string | null;
  hint?: string | null;
  code?: string | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function parseExternalEventId(value: string | null | undefined) {
  const raw = (value ?? "").trim();
  if (!raw) {
    return null;
  }

  const directMatch = raw.match(/\d{4,}/);
  return directMatch?.[0] ?? null;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const candidate = error as SupabaseLikeError;
    const parts = [candidate.message, candidate.details, candidate.hint, candidate.code].filter(Boolean);
    if (parts.length > 0) {
      return parts.join(" | ");
    }
  }

  return "Provider sync failed.";
}

function bucketByValue(
  questions: PredictionQuestion[],
  questionKey: string,
  expectedValue: string | null
): ResolvedOutcome | null {
  if (!expectedValue) {
    return null;
  }

  const question = questions.find((entry) => entry.key === questionKey);
  const option = question?.options.find((entry) => entry.value === expectedValue);

  return question && option ? { questionId: question.id, optionId: option.id } : null;
}

function totalRunsBucket(total: number) {
  if (total < 300) {
    return "under_300";
  }
  if (total < 350) {
    return "300_349";
  }
  if (total < 400) {
    return "350_399";
  }
  return "400_plus";
}

function inningsRunsBucket(total: number) {
  if (total < 160) {
    return "under_160";
  }
  if (total < 200) {
    return "160_199";
  }
  if (total < 240) {
    return "200_239";
  }
  return "240_plus";
}

function marginBucket(margin: number) {
  if (margin <= 10) {
    return "0_10";
  }
  if (margin <= 30) {
    return "11_30";
  }
  if (margin <= 60) {
    return "31_60";
  }
  return "61_plus";
}

function resolveClassicCricketOutcomes(questions: PredictionQuestion[], event: ProviderEventSnapshot) {
  if (event.sideAScore === null || event.sideBScore === null) {
    return [];
  }

  const outcomes: ResolvedOutcome[] = [];
  const winningTeam = bucketByValue(
    questions,
    "winning_team",
    event.winningSide === "side_a" ? questions.find((question) => question.key === "winning_team")?.options[0]?.value ?? null
      : event.winningSide === "side_b" ? questions.find((question) => question.key === "winning_team")?.options[1]?.value ?? null
      : "draw"
  );

  if (winningTeam) {
    outcomes.push(winningTeam);
  }

  const totalRuns = bucketByValue(questions, "total_runs_range", (() => {
    const total = event.sideAScore + event.sideBScore;
    if (total < 260) {
      return "under_260";
    }
    if (total <= 320) {
      return "260_320";
    }
    if (total <= 380) {
      return "321_380";
    }
    return "381_plus";
  })());

  if (totalRuns) {
    outcomes.push(totalRuns);
  }

  return outcomes;
}

function resolveProviderReadyCricketOutcomes(questions: PredictionQuestion[], event: ProviderEventSnapshot) {
  if (event.sideAScore === null || event.sideBScore === null) {
    return [];
  }

  const total = event.sideAScore + event.sideBScore;
  const margin = Math.abs(event.sideAScore - event.sideBScore);

  return [
    bucketByValue(
      questions,
      "winning_team",
      event.winningSide === "side_a" ? "side_a" : event.winningSide === "side_b" ? "side_b" : "draw"
    ),
    bucketByValue(questions, "total_runs_range", totalRunsBucket(total)),
    bucketByValue(questions, "side_a_score_range", inningsRunsBucket(event.sideAScore)),
    bucketByValue(questions, "side_b_score_range", inningsRunsBucket(event.sideBScore)),
    bucketByValue(questions, "winning_margin_range", marginBucket(margin))
  ].filter((value): value is ResolvedOutcome => Boolean(value));
}

function resolveProviderOutcomes(context: ProviderMatchContext, event: ProviderEventSnapshot) {
  if (context.sportKey !== "cricket") {
    return [];
  }

  if (context.predictionTemplateKey === "provider_ready") {
    return resolveProviderReadyCricketOutcomes(context.questions, event);
  }

  return resolveClassicCricketOutcomes(context.questions, event);
}

async function getProviderMatchContext(matchId: string): Promise<ProviderMatchContext | null> {
  const supabase = getSupabaseAdmin();
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select(
      `
        id,
        title,
        settlement_status,
        prediction_template_key,
        sport:sports (
          key
        ),
        event_sync_state (
          provider_key,
          external_event_id,
          auto_settle_supported
        )
      `
    )
    .eq("id", matchId)
    .maybeSingle();

  if (matchError) {
    throw matchError;
  }

  if (!match) {
    return null;
  }

  const { data: questions, error: questionError } = await supabase
    .from("prediction_questions")
    .select(
      `
        id,
        key,
        prompt,
        description,
        answer_type,
        sort_order,
        prediction_options (
          id,
          label,
          value,
          sort_order
        )
      `
    )
    .eq("match_id", matchId)
    .order("sort_order", { ascending: true });

  if (questionError) {
    throw questionError;
  }

  return {
    id: match.id,
    title: match.title,
    sportKey: one(match.sport)?.key ?? "cricket",
    settlementStatus: match.settlement_status,
    predictionTemplateKey: match.prediction_template_key ?? "classic_social",
    questions: (questions ?? []).map((question) => ({
      id: question.id,
      key: question.key,
      prompt: question.prompt,
      description: question.description,
      answerType: question.answer_type,
      sortOrder: question.sort_order,
      options: (question.prediction_options ?? [])
        .map((option) => ({
          id: option.id,
          label: option.label,
          value: option.value,
          sortOrder: option.sort_order
        }))
        .sort((left, right) => left.sortOrder - right.sortOrder)
    })),
    syncState: one(match.event_sync_state)
      ? {
          providerKey: one(match.event_sync_state)?.provider_key ?? "manual",
          externalEventId: one(match.event_sync_state)?.external_event_id ?? null,
          autoSettleSupported: Boolean(one(match.event_sync_state)?.auto_settle_supported)
        }
      : null
  };
}

async function recordProviderSyncRun(args: {
  matchId: string;
  providerKey: string;
  syncKind: string;
  status: string;
  summary: string;
  payload?: Record<string, unknown>;
}) {
  const supabase = getSupabaseAdmin();
  await supabase.from("provider_sync_runs").insert({
    match_id: args.matchId,
    provider_key: args.providerKey,
    sync_kind: args.syncKind,
    status: args.status,
    summary: args.summary,
    payload: args.payload ?? {}
  });
}

export async function syncMatchWithProvider(args: { matchId: string; autoSettle?: boolean }) {
  const context = await getProviderMatchContext(args.matchId);
  if (!context) {
    return { ok: false, message: "Match not found." };
  }

  const providerKey = context.syncState?.providerKey ?? "manual";
  if (providerKey === "manual") {
    return { ok: false, message: "This match is still set to manual settlement." };
  }

  const externalEventId = parseExternalEventId(context.syncState?.externalEventId);
  if (!externalEventId) {
    return { ok: false, message: "Add a provider event ID before syncing." };
  }

  const provider = getSportsProvider(providerKey);
  if (!provider) {
    return { ok: false, message: `No provider adapter is configured for ${providerKey}.` };
  }

  const supabase = getSupabaseAdmin();

  try {
    const event = await provider.fetchEvent(externalEventId);
    if (!event) {
      await supabase
        .from("event_sync_state")
        .update({
          sync_status: "not_found",
          last_checked_at: new Date().toISOString(),
          last_error: "Provider event was not found."
        })
        .eq("match_id", args.matchId);

      await recordProviderSyncRun({
        matchId: args.matchId,
        providerKey,
        syncKind: args.autoSettle ? "auto_settle" : "sync",
        status: "not_found",
        summary: "Provider event was not found.",
        payload: { externalEventId }
      });

      return { ok: false, message: "Provider event not found." };
    }

    await supabase
      .from("event_sync_state")
      .update({
        provider_key: providerKey,
        external_event_id: event.externalEventId,
        provider_event_label: event.label,
        provider_event_status: event.status,
        sync_status: event.completed ? "completed" : event.status,
        last_synced_at: new Date().toISOString(),
        last_checked_at: new Date().toISOString(),
        last_error: null,
        payload: event.raw
      })
      .eq("match_id", args.matchId);

    await supabase
      .from("matches")
      .update({
        external_provider_key: providerKey,
        external_event_id: event.externalEventId
      })
      .eq("id", args.matchId);

    const resolvedOutcomes = resolveProviderOutcomes(context, event);
    const fullyResolved = resolvedOutcomes.length === context.questions.length;

    if (args.autoSettle) {
      if (context.settlementStatus === "settled") {
        return { ok: true, message: "Match is already settled." };
      }

      if (!event.completed) {
        await recordProviderSyncRun({
          matchId: args.matchId,
          providerKey,
          syncKind: "auto_settle",
          status: "waiting",
          summary: "Provider event is not complete yet.",
          payload: event.raw
        });

        return { ok: false, message: "Provider event has not finished yet." };
      }

      if (!fullyResolved) {
        await recordProviderSyncRun({
          matchId: args.matchId,
          providerKey,
          syncKind: "auto_settle",
          status: "partial",
          summary: `Only ${resolvedOutcomes.length}/${context.questions.length} questions could be auto-resolved.`,
          payload: event.raw
        });

        return {
          ok: false,
          message:
            context.predictionTemplateKey === "provider_ready"
              ? "Provider sync worked, but the question values no longer match the auto-settlement template."
              : "Provider sync worked, but this classic board still needs manual settlement for the social-only questions."
        };
      }

      await settleMatchWithResolvedAnswers({
        matchId: args.matchId,
        notes: `Auto-settled from ${provider.label}: ${event.label}`,
        selectedOutcomes: resolvedOutcomes,
        source: {
          providerKey,
          summary: event.label
        }
      });

      await recordProviderSyncRun({
        matchId: args.matchId,
        providerKey,
        syncKind: "auto_settle",
        status: "settled",
        summary: `Auto-settled from ${provider.label}.`,
        payload: event.raw
      });

      return {
        ok: true,
        message: `Auto-settled ${context.title} from ${provider.label}.`
      };
    }

    await recordProviderSyncRun({
      matchId: args.matchId,
      providerKey,
      syncKind: "sync",
      status: event.completed ? "completed" : "synced",
      summary: fullyResolved
        ? `Provider synced. ${context.questions.length}/${context.questions.length} questions are auto-settle ready.`
        : `Provider synced. ${resolvedOutcomes.length}/${context.questions.length} questions resolved.`,
      payload: event.raw
    });

    return {
      ok: true,
      message: fullyResolved
        ? `Provider synced for ${context.title}.`
        : `Provider synced, but only ${resolvedOutcomes.length}/${context.questions.length} questions could be resolved automatically.`
    };
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("Provider sync failed", {
      matchId: args.matchId,
      providerKey,
      autoSettle: args.autoSettle ?? false,
      error
    });

    await supabase
      .from("event_sync_state")
      .update({
        sync_status: "failed",
        last_checked_at: new Date().toISOString(),
        last_error: message
      })
      .eq("match_id", args.matchId);

    await recordProviderSyncRun({
      matchId: args.matchId,
      providerKey,
      syncKind: args.autoSettle ? "auto_settle" : "sync",
      status: "failed",
      summary: message
    });

    return { ok: false, message };
  }
}

export async function syncPendingMatchesWithProviders(limit = 6) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("event_sync_state")
    .select("match_id, provider_key, auto_settle_supported")
    .neq("provider_key", "manual")
    .order("updated_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw error;
  }

  const results = [];

  for (const row of data ?? []) {
    results.push(
      await syncMatchWithProvider({
        matchId: row.match_id,
        autoSettle: Boolean(row.auto_settle_supported)
      })
    );
  }

  return results;
}
