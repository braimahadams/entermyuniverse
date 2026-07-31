"use client";

import { useRef, useState } from "react";

/**
 * The upload control.
 *
 * Two code paths behind one interface. On `blob` the browser uploads
 * directly to storage with a short-lived token; on `local` it POSTs here.
 * The creator sees the same thing either way — a drop zone, a real
 * progress bar, and the duration read out of the file without a server
 * round trip.
 */

export type UploadResult = {
  key: string;
  url: string;
  sizeBytes: number;
  durationSec: number | null;
};

export function FilmUploader({
  provider,
  onUploaded,
}: {
  provider: "local" | "blob";
  onUploaded: (result: UploadResult) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<UploadResult | null>(null);
  const [dragging, setDragging] = useState(false);

  /**
   * Read the duration in the browser. Saves the creator typing it, and
   * saves us running ffmpeg on a server we're trying not to pay for.
   */
  async function readDuration(file: File): Promise<number | null> {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      const url = URL.createObjectURL(file);

      const cleanup = () => URL.revokeObjectURL(url);
      video.onloadedmetadata = () => {
        cleanup();
        resolve(Number.isFinite(video.duration) ? Math.round(video.duration) : null);
      };
      video.onerror = () => {
        cleanup();
        resolve(null);
      };
      video.src = url;
    });
  }

  async function upload(file: File) {
    setError(null);
    setDone(null);
    setProgress(0);

    const durationSec = await readDuration(file);

    try {
      if (provider === "blob") {
        const { upload: blobUpload } = await import("@vercel/blob/client");
        const blob = await blobUpload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
          onUploadProgress: ({ percentage }) => setProgress(percentage),
        });

        const result = {
          key: blob.url,
          url: blob.url,
          sizeBytes: file.size,
          durationSec,
        };
        setDone(result);
        setProgress(100);
        onUploaded(result);
        return;
      }

      // Local: XMLHttpRequest rather than fetch, purely because it's still
      // the only way to get upload progress events.
      const body = new FormData();
      body.append("file", file);

      const result = await new Promise<UploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload");

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve({ ...data, durationSec });
            } else {
              reject(new Error(data.error ?? "Upload failed."));
            }
          } catch {
            reject(new Error("Upload failed."));
          }
        };
        xhr.onerror = () => reject(new Error("Network trouble during upload."));
        xhr.send(body);
      });

      setDone(result);
      onUploaded(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setProgress(null);
    }
  }

  function pick(files: FileList | null) {
    const file = files?.[0];
    if (file) upload(file);
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-10 text-center transition-colors duration-300 ${
          dragging
            ? "border-ember bg-ember/[0.07]"
            : "border-line-bright bg-bone/[0.02] hover:border-bone/35 hover:bg-bone/[0.04]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={(e) => pick(e.target.files)}
        />

        {done ? (
          <>
            <span className="text-sm text-ember">Uploaded.</span>
            <span className="mt-1.5 text-xs text-bone-faint">
              {(done.sizeBytes / 1024 / 1024).toFixed(1)} MB
              {done.durationSec ? ` · ${done.durationSec}s` : ""} — click to
              replace
            </span>
          </>
        ) : progress !== null ? (
          <>
            <span className="text-sm text-bone">Uploading… {progress}%</span>
            <span className="mt-3 block h-1 w-48 overflow-hidden rounded-full bg-bone/10">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-gold to-ember transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </span>
          </>
        ) : (
          <>
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
              className="mb-3"
            >
              <path
                d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16"
                stroke="var(--color-bone-faint)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-sm text-bone">Drop a film here</span>
            <span className="mt-1.5 text-xs text-bone-faint">
              MP4, MOV or WebM · vertical looks best · up to 512 MB
            </span>
          </>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-ember">{error}</p>}
    </div>
  );
}
