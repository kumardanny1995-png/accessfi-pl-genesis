"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildDefaultQuestionsBySport, buildMiniPickTemplatesBySport } from "@/lib/data/defaults";
import { getAdminMatch } from "@/lib/data/admin";
import { getRequiredEnv } from "@/lib/db/env";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import type { ActionState } from "@/lib/db/types";
import {
  createMiniPickLiveNotifications,
  createMiniPickSettledNotifications,
  runNotificationSweep
} from "@/lib/services/engagement";
import { syncMatchWithProvider, syncPendingMatchesWithProviders } from "@/lib/services/provider-sync";
import { settleMatchWithResolvedAnswers } from "@/lib/services/settlement";
import { lockscorePath } from "@/lib/utils/lockscore-routes";
import { clearAdminSession, requireAdminSession, setAdminSession } from "@/lib/utils/admin";
import { buildMatchSlug, slugify } from "@/lib/utils/slugs";
import {
  adminLoginSchema,
  createMiniPickWindowSchema,
  createMatchSchema,
  settlementSchema,
  settleMiniPickWindowSchema,
  syncMatchSchema,
  updateMatchSchema
} from "@/lib/validation/schemas";

function errorState(message: string, fieldErrors?: Record<string, string[]>): ActionState {
  return { ok: false, message, fieldErrors };
}

function toIsoFromLocal(value: string) {
  return new Date(value).toISOString();
}

function isChecked(value: string | undefined) {
  return value === "on" || value === "true";
}

