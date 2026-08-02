import { db } from "@/lib/db";
import { resolveVideo } from "@/lib/providers/video";
import { readingMinutes } from "@/lib/collections";
import { config } from "@/lib/config";
import type { ThoughtView } from "@/lib/types";

/**
 * Every read the public pages make.
 *
 * Provider URLs are resolved here, server-side, so the browser never
 * learns which video host is in use and swapping hosts changes nothing
 * client-side.
 */

export type CreatorView = {
  id: string;
  handle: string;
  displayName: string;
  tagline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  links: string[];
  verified: boolean;
  canSell: boolean;
  /** Approved to publish. Gates whether anyone but the owner sees anything. */
  approved: boolean;
  thoughtCount: number;
  followerCount: number;
};

/**
 * What a visitor is allowed to see: published, not moderated away, and
 * belonging to someone both approved to publish and not suspended.
 *
 * `visibility: "public"` is the hook for a future membership tier — when
 * members-only content exists, this filter is the only thing that changes.
 */
export const PUBLIC_FILTER = {
  published: true,
  approved: true,
  visibility: "public",
  user: { suspended: false, approved: true },
} as const;

const CREATOR_SELECT = {
  handle: true,
  displayName: true,
  avatarUrl: true,
  verified: true,
  canSell: true,
} as const;

/** Everything a thought needs, in one shape, so reads stay consistent. */
const THOUGHT_INCLUDE = {
  user: { select: CREATOR_SELECT },
  collections: {
    select: { slug: true, name: true },
    orderBy: { position: "asc" },
  },
} as const;

type ThoughtRow = {
  id: string;
  slug: string;
  title: string;
  hook: string;
  summary: string | null;
  description: string | null;
  openQuestion: string | null;
  transcript: string | null;
  durationSec: number | null;
  coreThought: boolean;
  featured: boolean;
  sourceId: string;
  thumbnailUrl: string | null;
  collections: { slug: string; name: string }[];
  user?: {
    handle: string;
    displayName: string;
    avatarUrl: string | null;
    verified: boolean;
    canSell: boolean;
  } | null;
};

export function toThoughtView(row: ThoughtRow): ThoughtView {
  const source = resolveVideo(row.sourceId, row.thumbnailUrl);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    hook: row.hook,
    summary: row.summary,
    description: row.description,
    openQuestion: row.openQuestion,
    collections: row.collections,
    durationSec: row.durationSec,
    // Derived, not stored — a stored count goes stale the moment the
    // transcript is edited.
    readingMin: readingMinutes(row.transcript),
    coreThought: row.coreThought,
    featured: row.featured,
    src: source.url,
    kind: source.kind,
    poster: source.poster,
    creator: row.user
      ? {
          handle: row.user.handle,
          displayName: row.user.displayName,
          avatarUrl: row.user.avatarUrl,
          verified: row.user.verified,
          canSell: row.user.canSell,
        }
      : null,
  };
}

/**
 * The handle the root should redirect to.
 *
 * Resolved against the database rather than trusted from the environment.
 * PRIMARY_HANDLE is set by hand in a dashboard, and a single typo there
 * would otherwise redirect every visitor to a 404 — the homepage would be
 * down while every other page worked, which is a miserable thing to
 * diagnose. So a value that doesn't match an account falls back to the
 * owner account instead, and says so in the logs.
 */
export async function resolvePrimaryHandle(): Promise<string | null> {
  if (config.primaryHandle) {
    const exact = await db.user.findUnique({
      where: { handle: config.primaryHandle },
      select: { handle: true, suspended: true },
    });
    if (exact && !exact.suspended) return exact.handle;

    console.warn(
      `[config] PRIMARY_HANDLE="${config.primaryHandle}" matches no account — ` +
        `falling back to the owner account. Fix the environment variable.`,
    );
  }

  const fallback = await db.user.findFirst({
    where: { suspended: false },
    // The admin account is the site owner; oldest first as a tiebreak.
    orderBy: [{ isAdmin: "desc" }, { createdAt: "asc" }],
    select: { handle: true },
  });

  return fallback?.handle ?? null;
}

export async function getCreatorByHandle(
  handle: string,
): Promise<CreatorView | null> {
  const user = await db.user.findUnique({
    where: { handle: handle.toLowerCase() },
    include: {
      _count: {
        select: { videos: { where: PUBLIC_FILTER }, followers: true },
      },
    },
  });

  if (!user || user.suspended) return null;

  return {
    id: user.id,
    handle: user.handle,
    displayName: user.displayName,
    tagline: user.tagline,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    bannerUrl: user.bannerUrl,
    links: user.links?.split("\n").map((l) => l.trim()).filter(Boolean) ?? [],
    verified: user.verified,
    canSell: user.canSell,
    approved: user.approved,
    thoughtCount: user._count.videos,
    followerCount: user._count.followers,
  };
}

