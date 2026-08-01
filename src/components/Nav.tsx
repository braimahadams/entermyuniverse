"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { brand } from "@/lib/brand";

export type NavUser = {
  handle: string;
  displayName: string;
  avatarUrl: string | null;
} | null;

export function Nav({ user, solo }: { user: NavUser; solo: boolean }) {
  const [lifted, setLifted] = useState(false);

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        lifted
          ? "border-b border-line bg-ink/70 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:h-20 sm:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2.5"
          aria-label={`${brand.name} — home`}
        >
          <Mark />
          <span className="display text-lg tracking-tight sm:text-xl">
            {brand.short}
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-3">
          <Link
            // In solo mode the root redirects, which would strip the hash —
            // so scroll within the page we're already on.
            href={solo ? "#films" : "/#films"}
            className="hidden rounded-full px-4 py-2 text-sm text-bone-dim transition-colors hover:text-bone sm:block"
          >
            Watch
          </Link>

          {user ? (
            <>
              <Link
                href="/studio"
                className="rounded-full px-4 py-2 text-sm text-bone-dim transition-colors hover:text-bone"
              >
                Studio
              </Link>
              <Link
                href={`/@${user.handle}`}
                className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3.5 transition-colors hover:border-line-bright hover:bg-bone/5"
                aria-label="Your universe"
              >
                <Avatar
                  src={user.avatarUrl}
                  name={user.displayName}
                  size={26}
                />
                <span className="hidden text-sm sm:block">@{user.handle}</span>
              </Link>
            </>
          ) : solo ? (
            // One person's site: no recruiting. Just a quiet way back in
            // for the one person who owns it.
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm text-bone-faint transition-colors hover:text-bone"
            >
              Sign in
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm text-bone-dim transition-colors hover:text-bone"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="group relative overflow-hidden rounded-full bg-bone px-4 py-2 text-sm font-medium text-ink transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98] sm:px-5 sm:py-2.5"
              >
                <span className="relative z-10">Claim your handle</span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-gold to-ember transition-transform duration-500 group-hover:translate-x-0" />
                <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  Claim your handle
                </span>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

/** Two arcs leaning into each other — a conversation, reduced. */
function Mark() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <circle
        cx="13"
        cy="13"
        r="11.25"
        stroke="url(#mark-a)"
        strokeWidth="1.4"
        className="origin-center transition-transform duration-700 group-hover:rotate-180"
      />
      <path
        d="M8.4 15.6c1.6-4.6 7.6-4.6 9.2 0"
        stroke="var(--color-ember)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="13" cy="9.4" r="1.5" fill="var(--color-bone)" />
      <defs>
        <linearGradient id="mark-a" x1="0" y1="0" x2="26" y2="26">
          <stop stopColor="var(--color-bone)" stopOpacity="0.5" />
          <stop offset="1" stopColor="var(--color-ember)" stopOpacity="0.85" />
        </linearGradient>
      </defs>
    </svg>
  );
}
