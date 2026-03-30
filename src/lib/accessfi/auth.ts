import "server-only";

import { redirect } from "next/navigation";

import type { AccessFiViewer } from "@/lib/accessfi/types";
import { getSupabaseServerUser } from "@/lib/supabase/server";

function buildViewerFromUser(user: NonNullable<Awaited<ReturnType<typeof getSupabaseServerUser>>>): AccessFiViewer {
  return {
    id: user.id,
    email: user.email ?? "member@accessfi.local",
    displayName:
      (typeof user.user_metadata?.display_name === "string" && user.user_metadata.display_name) ||
      user.email?.split("@")[0] ||
      "AccessFi Member",
    avatarUrl: typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null
  };
}

export async function getAccessFiViewer() {
  const user = await getSupabaseServerUser();

  if (!user) {
    return null;
  }

  return buildViewerFromUser(user);
}

export async function requireAccessFiViewer(nextPath: string) {
  const viewer = await getAccessFiViewer();

  if (!viewer) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return viewer;
}
