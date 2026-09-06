import { and, asc, desc, eq, getTableColumns, ilike, ne, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { favorites, games, ratings, scores, users } from "@/db/schema";
import type { Game } from "@/db/schema";

export type GameWithRating = Game & {
  avgRating: number;
  ratingCount: number;
};

const ratingAgg = {
  avgRating: sql<number>`coalesce(round(avg(${ratings.value})::numeric, 1), 0)`.mapWith(Number),
  ratingCount: sql<number>`count(${ratings.id})`.mapWith(Number),
};

const baseSelect = {
  ...getTableColumns(games),
  ...ratingAgg,
};

export type ListGamesOptions = {
  q?: string;
  category?: string;
  sort?: "hot" | "new" | "rating";
  limit?: number;
  offset?: number;
  includeHidden?: boolean;
};

export async function listGames(opts: ListGamesOptions = {}): Promise<GameWithRating[]> {
  const db = getDb();
  const conditions = [];
  if (!opts.includeHidden) conditions.push(eq(games.status, "published"));
  if (opts.category) conditions.push(eq(games.category, opts.category));
  if (opts.q) {
    const kw = `%${opts.q}%`;
    conditions.push(or(ilike(games.title, kw), ilike(games.description, kw))!);
  }

  const orderBy =
    opts.sort === "new"
      ? [desc(games.createdAt)]
      : opts.sort === "rating"
        ? [desc(sql`coalesce(avg(${ratings.value}), 0)`), desc(games.plays)]
        : [desc(games.plays), desc(games.id)];

  const rows = await db
    .select(baseSelect)
    .from(games)
    .leftJoin(ratings, eq(ratings.gameId, games.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(games.id)
    .orderBy(...orderBy)
    .limit(opts.limit ?? 24)
    .offset(opts.offset ?? 0);
  return rows;
}

export async function getFeaturedGames(limit = 5): Promise<GameWithRating[]> {
  const db = getDb();
  return db
    .select(baseSelect)
    .from(games)
    .leftJoin(ratings, eq(ratings.gameId, games.id))
    .where(and(eq(games.status, "published"), eq(games.featured, true)))
    .groupBy(games.id)
    .orderBy(desc(games.plays))
    .limit(limit);
}

export async function getGameBySlug(slug: string): Promise<GameWithRating | null> {
  const db = getDb();
  const rows = await db
    .select(baseSelect)
    .from(games)
    .leftJoin(ratings, eq(ratings.gameId, games.id))
    .where(eq(games.slug, slug))
    .groupBy(games.id)
    .limit(1);
  return rows[0] ?? null;
}

export async function getRelatedGames(game: Game, limit = 6): Promise<GameWithRating[]> {
  const db = getDb();
  return db
    .select(baseSelect)
    .from(games)
    .leftJoin(ratings, eq(ratings.gameId, games.id))
    .where(
      and(
        eq(games.status, "published"),
        eq(games.category, game.category),
        ne(games.id, game.id)
      )
    )
    .groupBy(games.id)
    .orderBy(desc(games.plays))
    .limit(limit);
}

export async function getTopScores(gameId: number, limit = 10) {
  const db = getDb();
  return db
    .select({
      username: users.username,
      best: sql<number>`max(${scores.score})`.mapWith(Number),
      playedAt: sql<string>`max(${scores.createdAt})`,
    })
    .from(scores)
    .innerJoin(users, eq(users.id, scores.userId))
    .where(eq(scores.gameId, gameId))
    .groupBy(scores.userId, users.username)
    .orderBy(desc(sql`max(${scores.score})`))
    .limit(limit);
}

export async function getCategories(): Promise<{ category: string; count: number }[]> {
  const db = getDb();
  return db
    .select({
      category: games.category,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(games)
    .where(eq(games.status, "published"))
    .groupBy(games.category)
    .orderBy(asc(games.category));
}

export async function getFavoriteCount(gameId: number): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(favorites)
    .where(eq(favorites.gameId, gameId));
  return rows[0]?.count ?? 0;
}

export async function isFavorited(userId: number, gameId: number): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.gameId, gameId)))
    .limit(1);
  return rows.length > 0;
}

export function slugify(input: string): string {
  const ascii = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return ascii || `game-${Date.now().toString(36)}`;
}
