import type { ChallengeParticipantView } from "@/lib/db/types";

import type { ChallengeAiProvider } from "./types";

function getWinner(participants: ChallengeParticipantView[]) {
  return [...participants].sort(
    (left, right) => right.totalPoints - left.totalPoints || left.displayName.localeCompare(right.displayName)
  )[0];
}

function getRunnerUp(participants: ChallengeParticipantView[]) {
  return [...participants]
    .sort((left, right) => right.totalPoints - left.totalPoints || left.displayName.localeCompare(right.displayName))
    .slice(1)[0];
}

function getContrarianLine(percentages: number[]) {
  const strongestLean = Math.max(...percentages, 0);

  if (strongestLean >= 75) {
    return "One side of the chat moved like a herd.";
  }

  if (strongestLean >= 55) {
    return "The room leaned one way, but not by much.";
  }

  return "Nobody owned the room. Every take felt live.";
}

export const localAiProvider: ChallengeAiProvider = {
  key: "local",
  async generate({ kind, context }) {
    const { data, punishmentLine } = context;
    const creator = data.participants.find((participant) => participant.isCreator)?.displayName ?? "Someone";
    const winner = getWinner(data.participants);
    const runnerUp = getRunnerUp(data.participants);
    const percentageBuckets = data.opinionBoard.flatMap((question) => question.options.map((option) => option.percentage));

    switch (kind) {
      case "pre_match_storyline":
        return {
          title: `${creator} opened the board`,
          body: `${data.match.title} is now a public receipts match. ${getContrarianLine(
            percentageBuckets
          )} Lock the counter-picks before the chat starts rewriting history.`,
          shareLine: `${creator} opened a receipts board for ${data.match.title}.`
        };
      case "post_match_recap":
        return {
          title: winner ? `${winner.displayName} cooked the board` : "Board settled",
          body: winner
            ? `${winner.displayName} closed ${data.match.title} on ${winner.totalPoints}/${data.questions.length}. ${
                runnerUp ? `${runnerUp.displayName} had to watch the reveal row by row.` : "No one else got close."
              }`
            : `${data.match.title} is settled and the receipts are public now.`,
          shareLine: winner ? `${winner.displayName} ran the board on ${data.match.title}.` : null
        };
      case "rivalry_summary":
        return {
          title: winner && runnerUp ? `${winner.displayName} over ${runnerUp.displayName}` : "Rivalry summary",
          body:
            winner && runnerUp
              ? `${winner.displayName} beat ${runnerUp.displayName} on the same locked board. ${
                  punishmentLine ?? "The loser owes the group a proper explanation."
                }`
              : "The board settled, the ranking held, and the receipts stayed visible.",
          shareLine:
            winner && runnerUp ? `${winner.displayName} beat ${runnerUp.displayName} with the receipts on record.` : null
        };
      case "trash_talk":
        return {
          title: "Chat-ready line",
          body: winner
            ? `${winner.displayName} had the takes. Everyone else had drafts. ${punishmentLine ?? "Receipts only."}`
            : "Receipts landed. Bad takes expired on contact.",
          shareLine: winner ? `${winner.displayName} had the takes. Everyone else had drafts.` : null
        };
      case "creator_room_hype":
      default:
        return {
          title: "Board live",
          body: `${data.match.title} is active and the room has a fresh board to fight over.`,
          shareLine: `${data.match.title} just got a fresh board.`
        };
    }
  }
};
