export type MatchStatus = "scheduled" | "locked" | "live" | "completed" | "cancelled";
export type ChallengeStatus = "open" | "locked" | "settled" | "archived" | "cancelled";
export type SettlementStatus = "pending" | "settled";
export type ChallengeVisibility = "public" | "unlisted" | "private";
export type ParticipantStatus = "joined" | "submitted" | "withdrawn";
export type ShareSurface = "native" | "whatsapp" | "telegram" | "copy" | "card";
export type ShareStage = "pre_match" | "results";
export type QuestionAnswerType = "single_select" | "free_text" | "numeric_range";
export type SportKey = "cricket" | "football" | "formula1" | "basketball";
export type CompetitorEntityType = "team" | "club" | "franchise" | "driver" | "constructor" | "nation";
export type SeasonStatus = "upcoming" | "active" | "completed" | "archived";
export type GroupType = "private" | "office" | "college" | "community" | "creator";
export type GroupVisibility = "private" | "invite_only" | "public";
export type GroupMemberRole = "owner" | "admin" | "member";
export type PredictionTemplateKey = "classic_social" | "provider_ready";
export type SportsProviderKey = "manual" | "thesportsdb";
export type NotificationType =
  | "challenge_live"
  | "rival_joined"
  | "match_starting_soon"
  | "picks_locking_soon"
  | "results_live"
  | "you_won"
  | "you_got_cooked"
  | "season_table_updated"
  | "room_challenge_live"
  | "mini_pick_live"
  | "mini_pick_settled";
export type BadgeRarity = "common" | "rare" | "epic";
export type AiGenerationKind =
  | "pre_match_storyline"
  | "post_match_recap"
  | "rivalry_summary"
  | "trash_talk"
  | "creator_room_hype";
export type AiGenerationStatus = "pending" | "generated" | "failed" | "disabled";
export type MiniPickStatus = "scheduled" | "open" | "locked" | "settled" | "cancelled";
export type MiniPickTemplateKey =
  | "next_over_runs"
  | "wicket_next_over"
  | "next_boundary_side"
  | "powerplay_score_range"
  | "next_goal_team"
  | "next_corner_team"
  | "next_booking_team"
  | "safety_car_window"
  | "next_pit_team"
  | "podium_shakeup"
  | "next_scoring_team"
  | "next_scoring_play"
  | "next_three_team";

export interface SportSummary {
  id: string;
  key: SportKey | string;
  name: string;
}

export interface CompetitionSummary {
  id: string;
  slug: string;
  name: string;
  shortName: string | null;
  category: string | null;
  region: string | null;
  themeAccent: string | null;
  isFeatured: boolean;
  sport: SportSummary;
}

export interface SeasonSummary {
  id: string;
  slug: string;
  name: string;
  year: number | null;
  status: SeasonStatus;
  isCurrent: boolean;
  startDate: string | null;
  endDate: string | null;
  competition: CompetitionSummary | null;
}

export interface Team {
  id: string;
  slug: string;
  shortName: string;
  fullName: string;
  entityType: CompetitorEntityType;
  primaryColor: string | null;
  secondaryColor: string | null;
}

export interface MatchTeam {
  id: string;
  role: "side_a" | "side_b";
  team: Team;
}

export interface PredictionOption {
  id: string;
  label: string;
  value: string;
  sortOrder: number;
}

export interface PredictionQuestion {
  id: string;
  key: string;
  prompt: string;
  description: string | null;
  answerType: QuestionAnswerType;
  sortOrder: number;
  options: PredictionOption[];
}

export interface MatchSummary {
  id: string;
  slug: string;
  title: string;
  sport: SportSummary;
  competitionId: string | null;
  seasonId: string | null;
  competitionName: string;
  venue: string | null;
  startTime: string;
  lockTime: string;
  status: MatchStatus;
  settlementStatus: SettlementStatus;
  stageLabel: string | null;
  heroImageUrl: string | null;
  featuredRank: number | null;
  predictionTemplateKey: PredictionTemplateKey;
  teams: MatchTeam[];
  questionCount: number;
  challengeCount: number;
}

export interface ChallengeSummary {
  id: string;
  slug: string;
  title: string;
  groupId: string | null;
  stakeText: string | null;
  status: ChallengeStatus;
  visibility: ChallengeVisibility;
  shareMessage: string | null;
  createdAt: string;
}

export interface ParticipantPredictionView {
  id: string;
  questionId: string;
  optionId: string | null;
  optionLabel: string;
  isCorrect: boolean | null;
  pointsAwarded: number;
}

export interface ChallengeParticipantView {
  id: string;
  publicCode: string;
  displayName: string;
  isCreator: boolean;
  submittedAt: string | null;
  totalPoints: number;
  rank: number | null;
  predictions: ParticipantPredictionView[];
}

export interface OpinionOption {
  optionId: string;
  label: string;
  count: number;
  percentage: number;
  contrarian: boolean;
  loneWolf: boolean;
}

export interface OpinionQuestion {
  questionId: string;
  prompt: string;
  options: OpinionOption[];
}

export interface OutcomeAnswerView {
  questionId: string;
  optionId: string | null;
  optionLabel: string | null;
}

