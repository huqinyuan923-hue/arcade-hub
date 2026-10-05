import Link from "next/link";
import type { Metadata } from "next";
import GameCard from "@/components/GameCard";
import GameToolsBar from "@/components/GameToolsBar";
import { getCategories, listGames } from "@/lib/games";

export const dynamic = "force-dynamic";

// 搜索结果页不收录，避免生成大量低质搜索 URL
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `“${q}”的搜索结果` : "全部游戏",
    robots: q ? { index: false, follow: true } : undefined,
  };
}

const SORTS = [
  { key: "hot", label: "最热" },
  { key: "new", label: "最新" },
  { key: "rating", label: "高分" },
] as const;

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const category = sp.category ?? "";
  const sort = (["hot", "new", "rating"].includes(sp.sort ?? "") ? sp.sort : "hot") as
    | "hot"
    | "new"
    | "rating";

  const [games, categories] = await Promise.all([
    listGames({ q: q || undefined, category: category || undefined, sort, limit: 200 }),
    getCategories(),
  ]);

  const chipHref = (c: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (c) p.set("category", c);
    p.set("sort", sort);
    return `/games?${p.toString()}`;
  };
  const sortHref = (s: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (category) p.set("category", category);
    p.set("sort", s);
    return `/games?${p.toString()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            🎮 <span className="text-neon-cyan neon-text">游戏大厅</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">共 {games.length} 款游戏</p>
        </div>
        <form action="/games" method="get" className="flex gap-2">
          {category && <input type="hidden" name="category" value={category} />}
          <input type="hidden" name="sort" value={sort} />
          <input
            id="game-search"
            name="q"
            defaultValue={q}
            placeholder="搜索游戏…"
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/15 text-sm w-48 sm:w-64 outline-none focus:border-neon-cyan placeholder:text-slate-500"
          />
          <button type="submit" className="btn-neon px-4 py-2 rounded-xl text-sm font-medium">
            搜索
          </button>
        </form>
        <GameToolsBar slugs={games.map((g) => g.slug)} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={chipHref("")}
          className={`px-3.5 py-1.5 rounded-xl text-sm transition-colors ${
            category === "" ? "bg-neon-cyan/20 border border-neon-cyan/60 text-neon-cyan" : "chip"
          }`}
        >
          全部
        </Link>
        {categories.map((c) => (
          <Link
            key={c.category}
            href={chipHref(c.category)}
            className={`px-3.5 py-1.5 rounded-xl text-sm transition-colors ${
              category === c.category
                ? "bg-neon-cyan/20 border border-neon-cyan/60 text-neon-cyan"
                : "chip"
            }`}
          >
            {c.category}
          </Link>
        ))}
        <span className="mx-2 h-5 w-px bg-white/15 hidden sm:block" />
        {SORTS.map((s) => (
          <Link
            key={s.key}
            href={sortHref(s.key)}
            className={`px-3.5 py-1.5 rounded-xl text-sm transition-colors ${
              sort === s.key
                ? "bg-neon-pink/20 border border-neon-pink/60 text-neon-pink"
                : "chip"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {games.length ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {games.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      ) : (
        <div className="card p-14 text-center text-slate-400">
          <p className="text-3xl mb-3">👾</p>
          没有找到匹配的游戏，换个关键词试试？
        </div>
      )}
    </div>
  );
}
