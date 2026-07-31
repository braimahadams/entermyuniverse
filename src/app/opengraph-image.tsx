import { ImageResponse } from "next/og";
import { brand } from "@/lib/brand";

/**
 * The link preview.
 *
 * This renders every time someone taps the link in the Instagram bio, and
 * on every screenshot anyone ever takes of it. It is, by volume, the most
 * viewed surface in the whole product — worth generating properly rather
 * than letting platforms scrape a random frame.
 *
 * Generated at build time into a static image. No runtime cost.
 */

export const alt = brand.metaTitle;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#07070a",
          padding: 72,
          position: "relative",
        }}
      >
        {/* Same ember/violet light as the site, so the card and the page
            feel like one object. */}
        <div
          style={{
            position: "absolute",
            top: -260,
            left: -160,
            width: 760,
            height: 760,
            borderRadius: 9999,
            background:
              "radial-gradient(circle, rgba(255,122,69,0.30) 0%, rgba(255,122,69,0) 68%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -300,
            right: -180,
            width: 720,
            height: 720,
            borderRadius: 9999,
            background:
              "radial-gradient(circle, rgba(124,92,255,0.24) 0%, rgba(124,92,255,0) 70%)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 9999,
              background: "#ff7a45",
            }}
          />
          <div
            style={{
              fontSize: 24,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#a8a49c",
            }}
          >
            {brand.name}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              display: "flex",
              fontSize: 82,
              lineHeight: 1.04,
              color: "#f4f1ea",
              letterSpacing: -2,
              maxWidth: 900,
            }}
          >
            {brand.hero.line1} {brand.hero.line2} {brand.hero.line3}
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: "#8b8880",
              maxWidth: 820,
            }}
          >
            {brand.tagline}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 24,
            color: "#6b6862",
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "12px 28px",
              borderRadius: 9999,
              background: "#ff7a45",
              color: "#07070a",
              fontSize: 24,
            }}
          >
            Book a talk
          </div>
          <div style={{ display: "flex" }}>{brand.domain}</div>
        </div>
      </div>
    ),
    size,
  );
}
