import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "@/lib/config";

/**
 * FILE STORAGE
 *
 * Where creators' uploaded films actually live.
 *
 *   local — written to /public/media. Free, zero setup, perfect for
 *           development and for a self-hosted VPS. Does NOT work on
 *           Vercel: the filesystem is read-only and nothing persists
 *           between requests.
 *   blob  — Vercel Blob. Free tier covers a real early audience, and the
 *           browser uploads straight to it.
 *
 * The upload path matters more than it looks. A serverless request body
 * is capped at ~4.5 MB, which is less than a phone shoots in ten seconds.
 * So in production the file never touches this app: the browser gets a
 * short-lived token and uploads directly to the storage provider. This
 * module only handles the local path and deletions.
 */

export const MAX_UPLOAD_BYTES = 512 * 1024 * 1024; // 512 MB

export const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

export type StoredFile = {
  /** What goes in Video.sourceId. */
  key: string;
  url: string;
  sizeBytes: number;
};

/** True when the browser should upload directly rather than via this app. */
export const usesDirectUpload = config.storage.provider === "blob";

/**
 * Turn a filename into something safe to put on a filesystem or in a URL.
 * Untrusted input: a creator can name a file anything, including
 * `../../../etc/passwd`.
 */
export function safeKey(userId: string, filename: string): string {
  const ext = path.extname(filename).toLowerCase().slice(0, 6) || ".mp4";
  const base = path
    .basename(filename, path.extname(filename))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "film";

  // userId prefix keeps one creator's uploads from colliding with another's.
  return `${userId}/${Date.now()}-${base}${ext}`;
}

/** Local-disk write. Only reachable when STORAGE_PROVIDER=local. */
export async function storeLocal(
  key: string,
  data: ArrayBuffer,
): Promise<StoredFile> {
  const target = path.join(process.cwd(), "public", "media", key);

  // Guard against a key escaping the media directory, however it was built.
  const mediaRoot = path.join(process.cwd(), "public", "media");
  if (!target.startsWith(mediaRoot + path.sep)) {
    throw new Error("Invalid upload path.");
  }

  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(data));

  return {
    key,
    url: `/media/${key}`,
    sizeBytes: data.byteLength,
  };
}

/** Best-effort cleanup when a film is deleted. Never throws. */
export async function removeStored(key: string): Promise<void> {
  try {
    if (config.storage.provider === "blob") {
      if (!key.startsWith("http")) return;
      const { del } = await import("@vercel/blob");
      await del(key);
      return;
    }

    if (key.startsWith("http")) return; // externally hosted, not ours to delete

    const target = path.join(process.cwd(), "public", "media", key);
    const mediaRoot = path.join(process.cwd(), "public", "media");
    if (!target.startsWith(mediaRoot + path.sep)) return;

    await unlink(target);
  } catch {
    // A missing file is the desired end state anyway. Never fail a delete
    // because cleanup couldn't find something.
  }
}
