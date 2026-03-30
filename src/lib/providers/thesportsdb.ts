import "server-only";

import { getOptionalEnv } from "@/lib/db/env";
import type { SportsDataProvider } from "@/lib/providers/types";

type TheSportsDbEvent = {
  idEvent?: string;
  strEvent?: string | null;
  strSport?: string | null;
  strLeague?: string | null;
  strTimestamp?: string | null;
  strVenue?: string | null;
  strStatus?: string | null;
  strPostponed?: string | null;
  strHomeTeam?: string | null;
  strAwayTeam?: string | null;
  intHomeScore?: string | number | null;
  intAwayScore?: string | number | null;
};

function parseScore(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSportKey(value: string | null | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();

  switch (normalized) {
    case "soccer":
    case "football":
      return "football";
    case "basketball":
      return "basketball";
    case "formula 1":
    case "motorsport":
      return "formula1";
    case "cricket":
    default:
      return "cricket";
  }
}

function deriveStatus(event: TheSportsDbEvent, sideAScore: number | null, sideBScore: number | null) {
  const status = (event.strStatus ?? "").trim().toLowerCase();

  if (sideAScore !== null && sideBScore !== null) {
    return "completed";
  }

  if (status.includes("postpon")) {
    return "postponed";
  }

  if (status.includes("in progress") || status.includes("live")) {
    return "live";
  }

  return status || "scheduled";
}

export const theSportsDbProvider: SportsDataProvider = {
  key: "thesportsdb",
  label: "TheSportsDB",
  async fetchEvent(externalEventId) {
    const apiKey = getOptionalEnv("THESPORTSDB_API_KEY") ?? "123";
    const baseUrl = getOptionalEnv("THESPORTSDB_BASE_URL") ?? "https://www.thesportsdb.com/api/v1/json";
    const url = `${baseUrl}/${apiKey}/lookupevent.php?id=${encodeURIComponent(externalEventId)}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json"
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      throw new Error(`TheSportsDB returned ${response.status}.`);
    }

    const json = (await response.json()) as { events?: TheSportsDbEvent[] | null };
    const event = json.events?.[0];

    if (!event?.idEvent) {
      return null;
    }

    const sideAScore = parseScore(event.intHomeScore);
    const sideBScore = parseScore(event.intAwayScore);

    return {
      providerKey: "thesportsdb",
      externalEventId: event.idEvent,
      label: event.strEvent?.trim() || event.idEvent,
      sportKey: normalizeSportKey(event.strSport),
      competitionName: event.strLeague?.trim() || null,
      startTime: event.strTimestamp ?? null,
      venue: event.strVenue?.trim() || null,
      status: deriveStatus(event, sideAScore, sideBScore),
      completed: sideAScore !== null && sideBScore !== null && event.strPostponed !== "yes",
      sideALabel: event.strHomeTeam?.trim() || null,
      sideBLabel: event.strAwayTeam?.trim() || null,
      sideAScore,
      sideBScore,
      winningSide:
        sideAScore === null || sideBScore === null
          ? "unknown"
          : sideAScore > sideBScore
            ? "side_a"
            : sideBScore > sideAScore
              ? "side_b"
              : "draw",
      sourceUrl: `https://www.thesportsdb.com/api/v1/json/${apiKey}/lookupevent.php?id=${encodeURIComponent(event.idEvent)}`,
      raw: event as Record<string, unknown>
    };
  }
};
