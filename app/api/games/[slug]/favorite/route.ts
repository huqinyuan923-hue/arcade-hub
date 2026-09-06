import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { favorites, games } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录后再收藏" }, { status: 401 });
  }
  const { slug } = await ctx.params;
  const db = getDb();
  const found = await db.select({ id: games.id }).from(games).where(eq(games.slug, slug)).limit(1);
  if (!found.length) {
    return NextResponse.json({ error: "游戏不存在" }, { status: 404 });
  }
  const gameId = found[0].id;

  const existing = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(and(eq(favorites.userId, user.id), eq(favorites.gameId, gameId)))
    .limit(1);

  if (existing.length) {
    await db.delete(favorites).where(eq(favorites.id, existing[0].id));
    return NextResponse.json({ favorited: false });
  }
  await db.insert(favorites).values({ userId: user.id, gameId });
  return NextResponse.json({ favorited: true });
}
