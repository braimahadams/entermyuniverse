"use client";

import { useState } from "react";

/**
 * The transcript.
 *
 * Present for three reasons, in order of how much they matter:
 *   1. It's the only indexable text on a page that's otherwise a video,
 *      so it's what search engines actually rank.
 *   2. Plenty of people would rather read than watch, or are somewhere
 *      they can't play audio.
 *   3. It's the substrate for site search now, and the AI assistant later.
 *
 * Collapsed by default so it doesn't bury what follows, but the full text
 * is always in the DOM — collapsing is a CSS max-height, not conditional
 * rendering, so crawlers and Ctrl+F still see all of it.
 */
export function Transcript({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim());

  return (
    <section className="mt-14" aria-labelledby="transcript-heading">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="transcript-heading" className="display text-2xl">
          Transcript
        </h2>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="transcript-body"
          className="text-sm text-bone-faint transition-colors hover:text-bone"
        >
          {open ? "Collapse" : "Read all"}
        </button>
      </div>

      <div
        id="transcript-body"
        className="relative mt-6 overflow-hidden transition-[max-height] duration-700 ease-[var(--ease-out-expo)]"
        style={{ maxHeight: open ? "none" : "22rem" }}
      >
        <div className="space-y-5 text-[1.0625rem] leading-[1.75] text-bone-dim">
          {paragraphs.map((p, i) => (
            <p key={i}>{p.trim()}</p>
          ))}
        </div>

        {!open && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink to-transparent"
            aria-hidden
          />
        )}
      </div>

      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="mt-4 text-sm text-ember transition-opacity hover:opacity-80"
        >
          Continue reading →
        </button>
      )}
    </section>
  );
}
