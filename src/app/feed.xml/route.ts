import { db } from "@/lib/db";
import { PUBLIC_FILTER } from "@/lib/creators";
import { config, soloMode } from "@/lib/config";
import { brand } from "@/lib/brand";

/**
 * RSS.
 *
 * Unfashionable and worth having: it's the one way someone can follow this
 * without an account, an algorithm, or handing over an email address —
 * which is exactly the relationship this site is trying to have with people.
 */
export const revalidate = 3600;

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const thoughts = await db.video.findMany({
    where: {
      ...PUBLIC_FILTER,
      ...(soloMode ? { user: { handle: config.primaryHandle } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { handle: true, displayName: true } } },
  });

  const items = thoughts
    .map((t) => {
      const url = `${config.siteUrl}/@${t.user.handle}/thoughts/${t.slug}`;
      return `    <item>
      <title>${escapeXml(t.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${t.createdAt.toUTCString()}</pubDate>
      <description>${escapeXml(t.summary ?? t.hook)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(brand.name)}</title>
    <link>${config.siteUrl}</link>
    <description>${escapeXml(brand.metaDescription)}</description>
    <language>en</language>
    <atom:link href="${config.siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
