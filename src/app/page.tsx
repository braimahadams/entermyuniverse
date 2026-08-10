import Link from "next/link";
import type { Metadata } from "next";
import { Ambience } from "@/components/Ambience";
import { Landing } from "@/components/Landing";
import { Footer } from "@/components/sections";
import {
  getCreatorByHandle,
  getTimeline,
  resolvePrimaryHandle,
} from "@/lib/creators";
import { config } from "@/lib/config";
import { brand } from "@/lib/brand";

export const revalidate = 60;

export const metadata: Metadata = {
  title: brand.metaTitle,
  description: brand.metaDescription,
  alternates: {
    canonical: config.siteUrl,
    types: { "application/rss+xml": `${config.siteUrl}/feed.xml` },
  },
};

/**
 * entermyuniverse.com.
 *
 * A landing page rather than a redirect. Someone arriving at the bare
 * domain hasn't been given a name to care about yet — they need one line
 * telling them what this is and one door to walk through. People who were
 * sent a link land on /@handle directly and never see this.
 */
export default async function RootPage() {
  const handle = await resolvePrimaryHandle();

  // No accounts at all — the very first run, before anyone has signed up.
  if (!handle) return <FirstRun />;

  const creator = await getCreatorByHandle(handle);
  if (!creator) return <FirstRun />;

  const latest = await getTimeline(creator.id, { limit: 3 });

  return (
    <>
      <Ambience />
      <Landing
        handle={creator.handle}
        displayName={creator.displayName}
        tagline={creator.tagline}
        latest={latest}
        postCount={creator.postCount}
      />
      <Footer />
    </>
  );
}

function FirstRun() {
  return (
    <>
      <Ambience />
      <main className="relative z-10 flex min-h-[100svh] items-center justify-center px-5">
        <div className="max-w-md text-center">
          <h1 className="display text-4xl">{brand.name}</h1>
          <p className="mt-4 text-sm leading-relaxed text-bone-dim">
            Nothing here yet.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex rounded-full border border-line-bright px-6 py-3 text-sm transition-colors hover:bg-bone/5"
          >
            Sign in
          </Link>
        </div>
      </main>
    </>
  );
}
