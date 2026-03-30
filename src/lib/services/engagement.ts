import "server-only";

import { rankStandingRows } from "@/lib/data/shared";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import type { NotificationType, StandingRow } from "@/lib/db/types";
import { sendWebPushNotifications } from "@/lib/services/web-push";
import { lockscorePath } from "@/lib/utils/lockscore-routes";
import { calculateReputationScore } from "@/lib/utils/reputation";

type GuestNotificationPayload = {
  guestProfileId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string | null;
  dedupeKey?: string | null;
  metadata?: Record<string, unknown>;
};

type OneOrMany<T> = T | T[] | null | undefined;

function one<T>(value: OneOrMany<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

async function insertGuestNotifications(payloads: GuestNotificationPayload[]) {
  if (payloads.length === 0) {
    return;
  }

  const supabase = getSupabaseAdmin();
  const deduped = [...new Map(payloads.filter((payload) => payload.dedupeKey).map((payload) => [payload.dedupeKey!, payload])).values()];
  const plain = payloads.filter((payload) => !payload.dedupeKey);
  const insertedForPush: Array<{
    guestProfileId: string;
    title: string;
    body: string;
    href?: string | null;
    type: NotificationType;
  }> = [];

  if (deduped.length > 0) {
    const dedupeKeys = deduped.map((payload) => payload.dedupeKey!).filter(Boolean);
    const { data: existing, error: existingError } = await supabase
      .from("notifications")
      .select("dedupe_key")
      .in("dedupe_key", dedupeKeys);

    if (existingError) {
      throw existingError;
    }

    const existingKeys = new Set((existing ?? []).map((row) => row.dedupe_key).filter(Boolean));
    const rowsToInsert = deduped
      .filter((payload) => !existingKeys.has(payload.dedupeKey!))
      .map((payload) => ({
        guest_profile_id: payload.guestProfileId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        href: payload.href ?? null,
        dedupe_key: payload.dedupeKey ?? null,
        metadata: payload.metadata ?? {}
      }));

    const { data: insertedRows, error } =
      rowsToInsert.length > 0
        ? await supabase
            .from("notifications")
            .insert(rowsToInsert)
            .select("guest_profile_id, title, body, href, type")
        : { data: [], error: null };

    if (error) {
      throw error;
    }

    insertedForPush.push(
      ...(insertedRows ?? []).map((row) => ({
        guestProfileId: row.guest_profile_id,
        title: row.title,
        body: row.body,
        href: row.href,
        type: row.type
      }))
    );
  }

  if (plain.length > 0) {
    const { data: insertedRows, error } = await supabase
      .from("notifications")
      .insert(
        plain.map((payload) => ({
          guest_profile_id: payload.guestProfileId,
          type: payload.type,
          title: payload.title,
          body: payload.body,
          href: payload.href ?? null,
          metadata: payload.metadata ?? {}
        }))
      )
      .select("guest_profile_id, title, body, href, type");

    if (error) {
      throw error;
    }

    insertedForPush.push(
      ...(insertedRows ?? []).map((row) => ({
        guestProfileId: row.guest_profile_id,
        title: row.title,
        body: row.body,
        href: row.href,
        type: row.type
      }))
    );
  }

  if (insertedForPush.length > 0) {
    try {
      await sendWebPushNotifications(insertedForPush);
    } catch {
      // Push delivery is additive. Notification inserts must not fail if device delivery is unavailable.
    }
  }
}

async function getBadgeMap(keys: string[]) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("badges").select("id, key").in("key", keys);

  if (error) {
    throw error;
  }

  return new Map((data ?? []).map((badge) => [badge.key, badge.id]));
}

