/**
 * EnterMyUniverse — single content source.
 *
 * Rules enforced by main.js:
 * - Social rows render only when `url` is set
 * - Audience counts render only when `followers` is a positive number
 * - Total audience chip renders when `totalFollowersLabel` or `totalFollowers` is set
 * - Featured videos render only when both `cover` and `url` are set
 * - Book CTA renders only when `bookCallUrl` is set
 * - Brand email and ScoutViral card always render
 *
 * Never put a personal Gmail address in this file.
 */

export const content = {
  name: "Adams Braimah",
  tagline: "",
  siteUrl: "https://entermyuniverse.com",
  metaTitle: "Adams Braimah",
  metaDescription:
    "Creator portfolio and links for Adams Braimah. Find Instagram, TikTok, YouTube, Facebook, and Snapchat in one place — plus ScoutViral.",

  portrait: "/portrait.webp",

  /** Approved cross-platform audience chip */
  totalFollowers: 500_000,
  totalFollowersLabel: "500K+",

  socials: [
    {
      id: "instagram",
      label: "Instagram",
      url: "https://www.instagram.com/braimahadams",
      followers: 70_000,
      audienceLabel: "70K+ followers",
    },
    {
      id: "tiktok",
      label: "TikTok",
      url: "https://www.tiktok.com/@braimahadams",
      followers: 295_000,
      audienceLabel: "295K+ followers",
    },
    {
      id: "youtube",
      label: "YouTube",
      url: "https://www.youtube.com/@braimahadams.",
      followers: 24_000,
      audienceLabel: "24K+ subscribers",
    },
    {
      id: "facebook",
      label: "Facebook",
      url: "https://www.facebook.com/braimahadams001",
      followers: 170_000,
      audienceLabel: "170K+ followers",
    },
    {
      id: "snapchat",
      label: "Snapchat",
      url: "https://www.snapchat.com/t/RvRPW9dq",
      followers: 10_000,
      audienceLabel: "10K+ followers",
    },
  ],

  featuredVideos: [],

  /**
   * Experience / brand partnerships.
   * Rendered when company + role are set.
   */
  experience: [
    {
      company: "Bitget",
      role: "Brand Partner",
      dates: "Aug 2026 – Present",
      logo: "/logos/bitget.png",
      url: "https://www.bitget.com",
      body: "Creator partnership producing trading humor and short-form content for Bitget — a top global crypto exchange — to grow brand awareness with retail traders.",
    },
  ],

  bookCallUrl: "",
  bookCallLabel: "Book a creator strategy call",

  brandEmail: "adams@entermyuniverse.com",
  brandEmailLabel: "Brand inquiries",

  scoutviral: {
    role: "Founder & CEO",
    title: "ScoutViral",
    logo: "/scoutviral-logo.png",
    body: "ScoutViral helps you scout proven viral Shorts from any creator, country, or language — then save what fits and recreate it for your own audience. Grow your channel and earn from it.",
    url: "https://scoutviral.com",
    cta: "Explore ScoutViral",
  },
};
