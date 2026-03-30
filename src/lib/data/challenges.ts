import "server-only";

import { getSupabaseAdmin } from "@/lib/db/supabase";
import type { ChallengePageData, ProfileHistoryEntry } from "@/lib/db/types";
import { applyOutcomeState, computeOpinionBoard } from "@/lib/utils/scoring";

import { getMatchBySlug } from "./matches";
import { attachPredictions, mapChallenge, mapMatchSummary, mapOutcomes, mapQuestions } from "./shared";

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function getChallengePageData(challengeSlug: string): Promise<ChallengePageData | null> {
  const supabase = getSupabaseAdmin();
  const { data: challengeRecord, error: challengeError } = await supabase
    .from("challenges")
    .select(
      `
        id,
        slug,
        title,
        group_id,
        stake_text,
        status,
        visibility,
        share_message,
        created_at,
        match:matches (
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
        )
      `
    )
    .eq("slug", challengeSlug)
    .maybeSingle();

  if (challengeError) {
    throw challengeError;
  }

  const challengeMatch = one(challengeRecord?.match);

  if (!challengeRecord || !challengeMatch) {
    return null;
  }

  const match = mapMatchSummary(challengeMatch);
  const [{ data: questions, error: questionError }, { data: participants, error: participantError }] =
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
        .eq("match_id", match.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("challenge_participants")
        .select("id, public_code, display_name, is_creator, submitted_at, total_points, rank")
        .eq("challenge_id", challengeRecord.id)
        .order("submitted_at", { ascending: true })
    ]);

  if (questionError) {
    throw questionError;
  }

  if (participantError) {
    throw participantError;
  }

  const questionModels = mapQuestions(questions ?? []);
  const participantIds = (participants ?? []).map((participant) => participant.id);

  const [{ data: predictionRows, error: predictionError }, { data: outcomeRecord, error: outcomeError }] =
    await Promise.all([
      participantIds.length > 0
        ? supabase
            .from("participant_predictions")
            .select("id, participant_id, question_id, selected_option_id, is_correct, points_awarded")
            .in("participant_id", participantIds)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("match_outcomes")
        .select("id, match_outcome_answers(question_id, resolved_option_id)")
        .eq("match_id", match.id)
        .maybeSingle()
    ]);

  if (predictionError) {
    throw predictionError;
  }

  if (outcomeError) {
    throw outcomeError;
  }

  const participantViews = attachPredictions(participants ?? [], predictionRows ?? [], questionModels);
  const outcomes = mapOutcomes(outcomeRecord?.match_outcome_answers ?? [], questionModels);
  const hydratedParticipants =
    outcomes.length > 0 ? applyOutcomeState(participantViews, outcomes) : participantViews;

  return {
    challenge: mapChallenge(challengeRecord),
    match,
    questions: questionModels,
    participants: hydratedParticipants,
    opinionBoard: computeOpinionBoard(questionModels, hydratedParticipants),
    outcomes
  };
}

export async function getProfileHistory(guestProfileId: string): Promise<ProfileHistoryEntry[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("challenge_participants")
    .select(
      `
        display_name,
        total_points,
        rank,
        challenge:challenges (
          id,
          slug,
          title,
          status,
          match:matches (
            title,
            start_time
          )
        )
      `
    )
    .eq("guest_profile_id", guestProfileId)
    .order("submitted_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((entry) => ({
    challengeId: one(entry.challenge)?.id ?? "",
    challengeSlug: one(entry.challenge)?.slug ?? "",
    challengeTitle: one(entry.challenge)?.title ?? "Challenge",
    matchTitle: one(one(entry.challenge)?.match)?.title ?? "Match",
    startTime: one(one(entry.challenge)?.match)?.start_time ?? new Date(0).toISOString(),
    participantName: entry.display_name,
    totalPoints: entry.total_points ?? 0,
    rank: entry.rank,
    settled: one(entry.challenge)?.status === "settled"
  }));
}

export async function getMatchCreateContext(matchSlug: string) {
  return getMatchBySlug(matchSlug);
}
