"use client";

import Link from "next/link";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
      <p className="font-arcade text-4xl text-neon-yellow">:(</p>
      <h1 className="text-xl font-bold text-slate-200">机台出了点故障</h1>
      <p className="text-sm text-slate-400">页面加载出错了，重试一下通常就好。</p>
      <div className="flex gap-3">
        <button onClick={reset} className="px-5 py-2.5 rounded-xl btn-neon text-sm">
          ↻ 重试
        </button>
        <Link href="/" className="px-5 py-2.5 rounded-xl btn-neon-pink text-sm">
          🏠 回游戏厅
        </Link>
      </div>
    </div>
  );
}
