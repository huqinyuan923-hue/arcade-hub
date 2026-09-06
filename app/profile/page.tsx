"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ProfileData = {
  favorites: { slug: string; title: string; thumbnail: string; category: string }[];
  scores: { slug: string; title: string; best: number; plays: number }[];
  recent: { slug: string; title: string; thumbnail: string; playedAt: string }[];
};

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [state, setState] = useState<"loading" | "guest" | "ready">("loading");

  useEffect(() => {
    fetch("/api/profile").then(async (res) => {
      if (res.status === 401) {
        setState("guest");
        return;
      }
      const d = await res.json();
      setData(d);
      setState("ready");
    });
  }, []);

  if (state === "loading") {
    return <div className="py-24 text-center text-slate-400">加载中…</div>;
  }

  if (state === "guest") {
    return (
      <div className="card max-w-md mx-auto mt-16 p-10 text-center flex flex-col gap-4">
        <p className="text-4xl">🔒</p>
        <h1 className="text-lg font-bold">请先登录</h1>
        <p className="text-sm text-slate-400">登录后可查看收藏、成绩与最近游玩</p>
        <Link href="/login?next=/profile" className="btn-neon py-2.5 rounded-xl font-semibold">
          去登录
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-2">
      <h1 className="text-2xl font-bold">
        🎮 <span className="text-neon-cyan neon-text">我的游戏中心</span>
      </h1>

      <section>
        <h2 className="text-lg font-bold mb-3">❤️ 我的收藏（{data?.favorites.length ?? 0}）</h2>
        {data?.favorites.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {data.favorites.map((g) => (
              <Link key={g.slug} href={`/game/${g.slug}`} className="card card-hover overflow-hidden">
                <div className="aspect-[4/3] bg-[#120f28] relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.thumbnail || "/thumbs/default.svg"} alt={g.title} className="absolute inset-0 w-full h-full object-cover" />
                </div>
                <p className="p-2 text-xs truncate">{g.title}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">还没有收藏，去游戏大厅逛逛吧。</p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3">🏆 我的最高分</h2>
        {data?.scores.length ? (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-slate-400">
                <tr>
                  <th className="text-left px-4 py-2.5">游戏</th>
                  <th className="text-right px-4 py-2.5">最高分</th>
                  <th className="text-right px-4 py-2.5">提交次数</th>
                </tr>
              </thead>
              <tbody>
                {data.scores.map((s) => (
                  <tr key={s.slug} className="border-t border-white/5">
                    <td className="px-4 py-2.5">
                      <Link href={`/game/${s.slug}`} className="hover:text-neon-cyan">
                        {s.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-neon-yellow font-semibold">
                      {s.best}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-400">{s.plays}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">还没有成绩记录，开一局试试！</p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3">🕘 最近游玩</h2>
        {data?.recent.length ? (
          <div className="flex flex-wrap gap-2">
            {data.recent.map((g, i) => (
              <Link
                key={`${g.slug}-${i}`}
                href={`/game/${g.slug}`}
                className="chip px-3 py-1.5 rounded-xl text-sm hover:border-neon-cyan"
              >
                {g.title}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">暂无记录。</p>
        )}
      </section>
    </div>
  );
}
