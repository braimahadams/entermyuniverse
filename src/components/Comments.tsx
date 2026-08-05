"use client";

import Link from "next/link";
import { useState } from "react";
import type { CommentView } from "@/lib/types";

/**
 * Replies.
 *
 * No account, no login, no "sign in to comment" wall — a name and the
 * words. Everything waits for approval, which is what makes that safe:
 * spam never reaches a reader, so the front door can stay open.
 *
 * The reply box says so plainly. People are far more patient about
 * moderation they were told about in advance than about a comment that
 * silently vanishes.
 */
export function Comments({
  postId,
  comments,
  handle,
}: {
  postId: string;
  comments: CommentView[];
  handle: string;
}) {
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");

    try {
      const res = await fetch(`/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, authorName: name, body }),
      });
      const data = await res.json();

      if (res.ok) {
        setState("done");
        setMessage(data.message ?? "Sent. It'll appear once it's been read.");
        setBody("");
      } else {
        setState("error");
        setMessage(data.error ?? "That didn't send.");
      }
    } catch {
      setState("error");
      setMessage("Network trouble. Try again in a moment.");
    }
  }

  return (
    <section className="mt-16 border-t border-line pt-12" id="replies">
      <h2 className="display text-2xl">
        {comments.length > 0
          ? `${comments.length} ${comments.length === 1 ? "reply" : "replies"}`
          : "Replies"}
      </h2>

      {comments.length > 0 && (
        <ol className="mt-8 space-y-8">
          {comments.map((comment) => (
            <li key={comment.id} className="border-l border-line pl-5">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-sm font-medium text-bone">
                  {comment.authorName}
                </span>
                <time
                  dateTime={comment.createdAt}
                  className="font-mono text-[11px] text-bone-faint"
                >
                  {new Intl.DateTimeFormat("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(comment.createdAt))}
                </time>
              </div>

              {/* A reply that reaches back to an older thought. This is the
                  point of keeping an archive rather than a feed. */}
              {comment.citedPost && (
                <Link
                  href={`/@${comment.citedPost.handle}/thoughts/${comment.citedPost.slug}`}
                  className="mt-2 flex items-center gap-2 text-xs text-bone-faint transition-colors hover:text-ember"
                >
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <path
                      d="M1 6h10M7 2l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  on “{comment.citedPost.title}”
                </Link>
              )}

              <p className="mt-2.5 whitespace-pre-wrap text-[0.95rem] leading-relaxed text-bone-dim">
                {comment.body}
              </p>
            </li>
          ))}
        </ol>
      )}

      {state === "done" ? (
        <p className="mt-10 rounded-2xl border border-ember/35 bg-ember/[0.07] px-5 py-4 text-sm text-bone-dim">
          {message}
        </p>
      ) : (
        <form onSubmit={submit} className="mt-10 space-y-3">
          <label htmlFor="reply-name" className="sr-only">
            Your name
          </label>
          <input
            id="reply-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={60}
            placeholder="Your name"
            autoComplete="name"
            className="w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-bone placeholder:text-bone-faint focus:border-ember focus:outline-none"
          />

          <label htmlFor="reply-body" className="sr-only">
            Your reply
          </label>
          <textarea
            id="reply-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={4}
            maxLength={3000}
            placeholder="What did this make you think?"
            className="w-full resize-y rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm leading-relaxed text-bone placeholder:text-bone-faint focus:border-ember focus:outline-none"
          />

          {state === "error" && (
            <p className="text-sm text-ember">{message}</p>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={state === "sending"}
              className="rounded-full bg-bone px-6 py-3 text-sm font-semibold text-ink transition-transform enabled:hover:scale-[1.02] disabled:opacity-50"
            >
              {state === "sending" ? "Sending…" : "Reply"}
            </button>
            <span className="text-xs text-bone-faint">
              Read before it appears. No account, no email required.
            </span>
          </div>
        </form>
      )}
    </section>
  );
}
