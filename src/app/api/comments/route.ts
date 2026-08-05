import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { PUBLIC_FILTER } from "@/lib/creators";

export const dynamic = "force-dynamic";

const schema = z.object({
  postId: z.string().min(1),
  authorName: z.string().trim().min(1, "Add a name.").max(60),
  body: z
    .string()
    .trim()
    .min(2, "Write something first.")
    .max(3000, "That's longer than the post. Trim it down."),
  /** Optional, never shown — only so a reply can be answered privately. */
  authorEmail: z.string().email().optional().or(z.literal("")),
  /**
   * Honeypot. Permissive on purpose: rejecting a filled value would name
   * the trap in the validation error and teach a bot to skip it.
   */
  website: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the form." },
      { status: 400 },
    );
  }

  const input = parsed.data;

  // Answer a bot with success so it doesn't adapt, and write nothing.
  if (input.website) {
    return NextResponse.json({ message: "Sent." });
  }

  // The post has to be one a visitor could actually see — otherwise this
  // endpoint would accept replies to drafts and hidden posts.
  const post = await db.post.findFirst({
    where: { id: input.postId, ...PUBLIC_FILTER },
    select: { id: true },
  });

  if (!post) {
    return NextResponse.json({ error: "Unknown post." }, { status: 404 });
  }

  await db.comment.create({
    data: {
      postId: post.id,
      authorName: input.authorName,
      authorEmail: input.authorEmail || null,
      body: input.body,
      // Nothing is published unseen. This default is what lets the form
      // stay open to anyone without an account.
      approved: false,
    },
  });

  return NextResponse.json({
    message: "Sent. It'll appear once it's been read.",
  });
}
