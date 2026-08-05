import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { PrismaClient } from "@prisma/client";
import { COLLECTIONS } from "../src/lib/collections";

const db = new PrismaClient();
const scryptAsync = promisify(scrypt);

/**
 * Seed.
 *
 * Creates the owner account as the first admin with selling switched on,
 * seeds the collection taxonomy, and sets up default hours and offers.
 *
 * Writes no posts — those are the owner's to write.
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
    update: {
      isAdmin: true,
      approved: true,
      canSell: true,
      verified: true,
      featured: true,
    },
    create: {
      handle,
      email,
      displayName: process.env.OWNER_NAME || "Admin",
      passwordHash: await hashPassword(password),
      tagline: "Thoughts that don't fit anywhere else.",
      bio: null,
      timezone,
      // The founding account: admin, approved, verified, and the first
      // one allowed to take bookings.
      isAdmin: true,
      approved: true,
      canSell: true,
      verified: true,
      featured: true,
      platformFeeBps: Number(process.env.PLATFORM_FEE_BPS ?? 1500),
    },
  });
  console.log(`  owner    @${owner.handle}  (${owner.email})`);

  for (const [i, c] of COLLECTIONS.entries()) {
    await db.collection.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, position: i },
      create: {
        slug: c.slug,
        name: c.name,
        description: c.description,
        position: i,
      },
    });
  }
  console.log(`  themes   ${COLLECTIONS.length} collections`);

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
      priceCents: 3_000,
      currency: "eur",
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
      priceCents: 6_500,
      currency: "eur",
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
