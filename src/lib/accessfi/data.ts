import "server-only";

import type { AccessFiVaultBundle, AccessFiViewer } from "@/lib/accessfi/types";
import { ACCESSFI_FEATURED_VAULT_SLUG } from "@/lib/accessfi/env";
import { getIntegrationStatus, membershipService, accessControlService } from "@/lib/accessfi/services";
import { getAccessFiRepositoryMode, getVaultBundleBySlug, listCreatorVaultBundles, listMemberVaultBundles, listPublicVaultBundles } from "@/lib/accessfi/repository";

function getMembershipForViewer(bundle: AccessFiVaultBundle, viewer: AccessFiViewer | null) {
  if (!viewer) {
    return null;
  }

  return bundle.memberships.find((membership) => membership.userId === viewer.id) ?? null;
}

export async function getAccessFiLandingData() {
  const [bundles, integrationStatus, repositoryMode] = await Promise.all([
    listPublicVaultBundles(),
    getIntegrationStatus(),
    getAccessFiRepositoryMode()
  ]);

  const featured = bundles.find((bundle) => bundle.vault.slug === ACCESSFI_FEATURED_VAULT_SLUG) ?? bundles[0] ?? null;

  return {
    bundles,
    featured,
    integrationStatus,
    repositoryMode
  };
}

export async function getAccessFiCreatorDashboardData(viewer: AccessFiViewer) {
  const [ownVaults, publicVaults, integrationStatus, repositoryMode] = await Promise.all([
    listCreatorVaultBundles(viewer.id),
    listPublicVaultBundles(),
    getIntegrationStatus(),
    getAccessFiRepositoryMode()
  ]);

  const totalMembers = ownVaults.reduce((sum, bundle) => sum + bundle.memberships.filter((membership) => membership.status === "active").length, 0);
  const totalAssets = ownVaults.reduce((sum, bundle) => sum + bundle.assets.length, 0);

  return {
    viewer,
    ownVaults,
    publicVaults,
    totalMembers,
    totalAssets,
    integrationStatus,
    repositoryMode
  };
}

export async function getAccessFiCreateVaultData(viewer: AccessFiViewer) {
  const [integrationStatus, repositoryMode] = await Promise.all([getIntegrationStatus(), getAccessFiRepositoryMode()]);

  return {
    viewer,
    integrationStatus,
    repositoryMode
  };
}

export async function getAccessFiVaultPageData(slug: string, viewer: AccessFiViewer | null) {
  const [bundle, integrationStatus] = await Promise.all([getVaultBundleBySlug(slug), getIntegrationStatus()]);

  if (!bundle) {
    return null;
  }

  const membership = getMembershipForViewer(bundle, viewer);
  const policySummary = accessControlService.getPolicySummary(bundle.policy, bundle.vault);

  return {
    viewer,
    bundle,
    membership,
    policySummary,
    integrationStatus,
    membershipStatus: membershipService.getMembershipStatus(membership)
  };
}

export async function getAccessFiMemberDashboardData(viewer: AccessFiViewer) {
  const [joinedVaults, publicVaults, integrationStatus] = await Promise.all([
    listMemberVaultBundles(viewer.id),
    listPublicVaultBundles(),
    getIntegrationStatus()
  ]);

  const joinedVaultIds = new Set(joinedVaults.map((bundle) => bundle.vault.id));
  const recommendedVaults = publicVaults.filter((bundle) => !joinedVaultIds.has(bundle.vault.id)).slice(0, 3);

  return {
    viewer,
    joinedVaults,
    recommendedVaults,
    integrationStatus
  };
}

export async function getAccessFiProofConsoleData(slug?: string) {
  const [bundles, integrationStatus, repositoryMode] = await Promise.all([
    listPublicVaultBundles(),
    getIntegrationStatus(),
    getAccessFiRepositoryMode()
  ]);

  const focused = slug ? bundles.find((bundle) => bundle.vault.slug === slug) ?? null : null;

  return {
    bundles,
    focused,
    integrationStatus,
    repositoryMode
  };
}
