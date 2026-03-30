import { NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdmin } from "@/lib/db/supabase";

const sharePayloadSchema = z.object({
  challengeId: z.string().uuid(),
  stage: z.enum(["pre_match", "results"]),
  surface: z.enum(["native", "whatsapp", "telegram", "copy", "card"]),
  targetUrl: z.string().url(),
  messageTemplate: z.string().max(400)
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = sharePayloadSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid share payload." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("share_events").insert({
    challenge_id: parsed.data.challengeId,
    share_stage: parsed.data.stage,
    share_surface: parsed.data.surface,
    target_url: parsed.data.targetUrl,
    message_template: parsed.data.messageTemplate,
    metadata: {
      tracked_from: "api_share"
    }
  });

  if (error) {
    return NextResponse.json({ ok: false, message: "Could not record share event." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
