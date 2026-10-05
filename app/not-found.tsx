import Link from "next/link";
import { listGames } from "@/lib/games";

export default async function NotFound() {
  // 推荐几款最热的游戏，帮玩家快速回到正轨
  const hot = await listGames({ sort: "hot", limit: 4 }).catch(() => []);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
      <p className="font-arcade text-6xl text-neon-pink neon-text-pink">404</p>
      <h1 className="text-xl font-bold text-slate-200">这一格机台是空的…</h1>
      <p className="text-sm text-slate-400">你要找的页面不存在，可能被拔掉电源了。</p>
      <div className="flex gap-3">
        <Link href="/" className="px-5 py-2.5 rounded-xl btn-neon text-sm">
          🏠 回游戏厅
        </Link>
        <Link href="/games" className="px-5 py-2.5 rounded-xl btn-neon-pink text-sm">
          🕹️ 逛逛全部游戏
        </Link>
      </div>
      {hot.length > 0 && (
        <div className="mt-6">
          <p className="text-xs text-slate-500 mb-3">🔥 不如先来一局最热的：</p>
          <div className="flex flex-wrap justify-center gap-2">
            {hot.map((g) => (
              <Link
                key={g.id}
                href={`/game/${g.slug}`}
                className="chip px-4 py-2 rounded-xl text-sm hover:border-neon-cyan transition-colors"
              >
                {g.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
