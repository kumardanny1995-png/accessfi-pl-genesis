import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AccessFiShell } from "@/components/accessfi/shared";

export const metadata: Metadata = {
  title: {
    default: "AccessFi",
    template: "%s | AccessFi"
  },
  description:
    "AccessFi is a deposit-backed premium access product for research clubs, operator rooms, and private tools with programmable rights, walletless onboarding, and proof-linked storage."
};

export default function AccessFiLayout({ children }: { children: ReactNode }) {
  return <AccessFiShell>{children}</AccessFiShell>;
}
