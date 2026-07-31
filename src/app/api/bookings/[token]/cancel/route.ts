import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { BOOKING_STATUS } from "@/lib/constants";
import { paymentsEnabled } from "@/lib/config";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * Guest-initiated cancellation.
 *
 * Authorised purely by the token in the URL, which is a cuid delivered
 * only to the address that made the booking. Anyone holding it is, by
 * definition, the person who booked.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const booking = await db.booking.findUnique({
    where: { accessToken: token },
  });
  if (!booking) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (booking.status === BOOKING_STATUS.CANCELLED) {
    return NextResponse.json({ ok: true });
  }

  // Enforce the 12-hour cutoff server-side too. The page hides the button
  // past the deadline, but a hidden button is not a rule.
  const cutoff = new Date(booking.startsAt.getTime() - 12 * 3_600_000);
  if (new Date() > cutoff) {
    return NextResponse.json(
      { error: "Too close to the start time to cancel here." },
      { status: 409 },
    );
  }

  // Refund before cancelling, so a refund failure doesn't leave someone
  // with no booking and no money back.
  if (paymentsEnabled && booking.stripePaymentId && booking.paidAt) {
    try {
      await stripe().refunds.create({
        payment_intent: booking.stripePaymentId,
        reason: "requested_by_customer",
      });
    } catch (err) {
      console.error("[cancel] refund failed:", err);
      return NextResponse.json(
        {
          error:
            "Couldn't process the refund automatically. Reply to your confirmation email and it'll be handled by hand.",
        },
        { status: 502 },
      );
    }
  }

  await db.booking.update({
    where: { id: booking.id },
    data: { status: BOOKING_STATUS.CANCELLED, holdExpiresAt: null },
  });

  return NextResponse.json({ ok: true });
}
