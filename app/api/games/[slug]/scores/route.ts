import { NextRequest, NextResponse } from "next/server";
import { and, eq, lt, ne, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { games, scores } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { getTopScores, MAX_SCORE } from "@/lib/games";
import { allow, clientKey, retryAfter } from "@/lib/rate-limit";

const SUBMIT_WINDOW_MS = 60_000;
const SUBMIT_LIMIT = 30;

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
  if (!Number.isFinite(score) || score < 0 || score > MAX_SCORE) {
    return NextResponse.json({ error: "无效的成绩" }, { status: 400 });
  }

  const { slug } = await ctx.params;
  const key = clientKey(req, "score", `${user.id}:${slug}`);
  if (!allow(key, SUBMIT_LIMIT, SUBMIT_WINDOW_MS)) {
    return NextResponse.json(
      { error: "提交太频繁，稍后再试" },
      { status: 429, headers: { "Retry-After": String(retryAfter(key, SUBMIT_WINDOW_MS)) } }
    );
  }

  const db = getDb();
  const found = await db
    .select({ id: games.id, hasScore: games.hasScore, maxScore: games.maxScore })
    .from(games)
    .where(eq(games.slug, slug))
    .limit(1);
  if (!found.length) {
    return NextResponse.json({ error: "游戏不存在" }, { status: 404 });
  }
  if (!found[0].hasScore) {
    return NextResponse.json({ error: "该游戏不支持排行榜" }, { status: 400 });
  }
  // 单局上限由管理员按游戏设置，超出的直接拒——排行榜不需要「理论上可能」的分数。
  if (found[0].maxScore !== null && score > found[0].maxScore) {
    return NextResponse.json(
      { error: `成绩超出该游戏的单局上限（${found[0].maxScore}）` },
      { status: 400 }
    );
  }
  const gameId = found[0].id;
  const owner = and(eq(scores.userId, user.id), eq(scores.gameId, gameId));

  const bestRows = await db
    .select({ best: sql<number>`coalesce(max(${scores.score}), 0)`.mapWith(Number) })
    .from(scores)
    .where(owner);
  const previousBest = bestRows[0]?.best ?? 0;
  if (score <= previousBest) {
    // 非新纪录：不写行、不重算全表排名，排行榜只需要玩家自己的最高分。
    return NextResponse.json({ ok: true, isNewBest: false, previousBest, rank: null });
  }

  // 每个 (用户, 游戏) 最终只保留一行最高分：历史重复行在新纪录时一并收敛，
  // 这样刷分不会无限增长行数，排行榜聚合也不再随提交次数变慢。
  const updated = await db
    .update(scores)
    .set({ score, createdAt: new Date() })
    .where(and(owner, lt(scores.score, score)))
    .returning({ id: scores.id });
  if (updated.length > 1) {
    await db.delete(scores).where(and(owner, ne(scores.id, updated[0].id)));
  } else if (!updated.length) {
    await db.insert(scores).values({ userId: user.id, gameId, score });
  }

  // 排名 = 严格高于新纪录的玩家数 + 1（按用户取最大值，与榜单展示口径一致）
  const rankRows = await db
    .select({ rank: sql<number>`count(*) + 1`.mapWith(Number) })
    .from(
      db
        .select({ best: sql<number>`max(${scores.score})`.as("best") })
        .from(scores)
        .where(eq(scores.gameId, gameId))
        .groupBy(scores.userId)
        .as("t")
    )
    .where(sql`t.best > ${score}`);

  return NextResponse.json({
    ok: true,
    isNewBest: true,
    previousBest,
    rank: rankRows[0]?.rank ?? 1,
  });
}
