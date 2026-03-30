import "server-only";

import type {
  ChallengeParticipantView,
  ChallengeSummary,
  CompetitionSummary,
  GroupSummary,
  MatchSummary,
  MatchTeam,
  OutcomeAnswerView,
  PredictionQuestion,
  SeasonSummary,
  SportSummary,
  StandingRow
} from "@/lib/db/types";

type OneOrMany<T> = T | T[] | null | undefined;

function one<T>(value: OneOrMany<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

type MatchRecord = {
  id: string;
  slug: string;
  title: string;
  sport?: OneOrMany<{
    id: string;
    key: string;
    name: string;
  }>;
  competition_id?: string | null;
  season_id?: string | null;
  competition_name: string;
  venue: string | null;
  start_time: string;
  lock_time: string;
  status: MatchSummary["status"];
  settlement_status: MatchSummary["settlementStatus"];
  stage_label?: string | null;
  hero_image_url?: string | null;
  featured_rank?: number | null;
  prediction_template_key?: MatchSummary["predictionTemplateKey"];
  match_teams?: Array<{
    id: string;
    role: MatchTeam["role"];
    team: {
      id: string;
      slug: string;
      short_name: string;
      full_name: string;
      entity_type?: MatchTeam["team"]["entityType"];
      primary_color: string | null;
      secondary_color: string | null;
    };
  }>;
  prediction_questions?: Array<{ id: string }>;
  challenges?: Array<{ id: string }>;
};

type QuestionRecord = {
  id: string;
  key: string;
  prompt: string;
  description: string | null;
  answer_type: PredictionQuestion["answerType"];
  sort_order: number;
  prediction_options?: Array<{
    id: string;
    label: string;
    value: string;
    sort_order: number;
  }>;
};

type ChallengeRecord = {
  id: string;
  slug: string;
  title: string;
  group_id?: string | null;
  stake_text: string | null;
  status: ChallengeSummary["status"];
  visibility: ChallengeSummary["visibility"];
  share_message: string | null;
  created_at: string;
};

type CompetitionRecord = {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  category: string | null;
  region: string | null;
  theme_accent: string | null;
  is_featured: boolean;
  sport?: OneOrMany<{
    id: string;
    key: string;
    name: string;
  }>;
};

type SeasonRecord = {
  id: string;
  slug: string;
  name: string;
  year: number | null;
  status: SeasonSummary["status"];
  is_current: boolean;
  start_date: string | null;
  end_date: string | null;
  competition?: OneOrMany<CompetitionRecord>;
};

export function mapMatchSummary(record: MatchRecord | Record<string, unknown>): MatchSummary {
  const normalized = record as MatchRecord;
  const matchTeams = (normalized.match_teams ?? []) as NonNullable<MatchRecord["match_teams"]>;

  return {
    id: normalized.id,
    slug: normalized.slug,
    title: normalized.title,
    sport: mapSport(normalized.sport),
    competitionId: normalized.competition_id ?? null,
    seasonId: normalized.season_id ?? null,
    competitionName: normalized.competition_name,
    venue: normalized.venue,
    startTime: normalized.start_time,
    lockTime: normalized.lock_time,
    status: normalized.status,
    settlementStatus: normalized.settlement_status,
    stageLabel: normalized.stage_label ?? null,
    heroImageUrl: normalized.hero_image_url ?? null,
    featuredRank: normalized.featured_rank ?? null,
    predictionTemplateKey: normalized.prediction_template_key ?? "classic_social",
    teams: matchTeams
      .map((entry) => ({
        id: entry.id,
        role: entry.role,
        team: {
          id: entry.team.id,
          slug: entry.team.slug,
          shortName: entry.team.short_name,
          fullName: entry.team.full_name,
          entityType: entry.team.entity_type ?? "team",
          primaryColor: entry.team.primary_color,
          secondaryColor: entry.team.secondary_color
        }
      }))
      .sort((left, right) => left.role.localeCompare(right.role)),
    questionCount: normalized.prediction_questions?.length ?? 0,
    challengeCount: normalized.challenges?.length ?? 0
  };
}

export function mapQuestions(records: Array<QuestionRecord | Record<string, unknown>>): PredictionQuestion[] {
  return records
    .map((record) => {
      const normalized = record as QuestionRecord;
      const options = (normalized.prediction_options ?? []) as NonNullable<QuestionRecord["prediction_options"]>;

      return {
        id: normalized.id,
        key: normalized.key,
        prompt: normalized.prompt,
        description: normalized.description,
        answerType: normalized.answer_type,
        sortOrder: normalized.sort_order,
        options: options
          .map((option) => ({
            id: option.id,
            label: option.label,
            value: option.value,
            sortOrder: option.sort_order
          }))
          .sort((left, right) => left.sortOrder - right.sortOrder)
      };
    })
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

export function mapChallenge(record: ChallengeRecord | Record<string, unknown>): ChallengeSummary {
  const normalized = record as ChallengeRecord;

  return {
    id: normalized.id,
    slug: normalized.slug,
    title: normalized.title,
    groupId: normalized.group_id ?? null,
    stakeText: normalized.stake_text,
    status: normalized.status,
    visibility: normalized.visibility,
    shareMessage: normalized.share_message,
    createdAt: normalized.created_at
  };
}

export function attachPredictions(
  participants: Array<{
    id: string;
    public_code: string;
    display_name: string;
    is_creator: boolean;
    submitted_at: string | null;
    total_points: number | null;
    rank: number | null;
  }>,
  predictions: Array<{
    id: string;
    participant_id: string;
    question_id: string;
    selected_option_id: string | null;
    is_correct: boolean | null;
    points_awarded: number | null;
  }>,
  questions: PredictionQuestion[]
): ChallengeParticipantView[] {
  const optionLabelMap = new Map(
    questions.flatMap((question) => question.options.map((option) => [option.id, option.label] as const))
  );

  return participants
    .map((participant) => ({
      id: participant.id,
      publicCode: participant.public_code,
      displayName: participant.display_name,
      isCreator: participant.is_creator,
      submittedAt: participant.submitted_at,
      totalPoints: participant.total_points ?? 0,
      rank: participant.rank,
      predictions: predictions
        .filter((prediction) => prediction.participant_id === participant.id)
        .map((prediction) => ({
          id: prediction.id,
          questionId: prediction.question_id,
          optionId: prediction.selected_option_id,
          optionLabel: prediction.selected_option_id
            ? optionLabelMap.get(prediction.selected_option_id) ?? "Unknown"
            : "No pick",
          isCorrect: prediction.is_correct,
          pointsAwarded: prediction.points_awarded ?? 0
        }))
        .sort((left, right) => {
          const leftIndex = questions.findIndex((question) => question.id === left.questionId);
          const rightIndex = questions.findIndex((question) => question.id === right.questionId);
          return leftIndex - rightIndex;
        })
    }))
    .sort((left, right) => {
      if (left.isCreator && !right.isCreator) {
        return -1;
      }

      if (!left.isCreator && right.isCreator) {
        return 1;
      }

      return left.displayName.localeCompare(right.displayName);
    });
}

export function mapOutcomes(
  answers: Array<{
    question_id: string;
    resolved_option_id: string | null;
  }>,
  questions: PredictionQuestion[]
): OutcomeAnswerView[] {
  const optionLabelMap = new Map(
    questions.flatMap((question) => question.options.map((option) => [option.id, option.label] as const))
  );

  return answers.map((answer) => ({
    questionId: answer.question_id,
    optionId: answer.resolved_option_id,
    optionLabel: answer.resolved_option_id ? optionLabelMap.get(answer.resolved_option_id) ?? null : null
  }));
}

export function mapSport(record?: OneOrMany<{ id: string; key: string; name: string }> | Record<string, unknown>): SportSummary {
  const normalized = one(record) as { id: string; key: string; name: string } | null;
  return {
    id: normalized?.id ?? "sport-cricket",
    key: normalized?.key ?? "cricket",
    name: normalized?.name ?? "Cricket"
  };
}

export function mapCompetition(record: CompetitionRecord | Record<string, unknown>): CompetitionSummary {
  const normalized = record as CompetitionRecord;

  return {
    id: normalized.id,
    slug: normalized.slug,
    name: normalized.name,
    shortName: normalized.short_name,
    category: normalized.category,
    region: normalized.region,
    themeAccent: normalized.theme_accent,
    isFeatured: normalized.is_featured,
    sport: mapSport(one(normalized.sport))
  };
}

export function mapSeason(record: SeasonRecord | Record<string, unknown>): SeasonSummary {
  const normalized = record as SeasonRecord;
  const competition = one(normalized.competition);

  return {
    id: normalized.id,
    slug: normalized.slug,
    name: normalized.name,
    year: normalized.year,
    status: normalized.status,
    isCurrent: normalized.is_current,
    startDate: normalized.start_date,
    endDate: normalized.end_date,
    competition: competition ? mapCompetition(competition) : null
  };
}

export function mapGroup(record: {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  group_type: GroupSummary["type"];
  visibility: GroupSummary["visibility"];
  invite_code?: string | null;
  stake_template: string | null;
  punishment_template: string | null;
  headline: string | null;
  sport?: OneOrMany<{ id: string; key: string; name: string }>;
  competition?: OneOrMany<CompetitionRecord>;
  season?: OneOrMany<SeasonRecord>;
  group_members?: Array<{ id: string }> | null;
  group_challenges?: Array<{ id: string }> | null;
} | Record<string, unknown>): GroupSummary {
  const normalized = record as {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    group_type: GroupSummary["type"];
    visibility: GroupSummary["visibility"];
    invite_code?: string | null;
    stake_template: string | null;
    punishment_template: string | null;
    headline: string | null;
    sport?: OneOrMany<{ id: string; key: string; name: string }>;
    competition?: OneOrMany<CompetitionRecord>;
    season?: OneOrMany<SeasonRecord>;
    group_members?: Array<{ id: string }> | null;
    group_challenges?: Array<{ id: string }> | null;
  };
  const sport = one(normalized.sport);
  const competition = one(normalized.competition);
  const season = one(normalized.season);

  return {
    id: normalized.id,
    slug: normalized.slug,
    name: normalized.name,
    description: normalized.description,
    type: normalized.group_type,
    visibility: normalized.visibility,
    inviteCode: normalized.invite_code ?? null,
    memberCount: normalized.group_members?.length ?? 0,
    challengeCount: normalized.group_challenges?.length ?? 0,
    stakeTemplate: normalized.stake_template,
    punishmentTemplate: normalized.punishment_template,
    headline: normalized.headline,
    sport: sport ? mapSport(sport) : null,
    competition: competition ? mapCompetition(competition) : null,
    season: season ? mapSeason(season) : null
  };
}

export function rankStandingRows(rows: StandingRow[]): StandingRow[] {
  const ranked = [...rows].sort(
    (left, right) =>
      right.totalPoints - left.totalPoints ||
      right.wins - left.wins ||
      right.accuracyPct - left.accuracyPct ||
      left.displayName.localeCompare(right.displayName)
  );

  let currentRank = 0;
  let lastFingerprint = "";

  return ranked.map((row, index) => {
    const fingerprint = `${row.totalPoints}:${row.wins}:${row.accuracyPct.toFixed(2)}`;
    if (fingerprint !== lastFingerprint) {
      currentRank = index + 1;
      lastFingerprint = fingerprint;
    }

    return {
      ...row,
      rank: currentRank
    };
  });
}
