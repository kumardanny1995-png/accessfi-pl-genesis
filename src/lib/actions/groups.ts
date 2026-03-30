"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/db/types";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import { ensureGuestProfile } from "@/lib/services/guest-profiles";
import { lockscorePath } from "@/lib/utils/lockscore-routes";
import { slugify } from "@/lib/utils/slugs";
import { createGroupSchema, joinGroupSchema } from "@/lib/validation/schemas";

function errorState(message: string, fieldErrors?: Record<string, string[]>) {
  return {
    ok: false,
    message,
    fieldErrors
  } satisfies ActionState;
}

async function ensureUniqueGroupSlug(baseName: string) {
  const supabase = getSupabaseAdmin();
  const baseSlug = slugify(baseName);

  for (let index = 0; index < 25; index += 1) {
    const candidate = index === 0 ? baseSlug : `${baseSlug}-${index + 1}`;
    const { data } = await supabase.from("groups").select("id").eq("slug", candidate).maybeSingle();

    if (!data) {
      return candidate;
    }
  }

  return `${baseSlug}-${Date.now().toString().slice(-4)}`;
}

async function getSportAndSeason(sportKey: string) {
  const supabase = getSupabaseAdmin();
  const { data: sport, error: sportError } = await supabase
    .from("sports")
    .select("id")
    .eq("key", sportKey)
    .maybeSingle();

  if (sportError) {
    throw sportError;
  }

  if (!sport) {
    throw new Error("Sport not found.");
  }

  const { data: competitions, error: competitionError } = await supabase
    .from("competitions")
    .select("id")
    .eq("sport_id", sport.id)
    .order("is_featured", { ascending: false })
    .limit(4);

  if (competitionError) {
    throw competitionError;
  }

  const competitionIds = (competitions ?? []).map((competition) => competition.id);
  const { data: season, error: seasonError } =
    competitionIds.length > 0
      ? await supabase
          .from("seasons")
          .select("id, competition_id")
          .in("competition_id", competitionIds)
          .eq("is_current", true)
          .order("year", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null, error: null };

  if (seasonError) {
    throw seasonError;
  }

  return {
    sportId: sport.id,
    seasonId: season?.id ?? null,
    competitionId: season?.competition_id ?? competitionIds[0] ?? null
  };
}

export async function createGroupAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = createGroupSchema.safeParse({
    name: formData.get("name"),
    groupType: formData.get("groupType"),
    visibility: formData.get("visibility"),
    sportKey: formData.get("sportKey"),
    headline: formData.get("headline"),
    description: formData.get("description"),
    stakeTemplate: formData.get("stakeTemplate"),
    punishmentTemplate: formData.get("punishmentTemplate"),
    displayName: formData.get("displayName")
  });

  if (!parsed.success) {
    return errorState("Fix the group details first.", parsed.error.flatten().fieldErrors);
  }

  const supabase = getSupabaseAdmin();
  const guest = await ensureGuestProfile(parsed.data.displayName);
  const slug = await ensureUniqueGroupSlug(parsed.data.name);
  const { sportId, competitionId, seasonId } = await getSportAndSeason(parsed.data.sportKey);

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({
      slug,
      name: parsed.data.name,
      description: parsed.data.description || null,
      group_type: parsed.data.groupType,
      visibility: parsed.data.visibility,
      sport_id: sportId,
      competition_id: competitionId,
      season_id: seasonId,
      creator_guest_profile_id: guest.id,
      headline: parsed.data.headline || null,
      stake_template: parsed.data.stakeTemplate || null,
      punishment_template: parsed.data.punishmentTemplate || null
    })
    .select("id, slug")
    .single();

  if (groupError || !group) {
    return errorState("Could not create the group.");
  }

  const { error: membershipError } = await supabase.from("group_members").insert({
    group_id: group.id,
    guest_profile_id: guest.id,
    display_name: guest.display_name,
    role: "owner"
  });

  if (membershipError) {
    return errorState("Group created, but owner membership failed.");
  }

  revalidatePath(lockscorePath("/groups"));
  revalidatePath(lockscorePath("/rooms"));
  revalidatePath(lockscorePath("/leagues"));
  revalidatePath(lockscorePath("/profile"));
  redirect(lockscorePath(`/groups/${group.slug}`));
}

export async function joinGroupAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = joinGroupSchema.safeParse({
    inviteCode: formData.get("inviteCode"),
    displayName: formData.get("displayName")
  });

  if (!parsed.success) {
    return errorState("Fix the join details first.", parsed.error.flatten().fieldErrors);
  }

  const supabase = getSupabaseAdmin();
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id, slug, name")
    .eq("invite_code", parsed.data.inviteCode)
    .maybeSingle();

  if (groupError) {
    return errorState("Could not look up that invite code.");
  }

  if (!group) {
    return errorState("Invite code not found.");
  }

  const guest = await ensureGuestProfile(parsed.data.displayName);
  const { data: existingMembership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", group.id)
    .eq("guest_profile_id", guest.id)
    .maybeSingle();

  if (!existingMembership) {
    const { error: membershipError } = await supabase.from("group_members").insert({
      group_id: group.id,
      guest_profile_id: guest.id,
      display_name: guest.display_name,
      role: "member"
    });

    if (membershipError) {
      return errorState("Could not join this group.");
    }
  }

  revalidatePath(lockscorePath("/groups"));
  revalidatePath(lockscorePath("/rooms"));
  revalidatePath(lockscorePath("/leagues"));
  revalidatePath(lockscorePath(`/groups/${group.slug}`));
  revalidatePath(lockscorePath("/profile"));
  redirect(lockscorePath(`/groups/${group.slug}`));
}
