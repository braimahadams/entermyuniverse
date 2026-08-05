import Link from "next/link";
import { Avatar, VerifiedTick } from "@/components/Avatar";
import type { CreatorView } from "@/lib/creators";

/**
 * Universes to walk into.
 *
 * On a platform, the film is the hook but the *person* is the retention.
 * This exists so someone who liked one thing can find the rest of what
 * that head contains, instead of scrolling on and forgetting them.
 */
export function CreatorRail({ creators }: { creators: CreatorView[] }) {
  if (creators.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {creators.map((creator, i) => (
        <Link
          key={creator.id}
          href={`/@${creator.handle}`}
          className="reveal card card-sheen group rounded-2xl p-6 transition-all duration-500 hover:border-line-bright"
          style={{ ["--reveal-delay" as string]: `${(i % 3) * 90}ms` }}
        >
          <div className="flex items-center gap-3.5">
            <Avatar
              src={creator.avatarUrl}
              name={creator.displayName}
              size={48}
            />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate font-medium">
                {creator.displayName}
                {creator.verified && <VerifiedTick />}
              </p>
              <p className="truncate text-sm text-bone-faint">
                @{creator.handle}
              </p>
            </div>
          </div>

          {creator.tagline && (
            <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-bone-dim">
              {creator.tagline}
            </p>
          )}

          <div className="mt-5 flex items-center gap-4 border-t border-line pt-4 text-xs text-bone-faint">
            <span>
              {creator.postCount}{" "}
              {creator.postCount === 1 ? "thought" : "thoughts"}
            </span>
            {creator.followerCount > 0 && (
              <span>
                {creator.followerCount}{" "}
                {creator.followerCount === 1 ? "follower" : "followers"}
              </span>
            )}
            {creator.canSell && (
              <span className="ml-auto flex items-center gap-1.5 text-ember">
                <span className="h-1.5 w-1.5 rounded-full bg-ember" />
                Open to talk
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
