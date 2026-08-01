import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Ambience } from "@/components/Ambience";
import { Nav } from "@/components/Nav";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Footer } from "@/components/sections";
import { ThoughtPlayer } from "@/components/ThoughtPlayer";
import { ThoughtActions } from "@/components/ThoughtActions";
import { ThoughtCard } from "@/components/ThoughtCard";
import { Transcript } from "@/components/Transcript";
import { getCurrentUser } from "@/lib/auth";
import {
  getCreatorByHandle,
  getRelatedThoughts,
  getThought,
} from "@/lib/creators";
import { db } from "@/lib/db";
import { config, soloMode } from "@/lib/config";
import { watchTime } from "@/lib/collections";
import { parseHandle } from "@/lib/handle";
import { formatPrice } from "@/lib/types";

export const revalidate = 300;

type Params = { params: Promise<{ handle: string; slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { handle: raw, slug } = await params;
  const handle = parseHandle(raw);
  if (!handle) return { title: "Not found" };

  const thought = await getThought(handle, slug);
  if (!thought) return { title: "Not found" };

  const url = `${config.siteUrl}/@${handle}/thoughts/${slug}`;
  // The summary is written for humans; the hook is the fallback because a
  // truncated transcript makes a terrible search-result snippet.
  const description = thought.summary ?? thought.hook;

  return {
    title: thought.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: thought.title,
      description,
      url,
      type: "video.other",
      images: thought.poster ? [{ url: thought.poster }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: thought.title,
      description,
      images: thought.poster ? [thought.poster] : undefined,
    },
  };
}

export default async function ThoughtPage({ params }: Params) {
  const { handle: raw, slug } = await params;
  const handle = parseHandle(raw);
  if (!handle) notFound();

  const [viewer, creator, thought] = await Promise.all([
    getCurrentUser(),
    getCreatorByHandle(handle),
    getThought(handle, slug),
  ]);

  if (!creator || !thought) notFound();

  const [related, offer] = await Promise.all([
    getRelatedThoughts(thought, creator.id, 3),
    creator.canSell
      ? db.sessionType.findFirst({
          where: { userId: creator.id, active: true },
          orderBy: { position: "asc" },
        })
      : Promise.resolve(null),
  ]);

  const url = `${config.siteUrl}/@${handle}/thoughts/${slug}`;

  /**
   * Structured data. Lets Google show this as a video result with a
   * duration and thumbnail rather than a bare blue link — which is most
   * of the value of having real pages at all.
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: thought.title,
    description: thought.summary ?? thought.hook,
    thumbnailUrl: thought.poster ? [thought.poster] : undefined,
    contentUrl: thought.src.startsWith("http")
      ? thought.src
      : `${config.siteUrl}${thought.src}`,
    duration: thought.durationSec
      ? `PT${Math.floor(thought.durationSec / 60)}M${thought.durationSec % 60}S`
      : undefined,
    transcript: thought.transcript ?? undefined,
    author: {
      "@type": "Person",
      name: creator.displayName,
      url: `${config.siteUrl}/@${creator.handle}`,
    },
  };

  return (
    <>
      <Ambience />
      <ScrollReveal />
      <Nav user={viewer} solo={soloMode} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="relative z-10 px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
        <article className="mx-auto max-w-3xl">
          <Link
            href={`/@${handle}/thoughts`}
            className="group mb-10 inline-flex items-center gap-2 text-sm text-bone-faint transition-colors hover:text-bone"
          >
            <svg
              width="14"
              height="14"
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
            All thoughts
          </Link>

          <ThoughtPlayer thought={thought} />

          <header className="mt-10">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] uppercase tracking-[0.16em] text-bone-faint">
              {thought.coreThought && (
                <span className="text-ember">Core thought</span>
              )}
              {thought.collections.map((c) => (
                <Link
                  key={c.slug}
                  href={`/@${handle}/thoughts?c=${c.slug}`}
                  className="transition-colors hover:text-bone"
                >
                  {c.name}
                </Link>
              ))}
              <span className="font-mono normal-case tracking-normal">
                {thought.durationSec ? `${watchTime(thought.durationSec)} watch` : ""}
                {thought.readingMin > 0 &&
                  `${thought.durationSec ? " · " : ""}${thought.readingMin} min read`}
              </span>
            </div>

            <h1 className="display mt-5 text-[clamp(2rem,5.5vw,3.5rem)] leading-[1.03]">
              {thought.title}
            </h1>

            {thought.summary && (
              <p className="mt-6 text-lg leading-relaxed text-bone-dim">
                {thought.summary}
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-line py-4">
              <Link
                href={`/@${creator.handle}`}
                className="text-sm text-bone-dim transition-colors hover:text-bone"
              >
                {creator.displayName}
              </Link>
              <ThoughtActions
                slug={thought.slug}
                title={thought.title}
                url={url}
              />
            </div>
          </header>

          {thought.description && (
            <div className="mt-10 space-y-5 text-[1.0625rem] leading-[1.75] text-bone-dim">
              {thought.description.split(/\n{2,}/).map((p, i) => (
                <p key={i}>{p.trim()}</p>
              ))}
            </div>
          )}

          {thought.transcript && <Transcript text={thought.transcript} />}

          {/* The question it deliberately leaves open. */}
          {thought.openQuestion && (
            <aside className="mt-14 rounded-2xl border border-ember/30 bg-ember/[0.05] p-7 sm:p-9">
              <span className="eyebrow">The question it leaves</span>
              <p className="display mt-4 text-2xl leading-snug sm:text-[1.75rem]">
                {thought.openQuestion}
              </p>
            </aside>
          )}

          {/* Booking, offered once, at the end, only if there's an offer. */}
          {offer && (
            <aside className="mt-8 rounded-2xl border border-line p-7 sm:p-9">
              <p className="text-[1.0625rem] leading-relaxed text-bone">
                If this changed how you were thinking about something, the rest
                of that conversation is worth having properly.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Link
                  href={`/@${handle}/book?from=${encodeURIComponent(thought.slug)}${
                    thought.openQuestion
                      ? `&q=${encodeURIComponent(thought.openQuestion)}`
                      : ""
                  }`}
                  className="rounded-full bg-bone px-6 py-3.5 text-sm font-semibold text-ink transition-transform duration-300 hover:scale-[1.02]"
                >
                  Book a conversation
                </Link>
                <span className="text-sm text-bone-faint">
                  {formatPrice(offer.priceCents, offer.currency)} ·{" "}
                  {offer.durationMin} minutes
                </span>
              </div>
            </aside>
          )}
        </article>

        {related.length > 0 && (
          <section className="mx-auto mt-24 max-w-6xl">
            <h2 className="display mb-8 text-2xl">Related thoughts</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <ThoughtCard key={r.id} thought={r} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
