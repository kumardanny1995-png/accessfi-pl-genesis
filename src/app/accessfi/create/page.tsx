import { AccessFiCreateVaultPage } from "@/components/accessfi/create-vault-page";
import { requireAccessFiViewer } from "@/lib/accessfi/auth";
import { getAccessFiCreateVaultData } from "@/lib/accessfi/data";

export default async function AccessFiCreatePage() {
  const viewer = await requireAccessFiViewer("/accessfi/create");
  const data = await getAccessFiCreateVaultData(viewer);

  return (
    <AccessFiCreateVaultPage
      viewer={data.viewer}
      integrationStatus={data.integrationStatus}
      repositoryMode={data.repositoryMode}
    />
  );
}
