import { db } from "@/lib/db";
import {
  BLOCKING_STATUSES,
  BOOKING_STATUS,
  SLOT_GRANULARITY_MIN,
} from "@/lib/constants";
import {
  addDays,
  getZonedParts,
  isoWeekKey,
  safeTimeZone,
  zonedTimeToUtc,
  type ZonedParts,
} from "@/lib/time";

export type Slot = {
  /** ISO UTC instant — the wire format for a slot everywhere in the app. */
  startsAt: string;
  endsAt: string;
};

export type DaySlots = {
  /** YYYY-MM-DD in the *visitor's* timezone. */
  date: string;
  slots: Slot[];
};

type SessionRules = {
  durationMin: number;
  bufferMin: number;
  noticeHours: number;
  horizonDays: number;
  maxPerWeek: number;
};

/**
 * Bookings that currently occupy calendar space.
 *
 * A PENDING hold counts — otherwise two people mid-checkout could buy the
 * same slot — but only until it expires, so an abandoned checkout releases
 * the time by itself with no cleanup job to run or pay for.
 */
async function loadOccupied(creatorId: string, from: Date, to: Date) {
  const now = new Date();
  const rows = await db.booking.findMany({
    where: {
      // Scoped to one creator: two creators being busy at 3pm is not a
      // conflict, it's just a Tuesday.
      creatorId,
      status: { in: BLOCKING_STATUSES },
      startsAt: { gte: new Date(from.getTime() - 86_400_000) },
      endsAt: { lte: new Date(to.getTime() + 86_400_000) },
    },
    select: {
      startsAt: true,
      endsAt: true,
      status: true,
      holdExpiresAt: true,
    },
  });

  return rows.filter(
    (b) =>
      b.status !== BOOKING_STATUS.PENDING ||
      !b.holdExpiresAt ||
      b.holdExpiresAt > now,
  );
}

/**
 * Every bookable slot between now and the horizon.
 *
 * Returned grouped by the visitor's local date, because that's the only
 * grouping that makes sense to the person looking at the calendar.
 */
export async function getAvailability(
  sessionTypeId: string,
  visitorTimeZone: string,
): Promise<DaySlots[]> {
  const sessionType = await db.sessionType.findUnique({
    where: { id: sessionTypeId },
  });
  if (!sessionType || !sessionType.active) return [];

  const creatorId = sessionType.userId;

  const rules = await db.availabilityRule.findMany({
    where: { userId: creatorId, active: true },
    orderBy: [{ weekday: "asc" }, { startMin: "asc" }],
  });
  if (rules.length === 0) return [];

  const now = new Date();
  const horizonEnd = new Date(
    now.getTime() + sessionType.horizonDays * 86_400_000,
  );

  const [blackouts, occupied] = await Promise.all([
    db.blackoutDate.findMany({
      where: {
        userId: creatorId,
        endsAt: { gte: now },
        startsAt: { lte: horizonEnd },
      },
    }),
    loadOccupied(creatorId, now, horizonEnd),
  ]);

  const earliest = new Date(
    now.getTime() + sessionType.noticeHours * 3_600_000,
  );

  // Weekly cap: count what's already booked per ISO week before generating,
  // so a full week produces no slots at all rather than teasing them.
  const bookedPerWeek = new Map<string, number>();
  for (const booking of occupied) {
    const key = isoWeekKey(booking.startsAt);
    bookedPerWeek.set(key, (bookedPerWeek.get(key) ?? 0) + 1);
  }

  const guestZone = safeTimeZone(visitorTimeZone);
  const byDate = new Map<string, Slot[]>();

  // Walk the owner's calendar days; the owner's rules define the grid.
  const ownerZone = safeTimeZone(rules[0].timezone);
  const today = getZonedParts(now, ownerZone);

  for (let dayOffset = 0; dayOffset <= sessionType.horizonDays; dayOffset++) {
    const day: ZonedParts = addDays(today, dayOffset);

    for (const rule of rules) {
      if (rule.weekday !== day.weekday) continue;

      const ruleZone = safeTimeZone(rule.timezone);

      for (
        let minute = rule.startMin;
        minute + sessionType.durationMin <= rule.endMin;
        minute += SLOT_GRANULARITY_MIN
      ) {
        const startsAt = zonedTimeToUtc(
          day.year,
          day.month,
          day.day,
          Math.floor(minute / 60),
          minute % 60,
          ruleZone,
        );
        const endsAt = new Date(
          startsAt.getTime() + sessionType.durationMin * 60_000,
        );

        if (startsAt < earliest) continue;
        if (startsAt > horizonEnd) continue;

        const weekKey = isoWeekKey(startsAt);
        if ((bookedPerWeek.get(weekKey) ?? 0) >= sessionType.maxPerWeek) {
          continue;
        }

        if (
          overlapsAny(startsAt, endsAt, blackouts, 0) ||
          overlapsAny(startsAt, endsAt, occupied, sessionType.bufferMin)
        ) {
          continue;
        }

        // Group under the date the *visitor* would call it.
        const guestParts = getZonedParts(startsAt, guestZone);
        const dateKey = `${guestParts.year}-${pad(guestParts.month)}-${pad(guestParts.day)}`;

        const list = byDate.get(dateKey) ?? [];
        list.push({
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
        });
        byDate.set(dateKey, list);
      }
    }
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, slots]) => ({
      date,
      slots: slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    }));
}

