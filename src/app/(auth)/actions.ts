"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { config, soloMode } from "@/lib/config";
import {
  createSession,
  destroySession,
  hashPassword,
  validateHandle,
  verifyPassword,
} from "@/lib/auth";

export type AuthState = { error: string } | null;

const signupSchema = z.object({
  handle: z.string().min(1, "Pick a handle."),
  displayName: z.string().trim().min(1, "What should people call you?").max(60),
  email: z.string().email("That email doesn't look right."),
  password: z.string().min(8, "Use at least 8 characters."),
});

export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  // Enforced here, not only by hiding the form. A server action is callable
  // by anyone who knows its generated id, so a hidden page is not a closed
  // door — this is.
  if (soloMode) {
    return { error: "This site isn't open for signups." };
  }

  const parsed = signupSchema.safeParse({
    handle: formData.get("handle"),
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const handleCheck = validateHandle(parsed.data.handle);
  if (!handleCheck.ok) return { error: handleCheck.error };

  const email = parsed.data.email.toLowerCase();
  const handle = handleCheck.handle;

  const clash = await db.user.findFirst({
    where: { OR: [{ handle }, { email }] },
    select: { handle: true, email: true },
  });

  if (clash) {
    return {
      error:
        clash.handle === handle
          ? "That handle is taken."
          : "There's already an account with that email.",
    };
  }

  const user = await db.user.create({
    data: {
      handle,
      email,
      displayName: parsed.data.displayName.trim(),
      passwordHash: await hashPassword(parsed.data.password),
      // Frozen at signup, so changing the platform rate later never
      // silently alters the deal for people already here.
      platformFeeBps: config.platform.feeBps,
      // Selling stays off until an admin grants it. Publishing is open.
      canSell: false,
    },
  });

  await createSession(user.id);
  redirect("/studio");
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");

  const user = await db.user.findUnique({ where: { email } });

  // One message for "no such account" and "wrong password" alike —
  // distinguishing them turns this form into an account-existence oracle.
  const generic = { error: "Wrong email or password." };

  if (!user) {
    // Spend roughly the same time as a real verification would, so the
    // response time doesn't reveal whether the account exists.
    await hashPassword(password);
    return generic;
  }

  if (!(await verifyPassword(password, user.passwordHash))) return generic;

  if (user.suspended) {
    return { error: "This account is suspended. Reply to your welcome email." };
  }

  await createSession(user.id);
  redirect("/studio");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
