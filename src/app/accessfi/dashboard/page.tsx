import { AccessFiMemberDashboardPage } from "@/components/accessfi/member-dashboard-page";
import { requireAccessFiViewer } from "@/lib/accessfi/auth";
import { getAccessFiMemberDashboardData } from "@/lib/accessfi/data";

export default async function AccessFiDashboardPage() {
  const viewer = await requireAccessFiViewer("/accessfi/dashboard");
  const data = await getAccessFiMemberDashboardData(viewer);

  return (
    <AccessFiMemberDashboardPage
      viewer={data.viewer}
      joinedVaults={data.joinedVaults}
      recommendedVaults={data.recommendedVaults}
      integrationStatus={data.integrationStatus}
    />
  );
}
