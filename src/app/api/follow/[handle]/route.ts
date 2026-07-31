import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function resolve(handleParam: string, viewerId: string) {
  const handle = decodeURIComponent(handleParam).replace(/^@/, "").toLowerCase();

  const target = await db.user.findUnique({
    where: { handle },
    select: { id: true, suspended: true },
  });

  if (!target || target.suspended) return { error: "Not found.", status: 404 };
  // Following yourself inflates your own count and helps nobody.
  if (target.id === viewerId) return { error: "You can't follow yourself.", status: 400 };

  return { targetId: target.id };
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ handle: string }> },
) {
  const viewer = await getCurrentUser();
  if (!viewer) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const resolved = await resolve((await params).handle, viewer.id);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  // Upsert rather than create: a double-tap shouldn't be a unique-constraint
  // error the user has to see.
  await db.follow.upsert({
    where: {
      followerId_followingId: {
        followerId: viewer.id,
        followingId: resolved.targetId,
      },
    },
    update: {},
    create: { followerId: viewer.id, followingId: resolved.targetId },
  });

  return NextResponse.json({ following: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ handle: string }> },
) {
  const viewer = await getCurrentUser();
  if (!viewer) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const resolved = await resolve((await params).handle, viewer.id);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  await db.follow.deleteMany({
    where: { followerId: viewer.id, followingId: resolved.targetId },
  });

  return NextResponse.json({ following: false });
}
