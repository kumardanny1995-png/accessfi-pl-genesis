import "server-only";

import type { GroupPageData, GroupSummary, GroupType, StandingRow } from "@/lib/db/types";
import { getSupabaseAdmin } from "@/lib/db/supabase";

import { mapGroup, mapMatchSummary, rankStandingRows } from "./shared";

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

const groupSelect = `
  id,
  slug,
  name,
  description,
  group_type,
  visibility,
  invite_code,
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

export async function getGroupsDirectory(options?: { types?: GroupType[]; includePrivate?: boolean }): Promise<GroupSummary[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("groups")
    .select(groupSelect)
    .order("group_type", { ascending: true })
    .order("created_at", { ascending: false });

  if (!options?.includePrivate) {
    query = query.neq("visibility", "private");
  }

  if (options?.types?.length) {
    query = query.in("group_type", options.types);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapGroup);
}

export async function getGroupBySlug(groupSlug: string): Promise<GroupSummary | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("groups")
    .select(groupSelect)
    .eq("slug", groupSlug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapGroup(data) : null;
}

export async function getGroupPageData(groupSlug: string, guestProfileId?: string | null): Promise<GroupPageData | null> {
  const supabase = getSupabaseAdmin();
  const { data: groupRecord, error: groupError } = await supabase
    .from("groups")
    .select(groupSelect)
    .eq("slug", groupSlug)
    .maybeSingle();

  if (groupError) {
    throw groupError;
  }

  if (!groupRecord) {
    return null;
  }

  const group = mapGroup(groupRecord);
  const { data: membership, error: membershipError } = guestProfileId
    ? await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", group.id)
        .eq("guest_profile_id", guestProfileId)
        .maybeSingle()
    : { data: null, error: null };

  if (membershipError) {
    throw membershipError;
  }

  const viewerRole = membership?.role ?? null;

  if (group.visibility === "private" && !viewerRole) {
    return null;
  }

  const [{ data: standingsRows, error: standingsError }, { data: challengeRows, error: challengeError }, { data: suggestedMatchRows, error: suggestedMatchError }] =
    await Promise.all([
      supabase
        .from("season_standings")
        .select(
          `
            group_member_id,
            display_name,
            challenges_played,
            wins,
            losses,
            draws,
            total_points,
            accuracy_pct,
            contrarian_bonus,
            reputation_score,
            rank,
            member:group_members!season_standings_group_member_id_fkey (
              role
            )
          `
        )
        .eq("group_id", group.id)
        .order("rank", { ascending: true, nullsFirst: false })
        .order("total_points", { ascending: false }),
      supabase
        .from("group_challenges")
        .select(
          `
            challenge:challenges (
              id,
              slug,
              title,
              status,
              challenge_participants ( id ),
              match:matches (
                title
              )
            )
          `
        )
        .eq("group_id", group.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("matches")
        .select(matchSelect)
        .eq("sport_id", group.sport?.id ?? "00000000-0000-0000-0000-000000000000")
        .in("status", ["scheduled", "locked", "live"])
        .order("start_time", { ascending: true })
        .limit(4)
    ]);

  if (standingsError) {
    throw standingsError;
  }

  if (challengeError) {
    throw challengeError;
  }

  if (suggestedMatchError) {
    throw suggestedMatchError;
  }

  const standings: StandingRow[] = (standingsRows ?? []).map((row) => ({
    groupMemberId: row.group_member_id,
    displayName: row.display_name,
    role: one(row.member)?.role ?? "member",
    challengesPlayed: row.challenges_played ?? 0,
    wins: row.wins ?? 0,
    losses: row.losses ?? 0,
    draws: row.draws ?? 0,
    totalPoints: row.total_points ?? 0,
    accuracyPct: Number(row.accuracy_pct ?? 0),
    contrarianBonus: row.contrarian_bonus ?? 0,
    reputationScore: row.reputation_score ?? 0,
    rank: row.rank
  }));

  return {
    group,
    standings: rankStandingRows(standings),
    challenges: (challengeRows ?? []).flatMap((entry) =>
      one(entry.challenge)
        ? [
            {
              id: one(entry.challenge)?.id ?? "",
              slug: one(entry.challenge)?.slug ?? "",
              title: one(entry.challenge)?.title ?? "Challenge",
              status: one(entry.challenge)?.status ?? "open",
              participantCount: one(entry.challenge)?.challenge_participants?.length ?? 0,
              matchTitle: one(one(entry.challenge)?.match)?.title ?? "Unknown match"
            }
          ]
        : []
    ),
    suggestedMatches: (suggestedMatchRows ?? []).map(mapMatchSummary),
    viewerRole
  };
}
