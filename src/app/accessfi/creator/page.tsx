import { AccessFiCreatorStudioPage } from "@/components/accessfi/creator-studio-page";
import { requireAccessFiViewer } from "@/lib/accessfi/auth";
import { getAccessFiCreatorDashboardData } from "@/lib/accessfi/data";

export default async function AccessFiCreatorPage() {
  const viewer = await requireAccessFiViewer("/accessfi/creator");
  const data = await getAccessFiCreatorDashboardData(viewer);

  return (
    <AccessFiCreatorStudioPage
      viewer={data.viewer}
      ownVaults={data.ownVaults}
      publicVaults={data.publicVaults}
      totalMembers={data.totalMembers}
      totalAssets={data.totalAssets}
      integrationStatus={data.integrationStatus}
      repositoryMode={data.repositoryMode}
    />
  );
}