async function upsertProfileStat(row: {
  guestProfileId: string;
  displayName: string;
  bestSportId: string | null;
  totalChallengesPlayed: number;
  totalWins: number;
  totalLosses: number;
  totalCorrectPicks: number;
  totalPossiblePicks: number;
  winRate: number;
  accuracyPct: number;
  contrarianHits: number;
  cleanSweeps: number;
  currentStreak: number;
  longestStreak: number;
  rivalsBeaten: number;
  leaguesJoined: number;
  reputationScore: number;
}) {
  const supabase = getSupabaseAdmin();
  const { data: existing, error: existingError } = await supabase
    .from("profile_stats")
    .select("id")
    .eq("guest_profile_id", row.guestProfileId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  const payload = {
    guest_profile_id: row.guestProfileId,
    display_name: row.displayName,
    best_sport_id: row.bestSportId,
    total_challenges_played: row.totalChallengesPlayed,
    total_wins: row.totalWins,
    total_losses: row.totalLosses,
    total_correct_picks: row.totalCorrectPicks,
    total_possible_picks: row.totalPossiblePicks,
    win_rate: row.winRate,
    accuracy_pct: row.accuracyPct,
    contrarian_hits: row.contrarianHits,
    clean_sweeps: row.cleanSweeps,
    current_streak: row.currentStreak,
    longest_streak: row.longestStreak,
    rivals_beaten: row.rivalsBeaten,
    leagues_joined: row.leaguesJoined,
    reputation_score: row.reputationScore,
    metadata: {
      formula_version: 1,
      updated_from: "settlement"
    }
  };

  const query = existing
    ? supabase.from("profile_stats").update(payload).eq("id", existing.id)
    : supabase.from("profile_stats").insert(payload);

  const { error } = await query;
  if (error) {
    throw error;
  }
}

export async function createGroupChallengeNotifications(args: {
  challengeId: string;
  challengeSlug: string;
  challengeTitle: string;
  groupId: string;
  creatorGuestProfileId: string;
  creatorName: string;
}) {
  const supabase = getSupabaseAdmin();
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id, name, group_type, group_members(guest_profile_id)")
    .eq("id", args.groupId)
    .single();

  if (groupError) {
    throw groupError;
  }

  const recipients = (group.group_members ?? [])
    .map((member) => member.guest_profile_id)
    .filter((guestProfileId): guestProfileId is string => Boolean(guestProfileId && guestProfileId !== args.creatorGuestProfileId));

  await insertGuestNotifications(
    recipients.map((guestProfileId) => ({
      guestProfileId,
      type: group.group_type === "creator" ? "room_challenge_live" : "challenge_live",
      title: `${group.name} has a fresh board`,
      body: `${args.creatorName} opened "${args.challengeTitle}" for the group.`,
      href: lockscorePath(`/c/${args.challengeSlug}`),
      dedupeKey: `group-challenge-live:${args.challengeId}:${guestProfileId}`,
      metadata: {
        challengeId: args.challengeId,
        groupId: args.groupId
      }
    }))
  );
}

export async function createRivalJoinedNotification(args: {
  challengeId: string;
  challengeSlug: string;
  participantName: string;
}) {
  const supabase = getSupabaseAdmin();
  const { data: creator, error } = await supabase
    .from("challenge_participants")
    .select("guest_profile_id, display_name, challenge:challenges(title)")
    .eq("challenge_id", args.challengeId)
    .eq("is_creator", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!creator?.guest_profile_id) {
    return;
  }

  const creatorChallenge = one(creator.challenge);

  await insertGuestNotifications([
    {
      guestProfileId: creator.guest_profile_id,
      type: "rival_joined",
      title: `${args.participantName} joined your board`,
      body: `The counter-picks are in for ${creatorChallenge?.title ?? "your challenge"}.`,
      href: lockscorePath(`/c/${args.challengeSlug}/compare`),
      dedupeKey: `rival-joined:${args.challengeId}:${creator.guest_profile_id}`
    }
  ]);
}

export async function createMiniPickLiveNotifications(args: {
  matchId: string;
  matchSlug: string;
  windowId: string;
  title: string;
}) {
  const supabase = getSupabaseAdmin();
  const { data: challenges, error: challengeError } = await supabase.from("challenges").select("id").eq("match_id", args.matchId);

  if (challengeError) {
    throw challengeError;
  }

  const challengeIds = (challenges ?? []).map((challenge) => challenge.id);
  if (challengeIds.length === 0) {
    return;
  }

  const { data, error } = await supabase.from("challenge_participants").select("guest_profile_id").in("challenge_id", challengeIds);

  if (error) {
    throw error;
  }

  const guestIds = [...new Set((data ?? []).map((row) => row.guest_profile_id).filter(Boolean))] as string[];
  await insertGuestNotifications(
    guestIds.map((guestProfileId) => ({
      guestProfileId,
      type: "mini_pick_live",
      title: `${args.title} is live`,
      body: "A fast side board just opened. Lock the take before the window closes.",
      href: lockscorePath(`/matches/${args.matchSlug}`),
      dedupeKey: `mini-pick-live:${args.windowId}:${guestProfileId}`
    }))
  );
}

export async function createMiniPickSettledNotifications(args: {
  matchSlug: string;
  windowId: string;
  title: string;
}) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("mini_pick_entries")
    .select("guest_profile_id")
    .eq("window_id", args.windowId);

  if (error) {
    throw error;
  }

  const guestIds = [...new Set((data ?? []).map((row) => row.guest_profile_id).filter(Boolean))] as string[];
  await insertGuestNotifications(
    guestIds.map((guestProfileId) => ({
      guestProfileId,
      type: "mini_pick_settled",
      title: `${args.title} settled`,
      body: "The live side board is resolved. Open the match page to see who landed it.",
      href: lockscorePath(`/matches/${args.matchSlug}`),
      dedupeKey: `mini-pick-settled:${args.windowId}:${guestProfileId}`
    }))
  );
}

