import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Ambience } from "@/components/Ambience";
import { Avatar, VerifiedTick } from "@/components/Avatar";
import { Nav } from "@/components/Nav";
import { PostCard, PostRef } from "@/components/PostCard";
import { SearchBox } from "@/components/SearchBox";
import { Footer } from "@/components/sections";
import { getCurrentUser } from "@/lib/auth";
import {
  getCollectionsWithCounts,
  getCreatorByHandle,
  getPinned,
  getTimeline,
} from "@/lib/creators";
import { config, soloMode } from "@/lib/config";
import { dayKey, dayLabel, postDescription } from "@/lib/posts";
import { parseHandle } from "@/lib/handle";
import type { PostView } from "@/lib/types";

export const revalidate = 60;

type Params = {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ c?: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const handle = parseHandle((await params).handle);
  if (!handle) return { title: "Not found" };

  const creator = await getCreatorByHandle(handle);
  if (!creator) return { title: "Not found" };

  // Bare name — the root layout's title template appends the site name,
  // and adding it here produces "X — EMU — EMU".
  const title = soloMode
    ? creator.displayName
    : `${creator.displayName} (@${creator.handle})`;
  const description =
    creator.tagline ?? `Thoughts, written down as they arrive.`;
  const url = `${config.siteUrl}/@${creator.handle}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      types: { "application/rss+xml": `${config.siteUrl}/feed.xml` },
    },
    openGraph: { title, description, url, type: "profile" },
    twitter: { card: "summary_large_image", title, description },
  };
}

/**
 * The front door, which is the timeline.
 *
 * No hero, no pitch, no "explore how I think" — someone who followed a
 * link with a name on it should land on the writing itself, not on a page
 * asking them to be curious first. The header is three lines and then it
 * gets out of the way.
 *
 * "Start here" sits above the timeline because reverse-chronology alone
 * makes a stranger's first impression whatever happened to be written
 * last night. Those are chosen by hand — there's no engagement data to
 * rank by, and manufacturing some would turn this into the thing it's a
 * reaction against.
 */
export default async function UniversePage({ params, searchParams }: Params) {
  const handle = parseHandle((await params).handle);
  if (!handle) notFound();

  const [{ c: activeCollection }, viewer, creator] = await Promise.all([
    searchParams,
    getCurrentUser(),
    getCreatorByHandle(handle),
  ]);
  if (!creator) notFound();

  const isOwner = viewer?.id === creator.id;

  const [timeline, pinned, collections] = await Promise.all([
    getTimeline(creator.id, { collection: activeCollection, limit: 60 }),
    // Pinned posts are the front door only — pointless when the reader has
    // already filtered to a collection.
    activeCollection ? Promise.resolve([]) : getPinned(creator.id, 3),
    getCollectionsWithCounts(creator.id),
  ]);

  /**
   * Days are grouped in the *author's* timezone, not the reader's.
   *
   * A timestamp here means "when this occurred to him" — a thought written
   * at 2am is a 2am thought, and re-basing that to a reader in Los Angeles
   * would destroy the only context the time carries. It also keeps the
   * grouping stable for everyone, so a shared link reads the same to both
   * people, and it avoids a server/client hydration mismatch since the
   * server can't know an anonymous visitor's zone anyway.
   */
  const zone = creator.timezone;
  const days = groupByDay(timeline, zone);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: creator.displayName,
    url: `${config.siteUrl}/@${creator.handle}`,
    description: creator.tagline ?? undefined,
    author: { "@type": "Person", name: creator.displayName },
    blogPost: timeline.slice(0, 10).map((p) => ({
      "@type": "BlogPosting",
      headline: p.title ?? postDescription(p).slice(0, 110),
      datePublished: p.publishedAt,
      url: `${config.siteUrl}/@${creator.handle}/thoughts/${p.slug}`,
    })),
  };

  return (
    <>
      <Ambience />
      <Nav user={viewer} solo={soloMode} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="relative z-10 px-5 pb-24 pt-24 sm:px-8 sm:pt-32">
        <div className="mx-auto max-w-2xl">
          {/* ── who ── */}
          <header
            className="opacity-0"
            style={{ animation: "fade-up .7s var(--ease-out-expo) .05s both" }}
          >
            <div className="flex items-center gap-4">
              <Avatar
                src={creator.avatarUrl}
                name={creator.displayName}
                size={52}
                className="ring-1 ring-line-bright"
              />
              <div className="min-w-0">
                <h1 className="display flex items-center gap-2 text-2xl leading-none sm:text-3xl">
                  {creator.displayName}
                  {creator.verified && <VerifiedTick size={15} />}
                </h1>
                <p className="mt-1.5 text-sm text-bone-faint">
                  @{creator.handle}
                </p>
              </div>

              {isOwner && (
                <Link
                  href="/studio"
                  className="ml-auto shrink-0 rounded-full border border-line-bright px-4 py-2 text-xs transition-colors hover:bg-bone/5"
                >
                  Write
                </Link>
              )}
            </div>

            {creator.tagline && (
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-bone-dim">
                {creator.tagline}
              </p>
            )}
          </header>

          <div
            className="mt-8 opacity-0"
            style={{ animation: "fade-up .7s var(--ease-out-expo) .18s both" }}
          >
            <SearchBox handle={handle} />
          </div>

          {/* ── collections ── */}
          {collections.length > 0 && (
            <nav
              aria-label="Collections"
              className="-mx-5 mt-6 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:px-0"
            >
              <Chip
                href={`/@${handle}`}
                label="Everything"
                active={!activeCollection}
              />
              {collections.map((c) => (
                <Chip
                  key={c.slug}
                  href={`/@${handle}?c=${c.slug}`}
                  label={c.name}
                  count={c.count}
                  active={c.slug === activeCollection}
                />
              ))}
            </nav>
          )}

          {/* ── start here ── */}
          {pinned.length > 0 && (
            <section className="mt-12" aria-labelledby="start-here">
              <h2
                id="start-here"
                className="text-[11px] uppercase tracking-[0.2em] text-bone-faint"
              >
                Start here
              </h2>
              <div className="mt-4 grid gap-3">
                {pinned.map((post) => (
                  <PostRef key={post.id} post={post} />
                ))}
              </div>
            </section>
          )}

          {/* ── the timeline ── */}
          <section className="mt-14">
            {timeline.length === 0 ? (
              <EmptyState isOwner={isOwner} filtered={Boolean(activeCollection)} />
            ) : (
              days.map(({ key, label, posts }) => (
                <div key={key} className="mb-4">
                  <h2 className="sticky top-16 z-20 -mx-5 mb-6 bg-ink/80 px-5 py-2 text-[11px] uppercase tracking-[0.2em] text-bone-faint backdrop-blur-md sm:top-20 sm:mx-0 sm:px-0">
                    {label}
                  </h2>
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} timeZone={zone} />
                  ))}
                </div>
              ))
            )}
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}

function groupByDay(posts: PostView[], timeZone: string) {
  const groups: { key: string; label: string; posts: PostView[] }[] = [];

  for (const post of posts) {
    const at = new Date(post.publishedAt);
    const key = dayKey(at, timeZone);
    const last = groups[groups.length - 1];

    if (last?.key === key) {
      last.posts.push(post);
    } else {
      groups.push({ key, label: dayLabel(at, timeZone), posts: [post] });
    }
  }

  return groups;
}

function Chip({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count?: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs transition-colors duration-300 ${
        active
          ? "border-ember/50 bg-ember/10 text-ember"
          : "border-line text-bone-dim hover:border-line-bright hover:text-bone"
      }`}
    >
      {label}
      {count !== undefined && (
        <span className="ml-1.5 opacity-50">{count}</span>
      )}
    </Link>
  );
}

function EmptyState({
  isOwner,
  filtered,
}: {
  isOwner: boolean;
  filtered: boolean;
}) {
  if (filtered) {
    return (
      <p className="py-16 text-center text-sm text-bone-faint">
        Nothing in this one yet.
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-line px-8 py-16 text-center">
      <p className="display text-2xl">
        {isOwner ? "Nothing written yet." : "Nothing here yet."}
      </p>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-bone-dim">
        {isOwner
          ? "Whatever's in your head right now — that's the first one."
          : "Come back in a day or two."}
      </p>
      {isOwner && (
        <Link
          href="/studio"
          className="mt-8 inline-flex rounded-full bg-bone px-6 py-3.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.02]"
        >
          Write the first one
        </Link>
      )}
    </div>
  );
}
