import type { MiniPickTemplateKey, PredictionQuestion, PredictionTemplateKey, SportKey } from "@/lib/db/types";
import { slugify } from "@/lib/utils/slugs";

export const APP_NAME = "LockScore";
export const APP_TAGLINE = "Make the take. Lock it. Settle it in public.";

export const DEFAULT_CHALLENGE_SHARE_COPY =
  "I’ve locked my five picks. Think you can outcall me?";

export const DEFAULT_RESULT_SHARE_COPY =
  "Results are in. Receipts attached. Come see who actually called it.";

type MatchTeamSeed = {
  id: string;
  shortName: string;
  fullName: string;
};

type QuestionSeed = Array<Omit<PredictionQuestion, "id">>;
type MiniPickTemplateSeed = {
  key: MiniPickTemplateKey;
  name: string;
  description: string;
  prompt: string;
  options: Array<{
    label: string;
    value: string;
  }>;
};

function teamOption(team: MatchTeamSeed) {
  return {
    label: team.shortName,
    value: slugify(team.shortName)
  };
}

function buildCricketMiniPickTemplates(teams: [MatchTeamSeed, MatchTeamSeed]): MiniPickTemplateSeed[] {
  const [teamA, teamB] = teams;

  return [
    {
      key: "next_over_runs",
      name: "Next Over Runs",
      description: "A quick live board for the next six balls.",
      prompt: "How many runs come off the next over?",
      options: [
        { label: "0-5", value: "0_5" },
        { label: "6-9", value: "6_9" },
        { label: "10-14", value: "10_14" },
        { label: "15+", value: "15_plus" }
      ]
    },
    {
      key: "wicket_next_over",
      name: "Wicket Radar",
      description: "Binary chaos, perfect for a fast crowd call.",
      prompt: "Does a wicket fall in the next over?",
      options: [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" }
      ]
    },
    {
      key: "next_boundary_side",
      name: "Next Boundary",
      description: "Which dugout gets the next flex moment?",
      prompt: "Which side hits the next boundary?",
      options: [
        { label: teamA.shortName, value: "side_a" },
        { label: teamB.shortName, value: "side_b" }
      ]
    },
    {
      key: "powerplay_score_range",
      name: "Powerplay Range",
      description: "A scoreboard bucket for the early overs.",
      prompt: "Where does the powerplay score land?",
      options: [
        { label: "Under 40", value: "under_40" },
        { label: "40-54", value: "40_54" },
        { label: "55-69", value: "55_69" },
        { label: "70+", value: "70_plus" }
      ]
    }
  ];
}

function buildFootballMiniPickTemplates(teams: [MatchTeamSeed, MatchTeamSeed]): MiniPickTemplateSeed[] {
  const [teamA, teamB] = teams;

  return [
    {
      key: "next_goal_team",
      name: "Next Goal Team",
      description: "A one-moment board while the match is still live.",
      prompt: "Who scores the next goal?",
      options: [
        { label: teamA.shortName, value: "side_a" },
        { label: teamB.shortName, value: "side_b" },
        { label: "No goal", value: "no_goal" }
      ]
    },
    {
      key: "next_corner_team",
      name: "Next Corner Team",
      description: "A tense build-up board for sustained pressure.",
      prompt: "Who wins the next corner?",
      options: [
        { label: teamA.shortName, value: "side_a" },
        { label: teamB.shortName, value: "side_b" }
      ]
    },
    {
      key: "next_booking_team",
      name: "Next Booking Team",
      description: "Good for derby heat and late-match chaos.",
      prompt: "Who gets the next booking?",
      options: [
        { label: teamA.shortName, value: "side_a" },
        { label: teamB.shortName, value: "side_b" },
        { label: "No booking", value: "no_booking" }
      ]
    }
  ];
}

