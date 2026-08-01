/**
 * Site copy, in one file.
 *
 * Deliberately short. This is one person's place, not a product being
 * pitched — a visitor arrives already knowing whose page it is, because
 * they clicked a link with his name on it. Explaining the concept to them
 * is just noise between them and the videos.
 *
 * The platform-mode copy (hero, marquee, process, faq) only renders when
 * PRIMARY_HANDLE is cleared. It's kept here, unused, so reopening the site
 * to other creators is a config change rather than a rewrite.
 */

export const brand = {
  name: "Enter My Universe",
  /** Short mark for the nav and tight spaces. */
  short: "EMU",
  domain: "entermyuniverse.com",

  tagline: "Thoughts that don't fit anywhere else.",

  metaTitle: "Enter My Universe",
  metaDescription:
    "Where I say what I actually think — about the system, money, belief, and the parts of life nobody explains.",

  social: {
    instagram: "https://instagram.com/yourhandle",
  },

  /* ── platform mode only (PRIMARY_HANDLE unset) ─────────────── */

  hero: {
    line1: "Everyone is talking.",
    line2: "Almost no one is",
    line3: "saying anything.",
    sub: "Short films about the parts of life nobody explains — and a way to reach the people who make them.",
  },

  marquee: [
    "the system was built like this",
    "virality is a nervous system",
    "money is a language",
    "you are not tired, you are leaking",
    "attention is the last honest currency",
    "most advice is autobiography",
  ],

  process: [
    {
      n: "01",
      title: "Watch",
      body: "Films that take an idea apart and stop where it starts to be about you.",
    },
    {
      n: "02",
      title: "Follow",
      body: "Everyone here has their own page. Keep the ones that make you think.",
    },
    {
      n: "03",
      title: "Talk",
      body: "Some open a door: book them, one to one, on video. Not a comment thread.",
    },
  ],

  faq: [
    {
      q: "What is this?",
      a: "A place to watch people think out loud, and sometimes to reach them.",
    },
    {
      q: "What does it cost to book someone?",
      a: "Whatever they set. You pay once, and you can move or cancel it yourself up to 12 hours before, refunded in full.",
    },
    {
      q: "Is any of it recorded?",
      a: "Only if both of you want it. Default is no recording, nothing published.",
    },
  ],
} as const;
