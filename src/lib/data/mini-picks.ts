import "server-only";

import type { MiniPickEntryView, MiniPickStatus, MiniPickWindowView } from "@/lib/db/types";
import { getSupabaseAdmin } from "@/lib/db/supabase";

function deriveStatus(args: {
  status: MiniPickStatus;
  opensAt: string;
  lockAt: string;
  settledAt: string | null;
}) {
  if (args.status === "settled" || args.status === "cancelled") {
    return args.status;
  }

  const now = Date.now();
  const opensAt = new Date(args.opensAt).getTime();
  const lockAt = new Date(args.lockAt).getTime();

  if (args.settledAt) {
    return "settled";
  }

  if (lockAt <= now) {
    return "locked";
  }

  if (opensAt <= now) {
    return "open";
  }

  return "scheduled";
}

export async function getMiniPickWindows(matchId: string, viewerGuestProfileId?: string | null): Promise<MiniPickWindowView[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("mini_pick_windows")
    .select(
      `
        id,
        key,
        title,
        prompt,
        description,
        status,
        opens_at,
        lock_at,
        settled_at,
        resolution_note,
        stake_text,
        resolved_option_id,
        resolved_option:mini_pick_options!mini_pick_windows_resolved_option_id_fkey (
          id,
          label
        ),
        mini_pick_options:mini_pick_options!mini_pick_options_window_id_fkey (
          id,
          label,
          value,
          sort_order
        ),
        mini_pick_entries (
          id,
          guest_profile_id,
          display_name,
          selected_option_id,
          submitted_at,
          is_correct,
          points_awarded
        )
      `
    )
    .eq("match_id", matchId)
    .order("opens_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((window) => {
    const options = (window.mini_pick_options ?? []).sort((left, right) => left.sort_order - right.sort_order);
    const resolvedOption = Array.isArray(window.resolved_option)
      ? (window.resolved_option[0] ?? null)
      : window.resolved_option ?? null;
    const counts = new Map<string, number>();

    for (const entry of window.mini_pick_entries ?? []) {
      counts.set(entry.selected_option_id, (counts.get(entry.selected_option_id) ?? 0) + 1);
    }

    const totalEntries = window.mini_pick_entries?.length ?? 0;
    const maxCount = Math.max(...counts.values(), 0);
    const optionLabelMap = new Map(options.map((option) => [option.id, option.label]));
    const entries: MiniPickEntryView[] = (window.mini_pick_entries ?? [])
      .map((entry) => ({
        id: entry.id,
        guestProfileId: entry.guest_profile_id,
        displayName: entry.display_name,
        optionId: entry.selected_option_id,
        optionLabel: optionLabelMap.get(entry.selected_option_id) ?? "Unknown",
        submittedAt: entry.submitted_at,
        isCorrect: entry.is_correct,
        pointsAwarded: entry.points_awarded ?? 0
      }))
      .sort((left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime());

    return {
      id: window.id,
      key: window.key,
      title: window.title,
      prompt: window.prompt,
      description: window.description,
      status: deriveStatus({
        status: window.status,
        opensAt: window.opens_at,
        lockAt: window.lock_at,
        settledAt: window.settled_at
      }),
      opensAt: window.opens_at,
      lockAt: window.lock_at,
      settledAt: window.settled_at,
      resolutionNote: window.resolution_note,
      stakeText: window.stake_text,
      totalEntries,
      options: options.map((option) => {
        const count = counts.get(option.id) ?? 0;
        const percentage = totalEntries > 0 ? Math.round((count / totalEntries) * 100) : 0;

        return {
          id: option.id,
          label: option.label,
          value: option.value,
          sortOrder: option.sort_order,
          count,
          percentage,
          leading: count > 0 && count === maxCount,
          loneWolf: totalEntries > 1 && count === 1
        };
      }),
      entries,
      viewerEntry: entries.find((entry) => entry.guestProfileId === viewerGuestProfileId) ?? null,
      outcomeOptionId: window.resolved_option_id,
      outcomeOptionLabel: resolvedOption?.label ?? (window.resolved_option_id ? optionLabelMap.get(window.resolved_option_id) ?? null : null)
    };
  });
}
