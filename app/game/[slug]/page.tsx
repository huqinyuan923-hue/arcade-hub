import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import GameCard from "@/components/GameCard";
import GameFrame from "@/components/GameFrame";
import FavoriteButton from "@/components/FavoriteButton";
import RatingStars from "@/components/RatingStars";
import { getSessionUser } from "@/lib/auth";
import {
  formatPlays,
} from "@/components/GameCard";
import {
  getFavoriteCount,
  getGameBySlug,
  getRelatedGames,
  getTopScores,
  isFavorited,
} from "@/lib/games";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) return { title: "游戏不存在" };
  return {
    title: game.title,
    description: game.description,
    robots: game.status !== "published" ? { index: false, follow: false } : undefined,
    openGraph: {
      title: game.title,
      description: game.description,
      images: [{ url: game.thumbnail, alt: game.title }],
    },
  };
}

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game || game.status !== "published") notFound();

  const user = await getSessionUser();
  const [topScores, favCount, related, favorited] = await Promise.all([
    game.hasScore ? getTopScores(game.id, 10) : Promise.resolve([]),
    getFavoriteCount(game.id),
    getRelatedGames(game, 6),
    user ? isFavorited(user.id, game.id) : Promise.resolve(false),
  ]);

  // Next.js 不解析目录索引：站内游戏必须指向完整 index.html，尾部斜杠路径会 404
  const rawPlayPath = game.playPath ?? `/games/${game.slug}/index.html`;
  const playPath = game.sourceType === "iframe" ? "" : rawPlayPath.endsWith(".html") ? rawPlayPath : rawPlayPath.replace(/\/?$/, "index.html");
  const src = game.sourceType === "iframe" ? (game.embedUrl ?? "") : playPath;

  return (
    <div className="flex flex-col gap-6">
      <nav className="text-sm text-slate-400 flex items-center gap-2">
        <Link href="/games" className="hover:text-neon-cyan">
          游戏大厅
        </Link>
        <span>/</span>
        <Link
          href={`/games?category=${encodeURIComponent(game.category)}`}
          className="hover:text-neon-cyan"
        >
          {game.category}
        </Link>
        <span>/</span>
        <span className="text-slate-200">{game.title}</span>
      </nav>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="flex flex-col gap-4">
          <GameFrame slug={game.slug} title={game.title} src={src} />

          <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-bold text-white">{game.title}</h1>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="chip px-2 py-0.5 rounded-md">{game.category}</span>
                <span>▶ 已游玩 {formatPlays(game.plays)} 次</span>
                <span>❤️ {favCount} 人收藏</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <FavoriteButton slug={game.slug} initial={favorited} />
              <RatingStars
                slug={game.slug}
                initialAvg={game.avgRating}
                initialCount={game.ratingCount}
              />
            </div>
          </div>

          {game.description && (
            <div className="card p-5">
              <h2 className="font-semibold text-neon-cyan mb-2">📋 游戏介绍</h2>
              <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                {game.description}
              </p>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <div className="card p-5">
            <h2 className="font-semibold text-neon-pink neon-text-pink mb-3">🏆 排行榜 TOP 10</h2>
            {topScores.length ? (
              <ol className="flex flex-col gap-2 text-sm">
                {topScores.map((s, i) => (
                  <li
                    key={`${s.username}-${i}`}
                    className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2"
                  >
                    <span
                      className={`w-6 text-center font-bold ${
                        i === 0
                          ? "text-neon-yellow"
                          : i === 1
                            ? "text-slate-300"
                            : i === 2
                              ? "text-amber-600"
                              : "text-slate-500"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate text-slate-200">{s.username}</span>
                    <span className="font-mono font-semibold text-neon-cyan">{s.best}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-slate-400">
                还没有人上榜，
                <Link href="/register" className="text-neon-cyan underline">
                  注册
                </Link>
                后成为第一位冠军！
              </p>
            )}
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-slate-200 mb-2">💡 操作说明</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              游戏内使用键盘方向键 / WASD 或鼠标操作，手机端支持触屏。
              点击下方「全屏」可获得最佳体验。
            </p>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-4">🎯 相关游戏</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {related.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
