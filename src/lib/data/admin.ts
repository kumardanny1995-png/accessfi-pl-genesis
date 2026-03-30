import "server-only";

import { getMiniPickWindows } from "@/lib/data/mini-picks";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import type { AdminDashboardData, AdminMatchData, PredictionQuestion } from "@/lib/db/types";

import { mapMatchSummary, mapQuestions, mapOutcomes } from "./shared";

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = getSupabaseAdmin();
  const [{ data: matches, error: matchError }, { data: challenges, error: challengeError }] =
    await Promise.all([
      supabase
        .from("matches")
        .select(
        `
          id,
          slug,
          title,
          competition_id,
          season_id,
          competition_name,
          venue,
          start_time,
          lock_time,
          status,
          settlement_status,
          stage_label,
          hero_image_url,
          featured_rank,
          sport:sports (
            id,
            key,
            name
          ),
          match_teams (
            id,
            role,
            team:teams (
              id,
              slug,
              short_name,
              full_name,
              entity_type,
              primary_color,
              secondary_color
            )
            ),
            prediction_questions ( id ),
            challenges ( id )
          `
        )
        .order("start_time", { ascending: true })
        .limit(10),
      supabase
        .from("challenges")
        .select(
          `
            id,
            slug,
            title,
            challenge_participants ( id ),
            match:matches ( title )
          `
        )
        .in("status", ["open", "locked"])
        .order("created_at", { ascending: false })
        .limit(8)
    ]);

  if (matchError) {
    throw matchError;
  }

  if (challengeError) {
    throw challengeError;
  }

  return {
    upcomingMatches: (matches ?? []).map(mapMatchSummary),
    liveChallenges: (challenges ?? []).map((challenge) => ({
      id: challenge.id,
      slug: challenge.slug,
      title: challenge.title,
      participantCount: challenge.challenge_participants?.length ?? 0,
      matchTitle: one(challenge.match)?.title ?? "Unknown match"
    }))
  };
}

export async function getAdminMatch(matchId: string): Promise<{
  match: ReturnType<typeof mapMatchSummary>;
  questions: PredictionQuestion[];
  outcomes: ReturnType<typeof mapOutcomes>;
  syncState: AdminMatchData["syncState"];
  recentSyncRuns: AdminMatchData["recentSyncRuns"];
  miniPicks: AdminMatchData["miniPicks"];
} | null> {
  const supabase = getSupabaseAdmin();
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select(
        `
          id,
          slug,
          title,
          competition_id,
          season_id,
          competition_name,
          venue,
          start_time,
          lock_time,
          status,
          settlement_status,
          stage_label,
          hero_image_url,
          featured_rank,
          prediction_template_key,
          external_provider_key,
          external_event_id,
          sport:sports (
            id,
            key,
            name
          ),
          match_teams (
            id,
            role,
            team:teams (
              id,
              slug,
              short_name,
              full_name,
              entity_type,
              primary_color,
              secondary_color
            )
        ),
        event_sync_state (
          provider_key,
          external_event_id,
          auto_settle_supported,
          sync_status,
          provider_event_label,
          provider_event_status,
          last_synced_at,
          last_auto_settled_at,
          last_checked_at,
          last_error
        ),
        prediction_questions ( id ),
        challenges ( id )
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

  const [{ data: questions, error: questionError }, { data: outcome, error: outcomeError }, { data: recentRuns, error: recentRunsError }] =
    await Promise.all([
      supabase
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
        .order("sort_order", { ascending: true }),
      supabase
        .from("match_outcomes")
        .select("id, match_outcome_answers(question_id, resolved_option_id)")
        .eq("match_id", matchId)
        .maybeSingle(),
      supabase
        .from("provider_sync_runs")
        .select("id, provider_key, sync_kind, status, summary, created_at")
        .eq("match_id", matchId)
        .order("created_at", { ascending: false })
        .limit(6)
    ]);

  if (questionError) {
    throw questionError;
  }

  if (outcomeError) {
    throw outcomeError;
  }

  if (recentRunsError) {
    throw recentRunsError;
  }

  const questionModels = mapQuestions(questions ?? []);
  const syncState = one(match.event_sync_state);

  const miniPicks = await getMiniPickWindows(matchId);

  return {
    match: mapMatchSummary(match),
    questions: questionModels,
    outcomes: mapOutcomes(outcome?.match_outcome_answers ?? [], questionModels),
    syncState: syncState
      ? {
          providerKey: syncState.provider_key,
          externalEventId: syncState.external_event_id,
          autoSettleSupported: syncState.auto_settle_supported,
          syncStatus: syncState.sync_status,
          providerEventLabel: syncState.provider_event_label,
          providerEventStatus: syncState.provider_event_status,
          lastSyncedAt: syncState.last_synced_at,
          lastAutoSettledAt: syncState.last_auto_settled_at,
          lastCheckedAt: syncState.last_checked_at,
          lastError: syncState.last_error
        }
      : null,
    recentSyncRuns: (recentRuns ?? []).map((row) => ({
      id: row.id,
      providerKey: row.provider_key,
      syncKind: row.sync_kind,
        status: row.status,
        summary: row.summary,
        createdAt: row.created_at
    })),
    miniPicks
  };
}
