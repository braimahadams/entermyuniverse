import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const scryptAsync = promisify(scrypt);

/**
 * Seed.
 *
 * Creates the owner account (you) as the platform's first admin, with
 * selling switched on, plus example films and one other creator so the
 * feed doesn't look like a single-user site on day one.
 *
 * Safe to re-run: everything upserts.
 */

// Duplicated from src/lib/auth.ts rather than imported — this script runs
// under plain tsx, outside Next's module resolution and its "server-only"
// boundaries. Keep the two in step.
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

const OWNER_FILMS = [
  {
    slug: "why-you-are-tired",
    title: "Why you're tired and it has nothing to do with sleep",
    hook: "Exhaustion is a signal, not a state.",
    topic: "mind",
    openQuestion:
      "What are you spending energy on that you never actually agreed to?",
    description:
      "Most people treat tiredness as a body problem. It's usually a consent problem — energy leaving through doors you never chose to open.",
    sourceId: "sample-1.mp4",
    durationSec: 184,
    featured: true,
    position: 0,
  },
  {
    slug: "the-system-is-not-broken",
    title: "The system isn't broken. It was built like this.",
    hook: "Stop waiting for a fix that was never coming.",
    topic: "system",
    openQuestion: "Which rule are you still following that nobody is enforcing?",
    description:
      "A system producing the same outcome for a century is not malfunctioning. Once you see the design, you stop asking it for permission.",
    sourceId: "sample-2.mp4",
    durationSec: 221,
    position: 1,
  },
  {
    slug: "virality-is-a-nervous-system",
    title: "Virality is a nervous system, not an algorithm",
    hook: "People share what changes their body, not their mind.",
    topic: "virality",
    openQuestion:
      "What do you actually want people to feel — before they understand anything?",
    description:
      "Everyone studies the algorithm. The algorithm is studying something else entirely: what happened in someone's chest in the first two seconds.",
    sourceId: "sample-3.mp4",
    durationSec: 197,
    position: 2,
  },
  {
    slug: "money-is-a-language",
    title: "Money is a language and you were taught it wrong",
    hook: "You're not bad with money. You're fluent in someone else's dialect.",
    topic: "money",
    openQuestion: "Who taught you what money means — and did it work for them?",
    description:
      "Every financial instinct you have was installed by someone. The question worth asking is whether it worked for the person who installed it.",
    sourceId: "sample-4.mp4",
    durationSec: 240,
    position: 3,
  },
];

const GUEST_FILMS = [
  {
    slug: "nobody-is-coming",
    title: "Nobody is coming to give you permission",
    hook: "The waiting is the whole trap.",
    topic: "system",
    openQuestion: "What are you waiting to be allowed to do?",
    description:
      "There is no committee. There was never a committee. The permission you're waiting for is a thing you invented so the risk stayed theoretical.",
    sourceId: "sample-5.mp4",
    durationSec: 168,
    position: 0,
  },
  {
    slug: "attention-is-rent",
    title: "You're paying rent on attention you don't own",
    hook: "Every app is a landlord.",
    topic: "virality",
    openQuestion: "If the platform vanished tomorrow, what would you still have?",
    description:
      "You build the audience, they own the address. Then the rules change overnight and you find out what you actually owned.",
    sourceId: "sample-6.mp4",
    durationSec: 203,
    position: 1,
  },
];

