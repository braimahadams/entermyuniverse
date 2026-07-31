"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { removeStored } from "@/lib/providers/storage";
import { safeTimeZone } from "@/lib/time";
import { BOOKING_STATUS } from "@/lib/constants";

/**
 * Studio mutations.
 *
 * Every one of these re-derives the current user and scopes the query by
 * their id. Server actions are reachable by anyone who can guess the
 * generated action id, so a row is only ever touched via a `where` that
 * includes `userId` — never by trusting an id that arrived in the form.
 */

/* ── profile ───────────────────────────────────────────────── */

export async function saveProfile(formData: FormData) {
  const user = await requireUser();

  await db.user.update({
    where: { id: user.id },
    data: {
      displayName: String(formData.get("displayName") ?? "").trim().slice(0, 60),
      tagline: String(formData.get("tagline") ?? "").trim().slice(0, 200) || null,
      bio: String(formData.get("bio") ?? "").trim().slice(0, 2000) || null,
      avatarUrl: String(formData.get("avatarUrl") ?? "").trim() || null,
      links:
        String(formData.get("links") ?? "")
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .slice(0, 5)
          .join("\n") || null,
      timezone: safeTimeZone(String(formData.get("timezone") ?? "UTC")),
    },
  });

  revalidatePath("/studio/profile");
  revalidatePath(`/@${user.handle}`);
}

/* ── films ─────────────────────────────────────────────────── */

export async function saveFilm(formData: FormData) {
  const user = await requireUser();

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const sourceId = String(formData.get("sourceId") ?? "").trim();

  if (!title || !sourceId) return;

  const data = {
    title: title.slice(0, 160),
    hook: String(formData.get("hook") ?? "").trim().slice(0, 200),
    description: String(formData.get("description") ?? "").trim() || null,
    openQuestion: String(formData.get("openQuestion") ?? "").trim() || null,
    topic: String(formData.get("topic") ?? "system"),
    sourceId,
    thumbnailUrl: String(formData.get("thumbnailUrl") ?? "").trim() || null,
    durationSec: Number(formData.get("durationSec")) || null,
    sizeBytes: Number(formData.get("sizeBytes")) || null,
    published: formData.get("published") === "on",
    position: Number(formData.get("position")) || 0,
  };

  if (id) {
    // updateMany, not update: the userId in the filter is what stops one
    // creator editing another's film by posting their id.
    await db.video.updateMany({ where: { id, userId: user.id }, data });
  } else {
    const base =
      String(formData.get("slug") ?? "").trim() ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60) ||
      "film";

    // Slugs are unique per creator, so only collide within your own work.
    let slug = base;
    for (let n = 2; n < 40; n++) {
      const taken = await db.video.findUnique({
        where: { userId_slug: { userId: user.id, slug } },
        select: { id: true },
      });
      if (!taken) break;
      slug = `${base}-${n}`;
    }

    await db.video.create({ data: { ...data, slug, userId: user.id } });
  }

  revalidatePath("/studio/films");
  revalidatePath(`/@${user.handle}`);
  revalidatePath("/");
}

export async function deleteFilm(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const film = await db.video.findFirst({
    where: { id, userId: user.id },
    select: { id: true, sourceId: true },
  });
  if (!film) return;

  await db.video.delete({ where: { id: film.id } });
  // Best-effort: never leave the row behind because a file wouldn't delete.
  await removeStored(film.sourceId);

  revalidatePath("/studio/films");
  revalidatePath(`/@${user.handle}`);
  revalidatePath("/");
}

/* ── offers ────────────────────────────────────────────────── */

