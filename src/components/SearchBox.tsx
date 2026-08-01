"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { SearchHit } from "@/lib/search";

/**
 * Search, as you type.
 *
 * Debounced at 220ms — long enough that a normal typing speed produces one
 * request rather than eight, short enough to feel immediate. Every response
 * carries the query that produced it so a slow early request can't
 * overwrite the results of a faster later one.
 */
export function SearchBox({ handle }: { handle: string }) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const latest = useRef("");

  useEffect(() => {
    const q = query.trim();
    latest.current = q;

    if (q.length < 2) {
      setHits(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q)}&handle=${encodeURIComponent(handle)}`,
        );
        const data = await res.json();
        // Ignore anything that isn't the query currently in the box.
        if (latest.current !== q) return;
        setHits(data.results ?? []);
        setOpen(true);
      } catch {
        if (latest.current === q) setHits([]);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query, handle]);

  // Click outside closes the results.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={boxRef} className="relative">
      <label htmlFor="thought-search" className="sr-only">
        Search thoughts
      </label>
      <div className="flex items-center gap-3 rounded-full border border-line bg-ink/60 px-5 transition-colors focus-within:border-ember">
        <svg
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden
          className="shrink-0"
        >
          <circle
            cx="7"
            cy="7"
            r="5"
            stroke="var(--color-bone-faint)"
            strokeWidth="1.5"
          />
          <path
            d="M10.8 10.8 14 14"
            stroke="var(--color-bone-faint)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <input
          id="thought-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => hits && setOpen(true)}
          placeholder="What did he say about fear?"
          className="w-full bg-transparent py-3.5 text-sm text-bone placeholder:text-bone-faint focus:outline-none"
        />
      </div>

      <AnimatePresence>
        {open && hits !== null && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-x-0 top-full z-30 mt-2 max-h-[60svh] overflow-y-auto rounded-2xl border border-line-bright bg-ink-2/95 backdrop-blur-xl"
          >
            {hits.length === 0 ? (
              <p className="px-5 py-6 text-sm text-bone-faint">
                Nothing on that yet.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {hits.map((hit) => (
                  <li key={`${hit.handle}-${hit.slug}`}>
                    <Link
                      href={`/@${hit.handle}/thoughts/${hit.slug}`}
                      onClick={() => setOpen(false)}
                      className="block px-5 py-4 transition-colors hover:bg-bone/5"
                    >
                      <p className="text-sm font-medium text-bone">
                        {hit.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-bone-faint">
                        {hit.excerpt ?? hit.hook}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
