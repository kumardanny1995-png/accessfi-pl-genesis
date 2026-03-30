import { notFound } from "next/navigation";

import { AccessFiProofConsolePage } from "@/components/accessfi/proof-console-page";
import { getAccessFiProofConsoleData } from "@/lib/accessfi/data";

export default async function AccessFiVaultProofPage({
  params
}: {
  params: Promise<{
    vaultSlug: string;
  }>;
}) {
  const { vaultSlug } = await params;
  const data = await getAccessFiProofConsoleData(vaultSlug);

  if (!data.focused) {
    notFound();
  }

  return (
    <AccessFiProofConsolePage
      bundles={data.bundles}
      integrationStatus={data.integrationStatus}
      repositoryMode={data.repositoryMode}
      focused={data.focused}
    />
  );
}
