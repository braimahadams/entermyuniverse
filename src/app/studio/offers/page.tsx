import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { saveOffer, deleteOffer } from "@/app/studio/actions";
import { formatPrice } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * What a creator sells.
 *
 * Offers start inactive when selling is first granted, because an offer
 * with no hours behind it is a button that leads to an empty calendar.
 * This page is where they set a real price and switch it on.
 */
export default async function StudioOffersPage() {
  const user = await requireUser();
  if (!user.canSell) redirect("/studio");

  const [offers, hoursCount] = await Promise.all([
    db.sessionType.findMany({
      where: { userId: user.id },
      orderBy: { position: "asc" },
    }),
    db.availabilityRule.count({ where: { userId: user.id, active: true } }),
  ]);

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="display text-3xl">What you sell</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bone-dim">
          Your platform fee is{" "}
          <span className="text-bone">
            {(user.platformFeeBps / 100).toFixed(1)}%
          </span>{" "}
          — the rest is yours.
        </p>
      </div>

      {hoursCount === 0 && (
        <div className="mb-6 rounded-2xl border border-ember/35 bg-ember/[0.07] px-5 py-4">
          <p className="text-sm text-bone">You haven&rsquo;t set any hours.</p>
          <p className="mt-1.5 text-sm text-bone-dim">
            An active offer with no hours behind it is a button that opens an
            empty calendar.{" "}
            <Link
              href="/studio/hours"
              className="text-ember underline underline-offset-4"
            >
              Set your hours first
            </Link>
            .
          </p>
        </div>
      )}

      <div className="space-y-4">
        {offers.map((offer) => (
          <details key={offer.id} className="card rounded-2xl p-6" open={!offer.active}>
            <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3">
              <span className="flex items-center gap-2.5">
                <span className="font-medium">{offer.name}</span>
                {offer.active ? (
                  <span className="rounded-full border border-ember/40 bg-ember/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-ember">
                    Live
                  </span>
                ) : (
                  <span className="rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-wider text-bone-faint">
                    Draft
                  </span>
                )}
              </span>
              <span className="text-sm text-bone-dim">
                {formatPrice(offer.priceCents, offer.currency)} ·{" "}
                {offer.durationMin} min
              </span>
            </summary>

            <OfferForm offer={offer} canActivate={hoursCount > 0} />
          </details>
        ))}

        <details className="card rounded-2xl p-6">
          <summary className="cursor-pointer text-sm font-medium">
            + Add another
          </summary>
          <OfferForm canActivate={hoursCount > 0} />
        </details>
      </div>
    </div>
  );
}

type Offer = Awaited<ReturnType<typeof db.sessionType.findMany>>[number];

function OfferForm({
  offer,
  canActivate,
}: {
  offer?: Offer;
  canActivate: boolean;
}) {
  return (
    <form
      action={saveOffer}
      className="mt-6 space-y-4 border-t border-line pt-6"
    >
      {offer && <input type="hidden" name="id" value={offer.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <input
            name="name"
            required
            defaultValue={offer?.name}
            placeholder="One Talk"
            className={input}
          />
        </Field>
        <Field label="Tagline">
          <input
            name="tagline"
            defaultValue={offer?.tagline}
            placeholder="45 minutes. One problem."
            className={input}
          />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          name="description"
          rows={2}
          defaultValue={offer?.description ?? ""}
          className={`${input} resize-none`}
        />
      </Field>

      <Field label="What's included" hint="One per line.">
        <textarea
          name="includes"
          rows={4}
          defaultValue={offer?.includes ?? ""}
          placeholder={"45 minutes, one to one, on video\nA written recap within 24 hours"}
          className={`${input} resize-none`}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Price" hint="In whole units, e.g. 120 = $120.">
          <input
            name="price"
            type="number"
            min="0"
            step="1"
            required
            defaultValue={offer ? offer.priceCents / 100 : 120}
            className={input}
          />
        </Field>
        <Field label="Currency">
          <input
            name="currency"
            defaultValue={offer?.currency ?? "eur"}
            maxLength={3}
            className={input}
          />
        </Field>
        <Field label="Minutes">
          <input
            name="durationMin"
            type="number"
            min="10"
            step="5"
            required
            defaultValue={offer?.durationMin ?? 45}
            className={input}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Buffer" hint="Mins after">
          <input
            name="bufferMin"
            type="number"
            min="0"
            defaultValue={offer?.bufferMin ?? 15}
            className={input}
          />
        </Field>
        <Field label="Notice" hint="Hours ahead">
          <input
            name="noticeHours"
            type="number"
            min="0"
            defaultValue={offer?.noticeHours ?? 12}
            className={input}
          />
        </Field>
        <Field label="Horizon" hint="Days out">
          <input
            name="horizonDays"
            type="number"
            min="1"
            defaultValue={offer?.horizonDays ?? 21}
            className={input}
          />
        </Field>
        <Field label="Max / week" hint="Your cap">
          <input
            name="maxPerWeek"
            type="number"
            min="1"
            defaultValue={offer?.maxPerWeek ?? 6}
            className={input}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2.5 text-sm text-bone-dim">
        <input
          type="checkbox"
          name="active"
          defaultChecked={offer?.active ?? false}
          disabled={!canActivate}
          className="h-4 w-4 accent-[var(--color-ember)]"
        />
        Live on my universe
        {!canActivate && (
          <span className="text-xs text-bone-faint">— set hours first</span>
        )}
      </label>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button className="rounded-full bg-bone px-6 py-3 text-sm font-semibold text-ink transition-transform hover:scale-[1.02]">
          {offer ? "Save" : "Add offer"}
        </button>
        {offer && (
          <button
            formAction={deleteOffer}
            className="text-xs text-bone-faint transition-colors hover:text-ember"
          >
            Delete
          </button>
        )}
      </div>
    </form>
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
