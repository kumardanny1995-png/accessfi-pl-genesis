"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

export function AutoRefresh({ enabled, intervalMs = 15000 }: { enabled: boolean; intervalMs?: number }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const refresh = () => {
      if (document.visibilityState !== "visible" || !navigator.onLine) {
        return;
      }

      startTransition(() => {
        router.refresh();
      });
    };

    const interval = window.setInterval(refresh, intervalMs);
    const handleVisibility = () => refresh();

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled, intervalMs, router, startTransition]);

  return null;
}