async function awardBadgesForChallenge(challengeId: string) {
  const supabase = getSupabaseAdmin();
  const { data: challenge, error: challengeError } = await supabase
    .from("challenges")
    .select("id, group_id, challenge_participants(id, guest_profile_id, total_points, rank)")
    .eq("id", challengeId)
    .single();

  if (challengeError) {
    throw challengeError;
  }

  const participants = (challenge.challenge_participants ?? []).filter(
    (participant): participant is { id: string; guest_profile_id: string; total_points: number; rank: number | null } =>
      Boolean(participant.guest_profile_id)
  );

  if (participants.length === 0) {
    return;
  }

  const participantIds = participants.map((participant) => participant.id);
  const [{ data: predictions, error: predictionError }, { data: challengeQuestions, error: questionError }, badgeMap] =
    await Promise.all([
      supabase
        .from("participant_predictions")
        .select("participant_id, question_id, selected_option_id, is_correct")
        .in("participant_id", participantIds),
      supabase
        .from("challenge_participants")
        .select("challenge:challenges(match:matches(prediction_questions(id)))")
        .eq("id", participants[0].id)
        .single(),
      getBadgeMap(["lone_wolf", "contrarian_hit", "clean_sweep", "table_topper"])
    ]);

  if (predictionError) {
    throw predictionError;
  }

  if (questionError) {
    throw questionError;
  }

  const questionCount = one(one(challengeQuestions?.challenge)?.match)?.prediction_questions?.length ?? 0;
  const countsByQuestion = new Map<string, Map<string, number>>();

  for (const prediction of predictions ?? []) {
    if (!prediction.selected_option_id) {
      continue;
    }

    const optionCounts = countsByQuestion.get(prediction.question_id) ?? new Map<string, number>();
    optionCounts.set(prediction.selected_option_id, (optionCounts.get(prediction.selected_option_id) ?? 0) + 1);
    countsByQuestion.set(prediction.question_id, optionCounts);
  }

  const badgeAwards: Array<{
    badge_id: string;
    guest_profile_id: string;
    awarded_for_challenge_id: string;
    awarded_for_group_id: string | null;
    dedupe_key: string;
    reason: string;
  }> = [];

  for (const participant of participants) {
    const participantPredictions = (predictions ?? []).filter((prediction) => prediction.participant_id === participant.id);

    if (questionCount > 0 && participant.total_points === questionCount && badgeMap.get("clean_sweep")) {
      badgeAwards.push({
        badge_id: badgeMap.get("clean_sweep")!,
        guest_profile_id: participant.guest_profile_id,
        awarded_for_challenge_id: challengeId,
        awarded_for_group_id: challenge.group_id ?? null,
        dedupe_key: `clean_sweep:${participant.guest_profile_id}:${challengeId}`,
        reason: "Perfect board. All calls landed."
      });
    }

    if (participant.rank === 1 && badgeMap.get("table_topper")) {
      badgeAwards.push({
        badge_id: badgeMap.get("table_topper")!,
        guest_profile_id: participant.guest_profile_id,
        awarded_for_challenge_id: challengeId,
        awarded_for_group_id: challenge.group_id ?? null,
        dedupe_key: `table_topper:${participant.guest_profile_id}:${challengeId}`,
        reason: "Finished first on the settled leaderboard."
      });
    }

    for (const prediction of participantPredictions) {
      if (!prediction.is_correct || !prediction.selected_option_id) {
        continue;
      }

      const optionCounts = countsByQuestion.get(prediction.question_id);
      if (!optionCounts) {
        continue;
      }

      const count = optionCounts.get(prediction.selected_option_id) ?? 0;
      const values = [...optionCounts.values()];
      const minCount = Math.min(...values);
      const maxCount = Math.max(...values);

      if (count === 1 && badgeMap.get("lone_wolf")) {
        badgeAwards.push({
          badge_id: badgeMap.get("lone_wolf")!,
          guest_profile_id: participant.guest_profile_id,
          awarded_for_challenge_id: challengeId,
          awarded_for_group_id: challenge.group_id ?? null,
          dedupe_key: `lone_wolf:${participant.guest_profile_id}:${challengeId}`,
          reason: "Only one person took the pick and it landed."
        });
        continue;
      }

      if (count === minCount && minCount < maxCount && badgeMap.get("contrarian_hit")) {
        badgeAwards.push({
          badge_id: badgeMap.get("contrarian_hit")!,
          guest_profile_id: participant.guest_profile_id,
          awarded_for_challenge_id: challengeId,
          awarded_for_group_id: challenge.group_id ?? null,
          dedupe_key: `contrarian_hit:${participant.guest_profile_id}:${challengeId}`,
          reason: "Against the group lean and still right."
        });
      }
    }
  }

  if (badgeAwards.length === 0) {
    return;
  }

  const uniqueBadgeAwards = [...new Map(badgeAwards.map((award) => [award.dedupe_key, award])).values()];

  const { error: badgeError } = await supabase.from("profile_badges").upsert(uniqueBadgeAwards, {
    onConflict: "dedupe_key"
  });

  if (badgeError) {
    throw badgeError;
  }
}

