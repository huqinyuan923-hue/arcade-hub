import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { games, scores } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { getTopScores } from "@/lib/games";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const db = getDb();
  const found = await db.select({ id: games.id }).from(games).where(eq(games.slug, slug)).limit(1);
  if (!found.length) {
    return NextResponse.json({ error: "游戏不存在" }, { status: 404 });
  }
  const top = await getTopScores(found[0].id, 10);
  return NextResponse.json({ scores: top });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录后再提交成绩" }, { status: 401 });
  }
  let body: { score?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
  const score = Math.round(Number(body.score));
  if (!Number.isFinite(score) || score < 0 || score > 10_000_000) {
    return NextResponse.json({ error: "无效的成绩" }, { status: 400 });
  }

  const { slug } = await ctx.params;
  const db = getDb();
  const found = await db
    .select({ id: games.id, hasScore: games.hasScore })
    .from(games)
    .where(eq(games.slug, slug))
    .limit(1);
  if (!found.length) {
    return NextResponse.json({ error: "游戏不存在" }, { status: 404 });
  }
  if (!found[0].hasScore) {
    return NextResponse.json({ error: "该游戏不支持排行榜" }, { status: 400 });
  }
  const gameId = found[0].id;

  const bestRows = await db
    .select({ best: sql<number>`coalesce(max(${scores.score}), 0)`.mapWith(Number) })
    .from(scores)
    .where(and(eq(scores.userId, user.id), eq(scores.gameId, gameId)));
  const previousBest = bestRows[0]?.best ?? 0;

  await db.insert(scores).values({ userId: user.id, gameId, score });

  const rankRows = await db
    .select({
      rank: sql<number>`count(*) + 1`.mapWith(Number),
    })
    .from(
      db
        .select({
          username: scores.userId,
          best: sql<number>`max(${scores.score})`.as("best"),
        })
        .from(scores)
        .where(eq(scores.gameId, gameId))
        .groupBy(scores.userId)
        .as("t")
    )
    .where(sql`t.best > ${score}`);

  return NextResponse.json({
    ok: true,
    isNewBest: score > previousBest,
    previousBest,
    rank: rankRows[0]?.rank ?? 1,
  });
}
