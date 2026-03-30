export const ACCESSFI_ACCESS_TYPES = [
  "deposit_to_unlock",
  "subscription_access",
  "token_gated_access",
  "allowlist_access",
  "time_based_access"
] as const;

export const ACCESSFI_MEMBERSHIP_STATUSES = ["pending", "active", "paused", "expired", "cancelled"] as const;
export const ACCESSFI_UNLOCK_STATUSES = ["pending", "granted", "blocked", "failed"] as const;
export const ACCESSFI_STORAGE_PROVIDERS = ["storacha", "filecoin", "local_demo"] as const;
export const ACCESSFI_CHECKOUT_PROVIDERS = ["flow_wallet", "near_intent", "email_passkey"] as const;

export type AccessFiAccessType = (typeof ACCESSFI_ACCESS_TYPES)[number];
export type AccessFiMembershipStatus = (typeof ACCESSFI_MEMBERSHIP_STATUSES)[number];
export type AccessFiUnlockStatus = (typeof ACCESSFI_UNLOCK_STATUSES)[number];
export type AccessFiStorageProvider = (typeof ACCESSFI_STORAGE_PROVIDERS)[number];
export type AccessFiCheckoutProvider = (typeof ACCESSFI_CHECKOUT_PROVIDERS)[number];
export type AccessFiRepositoryMode = "supabase" | "file";

export interface AccessFiViewer {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface AccessFiProfile {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  flowAddress: string | null;
  nearAccountId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccessFiVault {
  id: string;
  creatorUserId: string | null;
  creatorName: string;
  creatorAvatarUrl: string | null;
  title: string;
  slug: string;
  teaser: string;
  description: string;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  accessType: AccessFiAccessType;
  depositAmount: number | null;
  subscriptionAmount: number | null;
  currency: string;
  published: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AccessFiAsset {
  id: string;
  vaultId: string;
  title: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  encrypted: boolean;
  storageProvider: AccessFiStorageProvider;
  storageRef: string;
  encryptionRef: string;
  previewText: string;
  encryptedPayloadB64: string | null;
  createdAt: string;
}

export interface AccessFiAccessPolicy {
  id: string;
  vaultId: string;
  policyType: AccessFiAccessType;
  policyJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AccessFiMembership {
  id: string;
  vaultId: string;
  userId: string;
  planType: AccessFiAccessType;
  status: AccessFiMembershipStatus;
  depositAmount: number | null;
  reservedBalance: number | null;
  subscriptionAmount: number | null;
  currency: string;
  paymentProvider: AccessFiCheckoutProvider;
  externalAccountRef: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  startAt: string | null;
  endAt: string | null;
  updatedAt: string;
}

export interface AccessFiUnlockEvent {
  id: string;
  vaultId: string;
  userId: string;
  membershipId: string | null;
  assetId: string | null;
  accessType: AccessFiAccessType;
  status: AccessFiUnlockStatus;
  provider: string;
  txRef: string | null;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AccessFiAllowlistEntry {
  id: string;
  vaultId: string;
  identifier: string;
  type: "email" | "domain" | "user_id";
  createdAt: string;
}

export interface AccessFiCheckoutSession {
  id: string;
  vaultId: string;
  userId: string;
  provider: AccessFiCheckoutProvider;
  status: "pending" | "confirmed" | "failed";
  amount: number;
  currency: string;
  txRef: string | null;
  quoteJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AccessFiVaultBundle {
  vault: AccessFiVault;
  assets: AccessFiAsset[];
  policy: AccessFiAccessPolicy | null;
  memberships: AccessFiMembership[];
  unlockEvents: AccessFiUnlockEvent[];
  allowlistEntries: AccessFiAllowlistEntry[];
}

export interface AccessFiSnapshot {
  createdAt: string;
  updatedAt: string;
  profiles: AccessFiProfile[];
  vaults: AccessFiVault[];
  assets: AccessFiAsset[];
  policies: AccessFiAccessPolicy[];
  memberships: AccessFiMembership[];
  unlockEvents: AccessFiUnlockEvent[];
  allowlistEntries: AccessFiAllowlistEntry[];
  checkoutSessions: AccessFiCheckoutSession[];
}

export interface AccessFiIntegrationRailStatus {
  key: "flow" | "lit" | "storacha" | "near" | "persistence";
  label: string;
  configured: boolean;
  mode: string;
  network: string | null;
  details: string[];
}

export interface AccessFiCreateVaultInput {
  creator: AccessFiViewer;
  title: string;
  teaser: string;
  description: string;
  accessType: AccessFiAccessType;
  depositAmount: number | null;
  subscriptionAmount: number | null;
  currency: string;
  allowlistIdentifiers: string[];
  tokenSymbol: string | null;
  tokenContract: string | null;
  minimumTokenBalance: string | null;
  timeLimitHours: number | null;
  asset: {
    title: string;
    originalFileName: string;
    mimeType: string;
    sizeBytes: number;
    previewText: string;
    storageProvider: AccessFiStorageProvider;
    storageRef: string;
    encryptionRef: string;
    encryptedPayloadB64: string | null;
    encrypted: boolean;
  };
  policyJson: Record<string, unknown>;
}

export interface AccessFiCheckoutQuote {
  provider: AccessFiCheckoutProvider;
  amount: number;
  currency: string;
  txRef: string;
  quoteJson: Record<string, unknown>;
}

export interface AccessFiMembershipInput {
  vault: AccessFiVault;
  viewer: AccessFiViewer;
  quote: AccessFiCheckoutQuote;
  externalAccountRef: string | null;
  metadata: Record<string, unknown>;
}

export interface AccessFiUnlockEventInput {
  vaultId: string;
  userId: string;
  membershipId: string | null;
  assetId?: string | null;
  accessType: AccessFiAccessType;
  status: AccessFiUnlockStatus;
  provider: string;
  txRef: string | null;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface AccessFiAssetDownload {
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
}
