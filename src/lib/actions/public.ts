"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { DEFAULT_CHALLENGE_SHARE_COPY } from "@/lib/data/defaults";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import type { ActionState } from "@/lib/db/types";
import { ensureGuestProfile } from "@/lib/services/guest-profiles";
import { createGroupChallengeNotifications, createRivalJoinedNotification } from "@/lib/services/engagement";
import { lockscorePath } from "@/lib/utils/lockscore-routes";
import { buildChallengeSlug, buildPublicCode } from "@/lib/utils/slugs";
import { createChallengeSchema, joinChallengeSchema, submitMiniPickSchema } from "@/lib/validation/schemas";

async function ensureOpenChallenge(challengeSlug: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("challenges")
    .select(
      `
        id,
        slug,
        title,
        status,
        match:matches (
          id,
          lock_time,
          prediction_questions (
            id,
            key
          )
        )
      `
    )
    .eq("slug", challengeSlug)
    .single();

  if (error) {
    throw error;
  }

  const match = Array.isArray(data.match) ? data.match[0] : data.match;

  if (!match) {
    throw new Error("Challenge match not found.");
  }

  if (new Date(match.lock_time).getTime() <= Date.now() || data.status !== "open") {
    throw new Error("This challenge is already locked.");
  }

  return {
    ...data,
    match
  };
}

function collectQuestionAnswers(formData: FormData, questionIds: string[]) {
  return questionIds.map((questionId) => ({
    questionId,
    optionId: String(formData.get(`question_${questionId}`) ?? "")
  }));
}

function fieldErrorsFromZod(error: { flatten: () => { fieldErrors: Record<string, string[]> } }): ActionState {
  return {
    ok: false,
    fieldErrors: error.flatten().fieldErrors,
    message: "Please fix the highlighted fields."
  };
}

export async function submitMiniPickAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = submitMiniPickSchema.safeParse({
    windowId: formData.get("windowId"),
    displayName: formData.get("displayName")
  });

  if (!parsed.success) {
    return fieldErrorsFromZod(parsed.error);
  }

  const selectedOptionId = String(formData.get(`mini_pick_${parsed.data.windowId}`) ?? "");
  if (!selectedOptionId) {
    return { ok: false, message: "Pick one live option before submitting." };
  }

  const supabase = getSupabaseAdmin();
  const { data: window, error: windowError } = await supabase
    .from("mini_pick_windows")
    .select(
      `
        id,
        status,
        opens_at,
        lock_at,
        match:matches (
          slug
        ),
        mini_pick_options (
          id
        )
      `
    )
    .eq("id", parsed.data.windowId)
    .maybeSingle();

  if (windowError || !window) {
    return { ok: false, message: "This live board no longer exists." };
  }

  const now = Date.now();
  if (new Date(window.opens_at).getTime() > now || new Date(window.lock_at).getTime() <= now || window.status === "settled") {
    return { ok: false, message: "That live board is already locked." };
  }

  const validOptionIds = new Set((window.mini_pick_options ?? []).map((option) => option.id));
  if (!validOptionIds.has(selectedOptionId)) {
    return { ok: false, message: "That live pick option is invalid." };
  }

  const guestProfile = await ensureGuestProfile(parsed.data.displayName);
  const { error: entryError } = await supabase.from("mini_pick_entries").upsert(
    {
      window_id: window.id,
      guest_profile_id: guestProfile.id,
      display_name: guestProfile.display_name,
      selected_option_id: selectedOptionId,
      submitted_at: new Date().toISOString()
    },
    { onConflict: "window_id,guest_profile_id" }
  );

  if (entryError) {
    return { ok: false, message: "Could not lock that live pick." };
  }

  const matchRef = window.match as { slug?: string } | Array<{ slug?: string }> | null;
  const matchSlug = Array.isArray(matchRef) ? matchRef[0]?.slug : matchRef?.slug;
  if (matchSlug) {
    revalidatePath(lockscorePath(`/matches/${matchSlug}`));
  }
  revalidatePath(lockscorePath("/profile"));
  return { ok: true, message: "Live pick locked." };
}

