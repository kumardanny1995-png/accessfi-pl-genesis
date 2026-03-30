import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Manrope, Newsreader } from "next/font/google";

import { CanAffordItProvider } from "@/components/providers/can-afford-provider";
import { getAppUrl } from "@/lib/db/env";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap"
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(getAppUrl()),
  title: {
    default: "Can I Afford It | Financial Decision Engine",
    template: `%s | Can I Afford It`
  },
  description:
    "Can I Afford It helps salaried users in India understand whether a purchase, EMI, trip, move, or money decision is actually safe for their future.",
  applicationName: "Can I Afford It",
  openGraph: {
    title: "Can I Afford It",
    description:
      "Deterministic finance verdicts for real-life money decisions, backed by your salary, savings, obligations, runway, and goals.",
    siteName: "Can I Afford It",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Can I Afford It",
    description: "Decision-focused consumer finance for salaried users in India."
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${manrope.variable} ${newsreader.variable}`}>
        <CanAffordItProvider>{children}</CanAffordItProvider>
      </body>
    </html>
  );
}