export async function saveOffer(formData: FormData) {
  const user = await requireUser();
  if (!user.canSell) return;

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  // Prices arrive as whole units and are stored as minor units, so money
  // never touches a float anywhere in the system.
  const priceCents = Math.max(
    0,
    Math.round(Number(formData.get("price") ?? 0) * 100),
  );

  const wantsActive = formData.get("active") === "on";
  // An active offer with no hours is a button onto an empty calendar.
  const hasHours = await db.availabilityRule.count({
    where: { userId: user.id, active: true },
  });

  const data = {
    name: name.slice(0, 80),
    tagline: String(formData.get("tagline") ?? "").trim().slice(0, 200),
    description: String(formData.get("description") ?? "").trim() || null,
    includes:
      String(formData.get("includes") ?? "")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .join("\n") || null,
    priceCents,
    currency: String(formData.get("currency") ?? "eur").toLowerCase().slice(0, 3),
    durationMin: Math.max(10, Number(formData.get("durationMin")) || 45),
    bufferMin: Math.max(0, Number(formData.get("bufferMin")) || 0),
    noticeHours: Math.max(0, Number(formData.get("noticeHours")) || 0),
    horizonDays: Math.max(1, Number(formData.get("horizonDays")) || 21),
    maxPerWeek: Math.max(1, Number(formData.get("maxPerWeek")) || 6),
    active: wantsActive && hasHours > 0,
  };

  if (id) {
    await db.sessionType.updateMany({ where: { id, userId: user.id }, data });
  } else {
    const base =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40) || "session";

    let slug = base;
    for (let n = 2; n < 40; n++) {
      const taken = await db.sessionType.findUnique({
        where: { userId_slug: { userId: user.id, slug } },
        select: { id: true },
      });
      if (!taken) break;
      slug = `${base}-${n}`;
    }

    const count = await db.sessionType.count({ where: { userId: user.id } });
    await db.sessionType.create({
      data: { ...data, slug, userId: user.id, position: count },
    });
  }

  revalidatePath("/studio/offers");
  revalidatePath(`/@${user.handle}`);
}

export async function deleteOffer(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Refuse if anything is booked against it — deleting would orphan a
  // paid booking and its meeting room.
  const booked = await db.booking.count({
    where: { sessionTypeId: id, creatorId: user.id },
  });
  if (booked > 0) {
    await db.sessionType.updateMany({
      where: { id, userId: user.id },
      data: { active: false },
    });
  } else {
    await db.sessionType.deleteMany({ where: { id, userId: user.id } });
  }

  revalidatePath("/studio/offers");
  revalidatePath(`/@${user.handle}`);
}

/* ── hours ─────────────────────────────────────────────────── */

export async function addHours(formData: FormData) {
  const user = await requireUser();
  if (!user.canSell) return;

  const weekday = Number(formData.get("weekday"));
  const startMin = toMinutes(String(formData.get("start") ?? "14:00"));
  const endMin = toMinutes(String(formData.get("end") ?? "18:00"));
  if (endMin <= startMin) return;

  await db.availabilityRule.create({
    data: {
      userId: user.id,
      weekday,
      startMin,
      endMin,
      timezone: safeTimeZone(String(formData.get("timezone") ?? user.timezone)),
    },
  });

  revalidatePath("/studio/hours");
}

export async function deleteHours(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.availabilityRule.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/studio/hours");
}

export async function addBlackout(formData: FormData) {
  const user = await requireUser();
  if (!user.canSell) return;

  const start = String(formData.get("startsAt") ?? "");
  const end = String(formData.get("endsAt") ?? "");
  if (!start || !end) return;

  const startsAt = new Date(`${start}T00:00:00`);
  const endsAt = new Date(`${end}T23:59:59`);
  if (endsAt <= startsAt) return;

  await db.blackoutDate.create({
    data: {
      userId: user.id,
      startsAt,
      endsAt,
      reason: String(formData.get("reason") ?? "").trim() || null,
    },
  });

  revalidatePath("/studio/hours");
}

export async function deleteBlackout(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.blackoutDate.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/studio/hours");
}

/* ── bookings ──────────────────────────────────────────────── */

export async function setBookingStatus(formData: FormData) {
  const user = await requireUser();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !(status in BOOKING_STATUS)) return;

  await db.booking.updateMany({
    // creatorId scoping: you can only touch bookings made with you.
    where: { id, creatorId: user.id },
    data: {
      status,
      ...(status === BOOKING_STATUS.CANCELLED ? { holdExpiresAt: null } : {}),
    },
  });

  revalidatePath("/studio");
}

function toMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}
