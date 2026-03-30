export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function randomSuffix(length = 6) {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

export function buildMatchSlug(teamA: string, teamB: string, startDate: string) {
  return `${slugify(teamA)}-vs-${slugify(teamB)}-${startDate}`;
}

export function buildChallengeSlug(matchSlug: string) {
  return `${matchSlug}-${randomSuffix(5)}`;
}

export function buildPublicCode(prefix = "p") {
  return `${prefix}${randomSuffix(7)}`;
}
