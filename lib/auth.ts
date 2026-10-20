import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { hashPassword, verifyPassword } from "./password";
import { getSessionSecret, SESSION_COOKIE } from "./session-secret";

export { hashPassword, verifyPassword };
export { SESSION_COOKIE };
const SESSION_DAYS = 7;

export type SessionUser = {
  id: number;
  username: string;
  email: string;
  role: "user" | "admin";
};

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({
    username: user.username,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSessionSecret());
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    if (!payload.sub) return null;
    return {
      id: Number(payload.sub),
      username: String(payload.username ?? ""),
      email: String(payload.email ?? ""),
      role: payload.role === "admin" ? "admin" : "user",
    };
  } catch {
    return null;
  }
}

/** 供 API 路由使用：未登录返回 null */
export async function requireUser(): Promise<SessionUser | null> {
  return getSessionUser();
}

export async function requireAdmin(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  return user?.role === "admin" ? user : null;
}
