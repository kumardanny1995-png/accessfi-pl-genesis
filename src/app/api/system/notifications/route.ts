import { NextResponse } from "next/server";

import { runNotificationSweep } from "@/lib/services/engagement";
import { isAuthorizedSystemRequest } from "@/lib/utils/system";

export async function POST(request: Request) {
  if (!isAuthorizedSystemRequest(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const result = await runNotificationSweep();
  return NextResponse.json({ ok: true, result });
}
