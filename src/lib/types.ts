/**
 * The shapes that cross the server → client boundary.
 *
 * Prisma models never travel to the browser directly: they carry Date
 * objects, internal columns, and fields nobody outside the server should
 * see. These are the deliberately narrowed versions.
 */

export type FilmView = {
  id: string;
  slug: string;
  title: string;
  hook: string;
  description: string | null;
  /** The question the film refuses to answer. The hinge of the funnel. */
  openQuestion: string | null;
  topic: string;
  durationSec: number | null;
  featured: boolean;
  /** Already resolved by the active video provider. */
  src: string;
  kind: "mp4" | "hls";
  poster: string | null;
  /**
   * Who made it. Null on a creator's own universe page, where the whole
   * page is already attributed and repeating it on every tile is noise.
   */
  creator: {
    handle: string;
    displayName: string;
    avatarUrl: string | null;
    verified: boolean;
    /** Drives whether the player offers a booking CTA at all. */
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

export function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
