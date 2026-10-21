"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { GameWithRating } from "@/lib/games";

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReduceMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCE_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getReduceMotion(): boolean {
  return window.matchMedia(REDUCE_QUERY).matches;
}

function getReduceMotionOnServer(): boolean {
  return false;
}

export default function FeaturedCarousel({ games }: { games: GameWithRating[] }) {
  const [idx, setIdx] = useState(0);
  const [hover, setHover] = useState(false);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeReduceMotion,
    getReduceMotion,
    getReduceMotionOnServer
  );

  useEffect(() => {
    if (games.length < 2 || hover || paused || reducedMotion) return;
    const t = window.setInterval(() => setIdx((i) => (i + 1) % games.length), 6000);
    return () => window.clearInterval(t);
  }, [games.length, hover, paused, reducedMotion]);

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
        <div className="absolute bottom-2 right-3 flex items-center gap-0.5">
          {!reducedMotion && (
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-pressed={paused}
              aria-label={paused ? "继续自动轮播" : "暂停自动轮播"}
              className="mr-1 h-6 w-6 rounded-md bg-black/50 border border-white/20 text-[10px] text-slate-200 hover:text-neon-cyan flex items-center justify-center"
            >
              <span aria-hidden="true">{paused ? "▶" : "❚❚"}</span>
            </button>
          )}
          {games.map((g, i) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`切换到 ${g.title}`}
              aria-current={i === idx ? "true" : undefined}
              className="h-6 w-6 rounded-full flex items-center justify-center"
            >
              <span
                aria-hidden="true"
                className={`block w-2.5 h-2.5 rounded-full transition-all ${
                  i === idx ? "bg-neon-cyan shadow-[0_0_8px_rgba(34,211,238,0.9)]" : "bg-white/30"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
