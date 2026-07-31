"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Bridges the gap between Stripe's redirect and Stripe's webhook.
 *
 * The visitor lands on the confirmation page the instant they pay, but the
 * booking isn't CONFIRMED until the webhook arrives — usually a second or
 * two later. Rather than asking them to refresh, we poll quietly.
 *
 * Gives up after ~40 seconds. If it's taken that long, something is wrong
 * and reloading forever won't fix it.
 */
export function PendingWatcher() {
  const router = useRouter();

  useEffect(() => {
    let elapsed = 0;
    const id = setInterval(() => {
      elapsed += 2500;
      if (elapsed > 40_000) {
        clearInterval(id);
        return;
      }
      router.refresh();
    }, 2500);

    return () => clearInterval(id);
  }, [router]);

  return null;
}
