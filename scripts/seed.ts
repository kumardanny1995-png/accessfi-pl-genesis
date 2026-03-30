import { createClient } from "@supabase/supabase-js";

import { buildDefaultQuestionsBySport, buildMiniPickTemplatesBySport } from "../src/lib/data/defaults";
import type { MiniPickTemplateKey, PredictionTemplateKey, SportsProviderKey } from "../src/lib/db/types";
import { calculateReputationScore } from "../src/lib/utils/reputation";
import { buildMatchSlug, slugify } from "../src/lib/utils/slugs";

type TeamSeed = {
  fullName: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
};

type MatchSeed = {
  sportKey: "cricket" | "football" | "formula1" | "basketball";
  predictionTemplateKey?: PredictionTemplateKey;
  providerKey?: SportsProviderKey;
  externalEventId?: string | null;
  competitionName: string;
  venue: string;
  startTime: string;
  lockTime: string;
  status: "scheduled" | "live" | "completed";
  settlementStatus: "pending" | "settled";
  stageLabel?: string;
  featuredRank?: number | null;
  teams: [TeamSeed, TeamSeed];
};

type MiniPickSeed = {
  matchId: string;
  sportId: string;
  sportKey: MatchSeed["sportKey"];
  teams: [TeamSeed, TeamSeed];
  templateKey: MiniPickTemplateKey;
  opensAt: string;
  lockAt: string;
  stakeText?: string;
  resolvedValue?: string;
  resolutionNote?: string;
  entries?: Array<{
    displayName: string;
    optionValue: string;
  }>;
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding.");
}

const supabase = createClient(url, serviceRole, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

function isoDaysFromNow(dayOffset: number, hour: number, minute = 0) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + dayOffset);
  date.setUTCHours(hour, minute, 0, 0);
  return date.toISOString();
}

function sportNameFromKey(sportKey: MatchSeed["sportKey"]) {
  switch (sportKey) {
    case "football":
      return "Football";
    case "formula1":
      return "Formula 1";
    case "basketball":
      return "Basketball";
    case "cricket":
    default:
      return "Cricket";
  }
}

function entityTypeForSport(sportKey: MatchSeed["sportKey"]) {
  switch (sportKey) {
    case "formula1":
      return "driver";
    case "football":
      return "club";
    case "basketball":
      return "franchise";
    case "cricket":
    default:
      return "franchise";
  }
}

function splitCompetitionAndSeason(competitionName: string, startTime: string) {
  const yearMatch = competitionName.match(/(20\d{2})/);
  const inferredYear = yearMatch ? Number(yearMatch[1]) : new Date(startTime).getUTCFullYear();
  const baseName = competitionName.replace(/\s*(20\d{2})\s*$/, "").trim() || competitionName.trim();

  return {
    baseName,
    seasonName: yearMatch ? competitionName.trim() : `${baseName} ${inferredYear}`,
    year: inferredYear
  };
}

async function ensureSport(sportKey: MatchSeed["sportKey"]) {
  const { data: existing } = await supabase.from("sports").select("id").eq("key", sportKey).maybeSingle();
  if (existing) {
    return existing.id as string;
  }

  const { data, error } = await supabase
    .from("sports")
    .insert({ key: sportKey, name: sportNameFromKey(sportKey) })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id as string;
}

