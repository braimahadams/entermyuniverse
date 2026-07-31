/**
 * Platform copy, in one file.
 *
 * You will rewrite this ten times before you touch a component. Keep it
 * here so that's a two-minute job.
 */

export const brand = {
  name: "Enter My Universe",
  /** Short mark for the nav and tight spaces. */
  short: "Universe",
  domain: "entermyuniverse.com",

  tagline: "Everyone has a universe. Most people never let anyone in.",

  metaTitle: "Enter My Universe — short films, and the people behind them",
  metaDescription:
    "A place for people who think out loud. Short films about the system, virality, money and the mind — and a door to the person who made them.",

  hero: {
    line1: "Everyone is talking.",
    line2: "Almost no one is",
    line3: "saying anything.",
    sub: "Short films about the parts of life nobody explains. Every creator here has a universe — walk into one, and if it lands, talk to the person who built it.",
  },

  /** What a creator's page is called, in prose. */
  universeWord: "universe",

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
      title: "Wander",
      body: "Films that take an idea apart and stop exactly where it starts to be about you. No answers handed out.",
    },
    {
      n: "02",
      title: "Enter",
      body: "Every creator has a universe at their own handle. Follow the ones that make you think, ignore the rest.",
    },
    {
      n: "03",
      title: "Talk",
      body: "Some creators open a door: book them, one to one, on video. Not a comment thread — an actual conversation.",
    },
  ],

  faq: [
    {
      q: "What is this?",
      a: "A place to watch people think out loud, and sometimes to reach them. Instagram gives you a comment box. This gives you forty-five uninterrupted minutes with someone whose head you want to be inside.",
    },
    {
      q: "Can I put my own films here?",
      a: "Yes. Claim a handle, and everything you publish lives at entermyuniverse.com/@you. Free, and yours to take with you.",
    },
    {
      q: "Can I sell calls too?",
      a: "Not yet by default. Publishing is open to everyone; taking bookings is switched on account by account while the platform is young. Build something worth booking and ask.",
    },
    {
      q: "What does it cost to book someone?",
      a: "Whatever they set. You pay once, up front, and you can move or cancel it yourself up to 12 hours before — refunded in full, without messaging anyone.",
    },
    {
      q: "Is any of it recorded?",
      a: "Only if both of you want it. Default is no recording, no notes shared, nothing published.",
    },
  ],

  social: {
    instagram: "https://instagram.com/yourhandle",
  },
} as const;