async function recalculateProfileStatsForGuests(guestProfileIds: string[]) {
  const uniqueGuestIds = [...new Set(guestProfileIds.filter(Boolean))];
  if (uniqueGuestIds.length === 0) {
    return;
  }

  const supabase = getSupabaseAdmin();
  const [
    { data: guests, error: guestError },
    { data: participantRows, error: participantError },
    { data: badgeRows, error: badgeError },
    { data: groupMembershipRows, error: membershipError }
  ] = await Promise.all([
    supabase.from("guest_profiles").select("id, display_name").in("id", uniqueGuestIds),
    supabase
      .from("challenge_participants")
      .select(
        `
          id,
          challenge_id,
          guest_profile_id,
          display_name,
          rank,
          challenge:challenges (
            status,
            match:matches (
              start_time,
              sport:sports (
                id,
                key,
                name
              )
            )
          )
        `
      )
      .in("guest_profile_id", uniqueGuestIds),
    supabase
      .from("profile_badges")
      .select(
        `
          guest_profile_id,
          badge:badges (
            key
          )
        `
      )
      .in("guest_profile_id", uniqueGuestIds),
    supabase
      .from("group_members")
      .select("guest_profile_id")
      .in("guest_profile_id", uniqueGuestIds)
  ]);

  if (guestError) {
    throw guestError;
  }

  if (participantError) {
    throw participantError;
  }

  if (badgeError) {
    throw badgeError;
  }

  if (membershipError) {
    throw membershipError;
  }

  const settledParticipants = (participantRows ?? []).filter((row) => one(row.challenge)?.status === "settled");
  const participantIds = settledParticipants.map((row) => row.id);

  const [{ data: predictionRows, error: predictionError }, { data: challengePeers, error: peerError }] =
    await Promise.all([
      participantIds.length > 0
        ? supabase.from("participant_predictions").select("participant_id, is_correct").in("participant_id", participantIds)
        : Promise.resolve({ data: [], error: null }),
      settledParticipants.length > 0
        ? supabase
            .from("challenge_participants")
            .select("challenge_id, guest_profile_id, display_name, rank")
            .in(
              "challenge_id",
              [...new Set(settledParticipants.map((participant) => participant.challenge_id))]
            )
        : Promise.resolve({ data: [], error: null })
    ]);

  if (predictionError) {
    throw predictionError;
  }

  if (peerError) {
    throw peerError;
  }

  const badgeKeysByGuest = new Map<string, string[]>();
  for (const badgeRow of badgeRows ?? []) {
    const keys = badgeKeysByGuest.get(badgeRow.guest_profile_id) ?? [];
    const badge = one(badgeRow.badge);
    if (badge?.key) {
      keys.push(badge.key);
    }
    badgeKeysByGuest.set(badgeRow.guest_profile_id, keys);
  }

  const leaguesJoinedByGuest = new Map<string, number>();
  for (const membership of groupMembershipRows ?? []) {
    leaguesJoinedByGuest.set(
      membership.guest_profile_id,
      (leaguesJoinedByGuest.get(membership.guest_profile_id) ?? 0) + 1
    );
  }

  for (const guest of guests ?? []) {
    const rows = settledParticipants
      .filter((participant) => participant.guest_profile_id === guest.id)
      .sort(
        (left, right) =>
          new Date(one(one(left.challenge)?.match)?.start_time ?? 0).getTime() -
          new Date(one(one(right.challenge)?.match)?.start_time ?? 0).getTime()
      );

    const totalChallengesPlayed = rows.length;
    const totalWins = rows.filter((row) => row.rank === 1).length;
    const totalLosses = rows.filter((row) => (row.rank ?? 0) > 1).length;
    const rowParticipantIds = rows.map((row) => row.id);
    const rowPredictions = (predictionRows ?? []).filter((prediction) => rowParticipantIds.includes(prediction.participant_id));
    const totalPossiblePicks = rowPredictions.length;
    const totalCorrectPicks = rowPredictions.filter((prediction) => prediction.is_correct).length;
    const winRate = totalChallengesPlayed ? (totalWins / totalChallengesPlayed) * 100 : 0;
    const accuracyPct = totalPossiblePicks ? (totalCorrectPicks / totalPossiblePicks) * 100 : 0;
    const badgeKeys = badgeKeysByGuest.get(guest.id) ?? [];
    const contrarianHits = badgeKeys.filter((key) => key === "lone_wolf" || key === "contrarian_hit").length;
    const cleanSweeps = badgeKeys.filter((key) => key === "clean_sweep").length;

    let currentStreak = 0;
    let longestStreak = 0;
    let streak = 0;

    for (const row of rows) {
      if (row.rank === 1) {
        streak += 1;
        longestStreak = Math.max(longestStreak, streak);
      } else {
        streak = 0;
      }
    }

    for (let index = rows.length - 1; index >= 0; index -= 1) {
      if (rows[index]?.rank === 1) {
        currentStreak += 1;
      } else {
        break;
      }
    }

    const rivalsBeaten = new Set<string>();
    for (const row of rows) {
      const peers = (challengePeers ?? []).filter(
        (peer) => peer.challenge_id === row.challenge_id && peer.guest_profile_id && peer.guest_profile_id !== guest.id
      );
      for (const peer of peers) {
        if ((row.rank ?? 999) < (peer.rank ?? 999)) {
          rivalsBeaten.add(peer.guest_profile_id!);
        }
      }
    }

    const sportBuckets = new Map<string, { wins: number; correct: number; total: number }>();
    for (const row of rows) {
      const sportId = one(one(one(row.challenge)?.match)?.sport)?.id;
      if (!sportId) {
        continue;
      }

      const bucket = sportBuckets.get(sportId) ?? { wins: 0, correct: 0, total: 0 };
      if (row.rank === 1) {
        bucket.wins += 1;
      }

      const rowPredictionSet = rowPredictions.filter((prediction) => prediction.participant_id === row.id);
      bucket.correct += rowPredictionSet.filter((prediction) => prediction.is_correct).length;
      bucket.total += rowPredictionSet.length;
      sportBuckets.set(sportId, bucket);
    }

    const bestSportId =
      [...sportBuckets.entries()]
        .sort(
          (left, right) =>
            right[1].wins - left[1].wins ||
            right[1].correct / Math.max(right[1].total, 1) - left[1].correct / Math.max(left[1].total, 1)
        )
        .at(0)?.[0] ?? null;

    const leaguesJoined = leaguesJoinedByGuest.get(guest.id) ?? 0;
    const reputationScore = calculateReputationScore({
      accuracyPct,
      totalChallengesPlayed,
      contrarianHits,
      currentStreak,
      longestStreak,
      totalWins,
      leaguesJoined
    });

    await upsertProfileStat({
      guestProfileId: guest.id,
      displayName: guest.display_name,
      bestSportId,
      totalChallengesPlayed,
      totalWins,
      totalLosses,
      totalCorrectPicks,
      totalPossiblePicks,
      winRate,
      accuracyPct,
      contrarianHits,
      cleanSweeps,
      currentStreak,
      longestStreak,
      rivalsBeaten: rivalsBeaten.size,
      leaguesJoined,
      reputationScore
    });
  }
}

