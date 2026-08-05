"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { removeStored } from "@/lib/providers/storage";
import { safeTimeZone } from "@/lib/time";
import { slugify, postTitle } from "@/lib/posts";
import { BOOKING_STATUS } from "@/lib/constants";

/**
 * Studio mutations.
 *
 * Every one re-derives the current user and scopes by their id. Server
 * actions are reachable by anyone who can guess the generated action id,
 * so a row is only ever touched after confirming it belongs to the caller
 * — never by trusting an id that arrived in a form.
 */

/* ── writing ───────────────────────────────────────────────── */

/** Refresh everywhere a post can appear. */
function revalidatePost(handle: string) {
  revalidatePath("/studio");
  revalidatePath(`/@${handle}`);
  revalidatePath(`/@${handle}/thoughts`, "layout");
  revalidatePath("/");
}

export async function savePost(formData: FormData) {
  const user = await requireUser();

  const id = String(formData.get("id") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  // The body is the post. Everything else is optional decoration.
  if (!body) return;

  const title = String(formData.get("title") ?? "").trim() || null;

  // getAll: the collection checkboxes share a name, so a single get()
  // would silently keep only the first one ticked.
  const collectionRefs = formData
    .getAll("collections")
    .map(String)
    .filter(Boolean)
    .map((slug) => ({ slug }));

  const sourceId = String(formData.get("sourceId") ?? "").trim() || null;

  const data = {
    body,
    title,
    openQuestion: String(formData.get("openQuestion") ?? "").trim() || null,
    pinned: formData.get("pinned") === "on",
    published: formData.get("published") !== "off",
    sourceId,
    // Video metadata is meaningless without a video — clear it together so
    // removing an attachment can't leave a stale duration behind.
    thumbnailUrl: sourceId
      ? String(formData.get("thumbnailUrl") ?? "").trim() || null
      : null,
    durationSec: sourceId ? Number(formData.get("durationSec")) || null : null,
    sizeBytes: sourceId ? Number(formData.get("sizeBytes")) || null : null,
    transcript: String(formData.get("transcript") ?? "").trim() || null,
  };

  if (id) {
    const owned = await db.post.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!owned) return;

    await db.post.update({
      where: { id: owned.id },
      // `set` replaces the whole list, which is what an edit means:
      // unticking a box has to actually remove that collection.
      data: { ...data, collections: { set: collectionRefs } },
    });
  } else {
    // Slug comes from the title when there is one, otherwise the opening
    // words — so a URL reads like the thought rather than like an id.
    const base = slugify(title ?? postTitle({ title: null, body }));

    let slug = base;
    for (let n = 2; n < 60; n++) {
      const taken = await db.post.findUnique({
        where: { userId_slug: { userId: user.id, slug } },
        select: { id: true },
      });
      if (!taken) break;
      slug = `${base}-${n}`;
    }

    await db.post.create({
      // `connect` rather than `set`: on a new row there's nothing to
      // replace, so `set` isn't a valid nested write here.
      data: {
        ...data,
        slug,
        userId: user.id,
        collections: { connect: collectionRefs },
      },
    });
  }

  revalidatePost(user.handle);
}

export async function deletePost(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const post = await db.post.findFirst({
    where: { id, userId: user.id },
    select: { id: true, sourceId: true },
  });
  if (!post) return;

  await db.post.delete({ where: { id: post.id } });
  // Best-effort: never leave the row behind because a file wouldn't delete.
  if (post.sourceId) await removeStored(post.sourceId);

  revalidatePost(user.handle);
}

/** Pin/unpin from the timeline without opening the editor. */
export async function togglePinned(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const post = await db.post.findFirst({
    where: { id, userId: user.id },
    select: { id: true, pinned: true },
  });
  if (!post) return;

  await db.post.update({
    where: { id: post.id },
    data: { pinned: !post.pinned },
  });

  revalidatePost(user.handle);
}

/* ── replies ───────────────────────────────────────────────── */

export async function moderateComment(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const action = String(formData.get("action") ?? "");
  if (!id) return;

  // Scoped through the post: you can only moderate replies to your own
  // writing, however the id got here.
  const comment = await db.comment.findFirst({
    where: { id, post: { userId: user.id } },
    select: { id: true, post: { select: { slug: true } } },
  });
  if (!comment) return;

  if (action === "delete") {
    await db.comment.delete({ where: { id: comment.id } });
  } else {
    await db.comment.update({
      where: { id: comment.id },
      data: { approved: action === "approve" },
    });
  }

  revalidatePath("/studio/replies");
  revalidatePath(`/@${user.handle}/thoughts/${comment.post.slug}`);
}

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
    const base = slugify(name) || "session";

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
