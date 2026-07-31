import Link from "next/link";
import { notFound } from "next/navigation";
import { Ambience } from "@/components/Ambience";
import { db } from "@/lib/db";
import { brand } from "@/lib/brand";
import { BOOKING_STATUS } from "@/lib/constants";
import { formatInZone, zoneAbbreviation } from "@/lib/time";
import { PendingWatcher } from "@/components/PendingWatcher";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "You're booked",
  robots: { index: false },
};

export default async function BookedPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;

  const booking = await db.booking.findUnique({
    where: { reference: reference.toUpperCase() },
    include: { sessionType: true },
  });

  if (!booking) notFound();

  // Stripe redirects here the instant payment succeeds, which can beat the
  // webhook by a second or two. Rather than showing a scary "pending", we
  // show a settling state that refreshes itself.
  const settled = booking.status === BOOKING_STATUS.CONFIRMED;
  const cancelled = booking.status === BOOKING_STATUS.CANCELLED;

  return (
    <>
      <Ambience />

      <main className="relative z-10 flex min-h-[100svh] items-center justify-center px-5 py-16 sm:px-8">
        <div className="w-full max-w-lg">
          {cancelled ? (
            <>
              <span className="eyebrow">Cancelled</span>
              <h1 className="display mt-4 text-[clamp(2rem,6vw,3.25rem)]">
                This booking was cancelled.
              </h1>
              <p className="mt-5 text-sm leading-relaxed text-bone-dim">
                Nothing is charged and the time is back on the calendar.
              </p>
              <Link
                href="/book"
                className="mt-8 inline-flex rounded-full bg-bone px-7 py-4 text-sm font-semibold text-ink"
              >
                Book another time
              </Link>
            </>
          ) : (
            <>
              {!settled && <PendingWatcher />}

              <div
                className="mb-8 flex h-14 w-14 items-center justify-center rounded-full border border-ember/40 bg-ember/10"
                style={
                  settled
                    ? { animation: "fade-up 0.6s var(--ease-out-expo) both" }
                    : undefined
                }
              >
                {settled ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12.5l4.5 4.5L19 7"
                      stroke="var(--color-ember)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span className="h-2.5 w-2.5 rounded-full bg-ember" style={{ animation: "pulse-ring 1.6s ease-out infinite" }} />
                )}
              </div>

              <span className="eyebrow">
                {settled ? "Confirmed" : "Confirming payment"}
              </span>
              <h1 className="display mt-4 text-[clamp(2rem,6vw,3.25rem)]">
                {settled ? "You're booked." : "One moment…"}
              </h1>

              <p className="mt-5 text-sm leading-relaxed text-bone-dim">
                {settled ? (
                  <>
                    A confirmation is on its way to{" "}
                    <span className="text-bone">{booking.email}</span> with a
                    calendar invite and the link to join.
                  </>
                ) : (
                  "Your payment went through. This page will update by itself the moment it's confirmed."
                )}
              </p>

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
                <Row label="Reference" value={booking.reference} />
              </dl>

              {settled && booking.meetingUrl && (
                <a
                  href={booking.meetingUrl}
                  className="mt-6 flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-gold to-ember px-7 py-4 text-sm font-semibold text-ink transition-transform duration-300 hover:scale-[1.01]"
                >
                  Join the call
                </a>
              )}

              {settled && (
                <p className="mt-5 text-center text-xs text-bone-faint">
                  Need to move it?{" "}
                  <Link
                    href={`/booking/${booking.accessToken}`}
                    className="text-bone-dim underline underline-offset-4 hover:text-bone"
                  >
                    Manage this booking
                  </Link>
                </p>
              )}
            </>
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
      <dt className="text-xs uppercase tracking-[0.14em] text-bone-faint">
        {label}
      </dt>
      <dd className="text-right text-sm">
        <span className="block text-bone">{value}</span>
        {sub && <span className="block text-xs text-bone-faint">{sub}</span>}
      </dd>
    </div>
  );
}
