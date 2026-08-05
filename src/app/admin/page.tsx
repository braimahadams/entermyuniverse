import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Avatar, VerifiedTick } from "@/components/Avatar";
import { moderateFilm, setCanSell, setUserFlag } from "@/app/admin/actions";
import { BOOKING_STATUS } from "@/lib/constants";
import { formatPrice } from "@/lib/types";
import { logout } from "@/app/(auth)/actions";
import { brand } from "@/lib/brand";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Platform admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const viewer = await getCurrentUser();
  if (!viewer) redirect("/login");
  // Not notFound(): a non-admin who lands here has an account, they just
  // don't own the platform. Send them somewhere useful.
  if (!viewer.isAdmin) redirect("/studio");

  const [users, pendingUsers, recentPosts, bookings, waitlistCount] =
    await Promise.all([
      db.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          _count: { select: { posts: true, followers: true } },
        },
      }),
      // Surfaced separately: these are the accounts actually waiting on
      // you, and they'd otherwise be buried in the full list below.
      db.user.findMany({
        where: { approved: false },
        orderBy: { createdAt: "asc" },
        include: {
          _count: { select: { posts: true, followers: true } },
        },
      }),
    db.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { handle: true, displayName: true } } },
    }),
    db.booking.findMany({
      where: {
        status: { in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.COMPLETED] },
      },
      select: { platformFeeCents: true, amountCents: true, currency: true },
    }),
    db.waitlist.count(),
  ]);

  const currency = bookings[0]?.currency ?? "eur";
  const gross = bookings.reduce((s, b) => s + b.amountCents, 0);
  const platformRevenue = bookings.reduce((s, b) => s + b.platformFeeCents, 0);

  return (
    <div className="min-h-[100svh] bg-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-5">
            <Link href="/" className="display text-lg">
              {brand.short}
            </Link>
            <span className="rounded-full border border-ember/40 bg-ember/10 px-3 py-1 text-[10px] uppercase tracking-wider text-ember">
              Platform admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/studio"
              className="text-xs text-bone-faint transition-colors hover:text-bone"
            >
              Your studio
            </Link>
            <form action={logout}>
              <button className="rounded-full border border-line px-3.5 py-1.5 text-xs text-bone-dim transition-colors hover:text-bone">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Accounts" value={String(users.length)} />
          <Stat label="Pending" value={String(pendingUsers.length)} />
          <Stat label="Gross booked" value={formatPrice(gross, currency)} />
          <Stat
            label="Platform revenue"
            value={formatPrice(platformRevenue, currency)}
          />
        </div>

        {pendingUsers.length > 0 && (
          <>
            <h2 className="display mb-5 text-2xl">Waiting on you</h2>
            <div className="card mb-14 divide-y divide-line rounded-2xl">
              {pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-wrap items-center justify-between gap-4 p-4"
                >
                  <Link
                    href={`/@${user.handle}`}
                    className="flex min-w-0 items-center gap-3"
                  >
                    <Avatar
                      src={user.avatarUrl}
                      name={user.displayName}
                      size={36}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm">
                        {user.displayName}
                      </span>
                      <span className="block truncate text-xs text-bone-faint">
                        @{user.handle} · {user._count.posts} films
                      </span>
                    </span>
                  </Link>

                  <div className="flex items-center gap-2">
                    <FlagToggle
                      id={user.id}
                      field="suspended"
                      value={!user.suspended}
                      active={user.suspended}
                      label="Suspend"
                      danger
                    />
                    <FlagToggle
                      id={user.id}
                      field="approved"
                      value={true}
                      active={false}
                      label="Approve"
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <h2 className="display mb-5 text-2xl">Accounts</h2>
        <div className="card divide-y divide-line rounded-2xl">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-4 p-4"
            >
              <Link
                href={`/@${user.handle}`}
                className="flex min-w-0 items-center gap-3"
              >
                <Avatar
                  src={user.avatarUrl}
                  name={user.displayName}
                  size={36}
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 truncate text-sm">
                    {user.displayName}
                    {user.verified && <VerifiedTick size={12} />}
                    {user.isAdmin && (
                      <span className="text-[10px] uppercase tracking-wider text-ember">
                        admin
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-xs text-bone-faint">
                    @{user.handle} · {user._count.posts} films ·{" "}
                    {user._count.followers} followers
                  </span>
                </span>
              </Link>

              <div className="flex flex-wrap items-center gap-2">
                <FlagToggle
                  id={user.id}
                  field="approved"
                  value={!user.approved}
                  active={user.approved}
                  label={user.approved ? "Approved" : "Approve"}
                />
                <Toggle
                  action={setCanSell}
                  id={user.id}
                  name="canSell"
                  value={!user.canSell}
                  active={user.canSell}
                  label={user.canSell ? "Selling on" : "Allow selling"}
                />
                <FlagToggle
                  id={user.id}
                  field="verified"
                  value={!user.verified}
                  active={user.verified}
                  label="Verified"
                />
                <FlagToggle
                  id={user.id}
                  field="featured"
                  value={!user.featured}
                  active={user.featured}
                  label="Featured"
                />
                <FlagToggle
                  id={user.id}
                  field="suspended"
                  value={!user.suspended}
                  active={user.suspended}
                  label={user.suspended ? "Suspended" : "Suspend"}
                  danger
                />
              </div>
            </div>
          ))}
        </div>

        <h2 className="display mb-5 mt-14 text-2xl">Recent uploads</h2>
        <div className="card divide-y divide-line rounded-2xl">
          {recentPosts.length === 0 ? (
            <p className="p-6 text-center text-sm text-bone-dim">
              Nothing uploaded yet.
            </p>
          ) : (
            recentPosts.map((film) => (
              <div
                key={film.id}
                className="flex flex-wrap items-center justify-between gap-4 p-4"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm">{film.title}</span>
                  <span className="block truncate text-xs text-bone-faint">
                    @{film.user.handle}
                    {!film.approved && (
                      <span className="ml-2 text-ember">hidden</span>
                    )}
                  </span>
                </span>

                <form
                  action={moderateFilm}
                  className="flex items-center gap-2"
                >
                  <input type="hidden" name="id" value={film.id} />
                  <input
                    type="hidden"
                    name="approved"
                    value={String(!film.approved)}
                  />
                  {film.approved && (
                    <input
                      name="note"
                      placeholder="Reason (shown to them)"
                      className="w-52 rounded-full border border-line bg-ink/60 px-3.5 py-1.5 text-xs text-bone placeholder:text-bone-faint focus:border-ember focus:outline-none"
                    />
                  )}
                  <button
                    className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
                      film.approved
                        ? "border-line text-bone-dim hover:border-ember/50 hover:text-ember"
                        : "border-ember/50 bg-ember/10 text-ember"
                    }`}
                  >
                    {film.approved ? "Hide" : "Restore"}
                  </button>
                </form>
              </div>
            ))
          )}
        </div>

        <p className="mt-10 text-sm text-bone-faint">
          {waitlistCount} on the waitlist.
        </p>
      </main>
    </div>
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

function Toggle({
  action,
  id,
  name,
  value,
  active,
  label,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  name: string;
  value: boolean;
  active: boolean;
  label: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name={name} value={String(value)} />
      <button
        className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
          active
            ? "border-ember/50 bg-ember/10 text-ember"
            : "border-line text-bone-dim hover:border-line-bright hover:text-bone"
        }`}
      >
        {label}
      </button>
    </form>
  );
}

function FlagToggle({
  id,
  field,
  value,
  active,
  label,
  danger,
}: {
  id: string;
  field: string;
  value: boolean;
  active: boolean;
  label: string;
  danger?: boolean;
}) {
  return (
    <form action={setUserFlag}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="field" value={field} />
      <input type="hidden" name="value" value={String(value)} />
      <button
        className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
          active
            ? danger
              ? "border-red-500/50 bg-red-500/10 text-red-400"
              : "border-ember/50 bg-ember/10 text-ember"
            : "border-line text-bone-dim hover:border-line-bright hover:text-bone"
        }`}
      >
        {label}
      </button>
    </form>
  );
}
