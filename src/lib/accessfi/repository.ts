import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  AccessFiAllowlistEntry,
  AccessFiAsset,
  AccessFiCheckoutSession,
  AccessFiCreateVaultInput,
  AccessFiMembership,
  AccessFiMembershipInput,
  AccessFiRepositoryMode,
  AccessFiSnapshot,
  AccessFiUnlockEvent,
  AccessFiUnlockEventInput,
  AccessFiVault,
  AccessFiVaultBundle,
  AccessFiViewer
} from "@/lib/accessfi/types";
import { createAccessFiSeedSnapshot } from "@/lib/accessfi/seed";
import { getOptionalEnv, isSupabaseConfigured } from "@/lib/db/env";
import { getSupabaseAdmin } from "@/lib/db/supabase";

const LOCAL_STORE_PATH = path.join(process.cwd(), "tmp", "accessfi-demo-store.json");

let repositoryModePromise: Promise<AccessFiRepositoryMode> | null = null;

function nowIso() {
  return new Date().toISOString();
}

function toArray<T>(value: T | T[] | null | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function relationMissing(message?: string) {
  return Boolean(message?.includes("relation") || message?.includes("does not exist") || message?.includes("schema cache"));
}

function cloneSnapshot(snapshot: AccessFiSnapshot) {
  return structuredClone(snapshot);
}

async function ensureLocalStore() {
  try {
    const file = await readFile(LOCAL_STORE_PATH, "utf8");
    return JSON.parse(file) as AccessFiSnapshot;
  } catch {
    const seed = createAccessFiSeedSnapshot();
    await mkdir(path.dirname(LOCAL_STORE_PATH), { recursive: true });
    await writeFile(LOCAL_STORE_PATH, JSON.stringify(seed, null, 2), "utf8");
    return seed;
  }
}

async function writeLocalStore(snapshot: AccessFiSnapshot) {
  snapshot.updatedAt = nowIso();
  await mkdir(path.dirname(LOCAL_STORE_PATH), { recursive: true });
  await writeFile(LOCAL_STORE_PATH, JSON.stringify(snapshot, null, 2), "utf8");
}

async function mutateLocalStore<T>(mutator: (snapshot: AccessFiSnapshot) => Promise<T> | T) {
  const snapshot = await ensureLocalStore();
  const result = await mutator(snapshot);
  await writeLocalStore(snapshot);
  return result;
}

function bundleFromSnapshot(snapshot: AccessFiSnapshot, vault: AccessFiVault): AccessFiVaultBundle {
  return {
    vault,
    assets: snapshot.assets.filter((asset) => asset.vaultId === vault.id),
    policy: snapshot.policies.find((policy) => policy.vaultId === vault.id) ?? null,
    memberships: snapshot.memberships.filter((membership) => membership.vaultId === vault.id),
    unlockEvents: snapshot.unlockEvents
      .filter((event) => event.vaultId === vault.id)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    allowlistEntries: snapshot.allowlistEntries.filter((entry) => entry.vaultId === vault.id)
  };
}

async function detectSupabaseTables() {
  if (!isSupabaseConfigured() || !getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY")) {
    return "file" as const;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("accessfi_vaults").select("id").limit(1);

    if (error && relationMissing(error.message)) {
      return "file" as const;
    }

    return error ? ("file" as const) : ("supabase" as const);
  } catch {
    return "file" as const;
  }
}

export async function getAccessFiRepositoryMode() {
  if (!repositoryModePromise) {
    repositoryModePromise = detectSupabaseTables();
  }

  return repositoryModePromise;
}

export async function ensureAccessFiProfile(viewer: AccessFiViewer, linked?: { flowAddress?: string | null; nearAccountId?: string | null }) {
  const mode = await getAccessFiRepositoryMode();

  if (mode === "file") {
    await mutateLocalStore((snapshot) => {
      const existing = snapshot.profiles.find((profile) => profile.userId === viewer.id);

      if (existing) {
        existing.email = viewer.email;
        existing.displayName = viewer.displayName;
        existing.avatarUrl = viewer.avatarUrl;
        existing.flowAddress = linked?.flowAddress ?? existing.flowAddress;
        existing.nearAccountId = linked?.nearAccountId ?? existing.nearAccountId;
        existing.updatedAt = nowIso();
        return;
      }

      snapshot.profiles.push({
        userId: viewer.id,
        email: viewer.email,
        displayName: viewer.displayName,
        avatarUrl: viewer.avatarUrl,
        flowAddress: linked?.flowAddress ?? null,
        nearAccountId: linked?.nearAccountId ?? null,
        createdAt: nowIso(),
        updatedAt: nowIso()
      });
    });

    return;
  }

  const supabase = getSupabaseAdmin();

  await supabase.from("users").upsert(
    {
      id: viewer.id,
      display_name: viewer.displayName,
      avatar_url: viewer.avatarUrl
    },
    { onConflict: "id" }
  );
}

function normalizeAmount(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function bundleFromSupabaseRow(row: Record<string, unknown>): AccessFiVaultBundle {
  const vault: AccessFiVault = {
    id: String(row["id"]),
    creatorUserId: row["creator_user_id"] ? String(row["creator_user_id"]) : null,
    creatorName: String(row["creator_name"] ?? "AccessFi Creator"),
    creatorAvatarUrl: row["creator_avatar_url"] ? String(row["creator_avatar_url"]) : null,
    title: String(row["title"]),
    slug: String(row["slug"]),
    teaser: String(row["teaser"] ?? ""),
    description: String(row["description"] ?? ""),
    thumbnailUrl: row["thumbnail_url"] ? String(row["thumbnail_url"]) : null,
    previewUrl: row["preview_url"] ? String(row["preview_url"]) : null,
    accessType: row["access_type"] as AccessFiVault["accessType"],
    depositAmount: normalizeAmount(row["deposit_amount"] as number | null | undefined),
    subscriptionAmount: normalizeAmount(row["subscription_amount"] as number | null | undefined),
    currency: String(row["currency"] ?? "USDC"),
    published: Boolean(row["published"]),
    metadata: (row["metadata"] as Record<string, unknown> | null) ?? {},
    createdAt: String(row["created_at"]),
    updatedAt: String(row["updated_at"])
  };

  const assets: AccessFiAsset[] = toArray(row["accessfi_assets"] as Record<string, unknown>[]).map((asset) => ({
    id: String(asset["id"]),
    vaultId: String(asset["vault_id"]),
    title: String(asset["title"] ?? asset["original_file_name"]),
    originalFileName: String(asset["original_file_name"]),
    mimeType: String(asset["mime_type"]),
    sizeBytes: Number(asset["size_bytes"] ?? 0),
    encrypted: Boolean(asset["encrypted"]),
    storageProvider: asset["storage_provider"] as AccessFiAsset["storageProvider"],
    storageRef: String(asset["storage_ref"] ?? ""),
    encryptionRef: String(asset["encryption_ref"] ?? ""),
    previewText: String(asset["preview_text"] ?? ""),
    encryptedPayloadB64: asset["encrypted_payload_b64"] ? String(asset["encrypted_payload_b64"]) : null,
    createdAt: String(asset["created_at"])
  }));

  const policies = toArray(row["accessfi_access_policies"] as Record<string, unknown>[]);
  const policy = policies[0]
    ? {
        id: String(policies[0]["id"]),
        vaultId: String(policies[0]["vault_id"]),
        policyType: policies[0]["policy_type"] as AccessFiVault["accessType"],
        policyJson: (policies[0]["policy_json"] as Record<string, unknown> | null) ?? {},
        createdAt: String(policies[0]["created_at"]),
        updatedAt: String(policies[0]["updated_at"])
      }
    : null;

  const memberships: AccessFiMembership[] = toArray(row["accessfi_memberships"] as Record<string, unknown>[]).map((membership) => ({
    id: String(membership["id"]),
    vaultId: String(membership["vault_id"]),
    userId: String(membership["user_id"]),
    planType: membership["plan_type"] as AccessFiMembership["planType"],
    status: membership["status"] as AccessFiMembership["status"],
    depositAmount: normalizeAmount(membership["deposit_amount"] as number | null | undefined),
    reservedBalance: normalizeAmount(membership["reserved_balance"] as number | null | undefined),
    subscriptionAmount: normalizeAmount(membership["subscription_amount"] as number | null | undefined),
    currency: String(membership["currency"] ?? "USDC"),
    paymentProvider: membership["payment_provider"] as AccessFiMembership["paymentProvider"],
    externalAccountRef: membership["external_account_ref"] ? String(membership["external_account_ref"]) : null,
    metadata: (membership["metadata"] as Record<string, unknown> | null) ?? {},
    createdAt: String(membership["created_at"]),
    startAt: membership["start_at"] ? String(membership["start_at"]) : null,
    endAt: membership["end_at"] ? String(membership["end_at"]) : null,
    updatedAt: String(membership["updated_at"])
  }));

  const unlockEvents: AccessFiUnlockEvent[] = toArray(row["accessfi_unlock_events"] as Record<string, unknown>[])
    .map((event) => ({
      id: String(event["id"]),
      vaultId: String(event["vault_id"]),
      userId: String(event["user_id"]),
      membershipId: event["membership_id"] ? String(event["membership_id"]) : null,
      assetId: event["asset_id"] ? String(event["asset_id"]) : null,
      accessType: event["access_type"] as AccessFiUnlockEvent["accessType"],
      status: event["status"] as AccessFiUnlockEvent["status"],
      provider: String(event["provider"] ?? "accessfi"),
      txRef: event["tx_ref"] ? String(event["tx_ref"]) : null,
      message: String(event["message"] ?? ""),
      metadata: (event["metadata"] as Record<string, unknown> | null) ?? {},
      createdAt: String(event["created_at"])
    }))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  const allowlistEntries: AccessFiAllowlistEntry[] = toArray(row["accessfi_allowlist_entries"] as Record<string, unknown>[]).map((entry) => ({
    id: String(entry["id"]),
    vaultId: String(entry["vault_id"]),
    identifier: String(entry["identifier"]),
    type: entry["identifier_type"] as AccessFiAllowlistEntry["type"],
    createdAt: String(entry["created_at"])
  }));

  return {
    vault,
    assets,
    policy,
    memberships,
    unlockEvents,
    allowlistEntries
  };
}

async function fetchSupabaseBundles(filter?: { creatorUserId?: string; slug?: string; memberUserId?: string }) {
  const supabase = getSupabaseAdmin();
  let query = supabase.from("accessfi_vaults").select(`
      *,
      accessfi_assets (*),
      accessfi_access_policies (*),
      accessfi_memberships (*),
      accessfi_unlock_events (*),
      accessfi_allowlist_entries (*)
    `);

  if (filter?.creatorUserId) {
    query = query.eq("creator_user_id", filter.creatorUserId);
  }

  if (filter?.slug) {
    query = query.eq("slug", filter.slug);
  }

  if (!filter?.creatorUserId && !filter?.slug) {
    query = query.eq("published", true);
  }

  const { data, error } = await query.order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  let bundles = toArray(data).map((row) => bundleFromSupabaseRow(row));

  if (filter?.memberUserId) {
    bundles = bundles.filter((bundle) => bundle.memberships.some((membership) => membership.userId === filter.memberUserId));
  }

  return bundles;
}

export async function listPublicVaultBundles() {
  const mode = await getAccessFiRepositoryMode();

  if (mode === "file") {
    const snapshot = cloneSnapshot(await ensureLocalStore());
    return snapshot.vaults
      .filter((vault) => vault.published)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map((vault) => bundleFromSnapshot(snapshot, vault));
  }

  return fetchSupabaseBundles();
}

export async function listCreatorVaultBundles(creatorUserId: string) {
  const mode = await getAccessFiRepositoryMode();

  if (mode === "file") {
    const snapshot = cloneSnapshot(await ensureLocalStore());
    return snapshot.vaults
      .filter((vault) => vault.creatorUserId === creatorUserId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map((vault) => bundleFromSnapshot(snapshot, vault));
  }

  return fetchSupabaseBundles({ creatorUserId });
}

export async function listMemberVaultBundles(userId: string) {
  const mode = await getAccessFiRepositoryMode();

  if (mode === "file") {
    const snapshot = cloneSnapshot(await ensureLocalStore());
    const membershipVaultIds = new Set(snapshot.memberships.filter((membership) => membership.userId === userId).map((membership) => membership.vaultId));
    return snapshot.vaults
      .filter((vault) => membershipVaultIds.has(vault.id))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map((vault) => bundleFromSnapshot(snapshot, vault));
  }

  return fetchSupabaseBundles({ memberUserId: userId });
}

export async function getVaultBundleBySlug(slug: string) {
  const mode = await getAccessFiRepositoryMode();

  if (mode === "file") {
    const snapshot = cloneSnapshot(await ensureLocalStore());
    const vault = snapshot.vaults.find((entry) => entry.slug === slug);
    return vault ? bundleFromSnapshot(snapshot, vault) : null;
  }

  const bundles = await fetchSupabaseBundles({ slug });
  return bundles[0] ?? null;
}

export async function getAssetById(assetId: string) {
  const mode = await getAccessFiRepositoryMode();

  if (mode === "file") {
    const snapshot = cloneSnapshot(await ensureLocalStore());
    return snapshot.assets.find((asset) => asset.id === assetId) ?? null;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("accessfi_assets").select("*").eq("id", assetId).maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: String(data.id),
    vaultId: String(data.vault_id),
    title: String(data.title ?? data.original_file_name),
    originalFileName: String(data.original_file_name),
    mimeType: String(data.mime_type),
    sizeBytes: Number(data.size_bytes ?? 0),
    encrypted: Boolean(data.encrypted),
    storageProvider: data.storage_provider,
    storageRef: String(data.storage_ref ?? ""),
    encryptionRef: String(data.encryption_ref ?? ""),
    previewText: String(data.preview_text ?? ""),
    encryptedPayloadB64: data.encrypted_payload_b64 ? String(data.encrypted_payload_b64) : null,
    createdAt: String(data.created_at)
  } satisfies AccessFiAsset;
}

export async function createCheckoutSessionRecord(session: AccessFiCheckoutSession) {
  const mode = await getAccessFiRepositoryMode();

  if (mode === "file") {
    await mutateLocalStore((snapshot) => {
      snapshot.checkoutSessions.push(session);
    });
    return session;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("accessfi_checkout_sessions").insert({
    id: session.id,
    vault_id: session.vaultId,
    user_id: session.userId,
    provider: session.provider,
    status: session.status,
    amount: session.amount,
    currency: session.currency,
    tx_ref: session.txRef,
    quote_json: session.quoteJson,
    created_at: session.createdAt,
    updated_at: session.updatedAt
  });

  if (error) {
    throw error;
  }

  return session;
}

export async function createMembershipRecord(input: AccessFiMembershipInput) {
  const membership: AccessFiMembership = {
    id: crypto.randomUUID(),
    vaultId: input.vault.id,
    userId: input.viewer.id,
    planType: input.vault.accessType,
    status: "active",
    depositAmount: input.vault.depositAmount,
    reservedBalance: input.vault.depositAmount,
    subscriptionAmount: input.vault.subscriptionAmount,
    currency: input.vault.currency,
    paymentProvider: input.quote.provider,
    externalAccountRef: input.externalAccountRef,
    metadata: input.metadata,
    createdAt: nowIso(),
    startAt: nowIso(),
    endAt:
      input.vault.accessType === "time_based_access"
        ? new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
        : null,
    updatedAt: nowIso()
  };

  const mode = await getAccessFiRepositoryMode();

  if (mode === "file") {
    await mutateLocalStore((snapshot) => {
      const existing = snapshot.memberships.find(
        (entry) => entry.vaultId === membership.vaultId && entry.userId === membership.userId
      );

      if (existing) {
        existing.status = "active";
        existing.depositAmount = membership.depositAmount;
        existing.reservedBalance = membership.reservedBalance;
        existing.subscriptionAmount = membership.subscriptionAmount;
        existing.paymentProvider = membership.paymentProvider;
        existing.externalAccountRef = membership.externalAccountRef;
        existing.metadata = membership.metadata;
        existing.startAt = membership.startAt;
        existing.endAt = membership.endAt;
        existing.updatedAt = membership.updatedAt;
        return;
      }

      snapshot.memberships.push(membership);
    });

    return membership;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("accessfi_memberships").upsert(
    {
      id: membership.id,
      vault_id: membership.vaultId,
      user_id: membership.userId,
      plan_type: membership.planType,
      status: membership.status,
      deposit_amount: membership.depositAmount,
      reserved_balance: membership.reservedBalance,
      subscription_amount: membership.subscriptionAmount,
      currency: membership.currency,
      payment_provider: membership.paymentProvider,
      external_account_ref: membership.externalAccountRef,
      metadata: membership.metadata,
      created_at: membership.createdAt,
      start_at: membership.startAt,
      end_at: membership.endAt,
      updated_at: membership.updatedAt
    },
    { onConflict: "vault_id,user_id" }
  );

  if (error) {
    throw error;
  }

  return membership;
}

export async function createUnlockEventRecord(input: AccessFiUnlockEventInput) {
  const event: AccessFiUnlockEvent = {
    id: crypto.randomUUID(),
    vaultId: input.vaultId,
    userId: input.userId,
    membershipId: input.membershipId ?? null,
    assetId: input.assetId ?? null,
    accessType: input.accessType,
    status: input.status,
    provider: input.provider,
    txRef: input.txRef,
    message: input.message,
    metadata: input.metadata ?? {},
    createdAt: nowIso()
  };

  const mode = await getAccessFiRepositoryMode();

  if (mode === "file") {
    await mutateLocalStore((snapshot) => {
      snapshot.unlockEvents.push(event);
    });
    return event;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("accessfi_unlock_events").insert({
    id: event.id,
    vault_id: event.vaultId,
    user_id: event.userId,
    membership_id: event.membershipId,
    asset_id: event.assetId,
    access_type: event.accessType,
    status: event.status,
    provider: event.provider,
    tx_ref: event.txRef,
    message: event.message,
    metadata: event.metadata,
    created_at: event.createdAt
  });

  if (error) {
    throw error;
  }

  return event;
}

export async function createVaultBundle(input: AccessFiCreateVaultInput) {
  const createdAt = nowIso();
  const vaultId = crypto.randomUUID();
  const assetId = crypto.randomUUID();
  const policyId = crypto.randomUUID();
  const slugBase = input.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const slug = `${slugBase}-${vaultId.slice(0, 6)}`;

  const vault: AccessFiVault = {
    id: vaultId,
    creatorUserId: input.creator.id,
    creatorName: input.creator.displayName,
    creatorAvatarUrl: input.creator.avatarUrl,
    title: input.title,
    slug,
    teaser: input.teaser,
    description: input.description,
    thumbnailUrl: null,
    previewUrl: null,
    accessType: input.accessType,
    depositAmount: input.depositAmount,
    subscriptionAmount: input.subscriptionAmount,
    currency: input.currency,
    published: true,
    metadata: {
      tokenSymbol: input.tokenSymbol,
      tokenContract: input.tokenContract,
      minimumTokenBalance: input.minimumTokenBalance,
      timeLimitHours: input.timeLimitHours
    },
    createdAt,
    updatedAt: createdAt
  };

  const asset: AccessFiAsset = {
    id: assetId,
    vaultId,
    title: input.asset.title,
    originalFileName: input.asset.originalFileName,
    mimeType: input.asset.mimeType,
    sizeBytes: input.asset.sizeBytes,
    encrypted: input.asset.encrypted,
    storageProvider: input.asset.storageProvider,
    storageRef: input.asset.storageRef,
    encryptionRef: input.asset.encryptionRef,
    previewText: input.asset.previewText,
    encryptedPayloadB64: input.asset.encryptedPayloadB64,
    createdAt
  };

  const policy = {
    id: policyId,
    vaultId,
    policyType: input.accessType,
    policyJson: input.policyJson,
    createdAt,
    updatedAt: createdAt
  };

  const allowlistEntries = input.allowlistIdentifiers.map<AccessFiAllowlistEntry>((identifier) => ({
    id: crypto.randomUUID(),
    vaultId,
    identifier,
    type: identifier.includes("@") ? "email" : "domain",
    createdAt
  }));

  const mode = await getAccessFiRepositoryMode();

  if (mode === "file") {
    await mutateLocalStore((snapshot) => {
      snapshot.vaults.push(vault);
      snapshot.assets.push(asset);
      snapshot.policies.push(policy);
      snapshot.allowlistEntries.push(...allowlistEntries);
    });

    return {
      vault,
      assets: [asset],
      policy,
      memberships: [],
      unlockEvents: [],
      allowlistEntries
    } satisfies AccessFiVaultBundle;
  }

  const supabase = getSupabaseAdmin();
  const { error: vaultError } = await supabase.from("accessfi_vaults").insert({
    id: vault.id,
    creator_user_id: vault.creatorUserId,
    creator_name: vault.creatorName,
    creator_avatar_url: vault.creatorAvatarUrl,
    title: vault.title,
    slug: vault.slug,
    teaser: vault.teaser,
    description: vault.description,
    thumbnail_url: vault.thumbnailUrl,
    preview_url: vault.previewUrl,
    access_type: vault.accessType,
    deposit_amount: vault.depositAmount,
    subscription_amount: vault.subscriptionAmount,
    currency: vault.currency,
    published: vault.published,
    metadata: vault.metadata,
    created_at: vault.createdAt,
    updated_at: vault.updatedAt
  });

  if (vaultError) {
    throw vaultError;
  }

  const { error: assetError } = await supabase.from("accessfi_assets").insert({
    id: asset.id,
    vault_id: asset.vaultId,
    title: asset.title,
    original_file_name: asset.originalFileName,
    mime_type: asset.mimeType,
    size_bytes: asset.sizeBytes,
    encrypted: asset.encrypted,
    storage_provider: asset.storageProvider,
    storage_ref: asset.storageRef,
    encryption_ref: asset.encryptionRef,
    preview_text: asset.previewText,
    encrypted_payload_b64: asset.encryptedPayloadB64,
    created_at: asset.createdAt
  });

  if (assetError) {
    throw assetError;
  }

  const { error: policyError } = await supabase.from("accessfi_access_policies").insert({
    id: policy.id,
    vault_id: policy.vaultId,
    policy_type: policy.policyType,
    policy_json: policy.policyJson,
    created_at: policy.createdAt,
    updated_at: policy.updatedAt
  });

  if (policyError) {
    throw policyError;
  }

  if (allowlistEntries.length > 0) {
    const { error: allowlistError } = await supabase.from("accessfi_allowlist_entries").insert(
      allowlistEntries.map((entry) => ({
        id: entry.id,
        vault_id: entry.vaultId,
        identifier: entry.identifier,
        identifier_type: entry.type,
        created_at: entry.createdAt
      }))
    );

    if (allowlistError) {
      throw allowlistError;
    }
  }

  return {
    vault,
    assets: [asset],
    policy,
    memberships: [],
    unlockEvents: [],
    allowlistEntries
  } satisfies AccessFiVaultBundle;
}
