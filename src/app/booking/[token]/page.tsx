import Link from "next/link";
import { notFound } from "next/navigation";
import { Ambience } from "@/components/Ambience";
import { CancelBooking } from "@/components/CancelBooking";
import { db } from "@/lib/db";
import { brand } from "@/lib/brand";
import { BOOKING_STATUS } from "@/lib/constants";
import { formatInZone, zoneAbbreviation } from "@/lib/time";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manage your booking",
  robots: { index: false, follow: false },
};

/**
 * Self-serve management, reached by the unguessable token in their email.
 *
 * No login. Requiring an account to cancel a call is how you end up
 * fielding "can you move my Tuesday" messages on Instagram — exactly the
 * thing this whole product exists to stop.
 */
export default async function ManageBookingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const booking = await db.booking.findUnique({
    where: { accessToken: token },
    include: { sessionType: true },
  });

  if (!booking) notFound();

  const cancelled = booking.status === BOOKING_STATUS.CANCELLED;
  const past = booking.startsAt < new Date();
  // Matches the promise made in the FAQ and the confirmation email.
  const cutoff = new Date(booking.startsAt.getTime() - 12 * 3_600_000);
  const canChange = !cancelled && !past && new Date() < cutoff;

  return (
    <>
      <Ambience />

      <main className="relative z-10 flex min-h-[100svh] items-center justify-center px-5 py-16 sm:px-8">
        <div className="w-full max-w-lg">
          <span className="eyebrow">
            {cancelled ? "Cancelled" : past ? "Past" : "Your booking"}
          </span>
          <h1 className="display mt-4 text-[clamp(1.9rem,5.5vw,2.9rem)]">
            {cancelled
              ? "This one's cancelled."
              : past
                ? "This talk has happened."
                : booking.name.split(" ")[0] + ", you're booked."}
          </h1>

          <dl className="card mt-9 space-y-4 rounded-2xl p-6">
            <Row
              label="When"
              value={formatInZone(booking.startsAt, booking.timezone)}
              sub={zoneAbbreviation(booking.timezone, booking.startsAt)}
            />
            <Row
              label="Session"
              value={`${booking.sessionType.name} · ${booking.sessionType.durationMin} min`}
            />
            <Row label="Topic" value={booking.topic} />
            <Row label="Reference" value={booking.reference} />
          </dl>

          {!cancelled && !past && booking.meetingUrl && (
            <a
              href={booking.meetingUrl}
              className="mt-6 flex items-center justify-center rounded-full bg-gradient-to-r from-gold to-ember px-7 py-4 text-sm font-semibold text-ink transition-transform duration-300 hover:scale-[1.01]"
            >
              Join the call
            </a>
          )}

          {canChange ? (
            <div className="mt-8 border-t border-line pt-8">
              <CancelBooking token={token} />
              <p className="mt-4 text-center text-xs leading-relaxed text-bone-faint">
                Want a different time instead? Cancel here, then book again —
                you&rsquo;ll be refunded in full.
              </p>
            </div>
          ) : (
            !cancelled &&
            !past && (
              <p className="mt-8 border-t border-line pt-8 text-center text-xs leading-relaxed text-bone-faint">
                We&rsquo;re inside 12 hours of the start, so this can no longer
                be changed here. Reply to your confirmation email if something
                has genuinely gone wrong.
              </p>
            )
          )}

          <p className="mt-12 text-center">
            <Link
              href="/"
              className="text-xs text-bone-faint transition-colors hover:text-bone"
            >
              ← {brand.name}
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}

function Row({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <dt className="shrink-0 text-xs uppercase tracking-[0.14em] text-bone-faint">
        {label}
      </dt>
      <dd className="text-right text-sm">
        <span className="block text-bone">{value}</span>
        {sub && <span className="block text-xs text-bone-faint">{sub}</span>}
      </dd>
    </div>
  );
}
