import { NextResponse } from "next/server";
import { getAvailability } from "@/lib/scheduling";
import { db } from "@/lib/db";
import { safeTimeZone } from "@/lib/time";

// Availability changes the instant anyone books, so it must never be cached.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const handle = url.searchParams.get("handle")?.replace(/^@/, "").toLowerCase();
  const offerSlug = url.searchParams.get("offer");
  const timezone = safeTimeZone(url.searchParams.get("tz"));

  if (!handle || !offerSlug) {
    return NextResponse.json({ error: "Missing creator or offer." }, { status: 400 });
  }

  const creator = await db.user.findUnique({
    where: { handle },
    select: { id: true, canSell: true, suspended: true },
  });

  if (!creator || creator.suspended || !creator.canSell) {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  // Session slugs are unique per creator, not globally — so the lookup
  // needs both halves.
  const sessionType = await db.sessionType.findUnique({
    where: { userId_slug: { userId: creator.id, slug: offerSlug } },
  });

  if (!sessionType?.active) {
    return NextResponse.json({ error: "Unknown session." }, { status: 404 });
  }

  const days = await getAvailability(sessionType.id, timezone);

  return NextResponse.json({
    timezone,
    durationMin: sessionType.durationMin,
    days,
  });
}