function sportNameFromKey(sportKey: string) {
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

function entityTypeForSport(sportKey: string) {
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

async function ensureSportId(sportKey: string) {
  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase.from("sports").select("id").eq("key", sportKey).maybeSingle();

  if (existing) {
    return existing.id;
  }

  const { data, error } = await supabase
    .from("sports")
    .insert({ key: sportKey, name: sportNameFromKey(sportKey) })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

function getMiniPickStatus(opensAt: string, lockAt: string) {
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

async function ensureMiniPickTemplateRecord(args: {
  sportId: string;
  key: string;
  name: string;
  description: string;
  prompt: string;
  options: Array<{ label: string; value: string }>;
}) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("mini_pick_templates")
    .upsert(
      {
        sport_id: args.sportId,
        key: args.key,
        name: args.name,
        description: args.description,
        default_prompt: args.prompt,
        default_options: args.options
      },
      { onConflict: "sport_id,key" }
    )
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

async function upsertTeam(
  sportId: string,
  sportKey: string,
  fullName: string,
  shortName: string,
  role: "side_a" | "side_b"
) {
  const supabase = getSupabaseAdmin();
  const slug = fullName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  const { data: existing } = await supabase.from("teams").select("id").eq("slug", slug).maybeSingle();

  if (existing) {
    return { id: existing.id, fullName, shortName, role };
  }

  const palette =
    role === "side_a"
      ? { primary_color: "#ff533d", secondary_color: "#ffd562" }
      : { primary_color: "#41a4ff", secondary_color: "#9cf4ff" };

  const { data, error } = await supabase
    .from("teams")
    .insert({
      sport_id: sportId,
      slug,
      full_name: fullName,
      short_name: shortName,
      entity_type: entityTypeForSport(sportKey),
      ...palette
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return { id: data.id, fullName, shortName, role };
}

async function ensureCompetitionAndSeason(sportId: string, competitionName: string, startTime: string) {
  const supabase = getSupabaseAdmin();
  const { baseName, seasonName, year } = splitCompetitionAndSeason(competitionName, startTime);
  const competitionSlug = slugify(baseName);
  const seasonSlug = `${competitionSlug}-${year}`;

  const { data: existingCompetition } = await supabase
    .from("competitions")
    .select("id")
    .eq("slug", competitionSlug)
    .eq("sport_id", sportId)
    .maybeSingle();

  let competitionId = existingCompetition?.id ?? null;

  if (!competitionId) {
    const { data: insertedCompetition, error: insertedCompetitionError } = await supabase
      .from("competitions")
      .insert({
        sport_id: sportId,
        slug: competitionSlug,
        name: baseName,
        short_name: baseName.split(" ").map((part) => part[0]).join("").slice(0, 6) || baseName.slice(0, 6),
        category: "season",
        region: null,
        is_featured: true
      })
      .select("id")
      .single();

    if (insertedCompetitionError) {
      throw insertedCompetitionError;
    }

    competitionId = insertedCompetition.id;
  }

  if (!competitionId) {
    throw new Error("Failed to ensure competition.");
  }

  const { data: existingSeason } = await supabase
    .from("seasons")
    .select("id")
    .eq("slug", seasonSlug)
    .eq("competition_id", competitionId)
    .maybeSingle();

  let seasonId = existingSeason?.id ?? null;

  if (!seasonId) {
    const { data: insertedSeason, error: insertedSeasonError } = await supabase
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
      .single();

    if (insertedSeasonError) {
      throw insertedSeasonError;
    }

    seasonId = insertedSeason.id;
  }

  if (!seasonId) {
    throw new Error("Failed to ensure season.");
  }

  return { competitionId, seasonId, seasonName };
}

export async function adminLoginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = adminLoginSchema.safeParse({
    passcode: formData.get("passcode")
  });

  if (!parsed.success) {
    return errorState("Enter the admin passcode.", parsed.error.flatten().fieldErrors);
  }

  if (parsed.data.passcode !== getRequiredEnv("ADMIN_PASSCODE")) {
    return errorState("Invalid passcode.");
  }

  await setAdminSession();
  redirect(lockscorePath("/admin"));
}

export async function adminLogoutAction() {
  await clearAdminSession();
  redirect(lockscorePath("/admin/login"));
}

export async function createMatchAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdminSession();
  const parsed = createMatchSchema.safeParse({
    sportKey: formData.get("sportKey"),
    predictionTemplateKey: formData.get("predictionTemplateKey"),
    providerKey: formData.get("providerKey"),
    externalEventId: formData.get("externalEventId"),
    competitionName: formData.get("competitionName"),
    venue: formData.get("venue"),
    teamAName: formData.get("teamAName"),
    teamBName: formData.get("teamBName"),
    teamAShortName: formData.get("teamAShortName"),
    teamBShortName: formData.get("teamBShortName"),
    startTime: formData.get("startTime"),
    lockTime: formData.get("lockTime")
  });

  if (!parsed.success) {
    return errorState("Fill the required match fields.", parsed.error.flatten().fieldErrors);
  }

  const sportId = await ensureSportId(parsed.data.sportKey);
  const { competitionId, seasonId } = await ensureCompetitionAndSeason(
    sportId,
    parsed.data.competitionName,
    parsed.data.startTime
  );
  const [teamA, teamB] = await Promise.all([
    upsertTeam(sportId, parsed.data.sportKey, parsed.data.teamAName, parsed.data.teamAShortName, "side_a"),
    upsertTeam(sportId, parsed.data.sportKey, parsed.data.teamBName, parsed.data.teamBShortName, "side_b")
  ]);

  const supabase = getSupabaseAdmin();
  const dateSlug = new Date(parsed.data.startTime).toISOString().slice(0, 10);
  const title = `${teamA.shortName} vs ${teamB.shortName}`;
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .insert({
      sport_id: sportId,
      competition_id: competitionId,
      season_id: seasonId,
      slug: buildMatchSlug(teamA.fullName, teamB.fullName, dateSlug),
      title,
      competition_name: parsed.data.competitionName,
      venue: parsed.data.venue,
      start_time: toIsoFromLocal(parsed.data.startTime),
      lock_time: toIsoFromLocal(parsed.data.lockTime),
      status: "scheduled",
      settlement_status: "pending",
      prediction_template_key: parsed.data.predictionTemplateKey,
      external_provider_key: parsed.data.providerKey,
      external_event_id: parsed.data.externalEventId || null,
      stage_label: parsed.data.sportKey === "cricket" ? "Matchday board" : "Weekend board"
    })
    .select("id")
    .single();

  if (matchError) {
    return errorState("Could not create the match.");
  }

  const { error: teamLinkError } = await supabase.from("match_teams").insert([
    { match_id: match.id, team_id: teamA.id, role: "side_a" },
    { match_id: match.id, team_id: teamB.id, role: "side_b" }
  ]);

  if (teamLinkError) {
    return errorState("Match created, but team links failed.");
  }

  const defaultQuestions = buildDefaultQuestionsBySport(parsed.data.sportKey, [
    { id: teamA.id, shortName: teamA.shortName, fullName: teamA.fullName },
    { id: teamB.id, shortName: teamB.shortName, fullName: teamB.fullName }
  ], parsed.data.predictionTemplateKey);

  const { data: questionRows, error: questionError } = await supabase
    .from("prediction_questions")
    .insert(
      defaultQuestions.map((question) => ({
        match_id: match.id,
        sport_id: sportId,
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
    return errorState("Match created, but prediction questions failed.");
  }

  const optionPayload = defaultQuestions.flatMap((question) => {
    const questionId = questionRows?.find((row) => row.key === question.key)?.id;
    if (!questionId) {
      throw new Error(`Missing inserted question row for ${question.key}`);
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
    return errorState("Match created, but prediction options failed.");
  }

  await supabase.from("event_sync_state").upsert(
    {
      match_id: match.id,
      provider_key: parsed.data.providerKey,
      external_event_id: parsed.data.externalEventId || null,
      auto_settle_supported:
        parsed.data.sportKey === "cricket" &&
        parsed.data.predictionTemplateKey === "provider_ready" &&
        parsed.data.providerKey !== "manual",
      sync_status: parsed.data.providerKey === "manual" ? "manual" : "configured"
    },
    { onConflict: "match_id" }
  );

  revalidatePath(lockscorePath("/admin"));
  revalidatePath(lockscorePath("/matches"));
  revalidatePath(lockscorePath("/sports"));
  revalidatePath(lockscorePath(`/sports/${parsed.data.sportKey}`));
  redirect(lockscorePath(`/admin/matches/${match.id}/edit`));
}

export async function updateMatchAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdminSession();
  const parsed = updateMatchSchema.safeParse({
    matchId: formData.get("matchId"),
    title: formData.get("title"),
    predictionTemplateKey: formData.get("predictionTemplateKey"),
    providerKey: formData.get("providerKey"),
    externalEventId: formData.get("externalEventId"),
    autoSettleSupported: formData.get("autoSettleSupported"),
    competitionName: formData.get("competitionName"),
    venue: formData.get("venue"),
    startTime: formData.get("startTime"),
    lockTime: formData.get("lockTime"),
    status: formData.get("status")
  });

  if (!parsed.success) {
    return errorState("Fix the match details.", parsed.error.flatten().fieldErrors);
  }

  const supabase = getSupabaseAdmin();
  const matchContext = await getAdminMatch(parsed.data.matchId);

  if (!matchContext) {
    return errorState("Match not found.");
  }

  const { error: updateError } = await supabase
    .from("matches")
    .update({
      title: parsed.data.title,
      prediction_template_key: parsed.data.predictionTemplateKey,
      competition_name: parsed.data.competitionName,
      venue: parsed.data.venue,
      start_time: toIsoFromLocal(parsed.data.startTime),
      lock_time: toIsoFromLocal(parsed.data.lockTime),
      status: parsed.data.status,
      external_provider_key: parsed.data.providerKey,
      external_event_id: parsed.data.externalEventId || null
    })
    .eq("id", parsed.data.matchId);

  if (updateError) {
    return errorState("Could not update the match.");
  }

  for (const question of matchContext.questions) {
    const prompt = String(formData.get(`question_${question.id}_prompt`) ?? question.prompt);
    const description = String(formData.get(`question_${question.id}_description`) ?? question.description ?? "");

    const { error: questionError } = await supabase
      .from("prediction_questions")
      .update({ prompt, description })
      .eq("id", question.id);

    if (questionError) {
      return errorState("Could not update the prediction questions.");
    }

    for (const option of question.options) {
      const label = String(formData.get(`question_${question.id}_option_${option.id}_label`) ?? option.label);
      const value = String(formData.get(`question_${question.id}_option_${option.id}_value`) ?? option.value);

      const { error: optionError } = await supabase
        .from("prediction_options")
        .update({ label, value })
        .eq("id", option.id);

      if (optionError) {
        return errorState("Could not update a prediction option.");
      }
    }
  }

  const { error: syncUpdateError } = await supabase.from("event_sync_state").upsert(
    {
      match_id: parsed.data.matchId,
      provider_key: parsed.data.providerKey,
      external_event_id: parsed.data.externalEventId || null,
      auto_settle_supported: isChecked(parsed.data.autoSettleSupported)
    },
    { onConflict: "match_id" }
  );

  if (syncUpdateError) {
    return errorState("Match updated, but provider sync settings failed.");
  }

  revalidatePath(lockscorePath("/admin"));
  revalidatePath(lockscorePath(`/admin/matches/${parsed.data.matchId}/edit`));
  return { ok: true, message: "Match configuration updated." };
}

export async function settleMatchAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdminSession();
  const parsed = settlementSchema.safeParse({
    matchId: formData.get("matchId"),
    notes: formData.get("notes")
  });

  if (!parsed.success) {
    return errorState("Settlement payload is invalid.", parsed.error.flatten().fieldErrors);
  }

  const matchContext = await getAdminMatch(parsed.data.matchId);

  if (!matchContext) {
    return errorState("Match not found.");
  }

  const selectedOutcomes = matchContext.questions.map((question) => ({
    questionId: question.id,
    optionId: String(formData.get(`outcome_${question.id}`) ?? "")
  }));

  if (selectedOutcomes.some((answer) => !answer.optionId)) {
    return errorState("Set every settled answer before calculating scores.");
  }

  try {
    await settleMatchWithResolvedAnswers({
      matchId: parsed.data.matchId,
      notes: parsed.data.notes || null,
      selectedOutcomes
    });
  } catch (error) {
    return errorState(error instanceof Error ? error.message : "Could not settle this match.");
  }

  revalidatePath(lockscorePath("/admin"));
  revalidatePath(lockscorePath(`/admin/matches/${parsed.data.matchId}/settle`));
  revalidatePath(lockscorePath(`/admin/matches/${parsed.data.matchId}/edit`));
  revalidatePath(lockscorePath("/matches"));
  revalidatePath(lockscorePath("/groups"));
  revalidatePath(lockscorePath("/sports"));
  revalidatePath(lockscorePath("/profile"));
  revalidatePath(lockscorePath("/notifications"));
  return { ok: true, message: "Match settled and leaderboard recalculated." };
}

export async function createMiniPickWindowAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdminSession();
  const parsed = createMiniPickWindowSchema.safeParse({
    matchId: formData.get("matchId"),
    templateKey: formData.get("templateKey"),
    opensAt: formData.get("opensAt"),
    lockAt: formData.get("lockAt"),
    stakeText: formData.get("stakeText")
  });

  if (!parsed.success) {
    return errorState("Mini-pick payload is invalid.", parsed.error.flatten().fieldErrors);
  }

  const matchContext = await getAdminMatch(parsed.data.matchId);
  if (!matchContext) {
    return errorState("Match not found.");
  }

  const teamSeeds = matchContext.match.teams.map((entry) => ({
    id: entry.team.id,
    shortName: entry.team.shortName,
    fullName: entry.team.fullName
  })) as [{ id: string; shortName: string; fullName: string }, { id: string; shortName: string; fullName: string }];

  const template = buildMiniPickTemplatesBySport(matchContext.match.sport.key, teamSeeds).find(
    (entry) => entry.key === parsed.data.templateKey
  );

  if (!template) {
    return errorState("This sport does not support that live mini-pick template yet.");
  }

  const opensAt = toIsoFromLocal(parsed.data.opensAt);
  const lockAt = toIsoFromLocal(parsed.data.lockAt);
  if (new Date(lockAt).getTime() <= new Date(opensAt).getTime()) {
    return errorState("Mini-pick lock time must be after the open time.");
  }

  const supabase = getSupabaseAdmin();

  try {
    const templateId = await ensureMiniPickTemplateRecord({
      sportId: matchContext.match.sport.id,
      key: template.key,
      name: template.name,
      description: template.description,
      prompt: template.prompt,
      options: template.options
    });

    const { data: window, error: windowError } = await supabase
      .from("mini_pick_windows")
      .insert({
        match_id: parsed.data.matchId,
        template_id: templateId,
        key: template.key,
        title: template.name,
        prompt: template.prompt,
        description: template.description,
        opens_at: opensAt,
        lock_at: lockAt,
        status: getMiniPickStatus(opensAt, lockAt),
        stake_text: parsed.data.stakeText || null
      })
      .select("id")
      .single();

    if (windowError) {
      throw windowError;
    }

    const { error: optionError } = await supabase.from("mini_pick_options").insert(
      template.options.map((option, index) => ({
        window_id: window.id,
        label: option.label,
        value: option.value,
        sort_order: index + 1
      }))
    );

    if (optionError) {
      throw optionError;
    }

    if (getMiniPickStatus(opensAt, lockAt) === "open") {
      await createMiniPickLiveNotifications({
        matchId: parsed.data.matchId,
        matchSlug: matchContext.match.slug,
        windowId: window.id,
        title: template.name
      });
    }
  } catch (error) {
    return errorState(error instanceof Error ? error.message : "Could not create the live mini-pick.");
  }

  revalidatePath(lockscorePath("/admin"));
  revalidatePath(lockscorePath(`/admin/matches/${parsed.data.matchId}/settle`));
  revalidatePath(lockscorePath(`/matches/${matchContext.match.slug}`));
  revalidatePath(lockscorePath("/notifications"));
  return { ok: true, message: "Live mini-pick created." };
}

export async function settleMiniPickWindowAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdminSession();
  const parsed = settleMiniPickWindowSchema.safeParse({
    windowId: formData.get("windowId"),
    resolutionNote: formData.get("resolutionNote")
  });

  if (!parsed.success) {
    return errorState("Mini-pick settlement payload is invalid.", parsed.error.flatten().fieldErrors);
  }

  const resolvedOptionId = String(formData.get(`mini_pick_outcome_${parsed.data.windowId}`) ?? "");
  if (!resolvedOptionId) {
    return errorState("Pick the winning option before settling the live board.");
  }

  const supabase = getSupabaseAdmin();
  const { data: window, error: windowError } = await supabase
    .from("mini_pick_windows")
    .select(
      `
        id,
        match_id,
        mini_pick_options (
          id
        ),
        match:matches (
          slug
        ),
        mini_pick_entries (
          id,
          selected_option_id
        )
      `
    )
    .eq("id", parsed.data.windowId)
    .maybeSingle();

  if (windowError || !window) {
    return errorState("Mini-pick window not found.");
  }

  const validOptionIds = new Set((window.mini_pick_options ?? []).map((option) => option.id));
  if (!validOptionIds.has(resolvedOptionId)) {
    return errorState("Settled option is invalid.");
  }

  try {
    const { error: updateError } = await supabase
      .from("mini_pick_windows")
      .update({
        resolved_option_id: resolvedOptionId,
        settled_at: new Date().toISOString(),
        status: "settled",
        resolution_note: parsed.data.resolutionNote || null
      })
      .eq("id", parsed.data.windowId);

    if (updateError) {
      throw updateError;
    }

    for (const entry of window.mini_pick_entries ?? []) {
      const isCorrect = entry.selected_option_id === resolvedOptionId;
      const { error: entryError } = await supabase
        .from("mini_pick_entries")
        .update({
          is_correct: isCorrect,
          points_awarded: isCorrect ? 1 : 0
        })
        .eq("id", entry.id);

      if (entryError) {
        throw entryError;
      }
    }

    const matchRef = window.match as { slug?: string } | Array<{ slug?: string }> | null;
    const matchSlug = Array.isArray(matchRef) ? matchRef[0]?.slug : matchRef?.slug;
    if (matchSlug) {
      await createMiniPickSettledNotifications({
        matchSlug,
        windowId: window.id,
        title: "Live mini-pick"
      });
    }
  } catch (error) {
    return errorState(error instanceof Error ? error.message : "Could not settle the live mini-pick.");
  }

  const matchRef = window.match as { slug?: string } | Array<{ slug?: string }> | null;
  const matchSlug = Array.isArray(matchRef) ? matchRef[0]?.slug : matchRef?.slug;
  revalidatePath(lockscorePath("/admin"));
  revalidatePath(lockscorePath(`/admin/matches/${window.match_id}/settle`));
  if (matchSlug) {
    revalidatePath(lockscorePath(`/matches/${matchSlug}`));
  }
  revalidatePath(lockscorePath("/notifications"));
  return { ok: true, message: "Live mini-pick settled." };
}

export async function syncMatchProviderAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdminSession();
  const parsed = syncMatchSchema.safeParse({
    matchId: formData.get("matchId")
  });

  if (!parsed.success) {
    return errorState("Match sync payload is invalid.");
  }

  const result = await syncMatchWithProvider({ matchId: parsed.data.matchId });

  revalidatePath(lockscorePath("/admin"));
  revalidatePath(lockscorePath(`/admin/matches/${parsed.data.matchId}/edit`));
  revalidatePath(lockscorePath(`/admin/matches/${parsed.data.matchId}/settle`));

  return { ok: result.ok, message: result.message };
}

export async function autoSettleMatchProviderAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdminSession();
  const parsed = syncMatchSchema.safeParse({
    matchId: formData.get("matchId")
  });

  if (!parsed.success) {
    return errorState("Auto-settlement payload is invalid.");
  }

  const result = await syncMatchWithProvider({
    matchId: parsed.data.matchId,
    autoSettle: true
  });

  revalidatePath(lockscorePath("/admin"));
  revalidatePath(lockscorePath("/matches"));
  revalidatePath(lockscorePath("/groups"));
  revalidatePath(lockscorePath("/sports"));
  revalidatePath(lockscorePath("/profile"));
  revalidatePath(lockscorePath("/notifications"));
  revalidatePath(lockscorePath(`/admin/matches/${parsed.data.matchId}/edit`));
  revalidatePath(lockscorePath(`/admin/matches/${parsed.data.matchId}/settle`));

  return { ok: result.ok, message: result.message };
}

export async function syncPendingMatchesAction() {
  await requireAdminSession();
  await syncPendingMatchesWithProviders();
  revalidatePath(lockscorePath("/admin"));
}

export async function runNotificationSweepAction() {
  await requireAdminSession();
  await runNotificationSweep();
  revalidatePath(lockscorePath("/admin"));
  revalidatePath(lockscorePath("/profile"));
  revalidatePath(lockscorePath("/notifications"));
}
