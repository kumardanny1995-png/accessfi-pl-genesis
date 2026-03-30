"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAccessFiViewer } from "@/lib/accessfi/auth";
import {
  createCheckoutSessionRecord,
  createMembershipRecord,
  createUnlockEventRecord,
  createVaultBundle,
  ensureAccessFiProfile,
  getVaultBundleBySlug
} from "@/lib/accessfi/repository";
import { accessControlService, paymentsService, storageService } from "@/lib/accessfi/services";
import type { AccessFiStorageProvider } from "@/lib/accessfi/types";
import type { ActionState } from "@/lib/db/types";
import { createAccessFiVaultSchema, unlockAccessFiVaultSchema } from "@/lib/validation/accessfi-schemas";

const INITIAL_MESSAGE = "Please fix the highlighted fields.";

function fieldErrorsFromZod(error: { flatten: () => { fieldErrors: Record<string, string[]> } }): ActionState {
  return {
    ok: false,
    message: INITIAL_MESSAGE,
    fieldErrors: error.flatten().fieldErrors
  };
}

function resolvePreviewText(file: File, contentText: string) {
  if (contentText.trim().length > 0) {
    return contentText.trim().slice(0, 220);
  }

  if (file.type.startsWith("image/")) {
    return "Encrypted image asset stored for gated member download.";
  }

  return "Encrypted binary asset stored for gated member download.";
}

export async function createAccessFiVaultAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const viewer = await requireAccessFiViewer("/accessfi/create");
  const file = formData.get("assetFile");

  if (!(file instanceof File) || file.size === 0) {
    return {
      ok: false,
      message: "Upload one premium asset before publishing the vault."
    };
  }

  const parsed = createAccessFiVaultSchema.safeParse({
    title: formData.get("title"),
    teaser: formData.get("teaser"),
    description: formData.get("description"),
    accessType: formData.get("accessType"),
    depositAmount: formData.get("depositAmount"),
    subscriptionAmount: formData.get("subscriptionAmount"),
    currency: formData.get("currency"),
    assetTitle: formData.get("assetTitle"),
    allowlistIdentifiers: formData.get("allowlistIdentifiers"),
    tokenSymbol: formData.get("tokenSymbol"),
    tokenContract: formData.get("tokenContract"),
    minimumTokenBalance: formData.get("minimumTokenBalance"),
    timeLimitHours: formData.get("timeLimitHours")
  });

  if (!parsed.success) {
    return fieldErrorsFromZod(parsed.error);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const isTextLike =
    file.type.startsWith("text/") ||
    file.type.includes("json") ||
    file.name.endsWith(".md") ||
    file.name.endsWith(".txt") ||
    file.name.endsWith(".csv");
  const contentText = isTextLike ? await file.text() : "";

  const policy = accessControlService.createPolicy({
    accessType: parsed.data.accessType,
    depositAmount: parsed.data.depositAmount,
    subscriptionAmount: parsed.data.subscriptionAmount,
    currency: parsed.data.currency,
    allowlistIdentifiers:
      parsed.data.allowlistIdentifiers
        ?.split("\n")
        .map((entry) => entry.trim())
        .filter(Boolean) ?? [],
    tokenSymbol: parsed.data.tokenSymbol || null,
    tokenContract: parsed.data.tokenContract || null,
    minimumTokenBalance: parsed.data.minimumTokenBalance || null,
    timeLimitHours: parsed.data.timeLimitHours
  });

  const storage = await storageService.uploadEncryptedAsset({
    vaultTitle: parsed.data.title,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    bytes,
    previewText: resolvePreviewText(file, contentText),
    policy
  });

  await ensureAccessFiProfile(viewer);

  const created = await createVaultBundle({
    creator: viewer,
    title: parsed.data.title,
    teaser: parsed.data.teaser,
    description: parsed.data.description,
    accessType: parsed.data.accessType,
    depositAmount: parsed.data.depositAmount,
    subscriptionAmount: parsed.data.subscriptionAmount,
    currency: parsed.data.currency,
    allowlistIdentifiers:
      parsed.data.allowlistIdentifiers
        ?.split("\n")
        .map((entry) => entry.trim())
        .filter(Boolean) ?? [],
    tokenSymbol: parsed.data.tokenSymbol || null,
    tokenContract: parsed.data.tokenContract || null,
    minimumTokenBalance: parsed.data.minimumTokenBalance || null,
    timeLimitHours: parsed.data.timeLimitHours,
    asset: {
      title: parsed.data.assetTitle,
      originalFileName: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      previewText: resolvePreviewText(file, contentText),
      storageProvider: storage.storageProvider as AccessFiStorageProvider,
      storageRef: storage.storageRef,
      encryptionRef: storage.encryptionRef,
      encryptedPayloadB64: storage.encryptedPayloadB64,
      encrypted: storage.encrypted
    },
    policyJson: policy.policyJson
  });

  revalidatePath("/accessfi");
  revalidatePath("/accessfi/creator");
  revalidatePath(`/accessfi/vaults/${created.vault.slug}`);
  revalidatePath("/accessfi/proof");

  redirect(`/accessfi/vaults/${created.vault.slug}`);
}