/** Published thoughts by one person, optionally filtered to a collection. */
export async function getThoughts(
  userId: string,
  options: { collection?: string; limit?: number } = {},
): Promise<ThoughtView[]> {
  const rows = await db.video.findMany({
    where: {
      userId,
      ...PUBLIC_FILTER,
      ...(options.collection
        ? { collections: { some: { slug: options.collection } } }
        : {}),
    },
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    take: options.limit,
    include: THOUGHT_INCLUDE,
  });

  return rows.map(toThoughtView);
}

/** One thought, by handle and slug. Null unless it's publicly visible. */
export async function getThought(
  handle: string,
  slug: string,
): Promise<(ThoughtView & { transcript: string | null }) | null> {
  const row = await db.video.findFirst({
    where: {
      slug,
      ...PUBLIC_FILTER,
      // Merged, not spread after: PUBLIC_FILTER carries its own `user`
      // clause, and a second `user` key would silently replace it —
      // taking the suspended/approved checks with it.
      user: { ...PUBLIC_FILTER.user, handle: handle.toLowerCase() },
    },
    include: THOUGHT_INCLUDE,
  });

  if (!row) return null;
  return { ...toThoughtView(row), transcript: row.transcript };
}

/**
 * The homepage's single featured thought.
 *
 * Explicitly not the newest. A core thought is the one worth meeting a
 * stranger with, and it stays right long after it stops being recent.
 */
export async function getFeaturedThought(
  userId: string,
): Promise<ThoughtView | null> {
  const row = await db.video.findFirst({
    where: { userId, ...PUBLIC_FILTER },
    orderBy: [
      { coreThought: "desc" },
      { featured: "desc" },
      { createdAt: "desc" },
    ],
    include: THOUGHT_INCLUDE,
  });

  return row ? toThoughtView(row) : null;
}

/**
 * What to watch next.
 *
 * Prefers thoughts sharing a collection — someone who just watched
 * something about fear is, at that moment, interested in fear. Tops up
 * from anything else so the slot is never empty.
 */
export async function getRelatedThoughts(
  thought: ThoughtView,
  userId: string,
  limit = 3,
): Promise<ThoughtView[]> {
  const slugs = thought.collections.map((c) => c.slug);

  const related = slugs.length
    ? await db.video.findMany({
        where: {
          userId,
          ...PUBLIC_FILTER,
          id: { not: thought.id },
          collections: { some: { slug: { in: slugs } } },
        },
        take: limit,
        orderBy: { createdAt: "desc" },
        include: THOUGHT_INCLUDE,
      })
    : [];

  if (related.length >= limit) return related.map(toThoughtView);

  const filler = await db.video.findMany({
    where: {
      userId,
      ...PUBLIC_FILTER,
      id: { notIn: [thought.id, ...related.map((r) => r.id)] },
    },
    take: limit - related.length,
    orderBy: { createdAt: "desc" },
    include: THOUGHT_INCLUDE,
  });

  return [...related, ...filler].map(toThoughtView);
}

/** Collections that actually contain something, with counts. */
export async function getCollectionsWithCounts(userId: string) {
  const rows = await db.collection.findMany({
    orderBy: { position: "asc" },
    include: {
      _count: { select: { videos: { where: { userId, ...PUBLIC_FILTER } } } },
    },
  });

  // An empty collection page is a dead end — hide it until it has content.
  return rows
    .filter((c) => c._count.videos > 0)
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      description: c.description,
      count: c._count.videos,
    }));
}

/* ── platform mode (PRIMARY_HANDLE unset) ──────────────────── */

export async function getFeed(limit = 24): Promise<ThoughtView[]> {
  const rows = await db.video.findMany({
    where: PUBLIC_FILTER,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: THOUGHT_INCLUDE,
  });
  return rows.map(toThoughtView);
}

export async function getFeaturedCreators(limit = 6): Promise<CreatorView[]> {
  const users = await db.user.findMany({
    where: { suspended: false, approved: true, videos: { some: PUBLIC_FILTER } },
    orderBy: [{ featured: "desc" }, { createdAt: "asc" }],
    take: limit,
    include: {
      _count: {
        select: { videos: { where: PUBLIC_FILTER }, followers: true },
      },
    },
  });

  return users.map((user) => ({
    id: user.id,
    handle: user.handle,
    displayName: user.displayName,
    tagline: user.tagline,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    bannerUrl: user.bannerUrl,
    links: user.links?.split("\n").map((l) => l.trim()).filter(Boolean) ?? [],
    verified: user.verified,
    canSell: user.canSell,
    approved: user.approved,
    thoughtCount: user._count.videos,
    followerCount: user._count.followers,
  }));
}
