"use client";

import { useEffect, useRef, useState } from "react";
import { deletePost, savePost } from "@/app/studio/actions";

export type CollectionOption = { slug: string; name: string };

export type StudioPost = {
  id: string;
  slug: string;
  title: string | null;
  body: string;
  openQuestion: string | null;
  collections: string[];
  pinned: boolean;
  published: boolean;
  approved: boolean;
  moderationNote: string | null;
  publishedAt: string;
};

/**
 * A textarea that grows with what's in it.
 *
 * A fixed box with an inner scrollbar is the single most discouraging
 * thing you can put in front of someone writing something long — you lose
 * sight of the paragraph above the one you're on. This grows instead, so
 * the page scrolls and the text never does.
 *
 * Height is reset to `auto` before measuring, because scrollHeight can
 * only ever report a value >= the current height; without the reset the
 * box would grow and never shrink back when text is deleted.
 */
function useAutoGrow(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return ref;
}

/**
 * The composer.
 *
 * A title, a body, and Post. Collections, the open question and the
 * "start here" flag fold away behind "Add details" — the moment writing a
 * thought feels like filling in a form is the moment thoughts stop getting
 * written down.
 */
export function Composer({ collections }: { collections: CollectionOption[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  const bodyRef = useAutoGrow(body);

  function onKeyDown(e: React.KeyboardEvent) {
    // The muscle memory from every other box like this.
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
        // Cleared only after the server confirms — losing what you wrote
        // to an optimistic reset would be unforgivable.
        setTitle("");
        setBody("");
        setExpanded(false);
        setSaving(false);
      }}
      className="card rounded-2xl p-5 sm:p-7"
    >
      <label htmlFor="compose-title" className="sr-only">
        Title
      </label>
      <input
        id="compose-title"
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Title"
        maxLength={160}
        className="display w-full bg-transparent text-2xl leading-snug text-bone placeholder:text-bone-faint/70 focus:outline-none sm:text-3xl"
      />

      <label htmlFor="compose-body" className="sr-only">
        What are you thinking?
      </label>
      <textarea
        id="compose-body"
        name="body"
        ref={bodyRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={onKeyDown}
        rows={4}
        placeholder="What's on your mind?"
        // resize-none because the box sizes itself; a drag handle that
        // fights the auto-grow is worse than no handle.
        className="mt-4 w-full resize-none overflow-hidden bg-transparent text-[1.0625rem] leading-[1.75] text-bone/90 placeholder:text-bone-faint focus:outline-none"
      />

      {expanded && (
        <div className="mt-5 space-y-5 border-t border-line pt-5">
          <Field
            label="Collections"
            hint="What it's about. This is how someone finds it a year from now."
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
            hint="The question this leaves hanging. Shown at the end, and carried into the booking form."
          >
            <textarea
              name="openQuestion"
              rows={2}
              className={`${input} resize-none`}
            />
          </Field>

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

/** Editing an existing post. Everything visible — you're here on purpose. */
export function PostEditor({
  post,
  collections,
}: {
  post: StudioPost;
  collections: CollectionOption[];
}) {
  const [body, setBody] = useState(post.body);
  const bodyRef = useAutoGrow(body);

  return (
    <form action={savePost} className="mt-5 space-y-5 border-t border-line pt-5">
      <input type="hidden" name="id" value={post.id} />

      <Field label="Title">
        <input name="title" defaultValue={post.title ?? ""} className={input} />
      </Field>

      <Field label="Thought">
        <textarea
          name="body"
          ref={bodyRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={6}
          className={`${input} resize-none overflow-hidden leading-relaxed`}
        />
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
