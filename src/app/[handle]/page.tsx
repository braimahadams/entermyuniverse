import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Ambience } from "@/components/Ambience";
import { Avatar, VerifiedTick } from "@/components/Avatar";
import { Nav } from "@/components/Nav";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Footer } from "@/components/sections";
import { getCurrentUser } from "@/lib/auth";
import {
  getCollectionsWithCounts,
  getCreatorByHandle,
  getFeaturedThought,
} from "@/lib/creators";
import { config, soloMode } from "@/lib/config";
import { watchTime } from "@/lib/collections";
import { parseHandle } from "@/lib/handle";
import { brand } from "@/lib/brand";

export const revalidate = 300;

type Params = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const handle = parseHandle((await params).handle);
  if (!handle) return { title: "Not found" };

  const creator = await getCreatorByHandle(handle);
  if (!creator) return { title: "Not found" };

  // Bare name only — the root layout's title template already appends the
  // site name, and adding it here produces "X — EMU — EMU".
  const title = soloMode
    ? creator.displayName
    : `${creator.displayName} (@${creator.handle})`;
  const description = creator.tagline ?? brand.metaDescription;
  const url = `${config.siteUrl}/@${creator.handle}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "profile" },
    twitter: { card: "summary_large_image", title, description },
  };
}

/**
 * The front door.
 *
 * One portrait, one sentence, one thought, one way in. The temptation is
 * to explain the site here; the brief is right that explaining kills it.
 * Someone arriving from a bio link has about four seconds of patience and
 * they didn't come for a value proposition — they came to see whether this
 * person is worth listening to. So show them the strongest thing and get
 * out of the way.
 */
export default async function UniversePage({ params }: Params) {
  const handle = parseHandle((await params).handle);
  if (!handle) notFound();

  const [viewer, creator] = await Promise.all([
    getCurrentUser(),
    getCreatorByHandle(handle),
  ]);
  if (!creator) notFound();

  const isOwner = viewer?.id === creator.id;

  const [featured, collections] = await Promise.all([
    getFeaturedThought(creator.id),
    getCollectionsWithCounts(creator.id),
  ]);

  return (
    <>
      <Ambience />
      <ScrollReveal />
      <Nav user={viewer} solo={soloMode} />

      <main className="relative z-10">
        {/* ── the one sentence ── */}
        <section className="flex min-h-[92svh] flex-col justify-center px-5 pb-16 pt-32 sm:px-8">
          <div className="mx-auto w-full max-w-5xl">
            <div
              className="flex items-center gap-4 opacity-0"
              style={{ animation: "fade-up .8s var(--ease-out-expo) .1s both" }}
            >
              <Avatar
                src={creator.avatarUrl}
                name={creator.displayName}
                size={44}
                className="ring-1 ring-line-bright"
              />
              <span className="flex items-center gap-2 text-sm text-bone-dim">
                {creator.displayName}
                {creator.verified && <VerifiedTick />}
              </span>
            </div>

            <h1
              className="display mt-10 max-w-[13ch] text-[clamp(3rem,11vw,8rem)] leading-[0.94] opacity-0"
              style={{ animation: "fade-up 1s var(--ease-out-expo) .25s both" }}
            >
              Explore how <span className="text-gradient">I think</span>.
            </h1>

            {creator.tagline && (
              <p
                className="mt-9 max-w-xl text-base leading-relaxed text-bone-dim opacity-0 sm:text-lg"
                style={{ animation: "fade-up .9s var(--ease-out-expo) .5s both" }}
              >
                {creator.tagline}
              </p>
            )}

            <div
              className="mt-11 flex flex-wrap items-center gap-3 opacity-0"
              style={{ animation: "fade-up .9s var(--ease-out-expo) .65s both" }}
            >
              <Link
                href={`/@${handle}/thoughts`}
                className="group inline-flex items-center gap-2.5 rounded-full bg-bone px-7 py-4 text-sm font-semibold text-ink transition-transform duration-300 hover:scale-[1.02]"
              >
                Explore thoughts
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  <path
                    d="M1 7h12M7 1l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>

              {isOwner && (
                <Link
                  href="/studio"
                  className="rounded-full border border-line-bright px-6 py-4 text-sm transition-colors hover:bg-bone/5"
                >
                  Studio
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* ── one thought, the strongest ── */}
        {featured && (
          <section className="px-5 py-20 sm:px-8 sm:py-28">
            <div className="mx-auto max-w-5xl">
              <span className="eyebrow reveal">Start here</span>

              <Link
                href={`/@${handle}/thoughts/${featured.slug}`}
                className="reveal group mt-6 block"
              >
                <div className="grid gap-8 sm:grid-cols-[minmax(0,200px)_1fr] sm:items-center sm:gap-12">
                  <div
                    className="relative overflow-hidden rounded-2xl border border-line bg-ink-3"
                    style={{ aspectRatio: "9 / 16" }}
                  >
                    {featured.poster ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={featured.poster}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-105"
                      />
                    ) : (
                      <div
                        aria-hidden
                        className="absolute inset-0"
                        style={{
                          background:
                            "radial-gradient(120% 70% at 25% 15%, hsl(24 45% 30% / .9), transparent 62%), linear-gradient(165deg,#16161d,#0a0a0e)",
                        }}
                      />
                    )}
                    <span
                      className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-bone/20 bg-ink/30 backdrop-blur-md transition-all duration-500 group-hover:border-ember/60 group-hover:bg-ember/20"
                      aria-hidden
                    >
                      <svg width="15" height="17" viewBox="0 0 18 20" fill="none">
                        <path
                          d="M17 8.27a2 2 0 0 1 0 3.46L3 19.8a2 2 0 0 1-3-1.73V1.93A2 2 0 0 1 3 .2l14 8.07Z"
                          className="fill-bone transition-colors duration-500 group-hover:fill-ember"
                        />
                      </svg>
                    </span>
                  </div>

                  <div>
                    <h2 className="display text-[clamp(1.75rem,4.5vw,3rem)] leading-[1.05]">
                      {featured.title}
                    </h2>
                    <p className="mt-5 max-w-xl text-base leading-relaxed text-bone-dim">
                      {featured.summary ?? featured.hook}
                    </p>
                    <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-bone-faint">
                      {featured.durationSec && (
                        <span>{watchTime(featured.durationSec)} watch</span>
                      )}
                      {featured.readingMin > 0 && (
                        <span>{featured.readingMin} min read</span>
                      )}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* ── the way in ── */}
        {collections.length > 0 && (
          <section className="border-t border-line px-5 py-20 sm:px-8 sm:py-28">
            <div className="mx-auto max-w-5xl">
              <span className="eyebrow reveal">Collections</span>
              <div className="reveal mt-8 flex flex-wrap gap-2.5">
                {collections.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/@${handle}/thoughts?c=${c.slug}`}
                    className="rounded-full border border-line px-5 py-2.5 text-sm text-bone-dim transition-colors duration-300 hover:border-line-bright hover:text-bone"
                  >
                    {c.name}
                    <span className="ml-2 text-xs opacity-50">{c.count}</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Empty state, owner only. */}
        {!featured && isOwner && (
          <section className="px-5 pb-28 sm:px-8">
            <div className="card mx-auto max-w-2xl rounded-3xl p-12 text-center">
              <h2 className="display text-2xl">Nothing published yet.</h2>
              <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-bone-dim">
                Record something, upload it, and this page starts being worth
                sending to people.
              </p>
              <Link
                href="/studio/films"
                className="mt-8 inline-flex rounded-full bg-bone px-7 py-4 text-sm font-semibold text-ink transition-transform hover:scale-[1.02]"
              >
                Upload the first one
              </Link>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
