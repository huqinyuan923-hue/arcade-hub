import Link from "next/link";
import { sum } from "drizzle-orm";
import GameCard, { formatPlays } from "@/components/GameCard";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import { getDb } from "@/db";
import { games } from "@/db/schema";
import { getCategories, getFeaturedGames, listGames } from "@/lib/games";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const db = getDb();
  const [featured, newest, hottest, categories, totals] = await Promise.all([
    getFeaturedGames(5),
    listGames({ sort: "new", limit: 8 }),
    listGames({ sort: "hot", limit: 8 }),
    getCategories(),
    // 站点累计游玩数：全表 SUM，而不是只算最热 8 款
    db
      .select({ total: sum(games.plays).mapWith(Number) })
      .from(games),
  ]);
  const totalPlays = totals[0]?.total ?? 0;

  return (
    <div className="flex flex-col gap-10">
      <section className="relative overflow-hidden rounded-3xl">
        <div className="grid-floor absolute inset-0" />
        <div className="relative flex flex-col items-center text-center gap-4 py-12 sm:py-16 px-4">
          <h1 className="font-arcade text-2xl sm:text-4xl text-neon-cyan neon-text leading-relaxed">
            ARCADE<span className="text-neon-pink neon-text-pink"> HUB</span>
          </h1>
          <p className="text-slate-300 max-w-xl text-sm sm:text-base">
            霓虹街机游戏厅 —— 2048、贪吃蛇、俄罗斯方块、打砖块……
            经典小游戏即点即玩，登录后可收藏、评分、冲击排行榜。
          </p>
          <div className="flex gap-3 mt-2">
            <Link href="/games" className="btn-neon px-6 py-2.5 rounded-xl font-semibold">
              🕹️ 全部游戏
            </Link>
            <Link href="/leaderboard" className="btn-neon-pink px-6 py-2.5 rounded-xl font-semibold">
              🏆 排行榜
            </Link>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section>
          <FeaturedCarousel games={featured} />
        </section>
      )}

      {categories.length > 1 && (
        <section>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.category}
                href={`/games?category=${encodeURIComponent(c.category)}`}
                className="chip px-4 py-2 rounded-xl text-sm hover:border-neon-cyan transition-colors"
              >
                {c.category}
                <span className="text-slate-500 ml-1.5 text-xs">{c.count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-xl font-bold">
            🔥 <span className="text-neon-pink neon-text-pink">最热游戏</span>
          </h2>
          <Link href="/games?sort=hot" className="text-sm text-slate-400 hover:text-neon-cyan">
            查看全部 →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {hottest.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-xl font-bold">
            ✨ <span className="text-neon-cyan neon-text">最新上架</span>
          </h2>
          <Link href="/games?sort=new" className="text-sm text-slate-400 hover:text-neon-cyan">
            查看全部 →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {newest.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      </section>

      <section className="card p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-neon-cyan neon-text">
            站内 {categories.length} 个分类 · {totalPlays > 0 ? `已累计被游玩 ${formatPlays(totalPlays)} 次` : "等你来开第一局"}
          </h3>
          <p className="text-sm text-slate-400 mt-1">注册账号，把你的名字留在排行榜上。</p>
        </div>
        <Link
          href="/register"
          className="btn-neon-pink px-6 py-2.5 rounded-xl font-semibold whitespace-nowrap"
        >
          免费注册
        </Link>
      </section>
    </div>
  );
}
