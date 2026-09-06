import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { games, playEvents, scores, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "需要管理员权限" }, { status: 401 });

  const db = getDb();

  const [gameCount] = await db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(games);
  const [userCount] = await db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(users);
  const [playSum] = await db
    .select({ n: sql<number>`coalesce(sum(${games.plays}), 0)`.mapWith(Number) })
    .from(games);
  const [scoreCount] = await db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(scores);
  const [favoriteCount] = await db
    .select({ n: sql<number>`count(*)`.mapWith(Number) })
    .from(playEvents)
    .where(sql`${playEvents.userId} is not null`);

  const topGames = await db
    .select({ title: games.title, slug: games.slug, plays: games.plays, category: games.category })
    .from(games)
    .orderBy(desc(games.plays))
    .limit(10);

  const latestUsers = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(10);

  const categoryDist = await db
    .select({ category: games.category, n: sql<number>`count(*)`.mapWith(Number) })
    .from(games)
    .where(eq(games.status, "published"))
    .groupBy(games.category);

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
