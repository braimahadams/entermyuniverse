"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { brand } from "@/lib/brand";
import type { PostView } from "@/lib/types";
import { postTitle } from "@/lib/posts";

/**
 * The front door at entermyuniverse.com.
 *
 * Someone here typed the bare domain or followed a bare link — they don't
 * know whose site this is yet. So this page has one job: say what this is
 * in four words and open the door. Everything animates in on a single
 * staggered timeline so it reads as one movement rather than six elements
 * arriving separately.
 *
 * Motion is opt-out: `useReducedMotion` collapses every transition to
 * nothing for anyone who's asked their OS for less of it. That isn't
 * politeness — parallax and drift genuinely make some people ill.
 */
export function Landing({
  handle,
  displayName,
  tagline,
  latest,
  postCount,
}: {
  handle: string;
  displayName: string;
  tagline: string | null;
  latest: PostView[];
  postCount: number;
}) {
  const still = useReducedMotion();

  // One shared timeline. Children inherit the stagger rather than each
  // carrying its own delay, so reordering the page can't desynchronise it.
  const container = {
    hidden: {},
    shown: {
      transition: { staggerChildren: still ? 0 : 0.09, delayChildren: still ? 0 : 0.1 },
    },
  };

  const rise = {
    hidden: { opacity: 0, y: still ? 0 : 22, filter: still ? "none" : "blur(6px)" },
    shown: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: still ? 0 : 0.85, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <motion.main
      variants={container}
      initial="hidden"
      animate="shown"
      className="relative z-10 flex min-h-[100svh] flex-col justify-center px-5 py-24 sm:px-8"
    >
      <div className="mx-auto w-full max-w-3xl">
        <motion.p variants={rise} className="eyebrow">
          {brand.domain}
        </motion.p>

        <motion.h1
          variants={rise}
          className="display mt-7 text-[clamp(2.75rem,10vw,6.5rem)] leading-[0.98]"
        >
          Enter my
          <br />
          <span className="text-gradient">universe</span>.
        </motion.h1>

        <motion.p
          variants={rise}
          className="mt-8 max-w-lg text-lg leading-relaxed text-bone-dim"
        >
          {tagline ?? brand.tagline}
        </motion.p>

        <motion.div variants={rise} className="mt-11 flex flex-wrap items-center gap-4">
          <Link
            href={`/@${handle}`}
            className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-bone px-8 py-4 text-sm font-semibold text-ink"
          >
            {/* The wipe sits behind the label and is purely decorative —
                the text above it never moves, so the target stays still
                under a finger or cursor. */}
            <span
              aria-hidden
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-gold to-ember transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-0"
            />
            <span className="relative">Go in</span>
            <svg
              width="15"
              height="15"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden
              className="relative transition-transform duration-300 group-hover:translate-x-1"
            >
              <path
                d="M1 7h12M7 1l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

          <span className="text-sm text-bone-faint">
            {displayName}
            {postCount > 0 && (
              <>
                {" · "}
                {postCount} {postCount === 1 ? "thought" : "thoughts"}
              </>
            )}
          </span>
        </motion.div>

        {/* A glimpse of the actual writing. Far more persuasive than any
            description of it — three real titles say what this is. */}
        {latest.length > 0 && (
          <motion.div variants={rise} className="mt-20">
            <p className="text-[11px] uppercase tracking-[0.2em] text-bone-faint">
              Lately
            </p>
            <ul className="mt-5 divide-y divide-line border-y border-line">
              {latest.map((post) => (
                <li key={post.id}>
                  <Link
                    href={`/@${handle}/thoughts/${post.slug}`}
                    className="group flex items-baseline gap-4 py-4 transition-colors"
                  >
                    <span className="flex-1 text-[1.0625rem] leading-snug text-bone-dim transition-colors duration-300 group-hover:text-bone">
                      {postTitle(post)}
                    </span>
                    <span
                      aria-hidden
                      className="shrink-0 text-bone-faint transition-transform duration-300 group-hover:translate-x-1 group-hover:text-ember"
                    >
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </motion.main>
  );
}
