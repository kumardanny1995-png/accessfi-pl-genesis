"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#08111f] px-6 py-12 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
          <div className="w-full rounded-[2rem] border border-[#ff716c]/18 bg-white/5 p-8 shadow-[0_32px_80px_rgba(3,8,20,0.45)] backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#ff9a95]">Something broke</p>
            <h1 className="mt-4 font-[var(--font-newsreader)] text-5xl leading-none text-white">This page hit an error.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">
              Try the page again. If the issue keeps happening, return to the dashboard and retry the flow from there.
            </p>
            <p className="mt-4 rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/58">
              {error.message || "Unexpected application error."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={() => reset()}>Try Again</Button>
              <Button variant="secondary" onClick={() => (window.location.href = "/dashboard")}>
                Go To Dashboard
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
