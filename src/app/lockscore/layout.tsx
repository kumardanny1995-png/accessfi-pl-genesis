import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteShell } from "@/components/layout/site-shell";

export const metadata: Metadata = {
  title: "LockScore",
  description:
    "IPL-first social sports predictions with rivalry boards, season tables, creator rooms, and public receipts.",
  applicationName: "LockScore",
  openGraph: {
    title: "LockScore",
    description:
      "IPL-first social sports predictions with rivalry boards, season tables, creator rooms, and public receipts.",
    siteName: "LockScore",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "LockScore",
    description: "Social sports prediction boards built for public receipts."
  }
};

export default function LockScoreLayout({ children }: { children: ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
