import "server-only";

import type { GroupSummary, SportHubData, SportSummary } from "@/lib/db/types";
import { getSupabaseAdmin } from "@/lib/db/supabase";

import { mapCompetition, mapGroup, mapMatchSummary, mapSeason, mapSport } from "./shared";

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

const matchSelect = `
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
`;

const groupSelect = `
  id,
  slug,
  name,
  description,
  group_type,
  visibility,
  headline,
  stake_template,
  punishment_template,
  sport:sports (
    id,
    key,
    name
  ),
  competition:competitions (
    id,
    slug,
    name,
    short_name,
    category,
    region,
    theme_accent,
    is_featured,
    sport:sports (
      id,
      key,
      name
    )
  ),
  season:seasons (
    id,
    slug,
    name,
    year,
    status,
    is_current,
    start_date,
    end_date,
    competition:competitions (
      id,
      slug,
      name,
      short_name,
      category,
      region,
      theme_accent,
      is_featured,
      sport:sports (
        id,
        key,
        name
      )
    )
  ),
  group_members ( id ),
  group_challenges ( id )
`;

export async function getSportsOverview(): Promise<Array<SportSummary & { matchCount: number; groupCount: number }>> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("sports")
    .select(
      `
        id,
        key,
        name,
        matches ( id ),
        groups ( id )
      `
    )
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((sport) => ({
    ...mapSport(sport),
    matchCount: sport.matches?.length ?? 0,
    groupCount: sport.groups?.length ?? 0
  }));
}

export async function getSportHubData(sportKey: string): Promise<SportHubData | null> {
  const supabase = getSupabaseAdmin();
  const { data: sport, error: sportError } = await supabase
    .from("sports")
    .select("id, key, name")
    .eq("key", sportKey)
    .maybeSingle();

  if (sportError) {
    throw sportError;
  }

  if (!sport) {
    return null;
  }

  const [{ data: competitions, error: competitionError }, { data: seasonRows, error: seasonError }, { data: matches, error: matchError }, { data: groups, error: groupError }] =
    await Promise.all([
      supabase
        .from("competitions")
        .select(
          `
            id,
            slug,
            name,
            short_name,
            category,
            region,
            theme_accent,
            is_featured,
            sport:sports (
              id,
              key,
              name
            )
          `
        )
        .eq("sport_id", sport.id)
        .order("is_featured", { ascending: false })
        .order("name", { ascending: true }),
      supabase
        .from("seasons")
        .select(
          `
            id,
            slug,
            name,
            year,
            status,
            is_current,
            start_date,
            end_date,
            competition:competitions (
              id,
              slug,
              name,
              short_name,
              category,
              region,
              theme_accent,
              is_featured,
              sport:sports (
                id,
                key,
                name
              )
            )
          `
        )
        .eq("is_current", true)
        .order("start_date", { ascending: false }),
      supabase
        .from("matches")
        .select(matchSelect)
        .eq("sport_id", sport.id)
        .in("status", ["scheduled", "locked", "live"])
        .order("featured_rank", { ascending: true, nullsFirst: false })
        .order("start_time", { ascending: true })
        .limit(8),
      supabase
        .from("groups")
        .select(groupSelect)
        .eq("sport_id", sport.id)
        .neq("visibility", "private")
        .order("created_at", { ascending: false })
        .limit(6)
    ]);

  if (competitionError) {
    throw competitionError;
  }

  if (seasonError) {
    throw seasonError;
  }

  if (matchError) {
    throw matchError;
  }

  if (groupError) {
    throw groupError;
  }

  return {
    sport: mapSport(sport),
    competitions: (competitions ?? []).map(mapCompetition),
    currentSeason:
      (seasonRows ?? [])
        .filter((season) => one(one(season.competition)?.sport)?.id === sport.id)
        .map(mapSeason)
        .at(0) ?? null,
    featuredMatches: (matches ?? []).map(mapMatchSummary),
    featuredGroups: (groups ?? []).map(mapGroup)
  };
}

export async function getFeaturedGroups(limit = 6): Promise<GroupSummary[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("groups")
    .select(groupSelect)
    .neq("visibility", "private")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapGroup);
}
