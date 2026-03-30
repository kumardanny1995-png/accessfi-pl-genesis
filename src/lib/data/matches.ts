import "server-only";

import { getMiniPickWindows } from "@/lib/data/mini-picks";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import type { MatchSummary, MiniPickWindowView, PredictionQuestion } from "@/lib/db/types";

import { mapMatchSummary, mapQuestions } from "./shared";

export async function getUpcomingMatches(limit = 12): Promise<MatchSummary[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
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
    .in("status", ["scheduled", "locked", "live"])
    .order("start_time", { ascending: true })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapMatchSummary);
}

export async function getMatchBySlug(matchSlug: string, viewerGuestProfileId?: string | null): Promise<{
  match: MatchSummary;
  questions: PredictionQuestion[];
  miniPicks: MiniPickWindowView[];
  miniPickTemplates: Array<{
    id: string;
    key: string;
    name: string;
    description: string | null;
  }>;
} | null> {
  const supabase = getSupabaseAdmin();
  const { data: matches, error: matchError } = await supabase
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
    .eq("slug", matchSlug)
    .maybeSingle();

  if (matchError) {
    throw matchError;
  }

  if (!matches) {
    return null;
  }

  const rawSport = (matches as { sport?: Array<{ id: string }> | { id: string } | null }).sport;
  const sportRecord = Array.isArray(rawSport) ? rawSport[0] ?? null : rawSport ?? null;
  const sportId = sportRecord?.id ?? "";

  const [{ data: questions, error: questionError }, { data: templates, error: templateError }] = await Promise.all([
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
      .eq("match_id", matches.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("mini_pick_templates")
      .select("id, key, name, description")
      .eq("sport_id", sportId)
      .eq("is_enabled", true)
      .order("key", { ascending: true })
  ]);

  if (questionError) {
    throw questionError;
  }

  if (templateError) {
    throw templateError;
  }

  const miniPicks = await getMiniPickWindows(matches.id, viewerGuestProfileId);

  return {
    match: mapMatchSummary(matches),
    questions: mapQuestions(questions ?? []),
    miniPicks,
    miniPickTemplates: (templates ?? []).map((template) => ({
      id: template.id,
      key: template.key,
      name: template.name,
      description: template.description
    }))
  };
}

export async function getFeaturedMatches() {
  const matches = await getUpcomingMatches(3);
  return matches;
}
