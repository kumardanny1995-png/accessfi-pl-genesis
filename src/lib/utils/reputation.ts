export function calculateReputationScore(input: {
  accuracyPct: number;
  totalChallengesPlayed: number;
  contrarianHits: number;
  currentStreak: number;
  longestStreak: number;
  totalWins: number;
  leaguesJoined: number;
}) {
  const accuracyScore = Math.round(input.accuracyPct * 0.5);
  const participationScore = input.totalChallengesPlayed * 3;
  const contrarianScore = input.contrarianHits * 12;
  const consistencyScore = input.currentStreak * 4 + input.longestStreak * 5;
  const leagueScore = input.totalWins * 8 + input.leaguesJoined * 4;

  return accuracyScore + participationScore + contrarianScore + consistencyScore + leagueScore;
}