function overlapsAny(
  start: Date,
  end: Date,
  ranges: { startsAt: Date; endsAt: Date }[],
  bufferMin: number,
): boolean {
  const buffer = bufferMin * 60_000;
  return ranges.some(
    (r) =>
      start.getTime() < r.endsAt.getTime() + buffer &&
      end.getTime() > r.startsAt.getTime() - buffer,
  );
}

/**
 * Re-check a specific slot at the moment of booking.
 *
 * The availability list a visitor is looking at can be minutes stale. This
 * is the authoritative check, and it runs server-side inside the booking
 * request — never trust the slot the browser hands back.
 */
export async function isSlotBookable(
  sessionTypeId: string,
  startsAt: Date,
): Promise<{ ok: true; endsAt: Date } | { ok: false; reason: string }> {
  const sessionType = await db.sessionType.findUnique({
    where: { id: sessionTypeId },
  });
  if (!sessionType?.active) {
    return { ok: false, reason: "That session isn't available right now." };
  }

  const creatorId = sessionType.userId;
  const endsAt = new Date(startsAt.getTime() + sessionType.durationMin * 60_000);
  const now = new Date();

  if (startsAt < new Date(now.getTime() + sessionType.noticeHours * 3_600_000)) {
    return { ok: false, reason: "That time is too soon to book." };
  }
  if (startsAt > new Date(now.getTime() + sessionType.horizonDays * 86_400_000)) {
    return { ok: false, reason: "That time is too far ahead." };
  }

  const rules = await db.availabilityRule.findMany({
    where: { userId: creatorId, active: true },
  });
  const ownerZone = safeTimeZone(rules[0]?.timezone);
  const local = getZonedParts(startsAt, ownerZone);
  const minuteOfDay = local.hour * 60 + local.minute;

  const insideAWindow = rules.some(
    (rule) =>
      rule.weekday === local.weekday &&
      minuteOfDay >= rule.startMin &&
      minuteOfDay + sessionType.durationMin <= rule.endMin,
  );
  if (!insideAWindow) {
    return { ok: false, reason: "That time is outside available hours." };
  }

  const [blackouts, occupied] = await Promise.all([
    db.blackoutDate.findMany({
      where: {
        userId: creatorId,
        startsAt: { lte: endsAt },
        endsAt: { gte: startsAt },
      },
    }),
    loadOccupied(creatorId, startsAt, endsAt),
  ]);

  if (overlapsAny(startsAt, endsAt, blackouts, 0)) {
    return { ok: false, reason: "That day is blocked off." };
  }
  if (overlapsAny(startsAt, endsAt, occupied, sessionType.bufferMin)) {
    return { ok: false, reason: "Someone just took that slot." };
  }

  const weekKey = isoWeekKey(startsAt);
  const thisWeek = occupied.filter((b) => isoWeekKey(b.startsAt) === weekKey);
  if (thisWeek.length >= sessionType.maxPerWeek) {
    return { ok: false, reason: "That week is fully booked." };
  }

  return { ok: true, endsAt };
}

/** Slots left this week — the honest number behind the scarcity line. */
export async function spotsLeftThisWeek(
  creatorId: string,
  maxPerWeek: number,
): Promise<number> {
  const now = new Date();
  const weekKey = isoWeekKey(now);
  const occupied = await loadOccupied(
    creatorId,
    now,
    new Date(now.getTime() + 8 * 86_400_000),
  );
  const taken = occupied.filter((b) => isoWeekKey(b.startsAt) === weekKey).length;
  return Math.max(0, maxPerWeek - taken);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
