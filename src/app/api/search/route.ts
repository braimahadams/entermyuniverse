import { NextResponse } from "next/server";
import { searchThoughts } from "@/lib/search";
import { config, soloMode } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";

  // In solo mode every search is scoped to the one person whose site this
  // is, whether or not the caller asked for it.
  const handle = soloMode
    ? config.primaryHandle
    : url.searchParams.get("handle")?.replace(/^@/, "").toLowerCase();

  const results = await searchThoughts(q, { handle: handle || undefined });

  return NextResponse.json({ results });
}
