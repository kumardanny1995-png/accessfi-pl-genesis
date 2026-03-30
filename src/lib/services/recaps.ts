import "server-only";

import type { AiGenerationKind, ChallengeAiCopy, ChallengePageData } from "@/lib/db/types";
import { isAiGenerationEnabled } from "@/lib/db/env";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import { getChallengeAiProvider } from "@/lib/ai";

const compareKinds: AiGenerationKind[] = ["pre_match_storyline"];
const resultKinds: AiGenerationKind[] = ["post_match_recap", "rivalry_summary", "trash_talk"];

function normalizeGenerationRow(row: {
  kind: AiGenerationKind;
  status: ChallengeAiCopy["status"];
  provider_key: string | null;
  output_text: string | null;
  output_json: Record<string, unknown>;
}): ChallengeAiCopy | null {
  const title = typeof row.output_json.title === "string" ? row.output_json.title : null;
  const body =
    typeof row.output_json.body === "string"
      ? row.output_json.body
      : typeof row.output_text === "string"
        ? row.output_text
        : null;
  const shareLine =
    typeof row.output_json.shareLine === "string" ? row.output_json.shareLine : row.output_json.shareLine === null ? null : null;

  return title && body
    ? {
        kind: row.kind,
        title,
        body,
        shareLine,
        status: row.status,
        providerKey: row.provider_key
      }
    : null;
}

function getPunishmentLine(data: ChallengePageData) {
  return data.challenge.stakeText ?? null;
}

async function loadExistingChallengeCopy(challengeId: string, kinds: AiGenerationKind[]) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("ai_generations")
    .select("kind, status, provider_key, output_text, output_json")
    .eq("challenge_id", challengeId)
    .in("kind", kinds)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const normalized = new Map<AiGenerationKind, ChallengeAiCopy>();

  for (const row of data ?? []) {
    if (normalized.has(row.kind)) {
      continue;
    }

    const item = normalizeGenerationRow(row);
    if (item) {
      normalized.set(row.kind, item);
    }
  }

  return normalized;
}

async function generateChallengeCopy(
  data: ChallengePageData,
  kind: AiGenerationKind,
  punishmentLine: string | null
): Promise<ChallengeAiCopy | null> {
  if (!isAiGenerationEnabled()) {
    return null;
  }

  const provider = getChallengeAiProvider();
  const generated = await provider.generate({
    kind,
    context: {
      data,
      punishmentLine: punishmentLine ?? getPunishmentLine(data)
    }
  });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("ai_generations").insert({
    challenge_id: data.challenge.id,
    match_id: data.match.id,
    group_id: data.challenge.groupId,
    kind,
    status: "generated",
    provider_key: provider.key,
    prompt_version: "phase4-v1",
    output_text: generated.body,
    output_json: generated
  });

  if (error) {
    throw error;
  }

  return {
    kind,
    title: generated.title,
    body: generated.body,
    shareLine: generated.shareLine,
    status: "generated",
    providerKey: provider.key
  };
}

export async function getChallengeAiBundle(data: ChallengePageData, stage: "compare" | "results") {
  const kinds = stage === "compare" ? compareKinds : resultKinds;
  const copy = await loadExistingChallengeCopy(data.challenge.id, kinds);

  for (const kind of kinds) {
    if (copy.has(kind)) {
      continue;
    }

    try {
      const generated = await generateChallengeCopy(data, kind, getPunishmentLine(data));
      if (generated) {
        copy.set(kind, generated);
      }
    } catch (error) {
      const supabase = getSupabaseAdmin();
      await supabase.from("ai_generations").insert({
        challenge_id: data.challenge.id,
        match_id: data.match.id,
        group_id: data.challenge.groupId,
        kind,
        status: "failed",
        provider_key: getChallengeAiProvider().key,
        prompt_version: "phase4-v1",
        output_text: error instanceof Error ? error.message : "Generation failed.",
        output_json: {}
      });
    }
  }

  return {
    preMatchStoryline: copy.get("pre_match_storyline") ?? null,
    postMatchRecap: copy.get("post_match_recap") ?? null,
    rivalrySummary: copy.get("rivalry_summary") ?? null,
    trashTalk: copy.get("trash_talk") ?? null
  };
}
