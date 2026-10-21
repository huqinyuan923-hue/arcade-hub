import { and, desc, eq, lt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { dailyCompletions, games, scores } from "@/db/schema";

const TZ_OFFSET_MS = 8 * 60 * 60 * 1000;
const FALLBACK_TARGET = 100;

export function dayKeyOf(date = new Date()): string {
  return new Date(date.getTime() + TZ_OFFSET_MS).toISOString().slice(0, 10);
}

function dayStartUtc(day: string): Date {
  return new Date(`${day}T00:00:00+08:00`);
}

function shiftDay(day: string, delta: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type DailyGame = {
  id: number;
  slug: string;
  title: string;
  thumbnail: string;
};

export type DailyChallenge = {
  day: string;
  dayLabel: string;
  game: DailyGame;
  target: number;
};

export type ChallengeStatus = {
  completed: boolean;
  bestScore: number;
  streak: number;
  total: number;
};

async function publishedScoreGames(): Promise<DailyGame[]> {
  const db = getDb();
  return db
    .select({ id: games.id, slug: games.slug, title: games.title, thumbnail: games.thumbnail })
    .from(games)
    .where(and(eq(games.status, "published"), eq(games.hasScore, true)))
    .orderBy(games.sortOrder, games.id);
}

// 目标取该游戏「今天之前」成绩的 p75：当天内不会随新提交漂移。
async function challengeTarget(gameId: number, day: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({
      p75: sql<number>`coalesce(round(percentile_cont(0.75) within group (order by ${scores.score}))::int, 0)`.mapWith(
        Number
      ),
    })
    .from(scores)
    .where(and(eq(scores.gameId, gameId), lt(scores.createdAt, dayStartUtc(day))));
  return Math.max(FALLBACK_TARGET, row?.p75 ?? 0);
}

export async function getDailyChallenge(date = new Date()): Promise<DailyChallenge | null> {
  const list = await publishedScoreGames();
  if (!list.length) return null;
  const day = dayKeyOf(date);
  const game = list[hash(`arcade:${day}`) % list.length];
  const target = await challengeTarget(game.id, day);
  const dayLabel = new Date(`${day}T12:00:00+08:00`).toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    timeZone: "Asia/Shanghai",
  });
  return { day, dayLabel, game, target };
}

export async function getChallengeStatus(
  userId: number,
  challenge: DailyChallenge
): Promise<ChallengeStatus> {
  const db = getDb();
  const [todayRows, rows, totalRows] = await Promise.all([
    db
      .select({ bestScore: dailyCompletions.bestScore })
      .from(dailyCompletions)
      .where(and(eq(dailyCompletions.userId, userId), eq(dailyCompletions.day, challenge.day)))
      .limit(1),
    db
      .select({ day: dailyCompletions.day })
      .from(dailyCompletions)
      .where(eq(dailyCompletions.userId, userId))
      .orderBy(desc(dailyCompletions.day))
      .limit(400),
    db
      .select({ n: sql<number>`count(*)`.mapWith(Number) })
      .from(dailyCompletions)
      .where(eq(dailyCompletions.userId, userId)),
  ]);
  const todayRow = todayRows[0];
  const totalRow = totalRows[0];
  const days = new Set(rows.map((r) => r.day));

  // 今天还没完成时从昨天起算，别让「今天还没玩」立刻把连击清零。
  let cursor = days.has(challenge.day) ? challenge.day : shiftDay(challenge.day, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = shiftDay(cursor, -1);
  }

  return {
    completed: Boolean(todayRow),
    bestScore: todayRow?.bestScore ?? 0,
    streak,
    total: totalRow?.n ?? 0,
  };
}

export async function recordDailyCompletion(
  userId: number,
  gameId: number,
  score: number
): Promise<{ completed: boolean; target: number } | null> {
  const challenge = await getDailyChallenge();
  if (!challenge || challenge.game.id !== gameId) return null;
  if (score < challenge.target) return { completed: false, target: challenge.target };

  const db = getDb();
  await db
    .insert(dailyCompletions)
    .values({ userId, gameId, day: challenge.day, bestScore: score })
    .onConflictDoUpdate({
      target: [dailyCompletions.userId, dailyCompletions.day],
      set: { bestScore: sql`greatest(${dailyCompletions.bestScore}, ${score})` },
    });
  return { completed: true, target: challenge.target };
}
