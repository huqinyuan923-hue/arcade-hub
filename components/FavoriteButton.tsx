"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FavoriteButton({
  slug,
  initial,
}: {
  slug: string;
  initial: boolean;
}) {
  const [favorited, setFavorited] = useState(initial);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      // 同源 API 路径：slug 仅作路径段使用，服务端做参数化查询与存在性校验
      const res = await fetch(
        encodeURI(`/api/games/${encodeURIComponent(slug)}/favorite`),
        { method: "POST" }
      );
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/game/${slug}`)}`);
        return;
      }
      const d = await res.json();
      if (res.ok) {
        setFavorited(d.favorited);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        favorited ? "btn-neon-pink" : "btn-neon"
      } ${busy ? "opacity-60" : ""}`}
    >
      {favorited ? "❤️ 已收藏" : "🤍 收藏"}
    </button>
  );
}
