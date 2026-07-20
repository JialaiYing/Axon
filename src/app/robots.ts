import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The app shell is per-user/local-first data — nothing there is
        // meant to be indexed, only the public marketing/legal pages.
        disallow: [
          "/dashboard",
          "/kanban",
          "/calendar",
          "/flashcards",
          "/pomodoro",
          "/analytics",
          "/goals",
          "/rank",
          "/settings",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