export async function unlockAccessFiVaultAction(vaultSlug: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const viewer = await requireAccessFiViewer(`/accessfi/vaults/${vaultSlug}`);
  const vaultBundle = await getVaultBundleBySlug(vaultSlug);

  if (!vaultBundle) {
    return {
      ok: false,
      message: "This vault no longer exists."
    };
  }

  const parsed = unlockAccessFiVaultSchema.safeParse({
    provider: formData.get("provider"),
    flowAddress: formData.get("flowAddress"),
    nearAccountId: formData.get("nearAccountId"),
    tokenProof: formData.get("tokenProof")
  });

  if (!parsed.success) {
    return fieldErrorsFromZod(parsed.error);
  }

  const membership = vaultBundle.memberships.find((entry) => entry.userId === viewer.id) ?? null;
  const accessCheck = accessControlService.checkAccess({
    vault: vaultBundle.vault,
    policy: vaultBundle.policy,
    viewer,
    membership,
    allowlist: vaultBundle.allowlistEntries.map((entry) => entry.identifier),
    flowAddress: parsed.data.flowAddress || null,
    nearAccountId: parsed.data.nearAccountId || null,
    tokenProof: parsed.data.tokenProof || null
  });

  if (!accessCheck.ok) {
    return {
      ok: false,
      message: accessCheck.message
    };
  }

  await ensureAccessFiProfile(viewer, {
    flowAddress: parsed.data.flowAddress || null,
    nearAccountId: parsed.data.nearAccountId || null
  });

  const quote = await paymentsService.createCheckout({
    vault: vaultBundle.vault,
    provider: parsed.data.provider,
    viewer,
    flowAddress: parsed.data.flowAddress || null,
    nearAccountId: parsed.data.nearAccountId || null
  });

  await createCheckoutSessionRecord({
    id: crypto.randomUUID(),
    vaultId: vaultBundle.vault.id,
    userId: viewer.id,
    provider: quote.provider,
    status: "confirmed",
    amount: quote.amount,
    currency: quote.currency,
    txRef: quote.txRef,
    quoteJson: quote.quoteJson,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const createdMembership = await createMembershipRecord({
    vault: vaultBundle.vault,
    viewer,
    quote,
    externalAccountRef: parsed.data.flowAddress || parsed.data.nearAccountId || null,
    metadata: {
      tokenProof: parsed.data.tokenProof || null
    }
  });

  await createUnlockEventRecord({
    vaultId: vaultBundle.vault.id,
    userId: viewer.id,
    membershipId: createdMembership.id,
    assetId: vaultBundle.assets[0]?.id ?? null,
    accessType: vaultBundle.vault.accessType,
    status: "granted",
    provider: quote.provider,
    txRef: quote.txRef,
    message: `Access granted for ${vaultBundle.vault.title}.`,
    metadata: quote.quoteJson
  });

  revalidatePath(`/accessfi/vaults/${vaultBundle.vault.slug}`);
  revalidatePath("/accessfi/dashboard");
  revalidatePath("/accessfi/proof");
  revalidatePath(`/accessfi/proof/${vaultBundle.vault.slug}`);

  redirect("/accessfi/dashboard");
}
