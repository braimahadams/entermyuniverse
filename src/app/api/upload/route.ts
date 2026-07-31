import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getCurrentUser } from "@/lib/auth";
import { config } from "@/lib/config";
import {
  ACCEPTED_VIDEO_TYPES,
  MAX_UPLOAD_BYTES,
  safeKey,
  storeLocal,
} from "@/lib/providers/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Upload endpoint, two shapes depending on the storage provider.
 *
 *   local — the file is POSTed here as multipart and written to disk.
 *           Only viable in development or on a box with a real filesystem.
 *   blob  — the file never touches this route. The browser asks for a
 *           short-lived token, then uploads straight to Vercel Blob.
 *
 * That second path isn't an optimisation, it's a requirement: a serverless
 * request body caps out around 4.5 MB, which is a couple of seconds of
 * phone video. Anything that routes big files through the app is broken by
 * design in production.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }
  if (user.suspended) {
    return NextResponse.json({ error: "Account suspended." }, { status: 403 });
  }

  /* ── direct-to-blob ── */
  if (config.storage.provider === "blob") {
    const body = (await request.json()) as HandleUploadBody;

    try {
      const result = await handleUpload({
        body,
        request,
        // Runs before a token is issued. This is the security boundary:
        // without it, anyone with the endpoint could upload anything.
        onBeforeGenerateToken: async () => ({
          allowedContentTypes: [...ACCEPTED_VIDEO_TYPES],
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
          // Ties the finished blob back to the uploader when the
          // completion callback fires.
          tokenPayload: JSON.stringify({ userId: user.id }),
        }),
        // Fires from Vercel's side once the upload lands. The film row is
        // still created by the studio form; this is just where you'd hook
        // in transcoding or virus scanning later.
        onUploadCompleted: async ({ blob }) => {
          console.log(`[upload] ${user.handle} stored ${blob.url}`);
        },
      });

      return NextResponse.json(result);
    } catch (err) {
      console.error("[upload] blob token failed:", err);
      return NextResponse.json(
        { error: "Upload couldn't start." },
        { status: 400 },
      );
    }
  }

  /* ── local disk ── */
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }
  if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Upload an MP4, MOV or WebM." },
      { status: 415 },
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `That file is over ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.` },
      { status: 413 },
    );
  }

  const stored = await storeLocal(
    safeKey(user.id, file.name),
    await file.arrayBuffer(),
  );

  return NextResponse.json({
    key: stored.key,
    url: stored.url,
    sizeBytes: stored.sizeBytes,
  });
}