function buildFormula1MiniPickTemplates(teams: [MatchTeamSeed, MatchTeamSeed]): MiniPickTemplateSeed[] {
  const [teamA, teamB] = teams;

  return [
    {
      key: "safety_car_window",
      name: "Safety Car Window",
      description: "A tight race moment without turning the product into trading.",
      prompt: "Do we see a safety car in the next 10 laps?",
      options: [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" }
      ]
    },
    {
      key: "next_pit_team",
      name: "Next Pit Stop",
      description: "A race-ops moment built for momentum swings.",
      prompt: "Who makes the next key pit stop?",
      options: [
        { label: teamA.shortName, value: "side_a" },
        { label: teamB.shortName, value: "side_b" }
      ]
    },
    {
      key: "podium_shakeup",
      name: "Podium Shakeup",
      description: "A simple race narrative call for the next phase of the stint.",
      prompt: "Does the podium order change in the next 10 laps?",
      options: [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" }
      ]
    }
  ];
}

function buildBasketballMiniPickTemplates(teams: [MatchTeamSeed, MatchTeamSeed]): MiniPickTemplateSeed[] {
  const [teamA, teamB] = teams;

  return [
    {
      key: "next_scoring_team",
      name: "Next Scoring Team",
      description: "A quick possession-driven side board.",
      prompt: "Who scores next?",
      options: [
        { label: teamA.shortName, value: "side_a" },
        { label: teamB.shortName, value: "side_b" }
      ]
    },
    {
      key: "next_scoring_play",
      name: "Next Scoring Play",
      description: "Keeps the live board focused on the next possession, not the whole quarter.",
      prompt: "What is the next scoring play?",
      options: [
        { label: "Free throw", value: "free_throw" },
        { label: "Two pointer", value: "two_pointer" },
        { label: "Three pointer", value: "three_pointer" }
      ]
    },
    {
      key: "next_three_team",
      name: "Next Three Team",
      description: "Perfect for late-game shot-making runs.",
      prompt: "Who hits the next three?",
      options: [
        { label: teamA.shortName, value: "side_a" },
        { label: teamB.shortName, value: "side_b" },
        { label: "No three", value: "no_three" }
      ]
    }
  ];
}

function buildCricketClassicQuestions(teams: [MatchTeamSeed, MatchTeamSeed]): QuestionSeed {
  const [teamA, teamB] = teams;
  const teamOptions = [teamOption(teamA), teamOption(teamB)];

  return [
    {
      key: "toss_winner",
      prompt: "Who wins the toss?",
      description: "Early edge sets the tone.",
      answerType: "single_select",
      sortOrder: 1,
      options: teamOptions.map((option, index) => ({
        id: `seed-toss-${index}`,
        label: option.label,
        value: option.value,
        sortOrder: index + 1
      }))
    },
    {
      key: "top_scorer",
      prompt: "Who ends up as top scorer?",
      description: "Most runs across both sides.",
      answerType: "single_select",
      sortOrder: 2,
      options: teamOptions.map((option, index) => ({
        id: `seed-top-${index}`,
        label: option.label,
        value: option.value,
        sortOrder: index + 1
      }))
    },
    {
      key: "total_runs_range",
      prompt: "What total runs range feels right?",
      description: "Combined scoreboard range.",
      answerType: "single_select",
      sortOrder: 3,
      options: [
        { id: "seed-runs-1", label: "Under 260", value: "under_260", sortOrder: 1 },
        { id: "seed-runs-2", label: "260-320", value: "260_320", sortOrder: 2 },
        { id: "seed-runs-3", label: "321-380", value: "321_380", sortOrder: 3 },
        { id: "seed-runs-4", label: "381+", value: "381_plus", sortOrder: 4 }
      ]
    },
    {
      key: "method_of_victory",
      prompt: "How does this one get decided?",
      description: "Margin style matters.",
      answerType: "single_select",
      sortOrder: 4,
      options: [
        { id: "seed-method-1", label: "Bat first and defend", value: "defend_total", sortOrder: 1 },
        { id: "seed-method-2", label: "Chase it down", value: "successful_chase", sortOrder: 2 },
        { id: "seed-method-3", label: "Super over chaos", value: "super_over", sortOrder: 3 }
      ]
    },
    {
      key: "winning_team",
      prompt: "Who actually wins the match?",
      description: "This is the ego pick.",
      answerType: "single_select",
      sortOrder: 5,
      options: teamOptions.map((option, index) => ({
        id: `seed-win-${index}`,
        label: option.label,
        value: option.value,
        sortOrder: index + 1
      }))
    }
  ];
}

