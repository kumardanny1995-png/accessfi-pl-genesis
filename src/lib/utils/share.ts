import { DEFAULT_CHALLENGE_SHARE_COPY, DEFAULT_RESULT_SHARE_COPY } from "@/lib/data/defaults";
import { getAppUrl } from "@/lib/db/env";
import type { ChallengePageData } from "@/lib/db/types";
import { lockscorePath } from "@/lib/utils/lockscore-routes";

export function getChallengeUrl(challengeSlug: string) {
  return `${getAppUrl()}${lockscorePath(`/c/${challengeSlug}`)}`;
}

export function getResultsUrl(challengeSlug: string) {
  return `${getAppUrl()}${lockscorePath(`/c/${challengeSlug}/results`)}`;
}

export function buildChallengeShareText(data: ChallengePageData) {
  const creator = data.participants.find((participant) => participant.isCreator)?.displayName ?? "Someone";
  const message = data.challenge.shareMessage?.trim() || DEFAULT_CHALLENGE_SHARE_COPY;

  return `${creator} says: "${message}"\n\n${data.match.title}\nStake: ${
    data.challenge.stakeText ?? "Bragging rights"
  }\nTake the counter-picks and settle it properly.`;
}

export function buildResultsShareText(data: ChallengePageData) {
  const winner = [...data.participants]
    .sort((left, right) => right.totalPoints - left.totalPoints || left.displayName.localeCompare(right.displayName))
    .at(0);

  return `${DEFAULT_RESULT_SHARE_COPY}\n\n${
    winner ? `${winner.displayName} won ${winner.totalPoints}/${data.questions.length}.` : "The board is settled."
  }\n${data.match.title}`;
}

export function buildWhatsAppLink(text: string, url: string) {
  return `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${url}`)}`;
}

export function buildTelegramLink(text: string, url: string) {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}
