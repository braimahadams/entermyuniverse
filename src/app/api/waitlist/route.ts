import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({
  email: z.string().email("That doesn't look like an email address."),
  name: z.string().max(120).optional(),
  interest: z.string().max(500).optional(),
  source: z.string().max(60).optional(),
  /** Omit for the platform's own list. */
  creatorHandle: z.string().max(30).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check that email." },
      { status: 400 },
    );
  }

  const { email, creatorHandle, ...rest } = parsed.data;
  const normalised = email.toLowerCase();

  // A creator-specific list, or the platform's own when no handle is given.
  const creator = creatorHandle
    ? await db.user.findUnique({
        where: { handle: creatorHandle.replace(/^@/, "").toLowerCase() },
        select: { id: true },
      })
    : null;

  // Deliberately not an upsert. The unique index is [email, creatorId] and
  // creatorId is nullable — SQL treats NULLs as distinct, so the platform
  // list would happily accept the same address over and over.
  const existing = await db.waitlist.findFirst({
    where: { email: normalised, creatorId: creator?.id ?? null },
    select: { id: true },
  });

  if (existing) {
    await db.waitlist.update({ where: { id: existing.id }, data: rest });
  } else {
    await db.waitlist.create({
      data: { email: normalised, creatorId: creator?.id ?? null, ...rest },
    });
  }

  return NextResponse.json({ message: "You're on the list." });
}
