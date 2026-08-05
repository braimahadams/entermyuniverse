import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { moderateComment } from "@/app/studio/actions";
import { postTitle } from "@/lib/posts";

export const dynamic = "force-dynamic";

/**
 * The moderation queue.
 *
 * Nothing published here has been seen by a stranger before it was seen by
 * the author. That's what lets the reply form stay open to anyone without
 * an account — the cost is this page, and the cost is worth it.
 */
export default async function StudioRepliesPage() {
  const user = await requireUser();

  const comments = await db.comment.findMany({
    where: { post: { userId: user.id } },
    orderBy: [{ approved: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      post: { select: { slug: true, title: true, body: true } },
    },
  });

  const waiting = comments.filter((c) => !c.approved);
  const published = comments.filter((c) => c.approved);

  return (
    <>
      <div className="mb-8">
        <h1 className="display text-3xl">Replies</h1>
        <p className="mt-2 text-sm text-bone-dim">
          Nothing appears on the site until you&rsquo;ve read it.
        </p>
      </div>

      {comments.length === 0 && (
        <p className="card rounded-2xl p-10 text-center text-sm text-bone-dim">
          No replies yet.
        </p>
      )}

      {waiting.length > 0 && (
        <>
          <h2 className="mb-4 text-[11px] uppercase tracking-[0.2em] text-ember">
            Waiting · {waiting.length}
          </h2>
          <div className="mb-12 space-y-3">
            {waiting.map((c) => (
              <Row
                key={c.id}
                comment={c}
                handle={user.handle}
                showApprove
              />
            ))}
          </div>
        </>
      )}

      {published.length > 0 && (
        <>
          <h2 className="mb-4 text-[11px] uppercase tracking-[0.2em] text-bone-faint">
            Published
          </h2>
          <div className="space-y-3">
            {published.map((c) => (
              <Row key={c.id} comment={c} handle={user.handle} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

type Row = {
  id: string;
  authorName: string;
  authorEmail: string | null;
  body: string;
  approved: boolean;
  createdAt: Date;
  post: { slug: string; title: string | null; body: string };
};

function Row({
  comment,
  handle,
  showApprove,
}: {
  comment: Row;
  handle: string;
  showApprove?: boolean;
}) {
  return (
    <article
      className={`card rounded-2xl p-5 ${
        showApprove ? "border-ember/30" : ""
      }`}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-sm font-medium text-bone">
          {comment.authorName}
        </span>
        <time className="font-mono text-[11px] text-bone-faint">
          {new Intl.DateTimeFormat("en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).format(comment.createdAt)}
        </time>
        {comment.authorEmail && (
          <a
            href={`mailto:${comment.authorEmail}`}
            className="text-[11px] text-bone-faint underline underline-offset-4 hover:text-bone"
          >
            {comment.authorEmail}
          </a>
        )}
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-bone-dim">
        {comment.body}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-line pt-3 text-xs">
        <Link
          href={`/@${handle}/thoughts/${comment.post.slug}`}
          target="_blank"
          className="min-w-0 truncate text-bone-faint transition-colors hover:text-bone"
        >
          on “{postTitle(comment.post)}” ↗
        </Link>

        <div className="ml-auto flex items-center gap-3">
          <form action={moderateComment}>
            <input type="hidden" name="id" value={comment.id} />
            <input
              type="hidden"
              name="action"
              value={comment.approved ? "hide" : "approve"}
            />
            <button
              className={`rounded-full border px-3.5 py-1.5 transition-colors ${
                comment.approved
                  ? "border-line text-bone-dim hover:border-line-bright hover:text-bone"
                  : "border-ember/50 bg-ember/10 text-ember hover:bg-ember/20"
              }`}
            >
              {comment.approved ? "Hide" : "Publish"}
            </button>
          </form>

          <form action={moderateComment}>
            <input type="hidden" name="id" value={comment.id} />
            <input type="hidden" name="action" value="delete" />
            <button className="text-bone-faint transition-colors hover:text-ember">
              Delete
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}
