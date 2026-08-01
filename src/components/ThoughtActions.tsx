"use client";

import { useEffect, useState } from "react";

/**
 * Bookmark and share.
 *
 * Bookmarks live in localStorage, not the database. That's a deliberate
 * choice, not a shortcut: it means someone can save a thought without an
 * account, which keeps the site free of signup walls and keeps us free of
 * storing anything about people who are only here to read.
 *
 * The tradeoff — bookmarks don't follow you between devices — is the right
 * one at this size, and swapping to a server-backed store later doesn't
 * change this component's interface.
 */

const KEY = "emu:bookmarks";

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function useBookmarks() {
  const [ids, setIds] = useState<string[]>([]);
  // Populated after mount: localStorage doesn't exist during SSR, and
  // reading it during render would produce a hydration mismatch.
  useEffect(() => setIds(read()), []);
  return ids;
}

export function ThoughtActions({
  slug,
  title,
  url,
}: {
  slug: string;
  title: string;
  url: string;
}) {
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [shareLabel, setShareLabel] = useState("Share");

  useEffect(() => {
    setMounted(true);
    setSaved(read().includes(slug));
  }, [slug]);

  function toggleSave() {
    const next = saved ? read().filter((s) => s !== slug) : [...read(), slug];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      setSaved(!saved);
    } catch {
      // Private browsing can refuse writes. Failing silently is better
      // than an error dialog over a bookmark.
    }
  }

  async function share() {
    // The native sheet on mobile is far better than anything we'd build,
    // and it's the only route to WhatsApp/Messages.
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        return; // user dismissed — not an error
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareLabel("Link copied");
      setTimeout(() => setShareLabel("Share"), 2000);
    } catch {
      setShareLabel("Copy failed");
      setTimeout(() => setShareLabel("Share"), 2000);
    }
  }

  return (
    <div className="flex items-center gap-2.5">
      <button
        onClick={toggleSave}
        aria-pressed={mounted ? saved : undefined}
        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors duration-300 ${
          saved
            ? "border-ember/50 bg-ember/10 text-ember"
            : "border-line text-bone-dim hover:border-line-bright hover:text-bone"
        }`}
      >
        <svg width="13" height="15" viewBox="0 0 14 16" fill="none" aria-hidden>
          <path
            d="M2 1.75h10v12.5L7 10.5l-5 3.75V1.75Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            fill={saved ? "currentColor" : "none"}
          />
        </svg>
        {saved ? "Saved" : "Save"}
      </button>

      <button
        onClick={share}
        className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-bone-dim transition-colors duration-300 hover:border-line-bright hover:text-bone"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M8 10.5V1.5m0 0L4.75 4.75M8 1.5l3.25 3.25M2.5 9v4a1.5 1.5 0 0 0 1.5 1.5h8A1.5 1.5 0 0 0 13.5 13V9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {shareLabel}
      </button>
    </div>
  );
}
