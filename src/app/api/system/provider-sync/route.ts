import { NextResponse } from "next/server";

import { syncPendingMatchesWithProviders } from "@/lib/services/provider-sync";
import { isAuthorizedSystemRequest } from "@/lib/utils/system";

export async function POST(request: Request) {
  if (!isAuthorizedSystemRequest(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const results = await syncPendingMatchesWithProviders();
  return NextResponse.json({ ok: true, results });
}
