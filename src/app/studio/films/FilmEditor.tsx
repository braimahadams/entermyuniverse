"use client";

import { useState } from "react";
import { FilmUploader, type UploadResult } from "@/components/FilmUploader";
import { deleteFilm, saveFilm } from "@/app/studio/actions";
import { TOPICS } from "@/lib/constants";

export type StudioFilm = {
  id: string;
  slug: string;
  title: string;
  hook: string;
  description: string | null;
  openQuestion: string | null;
  topic: string;
  sourceId: string;
  thumbnailUrl: string | null;
  durationSec: number | null;
  sizeBytes: number | null;
  published: boolean;
  approved: boolean;
  moderationNote: string | null;
  position: number;
};

export function FilmEditor({
  films,
  storageProvider,
}: {
  films: StudioFilm[];
  storageProvider: "local" | "blob";
}) {
  const [adding, setAdding] = useState(films.length === 0);

  return (
    <>
      {adding ? (
        <div className="card mb-8 rounded-2xl p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-medium">New film</h2>
            <button
              onClick={() => setAdding(false)}
              className="text-xs text-bone-faint hover:text-bone"
            >
              Cancel
            </button>
          </div>
          <FilmForm storageProvider={storageProvider} onSaved={() => setAdding(false)} />
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mb-8 w-full rounded-2xl border border-dashed border-line-bright bg-bone/[0.02] py-5 text-sm text-bone-dim transition-colors hover:border-bone/35 hover:text-bone"
        >
          + Upload a film
        </button>
      )}

      <div className="space-y-4">
        {films.map((film) => (
          <details key={film.id} className="card rounded-2xl p-6">
            <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3">
              <span className="flex flex-wrap items-center gap-2.5">
                <span className="font-medium">{film.title}</span>
                {!film.published && <Chip>Draft</Chip>}
                {!film.approved && <Chip tone="warn">Hidden by a moderator</Chip>}
              </span>
              <span className="text-xs text-bone-faint">/{film.slug}</span>
            </summary>

            {!film.approved && film.moderationNote && (
              <p className="mt-4 rounded-xl border border-ember/35 bg-ember/[0.07] px-4 py-3 text-sm text-bone-dim">
                {film.moderationNote}
              </p>
            )}

            <FilmForm film={film} storageProvider={storageProvider} />
          </details>
        ))}
      </div>
    </>
  );
}

function FilmForm({
  film,
  storageProvider,
  onSaved,
}: {
  film?: StudioFilm;
  storageProvider: "local" | "blob";
  onSaved?: () => void;
}) {
  // Held in state so an upload can fill the hidden fields the form posts.
  const [upload, setUpload] = useState<UploadResult | null>(null);

  const sourceId = upload?.key ?? film?.sourceId ?? "";
  const durationSec = upload?.durationSec ?? film?.durationSec ?? "";
  const sizeBytes = upload?.sizeBytes ?? film?.sizeBytes ?? "";

  return (
    <form
      action={async (formData) => {
        await saveFilm(formData);
        onSaved?.();
      }}
      className={film ? "mt-6 space-y-4 border-t border-line pt-6" : "space-y-4"}
    >
      {film && <input type="hidden" name="id" value={film.id} />}
      <input type="hidden" name="sourceId" value={sourceId} />
      <input type="hidden" name="durationSec" value={durationSec} />
      <input type="hidden" name="sizeBytes" value={sizeBytes} />

      {!film && <FilmUploader provider={storageProvider} onUploaded={setUpload} />}

      {film && (
        <details className="rounded-xl border border-line p-4">
          <summary className="cursor-pointer text-xs text-bone-dim">
            Replace the video file
          </summary>
          <div className="mt-4">
            <FilmUploader provider={storageProvider} onUploaded={setUpload} />
          </div>
          <p className="mt-3 text-xs text-bone-faint">
            Current source: <code className="text-bone-dim">{sourceId}</code>
          </p>
        </details>
      )}

      <Field label="Title">
        <input name="title" required defaultValue={film?.title} className={input} />
      </Field>

      <Field label="Hook" hint="One line, shown under the title on the tile.">
        <input name="hook" defaultValue={film?.hook} className={input} />
      </Field>

      <Field label="Description">
        <textarea
          name="description"
          rows={2}
          defaultValue={film?.description ?? ""}
          className={`${input} resize-none`}
        />
      </Field>

      <Field
        label="Open question"
        hint="The question the film raises and refuses to answer. It appears when the video ends and pre-fills the booking form. This is the single field that turns a viewer into a booking — write it last, and write it carefully."
      >
        <textarea
          name="openQuestion"
          rows={2}
          defaultValue={film?.openQuestion ?? ""}
          className={`${input} resize-none`}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Topic">
          <select
            name="topic"
            defaultValue={film?.topic ?? "system"}
            className={input}
          >
            {TOPICS.map((t) => (
              <option key={t.id} value={t.id} className="bg-ink-2">
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Order">
          <input
            name="position"
            type="number"
            defaultValue={film?.position ?? 0}
            className={input}
          />
        </Field>
        <Field label="Thumbnail URL">
          <input
            name="thumbnailUrl"
            defaultValue={film?.thumbnailUrl ?? ""}
            placeholder="Optional"
            className={input}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2.5 text-sm text-bone-dim">
        <input
          type="checkbox"
          name="published"
          defaultChecked={film?.published ?? true}
          className="h-4 w-4 accent-[var(--color-ember)]"
        />
        Published
      </label>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={!sourceId}
          className="rounded-full bg-bone px-6 py-3 text-sm font-semibold text-ink transition-transform enabled:hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {film ? "Save" : "Publish film"}
        </button>
        {!sourceId && (
          <span className="text-xs text-bone-faint">Upload a file first.</span>
        )}
      </div>

      {film && (
        <button
          type="submit"
          formAction={deleteFilm}
          className="text-xs text-bone-faint transition-colors hover:text-ember"
        >
          Delete this film
        </button>
      )}
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

function Chip({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "warn";
}) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
        tone === "warn"
          ? "border-ember/40 bg-ember/10 text-ember"
          : "border-line text-bone-faint"
      }`}
    >
      {children}
    </span>
  );
}
