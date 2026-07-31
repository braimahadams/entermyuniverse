import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { saveProfile } from "@/app/studio/actions";
import { Avatar } from "@/components/Avatar";
import { brand } from "@/lib/brand";

export const dynamic = "force-dynamic";

export default async function StudioProfilePage() {
  const current = await requireUser();
  const user = await db.user.findUniqueOrThrow({ where: { id: current.id } });

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="display text-3xl">Profile</h1>
        <p className="mt-2 text-sm text-bone-dim">
          This is what someone sees when they walk into your universe.
        </p>
      </div>

      <div className="card mb-6 flex items-center gap-4 rounded-2xl p-5">
        <Avatar src={user.avatarUrl} name={user.displayName} size={56} />
        <div className="min-w-0">
          <p className="font-medium">{user.displayName}</p>
          <p className="truncate text-sm text-bone-faint">
            {brand.domain}/@{user.handle}
          </p>
        </div>
      </div>

      <form action={saveProfile} className="card space-y-5 rounded-2xl p-6">
        <Field label="Display name">
          <input
            name="displayName"
            required
            maxLength={60}
            defaultValue={user.displayName}
            className={input}
          />
        </Field>

        <Field
          label="Tagline"
          hint="One line. It's the first thing anyone reads, and it's what shows on your card in the feed."
        >
          <input
            name="tagline"
            maxLength={200}
            defaultValue={user.tagline ?? ""}
            placeholder="What you make, in a sentence."
            className={input}
          />
        </Field>

        <Field label="Bio">
          <textarea
            name="bio"
            rows={4}
            maxLength={2000}
            defaultValue={user.bio ?? ""}
            className={`${input} resize-none`}
          />
        </Field>

        <Field
          label="Avatar URL"
          hint="Leave it empty and you get a generated one from your name."
        >
          <input
            name="avatarUrl"
            defaultValue={user.avatarUrl ?? ""}
            placeholder="https://…"
            className={input}
          />
        </Field>

        <Field label="Links" hint="One per line, up to five.">
          <textarea
            name="links"
            rows={3}
            defaultValue={user.links ?? ""}
            placeholder={"https://instagram.com/you\nhttps://yoursite.com"}
            className={`${input} resize-none`}
          />
        </Field>

        <Field
          label="Timezone"
          hint="Your booking hours are set in this zone. Visitors always see their own."
        >
          <input
            name="timezone"
            defaultValue={user.timezone}
            placeholder="Europe/London"
            className={input}
          />
        </Field>

        <button className="rounded-full bg-bone px-6 py-3 text-sm font-semibold text-ink transition-transform hover:scale-[1.02]">
          Save profile
        </button>
      </form>

      <div className="card mt-6 rounded-2xl p-6">
        <h2 className="font-medium">Account</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <Row label="Handle" value={`@${user.handle}`} />
          <Row label="Email" value={user.email} />
          <Row
            label="Bookings"
            value={user.canSell ? "Enabled" : "Not enabled yet"}
          />
          {user.canSell && (
            <Row
              label="Platform fee"
              value={`${(user.platformFeeBps / 100).toFixed(1)}% per booking`}
            />
          )}
        </dl>
        <p className="mt-4 text-xs leading-relaxed text-bone-faint">
          Handles are permanent for now — they&rsquo;re the address people
          share, and letting them move would break every link ever posted.
        </p>
      </div>
    </div>
  );
}

const input =
  "w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-bone placeholder:text-bone-faint focus:border-ember focus:outline-none";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-bone-faint">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1.5 block text-xs leading-relaxed text-bone-faint">
          {hint}
        </span>
      )}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-bone-faint">{label}</dt>
      <dd className="text-bone">{value}</dd>
    </div>
  );
}