function buildCricketProviderReadyQuestions(teams: [MatchTeamSeed, MatchTeamSeed]): QuestionSeed {
  const [teamA, teamB] = teams;

  return [
    {
      key: "winning_team",
      prompt: "Who wins the match?",
      description: "Provider-ready result pick.",
      answerType: "single_select",
      sortOrder: 1,
      options: [
        { id: "seed-provider-win-a", label: teamA.shortName, value: "side_a", sortOrder: 1 },
        { id: "seed-provider-win-b", label: teamB.shortName, value: "side_b", sortOrder: 2 },
        { id: "seed-provider-win-draw", label: "Tie / No Result", value: "draw", sortOrder: 3 }
      ]
    },
    {
      key: "total_runs_range",
      prompt: "What total match runs range lands?",
      description: "Combined score, auto-settled from the final scoreboard.",
      answerType: "single_select",
      sortOrder: 2,
      options: [
        { id: "seed-provider-total-1", label: "Under 300", value: "under_300", sortOrder: 1 },
        { id: "seed-provider-total-2", label: "300-349", value: "300_349", sortOrder: 2 },
        { id: "seed-provider-total-3", label: "350-399", value: "350_399", sortOrder: 3 },
        { id: "seed-provider-total-4", label: "400+", value: "400_plus", sortOrder: 4 }
      ]
    },
    {
      key: "side_a_score_range",
      prompt: `How many runs does ${teamA.shortName} post?`,
      description: "Final innings total bucket.",
      answerType: "single_select",
      sortOrder: 3,
      options: [
        { id: "seed-provider-a-1", label: "Under 160", value: "under_160", sortOrder: 1 },
        { id: "seed-provider-a-2", label: "160-199", value: "160_199", sortOrder: 2 },
        { id: "seed-provider-a-3", label: "200-239", value: "200_239", sortOrder: 3 },
        { id: "seed-provider-a-4", label: "240+", value: "240_plus", sortOrder: 4 }
      ]
    },
    {
      key: "side_b_score_range",
      prompt: `How many runs does ${teamB.shortName} post?`,
      description: "Final innings total bucket.",
      answerType: "single_select",
      sortOrder: 4,
      options: [
        { id: "seed-provider-b-1", label: "Under 160", value: "under_160", sortOrder: 1 },
        { id: "seed-provider-b-2", label: "160-199", value: "160_199", sortOrder: 2 },
        { id: "seed-provider-b-3", label: "200-239", value: "200_239", sortOrder: 3 },
        { id: "seed-provider-b-4", label: "240+", value: "240_plus", sortOrder: 4 }
      ]
    },
    {
      key: "winning_margin_range",
      prompt: "What winning margin bucket hits?",
      description: "Result gap from the final scoreline.",
      answerType: "single_select",
      sortOrder: 5,
      options: [
        { id: "seed-provider-margin-1", label: "0-10", value: "0_10", sortOrder: 1 },
        { id: "seed-provider-margin-2", label: "11-30", value: "11_30", sortOrder: 2 },
        { id: "seed-provider-margin-3", label: "31-60", value: "31_60", sortOrder: 3 },
        { id: "seed-provider-margin-4", label: "61+", value: "61_plus", sortOrder: 4 }
      ]
    }
  ];
}

export function buildDefaultCricketQuestions(
  teams: [MatchTeamSeed, MatchTeamSeed],
  templateKey: PredictionTemplateKey = "classic_social"
): QuestionSeed {
  if (templateKey === "provider_ready") {
    return buildCricketProviderReadyQuestions(teams);
  }

  return buildCricketClassicQuestions(teams);
}

export function buildDefaultFootballQuestions(teams: [MatchTeamSeed, MatchTeamSeed]): Array<
  Omit<PredictionQuestion, "id">
