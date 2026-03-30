import { createHash } from "crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getRequiredEnv } from "@/lib/db/env";
import { lockscorePath } from "@/lib/utils/lockscore-routes";

const ADMIN_COOKIE = "lockscore_admin";

function getSessionValue() {
  const passcode = getRequiredEnv("ADMIN_PASSCODE");
  return createHash("sha256").update(passcode).digest("hex");
}

export async function requireAdminSession() {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;

  if (!token || token !== getSessionValue()) {
    redirect(lockscorePath("/admin/login"));
  }
}

export async function setAdminSession() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, getSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}
