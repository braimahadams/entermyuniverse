import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { config } from "@/lib/config";
import { FilmEditor } from "@/app/studio/films/FilmEditor";

export const dynamic = "force-dynamic";

export default async function StudioThoughtsPage() {
  const user = await requireUser();

  const [thoughts, collections] = await Promise.all([
    db.video.findMany({
      where: { userId: user.id },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      include: { collections: { select: { slug: true } } },
    }),
    db.collection.findMany({ orderBy: { position: "asc" } }),
  ]);

  const totalBytes = thoughts.reduce((sum, t) => sum + (t.sizeBytes ?? 0), 0);

  return (
    <>
      <div className="mb-8">
        <h1 className="display text-3xl">Thoughts</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bone-dim">
          Vertical looks best — it&rsquo;s the shape you shoot in and the shape
          the library is built for.
          {totalBytes > 0 && (
            <>
              {" "}
              You&rsquo;re using{" "}
              <span className="text-bone">
                {(totalBytes / 1024 / 1024).toFixed(0)} MB
              </span>
              .
            </>
          )}
        </p>
      </div>

      <FilmEditor
        storageProvider={config.storage.provider}
        allCollections={collections.map((c) => ({
          slug: c.slug,
          name: c.name,
        }))}
        films={thoughts.map((t) => ({
          id: t.id,
          slug: t.slug,
          title: t.title,
          hook: t.hook,
          summary: t.summary,
          description: t.description,
          openQuestion: t.openQuestion,
          transcript: t.transcript,
          collections: t.collections.map((c) => c.slug),
          coreThought: t.coreThought,
          sourceId: t.sourceId,
          thumbnailUrl: t.thumbnailUrl,
          durationSec: t.durationSec,
          sizeBytes: t.sizeBytes,
          published: t.published,
          approved: t.approved,
          moderationNote: t.moderationNote,
          position: t.position,
        }))}
      />
    </>
  );
}
