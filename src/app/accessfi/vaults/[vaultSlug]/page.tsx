import { notFound } from "next/navigation";

import { AccessFiVaultPage } from "@/components/accessfi/vault-page";
import { getAccessFiViewer } from "@/lib/accessfi/auth";
import { getAccessFiVaultPageData } from "@/lib/accessfi/data";

export default async function AccessFiVaultRoute({
  params
}: {
  params: Promise<{ vaultSlug: string }>;
}) {
  const [{ vaultSlug }, viewer] = await Promise.all([params, getAccessFiViewer()]);
  const data = await getAccessFiVaultPageData(vaultSlug, viewer);

  if (!data) {
    notFound();
  }

  return (
    <AccessFiVaultPage
      viewer={data.viewer}
      bundle={data.bundle}
      membership={data.membership}
      policySummary={data.policySummary}
      integrationStatus={data.integrationStatus}
    />
  );
}
