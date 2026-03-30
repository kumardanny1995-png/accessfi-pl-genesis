import { AccessFiProofConsolePage } from "@/components/accessfi/proof-console-page";
import { getAccessFiProofConsoleData } from "@/lib/accessfi/data";

export default async function AccessFiProofPage() {
  const data = await getAccessFiProofConsoleData();

  return (
    <AccessFiProofConsolePage
      bundles={data.bundles}
      integrationStatus={data.integrationStatus}
      repositoryMode={data.repositoryMode}
      focused={data.focused}
    />
  );
}
