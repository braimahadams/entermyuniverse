import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Ambience } from "@/components/Ambience";
import { Masonry } from "@/components/Masonry";
import { Nav } from "@/components/Nav";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SearchBox } from "@/components/SearchBox";
import { Footer } from "@/components/sections";
import { ThoughtCard } from "@/components/ThoughtCard";
import { getCurrentUser } from "@/lib/auth";
import {
  getCollectionsWithCounts,
  getCreatorByHandle,
  getThoughts,
} from "@/lib/creators";
import { config, soloMode } from "@/lib/config";
import { parseHandle } from "@/lib/handle";
import { possessiveFirstName } from "@/lib/types";

export const revalidate = 300;

type Params = {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ c?: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const handle = parseHandle((await params).handle);
  if (!handle) return { title: "Not found" };

  const creator = await getCreatorByHandle(handle);
  if (!creator) return { title: "Not found" };

  return {
    title: `Thoughts — ${creator.displayName}`,
    description: `Every idea ${creator.displayName} has put down, grouped by what it's about.`,
    alternates: { canonical: `${config.siteUrl}/@${handle}/thoughts` },
  };
}

export default async function ThoughtLibraryPage({
  params,
  searchParams,
}: Params) {
  const handle = parseHandle((await params).handle);
  if (!handle) notFound();

  const { c: activeCollection } = await searchParams;

  const [viewer, creator] = await Promise.all([
    getCurrentUser(),
    getCreatorByHandle(handle),
  ]);
  if (!creator) notFound();

  const [thoughts, collections] = await Promise.all([
    getThoughts(creator.id, { collection: activeCollection }),
    getCollectionsWithCounts(creator.id),
  ]);

  const current = collections.find((c) => c.slug === activeCollection);

  return (
    <>
      <Ambience />
      <ScrollReveal />
      <Nav user={viewer} solo={soloMode} />

      <main className="relative z-10 px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
        <div className="mx-auto max-w-6xl">
          <header className="max-w-2xl">
            <span className="eyebrow">
              {possessiveFirstName(creator.displayName)} thoughts
            </span>
            <h1 className="display mt-4 text-[clamp(2.25rem,6vw,4rem)] leading-[1.02]">
              {current ? current.name : "Everything, by what it's about."}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-bone-dim">
              {current?.description ??
                "Not sorted by date. Ideas don't expire, and the newest one is rarely the one worth starting with."}
            </p>
          </header>

          <div className="mt-10 max-w-lg">
            <SearchBox handle={handle} />
          </div>

          {/* Collections. Horizontally scrollable on mobile rather than
              wrapped into a wall of chips. */}
          {collections.length > 0 && (
            <nav
              aria-label="Collections"
              className="-mx-5 mt-10 flex gap-2 overflow-x-auto px-5 pb-3 sm:mx-0 sm:flex-wrap sm:px-0"
            >
              <CollectionChip
                href={`/@${handle}/thoughts`}
                label="All"
                count={creator.thoughtCount}
                active={!activeCollection}
              />
              {collections.map((c) => (
                <CollectionChip
                  key={c.slug}
                  href={`/@${handle}/thoughts?c=${c.slug}`}
                  label={c.name}
                  count={c.count}
                  active={c.slug === activeCollection}
                />
              ))}
            </nav>
          )}

          <div className="mt-12">
            {thoughts.length === 0 ? (
              <p className="card rounded-3xl p-12 text-center text-sm text-bone-dim">
                Nothing here yet.
              </p>
            ) : (
              <Masonry>
                {thoughts.map((thought, i) => (
                  <ThoughtCard
                    key={thought.id}
                    thought={thought}
                    priority={i < 3}
                  />
                ))}
              </Masonry>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

function CollectionChip({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors duration-300 ${
        active
          ? "border-ember/50 bg-ember/10 text-ember"
          : "border-line text-bone-dim hover:border-line-bright hover:text-bone"
      }`}
    >
      {label}
      <span className="ml-2 text-xs opacity-60">{count}</span>
    </Link>
  );
}
