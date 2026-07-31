import Link from "next/link";
import { brand } from "@/lib/brand";

/**
 * The first four seconds.
 *
 * Someone arrives here from an Instagram bio with roughly zero patience.
 * So: one idea, stated flatly, at a size that can't be skimmed past —
 * then a single door. No carousel, no value props, no logos.
 */
export function Hero({
  creatorCount,
  signedIn,
}: {
  creatorCount: number;
  signedIn: boolean;
}) {
  const lines = [brand.hero.line1, brand.hero.line2, brand.hero.line3];

  // Words animate in sequence on load. Index is accumulated across lines so
  // the cadence reads as one sentence rather than three restarts.
  let wordIndex = 0;

  return (
    <section className="relative flex min-h-[100svh] flex-col justify-center px-5 pb-20 pt-32 sm:px-8 sm:pt-36">
      <div className="mx-auto w-full max-w-6xl">
        <div
          className="mb-8 flex items-center gap-3 opacity-0"
          style={{ animation: "fade-up 0.8s var(--ease-out-expo) 0.1s forwards" }}
        >
          <LiveDot />
          <span className="eyebrow">
            {creatorCount > 1
              ? `${creatorCount} creators and counting`
              : "Now open — claim a handle"}
          </span>
        </div>

        <h1 className="display max-w-[15ch] text-[clamp(2.75rem,10vw,7.5rem)]">
          {lines.map((line, li) => {
            // The last line carries the gradient, and `background-clip: text`
            // is not painted through descendants that have their own
            // transform. So that line rises as a single unit — which also
            // lands better: the sentence resolves in one beat instead of
            // trickling in a word at a time.
            const isGradientLine = li === lines.length - 1;

            if (isGradientLine) {
              const delay = 0.18 + wordIndex * 0.055;
              return (
                <span key={li} className="block overflow-hidden pb-[0.06em]">
                  <span
                    className="text-gradient inline-block"
                    style={{
                      animation: `rise 1s var(--ease-out-expo) ${delay}s both`,
                    }}
                  >
                    {line}
                  </span>
                </span>
              );
            }

            return (
              <span key={li} className="block overflow-hidden pb-[0.06em]">
                {line.split(" ").map((word) => {
                  const delay = 0.18 + wordIndex++ * 0.055;
                  return (
                    <span
                      key={`${li}-${word}-${delay}`}
                      // The starting offset lives in the keyframe, not in a
                      // utility class: Tailwind's translate-* utilities
                      // compile to the standalone `translate` property, which
                      // composes with `transform` instead of being overridden
                      // by it. `both` applies the from-state during the delay.
                      className="inline-block"
                      style={{
                        animation: `rise 1s var(--ease-out-expo) ${delay}s both`,
                      }}
                    >
                      {word}
                      <span>&nbsp;</span>
                    </span>
                  );
                })}
              </span>
            );
          })}
        </h1>

        <p
          className="mt-8 max-w-xl text-base leading-relaxed text-bone-dim opacity-0 sm:mt-10 sm:text-lg"
          style={{ animation: "fade-up 0.9s var(--ease-out-expo) 0.75s forwards" }}
        >
          {brand.hero.sub}
        </p>

        <div
          className="mt-10 flex flex-col gap-3 opacity-0 sm:mt-12 sm:flex-row sm:items-center sm:gap-4"
          style={{ animation: "fade-up 0.9s var(--ease-out-expo) 0.92s forwards" }}
        >
          <Link
            href="#films"
            className="group inline-flex items-center justify-center gap-2.5 rounded-full border border-line-bright px-7 py-4 text-sm font-medium transition-all duration-300 hover:border-bone/40 hover:bg-bone/5"
          >
            Watch the films
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M7 1v12M1 7l6 6 6-6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform duration-300 group-hover:translate-y-0.5"
              />
            </svg>
          </Link>

          <Link
            href={signedIn ? "/studio" : "/signup"}
            className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-gold to-ember px-7 py-4 text-sm font-semibold text-ink transition-transform duration-300 hover:scale-[1.02] active:scale-[0.99]"
          >
            <span className="relative z-10">
              {signedIn ? "Go to your studio" : "Start your universe"}
            </span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden
              className="relative z-10 transition-transform duration-300 group-hover:translate-x-1"
            >
              <path
                d="M1 7h12M7 1l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>

      <span
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 opacity-0 sm:block"
        style={{ animation: "fade-up 1s ease 1.4s forwards" }}
        aria-hidden
      >
        <span className="block h-12 w-px bg-gradient-to-b from-transparent via-bone-faint to-transparent" />
      </span>
    </section>
  );
}

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2" aria-hidden>
      <span
        className="absolute inline-flex h-full w-full rounded-full bg-ember"
        style={{ animation: "pulse-ring 2.4s ease-out infinite" }}
      />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-ember" />
    </span>
  );
}