async function recalculateGroupStandingsForChallenge(challengeId: string) {
  const supabase = getSupabaseAdmin();
  const { data: links, error: linkError } = await supabase
    .from("group_challenges")
    .select("group_id, season_id, group:groups(slug)")
    .eq("challenge_id", challengeId);

  if (linkError) {
    throw linkError;
  }

  for (const link of links ?? []) {
    if (!link.season_id) {
      continue;
    }

    const [
      { data: groupMembers, error: memberError },
      { data: groupChallengeRows, error: groupChallengeError }
    ] = await Promise.all([
      supabase
        .from("group_members")
        .select("id, guest_profile_id, display_name, role")
        .eq("group_id", link.group_id),
      supabase
        .from("group_challenges")
        .select("challenge:challenges(id, status)")
        .eq("group_id", link.group_id)
        .eq("season_id", link.season_id)
    ]);

    if (memberError) {
      throw memberError;
    }

    if (groupChallengeError) {
      throw groupChallengeError;
    }

    const settledChallengeIds = (groupChallengeRows ?? []).flatMap((row) => {
      const challenge = one(row.challenge);
      return challenge?.status === "settled" ? [challenge.id] : [];
    });

    const participantsQuery =
      settledChallengeIds.length > 0
        ? supabase
            .from("challenge_participants")
            .select("id, challenge_id, guest_profile_id, display_name")
            .in("challenge_id", settledChallengeIds)
        : Promise.resolve({ data: [], error: null });

    const { data: participants, error: participantError } = await participantsQuery;
    if (participantError) {
      throw participantError;
    }

    const participantIds = (participants ?? []).map((participant) => participant.id);
    const [
      { data: scoreRows, error: scoreError },
      { data: profileStatRows, error: profileStatError },
      { data: contrarianBadgeRows, error: contrarianBadgeError }
    ] = await Promise.all([
      participantIds.length > 0
        ? supabase
            .from("challenge_scores")
            .select("participant_id, total_points, accuracy_pct, result_rank")
            .in("participant_id", participantIds)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("profile_stats")
        .select("guest_profile_id, reputation_score")
        .in(
          "guest_profile_id",
          (groupMembers ?? [])
            .map((member) => member.guest_profile_id)
            .filter((guestProfileId): guestProfileId is string => Boolean(guestProfileId))
        ),
      settledChallengeIds.length > 0
        ? supabase
            .from("profile_badges")
            .select(
              `
                guest_profile_id,
                awarded_for_challenge_id,
                badge:badges (
                  key
                )
              `
            )
            .in("awarded_for_challenge_id", settledChallengeIds)
        : Promise.resolve({ data: [], error: null })
    ]);

    if (scoreError) {
      throw scoreError;
    }

    if (profileStatError) {
      throw profileStatError;
    }

    if (contrarianBadgeError) {
      throw contrarianBadgeError;
    }

    const reputationByGuest = new Map(
      (profileStatRows ?? []).map((row) => [row.guest_profile_id, row.reputation_score ?? 0])
    );

    const contrarianByGuest = new Map<string, number>();
    for (const badgeRow of contrarianBadgeRows ?? []) {
      const key = one(badgeRow.badge)?.key;
      if (!badgeRow.guest_profile_id || (key !== "lone_wolf" && key !== "contrarian_hit")) {
        continue;
      }

      contrarianByGuest.set(
        badgeRow.guest_profile_id,
        (contrarianByGuest.get(badgeRow.guest_profile_id) ?? 0) + 1
      );
    }

    const standings: StandingRow[] = (groupMembers ?? []).map((member) => {
      const memberParticipantIds = (participants ?? [])
        .filter((participant) => participant.guest_profile_id === member.guest_profile_id)
        .map((participant) => participant.id);
      const memberScores = (scoreRows ?? []).filter((score) => memberParticipantIds.includes(score.participant_id));
      const challengesPlayed = memberScores.length;
      const wins = memberScores.filter((score) => score.result_rank === 1).length;
      const losses = memberScores.filter((score) => (score.result_rank ?? 0) > 1).length;
      const totalPoints = memberScores.reduce((sum, score) => sum + (score.total_points ?? 0), 0);
      const accuracyPct = challengesPlayed
        ? memberScores.reduce((sum, score) => sum + Number(score.accuracy_pct ?? 0), 0) / challengesPlayed
        : 0;

      return {
        groupMemberId: member.id,
        displayName: member.display_name,
        role: member.role,
        challengesPlayed,
        wins,
        losses,
        draws: 0,
        totalPoints,
        accuracyPct,
        contrarianBonus: member.guest_profile_id ? contrarianByGuest.get(member.guest_profile_id) ?? 0 : 0,
        reputationScore: member.guest_profile_id ? reputationByGuest.get(member.guest_profile_id) ?? 0 : 0,
        rank: null
      };
    });

    const rankedStandings = rankStandingRows(standings);
    const { error: standingsError } = await supabase.from("season_standings").upsert(
      rankedStandings.map((row) => ({
        group_id: link.group_id,
        season_id: link.season_id,
        group_member_id: row.groupMemberId,
        display_name: row.displayName,
        challenges_played: row.challengesPlayed,
        wins: row.wins,
        losses: row.losses,
        draws: row.draws,
        total_points: row.totalPoints,
        accuracy_pct: row.accuracyPct,
        contrarian_bonus: row.contrarianBonus,
        reputation_score: row.reputationScore,
        rank: row.rank
      })),
      { onConflict: "group_id,season_id,group_member_id" }
    );

    if (standingsError) {
      throw standingsError;
    }

    await insertGuestNotifications(
      (groupMembers ?? [])
        .filter((member) => member.guest_profile_id)
        .map((member) => ({
          guestProfileId: member.guest_profile_id!,
          type: "season_table_updated",
          title: `${member.display_name}, the table moved`,
          body: "Fresh results just hit your group standings.",
          href: lockscorePath(`/groups/${one(link.group)?.slug ?? link.group_id}`),
          dedupeKey: `season-table:${link.group_id}:${link.season_id}:${member.guest_profile_id}`,
          metadata: {
            groupId: link.group_id,
            seasonId: link.season_id
          }
        }))
    );
  }
}

