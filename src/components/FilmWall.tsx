"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FilmPlayer } from "@/components/FilmPlayer";
import { Avatar, VerifiedTick } from "@/components/Avatar";
import { formatDuration, type FilmView } from "@/lib/types";
import { TOPICS } from "@/lib/constants";

/**
 * The wall.
 *
 * Vertical 9:16 tiles — the shape everything is already shot in — laid out
 * in two columns where the right column hangs lower than the left. The
 * offset is what stops it reading as a stock grid: the eye zigzags down
 * instead of scanning rows, so each film gets looked at on its own.
 */
export function FilmWall({ films }: { films: FilmView[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (delta: number) =>
      setOpenIndex((i) =>
        i === null ? null : (i + delta + films.length) % films.length,
      ),
    [films.length],
  );

  if (films.length === 0) {
    return (
      <p className="text-center text-bone-dim">
        No films published yet. Add one from the admin panel.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-7 lg:gap-10">
        {films.map((film, i) => (
          <div
            key={film.id}
            className={`reveal ${
              // Every second tile drops down on wide screens only —
              // on mobile a vertical offset is just wasted space.
              i % 2 === 1 ? "sm:translate-y-16 lg:translate-y-24" : ""
            }`}
            style={{ ["--reveal-delay" as string]: `${(i % 2) * 110}ms` }}
          >
            <FilmTile film={film} onOpen={() => setOpenIndex(i)} />
          </div>
        ))}
      </div>

      {/* Absorbs the offset of the last right-hand tile so the next
          section doesn't collide with it. */}
      <div className="h-16 sm:h-24 lg:h-32" aria-hidden />

      {openIndex !== null && (
        <FilmPlayer
          film={films[openIndex]}
          onClose={close}
          onNext={films.length > 1 ? () => step(1) : undefined}
          onPrev={films.length > 1 ? () => step(-1) : undefined}
        />
      )}
    </>
  );
}

function FilmTile({ film, onOpen }: { film: FilmView; onOpen: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);
  const topic = TOPICS.find((t) => t.id === film.topic);

  // Feed cursor position to the CSS sheen so the highlight tracks the pointer.
  const onMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  return (
    <button
      ref={ref}
      onClick={onOpen}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="card-sheen group relative block w-full overflow-hidden rounded-[20px] border border-line bg-ink-2 text-left transition-all duration-500 hover:border-line-bright"
      style={{ aspectRatio: "9 / 16" }}
      aria-label={`Play: ${film.title}`}
    >
      {/* Poster. Falls back to a gradient derived from the slug, so a film
          with no thumbnail still looks deliberate rather than broken. */}
      {film.poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={film.poster}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-[1.06]"
          loading="lazy"
        />
      ) : (
        <PosterFallback seed={film.slug} hovered={hovered} />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-transparent opacity-90" />

      {/* Top row: topic and runtime */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 sm:p-5">
        {topic && (
          <span className="rounded-full border border-line-bright bg-ink/50 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-bone-dim backdrop-blur-md">
            {topic.label}
          </span>
        )}
        {film.durationSec && (
          <span className="rounded-full bg-ink/50 px-2.5 py-1 font-mono text-[10px] text-bone-dim backdrop-blur-md">
            {formatDuration(film.durationSec)}
          </span>
        )}
      </div>

      {/* Play affordance */}
      <span
        className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-bone/25 bg-ink/35 backdrop-blur-md transition-all duration-500 group-hover:scale-110 group-hover:border-ember/70 group-hover:bg-ember/20"
        aria-hidden
      >
        <svg width="18" height="20" viewBox="0 0 18 20" fill="none">
          <path
            d="M17 8.27a2 2 0 0 1 0 3.46L3 19.8a2 2 0 0 1-3-1.73V1.93A2 2 0 0 1 3 .2l14 8.07Z"
            className="fill-bone transition-colors duration-500 group-hover:fill-ember"
          />
        </svg>
      </span>

      {/* Bottom: the copy */}
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        {/* On the mixed feed, whose film this is matters as much as what
            it's called — it's how someone finds a universe to follow. */}
        {film.creator && (
          <span className="mb-3 flex items-center gap-2">
            <Avatar
              src={film.creator.avatarUrl}
              name={film.creator.displayName}
              size={22}
            />
            <span className="text-xs text-bone-dim">
              @{film.creator.handle}
            </span>
            {film.creator.verified && <VerifiedTick />}
          </span>
        )}

        <h3 className="display text-[1.4rem] leading-[1.08] sm:text-[1.7rem]">
          {film.title}
        </h3>
        <p className="mt-2.5 text-sm leading-snug text-bone-dim">{film.hook}</p>

        <span className="mt-4 flex items-center gap-2 text-xs font-medium text-ember opacity-0 transition-all duration-500 group-hover:opacity-100">
          Watch
          <span className="h-px w-6 bg-ember transition-all duration-500 group-hover:w-10" />
        </span>
      </div>
    </button>
  );
}

/**
 * A deterministic gradient poster.
 *
 * Same slug always yields the same artwork, so tiles look designed and
 * stay stable across reloads — but you never have to make a thumbnail
 * to ship a film.
 */
function PosterFallback({ seed, hovered }: { seed: string; hovered: boolean }) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  const hue2 = (hue + 42) % 360;

  return (
    <div
      className="absolute inset-0 transition-transform duration-[1.2s] ease-[var(--ease-out-expo)]"
      style={{ transform: hovered ? "scale(1.06)" : "scale(1)" }}
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(120% 70% at 25% 15%, hsl(${hue} 62% 42% / 0.85), transparent 62%),
            radial-gradient(110% 80% at 82% 78%, hsl(${hue2} 58% 34% / 0.8), transparent 60%),
            linear-gradient(165deg, #16161d 0%, #0a0a0e 100%)
          `,
        }}
      />
      {/* Faint contour lines. Turns a flat gradient into a surface. */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.18]"
        preserveAspectRatio="none"
        viewBox="0 0 100 178"
      >
        {Array.from({ length: 7 }, (_, i) => (
          <path
            key={i}
            d={`M-10 ${28 + i * 21} Q 30 ${12 + i * 21 + (hash % 17)} 60 ${30 + i * 21} T 110 ${22 + i * 21}`}
            stroke="var(--color-bone)"
            strokeWidth="0.4"
            fill="none"
          />
        ))}
      </svg>
    </div>
  );
}

/** Locks background scroll while a modal owns the screen. */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}
