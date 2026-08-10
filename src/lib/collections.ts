/**
 * The taxonomy.
 *
 * Fixed and curated rather than free-form tags. Tags sprawl — you end up
 * with "money", "Money" and "finance" meaning the same thing and no page
 * worth visiting. A closed set means every collection page is a real
 * destination, and choosing where a thought belongs stays a two-second
 * decision instead of a naming problem.
 *
 * Order matters: it's the order they appear in the library.
 */

export const COLLECTIONS = [
  {
    slug: "identity",
    name: "Identity",
    description: "Who you think you are, and who installed that idea.",
  },
  {
    slug: "reality",
    name: "Reality",
    description: "What's actually there, underneath the agreed-upon version.",
  },
  {
    slug: "fear",
    name: "Fear",
    description: "The thing running the decision you think you're making freely.",
  },
  {
    slug: "discipline",
    name: "Discipline",
    description: "Why willpower keeps failing, and what actually holds.",
  },
  {
    slug: "success",
    name: "Success",
    description: "Whose definition you're chasing, and whether it was ever yours.",
  },
  {
    slug: "money",
    name: "Money",
    description: "A language you were taught by people it didn't work for.",
  },
  {
    slug: "relationships",
    name: "Relationships",
    description: "What people are really asking for when they ask for something else.",
  },
  {
    slug: "creativity",
    name: "Creativity",
    description: "Where ideas come from, and why they stop coming.",
  },
  {
    slug: "human-nature",
    name: "Human Nature",
    description: "The patterns that show up in everyone, including you.",
  },
  {
    slug: "technology",
    name: "Technology",
    description: "What the tools are doing to the people holding them.",
  },
  {
    slug: "purpose",
    name: "Purpose",
    description: "The question behind the restlessness.",
  },
  {
    slug: "failure",
    name: "Failure",
    description: "What it costs, what it teaches, and what it never teaches.",
  },
  {
    slug: "social-media",
    name: "Social Media",
    description: "Attention, performance, and the price of being seen.",
  },
  {
    slug: "business",
    name: "Business",
    description: "How value actually moves, past the advice.",
  },
  {
    slug: "time",
    name: "Time",
    description: "The only thing you're really spending.",
  },
  {
    slug: "learning",
    name: "Learning",
    description: "Why understanding and knowing are not the same thing.",
  },
  {
    slug: "self-awareness",
    name: "Self Awareness",
    description: "Seeing the thing you're standing inside of.",
  },
  {
    slug: "freedom",
    name: "Freedom",
    description: "What you'd actually do if nobody was watching or waiting.",
  },
] as const;

export type CollectionSlug = (typeof COLLECTIONS)[number]["slug"];

/**
 * Roughly how long a piece takes to read.
 *
 * 200 wpm is the usual estimate for comfortable prose. Shown on the
 * timeline so someone can tell a one-line thought from a long one before
 * they commit to opening it.
 */
export function readingMinutes(text: string | null | undefined): number {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  // Under a minute isn't worth announcing.
  return words < 120 ? 0 : Math.round(words / 200);
}

