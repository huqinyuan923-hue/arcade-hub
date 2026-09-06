import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { games } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

type Patch = Partial<{
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  embedUrl: string | null;
  hasScore: boolean;
  featured: boolean;
  status: "published" | "hidden";
  sortOrder: number;
}>;

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "需要管理员权限" }, { status: 401 });

  const { id } = await ctx.params;
  const gameId = Number(id);
  if (!Number.isInteger(gameId)) {
    return NextResponse.json({ error: "无效的 ID" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const patch: Patch = {};
  if (typeof body.title === "string" && body.title.trim()) patch.title = body.title.trim();
  if (typeof body.description === "string") patch.description = body.description;
  if (typeof body.category === "string" && body.category.trim()) patch.category = body.category.trim();
  if (typeof body.thumbnail === "string") patch.thumbnail = body.thumbnail;
  if (typeof body.embedUrl === "string") patch.embedUrl = body.embedUrl.trim() || null;
  if (typeof body.hasScore === "boolean") patch.hasScore = body.hasScore;
  if (typeof body.featured === "boolean") patch.featured = body.featured;
  if (body.status === "published" || body.status === "hidden") patch.status = body.status;
  if (Number.isFinite(Number(body.sortOrder))) patch.sortOrder = Number(body.sortOrder);

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "没有需要更新的字段" }, { status: 400 });
  }

  const db = getDb();
  const updated = await db.update(games).set(patch).where(eq(games.id, gameId)).returning();
  if (!updated.length) {
    return NextResponse.json({ error: "游戏不存在" }, { status: 404 });
  }
  return NextResponse.json({ game: updated[0] });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "需要管理员权限" }, { status: 401 });

  const { id } = await ctx.params;
  const gameId = Number(id);
  if (!Number.isInteger(gameId)) {
    return NextResponse.json({ error: "无效的 ID" }, { status: 400 });
  }
  const db = getDb();
  const deleted = await db.delete(games).where(eq(games.id, gameId)).returning({ id: games.id });
  if (!deleted.length) {
    return NextResponse.json({ error: "游戏不存在" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
