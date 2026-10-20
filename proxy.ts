import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getSessionSecret, SESSION_COOKIE } from "@/lib/session-secret";

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  let isAdmin = false;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, getSessionSecret());
      isAdmin = payload.role === "admin";
    } catch {
      isAdmin = false;
    }
  }

  if (!isAdmin) {
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "需要管理员权限" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