export async function createChallengeAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = createChallengeSchema.safeParse({
    matchId: formData.get("matchId"),
    groupId: formData.get("groupId"),
    creatorName: formData.get("creatorName"),
    challengeTitle: formData.get("challengeTitle"),
    stakeText: formData.get("stakeText"),
    shareMessage: formData.get("shareMessage")
  });

  if (!parsed.success) {
    return fieldErrorsFromZod(parsed.error);
  }

  const supabase = getSupabaseAdmin();
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id, slug, lock_time, prediction_questions(id)")
    .eq("id", parsed.data.matchId)
    .single();

  if (matchError) {
    return { ok: false, message: "Match not found." };
  }

  if (new Date(match.lock_time).getTime() <= Date.now()) {
    return { ok: false, message: "This match is already locked." };
  }

  const questionIds = (match.prediction_questions ?? []).map((question: { id: string }) => question.id);
  const answers = collectQuestionAnswers(formData, questionIds);

  if (answers.some((answer) => !answer.optionId)) {
    return { ok: false, message: "All five predictions must be locked before sharing." };
  }

  const guestProfile = await ensureGuestProfile(parsed.data.creatorName);
  const challengeSlug = buildChallengeSlug(match.slug);
  const { data: challenge, error: challengeError } = await supabase
    .from("challenges")
    .insert({
      match_id: match.id,
      group_id: parsed.data.groupId || null,
      slug: challengeSlug,
      title: parsed.data.challengeTitle,
      stake_text: parsed.data.stakeText || null,
      share_message: parsed.data.shareMessage || DEFAULT_CHALLENGE_SHARE_COPY,
      status: "open",
      visibility: "public",
      created_by_guest_profile_id: guestProfile.id
    })
    .select("id, slug")
    .single();

  if (challengeError) {
    return { ok: false, message: "Could not create the challenge." };
  }

  const { data: participant, error: participantError } = await supabase
    .from("challenge_participants")
    .insert({
      challenge_id: challenge.id,
      guest_profile_id: guestProfile.id,
      display_name: guestProfile.display_name,
      is_creator: true,
      public_code: buildPublicCode("c"),
      submitted_at: new Date().toISOString(),
      entry_status: "submitted"
    })
    .select("id, public_code")
    .single();

  if (participantError) {
    return { ok: false, message: "Could not create the creator entry." };
  }

  const { error: predictionError } = await supabase.from("participant_predictions").insert(
    answers.map((answer) => ({
      participant_id: participant.id,
      question_id: answer.questionId,
      selected_option_id: answer.optionId,
      locked_at: new Date().toISOString()
    }))
  );

  if (predictionError) {
    return { ok: false, message: "Challenge created, but picks failed to save." };
  }

  if (parsed.data.groupId) {
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, season_id")
      .eq("id", parsed.data.groupId)
      .maybeSingle();

    if (!groupError && group) {
      await supabase.from("group_challenges").upsert(
        {
          group_id: group.id,
          challenge_id: challenge.id,
          season_id: group.season_id ?? null
        },
        { onConflict: "group_id,challenge_id" }
      );

      await createGroupChallengeNotifications({
        challengeId: challenge.id,
        challengeSlug: challenge.slug,
        challengeTitle: parsed.data.challengeTitle,
        groupId: group.id,
        creatorGuestProfileId: guestProfile.id,
        creatorName: guestProfile.display_name
      });
    }
  }

  revalidatePath(lockscorePath("/"));
  revalidatePath(lockscorePath("/matches"));
  revalidatePath(lockscorePath("/sports"));
  revalidatePath(lockscorePath("/groups"));
  revalidatePath(lockscorePath(`/matches/${match.slug}`));
  if (parsed.data.groupId) {
    revalidatePath(lockscorePath("/groups"));
  }
  revalidatePath(lockscorePath(`/c/${challenge.slug}`));
  redirect(lockscorePath(`/c/${challenge.slug}/compare?me=${participant.public_code}`));
}

export async function joinChallengeAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = joinChallengeSchema.safeParse({
    challengeSlug: formData.get("challengeSlug"),
    participantName: formData.get("participantName")
  });

  if (!parsed.success) {
    return fieldErrorsFromZod(parsed.error);
  }

  const challenge = await ensureOpenChallenge(parsed.data.challengeSlug);
  const questionIds = (challenge.match.prediction_questions ?? []).map((question: { id: string }) => question.id);
  const answers = collectQuestionAnswers(formData, questionIds);

  if (answers.some((answer) => !answer.optionId)) {
    return { ok: false, message: "Submit all five counter-picks." };
  }

  const supabase = getSupabaseAdmin();
  const guestProfile = await ensureGuestProfile(parsed.data.participantName);
  const { data: existingParticipant } = await supabase
    .from("challenge_participants")
    .select("id, public_code")
    .eq("challenge_id", challenge.id)
    .eq("guest_profile_id", guestProfile.id)
    .maybeSingle();

  if (existingParticipant) {
    redirect(lockscorePath(`/c/${challenge.slug}/compare?me=${existingParticipant.public_code}`));
  }

  const { data: participant, error: participantError } = await supabase
    .from("challenge_participants")
    .insert({
      challenge_id: challenge.id,
      guest_profile_id: guestProfile.id,
      display_name: guestProfile.display_name,
      is_creator: false,
      public_code: buildPublicCode("j"),
      submitted_at: new Date().toISOString(),
      entry_status: "submitted"
    })
    .select("id, public_code")
    .single();

  if (participantError) {
    return { ok: false, message: "Could not join this challenge." };
  }

  const { error: predictionError } = await supabase.from("participant_predictions").insert(
    answers.map((answer) => ({
      participant_id: participant.id,
      question_id: answer.questionId,
      selected_option_id: answer.optionId,
      locked_at: new Date().toISOString()
    }))
  );

  if (predictionError) {
    return { ok: false, message: "Joined the challenge, but picks failed to save." };
  }

  await createRivalJoinedNotification({
    challengeId: challenge.id,
    challengeSlug: challenge.slug,
    participantName: guestProfile.display_name
  });

  revalidatePath(lockscorePath(`/c/${challenge.slug}`));
  revalidatePath(lockscorePath(`/c/${challenge.slug}/compare`));
  revalidatePath(lockscorePath("/profile"));
  redirect(lockscorePath(`/c/${challenge.slug}/compare?me=${participant.public_code}`));
}
