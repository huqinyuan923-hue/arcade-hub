import { NextRequest, NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, setSessionCookie, signSession } from "@/lib/auth";
import { allow, clientKey, retryAfter } from "@/lib/rate-limit";

const WINDOW_MS = 10 * 60_000;
const LIMIT = 10;

export async function POST(req: NextRequest) {
  const key = clientKey(req, "register", "all");
  if (!allow(key, LIMIT, WINDOW_MS)) {
    return NextResponse.json(
      { error: "注册过于频繁，请稍后再试" },
      { status: 429, headers: { "Retry-After": String(retryAfter(key, WINDOW_MS)) } }
    );
  }
  let body: { email?: string; username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const username = (body.username ?? "").trim();
  const password = body.password ?? "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
  }
  if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]{2,20}$/.test(username)) {
    return NextResponse.json({ error: "用户名需为 2-20 位字母/数字/中文/下划线" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "密码至少 6 位" }, { status: 400 });
  }

  const db = getDb();
  const existing = await db
    .select({ id: users.id, email: users.email, username: users.username })
    .from(users)
    .where(or(eq(users.email, email), eq(users.username, username)))
    .limit(1);
  if (existing.length) {
    const dup = existing[0].email === email ? "邮箱已被注册" : "用户名已被占用";
    return NextResponse.json({ error: dup }, { status: 409 });
  }

  const inserted = await db
    .insert(users)
    .values({ email, username, passwordHash: await hashPassword(password) })
    .returning({ id: users.id, username: users.username, email: users.email, role: users.role });

  const user = {
    ...inserted[0],
    role: inserted[0].role as "user" | "admin",
  };
  const token = await signSession(user);
  await setSessionCookie(token);
  return NextResponse.json({ user });
}
