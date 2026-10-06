import Link from "next/link";
import type { Metadata } from "next";
import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { games, scores, users } from "@/db/schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "排行榜",
  description: "Arcade Hub 全站游戏成绩排行榜：玩家总榜、各游戏最高分纪录与每款游戏 Top 10 成绩。",
};

async function getPlayerBoard() {
  const db = getDb();
  const bests = db
    .select({
      userId: scores.userId,
      gameId: scores.gameId,
      best: sql<number>`max(${scores.score})`.as("best"),
    })
    .from(scores)
    .groupBy(scores.userId, scores.gameId)
    .as("t");

  return db
    .select({
      username: users.username,
      total: sql<number>`sum(${bests.best})`.mapWith(Number),
      gameCount: sql<number>`count(*)`.mapWith(Number),
    })
    .from(bests)
    .innerJoin(users, eq(users.id, bests.userId))
    .groupBy(users.username)
    .orderBy(desc(sql`sum(${bests.best})`))
    .limit(20);
}

async function getGameBoard() {
  const db = getDb();
  // 每个游戏的最高分保持者（DISTINCT ON 推到 SQL）
  const holders = await db
    .selectDistinctOn([scores.gameId], { gameId: scores.gameId, score: scores.score, holder: users.username })
    .from(scores)
    .innerJoin(users, eq(users.id, scores.userId))
    .orderBy(scores.gameId, desc(scores.score));

  const allGames = await db
    .select({ id: games.id, slug: games.slug, title: games.title, plays: games.plays })
    .from(games)
    .where(eq(games.hasScore, true));

  const holderMap = new Map(holders.map((r) => [r.gameId, r]));
  return allGames
    .map((g) => ({
      ...g,
      best: holderMap.get(g.id)?.score ?? null,
      holder: holderMap.get(g.id)?.holder ?? null,
    }))
    .sort((a, b) => (b.best ?? -1) - (a.best ?? -1));
}

// 指定游戏的 Top10 成绩
async function getGameTopScores(gameId: number) {
  const db = getDb();
  return db
    .select({ username: users.username, score: scores.score })
    .from(scores)
    .innerJoin(users, eq(users.id, scores.userId))
    .where(eq(scores.gameId, gameId))
    .orderBy(desc(scores.score))
    .limit(10);
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>;
}) {
  const { game: gameSlug } = await searchParams;
  const [players, gameBoard] = await Promise.all([getPlayerBoard(), getGameBoard()]);
  const selected = gameSlug ? gameBoard.find((g) => g.slug === gameSlug) : undefined;
  const topScores = selected ? await getGameTopScores(selected.id) : [];

  return (
    <div className="flex flex-col gap-8 py-2">
      <div className="text-center py-8">
        <h1 className="font-arcade text-xl sm:text-2xl text-neon-yellow" style={{ textShadow: "0 0 12px rgba(250,204,21,0.6)" }}>
          HALL OF FAME
        </h1>
        <p className="text-slate-400 text-sm mt-3">名人堂 —— 用成绩说话 <span className="text-xs text-slate-600">· 成绩实时更新</span></p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <section className="card p-5">
          <h2 className="font-bold text-lg mb-4">
            👑 <span className="text-neon-cyan neon-text">玩家总榜</span>
            <span className="text-xs text-slate-500 ml-2 font-normal">各游戏最高分之和</span>
          </h2>
          {players.length ? (
            <ol className="flex flex-col gap-2 text-sm">
              {players.map((p, i) => (
                <li key={p.username} className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5">
                  <span
                    className={`w-7 text-center font-bold ${
                      i === 0 ? "text-neon-yellow text-base" : i === 1 ? "text-slate-200" : i === 2 ? "text-amber-600" : "text-slate-500"
                    }`}
                  >
                    {["👑", "🥈", "🥉"][i] ?? i + 1}
                  </span>
                  <span className="flex-1 truncate">{p.username}</span>
                  <span className="text-xs text-slate-500">{p.gameCount} 款游戏</span>
                  <span className="font-mono font-semibold text-neon-cyan w-20 text-right">{p.total}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-slate-400 py-6 text-center">还没有任何成绩，快来抢占榜首！</p>
          )}
        </section>

        <section className="card p-5">
          <h2 className="font-bold text-lg mb-3">
            🕹️ <span className="text-neon-pink neon-text-pink">游戏纪录榜</span>
            <span className="text-xs text-slate-500 ml-2 font-normal">点击游戏名查看 Top10</span>
          </h2>
          {gameBoard.some((g) => g.best !== null) ? (
            <ul className="flex flex-col gap-2 text-sm">
              {gameBoard.map((g) => (
                <li key={g.slug} className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5">
                  <Link
                    href={`/leaderboard?game=${g.slug}`}
                    className={`flex-1 truncate hover:text-neon-cyan ${
                      selected?.slug === g.slug ? "text-neon-cyan" : ""
                    }`}
                  >
                    {g.title}
                  </Link>
                  {g.holder ? (
                    <>
                      <span className="text-xs text-slate-400 truncate max-w-24">{g.holder}</span>
                      <span className="font-mono font-semibold text-neon-yellow w-20 text-right">
                        {g.best}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-slate-500">虚位以待</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400 py-6 text-center">暂无纪录。</p>
          )}

          {selected && (
            <div className="mt-5 border-t border-white/10 pt-4">
              <h3 className="font-bold text-sm mb-3 text-neon-yellow">
                🏅 {selected.title} · Top 10
                <Link href="/leaderboard" className="float-right text-xs text-slate-500 hover:text-slate-300">
                  关闭 ✕
                </Link>
              </h3>
              {topScores.length ? (
                <ol className="flex flex-col gap-1.5 text-sm">
                  {topScores.map((s, i) => (
                    <li key={i} className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2">
                      <span className={`w-6 text-center font-bold ${i < 3 ? "text-neon-yellow" : "text-slate-500"}`}>
                        {["🥇", "🥈", "🥉"][i] ?? i + 1}
                      </span>
                      <span className="flex-1 truncate">{s.username}</span>
                      <span className="font-mono font-semibold text-neon-cyan">{s.score}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-slate-400 py-4 text-center">这款游戏还没有成绩，去做第一个！</p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