> {
  const [teamA, teamB] = teams;
  const teamOptions = [teamOption(teamA), teamOption(teamB)];

  return [
    {
      key: "first_goal_team",
      prompt: "Who scores first?",
      description: "Early nerves or an early eruption.",
      answerType: "single_select",
      sortOrder: 1,
      options: teamOptions.map((option, index) => ({
        id: `seed-football-first-goal-${index}`,
        label: option.label,
        value: option.value,
        sortOrder: index + 1
      }))
    },
    {
      key: "top_scorer_team",
      prompt: "Who gets the headline scorer?",
      description: "Which side owns the poster moment.",
      answerType: "single_select",
      sortOrder: 2,
      options: teamOptions.map((option, index) => ({
        id: `seed-football-top-scorer-${index}`,
        label: option.label,
        value: option.value,
        sortOrder: index + 1
      }))
    },
    {
      key: "total_goals_range",
      prompt: "What total goals range feels right?",
      description: "Tight chess match or open chaos.",
      answerType: "single_select",
      sortOrder: 3,
      options: [
        { id: "seed-football-goals-1", label: "0-1 goals", value: "0_1", sortOrder: 1 },
        { id: "seed-football-goals-2", label: "2-3 goals", value: "2_3", sortOrder: 2 },
        { id: "seed-football-goals-3", label: "4-5 goals", value: "4_5", sortOrder: 3 },
        { id: "seed-football-goals-4", label: "6+ goals", value: "6_plus", sortOrder: 4 }
      ]
    },
    {
      key: "clean_sheet",
      prompt: "Does anyone keep a clean sheet?",
      description: "One mistake can wreck this pick.",
      answerType: "single_select",
      sortOrder: 4,
      options: [
        { id: "seed-football-clean-1", label: `${teamA.shortName} clean sheet`, value: `${slugify(teamA.shortName)}_clean`, sortOrder: 1 },
        { id: "seed-football-clean-2", label: `${teamB.shortName} clean sheet`, value: `${slugify(teamB.shortName)}_clean`, sortOrder: 2 },
        { id: "seed-football-clean-3", label: "No clean sheet", value: "no_clean_sheet", sortOrder: 3 }
      ]
    },
    {
      key: "winning_team",
      prompt: "Who actually takes the result?",
      description: "The swagger pick.",
      answerType: "single_select",
      sortOrder: 5,
      options: [
        ...teamOptions.map((option, index) => ({
          id: `seed-football-win-${index}`,
          label: option.label,
          value: option.value,
          sortOrder: index + 1
        })),
        { id: "seed-football-win-draw", label: "Draw", value: "draw", sortOrder: 3 }
      ]
    }
  ];
}

export function buildDefaultFormula1Questions(teams: [MatchTeamSeed, MatchTeamSeed]): Array<
  Omit<PredictionQuestion, "id">
> {
  const [driverA, driverB] = teams;
  const driverOptions = [teamOption(driverA), teamOption(driverB)];

  return [
    {
      key: "qualifying_duel",
      prompt: "Who wins the qualifying duel?",
      description: "One lap, pure nerve.",
      answerType: "single_select",
      sortOrder: 1,
      options: driverOptions.map((option, index) => ({
        id: `seed-f1-quali-${index}`,
        label: option.label,
        value: option.value,
        sortOrder: index + 1
      }))
    },
    {
      key: "fastest_lap_driver",
      prompt: "Who grabs fastest lap?",
      description: "Late charge or clean-air flex.",
      answerType: "single_select",
      sortOrder: 2,
      options: driverOptions.map((option, index) => ({
        id: `seed-f1-fastest-${index}`,
        label: option.label,
        value: option.value,
        sortOrder: index + 1
      }))
    },
    {
      key: "safety_car",
      prompt: "Do we get a safety car?",
      description: "One messy opening lap changes everything.",
      answerType: "single_select",
      sortOrder: 3,
      options: [
        { id: "seed-f1-sc-1", label: "Yes", value: "yes", sortOrder: 1 },
        { id: "seed-f1-sc-2", label: "No", value: "no", sortOrder: 2 }
      ]
    },
    {
      key: "winning_margin",
      prompt: "How dominant is the winner?",
      description: "Cruise control or photo finish.",
      answerType: "single_select",
      sortOrder: 4,
      options: [
        { id: "seed-f1-margin-1", label: "Under 3s", value: "under_3", sortOrder: 1 },
        { id: "seed-f1-margin-2", label: "3-8s", value: "3_8", sortOrder: 2 },
        { id: "seed-f1-margin-3", label: "8s+", value: "8_plus", sortOrder: 3 }
      ]
    },
    {
      key: "race_winner",
      prompt: "Who wins the featured duel?",
      description: "Pick the face of the race weekend.",
      answerType: "single_select",
      sortOrder: 5,
      options: driverOptions.map((option, index) => ({
        id: `seed-f1-win-${index}`,
        label: option.label,
        value: option.value,
        sortOrder: index + 1
      }))
    }
  ];
}

