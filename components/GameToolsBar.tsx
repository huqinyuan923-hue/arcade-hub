"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * 游戏大厅工具条：
 * - "/" 快捷键聚焦搜索框（需页面里存在 id="game-search" 的输入框）
 * - 随机开一局：从传入的游戏 slug 里随机挑一款直接进入
 */
export default function GameToolsBar({ slugs }: { slugs: string[] }) {
  const router = useRouter();
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        document.getElementById("game-search")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function randomGame() {
    if (!slugs.length) return;
    const pick = slugs[Math.random() * slugs.length | 0];
    setPicking(true);
    router.push(`/game/${pick}`);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={randomGame}
        disabled={picking}
        className="px-4 py-2 rounded-xl text-sm font-medium btn-neon-pink whitespace-nowrap disabled:opacity-50"
        title="随机进入一款游戏（原始人寻宝模式）"
      >
        🎲 随机开一局
      </button>
      <span className="hidden sm:inline text-xs text-slate-500">按 / 搜索</span>
    </div>
  );
}
