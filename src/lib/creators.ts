import { db } from "@/lib/db";
import { resolveVideo } from "@/lib/providers/video";
import type { FilmView } from "@/lib/types";

/**
 * Reads shared by the feed and the universe pages.
 *
 * Everything here resolves provider URLs server-side, so the browser never
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
  /** Approved to publish. Gates whether anyone but the owner sees films. */
  approved: boolean;
  filmCount: number;
  followerCount: number;
};

/**
 * Rows a visitor is allowed to see: published, not moderated away, and
 * belonging to a creator who is both approved to publish and not suspended.
 */
export const PUBLIC_VIDEO_FILTER = {
  published: true,
  approved: true,
  user: { suspended: false, approved: true },
} as const;

type VideoRow = {
  id: string;
  slug: string;
  title: string;
  hook: string;
  description: string | null;
  openQuestion: string | null;
  topic: string;
  durationSec: number | null;
  featured: boolean;
  sourceId: string;
  thumbnailUrl: string | null;
  user?: {
    handle: string;
    displayName: string;
    avatarUrl: string | null;
    verified: boolean;
    canSell: boolean;
  };
};

export function toFilmView(video: VideoRow): FilmView {
  const source = resolveVideo(video.sourceId, video.thumbnailUrl);
  return {
    id: video.id,
    slug: video.slug,
    title: video.title,
    hook: video.hook,
    description: video.description,
    openQuestion: video.openQuestion,
    topic: video.topic,
    durationSec: video.durationSec,
    featured: video.featured,
    src: source.url,
    kind: source.kind,
    poster: source.poster,
    creator: video.user
      ? {
          handle: video.user.handle,
          displayName: video.user.displayName,
          avatarUrl: video.user.avatarUrl,
          verified: video.user.verified,
          canSell: video.user.canSell,
        }
      : null,
  };
}

const CREATOR_SELECT = {
  handle: true,
  displayName: true,
  avatarUrl: true,
  verified: true,
  canSell: true,
} as const;

/** The cross-creator feed on the front page. */
export async function getFeed(limit = 24): Promise<FilmView[]> {
  const videos = await db.video.findMany({
    where: PUBLIC_VIDEO_FILTER,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: { user: { select: CREATOR_SELECT } },
  });

  return videos.map(toFilmView);
}

/** Creators to put in front of people who've just arrived. */
export async function getFeaturedCreators(limit = 6): Promise<CreatorView[]> {
  const users = await db.user.findMany({
    where: {
      suspended: false,
      approved: true,
      // Nobody wants to open an empty universe.
      videos: { some: PUBLIC_VIDEO_FILTER },
    },
    orderBy: [{ featured: "desc" }, { createdAt: "asc" }],
    take: limit,
    include: {
      _count: {
        select: {
          videos: { where: PUBLIC_VIDEO_FILTER },
          followers: true,
        },
      },
    },
  });

  return users.map(toCreatorView);
}

export async function getCreatorByHandle(
  handle: string,
): Promise<CreatorView | null> {
  const user = await db.user.findUnique({
    where: { handle: handle.toLowerCase() },
    include: {
      _count: {
        select: {
          videos: { where: PUBLIC_VIDEO_FILTER },
          followers: true,
        },
      },
    },
  });

  if (!user || user.suspended) return null;
  return toCreatorView(user);
}

type UserRow = {
  id: string;
  handle: string;
  displayName: string;
  tagline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  links: string | null;
  verified: boolean;
  canSell: boolean;
  approved: boolean;
  _count: { videos: number; followers: number };
};

function toCreatorView(user: UserRow): CreatorView {
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
    filmCount: user._count.videos,
    followerCount: user._count.followers,
  };
}

/**
 * A creator's own films, for their universe page.
 *
 * `visible` is false when the viewer is a stranger and the account hasn't
 * been approved yet — the page then renders its normal empty state rather
 * than a special "pending" message, so an unapproved account looks exactly
 * like a new one with nothing published, not like a rejection.
 */
export async function getCreatorFilms(
  userId: string,
  visible = true,
): Promise<FilmView[]> {
  if (!visible) return [];

  const videos = await db.video.findMany({
    where: { userId, published: true, approved: true },
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    include: { user: { select: CREATOR_SELECT } },
  });

  return videos.map(toFilmView);
}
