import { config } from "@/lib/config";

/**
 * VIDEO HOSTING
 *
 * The app never asks "where is this video?" — it asks this module for a
 * playable source. Swapping hosts is VIDEO_PROVIDER in .env plus keys.
 *
 *   local  — MP4s in /public/media. Free, instant, no account. Fine up to
 *            a few hundred visitors; Vercel's bandwidth is the ceiling.
 *   url    — any direct MP4/HLS URL. Point it at Cloudflare R2 (10 GB free,
 *            zero egress fees) and this carries you a long way.
 *   mux    — adaptive streaming, real analytics. ~$0.005/min stored.
 *   stream — Cloudflare Stream. $5/mo per 1,000 minutes, all-in.
 *
 * `sourceId` on a Video row means whatever the active provider needs:
 * a filename, a URL, a Mux playback ID, a Cloudflare UID.
 */

export type VideoSource = {
  /** What to feed a <video> element or player. */
  url: string;
  /** "mp4" plays natively everywhere. "hls" needs a player that speaks it. */
  kind: "mp4" | "hls";
  poster: string | null;
};

export function resolveVideo(
  sourceId: string,
  thumbnailUrl?: string | null,
): VideoSource {
  switch (config.video.provider) {
    case "mux":
      return {
        url: `https://stream.mux.com/${sourceId}.m3u8`,
        kind: "hls",
        // Mux generates thumbnails for free — no need to upload one.
        poster: thumbnailUrl || `https://image.mux.com/${sourceId}/thumbnail.webp?width=720&fit_mode=preserve`,
      };

    case "stream": {
      const acct = config.video.cloudflareAccountId;
      return {
        url: `https://customer-${acct}.cloudflarestream.com/${sourceId}/manifest/video.m3u8`,
        kind: "hls",
        poster:
          thumbnailUrl ||
          `https://customer-${acct}.cloudflarestream.com/${sourceId}/thumbnails/thumbnail.jpg`,
      };
    }

    case "url":
      return {
        url: sourceId,
        kind: sourceId.includes(".m3u8") ? "hls" : "mp4",
        poster: thumbnailUrl || null,
      };

    case "local":
    default:
      return {
        url: sourceId.startsWith("http") ? sourceId : `/media/${sourceId}`,
        kind: "mp4",
        poster: thumbnailUrl || null,
      };
  }
}

/**
 * HLS needs hls.js in browsers that aren't Safari. Rather than ship that
 * library before it earns its place, the player checks this and falls back
 * to native playback. Flip to true when you move to mux/stream and add
 * hls.js — see the note in components/VideoPlayer.tsx.
 */
export const providerNeedsHlsPlayer =
  config.video.provider === "mux" || config.video.provider === "stream";
