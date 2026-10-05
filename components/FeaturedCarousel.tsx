"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { GameWithRating } from "@/lib/games";

export default function FeaturedCarousel({ games }: { games: GameWithRating[] }) {
  const [idx, setIdx] = useState(0);
  const [hover, setHover] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (games.length < 2 || hover || reducedMotion) return;
    const t = window.setInterval(() => setIdx((i) => (i + 1) % games.length), 6000);
    return () => window.clearInterval(t);
  }, [games.length, hover, reducedMotion]);

  if (!games.length) return null;
  const game = games[idx];

  return (
    <div
      className="card overflow-hidden relative scanlines"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <div className="relative aspect-[16/7] sm:aspect-[21/8]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={game.thumbnail || "/thumbs/default.svg"}
          alt={game.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070510] via-[#070510]/70 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 gap-3">
          <span className="chip px-3 py-1 rounded-lg text-xs w-fit">🔥 本周精选</span>
          <h2 className="text-2xl sm:text-4xl font-bold text-white drop-shadow-lg max-w-xl">
            {game.title}
          </h2>
          <p className="text-sm sm:text-base text-slate-300 line-clamp-2 max-w-lg hidden sm:block">
            {game.description}
          </p>
          <Link
            href={`/game/${game.slug}`}
            className="btn-neon px-6 py-2.5 rounded-xl font-semibold w-fit"
          >
            ▶ 立即开玩
          </Link>
        </div>
      </div>
      {games.length > 1 && (
        <div className="absolute bottom-3 right-4 flex gap-2">
          {games.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`第 ${i + 1} 个`}
              aria-current={i === idx}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === idx ? "bg-neon-cyan shadow-[0_0_8px_rgba(34,211,238,0.9)]" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