async function createSettlementNotifications(challengeId: string, challengeSlug: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("challenge_participants")
    .select("guest_profile_id, display_name, total_points, rank")
    .eq("challenge_id", challengeId);

  if (error) {
    throw error;
  }

  const notifications: GuestNotificationPayload[] = (data ?? [])
    .filter((participant) => participant.guest_profile_id)
    .flatMap((participant) => {
      const type: NotificationType = participant.rank === 1 ? "you_won" : "you_got_cooked";
      const guestProfileId = participant.guest_profile_id!;

      return [
        {
          guestProfileId,
          type: "results_live",
          title: "Results are live",
          body: "The settled board is ready. Open the row-by-row reveal and leaderboard.",
          href: lockscorePath(`/c/${challengeSlug}/results`),
          dedupeKey: `results-live:${challengeId}:${guestProfileId}`
        },
        {
          guestProfileId,
          type,
          title: participant.rank === 1 ? "You took the board" : "The board is settled",
          body:
            participant.rank === 1
              ? `${participant.display_name} finished on top with ${participant.total_points} points.`
              : `${participant.display_name}, you closed on ${participant.total_points} points.`,
          href: lockscorePath(`/c/${challengeSlug}/results`),
          dedupeKey: `results-rank:${challengeId}:${guestProfileId}:${type}`
        }
      ];
    });

  await insertGuestNotifications(notifications);
}

