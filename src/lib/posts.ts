import { getZonedParts } from "@/lib/time";

/**
 * Helpers for turning a written thought into the things a web page needs.
 *
 * A post is just text. Everything structural — a title, a URL, a preview,
 * a share-card description — has to be derived from it, because demanding
 * those up front is exactly the friction that stops someone writing down
 * an idea at 2am.
 */

/**
 * How much of an opening paragraph the timeline will show before it
 * trails off. Long enough to carry a whole thought, short enough that
 * three cards still fit on a phone screen.
 */
export const TEASER_MAX = 320;

/**
 * A display title.
 *
 * Uses the explicit one when there is one. Otherwise takes the opening
 * sentence, since that's almost always the claim the rest of the post
 * argues with.
 */
export function postTitle(post: { title: string | null; body: string }): string {
  if (post.title?.trim()) return post.title.trim();

  const firstLine = post.body.trim().split("\n")[0] ?? "";
  // Prefer a sentence break, but only if it lands somewhere sensible —
  // an abbreviation shouldn't produce a two-word title.
  const sentenceEnd = firstLine.search(/[.?!](\s|$)/);
  const candidate =
    sentenceEnd > 24 ? firstLine.slice(0, sentenceEnd + 1) : firstLine;

  return candidate.length > 90 ? candidate.slice(0, 87).trimEnd() + "…" : candidate;
}

/** A one-line description for meta tags and search results. */
export function postDescription(post: { body: string }): string {
  const flat = post.body.replace(/\s+/g, " ").trim();
  return flat.length > 155 ? flat.slice(0, 152).trimEnd() + "…" : flat;
}

/**
 * The opening paragraph, and whether there's more behind it.
 *
 * The timeline shows this and nothing else. Splitting on the blank line
 * respects how the writer broke the thought up rather than cutting at an
 * arbitrary character count — the first paragraph is almost always the
 * claim, and the rest is the argument for it.
 *
 * A very long opening paragraph still gets trailed off, on a word
 * boundary, so one rambling post can't fill the whole screen.
 */
export function firstParagraph(body: string): {
  text: string;
  hasMore: boolean;
} {
  const paragraphs = body.trim().split(/\n{2,}/);
  const first = paragraphs[0]?.trim() ?? "";
  const moreParagraphs = paragraphs.length > 1;

  if (first.length <= TEASER_MAX) {
    return { text: first, hasMore: moreParagraphs };
  }

  const cut = first.slice(0, TEASER_MAX);
  const lastSpace = cut.lastIndexOf(" ");
  const trimmed = (lastSpace > TEASER_MAX * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd();

  return { text: trimmed + "…", hasMore: true };
}

/**
 * A URL-safe slug.
 *
 * Built from the title or the opening words. Kept short: these appear in
 * shared links, and a 90-character URL looks like spam in a message.
 */
export function slugify(source: string): string {
  const base = source
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .split("-")
    .slice(0, 8)
    .join("-")
    .slice(0, 60)
    .replace(/-+$/, "");

  // A post of pure punctuation or emoji still needs an address.
  return base || "thought";
}

/* ── time ──────────────────────────────────────────────────── */

/** "Today" / "Yesterday" / "3 August 2026", in the reader's zone. */
export function dayLabel(instant: Date, timeZone: string): string {
  const now = new Date();
  const then = getZonedParts(instant, timeZone);
  const today = getZonedParts(now, timeZone);

  if (
    then.year === today.year &&
    then.month === today.month &&
    then.day === today.day
  ) {
    return "Today";
  }

  const yesterday = getZonedParts(
    new Date(now.getTime() - 86_400_000),
    timeZone,
  );
  if (
    then.year === yesterday.year &&
    then.month === yesterday.month &&
    then.day === yesterday.day
  ) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "numeric",
    month: "long",
    // Drop the year for the current one — "3 August" reads better than
    // "3 August 2026" when every entry says the same year.
    ...(then.year === today.year ? {} : { year: "numeric" }),
  }).format(instant);
}

/** "14:20" — the time of day, which is half the texture of a timeline. */
export function timeLabel(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(instant);
}

/** A YYYY-MM-DD key for grouping posts into days. */
export function dayKey(instant: Date, timeZone: string): string {
  const p = getZonedParts(instant, timeZone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}
