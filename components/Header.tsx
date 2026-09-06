"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type Me = { id: number; username: string; role: "user" | "admin" } | null;

const NAV = [
  { href: "/", label: "首页" },
  { href: "/games", label: "全部游戏" },
  { href: "/leaderboard", label: "排行榜" },
];

export default function Header() {
  const [me, setMe] = useState<Me>(null);
  const [loaded, setLoaded] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (alive) {
          setMe(d.user ?? null);
          setLoaded(true);
        }
      })
      .catch(() => setLoaded(true));
    return () => {
      alive = false;
    };
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070510]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-arcade text-sm sm:text-base neon-text text-neon-cyan whitespace-nowrap">
            ARCADE<span className="text-neon-pink neon-text-pink">HUB</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            {NAV.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    active
                      ? "text-neon-cyan bg-cyan-400/10"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 text-sm">
          {!loaded ? (
            <div className="w-24 h-8 rounded-lg bg-white/5 animate-pulse" />
          ) : me ? (
            <>
              {me.role === "admin" && (
                <Link
                  href="/admin"
                  className="hidden sm:inline-block px-3 py-1.5 rounded-lg btn-neon-pink"
                >
                  管理后台
                </Link>
              )}
              <Link
                href="/profile"
                className="px-3 py-1.5 rounded-lg chip max-w-[10rem] truncate"
                title={me.username}
              >
                🎮 {me.username}
              </Link>
              <button
                onClick={logout}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                退出
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                登录
              </Link>
              <Link href="/register" className="px-3 py-1.5 rounded-lg btn-neon">
                注册
              </Link>
            </>
          )}
        </div>
      </div>
      <nav className="sm:hidden flex gap-1 px-4 pb-2">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-1 rounded-lg text-xs ${
              pathname === item.href ? "text-neon-cyan bg-cyan-400/10" : "text-slate-300"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
