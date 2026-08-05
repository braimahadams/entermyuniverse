import { db } from "@/lib/db";
import { PUBLIC_FILTER } from "@/lib/creators";
import { postTitle } from "@/lib/posts";

/**
 * Site search.
 *
 * Postgres `ILIKE` across the body, title and any transcript. Not clever,
 * and deliberately so: at a few thousand posts it returns in single-digit
 * milliseconds, needs no index to maintain, no extra service, and no cost.
 *
 * WHERE THIS GOES NEXT — the reason the shape looks like this:
 *
 *   1. Tens of thousands of posts: add a generated tsvector column and
 *      swap the `where` below for `to_tsquery`. Same signature, same callers.
 *   2. Semantic search ("what does he think about fear?" matching a post
 *      that never uses the word): enable pgvector on Neon, chunk each
 *      body, store embeddings, rank by cosine distance.
 *   3. The assistant: retrieve top chunks with (2) and pass them as
 *      grounding, so answers quote what was actually written rather than
 *      inventing a position.
 *
 * All three keep this function's contract. Text living as plain text on
 * the row is what makes any of them possible — that's the architectural
 * decision; the query is an implementation detail.
 */

export type SearchHit = {
  slug: string;
  handle: string;
  title: string;
  publishedAt: string;
  /** Text around the match. */
  excerpt: string | null;
};

export async function searchPosts(
  query: string,
  options: { handle?: string; limit?: number } = {},
): Promise<SearchHit[]> {
  const q = query.trim();
  // One character matches nearly everything, which is worse than nothing.
  if (q.length < 2) return [];

  const rows = await db.post.findMany({
    where: {
      ...PUBLIC_FILTER,
      ...(options.handle
        ? { user: { ...PUBLIC_FILTER.user, handle: options.handle } }
        : {}),
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { body: { contains: q, mode: "insensitive" } },
        { openQuestion: { contains: q, mode: "insensitive" } },
        { transcript: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { publishedAt: "desc" },
    take: options.limit ?? 20,
    include: { user: { select: { handle: true } } },
  });

  return rows.map((row) => ({
    slug: row.slug,
    handle: row.user.handle,
    title: postTitle(row),
    publishedAt: row.publishedAt.toISOString(),
    excerpt: excerptAround(row.body, q) ?? excerptAround(row.transcript, q),
  }));
}

/**
 * The sentence the match sits in.
 *
 * Showing where a phrase appears is most of what makes search feel like it
 * understood the question rather than just matched a string.
 */
function excerptAround(
  text: string | null,
  query: string,
): string | null {
  if (!text) return null;

  const at = text.toLowerCase().indexOf(query.toLowerCase());
  if (at === -1) return null;

  const start = Math.max(0, at - 80);
  const end = Math.min(text.length, at + query.length + 110);

  return (
    (start > 0 ? "…" : "") +
    text.slice(start, end).replace(/\s+/g, " ").trim() +
    (end < text.length ? "…" : "")
  );
}
