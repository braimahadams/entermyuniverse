"use client";

import { useEffect } from "react";

/**
 * One observer for the whole page.
 *
 * Every `.reveal` element on the page animates in when it enters view.
 * Doing it centrally means the sections themselves stay server components —
 * they just need a class name, not a client boundary each.
 */
export function ScrollReveal() {
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>(".reveal");

    // No IntersectionObserver, or the visitor asked for less motion:
    // show everything immediately rather than hiding content.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-in"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          // Reveal is one-way. Re-animating on scroll-up is nausea, not delight.
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return null;
}