export interface ChallengePageData {
  challenge: ChallengeSummary;
  match: MatchSummary;
  questions: PredictionQuestion[];
  participants: ChallengeParticipantView[];
  opinionBoard: OpinionQuestion[];
  outcomes: OutcomeAnswerView[];
}

export interface ProfileHistoryEntry {
  challengeId: string;
  challengeSlug: string;
  challengeTitle: string;
  matchTitle: string;
  startTime: string;
  participantName: string;
  totalPoints: number;
  rank: number | null;
  settled: boolean;
}

export interface AdminDashboardData {
  upcomingMatches: MatchSummary[];
  liveChallenges: Array<{
    id: string;
    slug: string;
    title: string;
    participantCount: number;
    matchTitle: string;
  }>;
}

export interface ActionState {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export interface GroupSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: GroupType;
  visibility: GroupVisibility;
  inviteCode: string | null;
  memberCount: number;
  challengeCount: number;
  stakeTemplate: string | null;
  punishmentTemplate: string | null;
  headline: string | null;
  sport: SportSummary | null;
  competition: CompetitionSummary | null;
  season: SeasonSummary | null;
}

export interface StandingRow {
  groupMemberId: string;
  displayName: string;
  role: GroupMemberRole;
  challengesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  totalPoints: number;
  accuracyPct: number;
  contrarianBonus: number;
  reputationScore: number;
  rank: number | null;
}

export interface GroupChallengeSummary {
  id: string;
  slug: string;
  title: string;
  status: ChallengeStatus;
  participantCount: number;
  matchTitle: string;
}

export interface GroupPageData {
  group: GroupSummary;
  standings: StandingRow[];
  challenges: GroupChallengeSummary[];
  suggestedMatches: MatchSummary[];
  viewerRole: GroupMemberRole | null;
}

export interface BadgeDefinition {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string | null;
  rarity: BadgeRarity;
  themeColor: string | null;
}

export interface ProfileBadgeView extends BadgeDefinition {
  awardedAt: string;
  reason: string | null;
}

export interface ProfileStatsView {
  displayName: string;
  totalChallengesPlayed: number;
  totalWins: number;
  totalLosses: number;
  totalCorrectPicks: number;
  totalPossiblePicks: number;
  winRate: number;
  accuracyPct: number;
  contrarianHits: number;
  cleanSweeps: number;
  currentStreak: number;
  longestStreak: number;
  rivalsBeaten: number;
  leaguesJoined: number;
  reputationScore: number;
  bestSport: SportSummary | null;
}

export interface RivalSummary {
  displayName: string;
  winsAgainst: number;
}

export interface NotificationView {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface MiniPickOptionView {
  id: string;
  label: string;
  value: string;
  sortOrder: number;
  count: number;
  percentage: number;
  leading: boolean;
  loneWolf: boolean;
}

export interface MiniPickEntryView {
  id: string;
  guestProfileId: string;
  displayName: string;
  optionId: string;
  optionLabel: string;
  submittedAt: string;
  isCorrect: boolean | null;
  pointsAwarded: number;
}

export interface MiniPickWindowView {
  id: string;
  key: string;
  title: string;
  prompt: string;
  description: string | null;
  status: MiniPickStatus;
  opensAt: string;
  lockAt: string;
  settledAt: string | null;
  resolutionNote: string | null;
  stakeText: string | null;
  totalEntries: number;
  options: MiniPickOptionView[];
  entries: MiniPickEntryView[];
  viewerEntry: MiniPickEntryView | null;
  outcomeOptionId: string | null;
  outcomeOptionLabel: string | null;
}

export interface ChallengeAiCopy {
  kind: AiGenerationKind;
  title: string;
  body: string;
  shareLine: string | null;
  status: AiGenerationStatus;
  providerKey: string | null;
}

export interface ProfileDashboardData {
  stats: ProfileStatsView | null;
  badges: ProfileBadgeView[];
  history: ProfileHistoryEntry[];
  recentNotifications: NotificationView[];
  topRivals: RivalSummary[];
  groups: GroupSummary[];
}

export interface SportHubData {
  sport: SportSummary;
  competitions: CompetitionSummary[];
  currentSeason: SeasonSummary | null;
  featuredMatches: MatchSummary[];
  featuredGroups: GroupSummary[];
}

export interface EventSyncStateView {
  providerKey: SportsProviderKey | string;
  externalEventId: string | null;
  autoSettleSupported: boolean;
  syncStatus: string;
  providerEventLabel: string | null;
  providerEventStatus: string | null;
  lastSyncedAt: string | null;
  lastAutoSettledAt: string | null;
  lastCheckedAt: string | null;
  lastError: string | null;
}

export interface ProviderSyncRunView {
  id: string;
  providerKey: string;
  syncKind: string;
  status: string;
  summary: string | null;
  createdAt: string;
}

export interface AdminMatchData {
  match: MatchSummary;
  questions: PredictionQuestion[];
  outcomes: OutcomeAnswerView[];
  syncState: EventSyncStateView | null;
  recentSyncRuns: ProviderSyncRunView[];
  miniPicks: MiniPickWindowView[];
}
