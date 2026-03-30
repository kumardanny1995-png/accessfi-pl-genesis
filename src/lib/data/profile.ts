import "server-only";

import type { ProfileDashboardData, RivalSummary } from "@/lib/db/types";
import { getSupabaseAdmin } from "@/lib/db/supabase";

import { getProfileHistory } from "./challenges";
import { mapGroup, mapSport } from "./shared";

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function getProfileDashboard(guestProfileId: string): Promise<ProfileDashboardData> {
  const supabase = getSupabaseAdmin();

  const [
    { data: statsRow, error: statsError },
    { data: badgeRows, error: badgeError },
    { data: notificationRows, error: notificationError },
    { data: groupRows, error: groupError },
    { data: rivalryRows, error: rivalryError },
    history
  ] = await Promise.all([
    supabase
      .from("profile_stats")
      .select(
        `
          display_name,
          total_challenges_played,
          total_wins,
          total_losses,
          total_correct_picks,
          total_possible_picks,
          win_rate,
          accuracy_pct,
          contrarian_hits,
          clean_sweeps,
          current_streak,
          longest_streak,
          rivals_beaten,
          leagues_joined,
          reputation_score,
          best_sport:sports (
            id,
            key,
            name
          )
        `
      )
      .eq("guest_profile_id", guestProfileId)
      .maybeSingle(),
    supabase
      .from("profile_badges")
      .select(
        `
          reason,
          created_at,
          badge:badges (
            id,
            key,
            name,
            description,
            icon,
            rarity,
            theme_color
          )
        `
      )
      .eq("guest_profile_id", guestProfileId)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("notifications")
      .select("id, type, title, body, href, read_at, created_at")
      .eq("guest_profile_id", guestProfileId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("group_members")
      .select(
        `
          group:groups (
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
          )
        `
      )
      .eq("guest_profile_id", guestProfileId)
      .order("created_at", { ascending: false }),
    supabase
      .from("challenge_participants")
      .select("challenge_id, display_name, rank, guest_profile_id")
      .not("rank", "is", null),
    getProfileHistory(guestProfileId)
  ]);

  if (statsError) {
    throw statsError;
  }

  if (badgeError) {
    throw badgeError;
  }

  if (notificationError) {
    throw notificationError;
  }

  if (groupError) {
    throw groupError;
  }

  if (rivalryError) {
    throw rivalryError;
  }

  const selfRows = (rivalryRows ?? []).filter((row) => row.guest_profile_id === guestProfileId);
  const rivalMap = new Map<string, number>();

  for (const selfRow of selfRows) {
    const sameChallenge = (rivalryRows ?? []).filter(
      (row) => row.challenge_id === selfRow.challenge_id && row.guest_profile_id !== guestProfileId && row.rank !== null
    );

    for (const rival of sameChallenge) {
      if ((selfRow.rank ?? 999) < (rival.rank ?? 999)) {
        rivalMap.set(rival.display_name, (rivalMap.get(rival.display_name) ?? 0) + 1);
      }
    }
  }

  const topRivals: RivalSummary[] = [...rivalMap.entries()]
    .map(([displayName, winsAgainst]) => ({ displayName, winsAgainst }))
    .sort((left, right) => right.winsAgainst - left.winsAgainst || left.displayName.localeCompare(right.displayName))
    .slice(0, 5);

  return {
    stats: statsRow
      ? {
          displayName: statsRow.display_name,
          totalChallengesPlayed: statsRow.total_challenges_played ?? 0,
          totalWins: statsRow.total_wins ?? 0,
          totalLosses: statsRow.total_losses ?? 0,
          totalCorrectPicks: statsRow.total_correct_picks ?? 0,
          totalPossiblePicks: statsRow.total_possible_picks ?? 0,
          winRate: Number(statsRow.win_rate ?? 0),
          accuracyPct: Number(statsRow.accuracy_pct ?? 0),
          contrarianHits: statsRow.contrarian_hits ?? 0,
          cleanSweeps: statsRow.clean_sweeps ?? 0,
          currentStreak: statsRow.current_streak ?? 0,
          longestStreak: statsRow.longest_streak ?? 0,
          rivalsBeaten: statsRow.rivals_beaten ?? 0,
          leaguesJoined: statsRow.leagues_joined ?? 0,
          reputationScore: statsRow.reputation_score ?? 0,
          bestSport: statsRow.best_sport ? mapSport(statsRow.best_sport) : null
        }
      : null,
    badges: (badgeRows ?? []).flatMap((row) =>
      one(row.badge)
        ? [
            {
              id: one(row.badge)!.id,
              key: one(row.badge)!.key,
              name: one(row.badge)!.name,
              description: one(row.badge)!.description,
              icon: one(row.badge)!.icon,
              rarity: one(row.badge)!.rarity,
              themeColor: one(row.badge)!.theme_color,
              awardedAt: row.created_at,
              reason: row.reason
            }
          ]
        : []
    ),
    history,
    recentNotifications: (notificationRows ?? []).map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      href: row.href,
      readAt: row.read_at,
      createdAt: row.created_at
    })),
    topRivals,
    groups: (groupRows ?? []).flatMap((row) => {
      const group = one(row.group);
      return group ? [mapGroup(group)] : [];
    })
  };
}

export async function getNotifications(guestProfileId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, href, read_at, created_at")
    .eq("guest_profile_id", guestProfileId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    href: row.href,
    readAt: row.read_at,
    createdAt: row.created_at
  }));
}
