import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { config } from "@/lib/config";
import { togglePinned } from "@/app/studio/actions";
import { Composer, PostEditor } from "@/app/studio/write/Composer";
import { dayLabel, postTitle, timeLabel } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function StudioWritePage() {
  const user = await requireUser();

  const [posts, collections] = await Promise.all([
    db.post.findMany({
      where: { userId: user.id },
      orderBy: { publishedAt: "desc" },
      include: { collections: { select: { slug: true } } },
    }),
    db.collection.findMany({ orderBy: { position: "asc" } }),
  ]);

  const options = collections.map((c) => ({ slug: c.slug, name: c.name }));

  return (
    <>
      <div className="mb-6">
        <h1 className="display text-3xl">Write</h1>
        <p className="mt-2 text-sm text-bone-dim">
          Whatever just occurred to you. It doesn&rsquo;t have to be finished.
        </p>
      </div>

      <Composer
        collections={options}
        storageProvider={config.storage.provider}
      />

      {posts.length > 0 && (
        <>
          <h2 className="mb-4 mt-12 text-[11px] uppercase tracking-[0.2em] text-bone-faint">
            {posts.length} {posts.length === 1 ? "thought" : "thoughts"}
          </h2>

          <div className="space-y-3">
            {posts.map((post) => (
              <details key={post.id} className="card rounded-2xl p-5">
                <summary className="flex cursor-pointer flex-wrap items-start justify-between gap-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-bone">
                      {postTitle(post)}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-bone-faint">
                      <span className="font-mono">
                        {dayLabel(post.publishedAt, user.timezone)},{" "}
                        {timeLabel(post.publishedAt, user.timezone)}
                      </span>
                      {post.pinned && (
                        <span className="text-ember">Start here</span>
                      )}
                      {!post.published && <span>Draft</span>}
                      {!post.approved && (
                        <span className="text-ember">Hidden by a moderator</span>
                      )}
                      {post.sourceId && <span>Video</span>}
                    </span>
                  </span>
                </summary>

                {!post.approved && post.moderationNote && (
                  <p className="mt-4 rounded-xl border border-ember/35 bg-ember/[0.07] px-4 py-3 text-sm text-bone-dim">
                    {post.moderationNote}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
                  <Link
                    href={`/@${user.handle}/thoughts/${post.slug}`}
                    target="_blank"
                    className="text-bone-dim underline underline-offset-4 hover:text-bone"
                  >
                    View ↗
                  </Link>
                  <form action={togglePinned}>
                    <input type="hidden" name="id" value={post.id} />
                    <button className="text-bone-faint transition-colors hover:text-ember">
                      {post.pinned ? "Unpin" : "Pin to start here"}
                    </button>
                  </form>
                </div>

                <PostEditor
                  post={{
                    id: post.id,
                    slug: post.slug,
                    title: post.title,
                    body: post.body,
                    openQuestion: post.openQuestion,
                    transcript: post.transcript,
                    collections: post.collections.map((c) => c.slug),
                    pinned: post.pinned,
                    published: post.published,
                    approved: post.approved,
                    moderationNote: post.moderationNote,
                    sourceId: post.sourceId,
                    thumbnailUrl: post.thumbnailUrl,
                    durationSec: post.durationSec,
                    sizeBytes: post.sizeBytes,
                    publishedAt: post.publishedAt.toISOString(),
                  }}
                  collections={options}
                  storageProvider={config.storage.provider}
                />
              </details>
            ))}
          </div>
        </>
      )}
    </>
  );
}
