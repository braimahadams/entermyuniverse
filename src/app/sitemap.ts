import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { PUBLIC_FILTER } from "@/lib/creators";
import { config, soloMode } from "@/lib/config";

/**
 * Sitemap.
 *
 * Served at /sitemap.xml and regenerated hourly. Matters more than usual
 * here: thought pages are linked from the library rather than the
 * homepage, so without this a crawler could take a long time to find the
 * deeper ones.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const thoughts = await db.video.findMany({
    where: PUBLIC_FILTER,
    select: {
      slug: true,
      updatedAt: true,
      coreThought: true,
      user: { select: { handle: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const creators = await db.user.findMany({
    where: { suspended: false, approved: true, videos: { some: PUBLIC_FILTER } },
    select: { handle: true, updatedAt: true },
  });

  const entries: MetadataRoute.Sitemap = [
    {
      url: config.siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  for (const creator of creators) {
    // In solo mode the root already redirects here, so listing both would
    // be duplicate content pointing at the same page.
    if (!soloMode || creator.handle !== config.primaryHandle) {
      entries.push({
        url: `${config.siteUrl}/@${creator.handle}`,
        lastModified: creator.updatedAt,
        changeFrequency: "weekly",
        priority: 0.9,
      });
    }
    entries.push({
      url: `${config.siteUrl}/@${creator.handle}/thoughts`,
      lastModified: creator.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const thought of thoughts) {
    entries.push({
      url: `${config.siteUrl}/@${thought.user.handle}/thoughts/${thought.slug}`,
      lastModified: thought.updatedAt,
      changeFrequency: "monthly",
      priority: thought.coreThought ? 0.9 : 0.7,
    });
  }

  return entries;
}
