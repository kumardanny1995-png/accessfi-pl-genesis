import type { Route } from "next";

export const LOCKSCORE_BASE_PATH = "/lockscore";

export const LOCKSCORE_LEGACY_PREFIXES = [
  "/groups",
  "/matches",
  "/sports",
  "/rooms",
  "/leagues",
  "/notifications",
  "/admin",
  "/c",
  "/offline"
] as const;

function normalizePath(path: string) {
  if (!path || path === "/") {
    return "/";
  }

  return path.startsWith("/") ? path : `/${path}`;
}

export function lockscorePath(path = "/"): Route {
  const normalized = normalizePath(path);
  return (normalized === "/" ? LOCKSCORE_BASE_PATH : `${LOCKSCORE_BASE_PATH}${normalized}`) as Route;
}

export function isLegacyLockscorePath(pathname: string) {
  return LOCKSCORE_LEGACY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
