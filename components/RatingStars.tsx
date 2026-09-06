"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RatingStars({
  slug,
  initialAvg,
  initialCount,
}: {
  slug: string;
  initialAvg: number;
  initialCount: number;
}) {
  const [avg, setAvg] = useState(initialAvg);
  const [count, setCount] = useState(initialCount);
  const [hover, setHover] = useState(0);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function rate(value: number) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/games/${slug}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/game/${slug}`)}`);
        return;
      }
      const d = await res.json();
      if (res.ok) {
        setAvg(d.avgRating);
        setCount(d.ratingCount);
      }
    } finally {
      setBusy(false);
    }
  }

  const shown = hover || Math.round(avg);
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onMouseEnter={() => setHover(n)}
            onClick={() => rate(n)}
            disabled={busy}
            className={`text-xl leading-none px-0.5 transition-transform hover:scale-125 ${
              n <= shown ? "text-neon-yellow" : "text-slate-600"
            }`}
            aria-label={`评 ${n} 星`}
          >
            ★
          </button>
        ))}
      </div>
      <span className="text-slate-400">
        {count > 0 ? `${avg.toFixed(1)} 分（${count} 人评）` : "暂无评分，来评第一个"}
      </span>
    </div>
  );
}
