import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Thumbnails may be served from whichever video provider is active.
    // Add hosts here as you switch providers (see src/lib/providers/video.ts).
    remotePatterns: [
      { protocol: "https", hostname: "image.mux.com" },
      { protocol: "https", hostname: "videodelivery.net" },
      { protocol: "https", hostname: "customer-*.cloudflarestream.com" },
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
