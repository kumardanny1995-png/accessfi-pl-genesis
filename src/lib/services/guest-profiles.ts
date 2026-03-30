import "server-only";

import { getSupabaseAdmin } from "@/lib/db/supabase";
import { getGuestContext, rememberGuestProfile } from "@/lib/utils/guest";

export async function ensureGuestProfile(displayName: string) {
  const supabase = getSupabaseAdmin();
  const { guestProfileId } = await getGuestContext();

  if (guestProfileId) {
    const { data, error } = await supabase
      .from("guest_profiles")
      .update({ display_name: displayName, updated_at: new Date().toISOString() })
      .eq("id", guestProfileId)
      .select("id, display_name")
      .maybeSingle();

    if (!error && data) {
      await rememberGuestProfile(data.id, data.display_name);
      return data;
    }
  }

  const { data, error } = await supabase
    .from("guest_profiles")
    .insert({ display_name: displayName })
    .select("id, display_name")
    .single();

  if (error) {
    throw error;
  }

  await rememberGuestProfile(data.id, data.display_name);
  return data;
}
