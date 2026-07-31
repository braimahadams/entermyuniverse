import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Ambience } from "@/components/Ambience";
import { Avatar, VerifiedTick } from "@/components/Avatar";
import { FilmWall } from "@/components/FilmWall";
import { FollowButton } from "@/components/FollowButton";
import { Nav } from "@/components/Nav";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Footer } from "@/components/sections";
import { getCurrentUser } from "@/lib/auth";
import { getCreatorByHandle, getCreatorFilms } from "@/lib/creators";
import { db } from "@/lib/db";
import { brand } from "@/lib/brand";
import { spotsLeftThisWeek } from "@/lib/scheduling";
import { formatPrice, possessiveFirstName } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Someone's universe.
 *
 * Lives at /@handle. The `@` is part of the URL segment rather than a
 * folder name — `@folder` is Next's parallel-route convention and would
 * never match a request. So this route validates the prefix itself and
 * 404s anything else, which also stops it swallowing every unknown path
 * on the site.
 */

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
}): Promise<Metadata> {
  const handle = parseHandle((await params).handle);
  if (!handle) return { title: "Not found" };

  const creator = await getCreatorByHandle(handle);
  if (!creator) return { title: "Not found" };

  const title = `${possessiveFirstName(creator.displayName)} Universe (@${creator.handle})`;
  const description =
    creator.tagline ??
    creator.bio ??
    `${creator.filmCount} films on ${brand.name}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      url: `${brand.domain}/@${creator.handle}`,
    },
  };
}

export default async function UniversePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const handle = parseHandle((await params).handle);
  if (!handle) notFound();

  const [viewer, creator] = await Promise.all([
    getCurrentUser(),
    getCreatorByHandle(handle),
  ]);
  if (!creator) notFound();

  const isOwner = viewer?.id === creator.id;

  const [films, offers, following] = await Promise.all([
    // A stranger sees films only once the account is approved; the owner
    // always sees their own, so they can check their work while waiting.
    getCreatorFilms(creator.id, isOwner || creator.approved),
    creator.canSell
      ? db.sessionType.findMany({
          where: { userId: creator.id, active: true },
          orderBy: { position: "asc" },
        })
      : Promise.resolve([]),
    viewer
      ? db.follow
          .findUnique({
            where: {
              followerId_followingId: {
                followerId: viewer.id,
                followingId: creator.id,
              },
            },
          })
          .then(Boolean)
      : Promise.resolve(false),
  ]);

  const spotsLeft = offers[0]
    ? await spotsLeftThisWeek(creator.id, offers[0].maxPerWeek)
    : 0;

  return (
    <>
      <Ambience />
      <ScrollReveal />
      <Nav user={viewer} />

      <main className="relative z-10">
        {/* ── the header ── */}
        <header className="px-5 pb-14 pt-28 sm:px-8 sm:pt-36">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-5">
                <Avatar
                  src={creator.avatarUrl}
                  name={creator.displayName}
                  size={84}
                  className="ring-1 ring-line-bright"
                />
                <div className="min-w-0">
                  <h1 className="display flex items-center gap-2.5 text-[clamp(1.8rem,5vw,2.75rem)] leading-none">
                    {creator.displayName}
                    {creator.verified && <VerifiedTick size={18} />}
                  </h1>
                  <p className="mt-2.5 text-sm text-ember/85">
                    {possessiveFirstName(creator.displayName)} Universe
                  </p>
                  <p className="mt-1 text-sm text-bone-faint">
                    @{creator.handle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isOwner ? (
                  <Link
                    href="/studio"
                    className="rounded-full border border-line-bright px-5 py-2.5 text-sm transition-colors hover:bg-bone/5"
                  >
                    Edit your universe
                  </Link>
                ) : (
                  <FollowButton
                    handle={creator.handle}
                    initialFollowing={following}
                    signedIn={Boolean(viewer)}
                  />
                )}
              </div>
            </div>

            {creator.tagline && (
              <p className="mt-8 max-w-2xl text-lg leading-relaxed text-bone-dim">
                {creator.tagline}
              </p>
            )}
            {creator.bio && (
              <p className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-bone-dim">
                {creator.bio}
              </p>
            )}

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-bone-faint">
              <span>
                <span className="text-bone">{creator.filmCount}</span>{" "}
                {creator.filmCount === 1 ? "film" : "films"}
              </span>
              <span>
                <span className="text-bone">{creator.followerCount}</span>{" "}
                {creator.followerCount === 1 ? "follower" : "followers"}
              </span>
              {creator.links.map((link) => (
                <a
                  key={link}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="underline underline-offset-4 transition-colors hover:text-bone"
                >
                  {link.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                </a>
              ))}
            </div>
          </div>
        </header>

        {isOwner && !creator.approved && (
          <div className="px-5 pb-10 sm:px-8">
            <div className="mx-auto max-w-5xl rounded-2xl border border-ember/35 bg-ember/[0.07] px-5 py-4">
              <p className="text-sm text-bone">
                Only you can see this page like this.
              </p>
              <p className="mt-1.5 text-sm text-bone-dim">
                Your films are private until an admin approves your account —
                everyone else sees an empty page for now.
              </p>
            </div>
          </div>
        )}

        {/* ── the door ── */}
        {creator.canSell && offers.length > 0 && (
          <section className="px-5 pb-6 sm:px-8">
            <div className="mx-auto max-w-5xl">
              <div className="card card-sheen rounded-3xl p-7 sm:p-10">
                <div className="flex flex-wrap items-start justify-between gap-6">
                  <div className="max-w-lg">
                    <span className="eyebrow">The door</span>
                    <h2 className="display mt-3 text-[clamp(1.6rem,3.5vw,2.25rem)] leading-tight">
                      Talk to {creator.displayName.split(" ")[0]}, one to one.
                    </h2>
                    <p className="mt-4 text-sm leading-relaxed text-bone-dim">
                      {offers[0].tagline}
                    </p>
                    <p className="mt-4 text-xs text-bone-faint">
                      {spotsLeft > 0
                        ? `${spotsLeft} ${spotsLeft === 1 ? "slot" : "slots"} open this week.`
                        : "Fully booked this week — the calendar opens into next."}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-4 sm:items-end">
                    <div className="flex items-baseline gap-2">
                      <span className="display text-4xl">
                        {formatPrice(offers[0].priceCents, offers[0].currency)}
                      </span>
                      <span className="text-sm text-bone-faint">
                        / {offers[0].durationMin} min
                      </span>
                    </div>
                    <Link
                      href={`/@${creator.handle}/book`}
                      className="rounded-full bg-gradient-to-r from-gold to-ember px-7 py-4 text-sm font-semibold text-ink transition-transform hover:scale-[1.02]"
                    >
                      Book a talk
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── the films ── */}
        <section className="px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-5xl">
            {films.length === 0 ? (
              <div className="card rounded-3xl p-10 text-center sm:p-16">
                <h3 className="display text-2xl">
                  {isOwner ? "Your universe is empty." : "Nothing here yet."}
                </h3>
                <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-bone-dim">
                  {isOwner
                    ? "Upload your first film and this page starts to look like somewhere worth being."
                    : `${creator.displayName} hasn't published anything yet.`}
                </p>
                {isOwner && (
                  <Link
                    href="/studio/films"
                    className="mt-8 inline-flex rounded-full bg-bone px-7 py-4 text-sm font-semibold text-ink transition-transform hover:scale-[1.02]"
                  >
                    Upload a film
                  </Link>
                )}
              </div>
            ) : (
              <FilmWall films={films} />
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
