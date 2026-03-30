import type { MetadataRoute } from "next";

import { getAppUrl } from "@/lib/db/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = getAppUrl();
  const now = new Date();

  return [
    {
      url: appUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1
    }
  ];
}
