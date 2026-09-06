import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { games, playEvents } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const db = getDb();
  const found = await db.select({ id: games.id }).from(games).where(eq(games.slug, slug)).limit(1);
  if (!found.length) {
    return NextResponse.json({ error: "游戏不存在" }, { status: 404 });
  }
  const gameId = found[0].id;
  const user = await getSessionUser();

  await db
    .update(games)
    .set({ plays: sql`${games.plays} + 1` })
    .where(eq(games.id, gameId));
  await db.insert(playEvents).values({ gameId, userId: user?.id ?? null });

  return NextResponse.json({ ok: true });
}
