import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/lib/db";

/**
 * Authentication.
 *
 * Hand-rolled on node:crypto rather than an auth library. The requirement
 * here is email + password and nothing else — no OAuth, no magic links, no
 * provider config — and every library that does this also drags in a
 * dependency tree, a hosted service, or both. This is ~100 lines and has
 * no runtime cost.
 *
 * Two halves:
 *   - passwords hashed with scrypt (memory-hard, so GPUs don't help much)
 *   - sessions stored in the database, so they can actually be revoked.
 *     A stateless JWT can't be taken back before it expires; a suspended
 *     account needs to lose access now, not in seven days.
 */

const scryptAsync = promisify(scrypt);

const COOKIE = "emu_session";
const SESSION_DAYS = 30;

/* ── passwords ─────────────────────────────────────────────── */

export async function hashPassword(password: string): Promise<string> {
  // Per-user salt, so two people with the same password get different
  // hashes and one rainbow table can't cover both.
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hash, "hex");

  if (derived.length !== expected.length) return false;
  // Constant-time: a byte-by-byte early return leaks the hash through
  // response timing.
  return timingSafeEqual(derived, expected);
}

/* ── sessions ──────────────────────────────────────────────── */

export async function createSession(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);

  const session = await db.session.create({
    data: { userId, expiresAt },
  });

  (await cookies()).set(COOKIE, session.id, {
    httpOnly: true, // JavaScript can't read it, so XSS can't steal it
    sameSite: "lax", // survives normal navigation, blocks cross-site POSTs
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;

  if (id) {
    // Deleting the row is what actually ends the session; clearing the
    // cookie alone would leave a valid credential in someone's browser.
    await db.session.deleteMany({ where: { id } });
  }
  jar.delete(COOKIE);
}

export type CurrentUser = {
  id: string;
  handle: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  canSell: boolean;
  suspended: boolean;
  timezone: string;
  platformFeeBps: number;
};

/**
 * The signed-in user, or null.
 *
 * Wrapped in React's `cache` so that a layout, a page, and three
 * components asking "who is this?" during one render costs a single
 * database query.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const id = (await cookies()).get(COOKIE)?.value;
  if (!id) return null;

  const session = await db.session.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          handle: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          isAdmin: true,
          canSell: true,
          suspended: true,
          timezone: true,
          platformFeeBps: true,
        },
      },
    },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await db.session.deleteMany({ where: { id } });
    return null;
  }

  return session.user;
});

/** For server actions and routes that must not run for anonymous callers. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("You need to be signed in.");
  if (user.suspended) throw new Error("This account is suspended.");
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!user.isAdmin) throw new Error("Not authorised.");
  return user;
}

/* ── handles ───────────────────────────────────────────────── */

/**
 * Reserved because they either already exist as routes or would let
 * someone impersonate the platform at /@support.
 */
const RESERVED = new Set([
  "admin", "api", "book", "booked", "booking", "studio", "login", "signup",
  "logout", "settings", "about", "help", "support", "terms", "privacy",
  "explore", "feed", "search", "new", "me", "you", "root", "system",
  "official", "team", "staff", "universe", "entermyuniverse", "www",
]);

export function validateHandle(raw: string): { ok: true; handle: string } | { ok: false; error: string } {
  const handle = raw.trim().toLowerCase().replace(/^@/, "");

  if (handle.length < 3) return { ok: false, error: "Handles need at least 3 characters." };
  if (handle.length > 24) return { ok: false, error: "Handles max out at 24 characters." };
  if (!/^[a-z0-9_]+$/.test(handle)) {
    return { ok: false, error: "Letters, numbers and underscores only." };
  }
  if (/^\d+$/.test(handle)) {
    return { ok: false, error: "Handles can't be only numbers." };
  }
  if (RESERVED.has(handle)) return { ok: false, error: "That handle is reserved." };

  return { ok: true, handle };
}
