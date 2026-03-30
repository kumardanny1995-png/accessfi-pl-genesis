import { z } from "zod";

import { ACCESSFI_ACCESS_TYPES, ACCESSFI_CHECKOUT_PROVIDERS } from "@/lib/accessfi/types";

const numberField = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const next = Number(trimmed);
  return Number.isFinite(next) ? next : trimmed;
}, z.number().nonnegative().nullable());

export const createAccessFiVaultSchema = z.object({
  title: z.string().trim().min(3, "Vault title is required.").max(80, "Keep it under 80 characters."),
  teaser: z.string().trim().min(12, "Add a short teaser.").max(140, "Keep it under 140 characters."),
  description: z.string().trim().min(24, "Describe what members unlock.").max(800, "Keep it concise."),
  accessType: z.enum(ACCESSFI_ACCESS_TYPES),
  depositAmount: numberField,
  subscriptionAmount: numberField,
  currency: z.string().trim().min(2).max(12).default("USDC"),
  assetTitle: z.string().trim().min(3, "Asset title is required.").max(80, "Keep it short."),
  allowlistIdentifiers: z.string().trim().max(1000).optional().or(z.literal("")),
  tokenSymbol: z.string().trim().max(24).optional().or(z.literal("")),
  tokenContract: z.string().trim().max(80).optional().or(z.literal("")),
  minimumTokenBalance: z.string().trim().max(40).optional().or(z.literal("")),
  timeLimitHours: numberField
});

export const unlockAccessFiVaultSchema = z.object({
  provider: z.enum(ACCESSFI_CHECKOUT_PROVIDERS),
  flowAddress: z.string().trim().max(64).optional().or(z.literal("")),
  nearAccountId: z.string().trim().max(64).optional().or(z.literal("")),
  tokenProof: z.string().trim().max(140).optional().or(z.literal(""))
});
