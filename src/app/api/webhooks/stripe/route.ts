import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { config } from "@/lib/config";
import { BOOKING_STATUS } from "@/lib/constants";
import { confirmBooking } from "@/lib/booking";
import { stripe } from "@/lib/stripe";

/**
 * Stripe webhook — the only place a booking becomes real.
 *
 * Not the success_url: a visitor can close the tab before the redirect,
 * or hit the success URL by hand without paying a cent. Money is only
 * money when Stripe says so, signed.
 */

export const dynamic = "force-dynamic";
// The signature is computed over the raw bytes, so the body must not be
// parsed or transformed before verification.
export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature || !config.stripe.webhookSecret) {
    return NextResponse.json({ error: "Not configured." }, { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(
      body,
      signature,
      config.stripe.webhookSecret,
    );
  } catch (err) {
    console.error("[stripe] signature verification failed:", err);
    return NextResponse.json({ error: "Bad signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const bookingId = session.metadata?.bookingId;
        if (!bookingId) break;

        await db.booking.update({
          where: { id: bookingId },
          data: {
            stripePaymentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : (session.payment_intent?.id ?? null),
          },
        });

        // Idempotent — Stripe retries, and a retry must not send a
        // second confirmation or mint a second room.
        await confirmBooking(bookingId);
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;
        const bookingId = session.metadata?.bookingId;
        if (!bookingId) break;

        // They walked away. Free the slot immediately rather than waiting
        // for the hold to lapse.
        await db.booking.updateMany({
          where: { id: bookingId, status: BOOKING_STATUS.PENDING },
          data: { status: BOOKING_STATUS.CANCELLED, holdExpiresAt: null },
        });
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        const booking = await db.booking.findFirst({
          where: { stripePaymentId: charge.payment_intent as string },
        });
        if (booking) {
          await db.booking.update({
            where: { id: booking.id },
            data: { status: BOOKING_STATUS.CANCELLED },
          });
        }
        break;
      }
    }
  } catch (err) {
    // Return 500 so Stripe retries — better a duplicate delivery against
    // idempotent handlers than a booking that was paid for and lost.
    console.error(`[stripe] handler failed for ${event.type}:`, err);
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
