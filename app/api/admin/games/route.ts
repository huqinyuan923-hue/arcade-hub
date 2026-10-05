import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { games } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { listGames, slugify } from "@/lib/games";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "需要管理员权限" }, { status: 401 });
  const all = await listGames({ includeHidden: true, limit: 500, sort: "new" });
  return NextResponse.json({ games: all });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "需要管理员权限" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "请填写游戏标题" }, { status: 400 });

  const sourceType = body.sourceType === "iframe" ? "iframe" : "builtin";
  const embedUrl = sourceType === "iframe" ? String(body.embedUrl ?? "").trim() : null;
  if (sourceType === "iframe" && !/^https?:\/\//.test(embedUrl ?? "")) {
    return NextResponse.json({ error: "第三方游戏需要合法的嵌入地址（http/https）" }, { status: 400 });
  }

  const db = getDb();
  let slug = String(body.slug ?? "").trim() || slugify(title);
  const exists = await db.select({ id: games.id }).from(games).where(eq(games.slug, slug)).limit(1);
  if (exists.length) slug = `${slug}-${Date.now().toString(36)}`;

  const inserted = await db
    .insert(games)
    .values({
      slug,
      title,
      description: String(body.description ?? "").trim(),
      category: String(body.category ?? "休闲").trim() || "休闲",
      thumbnail: String(body.thumbnail ?? "").trim(),
      sourceType,
      embedUrl,
      playPath: sourceType === "builtin" ? `/games/${slug}/index.html` : null,
      hasScore: body.hasScore !== false,
      featured: body.featured === true,
      status: body.status === "hidden" ? "hidden" : "published",
      sortOrder: Number(body.sortOrder) || 0,
    })
    .returning();

  return NextResponse.json({ game: inserted[0] }, { status: 201 });
}