async function ensureTeam(sportId: string, sportKey: MatchSeed["sportKey"], seed: TeamSeed) {
  const slug = seed.fullName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  const { data: existing } = await supabase.from("teams").select("id").eq("slug", slug).maybeSingle();
  if (existing) {
    return { id: existing.id as string, ...seed };
  }

  const { data, error } = await supabase
    .from("teams")
    .insert({
      sport_id: sportId,
      slug,
      full_name: seed.fullName,
      short_name: seed.shortName,
      entity_type: entityTypeForSport(sportKey),
      primary_color: seed.primaryColor,
      secondary_color: seed.secondaryColor
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return { id: data.id as string, ...seed };
}

async function ensureCompetitionAndSeason(sportId: string, competitionName: string, startTime: string) {
  const { baseName, seasonName, year } = splitCompetitionAndSeason(competitionName, startTime);
  const competitionSlug = slugify(baseName);
  const seasonSlug = `${competitionSlug}-${year}`;

  const { data: existingCompetition } = await supabase
    .from("competitions")
    .select("id")
    .eq("slug", competitionSlug)
    .eq("sport_id", sportId)
    .maybeSingle();

  const competitionId =
    existingCompetition?.id ??
    (
      await supabase
        .from("competitions")
        .insert({
          sport_id: sportId,
          slug: competitionSlug,
          name: baseName,
          short_name: baseName.slice(0, 6).toUpperCase(),
          category: "season",
          is_featured: true
        })
        .select("id")
        .single()
    ).data?.id;

  if (!competitionId) {
    throw new Error(`Competition missing for ${competitionName}`);
  }

  const { data: existingSeason } = await supabase
    .from("seasons")
    .select("id")
    .eq("slug", seasonSlug)
    .eq("competition_id", competitionId)
    .maybeSingle();

  const seasonId =
    existingSeason?.id ??
    (
      await supabase
        .from("seasons")
        .insert({
          competition_id: competitionId,
          slug: seasonSlug,
          name: seasonName,
          year,
          status: "active",
          is_current: true
        })
        .select("id")
        .single()
    ).data?.id;

  if (!seasonId) {
    throw new Error(`Season missing for ${competitionName}`);
  }

  return { competitionId, seasonId };
}

async function ensureMatch(sportId: string, seed: MatchSeed) {
  const dateSlug = seed.startTime.slice(0, 10);
  const slug = buildMatchSlug(seed.teams[0].fullName, seed.teams[1].fullName, dateSlug);
  const title = `${seed.teams[0].shortName} vs ${seed.teams[1].shortName}`;
  const { competitionId, seasonId } = await ensureCompetitionAndSeason(sportId, seed.competitionName, seed.startTime);

  const { data: existing } = await supabase.from("matches").select("id, slug").eq("slug", slug).maybeSingle();
  if (existing) {
    const { error: updateError } = await supabase
      .from("matches")
      .update({
        sport_id: sportId,
        competition_id: competitionId,
        season_id: seasonId,
        competition_name: seed.competitionName,
        venue: seed.venue,
        start_time: seed.startTime,
        lock_time: seed.lockTime,
        status: seed.status,
        settlement_status: seed.settlementStatus,
        stage_label: seed.stageLabel ?? null,
        featured_rank: seed.featuredRank ?? null,
        prediction_template_key: seed.predictionTemplateKey ?? "classic_social",
        external_provider_key: seed.providerKey ?? "manual",
        external_event_id: seed.externalEventId ?? null
      })
      .eq("id", existing.id);

    if (updateError) {
      throw updateError;
    }

    await supabase.from("event_sync_state").upsert(
      {
        match_id: existing.id,
        provider_key: seed.providerKey ?? "manual",
        external_event_id: seed.externalEventId ?? null,
        auto_settle_supported:
          seed.sportKey === "cricket" &&
          seed.predictionTemplateKey === "provider_ready" &&
          (seed.providerKey ?? "manual") !== "manual",
        sync_status: (seed.providerKey ?? "manual") === "manual" ? "manual" : "configured"
      },
      { onConflict: "match_id" }
    );

    return { id: existing.id as string, slug };
  }

  const teamA = await ensureTeam(sportId, seed.sportKey, seed.teams[0]);
  const teamB = await ensureTeam(sportId, seed.sportKey, seed.teams[1]);

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .insert({
      sport_id: sportId,
      competition_id: competitionId,
      season_id: seasonId,
      slug,
      title,
      competition_name: seed.competitionName,
      venue: seed.venue,
      start_time: seed.startTime,
      lock_time: seed.lockTime,
      status: seed.status,
      settlement_status: seed.settlementStatus,
      stage_label: seed.stageLabel ?? null,
      featured_rank: seed.featuredRank ?? null,
      prediction_template_key: seed.predictionTemplateKey ?? "classic_social",
      external_provider_key: seed.providerKey ?? "manual",
      external_event_id: seed.externalEventId ?? null
    })
    .select("id")
    .single();

  if (matchError) {
    throw matchError;
  }

  await supabase.from("match_teams").insert([
    { match_id: match.id, team_id: teamA.id, role: "side_a" },
    { match_id: match.id, team_id: teamB.id, role: "side_b" }
  ]);

  const questions = buildDefaultQuestionsBySport(seed.sportKey, [
    { id: teamA.id, shortName: teamA.shortName, fullName: teamA.fullName },
    { id: teamB.id, shortName: teamB.shortName, fullName: teamB.fullName }
  ], seed.predictionTemplateKey ?? "classic_social");

  const { data: questionRows, error: questionError } = await supabase
    .from("prediction_questions")
    .insert(
      questions.map((question) => ({
        sport_id: sportId,
        match_id: match.id,
        key: question.key,
        prompt: question.prompt,
        description: question.description,
        answer_type: question.answerType,
        sort_order: question.sortOrder,
        is_required: true
      }))
    )
    .select("id, key");

  if (questionError) {
    throw questionError;
  }

  const optionPayload = questions.flatMap((question) => {
    const questionId = questionRows?.find((row) => row.key === question.key)?.id;
    if (!questionId) {
      throw new Error(`Missing question row for ${question.key}`);
    }

    return question.options.map((option) => ({
      question_id: questionId,
      label: option.label,
      value: option.value,
      sort_order: option.sortOrder
    }));
  });

  const { error: optionError } = await supabase.from("prediction_options").insert(optionPayload);

  if (optionError) {
    throw optionError;
  }

  await supabase.from("event_sync_state").upsert(
    {
      match_id: match.id,
      provider_key: seed.providerKey ?? "manual",
      external_event_id: seed.externalEventId ?? null,
      auto_settle_supported:
        seed.sportKey === "cricket" &&
        seed.predictionTemplateKey === "provider_ready" &&
        (seed.providerKey ?? "manual") !== "manual",
      sync_status: (seed.providerKey ?? "manual") === "manual" ? "manual" : "configured"
    },
    { onConflict: "match_id" }
  );

  return { id: match.id as string, slug };
}

async function getMatchMeta(matchId: string) {
  const { data, error } = await supabase
    .from("matches")
    .select("id, slug, sport_id, competition_id, season_id")
    .eq("id", matchId)
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id as string,
    slug: data.slug as string,
    sportId: data.sport_id as string,
    competitionId: data.competition_id as string | null,
    seasonId: data.season_id as string | null
  };
}

function miniPickStatus(opensAt: string, lockAt: string, resolvedValue?: string) {
  if (resolvedValue) {
    return "settled";
  }

  const now = Date.now();
  const opens = new Date(opensAt).getTime();
  const locks = new Date(lockAt).getTime();

  if (locks <= now) {
    return "locked";
  }

  if (opens <= now) {
    return "open";
  }

  return "scheduled";
}

async function ensureMiniPickWindow(seed: MiniPickSeed) {
  const templates = buildMiniPickTemplatesBySport(seed.sportKey, [
    { id: `seed-${seed.teams[0].shortName}`, shortName: seed.teams[0].shortName, fullName: seed.teams[0].fullName },
    { id: `seed-${seed.teams[1].shortName}`, shortName: seed.teams[1].shortName, fullName: seed.teams[1].fullName }
  ]);
  const template = templates.find((entry) => entry.key === seed.templateKey);

  if (!template) {
    throw new Error(`Missing mini-pick template ${seed.templateKey}`);
  }

  const { data: templateRow, error: templateError } = await supabase
    .from("mini_pick_templates")
    .upsert(
      {
        sport_id: seed.sportId,
        key: template.key,
        name: template.name,
        description: template.description,
        default_prompt: template.prompt,
        default_options: template.options
      },
      { onConflict: "sport_id,key" }
    )
    .select("id")
    .single();

  if (templateError) {
    throw templateError;
  }

  const existing = await supabase
    .from("mini_pick_windows")
    .select("id")
    .eq("match_id", seed.matchId)
    .eq("key", seed.templateKey)
    .maybeSingle();

  const status = miniPickStatus(seed.opensAt, seed.lockAt, seed.resolvedValue);
  const windowId =
    existing.data?.id ??
    (
      await supabase
        .from("mini_pick_windows")
        .insert({
          match_id: seed.matchId,
          template_id: templateRow.id,
          key: template.key,
          title: template.name,
          prompt: template.prompt,
          description: template.description,
          opens_at: seed.opensAt,
          lock_at: seed.lockAt,
          status,
          stake_text: seed.stakeText ?? null
        })
        .select("id")
        .single()
    ).data?.id;

  if (!windowId) {
    throw new Error(`Mini-pick window missing for ${template.key}`);
  }

  if (existing.data?.id) {
    const { error: updateError } = await supabase
      .from("mini_pick_windows")
      .update({
        template_id: templateRow.id,
        title: template.name,
        prompt: template.prompt,
        description: template.description,
        opens_at: seed.opensAt,
        lock_at: seed.lockAt,
        status,
        stake_text: seed.stakeText ?? null,
        resolved_option_id: null,
        settled_at: null,
        resolution_note: null
      })
      .eq("id", windowId);

    if (updateError) {
      throw updateError;
    }

    await supabase.from("mini_pick_entries").delete().eq("window_id", windowId);
    await supabase.from("mini_pick_options").delete().eq("window_id", windowId);
  }

  const { data: options, error: optionError } = await supabase
    .from("mini_pick_options")
    .insert(
      template.options.map((option, index) => ({
        window_id: windowId,
        label: option.label,
        value: option.value,
        sort_order: index + 1
      }))
    )
    .select("id, value");

  if (optionError) {
    throw optionError;
  }

  const optionByValue = new Map((options ?? []).map((option) => [option.value as string, option.id as string]));

  for (const entry of seed.entries ?? []) {
    const guest = await ensureGuestProfile(entry.displayName);
    const optionId = optionByValue.get(entry.optionValue);
    if (!optionId) {
      continue;
    }

    const { error: entryError } = await supabase.from("mini_pick_entries").upsert(
      {
        window_id: windowId,
        guest_profile_id: guest.id,
        display_name: guest.displayName,
        selected_option_id: optionId,
        is_correct: seed.resolvedValue ? entry.optionValue === seed.resolvedValue : null,
        points_awarded: seed.resolvedValue ? (entry.optionValue === seed.resolvedValue ? 1 : 0) : 0
      },
      { onConflict: "window_id,guest_profile_id" }
    );

    if (entryError) {
      throw entryError;
    }
  }

  if (seed.resolvedValue) {
    const resolvedOptionId = optionByValue.get(seed.resolvedValue);
    if (!resolvedOptionId) {
      throw new Error(`Resolved mini-pick option missing for ${seed.resolvedValue}`);
    }

    const { error: settleError } = await supabase
      .from("mini_pick_windows")
      .update({
        resolved_option_id: resolvedOptionId,
        settled_at: new Date().toISOString(),
        status: "settled",
        resolution_note: seed.resolutionNote ?? null
      })
      .eq("id", windowId);

    if (settleError) {
      throw settleError;
    }
  }
}

async function ensureGuestProfile(displayName: string) {
  const { data: existing } = await supabase
    .from("guest_profiles")
    .select("id, display_name")
    .eq("display_name", displayName)
    .maybeSingle();

  if (existing) {
    return { id: existing.id as string, displayName: existing.display_name as string };
  }

  const { data, error } = await supabase
    .from("guest_profiles")
    .insert({ display_name: displayName })
    .select("id, display_name")
    .single();

  if (error) {
    throw error;
  }

  return { id: data.id as string, displayName: data.display_name as string };
}

async function getQuestionMap(matchId: string) {
  const { data, error } = await supabase
    .from("prediction_questions")
    .select("id, key, prediction_options(id, value, label)")
    .eq("match_id", matchId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return new Map(
    (data ?? []).map((question) => [
      question.key,
      {
        id: question.id as string,
        options: (question.prediction_options ?? []).map((option) => ({
          id: option.id as string,
          value: option.value as string,
          label: option.label as string
        }))
      }
    ])
  );
}

async function ensureChallenge(matchId: string, slug: string, title: string, stakeText: string, shareMessage: string) {
  const { data: existing } = await supabase.from("challenges").select("id, slug").eq("slug", slug).maybeSingle();
  if (existing) {
    return { id: existing.id as string, slug };
  }

  const { data, error } = await supabase
    .from("challenges")
    .insert({
      match_id: matchId,
      slug,
      title,
      stake_text: stakeText,
      share_message: shareMessage,
      status: "open",
      visibility: "public"
    })
    .select("id, slug")
    .single();

  if (error) {
    throw error;
  }

  return { id: data.id as string, slug: data.slug as string };
}

async function ensureParticipant(args: {
  challengeId: string;
  guestProfileId: string;
  displayName: string;
  publicCode: string;
  isCreator: boolean;
  totalPoints?: number;
  rank?: number | null;
}) {
  const { data: existing } = await supabase
    .from("challenge_participants")
    .select("id")
    .eq("challenge_id", args.challengeId)
    .eq("guest_profile_id", args.guestProfileId)
    .maybeSingle();

  if (existing) {
    return existing.id as string;
  }

  const { data, error } = await supabase
    .from("challenge_participants")
    .insert({
      challenge_id: args.challengeId,
      guest_profile_id: args.guestProfileId,
      display_name: args.displayName,
      public_code: args.publicCode,
      is_creator: args.isCreator,
      entry_status: "submitted",
      submitted_at: new Date().toISOString(),
      total_points: args.totalPoints ?? 0,
      rank: args.rank ?? null
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id as string;
}

async function upsertPredictions(
  participantId: string,
  questionMap: Map<string, { id: string; options: Array<{ id: string; value: string }> }>,
  answers: Record<string, string>,
  scoring?: Record<string, { correct: boolean; points: number }>
) {
  const payload = Object.entries(answers).map(([questionKey, optionValue]) => {
    const question = questionMap.get(questionKey);
    if (!question) {
      throw new Error(`Question not found: ${questionKey}`);
    }

    const option = question.options.find((entry) => entry.value === optionValue);
    if (!option) {
      throw new Error(`Option not found for ${questionKey}: ${optionValue}`);
    }

    return {
      participant_id: participantId,
      question_id: question.id,
      selected_option_id: option.id,
      locked_at: new Date().toISOString(),
      is_correct: scoring?.[questionKey]?.correct ?? null,
      points_awarded: scoring?.[questionKey]?.points ?? 0
    };
  });

  const { error } = await supabase.from("participant_predictions").upsert(payload, {
    onConflict: "participant_id,question_id"
  });

  if (error) {
    throw error;
  }
}

async function ensureOutcome(matchId: string, questionMap: Map<string, { id: string; options: Array<{ id: string; value: string }> }>, answers: Record<string, string>) {
  const { data: outcome, error: outcomeError } = await supabase
    .from("match_outcomes")
    .upsert(
      {
        match_id: matchId,
        settled_at: new Date().toISOString(),
        notes: "Seeded from demo script."
      },
      { onConflict: "match_id" }
    )
    .select("id")
    .single();

  if (outcomeError) {
    throw outcomeError;
  }

  const payload = Object.entries(answers).map(([questionKey, optionValue]) => {
    const question = questionMap.get(questionKey);
    if (!question) {
      throw new Error(`Question not found for outcome: ${questionKey}`);
    }

    const option = question.options.find((entry) => entry.value === optionValue);
    if (!option) {
      throw new Error(`Outcome option not found for ${questionKey}: ${optionValue}`);
    }

    return {
      match_outcome_id: outcome.id,
      question_id: question.id,
      resolved_option_id: option.id
    };
  });

  await supabase.from("match_outcome_answers").delete().eq("match_outcome_id", outcome.id);
  const { error: answerError } = await supabase.from("match_outcome_answers").insert(payload);

  if (answerError) {
    throw answerError;
  }
}

async function upsertScore(challengeId: string, participantId: string, totalPoints: number, questionCount: number, rank: number) {
  const { error: scoreError } = await supabase.from("challenge_scores").upsert(
    {
      challenge_id: challengeId,
      participant_id: participantId,
      correct_count: totalPoints,
      total_points: totalPoints,
      accuracy_pct: questionCount ? (totalPoints / questionCount) * 100 : 0,
      result_rank: rank,
      calculated_at: new Date().toISOString()
    },
    { onConflict: "challenge_id,participant_id" }
  );

  if (scoreError) {
    throw scoreError;
  }

  const { error: participantError } = await supabase
    .from("challenge_participants")
    .update({ total_points: totalPoints, rank })
    .eq("id", participantId);

  if (participantError) {
    throw participantError;
  }
}

async function ensureBadge(args: {
  key: string;
  name: string;
  description: string;
  rarity: "common" | "rare" | "epic";
  themeColor: string;
}) {
  const { data: existing } = await supabase.from("badges").select("id").eq("key", args.key).maybeSingle();
  if (existing) {
    return existing.id as string;
  }

  const { data, error } = await supabase
    .from("badges")
    .insert({
      key: args.key,
      name: args.name,
      description: args.description,
      rarity: args.rarity,
      theme_color: args.themeColor
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id as string;
}

async function ensureGroup(args: {
  slug: string;
  name: string;
  description: string;
  type: "private" | "office" | "college" | "community" | "creator";
  visibility: "private" | "invite_only" | "public";
  sportId: string;
  competitionId: string | null;
  seasonId: string | null;
  creatorGuestProfileId: string;
  headline: string;
  stakeTemplate: string;
  punishmentTemplate: string;
}) {
  const { data: existing } = await supabase.from("groups").select("id, slug").eq("slug", args.slug).maybeSingle();
  if (existing) {
    return { id: existing.id as string, slug: existing.slug as string };
  }

  const { data, error } = await supabase
    .from("groups")
    .insert({
      slug: args.slug,
      name: args.name,
      description: args.description,
      group_type: args.type,
      visibility: args.visibility,
      sport_id: args.sportId,
      competition_id: args.competitionId,
      season_id: args.seasonId,
      creator_guest_profile_id: args.creatorGuestProfileId,
      headline: args.headline,
      stake_template: args.stakeTemplate,
      punishment_template: args.punishmentTemplate
    })
    .select("id, slug")
    .single();

  if (error) {
    throw error;
  }

  return { id: data.id as string, slug: data.slug as string };
}

async function ensureGroupMember(args: {
  groupId: string;
  guestProfileId: string;
  displayName: string;
  role: "owner" | "admin" | "member";
}) {
  const { data: existing } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", args.groupId)
    .eq("guest_profile_id", args.guestProfileId)
    .maybeSingle();

  if (existing) {
    return existing.id as string;
  }

  const { data, error } = await supabase
    .from("group_members")
    .insert({
      group_id: args.groupId,
      guest_profile_id: args.guestProfileId,
      display_name: args.displayName,
      role: args.role
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id as string;
}

async function linkChallengeToGroup(groupId: string, seasonId: string | null, challengeId: string) {
  const { error } = await supabase.from("group_challenges").upsert(
    {
      group_id: groupId,
      season_id: seasonId,
      challenge_id: challengeId
    },
    { onConflict: "group_id,challenge_id" }
  );

  if (error) {
    throw error;
  }
}

async function upsertSeasonStanding(args: {
  groupId: string;
  seasonId: string;
  groupMemberId: string;
  displayName: string;
  challengesPlayed: number;
  wins: number;
  losses: number;
  totalPoints: number;
  accuracyPct: number;
  contrarianBonus: number;
  reputationScore: number;
  rank: number;
}) {
  const { error } = await supabase.from("season_standings").upsert(
    {
      group_id: args.groupId,
      season_id: args.seasonId,
      group_member_id: args.groupMemberId,
      display_name: args.displayName,
      challenges_played: args.challengesPlayed,
      wins: args.wins,
      losses: args.losses,
      draws: 0,
      total_points: args.totalPoints,
      accuracy_pct: args.accuracyPct,
      contrarian_bonus: args.contrarianBonus,
      reputation_score: args.reputationScore,
      rank: args.rank
    },
    { onConflict: "group_id,season_id,group_member_id" }
  );

  if (error) {
    throw error;
  }
}

async function upsertProfileStat(args: {
  guestProfileId: string;
  displayName: string;
  bestSportId: string | null;
  totalChallengesPlayed: number;
  totalWins: number;
  totalLosses: number;
  totalCorrectPicks: number;
  totalPossiblePicks: number;
  contrarianHits: number;
  cleanSweeps: number;
  currentStreak: number;
  longestStreak: number;
  rivalsBeaten: number;
  leaguesJoined: number;
}) {
  const winRate = args.totalChallengesPlayed ? (args.totalWins / args.totalChallengesPlayed) * 100 : 0;
  const accuracyPct = args.totalPossiblePicks ? (args.totalCorrectPicks / args.totalPossiblePicks) * 100 : 0;
  const reputationScore = calculateReputationScore({
    accuracyPct,
    totalChallengesPlayed: args.totalChallengesPlayed,
    contrarianHits: args.contrarianHits,
    currentStreak: args.currentStreak,
    longestStreak: args.longestStreak,
    totalWins: args.totalWins,
    leaguesJoined: args.leaguesJoined
  });

  const { data: existing } = await supabase
    .from("profile_stats")
    .select("id")
    .eq("guest_profile_id", args.guestProfileId)
    .maybeSingle();

  const payload = {
    guest_profile_id: args.guestProfileId,
    display_name: args.displayName,
    best_sport_id: args.bestSportId,
    total_challenges_played: args.totalChallengesPlayed,
    total_wins: args.totalWins,
    total_losses: args.totalLosses,
    total_correct_picks: args.totalCorrectPicks,
    total_possible_picks: args.totalPossiblePicks,
    win_rate: winRate,
    accuracy_pct: accuracyPct,
    contrarian_hits: args.contrarianHits,
    clean_sweeps: args.cleanSweeps,
    current_streak: args.currentStreak,
    longest_streak: args.longestStreak,
    rivals_beaten: args.rivalsBeaten,
    leagues_joined: args.leaguesJoined,
    reputation_score: reputationScore
  };

  const query = existing
    ? supabase.from("profile_stats").update(payload).eq("id", existing.id)
    : supabase.from("profile_stats").insert(payload);

  const { error } = await query;
  if (error) {
    throw error;
  }
}

async function awardProfileBadge(args: {
  badgeId: string;
  guestProfileId: string;
  challengeId: string;
  groupId?: string | null;
  dedupeKey: string;
  reason: string;
}) {
  const { error } = await supabase.from("profile_badges").upsert(
    {
      badge_id: args.badgeId,
      guest_profile_id: args.guestProfileId,
      awarded_for_challenge_id: args.challengeId,
      awarded_for_group_id: args.groupId ?? null,
      dedupe_key: args.dedupeKey,
      reason: args.reason
    },
    { onConflict: "dedupe_key" }
  );

  if (error) {
    throw error;
  }
}

async function createNotification(args: {
  guestProfileId: string;
  type:
    | "challenge_live"
    | "rival_joined"
    | "match_starting_soon"
    | "picks_locking_soon"
    | "results_live"
    | "you_won"
    | "you_got_cooked"
    | "season_table_updated"
    | "room_challenge_live"
    | "mini_pick_live"
    | "mini_pick_settled";
  title: string;
  body: string;
  href?: string;
}) {
  const { error } = await supabase.from("notifications").insert({
    guest_profile_id: args.guestProfileId,
    type: args.type,
    title: args.title,
    body: args.body,
    href: args.href ?? null
  });

  if (error) {
    throw error;
  }
}

async function main() {
  const cricketSportId = await ensureSport("cricket");
  const footballSportId = await ensureSport("football");
  const formulaSportId = await ensureSport("formula1");
  const basketballSportId = await ensureSport("basketball");

  const futureMatch = await ensureMatch(cricketSportId, {
    sportKey: "cricket",
    competitionName: "IPL 2026",
    venue: "Wankhede Stadium, Mumbai",
    startTime: isoDaysFromNow(2, 14, 0),
    lockTime: isoDaysFromNow(2, 13, 30),
    status: "scheduled",
    settlementStatus: "pending",
    stageLabel: "Sunday faceoff",
    featuredRank: 1,
    teams: [
      {
        fullName: "Mumbai Indians",
        shortName: "MI",
        primaryColor: "#0d78ff",
        secondaryColor: "#ffd15a"
      },
      {
        fullName: "Chennai Super Kings",
        shortName: "CSK",
        primaryColor: "#f8d230",
        secondaryColor: "#1f2430"
      }
    ]
  });

  const liveMiniPickMatch = await ensureMatch(cricketSportId, {
    sportKey: "cricket",
    competitionName: "IPL 2026",
    venue: "Eden Gardens, Kolkata",
    startTime: isoDaysFromNow(0, 14, 0),
    lockTime: isoDaysFromNow(0, 13, 30),
    status: "live",
    settlementStatus: "pending",
    stageLabel: "Live mini-pick demo",
    featuredRank: 3,
    teams: [
      {
        fullName: "Kolkata Knight Riders",
        shortName: "KKR",
        primaryColor: "#6b4dff",
        secondaryColor: "#f7d24f"
      },
      {
        fullName: "Rajasthan Royals",
        shortName: "RR",
        primaryColor: "#ff73ba",
        secondaryColor: "#0c1630"
      }
    ]
  });

  await ensureMatch(cricketSportId, {
    sportKey: "cricket",
    competitionName: "IPL 2026",
    venue: "M. Chinnaswamy Stadium, Bengaluru",
    startTime: isoDaysFromNow(4, 14, 0),
    lockTime: isoDaysFromNow(4, 13, 30),
    status: "scheduled",
    settlementStatus: "pending",
    stageLabel: "Night game",
    featuredRank: 2,
    teams: [
      {
        fullName: "Royal Challengers Bengaluru",
        shortName: "RCB",
        primaryColor: "#ff3f3f",
        secondaryColor: "#0e1014"
      },
      {
        fullName: "Gujarat Titans",
        shortName: "GT",
        primaryColor: "#41a4ff",
        secondaryColor: "#08111f"
      }
    ]
  });

  const providerReadyMatch = await ensureMatch(cricketSportId, {
    sportKey: "cricket",
    predictionTemplateKey: "provider_ready",
    providerKey: "thesportsdb",
    externalEventId: "1854457",
    competitionName: "Cricket World Cup 2023",
    venue: "M. A. Chidambaram Stadium, Chennai",
    startTime: "2023-10-08T09:30:00.000Z",
    lockTime: "2023-10-08T09:00:00.000Z",
    status: "completed",
    settlementStatus: "pending",
    stageLabel: "Provider auto-settle demo",
    teams: [
      {
        fullName: "Australia Cricket",
        shortName: "AUS",
        primaryColor: "#ffbf3c",
        secondaryColor: "#1d2f4f"
      },
      {
        fullName: "India Cricket",
        shortName: "IND",
        primaryColor: "#41a4ff",
        secondaryColor: "#ff9d2f"
      }
    ]
  });

  await ensureMatch(footballSportId, {
    sportKey: "football",
    competitionName: "Premier League 2026",
    venue: "Anfield, Liverpool",
    startTime: isoDaysFromNow(3, 17, 0),
    lockTime: isoDaysFromNow(3, 16, 30),
    status: "scheduled",
    settlementStatus: "pending",
    stageLabel: "Derby watch",
    featuredRank: 1,
    teams: [
      {
        fullName: "Liverpool",
        shortName: "LIV",
        primaryColor: "#d72f2f",
        secondaryColor: "#f6f1ef"
      },
      {
        fullName: "Arsenal",
        shortName: "ARS",
        primaryColor: "#ff5555",
        secondaryColor: "#f0f0f0"
      }
    ]
  });

  const footballLiveMatch = await ensureMatch(footballSportId, {
    sportKey: "football",
    competitionName: "Premier League 2026",
    venue: "Tottenham Hotspur Stadium, London",
    startTime: isoDaysFromNow(0, 18, 0),
    lockTime: isoDaysFromNow(0, 17, 45),
    status: "live",
    settlementStatus: "pending",
    stageLabel: "Live football mini-pick demo",
    featuredRank: 2,
    teams: [
      {
        fullName: "Tottenham Hotspur",
        shortName: "TOT",
        primaryColor: "#f4f6fb",
        secondaryColor: "#11192c"
      },
      {
        fullName: "Chelsea",
        shortName: "CHE",
        primaryColor: "#2962ff",
        secondaryColor: "#e8edf8"
      }
    ]
  });

  await ensureMatch(formulaSportId, {
    sportKey: "formula1",
    competitionName: "Formula 1 2026",
    venue: "Bahrain International Circuit",
    startTime: isoDaysFromNow(5, 12, 0),
    lockTime: isoDaysFromNow(5, 11, 30),
    status: "scheduled",
    settlementStatus: "pending",
    stageLabel: "Race weekend duel",
    featuredRank: 1,
    teams: [
      {
        fullName: "Max Verstappen",
        shortName: "VER",
        primaryColor: "#416dff",
        secondaryColor: "#ff9533"
      },
      {
        fullName: "Charles Leclerc",
        shortName: "LEC",
        primaryColor: "#ff4d4d",
        secondaryColor: "#f2f2f2"
      }
    ]
  });

  await ensureMatch(basketballSportId, {
    sportKey: "basketball",
    competitionName: "NBA 2026",
    venue: "Chase Center, San Francisco",
    startTime: isoDaysFromNow(2, 3, 0),
    lockTime: isoDaysFromNow(2, 2, 30),
    status: "scheduled",
    settlementStatus: "pending",
    stageLabel: "West spotlight",
    featuredRank: 1,
    teams: [
      {
        fullName: "Golden State Warriors",
        shortName: "GSW",
        primaryColor: "#4e8df5",
        secondaryColor: "#f7c948"
      },
      {
        fullName: "Los Angeles Lakers",
        shortName: "LAL",
        primaryColor: "#7d56ff",
        secondaryColor: "#f5c947"
      }
    ]
  });

  const settledMatch = await ensureMatch(cricketSportId, {
    sportKey: "cricket",
    competitionName: "Champions Trophy Warm-Up",
    venue: "Narendra Modi Stadium, Ahmedabad",
    startTime: isoDaysFromNow(-3, 9, 30),
    lockTime: isoDaysFromNow(-3, 9, 0),
    status: "completed",
    settlementStatus: "settled",
    stageLabel: "Warm-up receipts",
    teams: [
      {
        fullName: "India",
        shortName: "IND",
        primaryColor: "#41a4ff",
        secondaryColor: "#ff9d2f"
      },
      {
        fullName: "Australia",
        shortName: "AUS",
        primaryColor: "#ffbf3c",
        secondaryColor: "#1d2f4f"
      }
    ]
  });

  const futureQuestionMap = await getQuestionMap(futureMatch.id);
  const providerQuestionMap = await getQuestionMap(providerReadyMatch.id);
  const settledQuestionMap = await getQuestionMap(settledMatch.id);

  const aman = await ensureGuestProfile("Aman");
  const riya = await ensureGuestProfile("Riya");
  const kabir = await ensureGuestProfile("Kabir");

  const officeDerby = await ensureChallenge(
    futureMatch.id,
    "mi-vs-csk-office-derby",
    "MI vs CSK office derby",
    "Loser owes biryani",
    "I’ve locked my five. Take the other side if you dare."
  );

  const providerReadyChallenge = await ensureChallenge(
    providerReadyMatch.id,
    "world-cup-provider-auto-board",
    "World Cup provider auto board",
    "Loser posts the scoreboard apology",
    "This board is wired to auto-settle from the provider feed."
  );
  await supabase.from("challenges").update({ status: "locked" }).eq("id", providerReadyChallenge.id);

  const amanParticipant = await ensureParticipant({
    challengeId: officeDerby.id,
    guestProfileId: aman.id,
    displayName: aman.displayName,
    publicCode: "seed-aman-1",
    isCreator: true
  });

  const riyaParticipant = await ensureParticipant({
    challengeId: officeDerby.id,
    guestProfileId: riya.id,
    displayName: riya.displayName,
    publicCode: "seed-riya-1",
    isCreator: false
  });

  const kabirParticipant = await ensureParticipant({
    challengeId: officeDerby.id,
    guestProfileId: kabir.id,
    displayName: kabir.displayName,
    publicCode: "seed-kabir-1",
    isCreator: false
  });

  const amanProviderParticipant = await ensureParticipant({
    challengeId: providerReadyChallenge.id,
    guestProfileId: aman.id,
    displayName: aman.displayName,
    publicCode: "seed-provider-1",
    isCreator: true
  });

  const riyaProviderParticipant = await ensureParticipant({
    challengeId: providerReadyChallenge.id,
    guestProfileId: riya.id,
    displayName: riya.displayName,
    publicCode: "seed-provider-2",
    isCreator: false
  });

  await upsertPredictions(amanParticipant, futureQuestionMap, {
    toss_winner: "mi",
    top_scorer: "mi",
    total_runs_range: "321_380",
    method_of_victory: "successful_chase",
    winning_team: "mi"
  });

  await upsertPredictions(riyaParticipant, futureQuestionMap, {
    toss_winner: "csk",
    top_scorer: "csk",
    total_runs_range: "260_320",
    method_of_victory: "defend_total",
    winning_team: "csk"
  });

  await upsertPredictions(kabirParticipant, futureQuestionMap, {
    toss_winner: "mi",
    top_scorer: "csk",
    total_runs_range: "321_380",
    method_of_victory: "super_over",
    winning_team: "mi"
  });

  await upsertPredictions(amanProviderParticipant, providerQuestionMap, {
    winning_team: "side_b",
    total_runs_range: "400_plus",
    side_a_score_range: "160_199",
    side_b_score_range: "200_239",
    winning_margin_range: "0_10"
  });

  await upsertPredictions(riyaProviderParticipant, providerQuestionMap, {
    winning_team: "side_a",
    total_runs_range: "350_399",
    side_a_score_range: "200_239",
    side_b_score_range: "160_199",
    winning_margin_range: "11_30"
  });

  const sana = await ensureGuestProfile("Sana");
  const dev = await ensureGuestProfile("Dev");
  const ishan = await ensureGuestProfile("Ishan");

  const settledChallenge = await ensureChallenge(
    settledMatch.id,
    "ind-vs-aus-result-receipts",
    "India vs Australia receipts",
    "Tea and smugness",
    "Post-match excuses won’t help. Receipts only."
  );

  await supabase.from("challenges").update({ status: "settled" }).eq("id", settledChallenge.id);

  const settledOutcomeAnswers = {
    toss_winner: "ind",
    top_scorer: "ind",
    total_runs_range: "321_380",
    method_of_victory: "defend_total",
    winning_team: "ind"
  };

  await ensureOutcome(settledMatch.id, settledQuestionMap, settledOutcomeAnswers);

  const sanaScoreCard = {
    toss_winner: { correct: true, points: 1 },
    top_scorer: { correct: true, points: 1 },
    total_runs_range: { correct: true, points: 1 },
    method_of_victory: { correct: true, points: 1 },
    winning_team: { correct: true, points: 1 }
  };

  const devScoreCard = {
    toss_winner: { correct: false, points: 0 },
    top_scorer: { correct: true, points: 1 },
    total_runs_range: { correct: false, points: 0 },
    method_of_victory: { correct: true, points: 1 },
    winning_team: { correct: false, points: 0 }
  };

  const ishanScoreCard = {
    toss_winner: { correct: true, points: 1 },
    top_scorer: { correct: false, points: 0 },
    total_runs_range: { correct: true, points: 1 },
    method_of_victory: { correct: false, points: 0 },
    winning_team: { correct: true, points: 1 }
  };

  const sanaParticipant = await ensureParticipant({
    challengeId: settledChallenge.id,
    guestProfileId: sana.id,
    displayName: sana.displayName,
    publicCode: "seed-sana-1",
    isCreator: true,
    totalPoints: 5,
    rank: 1
  });

  const devParticipant = await ensureParticipant({
    challengeId: settledChallenge.id,
    guestProfileId: dev.id,
    displayName: dev.displayName,
    publicCode: "seed-dev-1",
    isCreator: false,
    totalPoints: 2,
    rank: 3
  });

  const ishanParticipant = await ensureParticipant({
    challengeId: settledChallenge.id,
    guestProfileId: ishan.id,
    displayName: ishan.displayName,
    publicCode: "seed-ishan-1",
    isCreator: false,
    totalPoints: 3,
    rank: 2
  });

  await upsertPredictions(
    sanaParticipant,
    settledQuestionMap,
    {
      toss_winner: "ind",
      top_scorer: "ind",
      total_runs_range: "321_380",
      method_of_victory: "defend_total",
      winning_team: "ind"
    },
    sanaScoreCard
  );

  await upsertPredictions(
    devParticipant,
    settledQuestionMap,
    {
      toss_winner: "aus",
      top_scorer: "ind",
      total_runs_range: "260_320",
      method_of_victory: "defend_total",
      winning_team: "aus"
    },
    devScoreCard
  );

  await upsertPredictions(
    ishanParticipant,
    settledQuestionMap,
    {
      toss_winner: "ind",
      top_scorer: "aus",
      total_runs_range: "321_380",
      method_of_victory: "successful_chase",
      winning_team: "ind"
    },
    ishanScoreCard
  );

  await upsertScore(settledChallenge.id, sanaParticipant, 5, 5, 1);
  await upsertScore(settledChallenge.id, ishanParticipant, 3, 5, 2);
  await upsertScore(settledChallenge.id, devParticipant, 2, 5, 3);

  const futureMatchMeta = await getMatchMeta(futureMatch.id);
  const liveMiniPickMatchMeta = await getMatchMeta(liveMiniPickMatch.id);
  const footballLiveMatchMeta = await getMatchMeta(footballLiveMatch.id);
  const settledMatchMeta = await getMatchMeta(settledMatch.id);

  const loneWolfBadgeId = await ensureBadge({
    key: "lone_wolf",
    name: "Lone Wolf",
    description: "Only one person backed the pick and it still landed.",
    rarity: "rare",
    themeColor: "#ffbf3c"
  });

  const contrarianBadgeId = await ensureBadge({
    key: "contrarian_hit",
    name: "Contrarian Hit",
    description: "Went against the room and still looked smart after settlement.",
    rarity: "rare",
    themeColor: "#41a4ff"
  });

  const cleanSweepBadgeId = await ensureBadge({
    key: "clean_sweep",
    name: "Clean Sweep",
    description: "Five picks. Five hits. No excuses left in the chat.",
    rarity: "epic",
    themeColor: "#23d18b"
  });

  const tableTopperBadgeId = await ensureBadge({
    key: "table_topper",
    name: "Table Topper",
    description: "Finished first on a settled leaderboard.",
    rarity: "common",
    themeColor: "#ffe083"
  });

  const officeLeague = await ensureGroup({
    slug: "friday-biryani-league",
    name: "Friday Biryani League",
    description: "The office table where every bad cricket take gets remembered.",
    type: "office",
    visibility: "public",
    sportId: futureMatchMeta.sportId,
    competitionId: futureMatchMeta.competitionId,
    seasonId: futureMatchMeta.seasonId,
    creatorGuestProfileId: aman.id,
    headline: "IPL boards with consequences.",
    stakeTemplate: "Loser owes biryani",
    punishmentTemplate: "Loser posts the apology meme"
  });

  const creatorRoom = await ensureGroup({
    slug: "gully-goats-room",
    name: "Gully Goats Room",
    description: "Creator-led cricket room with sharper picks and louder bragging.",
    type: "creator",
    visibility: "public",
    sportId: futureMatchMeta.sportId,
    competitionId: futureMatchMeta.competitionId,
    seasonId: futureMatchMeta.seasonId,
    creatorGuestProfileId: aman.id,
    headline: "Receipts first, content second.",
    stakeTemplate: "Public flex",
    punishmentTemplate: "Voice-note apology"
  });

  const { competitionId: footballCompetitionId, seasonId: footballSeasonId } = await ensureCompetitionAndSeason(
    footballSportId,
    "Premier League 2026",
    isoDaysFromNow(3, 17, 0)
  );
  const footballRoom = await ensureGroup({
    slug: "kop-end-crew",
    name: "Kop End Crew",
    description: "Matchday football receipts for the loudest football friends.",
    type: "creator",
    visibility: "public",
    sportId: footballSportId,
    competitionId: footballCompetitionId,
    seasonId: footballSeasonId,
    creatorGuestProfileId: riya.id,
    headline: "Derby takes with no delete button.",
    stakeTemplate: "Winner gets timeline rights",
    punishmentTemplate: "Loser changes display pic"
  });

  const { competitionId: basketballCompetitionId, seasonId: basketballSeasonId } =
    await ensureCompetitionAndSeason(basketballSportId, "NBA 2026", isoDaysFromNow(2, 3, 0));
  const collegeLeague = await ensureGroup({
    slug: "campus-hoops-table",
    name: "Campus Hoops Table",
    description: "College basketball league built for friend groups and hostel wars.",
    type: "college",
    visibility: "public",
    sportId: basketballSportId,
    competitionId: basketballCompetitionId,
    seasonId: basketballSeasonId,
    creatorGuestProfileId: kabir.id,
    headline: "Hostel league, public consequences.",
    stakeTemplate: "Winner takes the aux",
    punishmentTemplate: "Loser sends the meme pack"
  });

  const receiptsClub = await ensureGroup({
    slug: "warmup-receipts-club",
    name: "Warm-Up Receipts Club",
    description: "A settled cricket table seeded to demonstrate season standings.",
    type: "community",
    visibility: "public",
    sportId: settledMatchMeta.sportId,
    competitionId: settledMatchMeta.competitionId,
    seasonId: settledMatchMeta.seasonId,
    creatorGuestProfileId: sana.id,
    headline: "Sharp calls, clean standings, zero revisionism.",
    stakeTemplate: "Tea and smugness",
    punishmentTemplate: "Excuse tax"
  });

  const amanGroupMember = await ensureGroupMember({
    groupId: officeLeague.id,
    guestProfileId: aman.id,
    displayName: aman.displayName,
    role: "owner"
  });
  const riyaGroupMember = await ensureGroupMember({
    groupId: officeLeague.id,
    guestProfileId: riya.id,
    displayName: riya.displayName,
    role: "member"
  });
  const kabirGroupMember = await ensureGroupMember({
    groupId: officeLeague.id,
    guestProfileId: kabir.id,
    displayName: kabir.displayName,
    role: "member"
  });

  await ensureGroupMember({
    groupId: creatorRoom.id,
    guestProfileId: aman.id,
    displayName: aman.displayName,
    role: "owner"
  });
  await ensureGroupMember({
    groupId: creatorRoom.id,
    guestProfileId: kabir.id,
    displayName: kabir.displayName,
    role: "member"
  });
  await ensureGroupMember({
    groupId: footballRoom.id,
    guestProfileId: riya.id,
    displayName: riya.displayName,
    role: "owner"
  });
  await ensureGroupMember({
    groupId: footballRoom.id,
    guestProfileId: aman.id,
    displayName: aman.displayName,
    role: "member"
  });
  await ensureGroupMember({
    groupId: collegeLeague.id,
    guestProfileId: kabir.id,
    displayName: kabir.displayName,
    role: "owner"
  });
  await ensureGroupMember({
    groupId: collegeLeague.id,
    guestProfileId: riya.id,
    displayName: riya.displayName,
    role: "member"
  });

  const sanaGroupMember = await ensureGroupMember({
    groupId: receiptsClub.id,
    guestProfileId: sana.id,
    displayName: sana.displayName,
    role: "owner"
  });
  const ishanGroupMember = await ensureGroupMember({
    groupId: receiptsClub.id,
    guestProfileId: ishan.id,
    displayName: ishan.displayName,
    role: "member"
  });
  const devGroupMember = await ensureGroupMember({
    groupId: receiptsClub.id,
    guestProfileId: dev.id,
    displayName: dev.displayName,
    role: "member"
  });

  await linkChallengeToGroup(officeLeague.id, futureMatchMeta.seasonId, officeDerby.id);
  await linkChallengeToGroup(creatorRoom.id, futureMatchMeta.seasonId, officeDerby.id);
  await linkChallengeToGroup(receiptsClub.id, settledMatchMeta.seasonId, settledChallenge.id);

  await supabase.from("challenges").update({ group_id: officeLeague.id }).eq("id", officeDerby.id);
  await supabase.from("challenges").update({ group_id: receiptsClub.id }).eq("id", settledChallenge.id);

  await awardProfileBadge({
    badgeId: cleanSweepBadgeId,
    guestProfileId: sana.id,
    challengeId: settledChallenge.id,
    groupId: receiptsClub.id,
    dedupeKey: `clean_sweep:${sana.id}:${settledChallenge.id}`,
    reason: "Perfect 5/5 board."
  });
  await awardProfileBadge({
    badgeId: tableTopperBadgeId,
    guestProfileId: sana.id,
    challengeId: settledChallenge.id,
    groupId: receiptsClub.id,
    dedupeKey: `table_topper:${sana.id}:${settledChallenge.id}`,
    reason: "Finished first in the receipts club."
  });
  await awardProfileBadge({
    badgeId: contrarianBadgeId,
    guestProfileId: ishan.id,
    challengeId: settledChallenge.id,
    groupId: receiptsClub.id,
    dedupeKey: `contrarian_hit:${ishan.id}:${settledChallenge.id}`,
    reason: "A sharper-than-consensus call still landed."
  });
  await awardProfileBadge({
    badgeId: loneWolfBadgeId,
    guestProfileId: dev.id,
    challengeId: settledChallenge.id,
    groupId: receiptsClub.id,
    dedupeKey: `lone_wolf:${dev.id}:${settledChallenge.id}`,
    reason: "Owned the solo pick energy."
  });

  await upsertSeasonStanding({
    groupId: receiptsClub.id,
    seasonId: settledMatchMeta.seasonId!,
    groupMemberId: sanaGroupMember,
    displayName: sana.displayName,
    challengesPlayed: 1,
    wins: 1,
    losses: 0,
    totalPoints: 5,
    accuracyPct: 100,
    contrarianBonus: 0,
    reputationScore: 87,
    rank: 1
  });
  await upsertSeasonStanding({
    groupId: receiptsClub.id,
    seasonId: settledMatchMeta.seasonId!,
    groupMemberId: ishanGroupMember,
    displayName: ishan.displayName,
    challengesPlayed: 1,
    wins: 0,
    losses: 1,
    totalPoints: 3,
    accuracyPct: 60,
    contrarianBonus: 1,
    reputationScore: 54,
    rank: 2
  });
  await upsertSeasonStanding({
    groupId: receiptsClub.id,
    seasonId: settledMatchMeta.seasonId!,
    groupMemberId: devGroupMember,
    displayName: dev.displayName,
    challengesPlayed: 1,
    wins: 0,
    losses: 1,
    totalPoints: 2,
    accuracyPct: 40,
    contrarianBonus: 1,
    reputationScore: 42,
    rank: 3
  });

  await upsertSeasonStanding({
    groupId: officeLeague.id,
    seasonId: futureMatchMeta.seasonId!,
    groupMemberId: amanGroupMember,
    displayName: aman.displayName,
    challengesPlayed: 0,
    wins: 0,
    losses: 0,
    totalPoints: 0,
    accuracyPct: 0,
    contrarianBonus: 0,
    reputationScore: 8,
    rank: 1
  });
  await upsertSeasonStanding({
    groupId: officeLeague.id,
    seasonId: futureMatchMeta.seasonId!,
    groupMemberId: riyaGroupMember,
    displayName: riya.displayName,
    challengesPlayed: 0,
    wins: 0,
    losses: 0,
    totalPoints: 0,
    accuracyPct: 0,
    contrarianBonus: 0,
    reputationScore: 6,
    rank: 2
  });
  await upsertSeasonStanding({
    groupId: officeLeague.id,
    seasonId: futureMatchMeta.seasonId!,
    groupMemberId: kabirGroupMember,
    displayName: kabir.displayName,
    challengesPlayed: 0,
    wins: 0,
    losses: 0,
    totalPoints: 0,
    accuracyPct: 0,
    contrarianBonus: 0,
    reputationScore: 5,
    rank: 3
  });

  await upsertProfileStat({
    guestProfileId: aman.id,
    displayName: aman.displayName,
    bestSportId: cricketSportId,
    totalChallengesPlayed: 0,
    totalWins: 0,
    totalLosses: 0,
    totalCorrectPicks: 0,
    totalPossiblePicks: 0,
    contrarianHits: 0,
    cleanSweeps: 0,
    currentStreak: 0,
    longestStreak: 0,
    rivalsBeaten: 0,
    leaguesJoined: 3
  });
  await upsertProfileStat({
    guestProfileId: riya.id,
    displayName: riya.displayName,
    bestSportId: footballSportId,
    totalChallengesPlayed: 0,
    totalWins: 0,
    totalLosses: 0,
    totalCorrectPicks: 0,
    totalPossiblePicks: 0,
    contrarianHits: 0,
    cleanSweeps: 0,
    currentStreak: 0,
    longestStreak: 0,
    rivalsBeaten: 0,
    leaguesJoined: 3
  });
  await upsertProfileStat({
    guestProfileId: kabir.id,
    displayName: kabir.displayName,
    bestSportId: basketballSportId,
    totalChallengesPlayed: 0,
    totalWins: 0,
    totalLosses: 0,
    totalCorrectPicks: 0,
    totalPossiblePicks: 0,
    contrarianHits: 0,
    cleanSweeps: 0,
    currentStreak: 0,
    longestStreak: 0,
    rivalsBeaten: 0,
    leaguesJoined: 3
  });
  await upsertProfileStat({
    guestProfileId: sana.id,
    displayName: sana.displayName,
    bestSportId: cricketSportId,
    totalChallengesPlayed: 1,
    totalWins: 1,
    totalLosses: 0,
    totalCorrectPicks: 5,
    totalPossiblePicks: 5,
    contrarianHits: 0,
    cleanSweeps: 1,
    currentStreak: 1,
    longestStreak: 1,
    rivalsBeaten: 2,
    leaguesJoined: 1
  });
  await upsertProfileStat({
    guestProfileId: ishan.id,
    displayName: ishan.displayName,
    bestSportId: cricketSportId,
    totalChallengesPlayed: 1,
    totalWins: 0,
    totalLosses: 1,
    totalCorrectPicks: 3,
    totalPossiblePicks: 5,
    contrarianHits: 1,
    cleanSweeps: 0,
    currentStreak: 0,
    longestStreak: 0,
    rivalsBeaten: 1,
    leaguesJoined: 1
  });
  await upsertProfileStat({
    guestProfileId: dev.id,
    displayName: dev.displayName,
    bestSportId: cricketSportId,
    totalChallengesPlayed: 1,
    totalWins: 0,
    totalLosses: 1,
    totalCorrectPicks: 2,
    totalPossiblePicks: 5,
    contrarianHits: 1,
    cleanSweeps: 0,
    currentStreak: 0,
    longestStreak: 0,
    rivalsBeaten: 0,
    leaguesJoined: 1
  });

  await ensureMiniPickWindow({
    matchId: liveMiniPickMatch.id,
    sportId: liveMiniPickMatchMeta.sportId,
    sportKey: "cricket",
    teams: [
      {
        fullName: "Kolkata Knight Riders",
        shortName: "KKR",
        primaryColor: "#6b4dff",
        secondaryColor: "#f7d24f"
      },
      {
        fullName: "Rajasthan Royals",
        shortName: "RR",
        primaryColor: "#ff73ba",
        secondaryColor: "#0c1630"
      }
    ],
    templateKey: "next_over_runs",
    opensAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    lockAt: new Date(Date.now() + 8 * 60 * 1000).toISOString(),
    stakeText: "Loser sends the panic voice note",
    entries: [
      { displayName: aman.displayName, optionValue: "10_14" },
      { displayName: riya.displayName, optionValue: "6_9" },
      { displayName: kabir.displayName, optionValue: "10_14" }
    ]
  });

  await ensureMiniPickWindow({
    matchId: liveMiniPickMatch.id,
    sportId: liveMiniPickMatchMeta.sportId,
    sportKey: "cricket",
    teams: [
      {
        fullName: "Kolkata Knight Riders",
        shortName: "KKR",
        primaryColor: "#6b4dff",
        secondaryColor: "#f7d24f"
      },
      {
        fullName: "Rajasthan Royals",
        shortName: "RR",
        primaryColor: "#ff73ba",
        secondaryColor: "#0c1630"
      }
    ],
    templateKey: "next_boundary_side",
    opensAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    lockAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    stakeText: "Miss this and the memes start instantly",
    resolvedValue: "side_a",
    resolutionNote: "KKR found the rope first after the timeout.",
    entries: [
      { displayName: aman.displayName, optionValue: "side_a" },
      { displayName: riya.displayName, optionValue: "side_b" },
      { displayName: kabir.displayName, optionValue: "side_a" }
    ]
  });

  await ensureMiniPickWindow({
    matchId: footballLiveMatch.id,
    sportId: footballLiveMatchMeta.sportId,
    sportKey: "football",
    teams: [
      {
        fullName: "Tottenham Hotspur",
        shortName: "TOT",
        primaryColor: "#f4f6fb",
        secondaryColor: "#11192c"
      },
      {
        fullName: "Chelsea",
        shortName: "CHE",
        primaryColor: "#2962ff",
        secondaryColor: "#e8edf8"
      }
    ],
    templateKey: "next_goal_team",
    opensAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    lockAt: new Date(Date.now() + 6 * 60 * 1000).toISOString(),
    stakeText: "Loser posts the derby apology",
    entries: [
      { displayName: riya.displayName, optionValue: "side_b" },
      { displayName: aman.displayName, optionValue: "side_a" },
      { displayName: kabir.displayName, optionValue: "side_b" }
    ]
  });

  await ensureMiniPickWindow({
    matchId: footballLiveMatch.id,
    sportId: footballLiveMatchMeta.sportId,
    sportKey: "football",
    teams: [
      {
        fullName: "Tottenham Hotspur",
        shortName: "TOT",
        primaryColor: "#f4f6fb",
        secondaryColor: "#11192c"
      },
      {
        fullName: "Chelsea",
        shortName: "CHE",
        primaryColor: "#2962ff",
        secondaryColor: "#e8edf8"
      }
    ],
    templateKey: "next_booking_team",
    opensAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    lockAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    stakeText: "Miss it and hold the timeline slander",
    resolvedValue: "side_a",
    resolutionNote: "Spurs took the next booking after a late transition foul.",
    entries: [
      { displayName: riya.displayName, optionValue: "side_b" },
      { displayName: aman.displayName, optionValue: "side_a" },
      { displayName: kabir.displayName, optionValue: "side_a" }
    ]
  });

  await createNotification({
    guestProfileId: aman.id,
    type: "challenge_live",
    title: "Friday Biryani League is live",
    body: "Your MI vs CSK board is now counting toward the office table.",
    href: `/c/${officeDerby.slug}/compare`
  });
  await createNotification({
    guestProfileId: aman.id,
    type: "rival_joined",
    title: "Riya joined your board",
    body: "The office counter-picks are now live.",
    href: `/c/${officeDerby.slug}/compare`
  });
  await createNotification({
    guestProfileId: sana.id,
    type: "you_won",
    title: "You took the board",
    body: "5/5 and first in the Warm-Up Receipts Club.",
    href: `/c/${settledChallenge.slug}/results`
  });
  await createNotification({
    guestProfileId: ishan.id,
    type: "results_live",
    title: "Results are live",
    body: "Your 3/5 finish is locked into the receipts table.",
    href: `/c/${settledChallenge.slug}/results`
  });
  await createNotification({
    guestProfileId: dev.id,
    type: "you_got_cooked",
    title: "The receipts are in",
    body: "2/5 this time. The room will remember.",
    href: `/c/${settledChallenge.slug}/results`
  });
  await createNotification({
    guestProfileId: aman.id,
    type: "mini_pick_live",
    title: "Next Over Runs is live",
    body: "KKR vs RR just opened a fast side board.",
    href: `/matches/${liveMiniPickMatch.slug}`
  });
  await createNotification({
    guestProfileId: riya.id,
    type: "mini_pick_settled",
    title: "Next Boundary settled",
    body: "The live side board is closed. Receipts attached.",
    href: `/matches/${liveMiniPickMatch.slug}`
  });

  console.log("LockScore seed complete.");
  console.log(`Open challenge: ${officeDerby.slug}`);
  console.log(`Settled challenge: ${settledChallenge.slug}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
