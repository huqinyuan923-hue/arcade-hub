import Link from "next/link";
import type { GameWithRating } from "@/lib/games";

export function formatPlays(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return String(n);
}

export default function GameCard({ game }: { game: GameWithRating }) {
  return (
    <Link
      href={`/game/${game.slug}`}
      className="card card-hover overflow-hidden group flex flex-col"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#120f28]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={game.thumbnail || "/thumbs/default.svg"}
          alt={game.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md chip text-[11px]">
          {game.category}
        </span>
        {"featured" in game && (game as { featured?: boolean }).featured && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-neon-cyan/20 border border-neon-cyan/50 text-[11px] text-neon-cyan">
            🔥 精选
          </span>
        )}
        {game.sourceType === "iframe" && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/50 border border-white/20 text-[11px] text-slate-200">
            第三方
          </span>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col gap-1.5">
        <h3 className="font-semibold text-[15px] text-slate-100 truncate group-hover:text-neon-cyan transition-colors">
          {game.title}
        </h3>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="text-neon-yellow">
            {"★".repeat(Math.round(game.avgRating || 0))}
            <span className="text-slate-500 ml-1">
              {game.ratingCount > 0 ? game.avgRating.toFixed(1) : "暂无评分"}
            </span>
          </span>
          <span>▶ {formatPlays(game.plays)}</span>
        </div>
      </div>
    </Link>
  );
}
