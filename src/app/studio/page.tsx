import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { paymentsEnabled } from "@/lib/config";
import { BLOCKING_STATUSES, BOOKING_STATUS } from "@/lib/constants";
import { formatInZone, isoWeekKey } from "@/lib/time";
import { formatPrice } from "@/lib/types";
import { setBookingStatus } from "@/app/studio/actions";
import { brand } from "@/lib/brand";

export const dynamic = "force-dynamic";

export default async function StudioOverviewPage() {
  const user = await requireUser();
  const now = new Date();

  const [filmCount, followerCount, totalViews, upcoming, earnings, topSources] =
    await Promise.all([
      db.video.count({ where: { userId: user.id } }),
      db.follow.count({ where: { followingId: user.id } }),
      db.video
        .aggregate({ where: { userId: user.id }, _sum: { views: true } })
        .then((r) => r._sum.views ?? 0),
      user.canSell
        ? db.booking.findMany({
            where: {
              creatorId: user.id,
              startsAt: { gte: now },
              status: { in: BLOCKING_STATUSES },
            },
            include: { sessionType: true, sourceVideo: true },
            orderBy: { startsAt: "asc" },
            take: 20,
          })
        : Promise.resolve([]),
      user.canSell
        ? db.booking.findMany({
            where: {
              creatorId: user.id,
              status: {
                in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.COMPLETED],
              },
            },
            select: {
              amountCents: true,
              platformFeeCents: true,
              currency: true,
              startsAt: true,
            },
          })
        : Promise.resolve([]),
      db.booking.groupBy({
        by: ["sourceVideoId"],
        where: { creatorId: user.id, sourceVideoId: { not: null } },
        _count: { sourceVideoId: true },
        orderBy: { _count: { sourceVideoId: "desc" } },
        take: 5,
      }),
    ]);

  const currency = earnings[0]?.currency ?? "eur";
  // What actually reaches them — gross minus the platform's cut. Showing
  // gross here would be a lie by omission.
  const netAll = earnings.reduce(
    (sum, b) => sum + b.amountCents - b.platformFeeCents,
    0,
  );
  const weekKey = isoWeekKey(now);
  const netWeek = earnings
    .filter((b) => isoWeekKey(b.startsAt) === weekKey)
    .reduce((sum, b) => sum + b.amountCents - b.platformFeeCents, 0);

  const videoTitles = new Map(
    (
      await db.video.findMany({
        where: { id: { in: topSources.map((s) => s.sourceVideoId!) } },
        select: { id: true, title: true },
      })
    ).map((v) => [v.id, v.title]),
  );

  return (
    <>
      <div className="mb-9">
        <h1 className="display text-3xl">
          Evening, {user.displayName.split(" ")[0]}.
        </h1>
        <p className="mt-2 text-sm text-bone-dim">
          Your universe lives at{" "}
          <Link
            href={`/@${user.handle}`}
            className="text-bone underline underline-offset-4 hover:text-ember"
          >
            {brand.domain}/@{user.handle}
          </Link>
        </p>
      </div>

      {!user.approved && (
        <div className="mb-8 rounded-2xl border border-ember/35 bg-ember/[0.07] px-5 py-4">
          <p className="text-sm text-bone">Your account is pending review.</p>
          <p className="mt-1.5 text-sm text-bone-dim">
            Upload as much as you like — you&rsquo;re the only one who can see
            it. Films go public once an admin approves your account.
          </p>
        </div>
      )}

      {!user.canSell && (
        <div className="mb-8 rounded-2xl border border-line-bright bg-bone/[0.03] px-5 py-4">
          <p className="text-sm text-bone">
            Bookings aren&rsquo;t switched on for your account yet.
          </p>
          <p className="mt-1.5 text-sm text-bone-dim">
            Publishing is open to everyone. Taking paid calls is granted
            account by account while the platform is young — put some films up
            first.
          </p>
        </div>
      )}

      {user.canSell && !paymentsEnabled && (
        <p className="mb-8 rounded-2xl border border-ember/35 bg-ember/[0.07] px-5 py-4 text-sm text-bone-dim">
          <span className="font-medium text-ember">Free mode.</span> Stripe
          isn&rsquo;t configured, so bookings confirm without payment.
        </p>
      )}

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Films" value={String(filmCount)} />
        <Stat label="Followers" value={String(followerCount)} />
        {user.canSell ? (
          <>
            <Stat label="Yours this week" value={formatPrice(netWeek, currency)} />
            <Stat label="Yours all time" value={formatPrice(netAll, currency)} />
          </>
        ) : (
          <>
            <Stat label="Views" value={String(totalViews)} />
            <Stat label="Upcoming" value="—" />
          </>
        )}
      </div>

      {user.canSell && (
        <>
          <h2 className="display mb-5 text-2xl">Next up</h2>

          {upcoming.length === 0 ? (
            <p className="card rounded-2xl p-8 text-center text-sm text-bone-dim">
              Nothing booked yet.
            </p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((booking) => (
                <article key={booking.id} className="card rounded-2xl p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-base font-medium">{booking.name}</h3>
                        <StatusChip status={booking.status} />
                        <span className="font-mono text-[11px] text-bone-faint">
                          {booking.reference}
                        </span>
                      </div>

                      <p className="mt-1.5 text-sm text-bone-dim">
                        {formatInZone(booking.startsAt, user.timezone, {
                          dateStyle: "full",
                          timeStyle: "short",
                        })}
                        <span className="text-bone-faint">
                          {" "}
                          · {booking.sessionType.durationMin} min
                        </span>
                      </p>

                      <p className="mt-0.5 text-xs text-bone-faint">
                        Their time:{" "}
                        {formatInZone(booking.startsAt, booking.timezone, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}{" "}
                        ({booking.timezone})
                      </p>

                      <a
                        href={`mailto:${booking.email}`}
                        className="mt-1 inline-block text-xs text-bone-dim underline underline-offset-4 hover:text-bone"
                      >
                        {booking.email}
                      </a>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {booking.meetingUrl && (
                        <a
                          href={booking.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full bg-bone px-4 py-2 text-xs font-semibold text-ink transition-transform hover:scale-[1.03]"
                        >
                          Join
                        </a>
                      )}
                      <form action={setBookingStatus}>
                        <input type="hidden" name="id" value={booking.id} />
                        <input
                          type="hidden"
                          name="status"
                          value={BOOKING_STATUS.CANCELLED}
                        />
                        <button className="rounded-full border border-line px-4 py-2 text-xs text-bone-dim transition-colors hover:border-ember/50 hover:text-ember">
                          Cancel
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-ember/25 bg-ember/[0.06] p-4">
                    <span className="eyebrow">Wants to talk about</span>
                    <p className="mt-2 text-sm leading-relaxed text-bone">
                      {booking.topic}
                    </p>
                    {booking.context && (
                      <p className="mt-3 border-t border-ember/15 pt-3 text-sm leading-relaxed text-bone-dim">
                        {booking.context}
                      </p>
                    )}
                    {booking.sourceVideo && (
                      <p className="mt-3 text-xs text-bone-faint">
                        Came from: {booking.sourceVideo.title}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {topSources.length > 0 && (
        <>
          <h2 className="display mb-5 mt-14 text-2xl">What converts</h2>
          <div className="card space-y-3 rounded-2xl p-6">
            {topSources.map((source) => (
              <div
                key={source.sourceVideoId}
                className="flex items-center justify-between gap-4 text-sm"
              >
                <span className="min-w-0 truncate text-bone-dim">
                  {videoTitles.get(source.sourceVideoId!) ?? "Unknown"}
                </span>
                <span className="shrink-0 font-medium">
                  {source._count.sourceVideoId}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card rounded-2xl p-5">
      <span className="eyebrow">{label}</span>
      <p className="display mt-2 text-3xl">{value}</p>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const tone =
    status === BOOKING_STATUS.CONFIRMED
      ? "border-ember/40 bg-ember/10 text-ember"
      : status === BOOKING_STATUS.PENDING
        ? "border-line-bright bg-bone/5 text-bone-dim"
        : "border-line bg-bone/[0.02] text-bone-faint";

  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${tone}`}
    >
      {status.toLowerCase().replace("_", " ")}
    </span>
  );
}
