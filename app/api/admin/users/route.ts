import { NextRequest, NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { scores, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "需要管理员权限" }, { status: 401 });

  const db = getDb();
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      scoreCount: sql<number>`count(${scores.id})`.mapWith(Number),
    })
    .from(users)
    .leftJoin(scores, eq(scores.userId, users.id))
    .groupBy(users.id)
    .orderBy(desc(users.createdAt))
    .limit(200);
  return NextResponse.json({ users: rows });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "需要管理员权限" }, { status: 401 });

  let body: { id?: number; role?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
  const id = Number(body.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "无效的用户 ID" }, { status: 400 });
  }
  if (body.role !== "user" && body.role !== "admin") {
    return NextResponse.json({ error: "角色必须是 user 或 admin" }, { status: 400 });
  }
  if (id === admin.id && body.role !== "admin") {
    return NextResponse.json({ error: "不能降级自己的管理员角色" }, { status: 400 });
  }

  const db = getDb();
  const updated = await db
    .update(users)
    .set({ role: body.role })
    .where(eq(users.id, id))
    .returning({ id: users.id, role: users.role });
  if (!updated.length) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }
  return NextResponse.json({ user: updated[0] });
}
