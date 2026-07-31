"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

/**
 * Platform moderation.
 *
 * Every action re-checks admin. Server actions are callable by anyone who
 * knows the generated id, so the check has to live inside the action, not
 * only on the page that renders the button.
 */

export async function setCanSell(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const canSell = formData.get("canSell") === "true";
  if (!id) return;

  await db.user.update({ where: { id }, data: { canSell } });

  // If they've just been granted selling, give them a default offer so the
  // "Book" button on their universe isn't a dead end.
  if (canSell) {
    const existing = await db.sessionType.count({ where: { userId: id } });
    if (existing === 0) {
      await db.sessionType.create({
        data: {
          userId: id,
          slug: "one-talk",
          name: "One Talk",
          tagline: "45 minutes. One problem. Taken all the way down.",
          durationMin: 45,
          priceCents: 12_000,
          // Inactive until they've set their hours and a real price —
          // an offer nobody can fulfil is worse than no offer.
          active: false,
        },
      });
    }
  }

  revalidatePath("/admin");
}

export async function setUserFlag(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const field = String(formData.get("field") ?? "");
  const value = formData.get("value") === "true";

  if (!id || !["approved", "verified", "featured", "suspended"].includes(field)) {
    return;
  }

  await db.user.update({ where: { id }, data: { [field]: value } });

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function moderateFilm(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const approved = formData.get("approved") === "true";
  if (!id) return;

  await db.video.update({
    where: { id },
    data: {
      approved,
      // The creator sees this in their studio. A takedown with no reason
      // is how you lose people who'd have happily fixed it.
      moderationNote: approved
        ? null
        : String(formData.get("note") ?? "").trim() ||
          "Hidden pending review.",
    },
  });

  revalidatePath("/admin");
  revalidatePath("/");
}
