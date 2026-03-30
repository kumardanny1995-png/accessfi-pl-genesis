import {
  differenceInHours,
  format,
  formatDistanceToNowStrict,
  isPast,
  parseISO
} from "date-fns";

export function formatMatchDate(isoString: string) {
  return format(parseISO(isoString), "EEE, d MMM • h:mm a");
}

export function formatAdminDate(isoString: string) {
  return format(parseISO(isoString), "dd MMM yyyy, h:mm a");
}

export function relativeLockLabel(isoString: string) {
  const date = parseISO(isoString);
  if (isPast(date)) {
    return "Locked";
  }

  return `Locks in ${formatDistanceToNowStrict(date)}`;
}

export function countdownBand(isoString: string) {
  const hours = differenceInHours(parseISO(isoString), new Date());
  if (hours <= 2) {
    return "critical";
  }

  if (hours <= 12) {
    return "warning";
  }

  return "normal";
}

export function formatPercentage(value: number) {
  return `${Math.round(value)}%`;
}

export function truncateText(value: string, max = 120) {
  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, max - 1)}…`;
}
