"use client";

import { useState } from "react";
import type { ThoughtView } from "@/lib/types";

/**
 * The video, on a thought page.
 *
 * Not autoplayed and never muted-autoplayed: someone arriving from a link
 * has not consented to sound, and this whole site is built on the premise
 * that it isn't a feed. They press play.
 */
export function ThoughtPlayer({ thought }: { thought: ThoughtView }) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-ink-2 px-8 py-20 text-center"
        style={{ aspectRatio: "9 / 16", maxHeight: "70svh" }}
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
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
        <p className="text-sm text-bone-dim">This video isn&rsquo;t uploaded yet.</p>
      </div>
    );
  }

  return (
    <video
      src={thought.src}
      poster={thought.poster ?? undefined}
      controls
      playsInline
      preload="metadata"
      onError={() => setBroken(true)}
      className="mx-auto max-h-[70svh] w-full rounded-2xl border border-line bg-black object-contain"
      style={{ aspectRatio: "9 / 16" }}
    />
  );
}
