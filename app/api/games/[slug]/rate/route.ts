import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { games, ratings } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录后再评分" }, { status: 401 });
  }
  let body: { value?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
  const value = Math.round(Number(body.value));
  if (!Number.isFinite(value) || value < 1 || value > 5) {
    return NextResponse.json({ error: "评分需为 1-5 的整数" }, { status: 400 });
  }

  const { slug } = await ctx.params;
  const db = getDb();
  const found = await db.select({ id: games.id }).from(games).where(eq(games.slug, slug)).limit(1);
  if (!found.length) {
    return NextResponse.json({ error: "游戏不存在" }, { status: 404 });
  }
  const gameId = found[0].id;

  await db
    .insert(ratings)
    .values({ userId: user.id, gameId, value })
    .onConflictDoUpdate({
      target: [ratings.userId, ratings.gameId],
      set: { value },
    });

  const agg = await db
    .select({
      avgRating: sql<number>`coalesce(round(avg(${ratings.value})::numeric, 1), 0)`.mapWith(Number),
      ratingCount: sql<number>`count(*)`.mapWith(Number),
    })
    .from(ratings)
    .where(eq(ratings.gameId, gameId));

  return NextResponse.json({ value, ...agg[0] });
}
