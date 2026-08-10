/**
 * The shapes that cross the server → client boundary.
 *
 * Prisma models never travel to the browser directly: they carry Date
 * objects, internal columns, and fields nobody outside the server should
 * see. These are the deliberately narrowed versions.
 */

/** A collection, as it travels to the browser. */
export type CollectionRef = {
  slug: string;
  name: string;
};

/** A thought. Text, and only text. */
export type PostView = {
  id: string;
  slug: string;
  /** Explicit title, or null when the body speaks for itself. */
  title: string | null;
  body: string;
  /** The question it refuses to answer. The hinge into a booking. */
  openQuestion: string | null;
  collections: CollectionRef[];
  pinned: boolean;
  /** ISO string — Dates don't survive the server/client boundary. */
  publishedAt: string;
  /** Minutes to read the body, for the timeline. */
  readingMin: number;
  commentCount: number;
  /**
   * Who wrote it. Null on an author's own pages, where the page is already
   * attributed and repeating it on every card is noise.
   */
  author: {
    handle: string;
    displayName: string;
    avatarUrl: string | null;
    verified: boolean;
    /** Drives whether a booking CTA appears at all. */
    canSell: boolean;
  } | null;
};

export type CommentView = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
  /** Another thought this reply points back at. */
  citedPost: { slug: string; title: string; handle: string } | null;
};

export type OfferView = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string | null;
  includes: string[];
  durationMin: number;
  priceCents: number;
  currency: string;
  /** Whose offer it is — the booking flow needs it to scope availability. */
  creatorHandle: string;
  creatorName: string;
};

export function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/**
 * "Braima's" — the possessive form used where a page belongs to someone.
 * First name only.
 */
export function possessiveFirstName(displayName: string): string {
  const first = displayName.trim().split(/\s+/)[0] || displayName;
  return /s$/i.test(first) ? `${first}'` : `${first}'s`;
}

export function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
