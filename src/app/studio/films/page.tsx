import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { config } from "@/lib/config";
import { FilmEditor } from "@/app/studio/films/FilmEditor";

export const dynamic = "force-dynamic";

export default async function StudioFilmsPage() {
  const user = await requireUser();

  const films = await db.video.findMany({
    where: { userId: user.id },
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
  });

  const totalBytes = films.reduce((sum, f) => sum + (f.sizeBytes ?? 0), 0);

  return (
    <>
      <div className="mb-8">
        <h1 className="display text-3xl">Films</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bone-dim">
          Vertical looks best — it&rsquo;s the shape everything gets shot in
          and the shape the grid is built for.
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
        films={films.map((f) => ({
          id: f.id,
          slug: f.slug,
          title: f.title,
          hook: f.hook,
          description: f.description,
          openQuestion: f.openQuestion,
          topic: f.topic,
          sourceId: f.sourceId,
          thumbnailUrl: f.thumbnailUrl,
          durationSec: f.durationSec,
          sizeBytes: f.sizeBytes,
          published: f.published,
          approved: f.approved,
          moderationNote: f.moderationNote,
          position: f.position,
        }))}
      />
    </>
  );
}
