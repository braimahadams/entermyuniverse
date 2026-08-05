"use client";

import { useRef, useState } from "react";
import { FilmUploader, type UploadResult } from "@/components/FilmUploader";
import { deletePost, savePost } from "@/app/studio/actions";

export type CollectionOption = { slug: string; name: string };

export type StudioPost = {
  id: string;
  slug: string;
  title: string | null;
  body: string;
  openQuestion: string | null;
  transcript: string | null;
  collections: string[];
  pinned: boolean;
  published: boolean;
  approved: boolean;
  moderationNote: string | null;
  sourceId: string | null;
  thumbnailUrl: string | null;
  durationSec: number | null;
  sizeBytes: number | null;
  publishedAt: string;
};

/**
 * The composer.
 *
 * One textarea, focused, and a Post button. Everything else — a title,
 * collections, a video, the open question — is folded away behind
 * "Add details", because the moment writing a thought feels like filling
 * in a form is the moment thoughts stop getting written down.
 *
 * Cmd/Ctrl+Enter submits, since that's the muscle memory from every other
 * box like this.
 */
export function Composer({
  collections,
  storageProvider,
}: {
  collections: CollectionOption[];
  storageProvider: "local" | "blob";
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [body, setBody] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [upload, setUpload] = useState<UploadResult | null>(null);
  const [saving, setSaving] = useState(false);

  function onKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && body.trim()) {
      formRef.current?.requestSubmit();
    }
  }

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        setSaving(true);
        await savePost(formData);
        // Clear only after the server confirms — losing what you wrote to
        // an optimistic reset would be unforgivable.
        setBody("");
        setUpload(null);
        setExpanded(false);
        setSaving(false);
      }}
      className="card rounded-2xl p-5 sm:p-6"
    >
      <input type="hidden" name="sourceId" value={upload?.key ?? ""} />
      <input
        type="hidden"
        name="durationSec"
        value={upload?.durationSec ?? ""}
      />
      <input type="hidden" name="sizeBytes" value={upload?.sizeBytes ?? ""} />

      <label htmlFor="compose" className="sr-only">
        What are you thinking?
      </label>
      <textarea
        id="compose"
        name="body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={onKeyDown}
        rows={body.length > 200 ? 10 : 5}
        placeholder="What's on your mind?"
        className="w-full resize-y bg-transparent text-[1.0625rem] leading-[1.7] text-bone placeholder:text-bone-faint focus:outline-none"
      />

      {expanded && (
        <div className="mt-5 space-y-5 border-t border-line pt-5">
          <Field label="Title" hint="Optional. Most thoughts don't need one.">
            <input name="title" className={input} placeholder="Leave blank to use the opening line" />
          </Field>

          <Field
            label="Collections"
            hint="What it's about. This is how people find it later."
          >
            <div className="flex flex-wrap gap-2">
              {collections.map((c) => (
                <label
                  key={c.slug}
                  className="cursor-pointer select-none rounded-full border border-line px-3.5 py-1.5 text-xs text-bone-dim transition-colors has-[:checked]:border-ember/50 has-[:checked]:bg-ember/10 has-[:checked]:text-ember hover:border-line-bright"
                >
                  <input
                    type="checkbox"
                    name="collections"
                    value={c.slug}
                    className="sr-only"
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </Field>

          <Field
            label="Open question"
            hint="The question this leaves hanging. Shown at the end and carried into the booking form."
          >
            <textarea
              name="openQuestion"
              rows={2}
              className={`${input} resize-none`}
            />
          </Field>

          <Field label="Video" hint="Optional. Say it out loud as well.">
            <FilmUploader provider={storageProvider} onUploaded={setUpload} />
          </Field>

          {upload && (
            <Field label="Transcript" hint="Paste the spoken words — it's what makes a video findable.">
              <textarea
                name="transcript"
                rows={5}
                className={`${input} resize-y font-mono text-xs leading-relaxed`}
              />
            </Field>
          )}

          <label className="flex items-center gap-2.5 text-sm text-bone-dim">
            <input
              type="checkbox"
              name="pinned"
              className="h-4 w-4 accent-[var(--color-ember)]"
            />
            Start here — show this to first-time visitors
          </label>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <button
          type="submit"
          disabled={!body.trim() || saving}
          className="rounded-full bg-bone px-6 py-2.5 text-sm font-semibold text-ink transition-transform enabled:hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? "Posting…" : "Post"}
        </button>

        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="text-sm text-bone-faint transition-colors hover:text-bone"
        >
          {expanded ? "Fewer details" : "Add details"}
        </button>

        <span className="ml-auto hidden text-xs text-bone-faint sm:block">
          ⌘↵ to post
        </span>
      </div>
    </form>
  );
}

/** Editing an existing post. Same fields, all visible — you're here on purpose. */
export function PostEditor({
  post,
  collections,
  storageProvider,
}: {
  post: StudioPost;
  collections: CollectionOption[];
  storageProvider: "local" | "blob";
}) {
  const [upload, setUpload] = useState<UploadResult | null>(null);
  const sourceId = upload?.key ?? post.sourceId ?? "";

  return (
    <form action={savePost} className="mt-5 space-y-5 border-t border-line pt-5">
      <input type="hidden" name="id" value={post.id} />
      <input type="hidden" name="sourceId" value={sourceId} />
      <input
        type="hidden"
        name="durationSec"
        value={upload?.durationSec ?? post.durationSec ?? ""}
      />
      <input
        type="hidden"
        name="sizeBytes"
        value={upload?.sizeBytes ?? post.sizeBytes ?? ""}
      />
      <input
        type="hidden"
        name="thumbnailUrl"
        value={post.thumbnailUrl ?? ""}
      />

      <Field label="Thought">
        <textarea
          name="body"
          defaultValue={post.body}
          rows={8}
          required
          className={`${input} resize-y leading-relaxed`}
        />
      </Field>

      <Field label="Title" hint="Optional.">
        <input name="title" defaultValue={post.title ?? ""} className={input} />
      </Field>

      <Field label="Collections">
        <div className="flex flex-wrap gap-2">
          {collections.map((c) => (
            <label
              key={c.slug}
              className="cursor-pointer select-none rounded-full border border-line px-3.5 py-1.5 text-xs text-bone-dim transition-colors has-[:checked]:border-ember/50 has-[:checked]:bg-ember/10 has-[:checked]:text-ember hover:border-line-bright"
            >
              <input
                type="checkbox"
                name="collections"
                value={c.slug}
                defaultChecked={post.collections.includes(c.slug)}
                className="sr-only"
              />
              {c.name}
            </label>
          ))}
        </div>
      </Field>

      <Field label="Open question">
        <textarea
          name="openQuestion"
          rows={2}
          defaultValue={post.openQuestion ?? ""}
          className={`${input} resize-none`}
        />
      </Field>

      <details className="rounded-xl border border-line p-4">
        <summary className="cursor-pointer text-xs text-bone-dim">
          {post.sourceId ? "Replace the video" : "Attach a video"}
        </summary>
        <div className="mt-4">
          <FilmUploader provider={storageProvider} onUploaded={setUpload} />
        </div>
        {sourceId && (
          <p className="mt-3 break-all text-xs text-bone-faint">
            Current: <code className="text-bone-dim">{sourceId}</code>
          </p>
        )}
      </details>

      {sourceId && (
        <Field label="Transcript">
          <textarea
            name="transcript"
            rows={6}
            defaultValue={post.transcript ?? ""}
            className={`${input} resize-y font-mono text-xs leading-relaxed`}
          />
        </Field>
      )}

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2.5 text-sm text-bone-dim">
          <input
            type="checkbox"
            name="published"
            value="on"
            defaultChecked={post.published}
            className="h-4 w-4 accent-[var(--color-ember)]"
          />
          Published
        </label>
        <label className="flex items-center gap-2.5 text-sm text-bone-dim">
          <input
            type="checkbox"
            name="pinned"
            defaultChecked={post.pinned}
            className="h-4 w-4 accent-[var(--color-ember)]"
          />
          Start here
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-1">
        <button
          type="submit"
          className="rounded-full bg-bone px-6 py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.02]"
        >
          Save
        </button>
        <button
          type="submit"
          formAction={deletePost}
          className="text-xs text-bone-faint transition-colors hover:text-ember"
        >
          Delete
        </button>
      </div>
    </form>
  );
}

const input =
  "w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-bone placeholder:text-bone-faint focus:border-ember focus:outline-none";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-bone-faint">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1.5 block text-xs leading-relaxed text-bone-faint">
          {hint}
        </span>
      )}
    </label>
  );
}
