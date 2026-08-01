import Link from "next/link";
import { watchTime } from "@/lib/collections";
import type { ThoughtView } from "@/lib/types";

/**
 * One thought, as a card.
 *
 * Shows watch time and reading time, and nothing else measurable. No
 * views, no likes, no dates — those turn a library into a leaderboard and
 * quietly tell the visitor to value the popular thing over the useful one.
 *
 * The whole card is a link to a real page rather than a modal, so it can
 * be shared, indexed, and opened in a new tab like anything else on the web.
 */
export function ThoughtCard({
  thought,
  priority = false,
}: {
  thought: ThoughtView;
  priority?: boolean;
}) {
  const href = `/@${thought.creator?.handle}/thoughts/${thought.slug}`;

  return (
    <Link
      href={href}
      className="group block break-inside-avoid focus-visible:outline-none"
    >
      <article className="card-sheen relative overflow-hidden rounded-2xl border border-line bg-ink-2 transition-colors duration-500 group-hover:border-line-bright group-focus-visible:border-ember">
        <div
          className="relative overflow-hidden bg-ink-3"
          style={{ aspectRatio: "9 / 16" }}
        >
          {thought.poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thought.poster}
              alt=""
              loading={priority ? "eager" : "lazy"}
              className="h-full w-full object-cover transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-[1.05]"
            />
          ) : (
            <GeneratedPoster seed={thought.slug} />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-transparent" />

          {thought.coreThought && (
            <span className="absolute left-4 top-4 rounded-full border border-ember/45 bg-ink/60 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-ember backdrop-blur-md">
              Core thought
            </span>
          )}

          <span
            className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-bone/20 bg-ink/30 backdrop-blur-md transition-all duration-500 group-hover:scale-110 group-hover:border-ember/60 group-hover:bg-ember/20"
            aria-hidden
          >
            <svg width="15" height="17" viewBox="0 0 18 20" fill="none">
              <path
                d="M17 8.27a2 2 0 0 1 0 3.46L3 19.8a2 2 0 0 1-3-1.73V1.93A2 2 0 0 1 3 .2l14 8.07Z"
                className="fill-bone transition-colors duration-500 group-hover:fill-ember"
              />
            </svg>
          </span>

          <div className="absolute inset-x-0 bottom-0 p-5">
            <h3 className="display text-[1.35rem] leading-[1.1]">
              {thought.title}
            </h3>
            <p className="mt-2 line-clamp-2 text-sm leading-snug text-bone-dim">
              {thought.hook}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-5 py-3.5 text-[11px] text-bone-faint">
          {thought.collections.slice(0, 2).map((c) => (
            <span key={c.slug} className="text-bone-dim">
              {c.name}
            </span>
          ))}
          <span className="ml-auto flex items-center gap-2.5 font-mono">
            {thought.durationSec ? (
              <span>{watchTime(thought.durationSec)} watch</span>
            ) : null}
            {thought.readingMin > 0 && <span>{thought.readingMin} min read</span>}
          </span>
        </div>
      </article>
    </Link>
  );
}

/**
 * A deterministic poster for thoughts with no thumbnail.
 *
 * Same slug always yields the same artwork, so the library looks composed
 * rather than broken while thumbnails are missing.
 */
function GeneratedPoster({ seed }: { seed: string }) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  // Constrained to the warm band around the ember accent (~14°-64°) rather
  // than the full wheel. Unconstrained hues gave every card a different
  // random colour — a green next to a magenta next to a blue — which read
  // as noise and fought the palette. Within one family it still varies per
  // thought, but the library looks composed.
  const hue = 12 + (hash % 30);
  const drift = (hash >> 5) % 14;

  return (
    <div
      aria-hidden
      className="absolute inset-0 transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-[1.05]"
      style={{
        background: `
          radial-gradient(120% 70% at 25% 15%, hsl(${hue} 38% 26% / 0.85), transparent 64%),
          radial-gradient(110% 80% at 82% 78%, hsl(${hue + drift} 30% 18% / 0.8), transparent 62%),
          linear-gradient(165deg, #16161d 0%, #0a0a0e 100%)
        `,
      }}
    />
  );
}
