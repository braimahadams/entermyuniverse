import { db } from "@/lib/db";
import { PUBLIC_FILTER } from "@/lib/creators";

/**
 * Site search.
 *
 * Postgres `ILIKE` across title, hook, summary and transcript. Not clever,
 * and deliberately so: at a few hundred thoughts it returns in single-digit
 * milliseconds, needs no index to maintain, no extra service, and no cost.
 *
 * WHERE THIS GOES NEXT — the reason the shape looks like this:
 *
 *   1. A few thousand thoughts: add a generated tsvector column and swap
 *      the `where` below for `to_tsquery`. Same signature, same callers.
 *   2. Semantic search ("what does he think about fear?" matching a video
 *      that never says the word): enable pgvector on Neon, chunk each
 *      transcript, store embeddings, and rank by cosine distance.
 *   3. The AI assistant: retrieve the top chunks with (2) and pass them as
 *      grounding to a model, so answers quote what was actually said
 *      rather than inventing a position.
 *
 * All three keep this function's contract. Transcripts being stored as
 * plain text on the row is what makes any of them possible — that's the
 * architecture decision, the query is an implementation detail.
 */

export type SearchHit = {
  slug: string;
  handle: string;
  title: string;
  hook: string;
  collections: { slug: string; name: string }[];
  /** Text around the match, when the hit came from the transcript. */
  excerpt: string | null;
};

export async function searchThoughts(
  query: string,
  options: { handle?: string; limit?: number } = {},
): Promise<SearchHit[]> {
  const q = query.trim();
  // One or two characters matches nearly everything, which is worse than
  // returning nothing.
  if (q.length < 2) return [];

  const rows = await db.video.findMany({
    where: {
      ...PUBLIC_FILTER,
      ...(options.handle ? { user: { handle: options.handle } } : {}),
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { hook: { contains: q, mode: "insensitive" } },
        { summary: { contains: q, mode: "insensitive" } },
        { openQuestion: { contains: q, mode: "insensitive" } },
        { transcript: { contains: q, mode: "insensitive" } },
      ],
    },
    take: options.limit ?? 20,
    include: {
      user: { select: { handle: true } },
      collections: { select: { slug: true, name: true } },
    },
  });

  return rows.map((row) => ({
    slug: row.slug,
    handle: row.user.handle,
    title: row.title,
    hook: row.hook,
    collections: row.collections,
    excerpt: excerptAround(row.transcript, q),
  }));
}

/**
 * The sentence the match sits in.
 *
 * Showing where a phrase appears is most of what makes transcript search
 * feel like it understood the question rather than just matched a string.
 */
function excerptAround(
  transcript: string | null,
  query: string,
): string | null {
  if (!transcript) return null;

  const at = transcript.toLowerCase().indexOf(query.toLowerCase());
  if (at === -1) return null;

  const start = Math.max(0, at - 90);
  const end = Math.min(transcript.length, at + query.length + 120);

  return (
    (start > 0 ? "…" : "") +
    transcript.slice(start, end).trim() +
    (end < transcript.length ? "…" : "")
  );
}
