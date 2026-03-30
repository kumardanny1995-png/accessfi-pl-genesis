import { DecisionResultPage } from "@/components/can-afford/decision-result-page";

export default async function DecisionResultRoute({
  params
}: {
  params: Promise<{ decisionId: string }>;
}) {
  const { decisionId } = await params;

  return <DecisionResultPage decisionId={decisionId} />;
}
