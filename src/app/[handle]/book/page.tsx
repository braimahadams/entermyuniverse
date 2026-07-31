import Link from "next/link";
import { notFound } from "next/navigation";
import { Ambience } from "@/components/Ambience";
import { Avatar, VerifiedTick } from "@/components/Avatar";
import { BookingFlow } from "@/components/BookingFlow";
import { db } from "@/lib/db";
import { brand } from "@/lib/brand";
import { paymentsEnabled } from "@/lib/config";
import { getCreatorByHandle } from "@/lib/creators";
import type { OfferView } from "@/lib/types";

export const dynamic = "force-dynamic";

function parseHandle(raw: string): string | null {
  const decoded = decodeURIComponent(raw);
  if (!decoded.startsWith("@")) return null;
  const handle = decoded.slice(1).toLowerCase();
  return /^[a-z0-9_]{3,24}$/.test(handle) ? handle : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const handle = parseHandle((await params).handle);
  const creator = handle ? await getCreatorByHandle(handle) : null;

  return {
    title: creator ? `Book ${creator.displayName}` : "Book",
    description: brand.tagline,
  };
}

export default async function CreatorBookPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{
    offer?: string;
    from?: string;
    q?: string;
    cancelled?: string;
  }>;
}) {
  const handle = parseHandle((await params).handle);
  if (!handle) notFound();

  const [creator, search] = await Promise.all([
    getCreatorByHandle(handle),
    searchParams,
  ]);

  if (!creator) notFound();

  // Selling is gated per account. Someone linking straight to this URL for
  // a creator who doesn't sell gets sent back to their universe, not an error.
  if (!creator.canSell) {
    return (
      <>
        <Ambience />
        <main className="relative z-10 flex min-h-[100svh] items-center justify-center px-5">
          <div className="max-w-md text-center">
            <h1 className="display text-3xl">
              {creator.displayName} isn&rsquo;t taking bookings.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-bone-dim">
              Not everyone here opens that door. You can still watch
              everything they&rsquo;ve made.
            </p>
            <Link
              href={`/@${creator.handle}`}
              className="mt-8 inline-flex rounded-full bg-bone px-7 py-4 text-sm font-semibold text-ink transition-transform hover:scale-[1.02]"
            >
              Back to their universe
            </Link>
          </div>
        </main>
      </>
    );
  }

  const sessionTypes = await db.sessionType.findMany({
    where: { userId: creator.id, active: true },
    orderBy: { position: "asc" },
  });
  if (sessionTypes.length === 0) notFound();

  const offers: OfferView[] = sessionTypes.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    tagline: s.tagline,
    description: s.description,
    includes: s.includes?.split("\n").filter(Boolean) ?? [],
    durationMin: s.durationMin,
    priceCents: s.priceCents,
    currency: s.currency,
    creatorHandle: creator.handle,
    creatorName: creator.displayName,
  }));

  return (
    <>
      <Ambience />

      <header className="relative z-20 px-5 py-6 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link
            href={`/@${creator.handle}`}
            className="group flex items-center gap-2 text-sm text-bone-dim transition-colors hover:text-bone"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden
              className="transition-transform duration-300 group-hover:-translate-x-1"
            >
              <path
                d="M13 7H1M7 1L1 7l6 6"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back
          </Link>

          <span className="flex items-center gap-2.5">
            <Avatar
              src={creator.avatarUrl}
              name={creator.displayName}
              size={28}
            />
            <span className="text-sm">{creator.displayName}</span>
            {creator.verified && <VerifiedTick />}
          </span>
        </div>
      </header>

      <main className="relative z-10 px-5 pb-24 pt-4 sm:px-8">
        <div className="mx-auto max-w-5xl">
          {search.cancelled && (
            <p className="mb-8 rounded-2xl border border-line-bright bg-bone/[0.03] px-5 py-4 text-sm text-bone-dim">
              Payment was cancelled — nothing was charged and the time was
              released. Pick a slot again whenever you&rsquo;re ready.
            </p>
          )}

          <BookingFlow
            offers={offers}
            initialOffer={search.offer}
            fromVideo={search.from}
            prefilledTopic={search.q}
            paymentsEnabled={paymentsEnabled}
          />
        </div>
      </main>
    </>
  );
}
