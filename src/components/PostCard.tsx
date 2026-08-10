import Link from "next/link";
import { firstParagraph, postTitle, timeLabel } from "@/lib/posts";
import type { PostView } from "@/lib/types";

/**
 * A thought in the timeline.
 *
 * Title, then the opening paragraph, then a way in. Only the first
 * paragraph — the job of this card is to make someone want to read the
 * rest, and a wall of text on a timeline gets skimmed past rather than
 * read. The opening paragraph is where the claim lives; the argument can
 * wait for the page.
 *
 * There are no counters on it. No views, no likes. A timeline that ranks
 * itself stops being a record of what someone thought and becomes a
 * scoreboard.
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
  const { text: opening, hasMore } = firstParagraph(post.body);

  return (
    <article className="group border-b border-line py-9 first:pt-0 sm:py-11">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
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

        {post.readingMin > 0 && (
          <span className="font-mono text-[11px] text-bone-faint">
            {post.readingMin} min
          </span>
        )}
      </div>

      {/* The title is the thing you click. */}
      <h2 className="display mt-3.5 text-[1.75rem] leading-[1.1] sm:text-[2.15rem]">
        <Link
          href={href}
          className="transition-colors duration-300 hover:text-gold focus-visible:text-gold"
        >
          {postTitle(post)}
        </Link>
      </h2>

      <p className="mt-4 whitespace-pre-wrap text-[1.0625rem] leading-[1.72] text-bone-dim sm:text-[1.125rem]">
        {opening}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-bone-faint">
        <Link
          href={href}
          className="text-ember transition-opacity duration-300 hover:opacity-70"
        >
          {hasMore ? "Keep reading →" : "Open →"}
        </Link>

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
          href={`${href}#replies`}
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

/** A compact reference — used by "start here" and related. */
export function PostRef({ post }: { post: PostView }) {
  const { text } = firstParagraph(post.body);

  return (
    <Link
      href={`/@${post.author?.handle}/thoughts/${post.slug}`}
      className="group block rounded-2xl border border-line p-5 transition-all duration-300 hover:border-line-bright hover:bg-bone/[0.02]"
    >
      <p className="display text-lg leading-snug transition-colors duration-300 group-hover:text-gold">
        {postTitle(post)}
      </p>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-bone-dim">
        {text}
      </p>
    </Link>
  );
}
