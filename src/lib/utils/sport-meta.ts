import type { SportKey } from "@/lib/db/types";

type SportTheme = {
  key: SportKey;
  label: string;
  tagline: string;
  accent: string;
  accentSoft: string;
  panelGradient: string;
  description: string;
  statLabel: string;
};

export const SPORT_THEMES: Record<SportKey, SportTheme> = {
  cricket: {
    key: "cricket",
    label: "Cricket",
    tagline: "IPL receipts, contrarian calls, and rivalry links built for group chats.",
    accent: "#ff9d2f",
    accentSoft: "#ffe083",
    panelGradient:
      "radial-gradient(circle at top right, rgba(255,157,47,0.22), transparent 32%), linear-gradient(160deg, #08111f 0%, #10203b 45%, #071220 100%)",
    description: "The deepest experience. Fixed pre-match takes, season ladders, and group bragging rights.",
    statLabel: "IPL Ready"
  },
  football: {
    key: "football",
    label: "Football",
    tagline: "First goal, total chaos, derby receipts.",
    accent: "#37d67a",
    accentSoft: "#8bf0b3",
    panelGradient:
      "radial-gradient(circle at top right, rgba(55,214,122,0.22), transparent 32%), linear-gradient(160deg, #08111f 0%, #0d2a22 45%, #071220 100%)",
    description: "Tighter cards, bigger swings, and fast opinion splits for matchdays.",
    statLabel: "Matchday Energy"
  },
  formula1: {
    key: "formula1",
    label: "Formula 1",
    tagline: "Quali duels, safety-car calls, and weekend flexes.",
    accent: "#ff5f5f",
    accentSoft: "#ffc6c6",
    panelGradient:
      "radial-gradient(circle at top right, rgba(255,95,95,0.2), transparent 32%), linear-gradient(160deg, #08111f 0%, #25131a 45%, #071220 100%)",
    description: "Weekend storylines framed around featured duels and clean pick templates.",
    statLabel: "Race Weekend"
  },
  basketball: {
    key: "basketball",
    label: "Basketball",
    tagline: "Quarter swings, scorer bets without betting, and instant receipts.",
    accent: "#ff7f32",
    accentSoft: "#ffd0a8",
    panelGradient:
      "radial-gradient(circle at top right, rgba(255,127,50,0.24), transparent 32%), linear-gradient(160deg, #08111f 0%, #2a1b14 45%, #071220 100%)",
    description: "Arena-style prediction cards built for game-night groups.",
    statLabel: "Game Night"
  }
};

export function getSportTheme(sportKey: SportKey | string) {
  return SPORT_THEMES[(sportKey as SportKey) ?? "cricket"] ?? SPORT_THEMES.cricket;
}

export function getSportLabel(sportKey: SportKey | string) {
  return getSportTheme(sportKey).label;
}
