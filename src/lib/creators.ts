import { db } from "@/lib/db";
import { readingMinutes } from "@/lib/collections";
import { config } from "@/lib/config";
import type { PostView } from "@/lib/types";

/** Every read the public pages make. */

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
  /** The author's own zone. Timeline days are grouped in it. */
  timezone: string;
  postCount: number;
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

const AUTHOR_SELECT = {
  handle: true,
  displayName: true,
  avatarUrl: true,
  verified: true,
  canSell: true,
} as const;

/** Everything a post needs, in one shape, so reads stay consistent. */
const POST_INCLUDE = {
  user: { select: AUTHOR_SELECT },
  collections: {
    select: { slug: true, name: true },
    orderBy: { position: "asc" },
  },
  _count: { select: { comments: { where: { approved: true } } } },
} as const;

type PostRow = {
  id: string;
  slug: string;
  title: string | null;
  body: string;
  openQuestion: string | null;
  pinned: boolean;
  publishedAt: Date;
  collections: { slug: string; name: string }[];
  _count?: { comments: number };
  user?: {
    handle: string;
    displayName: string;
    avatarUrl: string | null;
    verified: boolean;
    canSell: boolean;
  } | null;
};

export function toPostView(row: PostRow): PostView {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    body: row.body,
    openQuestion: row.openQuestion,
    collections: row.collections,
    pinned: row.pinned,
    publishedAt: row.publishedAt.toISOString(),
    // Derived, not stored — a stored count goes stale the moment the
    // text is edited.
    readingMin: readingMinutes(row.body),
    commentCount: row._count?.comments ?? 0,
    author: row.user
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
      _count: { select: { posts: { where: PUBLIC_FILTER }, followers: true } },
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
    timezone: user.timezone,
    postCount: user._count.posts,
    followerCount: user._count.followers,
  };
}

/**
 * The timeline. Newest first — this is the archive in the order it happened.
 */
export async function getTimeline(
  userId: string,
  options: { collection?: string; limit?: number; skip?: number } = {},
): Promise<PostView[]> {
  const rows = await db.post.findMany({
    where: {
      userId,
      ...PUBLIC_FILTER,
      ...(options.collection
        ? { collections: { some: { slug: options.collection } } }
        : {}),
    },
    orderBy: { publishedAt: "desc" },
    take: options.limit,
    skip: options.skip,
    include: POST_INCLUDE,
  });

  return rows.map(toPostView);
}

/**
 * "Start here."
 *
 * The posts marked by hand as worth meeting a stranger with. Deliberately
 * not "most recent" and not "most read": a first impression shouldn't be
 * decided by whatever happened to be written last night.
 */
export async function getPinned(
  userId: string,
  limit = 3,
): Promise<PostView[]> {
  const rows = await db.post.findMany({
    where: { userId, pinned: true, ...PUBLIC_FILTER },
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: POST_INCLUDE,
  });

  return rows.map(toPostView);
}

/** One post, by handle and slug. Null unless it's publicly visible. */
export async function getPost(
  handle: string,
  slug: string,
): Promise<PostView | null> {
  const row = await db.post.findFirst({
    where: {
      slug,
      ...PUBLIC_FILTER,
      // Merged, not spread after: PUBLIC_FILTER carries its own `user`
      // clause, and a second `user` key would silently replace it —
      // taking the suspended/approved checks with it.
      user: { ...PUBLIC_FILTER.user, handle: handle.toLowerCase() },
    },
    include: POST_INCLUDE,
  });

  if (!row) return null;
  return toPostView(row);
}

/**
 * What to read next.
 *
 * Prefers posts sharing a collection — someone who just read about fear
 * is, at that moment, interested in fear. Tops up chronologically so the
 * slot is never empty.
 */
export async function getRelatedPosts(
  post: PostView,
  userId: string,
  limit = 3,
): Promise<PostView[]> {
  const slugs = post.collections.map((c) => c.slug);

  const related = slugs.length
    ? await db.post.findMany({
        where: {
          userId,
          ...PUBLIC_FILTER,
          id: { not: post.id },
          collections: { some: { slug: { in: slugs } } },
        },
        take: limit,
        orderBy: { publishedAt: "desc" },
        include: POST_INCLUDE,
      })
    : [];

  if (related.length >= limit) return related.map(toPostView);

  const filler = await db.post.findMany({
    where: {
      userId,
      ...PUBLIC_FILTER,
      id: { notIn: [post.id, ...related.map((r) => r.id)] },
    },
    take: limit - related.length,
    orderBy: { publishedAt: "desc" },
    include: POST_INCLUDE,
  });

  return [...related, ...filler].map(toPostView);
}

/** Collections that actually contain something, with counts. */
export async function getCollectionsWithCounts(userId: string) {
  const rows = await db.collection.findMany({
    orderBy: { position: "asc" },
    include: {
      _count: { select: { posts: { where: { userId, ...PUBLIC_FILTER } } } },
    },
  });

  // An empty collection page is a dead end — hide it until it has content.
  return rows
    .filter((c) => c._count.posts > 0)
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      description: c.description,
      count: c._count.posts,
    }));
}

/* ── platform mode (PRIMARY_HANDLE unset) ──────────────────── */

export async function getFeed(limit = 24): Promise<PostView[]> {
  const rows = await db.post.findMany({
    where: PUBLIC_FILTER,
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: POST_INCLUDE,
  });
  return rows.map(toPostView);
}

export async function getFeaturedCreators(limit = 6): Promise<CreatorView[]> {
  const users = await db.user.findMany({
    where: { suspended: false, approved: true, posts: { some: PUBLIC_FILTER } },
    orderBy: [{ featured: "desc" }, { createdAt: "asc" }],
    take: limit,
    include: {
      _count: { select: { posts: { where: PUBLIC_FILTER }, followers: true } },
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
    timezone: user.timezone,
    postCount: user._count.posts,
    followerCount: user._count.followers,
  }));
}
