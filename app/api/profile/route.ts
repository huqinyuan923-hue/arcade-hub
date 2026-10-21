import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { favorites, games, playEvents, ratings, scores } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { evaluateAchievements } from "@/lib/achievements";
import { getChallengeStatus, getDailyChallenge } from "@/lib/daily";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const db = getDb();

  // 收藏、成绩、最近游玩与六项统计、每日挑战互不依赖，一次并发发出；
  // 只有挑战状态依赖挑战本身，整体从十几波往返压到两波。
  const [
    myFavorites,
    myScores,
    recent,
    playCountRows,
    favCountRows,
    bestRows,
    varietyRows,
    ratingCountRows,
    challenge,
  ] = await Promise.all([
    db
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
      .orderBy(desc(favorites.createdAt)),
    db
      .select({
        slug: games.slug,
        title: games.title,
        best: sql<number>`max(${scores.score})`.mapWith(Number),
      })
      .from(scores)
      .innerJoin(games, eq(games.id, scores.gameId))
      .where(eq(scores.userId, user.id))
      .groupBy(games.slug, games.title)
      .orderBy(desc(sql`max(${scores.score})`)),
    db
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
      .limit(12),
    db
      .select({ n: sql<number>`count(*)`.mapWith(Number) })
      .from(playEvents)
      .where(eq(playEvents.userId, user.id)),
    db
      .select({ n: sql<number>`count(*)`.mapWith(Number) })
      .from(favorites)
      .where(eq(favorites.userId, user.id)),
    db
      .select({ best: sql<number>`coalesce(max(${scores.score}), 0)`.mapWith(Number) })
      .from(scores)
      .where(eq(scores.userId, user.id)),
    db
      .select({ n: sql<number>`count(distinct ${scores.gameId})`.mapWith(Number) })
      .from(scores)
      .where(eq(scores.userId, user.id)),
    db
      .select({ n: sql<number>`count(*)`.mapWith(Number) })
      .from(ratings)
      .where(eq(ratings.userId, user.id)),
    getDailyChallenge(),
  ]);
  const playCount = playCountRows[0];
  const favCount = favCountRows[0];
  const bestRow = bestRows[0];
  const variety = varietyRows[0];
  const ratingCount = ratingCountRows[0];
  // 成绩表按 (用户, 游戏) 收敛为一行，上榜游戏数直接用 distinct 计数，
  // 既不受历史重复行影响，也免去再扫一次成绩表。
  const scoreCount = variety?.n ?? 0;

  const challengeStatus = challenge ? await getChallengeStatus(user.id, challenge) : null;
  const achievements = evaluateAchievements({
    scoreCount,
    distinctGames: variety?.n ?? 0,
    bestScore: bestRow?.best ?? 0,
    playCount: playCount?.n ?? 0,
    favCount: favCount?.n ?? 0,
    ratingCount: ratingCount?.n ?? 0,
    totalCompletions: challengeStatus?.total ?? 0,
    streak: challengeStatus?.streak ?? 0,
  });

  return NextResponse.json({
    favorites: myFavorites,
    scores: myScores,
    recent,
    stats: {
      playCount: playCount?.n ?? 0,
      scoreCount,
      favCount: favCount?.n ?? 0,
      bestScore: bestRow?.best ?? 0,
    },
    challenge: challenge
      ? {
          day: challenge.day,
          dayLabel: challenge.dayLabel,
          slug: challenge.game.slug,
          title: challenge.game.title,
          thumbnail: challenge.game.thumbnail,
          target: challenge.target,
          completed: challengeStatus?.completed ?? false,
          bestScore: challengeStatus?.bestScore ?? 0,
          streak: challengeStatus?.streak ?? 0,
          total: challengeStatus?.total ?? 0,
        }
      : null,
    achievements,
  });
}
