import type { Route } from "next";
import Link from "next/link";

import { Button } from "@/components/shared/button";
import { Panel } from "@/components/shared/panel";

export function EmptyState({
  title,
  description,
  ctaHref,
  ctaLabel
}: {
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <Panel className="text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/45">Quiet Board</p>
      <h3 className="mt-3 text-2xl font-black uppercase tracking-[0.06em] text-cream">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/68">{description}</p>
      {ctaHref && ctaLabel ? (
        <div className="mt-5">
          <Link href={ctaHref as Route}>
            <Button>{ctaLabel}</Button>
          </Link>
        </div>
      ) : null}
    </Panel>
  );
}
