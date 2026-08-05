import Link from "next/link";
import { redirect } from "next/navigation";
import { Ambience } from "@/components/Ambience";
import { CreatorRail } from "@/components/CreatorRail";
import { PostCard } from "@/components/PostCard";
import { Hero } from "@/components/Hero";
import { Nav } from "@/components/Nav";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Waitlist } from "@/components/Waitlist";
import { Faq, Footer, Marquee, Process, SectionHead } from "@/components/sections";
import { getCurrentUser } from "@/lib/auth";
import {
  getFeaturedCreators,
  getFeed,
  resolvePrimaryHandle,
} from "@/lib/creators";
import { db } from "@/lib/db";
import { brand } from "@/lib/brand";
import { soloMode } from "@/lib/config";

// The feed moves whenever anyone publishes, so this can't be cached hard.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // One person's site: the front door is their page, not a directory of
  // strangers. Everything below is the platform build, kept intact and
  // unreachable until PRIMARY_HANDLE is cleared.
  //
  // The target is resolved against the database rather than taken from the
  // environment, so a mistyped handle degrades to the owner's page instead
  // of redirecting every visitor into a 404.
  if (soloMode) {
    const primary = await resolvePrimaryHandle();
    if (primary) redirect(`/@${primary}`);
    // No accounts at all — fall through and render the platform homepage,
    // which has its own empty state.
  }

  const [user, films, creators, creatorCount] = await Promise.all([
    getCurrentUser(),
    getFeed(24),
    getFeaturedCreators(6),
    db.user.count({ where: { suspended: false } }),
  ]);

  return (
    <>
      <Ambience />
      <ScrollReveal />
      <Nav user={user} solo={false} />

      <main className="relative z-10">
        <Hero creatorCount={creatorCount} signedIn={Boolean(user)} />
        <Marquee />

        <section id="films" className="px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-6xl">
            <SectionHead
              eyebrow="What's playing"
              title={
                <>
                  Short. Uncomfortable.
                  <br />
                  <span className="text-bone-faint">
                    Deliberately unfinished.
                  </span>
                </>
              }
              lead="Every film here takes an idea apart and stops exactly where it starts to be about you."
            />

            {films.length === 0 ? (
              <EmptyFeed />
            ) : (
              <div className="mx-auto max-w-2xl">
                {films.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    timeZone="UTC"
                    showAuthor
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {creators.length > 0 && (
          <section className="px-5 py-24 sm:px-8 sm:py-32">
            <div className="mx-auto max-w-6xl">
              <SectionHead
                eyebrow="Creators"
                title={
                  <>
                    The people
                    <br />
                    <span className="text-gradient">behind them.</span>
                  </>
                }
                lead="Each one has their own address. Walk in, look around, follow the ones that make you think."
              />
              <CreatorRail creators={creators} />
            </div>
          </section>
        )}

        <Process />
        <Faq />
        <Waitlist />
      </main>

      <Footer />
    </>
  );
}

/**
 * First-run state. A brand-new platform with an empty feed needs to look
 * like an invitation, not a failure.
 */
function EmptyFeed() {
  return (
    <div className="card rounded-3xl p-10 text-center sm:p-16">
      <h3 className="display text-2xl sm:text-3xl">Nothing here yet.</h3>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-bone-dim">
        {brand.name} is brand new. The first films go up soon — or you could
        put yours up first.
      </p>
      <Link
        href="/signup"
        className="mt-8 inline-flex rounded-full bg-gradient-to-r from-gold to-ember px-7 py-4 text-sm font-semibold text-ink transition-transform hover:scale-[1.02]"
      >
        Claim your handle
      </Link>
    </div>
  );
}
