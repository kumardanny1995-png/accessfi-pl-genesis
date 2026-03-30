import type { MetadataRoute } from "next";

import { getAppUrl } from "@/lib/db/env";

export default function robots(): MetadataRoute.Robots {
  const appUrl = getAppUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/login", "/signup", "/onboarding", "/dashboard", "/decisions", "/history", "/profile"]
      }
    ],
    sitemap: `${appUrl}/sitemap.xml`,
    host: appUrl
  };
}