export function buildDefaultBasketballQuestions(teams: [MatchTeamSeed, MatchTeamSeed]): Array<
  Omit<PredictionQuestion, "id">
> {
  const [teamA, teamB] = teams;
  const teamOptions = [teamOption(teamA), teamOption(teamB)];

  return [
    {
      key: "first_quarter_winner",
      prompt: "Who takes the first quarter?",
      description: "Fast start or slow burn.",
      answerType: "single_select",
      sortOrder: 1,
      options: teamOptions.map((option, index) => ({
        id: `seed-basketball-q1-${index}`,
        label: option.label,
        value: option.value,
        sortOrder: index + 1
      }))
    },
    {
      key: "top_scorer_team",
      prompt: "Which side has the game top scorer?",
      description: "Star carry or balanced night.",
      answerType: "single_select",
      sortOrder: 2,
      options: teamOptions.map((option, index) => ({
        id: `seed-basketball-top-${index}`,
        label: option.label,
        value: option.value,
        sortOrder: index + 1
      }))
    },
    {
      key: "total_points_range",
      prompt: "What total points range lands?",
      description: "Track meet or grind.",
      answerType: "single_select",
      sortOrder: 3,
      options: [
        { id: "seed-basketball-total-1", label: "Under 205", value: "under_205", sortOrder: 1 },
        { id: "seed-basketball-total-2", label: "205-225", value: "205_225", sortOrder: 2 },
        { id: "seed-basketball-total-3", label: "226-245", value: "226_245", sortOrder: 3 },
        { id: "seed-basketball-total-4", label: "246+", value: "246_plus", sortOrder: 4 }
      ]
    },
    {
      key: "double_digit_win",
      prompt: "Do we get a double-digit win?",
      description: "Blowout watch.",
      answerType: "single_select",
      sortOrder: 4,
      options: [
        { id: "seed-basketball-margin-1", label: `${teamA.shortName} by 10+`, value: `${slugify(teamA.shortName)}_10_plus`, sortOrder: 1 },
        { id: "seed-basketball-margin-2", label: `${teamB.shortName} by 10+`, value: `${slugify(teamB.shortName)}_10_plus`, sortOrder: 2 },
        { id: "seed-basketball-margin-3", label: "Single-digit game", value: "single_digit", sortOrder: 3 }
      ]
    },
    {
      key: "winning_team",
      prompt: "Who closes it out?",
      description: "Fourth-quarter composure pick.",
      answerType: "single_select",
      sortOrder: 5,
      options: teamOptions.map((option, index) => ({
        id: `seed-basketball-win-${index}`,
        label: option.label,
        value: option.value,
        sortOrder: index + 1
      }))
    }
  ];
}

export function buildDefaultQuestionsBySport(
  sportKey: SportKey | string,
  teams: [MatchTeamSeed, MatchTeamSeed],
  templateKey: PredictionTemplateKey = "classic_social"
): QuestionSeed {
  switch (sportKey) {
    case "football":
      return buildDefaultFootballQuestions(teams);
    case "formula1":
      return buildDefaultFormula1Questions(teams);
    case "basketball":
      return buildDefaultBasketballQuestions(teams);
    case "cricket":
    default:
      return buildDefaultCricketQuestions(teams, templateKey);
  }
}

export function buildMiniPickTemplatesBySport(
  sportKey: SportKey | string,
  teams: [MatchTeamSeed, MatchTeamSeed]
): MiniPickTemplateSeed[] {
  switch (sportKey) {
    case "football":
      return buildFootballMiniPickTemplates(teams);
    case "formula1":
      return buildFormula1MiniPickTemplates(teams);
    case "basketball":
      return buildBasketballMiniPickTemplates(teams);
    case "cricket":
    default:
      return buildCricketMiniPickTemplates(teams);
  }
}
