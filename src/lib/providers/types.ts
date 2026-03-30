import type { SportKey, SportsProviderKey } from "@/lib/db/types";

export type ProviderOutcomeSide = "side_a" | "side_b" | "draw" | "unknown";

export interface ProviderEventSnapshot {
  providerKey: SportsProviderKey | string;
  externalEventId: string;
  label: string;
  sportKey: SportKey | string;
  competitionName: string | null;
  startTime: string | null;
  venue: string | null;
  status: string;
  completed: boolean;
  sideALabel: string | null;
  sideBLabel: string | null;
  sideAScore: number | null;
  sideBScore: number | null;
  winningSide: ProviderOutcomeSide;
  sourceUrl: string | null;
  raw: Record<string, unknown>;
}

export interface SportsDataProvider {
  key: SportsProviderKey | string;
  label: string;
  fetchEvent(externalEventId: string): Promise<ProviderEventSnapshot | null>;
}