export async function completeSettlementPostProcessing(challengeId: string, challengeSlug: string) {
  const supabase = getSupabaseAdmin();
  const { data: participants, error: participantError } = await supabase
    .from("challenge_participants")
    .select("guest_profile_id")
    .eq("challenge_id", challengeId);

  if (participantError) {
    throw participantError;
  }

  const guestIds = (participants ?? [])
    .map((participant) => participant.guest_profile_id)
    .filter((guestProfileId): guestProfileId is string => Boolean(guestProfileId));

  await awardBadgesForChallenge(challengeId);
  await recalculateProfileStatsForGuests(guestIds);
  await recalculateGroupStandingsForChallenge(challengeId);
  await createSettlementNotifications(challengeId, challengeSlug);
}

export async function runNotificationSweep() {
  const supabase = getSupabaseAdmin();
  const now = Date.now();
  const lockWindowEnd = now + 90 * 60 * 1000;
  const startWindowEnd = now + 3 * 60 * 60 * 1000;

  const { data: challenges, error } = await supabase.from("challenges").select(
    `
      id,
      slug,
      title,
      status,
      match:matches (
        lock_time,
        start_time
      ),
      challenge_participants (
        guest_profile_id
      )
    `
  );

  if (error) {
    throw error;
  }

  const payloads: GuestNotificationPayload[] = [];

  for (const challenge of challenges ?? []) {
    const match = one(challenge.match);
    const lockTime = new Date(match?.lock_time ?? 0).getTime();

    if (challenge.status !== "open" || !(lockTime > now && lockTime <= lockWindowEnd)) {
      continue;
    }

    for (const participant of challenge.challenge_participants ?? []) {
      if (!participant.guest_profile_id) {
        continue;
      }

      payloads.push({
        guestProfileId: participant.guest_profile_id,
        type: "picks_locking_soon",
        title: `${challenge.title} locks soon`,
        body: "Your board is close to lock. Make sure the rivals got their picks in.",
        href: lockscorePath(`/c/${challenge.slug}/compare`),
        dedupeKey: `lock-soon:${challenge.id}:${participant.guest_profile_id}`
      });
    }
  }

  for (const challenge of challenges ?? []) {
    const match = one(challenge.match);
    const startTime = new Date(match?.start_time ?? 0).getTime();

    if (!["open", "locked"].includes(challenge.status) || !(startTime > now && startTime <= startWindowEnd)) {
      continue;
    }

    for (const participant of challenge.challenge_participants ?? []) {
      if (!participant.guest_profile_id) {
        continue;
      }

      payloads.push({
        guestProfileId: participant.guest_profile_id,
        type: "match_starting_soon",
        title: `${challenge.title} starts soon`,
        body: "Kickoff is close. Open the board before the live chaos takes over.",
        href: lockscorePath(`/c/${challenge.slug}/compare`),
        dedupeKey: `start-soon:${challenge.id}:${participant.guest_profile_id}`
      });
    }
  }

  await insertGuestNotifications(payloads);

  return {
    created: payloads.length
  };
}
