import { NextResponse } from "next/server";

import {
  deletePushSubscriptionSchema,
  pushSubscriptionSchema
} from "@/lib/validation/schemas";
import { getGuestContext } from "@/lib/utils/guest";
import {
  deactivateWebPushSubscription,
  upsertWebPushSubscription
} from "@/lib/services/web-push";

export async function POST(request: Request) {
  const { guestProfileId } = await getGuestContext();

  if (!guestProfileId) {
    return NextResponse.json({ ok: false, message: "Join a challenge first." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = pushSubscriptionSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Push subscription is invalid." }, { status: 400 });
  }

  try {
    await upsertWebPushSubscription({
      guestProfileId,
      subscription: parsed.data.subscription,
      userAgent: request.headers.get("user-agent")
    });
  } catch {
    return NextResponse.json({ ok: false, message: "Could not enable push alerts." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { guestProfileId } = await getGuestContext();

  if (!guestProfileId) {
    return NextResponse.json({ ok: false, message: "Join a challenge first." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = deletePushSubscriptionSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Push endpoint is invalid." }, { status: 400 });
  }

  try {
    await deactivateWebPushSubscription({
      guestProfileId,
      endpoint: parsed.data.endpoint
    });
  } catch {
    return NextResponse.json({ ok: false, message: "Could not disable push alerts." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
