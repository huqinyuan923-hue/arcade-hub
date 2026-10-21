import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { favorites, games, scores, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "需要管理员权限" }, { status: 401 });

  const db = getDb();

  // 八个统计互不依赖，一次并发发出，避免串行等待 Neon 往返。
  const [
    gameCountRows,
    userCountRows,
    playSumRows,
    scoreCountRows,
    favoriteCountRows,
    topGames,
    latestUsers,
    categoryDist,
  ] = await Promise.all([
    db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(games),
    db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(users),
    db.select({ n: sql<number>`coalesce(sum(${games.plays}), 0)`.mapWith(Number) }).from(games),
    db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(scores),
    db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(favorites),
    db
      .select({ title: games.title, slug: games.slug, plays: games.plays, category: games.category })
      .from(games)
      .orderBy(desc(games.plays))
      .limit(10),
    db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(10),
    db
      .select({ category: games.category, n: sql<number>`count(*)`.mapWith(Number) })
      .from(games)
      .where(eq(games.status, "published"))
      .groupBy(games.category),
  ]);
  const gameCount = gameCountRows[0];
  const userCount = userCountRows[0];
  const playSum = playSumRows[0];
  const scoreCount = scoreCountRows[0];
  const favoriteCount = favoriteCountRows[0];

  return NextResponse.json({
    totals: {
      games: gameCount?.n ?? 0,
      users: userCount?.n ?? 0,
      plays: playSum?.n ?? 0,
      scores: scoreCount?.n ?? 0,
      favorites: favoriteCount?.n ?? 0,
    },
    topGames,
    latestUsers,
    categoryDist,
  });
}
