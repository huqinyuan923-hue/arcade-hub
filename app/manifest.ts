import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Arcade Hub · 霓虹街机游戏厅",
    short_name: "Arcade Hub",
    description: "经典小游戏即点即玩，支持收藏、评分与全站排行榜。",
    start_url: "/",
    display: "standalone",
    background_color: "#0d0b1e",
    theme_color: "#22d3ee",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
    shortcuts: [
      { name: "游戏大厅", url: "/games" },
      { name: "排行榜", url: "/leaderboard" },
    ],
  };
}
