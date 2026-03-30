import { AccessFiLandingPage } from "@/components/accessfi/landing-page";
import { getAccessFiLandingData } from "@/lib/accessfi/data";

export default async function AccessFiPage() {
  const data = await getAccessFiLandingData();

  return (
    <AccessFiLandingPage
      bundles={data.bundles}
      featured={data.featured}
      integrationStatus={data.integrationStatus}
      repositoryMode={data.repositoryMode}
    />
  );
}
