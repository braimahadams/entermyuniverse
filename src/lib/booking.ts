import { db } from "@/lib/db";
import { config } from "@/lib/config";
import { BOOKING_STATUS } from "@/lib/constants";
import { buildIcs } from "@/lib/ics";
import { guestConfirmation, ownerNotification } from "@/lib/emails";
import { createMeetingRoom } from "@/lib/providers/meeting";
import { sendMail } from "@/lib/providers/email";
import { brand } from "@/lib/brand";

/**
 * Human-readable booking reference. Ambiguous characters (0/O, 1/I) are
 * left out so someone can read it down a phone line without spelling it.
 */
export function generateReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `OT-${out}`;
}

/**
 * Turn a held booking into a real one.
 *
 * Called from two places — the Stripe webhook, and the free-mode path when
 * payments aren't configured — so the after-payment behaviour is identical
 * either way and only exists once.
 *
 * Deliberately idempotent: Stripe retries webhooks, and a retry must not
 * mint a second room or send a second confirmation.
 */
export async function confirmBooking(bookingId: string): Promise<void> {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { sessionType: true },
  });

  if (!booking) {
    console.error(`[booking] confirm called for unknown id ${bookingId}`);
    return;
  }

  if (booking.status === BOOKING_STATUS.CONFIRMED) {
    return; // already done — a webhook retry, most likely
  }

  const room = await createMeetingRoom({
    reference: booking.reference,
    accessToken: booking.accessToken,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
  });

  const confirmed = await db.booking.update({
    where: { id: bookingId },
    data: {
      status: BOOKING_STATUS.CONFIRMED,
      holdExpiresAt: null,
      meetingUrl: room.url,
      meetingProvider: room.provider,
      paidAt: booking.amountCents > 0 ? new Date() : null,
    },
    include: { sessionType: true },
  });

  const manageUrl = `${config.siteUrl}/booking/${confirmed.accessToken}`;

  const payload = {
    reference: confirmed.reference,
    name: confirmed.name,
    email: confirmed.email,
    topic: confirmed.topic,
    context: confirmed.context,
    startsAt: confirmed.startsAt,
    endsAt: confirmed.endsAt,
    timezone: confirmed.timezone,
    sessionName: confirmed.sessionType.name,
    durationMin: confirmed.sessionType.durationMin,
    amountCents: confirmed.amountCents,
    currency: confirmed.currency,
    meetingUrl: room.url,
    manageUrl,
  };

  const calendar = buildIcs({
    uid: confirmed.id,
    title: `${brand.name} — ${confirmed.sessionType.name}`,
    description: `Topic: ${confirmed.topic}\n\nJoin: ${room.url}\n\nReschedule or cancel: ${manageUrl}`,
    startsAt: confirmed.startsAt,
    endsAt: confirmed.endsAt,
    url: room.url,
    organizerEmail: config.email.owner || "hello@example.com",
    attendeeEmail: confirmed.email,
    attendeeName: confirmed.name,
  });

  const guest = guestConfirmation(payload);
  await sendMail({
    to: confirmed.email,
    subject: guest.subject,
    html: guest.html,
    text: guest.text,
    calendar,
  });

  if (config.email.owner) {
    const owner = ownerNotification(payload);
    await sendMail({
      to: config.email.owner,
      subject: owner.subject,
      html: owner.html,
      text: owner.text,
      calendar,
    });
  }
}