async function main() {
  console.log("\n→ Seeding Enter My Universe\n");

  const handle = (process.env.OWNER_HANDLE || "admin").toLowerCase();
  const email = (process.env.OWNER_EMAIL || "you@example.com").toLowerCase();
  const password = process.env.OWNER_PASSWORD;

  if (!password) {
    console.error("  ✗ OWNER_PASSWORD is not set in .env — refusing to seed.");
    process.exit(1);
  }

  const timezone =
    process.env.OWNER_TIMEZONE ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "UTC";

  const owner = await db.user.upsert({
    where: { handle },
    update: { isAdmin: true, canSell: true, verified: true, featured: true },
    create: {
      handle,
      email,
      displayName: process.env.OWNER_NAME || "Admin",
      passwordHash: await hashPassword(password),
      tagline:
        "Short films about the system, virality, money and the mind. Then, if it lands, we talk.",
      bio: "I make things that take an idea apart and stop before the comfortable part.",
      timezone,
      // The founding account: admin, verified, and the first one allowed
      // to take bookings.
      isAdmin: true,
      canSell: true,
      verified: true,
      featured: true,
      platformFeeBps: Number(process.env.PLATFORM_FEE_BPS ?? 1500),
    },
  });
  console.log(`  owner    @${owner.handle}  (${owner.email})`);

  // A second creator, so the feed and the universe cards have something to
  // be. Publishing-only — no selling — which is the default for everyone.
  const guest = await db.user.upsert({
    where: { handle: "mara" },
    update: {},
    create: {
      handle: "mara",
      email: "mara@example.com",
      displayName: "Mara Quinn",
      passwordHash: await hashPassword(randomBytes(24).toString("hex")),
      tagline: "Writing about the quiet economics of ordinary life.",
      timezone: "Europe/London",
      canSell: false,
    },
  });
  console.log(`  creator  @${guest.handle}`);

  for (const [user, films] of [
    [owner, OWNER_FILMS],
    [guest, GUEST_FILMS],
  ] as const) {
    for (const film of films) {
      await db.video.upsert({
        where: { userId_slug: { userId: user.id, slug: film.slug } },
        update: film,
        create: { ...film, userId: user.id },
      });
    }
    console.log(`  films    ${films.length} for @${user.handle}`);
  }

  const sessions = [
    {
      slug: "one-talk",
      name: "One Talk",
      tagline: "45 minutes. One problem. Taken all the way down.",
      description:
        "You bring the thing you keep circling. We go past the version you've already told your friends, and find the shape underneath it.",
      includes: [
        "45 minutes, one to one, on video",
        "One problem — chosen by you, in advance",
        "A written recap within 24 hours",
        "No recording unless you ask for one",
      ].join("\n"),
      durationMin: 45,
      priceCents: 12_000,
      bufferMin: 15,
      noticeHours: 12,
      horizonDays: 21,
      maxPerWeek: 6,
      position: 0,
    },
    {
      slug: "deep-talk",
      name: "Deep Talk",
      tagline: "90 minutes. For when it's not one problem.",
      description:
        "Twice the room. For decisions with a lot attached to them — a direction, a business, a life you're about to change on purpose.",
      includes: [
        "90 minutes, one to one, on video",
        "Pre-session questionnaire so we start warm",
        "A written recap and a plan you can act on",
        "One follow-up message thread, two weeks",
      ].join("\n"),
      durationMin: 90,
      priceCents: 25_000,
      bufferMin: 30,
      noticeHours: 24,
      horizonDays: 28,
      maxPerWeek: 3,
      position: 1,
    },
  ];

  for (const session of sessions) {
    await db.sessionType.upsert({
      where: { userId_slug: { userId: owner.id, slug: session.slug } },
      update: session,
      create: { ...session, userId: owner.id },
    });
  }
  console.log(`  sessions ${sessions.length} for @${owner.handle}`);

  const existingRules = await db.availabilityRule.count({
    where: { userId: owner.id },
  });
  if (existingRules === 0) {
    for (const weekday of [1, 2, 3, 4, 5]) {
      await db.availabilityRule.create({
        data: { userId: owner.id, weekday, startMin: 14 * 60, endMin: 19 * 60, timezone },
      });
    }
    console.log(`  hours    Mon-Fri 14:00-19:00 (${timezone})`);
  } else {
    console.log(`  hours    ${existingRules} rule(s) already set, left alone`);
  }

  console.log("\n✓ Done.\n");
  console.log(`  Sign in as  ${owner.email}`);
  console.log(`  Your page   http://localhost:3000/@${owner.handle}`);
  console.log(`  Studio      http://localhost:3000/studio\n`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
