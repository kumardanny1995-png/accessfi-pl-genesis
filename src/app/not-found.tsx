import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#08111f] px-6 py-12 text-white">
      <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-[0_32px_80px_rgba(3,8,20,0.45)] backdrop-blur">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/50">Can I Afford It</p>
          <h1 className="mt-4 font-[var(--font-newsreader)] text-5xl leading-none text-white">Page not found.</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/68">
            That page does not exist in the current product. Go back to the landing page or jump into your dashboard.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/">
              <Button>Go Home</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary">Open Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
