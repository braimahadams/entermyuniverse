/**
 * Timezone math on top of Intl. No date library.
 *
 * Two rules this codebase does not break:
 *   1. Every instant in the database is UTC.
 *   2. A wall-clock time ("Tuesday 3pm") is meaningless without a zone,
 *      so it never travels without one.
 *
 * Everything below exists to convert safely between those two worlds,
 * including across daylight-saving boundaries.
 */

export type ZonedParts = {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  /** 0 = Sunday ... 6 = Saturday */
  weekday: number;
};

/** How far `timeZone` is from UTC at this particular instant, in ms. */
function offsetMsAt(instant: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts: Record<string, number> = {};
  for (const part of dtf.formatToParts(instant)) {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
  }

  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    // Some ICU builds emit hour 24 for midnight.
    parts.hour % 24,
    parts.minute,
    parts.second,
  );

  return asUtc - instant.getTime();
}

/** What the clock on the wall reads in `timeZone` at this instant. */
export function getZonedParts(instant: Date, timeZone: string): ZonedParts {
  const shifted = new Date(instant.getTime() + offsetMsAt(instant, timeZone));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    weekday: shifted.getUTCDay(),
  };
}

/**
 * The reverse: a wall-clock time in a zone becomes a real UTC instant.
 *
 * The offset depends on the answer we're computing, so we guess, measure,
 * and correct once. That second pass is what makes DST transitions work —
 * without it, every booking in the week after a clock change is an hour off.
 */
export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const naive = Date.UTC(year, month - 1, day, hour, minute);

  const firstGuess = naive - offsetMsAt(new Date(naive), timeZone);
  const correction = offsetMsAt(new Date(firstGuess), timeZone);
  const settled = naive - correction;

  return new Date(settled);
}

/** Midnight-to-midnight in a zone, as UTC instants. */
export function startOfZonedDay(
  parts: Pick<ZonedParts, "year" | "month" | "day">,
  timeZone: string,
): Date {
  return zonedTimeToUtc(parts.year, parts.month, parts.day, 0, 0, timeZone);
}

/** Advance a calendar date by whole days, ignoring time entirely. */
export function addDays(
  parts: Pick<ZonedParts, "year" | "month" | "day">,
  days: number,
): ZonedParts {
  const d = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  d.setUTCDate(d.getUTCDate() + days);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: 0,
    minute: 0,
    weekday: d.getUTCDay(),
  };
}

/** "2026-W31" — used to enforce the weekly booking cap. */
export function isoWeekKey(instant: Date, timeZone = "UTC"): string {
  const p = getZonedParts(instant, timeZone);
  const d = new Date(Date.UTC(p.year, p.month - 1, p.day));
  // ISO weeks run Monday-Sunday and belong to the year containing Thursday.
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** A timezone we're willing to hand to Intl. Falls back to UTC. */
export function safeTimeZone(tz: string | undefined | null): string {
  if (!tz) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
}

export function formatInZone(
  instant: Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions = {},
): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: safeTimeZone(timeZone),
    dateStyle: "full",
    timeStyle: "short",
    ...options,
  }).format(instant);
}

/** "GMT+1" — so people can sanity-check the zone we guessed for them. */
export function zoneAbbreviation(timeZone: string, instant = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: safeTimeZone(timeZone),
    timeZoneName: "short",
  }).formatToParts(instant);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? "UTC";
}
