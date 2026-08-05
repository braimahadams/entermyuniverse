import Link from "next/link";
import { clamp, isLong, postTitle, timeLabel } from "@/lib/posts";
import { formatDuration } from "@/lib/types";
import type { PostView } from "@/lib/types";

/**
 * A thought in the timeline.
 *
 * The card *is* the writing — short posts are shown whole, because making
 * someone click through to read forty words is an insult to both of you.
 * Only long ones get clamped, and then the link is an offer rather than a
 * toll gate.
 *
 * There are no counters on it. No views, no likes, no reply totals beyond
 * a quiet number. A timeline that ranks itself stops being a record of
 * what someone thought and becomes a scoreboard.
 */
export function PostCard({
  post,
  timeZone,
  showAuthor = false,
}: {
  post: PostView;
  timeZone: string;
  showAuthor?: boolean;
}) {
  const href = `/@${post.author?.handle}/thoughts/${post.slug}`;
  const long = isLong(post.body);
  const shown = long ? clamp(post.body) : post.body;
  const heading = post.title?.trim();

  return (
    <article className="group relative border-b border-line py-8 first:pt-0 sm:py-10">
      <div className="flex items-baseline gap-3">
        <time
          dateTime={post.publishedAt}
          className="shrink-0 font-mono text-xs text-bone-faint"
        >
          {timeLabel(new Date(post.publishedAt), timeZone)}
        </time>

        {showAuthor && post.author && (
          <Link
            href={`/@${post.author.handle}`}
            className="text-xs text-bone-dim transition-colors hover:text-bone"
          >
            @{post.author.handle}
          </Link>
        )}

        {post.pinned && (
          <span className="text-[10px] uppercase tracking-[0.16em] text-ember">
            Start here
          </span>
        )}
      </div>

      {heading && (
        <h2 className="display mt-4 text-[1.6rem] leading-[1.12] sm:text-[2rem]">
          <Link
            href={href}
            className="transition-colors hover:text-bone-dim focus-visible:text-bone-dim"
          >
            {heading}
          </Link>
        </h2>
      )}

      {/* The writing. Paragraph breaks preserved — how someone breaks up a
          thought is part of the thought. */}
      <div
        className={`space-y-4 text-[1.0625rem] leading-[1.72] text-bone/90 sm:text-[1.125rem] ${
          heading ? "mt-4" : "mt-4"
        }`}
      >
        {shown.split(/\n{2,}/).map((para, i) => (
          <p key={i} className="whitespace-pre-wrap">
            {para.trim()}
          </p>
        ))}
      </div>

      {long && (
        <Link
          href={href}
          className="mt-4 inline-block text-sm text-ember transition-opacity hover:opacity-75"
        >
          Read the rest →
        </Link>
      )}

      {/* The video, when there is one. Never autoplays; a poster and a
          play affordance, so sound is always a choice. */}
      {post.video && (
        <Link
          href={href}
          className="mt-6 block max-w-[240px] overflow-hidden rounded-xl border border-line bg-ink-3"
        >
          <span
            className="relative block"
            style={{ aspectRatio: "9 / 16" }}
          >
            {post.video.poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.video.poster}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <span
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(120% 70% at 30% 20%, hsl(24 38% 26% / .85), transparent 64%), linear-gradient(165deg,#16161d,#0a0a0e)",
                }}
              />
            )}
            <span
              className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-bone/20 bg-ink/40 backdrop-blur-md transition-colors duration-500 group-hover:border-ember/60"
              aria-hidden
            >
              <svg width="13" height="15" viewBox="0 0 18 20" fill="none">
                <path
                  d="M17 8.27a2 2 0 0 1 0 3.46L3 19.8a2 2 0 0 1-3-1.73V1.93A2 2 0 0 1 3 .2l14 8.07Z"
                  className="fill-bone"
                />
              </svg>
            </span>
            {post.video.durationSec && (
              <span className="absolute bottom-2 right-2 rounded-full bg-ink/70 px-2 py-0.5 font-mono text-[10px] text-bone-dim backdrop-blur-md">
                {formatDuration(post.video.durationSec)}
              </span>
            )}
          </span>
        </Link>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-bone-faint">
        {post.collections.map((c) => (
          <Link
            key={c.slug}
            href={`/@${post.author?.handle}?c=${c.slug}`}
            className="transition-colors hover:text-bone-dim"
          >
            {c.name}
          </Link>
        ))}

        <Link
          href={href}
          className="ml-auto transition-colors hover:text-bone-dim"
        >
          {post.commentCount > 0
            ? `${post.commentCount} ${post.commentCount === 1 ? "reply" : "replies"}`
            : "Reply"}
        </Link>
      </div>
    </article>
  );
}

/** A compact reference to a post — used by "start here" and related. */
export function PostRef({ post }: { post: PostView }) {
  return (
    <Link
      href={`/@${post.author?.handle}/thoughts/${post.slug}`}
      className="group block rounded-2xl border border-line p-5 transition-colors duration-300 hover:border-line-bright hover:bg-bone/[0.02]"
    >
      <p className="display text-lg leading-snug">{postTitle(post)}</p>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-bone-dim">
        {post.body.replace(/\s+/g, " ")}
      </p>
    </Link>
  );
}
