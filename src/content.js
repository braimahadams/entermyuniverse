/**
 * EnterMyUniverse — single content source.
 *
 * Rules enforced by main.js:
 * - Social rows render only when `url` is set
 * - Audience counts render only when `followers` is a positive number
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
  metaTitle: "Adams Braimah — Enter My Universe",
  metaDescription:
    "Creator portfolio and links for Adams Braimah. Find Instagram, TikTok, YouTube, and Facebook in one place — plus ScoutViral.",

  /** Set to "/portrait.webp" after adding public/portrait.webp */
  portrait: "",

  socials: [
    {
      id: "instagram",
      label: "Instagram",
      url: "",
      followers: null,
    },
    {
      id: "tiktok",
      label: "TikTok",
      url: "",
      followers: null,
    },
    {
      id: "youtube",
      label: "YouTube",
      url: "",
      followers: null,
    },
    {
      id: "facebook",
      label: "Facebook",
      url: "",
      followers: null,
    },
  ],

  /**
   * Up to three items. Each needs cover + url to appear.
   * Optional: views (number) or campaign (string) when verified.
   */
  featuredVideos: [
    // {
    //   title: "Campaign name",
    //   cover: "/covers/one.webp",
    //   url: "https://www.instagram.com/reel/…",
    //   views: null,
    //   campaign: "",
    // },
  ],

  /** Cal.com booking page — leave empty until live */
  bookCallUrl: "",
  bookCallLabel: "Book a creator strategy call",

  brandEmail: "adams@entermyuniverse.com",
  brandEmailLabel: "Brand inquiries",

  scoutviral: {
    role: "Founder & CEO",
    title: "ScoutViral",
    body: "I built ScoutViral to help creators find proven viral Shorts by country and niche, rank a channel’s top videos, and save ideas to recreate in their own style.",
    url: "https://scoutviral.com",
    cta: "Explore ScoutViral",
  },
};
