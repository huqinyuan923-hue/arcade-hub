import Link from "next/link";
import type { Metadata } from "next";
import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { games, scores, users } from "@/db/schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "排行榜",
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
  // 每个游戏的最高分保持者（DISTINCT ON）
  const res = await db.execute(
    sql`select distinct on (s.game_id) s.game_id, s.score, u.username
        from scores s join users u on u.id = s.user_id
        order by s.game_id, s.score desc`
  );
  const rows = (Array.isArray(res) ? res : res.rows) as {
    game_id: number;
    score: number;
    username: string;
  }[];

  const allGames = await db
    .select({ id: games.id, slug: games.slug, title: games.title, plays: games.plays })
    .from(games)
    .where(eq(games.hasScore, true));

  const holderMap = new Map(rows.map((r) => [Number(r.game_id), r]));
  return allGames
    .map((g) => ({
      ...g,
      best: holderMap.get(g.id)?.score ?? null,
      holder: holderMap.get(g.id)?.username ?? null,
    }))
    .sort((a, b) => (b.best ?? -1) - (a.best ?? -1));
}

export default async function LeaderboardPage() {
  const [players, gameBoard] = await Promise.all([getPlayerBoard(), getGameBoard()]);

  return (
    <div className="flex flex-col gap-8 py-2">
      <div className="text-center py-8">
        <h1 className="font-arcade text-xl sm:text-2xl text-neon-yellow" style={{ textShadow: "0 0 12px rgba(250,204,21,0.6)" }}>
          HALL OF FAME
        </h1>
        <p className="text-slate-400 text-sm mt-3">名人堂 —— 用成绩说话</p>
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
                      i === 0 ? "text-neon-yellow text-base" : i < 3 ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    {i === 0 ? "👑" : i + 1}
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
          <h2 className="font-bold text-lg mb-4">
            🕹️ <span className="text-neon-pink neon-text-pink">游戏纪录榜</span>
            <span className="text-xs text-slate-500 ml-2 font-normal">每款游戏的最高分保持者</span>
          </h2>
          {gameBoard.some((g) => g.best !== null) ? (
            <ul className="flex flex-col gap-2 text-sm">
              {gameBoard.map((g) => (
                <li key={g.slug} className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5">
                  <Link href={`/game/${g.slug}`} className="flex-1 truncate hover:text-neon-cyan">
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
        </section>
      </div>
    </div>
  );
}
