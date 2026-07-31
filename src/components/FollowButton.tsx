"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/**
 * Follow, with an optimistic flip.
 *
 * The state changes instantly and reverts only if the server disagrees.
 * A follow button that waits 300ms to acknowledge a tap feels broken, and
 * this is the cheapest retention mechanic the platform has.
 */
export function FollowButton({
  handle,
  initialFollowing,
  signedIn,
}: {
  handle: string;
  initialFollowing: boolean;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [, startTransition] = useTransition();

  async function toggle() {
    if (!signedIn) {
      // Send them to sign up, then straight back to the universe they were
      // standing in — losing your place is how you lose the signup.
      router.push(`/signup?next=${encodeURIComponent(`/@${handle}`)}`);
      return;
    }

    const next = !following;
    setFollowing(next);

    try {
      const res = await fetch(`/api/follow/${handle}`, {
        method: next ? "POST" : "DELETE",
      });
      if (!res.ok) throw new Error();
      startTransition(() => router.refresh());
    } catch {
      setFollowing(!next);
    }
  }

  return (
    <button
      onClick={toggle}
      className={`rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-300 ${
        following
          ? "border border-line-bright text-bone-dim hover:border-ember/50 hover:text-ember"
          : "bg-bone text-ink hover:scale-[1.03]"
      }`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
