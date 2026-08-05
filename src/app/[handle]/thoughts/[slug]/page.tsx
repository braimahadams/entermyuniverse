import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Ambience } from "@/components/Ambience";
import { Comments } from "@/components/Comments";
import { Nav } from "@/components/Nav";
import { PostRef } from "@/components/PostCard";
import { ThoughtActions } from "@/components/ThoughtActions";
import { ThoughtPlayer } from "@/components/ThoughtPlayer";
import { Transcript } from "@/components/Transcript";
import { Footer } from "@/components/sections";
import { getCurrentUser } from "@/lib/auth";
import { getCreatorByHandle, getPost, getRelatedPosts } from "@/lib/creators";
import { db } from "@/lib/db";
import { config, soloMode } from "@/lib/config";
import { dayLabel, postDescription, postTitle, timeLabel } from "@/lib/posts";
import { parseHandle } from "@/lib/handle";
import { formatPrice } from "@/lib/types";
import type { CommentView } from "@/lib/types";

export const revalidate = 60;

type Params = { params: Promise<{ handle: string; slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { handle: raw, slug } = await params;
  const handle = parseHandle(raw);
  if (!handle) return { title: "Not found" };

  const post = await getPost(handle, slug);
  if (!post) return { title: "Not found" };

  const url = `${config.siteUrl}/@${handle}/thoughts/${slug}`;
  const title = postTitle(post);
  const description = postDescription(post);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      publishedTime: post.publishedAt,
      images: post.video?.poster ? [{ url: post.video.poster }] : undefined,
    },
    twitter: {
      card: post.video?.poster ? "summary_large_image" : "summary",
      title,
      description,
    },
  };
}

/**
 * One thought.
 *
 * When there's a video it goes first, above the writing — you watch, then
 * you read what it was about. When there isn't, which is most of the time,
 * the page is simply the text at a comfortable measure.
 */
export default async function PostPage({ params }: Params) {
  const { handle: raw, slug } = await params;
  const handle = parseHandle(raw);
  if (!handle) notFound();

  const [viewer, creator, post] = await Promise.all([
    getCurrentUser(),
    getCreatorByHandle(handle),
    getPost(handle, slug),
  ]);

  if (!creator || !post) notFound();

  const [related, offer, commentRows] = await Promise.all([
    getRelatedPosts(post, creator.id, 3),
    creator.canSell
      ? db.sessionType.findFirst({
          where: { userId: creator.id, active: true },
          orderBy: { position: "asc" },
        })
      : Promise.resolve(null),
    db.comment.findMany({
      where: { postId: post.id, approved: true },
      orderBy: { createdAt: "asc" },
      include: {
        citedPost: {
          select: { slug: true, title: true, body: true, user: { select: { handle: true } } },
        },
      },
    }),
  ]);

  const comments: CommentView[] = commentRows.map((c) => ({
    id: c.id,
    authorName: c.authorName,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
    citedPost: c.citedPost
      ? {
          slug: c.citedPost.slug,
          title: postTitle(c.citedPost),
          handle: c.citedPost.user.handle,
        }
      : null,
  }));

  const url = `${config.siteUrl}/@${handle}/thoughts/${slug}`;
  const at = new Date(post.publishedAt);
  const title = postTitle(post);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description: postDescription(post),
    datePublished: post.publishedAt,
    url,
    author: {
      "@type": "Person",
      name: creator.displayName,
      url: `${config.siteUrl}/@${creator.handle}`,
    },
    ...(post.video
      ? {
          video: {
            "@type": "VideoObject",
            name: title,
            description: postDescription(post),
            thumbnailUrl: post.video.poster ? [post.video.poster] : undefined,
            uploadDate: post.publishedAt,
            contentUrl: post.video.src.startsWith("http")
              ? post.video.src
              : `${config.siteUrl}${post.video.src}`,
          },
        }
      : {}),
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
        <article className="mx-auto max-w-2xl">
          <Link
            href={`/@${handle}`}
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
            {creator.displayName}
          </Link>

          {/* Video first when there is one — watch, then read. */}
          {post.video && (
            <div className="mb-10">
              <ThoughtPlayer
                src={post.video.src}
                poster={post.video.poster}
                title={title}
              />
            </div>
          )}

          <header>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-bone-faint">
              <time dateTime={post.publishedAt} className="font-mono">
                {dayLabel(at, creator.timezone)}, {timeLabel(at, creator.timezone)}
              </time>
              {post.pinned && (
                <span className="uppercase tracking-[0.16em] text-ember">
                  Start here
                </span>
              )}
              {post.collections.map((c) => (
                <Link
                  key={c.slug}
                  href={`/@${handle}?c=${c.slug}`}
                  className="transition-colors hover:text-bone-dim"
                >
                  {c.name}
                </Link>
              ))}
            </div>

            {post.title && (
              <h1 className="display mt-5 text-[clamp(2rem,5.5vw,3.25rem)] leading-[1.04]">
                {post.title}
              </h1>
            )}
          </header>

          {/* The writing. */}
          <div
            className={`space-y-6 text-[1.125rem] leading-[1.78] text-bone/90 ${
              post.title ? "mt-8" : "mt-6"
            }`}
          >
            {post.body.split(/\n{2,}/).map((para, i) => (
              <p key={i} className="whitespace-pre-wrap">
                {para.trim()}
              </p>
            ))}
          </div>

          {post.transcript && <Transcript text={post.transcript} />}

          {post.openQuestion && (
            <aside className="mt-12 rounded-2xl border border-ember/30 bg-ember/[0.05] p-7">
              <span className="eyebrow">The question it leaves</span>
              <p className="display mt-4 text-xl leading-snug sm:text-2xl">
                {post.openQuestion}
              </p>
            </aside>
          )}

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-y border-line py-4">
            <span className="text-sm text-bone-faint">{creator.displayName}</span>
            <ThoughtActions slug={post.slug} title={title} url={url} />
          </div>

          {/* Booking, offered once, quietly, at the end. */}
          {offer && (
            <aside className="mt-8 rounded-2xl border border-line p-7">
              <p className="text-[1.0625rem] leading-relaxed text-bone">
                If this changed how you were thinking about something, the rest
                of that conversation is worth having properly.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Link
                  href={`/@${handle}/book?from=${encodeURIComponent(post.slug)}${
                    post.openQuestion
                      ? `&q=${encodeURIComponent(post.openQuestion)}`
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

          <Comments postId={post.id} comments={comments} handle={handle} />

          {related.length > 0 && (
            <section className="mt-16 border-t border-line pt-12">
              <h2 className="text-[11px] uppercase tracking-[0.2em] text-bone-faint">
                Related
              </h2>
              <div className="mt-5 grid gap-3">
                {related.map((r) => (
                  <PostRef key={r.id} post={r} />
                ))}
              </div>
            </section>
          )}
        </article>
      </main>

      <Footer />
    </>
  );
}
