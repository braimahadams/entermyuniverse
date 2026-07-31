import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { config, paymentsEnabled } from "@/lib/config";
import { BOOKING_STATUS, HOLD_MINUTES } from "@/lib/constants";
import { isSlotBookable } from "@/lib/scheduling";
import { confirmBooking, generateReference } from "@/lib/booking";
import { stripe } from "@/lib/stripe";
import { safeTimeZone } from "@/lib/time";
import { brand } from "@/lib/brand";

export const dynamic = "force-dynamic";

const schema = z.object({
  handle: z.string().min(1),
  offer: z.string().min(1),
  startsAt: z.string().datetime(),
  name: z.string().trim().min(1, "Tell me your name.").max(120),
  email: z.string().email("That email doesn't look right."),
  topic: z
    .string()
    .trim()
    .min(4, "Give a sentence on what you want to talk about.")
    .max(400),
  context: z.string().trim().max(2000).optional(),
  timezone: z.string().max(80).optional(),
  fromVideo: z.string().max(120).optional(),
  /**
   * Honeypot. Real people leave it empty; bots fill everything.
   *
   * Deliberately permissive here: if the schema rejected a filled value,
   * the caller would get a validation error naming this field, which tells
   * a bot exactly which input is the trap. It has to pass validation so it
   * can be caught below and answered with a fake success.
   */
  website: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the form." },
      { status: 400 },
    );
  }

  const input = parsed.data;

  // Silently accept the honeypot so the bot doesn't learn to adapt.
  if (input.website) {
    return NextResponse.json({ ok: true, reference: "OT-XXXXXX" });
  }

  const creator = await db.user.findUnique({
    where: { handle: input.handle.replace(/^@/, "").toLowerCase() },
  });

  // Re-check the selling permission server-side. The page hides the flow
  // for creators who can't sell, but a hidden UI is not an authorisation.
  if (!creator || creator.suspended || !creator.canSell) {
    return NextResponse.json(
      { error: "This creator isn't taking bookings." },
      { status: 403 },
    );
  }

  const sessionType = await db.sessionType.findUnique({
    where: { userId_slug: { userId: creator.id, slug: input.offer } },
  });
  if (!sessionType?.active) {
    return NextResponse.json({ error: "Unknown session." }, { status: 404 });
  }

  const startsAt = new Date(input.startsAt);

  // Authoritative re-check. The browser's idea of what's free can be
  // minutes old, and two people can be on this page at the same time.
  const check = await isSlotBookable(sessionType.id, startsAt);
  if (!check.ok) {
    return NextResponse.json({ error: check.reason }, { status: 409 });
  }

  // Only credit a film that actually belongs to this creator — otherwise
  // the attribution stat could be poisoned from the query string.
  const sourceVideo = input.fromVideo
    ? await db.video.findUnique({
        where: { userId_slug: { userId: creator.id, slug: input.fromVideo } },
        select: { id: true },
      })
    : null;

  // Freeze the platform's cut at booking time, so changing the rate later
  // never rewrites what someone already agreed to.
  const platformFeeCents = Math.round(
    (sessionType.priceCents * creator.platformFeeBps) / 10_000,
  );

  const booking = await db.booking.create({
    data: {
      reference: generateReference(),
      creatorId: creator.id,
      sessionTypeId: sessionType.id,
      sourceVideoId: sourceVideo?.id ?? null,
      name: input.name,
      email: input.email.toLowerCase(),
      topic: input.topic,
      context: input.context || null,
      timezone: safeTimeZone(input.timezone),
      startsAt,
      endsAt: check.endsAt,
      amountCents: sessionType.priceCents,
      currency: sessionType.currency,
      platformFeeCents,
      status: BOOKING_STATUS.PENDING,
      // The hold stops a double-book while they're in Checkout, and it
      // expires by itself so no cleanup job is needed.
      holdExpiresAt: new Date(Date.now() + HOLD_MINUTES * 60_000),
    },
  });

  // Free mode: no Stripe keys, or a genuinely free session. Confirm now.
  if (!paymentsEnabled || sessionType.priceCents === 0) {
    await confirmBooking(booking.id);
    return NextResponse.json({
      ok: true,
      redirect: `/booked/${booking.reference}`,
    });
  }

  try {
    const checkout = await stripe().checkout.sessions.create({
      mode: "payment",
      customer_email: booking.email,
      // Expire at the same moment the hold lapses, so Stripe and our
      // database never disagree about whether the time is still live.
      expires_at: Math.floor(booking.holdExpiresAt!.getTime() / 1000),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: sessionType.currency,
            unit_amount: sessionType.priceCents,
            product_data: {
              name: `${creator.displayName} — ${sessionType.name}`,
              description: `${sessionType.durationMin} minutes, one to one · ${brand.name}`,
            },
          },
        },
      ],
      // Stripe Connect: the money lands in the creator's account and the
      // platform's cut is taken atomically. Only possible once they've
      // onboarded; until then the payment goes to the platform account and
      // is settled manually.
      ...(creator.stripeAccountId && creator.payoutsEnabled
        ? {
            payment_intent_data: {
              application_fee_amount: platformFeeCents,
              transfer_data: { destination: creator.stripeAccountId },
            },
          }
        : {}),
      metadata: { bookingId: booking.id, reference: booking.reference },
      success_url: `${config.siteUrl}/booked/${booking.reference}`,
      cancel_url: `${config.siteUrl}/@${creator.handle}/book?offer=${sessionType.slug}&cancelled=1`,
    });

    await db.booking.update({
      where: { id: booking.id },
      data: { stripeSessionId: checkout.id },
    });

    return NextResponse.json({ ok: true, checkoutUrl: checkout.url });
  } catch (err) {
    console.error("[bookings] Stripe checkout failed:", err);
    // Release the slot rather than leaving a ghost hold on the calendar.
    await db.booking.update({
      where: { id: booking.id },
      data: { status: BOOKING_STATUS.CANCELLED, holdExpiresAt: null },
    });
    return NextResponse.json(
      { error: "Payment couldn't start. Nothing was charged — try again." },
      { status: 502 },
    );
  }
}
