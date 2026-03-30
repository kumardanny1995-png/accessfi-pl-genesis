import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getRequiredEnv, isSupabaseConfigured } from "@/lib/db/env";

export async function getSupabaseServerClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const store = await cookies();

  return createServerClient(getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"), getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    cookies: {
      get(name) {
        return store.get(name)?.value;
      },
      set(name, value, options) {
        store.set({
          name,
          value,
          ...options
        });
      },
      remove(name, options) {
        store.set({
          name,
          value: "",
          ...options
        });
      }
    }
  });
}

export async function getSupabaseServerUser() {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}
