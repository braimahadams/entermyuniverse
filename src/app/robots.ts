import type { MetadataRoute } from "next";
import { config } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Nothing behind a login has any business in an index, and these
      // would only ever serve a redirect to a crawler anyway.
      disallow: ["/studio", "/studio/", "/admin", "/api/", "/booked/", "/booking/"],
    },
    sitemap: `${config.siteUrl}/sitemap.xml`,
  };
}
