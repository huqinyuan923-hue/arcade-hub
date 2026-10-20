import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { games, playEvents } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

// 同一浏览器对同一游戏 15 分钟内只计一次游玩：刷新页面、脚本刷 POST 都不再
// 放大 games.plays 与 play_events 行数。
const PLAY_COOKIE = "arcade_played";
const PLAY_WINDOW_S = 900;
const MAX_TRACKED = 40;

export async function POST(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const db = getDb();
  const found = await db.select({ id: games.id }).from(games).where(eq(games.slug, slug)).limit(1);
  if (!found.length) {
    return NextResponse.json({ error: "游戏不存在" }, { status: 404 });
  }
  const gameId = found[0].id;

  const store = await cookies();
  const played = new Set(
    (store.get(PLAY_COOKIE)?.value ?? "")
      .split(",")
      .map((v) => Number(v))
      .filter((v) => Number.isInteger(v) && v > 0)
  );
  if (played.has(gameId)) {
    return NextResponse.json({ ok: true, counted: false });
  }

  played.add(gameId);
  store.set(PLAY_COOKIE, [...played].slice(-MAX_TRACKED).join(","), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PLAY_WINDOW_S,
  });

  const user = await getSessionUser();
  await Promise.all([
    db.update(games).set({ plays: sql`${games.plays} + 1` }).where(eq(games.id, gameId)),
    db.insert(playEvents).values({ gameId, userId: user?.id ?? null }),
  ]);

  return NextResponse.json({ ok: true, counted: true });
}
