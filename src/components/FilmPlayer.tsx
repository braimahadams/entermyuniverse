"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useScrollLock } from "@/components/FilmWall";
import { Avatar, VerifiedTick } from "@/components/Avatar";
import type { FilmView } from "@/lib/types";

/**
 * The player.
 *
 * The important part of this component isn't the video — it's what happens
 * when the video *ends*. The film deliberately stops short of an answer,
 * and the moment it does, the question it raised slides up with a button
 * that carries that exact question into the booking form.
 *
 * That's the whole business model, expressed as one interaction.
 */
export function FilmPlayer({
  film,
  onClose,
  onNext,
  onPrev,
}: {
  film: FilmView;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ended, setEnded] = useState(false);
  const [broken, setBroken] = useState(false);

  useScrollLock(true);

  // Reset per-film state when the wall steps to a different one.
  useEffect(() => {
    setEnded(false);
    setBroken(false);
  }, [film.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext?.();
      if (e.key === "ArrowLeft") onPrev?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onNext, onPrev]);

  // Carry the film and its question into the creator's booking form, so the
  // visitor arrives at a partly-filled page instead of a blank one — and so
  // the creator can see which film actually produced the booking.
  const bookHref = film.creator
    ? `/@${film.creator.handle}/book?from=${encodeURIComponent(film.slug)}${
        film.openQuestion ? `&q=${encodeURIComponent(film.openQuestion)}` : ""
      }`
    : null;

  // Not every creator sells. When they don't, the film still ends on its
  // question — it just points at their universe instead of a checkout.
  const sellsCalls = Boolean(film.creator?.canSell && bookHref);

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={film.title}
        className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div
          className="absolute inset-0 bg-ink/85 backdrop-blur-xl"
          onClick={onClose}
        />

        <motion.div
          // Height is pinned on desktop rather than left to the content:
          // a 9:16 film inside a percentage-width column will happily grow
          // taller than the viewport otherwise.
          className="relative z-10 flex max-h-[94svh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-line-bright bg-ink-2 shadow-2xl lg:h-[86svh] lg:flex-row"
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* ── the film ── */}
          <div className="relative h-[42svh] shrink-0 bg-black lg:h-full lg:w-[46%]">
            {broken ? (
              <MissingFilm />
            ) : (
              <video
                ref={videoRef}
                src={film.src}
                poster={film.poster ?? undefined}
                controls
                autoPlay
                playsInline
                onEnded={() => setEnded(true)}
                onError={() => setBroken(true)}
                // object-contain, so a vertical film letterboxes inside the
                // column instead of being cropped down its sides.
                className="h-full w-full bg-black object-contain"
              />
            )}
          </div>

          {/* ── the text ── */}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <span className="eyebrow">{film.topic}</span>
              <button
                onClick={onClose}
                className="-mr-1 -mt-1 rounded-full p-2 text-bone-dim transition-colors hover:bg-bone/5 hover:text-bone"
                aria-label="Close"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M1 1l14 14M15 1L1 15"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <h2 className="display mt-3 text-[1.75rem] leading-[1.06] sm:text-[2.25rem]">
              {film.title}
            </h2>

            {film.creator && (
              <Link
                href={`/@${film.creator.handle}`}
                className="mt-4 flex w-fit items-center gap-2.5 rounded-full border border-line py-1.5 pl-1.5 pr-4 transition-colors hover:border-line-bright hover:bg-bone/5"
              >
                <Avatar
                  src={film.creator.avatarUrl}
                  name={film.creator.displayName}
                  size={26}
                />
                <span className="text-sm text-bone">
                  {film.creator.displayName}
                </span>
                {film.creator.verified && <VerifiedTick />}
              </Link>
            )}

            {film.description && (
              <p className="mt-4 text-[0.95rem] leading-relaxed text-bone-dim">
                {film.description}
              </p>
            )}

            {/* The hinge. Present from the start, but it lights up the
                moment the film runs out of answers. */}
            {film.openQuestion && (
              <motion.div
                layout
                className={`mt-7 rounded-2xl border p-5 transition-colors duration-700 sm:p-6 ${
                  ended
                    ? "border-ember/45 bg-ember/[0.07]"
                    : "border-line bg-bone/[0.02]"
                }`}
              >
                <span className="eyebrow">
                  {ended ? "So — your turn" : "The question it leaves"}
                </span>
                <p className="display mt-3 text-xl leading-snug sm:text-[1.4rem]">
                  {film.openQuestion}
                </p>

                <AnimatePresence>
                  {ended && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden text-sm leading-relaxed text-bone-dim"
                    >
                      <span className="mt-3 block">
                        {sellsCalls ? (
                          <>
                            It wasn&rsquo;t answered on purpose. The answer
                            isn&rsquo;t general — it&rsquo;s yours, and it takes
                            a conversation to find. Bring this exact question.
                          </>
                        ) : (
                          <>
                            It wasn&rsquo;t answered on purpose. Sit with it —
                            and go see what else is in here.
                          </>
                        )}
                      </span>
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            <div className="mt-auto pt-7">
              <Link
                href={
                  sellsCalls
                    ? bookHref!
                    : film.creator
                      ? `/@${film.creator.handle}`
                      : "/"
                }
                className={`group flex w-full items-center justify-center gap-2.5 rounded-full px-6 py-4 text-sm font-semibold transition-all duration-500 ${
                  ended
                    ? "bg-gradient-to-r from-gold to-ember text-ink hover:scale-[1.02]"
                    : "border border-line-bright text-bone hover:border-bone/40 hover:bg-bone/5"
                }`}
              >
                {sellsCalls
                  ? "Take this into a talk"
                  : film.creator
                    ? `Enter ${film.creator.displayName.split(" ")[0]}'s universe`
                    : "Keep watching"}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden
                  className="transition-transform duration-300 group-hover:translate-x-1"
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

              {(onPrev || onNext) && (
                <div className="mt-4 flex items-center justify-between text-xs text-bone-faint">
                  <button
                    onClick={onPrev}
                    className="rounded-full px-3 py-1.5 transition-colors hover:text-bone"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={onNext}
                    className="rounded-full px-3 py-1.5 transition-colors hover:text-bone"
                  >
                    Next film →
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Shown when the file behind a film isn't there yet.
 *
 * The seed data ships with no actual video, and a broken black rectangle
 * would read as a bug. This reads as "not uploaded yet", which is the truth.
 */
function MissingFilm() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-gradient-to-br from-ink-3 to-ink px-8 py-10 text-center">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden>
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
      <p className="text-sm text-bone-dim">This film isn&rsquo;t uploaded yet.</p>
      <p className="max-w-[26ch] text-xs leading-relaxed text-bone-faint">
        Drop an MP4 into <code className="text-bone-dim">/public/media</code> and
        point the film at it from the admin panel.
      </p>
    </div>
  );
}
