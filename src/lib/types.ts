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

/**
 * A thought.
 *
 * "Thought" rather than "video" deliberately: the video is the delivery
 * format, the idea is the thing. That distinction is why there are
 * transcripts, collections and no view counts.
 */
export type ThoughtView = {
  id: string;
  slug: string;
  title: string;
  hook: string;
  summary: string | null;
  description: string | null;
  /** The question it refuses to answer. The hinge of the whole funnel. */
  openQuestion: string | null;
  collections: CollectionRef[];
  durationSec: number | null;
  /** Minutes to read the transcript. 0 when there isn't one yet. */
  readingMin: number;
  /** A defining idea rather than a passing one. */
  coreThought: boolean;
  featured: boolean;
  /** Already resolved by the active video provider. */
  src: string;
  kind: "mp4" | "hls";
  poster: string | null;
  /**
   * Who made it. Null on a creator's own pages, where the whole page is
   * already attributed and repeating it on every tile is noise.
   */
  creator: {
    handle: string;
    displayName: string;
    avatarUrl: string | null;
    verified: boolean;
    /** Drives whether a booking CTA appears at all. */
    canSell: boolean;
  } | null;
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
 * "Braima's Universe" — the possessive, personalized form used on a
 * creator's own page. First name only, matching the convention used on
 * the player's end-card CTA.
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
