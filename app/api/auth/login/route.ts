import { NextRequest, NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { setSessionCookie, signSession, verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  let body: { account?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const account = (body.account ?? "").trim();
  const password = body.password ?? "";
  if (!account || !password) {
    return NextResponse.json({ error: "请输入账号和密码" }, { status: 400 });
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(users)
    .where(or(eq(users.email, account.toLowerCase()), eq(users.username, account)))
    .limit(1);

  const found = rows[0];
  if (!found || !verifyPassword(password, found.passwordHash)) {
    return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });
  }

  const user = {
    id: found.id,
    username: found.username,
    email: found.email,
    role: found.role as "user" | "admin",
  };
  const token = await signSession(user);
  await setSessionCookie(token);
  return NextResponse.json({ user });
}
