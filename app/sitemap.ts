import type { MetadataRoute } from "next";
import { listGames } from "@/lib/games";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://arcade-hub-nu.vercel.app";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const games = await listGames({ limit: 200 }).catch(() => []);
  const staticPages = ["", "/games", "/leaderboard", "/login", "/register"].map((p) => ({
    url: `${BASE}${p}`,
    changeFrequency: "daily" as const,
    priority: p === "" ? 1 : 0.7,
  }));
  return [
    ...staticPages,
    ...games.map((g) => ({
      url: `${BASE}/game/${g.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
