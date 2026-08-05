"use client";

import { useState } from "react";

/**
 * The video on a post, when there is one.
 *
 * Never autoplays and never muted-autoplays. Someone who arrived from a
 * link hasn't consented to sound, and the entire premise here is that this
 * isn't a feed that plays at you. They press play.
 */
export function ThoughtPlayer({
  src,
  poster,
  title,
}: {
  src: string;
  poster: string | null;
  title: string;
}) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <div
        className="mx-auto flex max-w-sm flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-ink-2 px-8 py-16 text-center"
        style={{ aspectRatio: "9 / 16", maxHeight: "60svh" }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect
            x="2"
            y="4"
            width="20"
            height="16"
            rx="3"
            stroke="var(--color-bone-faint)"
            strokeWidth="1.4"
          />
          <path
            d="M10 9.5v5l4-2.5-4-2.5Z"
            stroke="var(--color-bone-faint)"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
        <p className="text-sm text-bone-dim">This video isn&rsquo;t available.</p>
      </div>
    );
  }

  return (
    <video
      src={src}
      poster={poster ?? undefined}
      controls
      playsInline
      preload="metadata"
      aria-label={title}
      onError={() => setBroken(true)}
      className="mx-auto max-h-[65svh] w-full max-w-sm rounded-2xl border border-line bg-black object-contain"
      style={{ aspectRatio: "9 / 16" }}
    />
  );
}
