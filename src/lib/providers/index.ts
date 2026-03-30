import "server-only";

import type { SportsProviderKey } from "@/lib/db/types";
import { theSportsDbProvider } from "@/lib/providers/thesportsdb";
import type { SportsDataProvider } from "@/lib/providers/types";

const providers: Record<string, SportsDataProvider> = {
  thesportsdb: theSportsDbProvider
};

export function getSportsProvider(providerKey: SportsProviderKey | string) {
  return providers[providerKey] ?? null;
}
