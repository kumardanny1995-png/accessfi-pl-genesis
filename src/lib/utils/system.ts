import "server-only";

import { getOptionalEnv } from "@/lib/db/env";

export function getSystemTaskSecret() {
  return getOptionalEnv("SYSTEM_TASK_SECRET") ?? getOptionalEnv("CRON_SECRET");
}

export function isAuthorizedSystemRequest(request: Request) {
  const secret = getSystemTaskSecret();

  if (!secret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  const headerSecret = request.headers.get("x-system-secret");
  const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  return headerSecret === secret || bearerSecret === secret;
}
