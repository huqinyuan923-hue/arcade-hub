import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { favorites, games, playEvents, scores } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const db = getDb();

  const myFavorites = await db
    .select({
      slug: games.slug,
      title: games.title,
      thumbnail: games.thumbnail,
      category: games.category,
      favoritedAt: favorites.createdAt,
    })
    .from(favorites)
    .innerJoin(games, eq(games.id, favorites.gameId))
    .where(eq(favorites.userId, user.id))
    .orderBy(desc(favorites.createdAt));

  const myScores = await db
    .select({
      slug: games.slug,
      title: games.title,
      best: sql<number>`max(${scores.score})`.mapWith(Number),
      plays: sql<number>`count(*)`.mapWith(Number),
    })
    .from(scores)
    .innerJoin(games, eq(games.id, scores.gameId))
    .where(eq(scores.userId, user.id))
    .groupBy(games.slug, games.title)
    .orderBy(desc(sql`max(${scores.score})`));

  const recent = await db
    .select({
      slug: games.slug,
      title: games.title,
      thumbnail: games.thumbnail,
      playedAt: playEvents.createdAt,
    })
    .from(playEvents)
    .innerJoin(games, eq(games.id, playEvents.gameId))
    .where(eq(playEvents.userId, user.id))
    .orderBy(desc(playEvents.createdAt))
    .limit(12);

  return NextResponse.json({ favorites: myFavorites, scores: myScores, recent });
}
