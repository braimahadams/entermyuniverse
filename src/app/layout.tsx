import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import { brand } from "@/lib/brand";
import { config } from "@/lib/config";
import "./globals.css";

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  title: {
    default: brand.metaTitle,
    template: `%s — ${brand.name}`,
  },
  description: brand.metaDescription,
  // This is the card that renders when someone taps your Instagram bio.
  // It is the single most-seen asset in the whole product.
  openGraph: {
    title: brand.metaTitle,
    description: brand.metaDescription,
    url: config.siteUrl,
    siteName: brand.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: brand.metaTitle,
    description: brand.metaDescription,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#07070a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="grain antialiased">
        {/* Keyboard and screen-reader users shouldn't have to tab through
            the whole video wall to reach the booking flow. */}
        <a
          href="#book"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ember focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-ink"
        >
          Skip to booking
        </a>
        {children}
      </body>
    </html>
  );
}
