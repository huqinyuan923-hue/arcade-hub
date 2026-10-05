"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ToastKind = "info" | "success" | "warn";
type Toast = { text: string; kind: ToastKind } | null;

export default function GameFrame({
  slug,
  title,
  src,
  sandbox,
}: {
  slug: string;
  title: string;
  src: string;
  sandbox?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const playCounted = useRef(false);
  const [frameKey, setFrameKey] = useState(0);
  const [toast, setToast] = useState<Toast>(null);
  const [best, setBest] = useState<number | null>(null);
  const router = useRouter();

  function showToast(text: string, kind: ToastKind = "info") {
    setToast({ text, kind });
    window.setTimeout(() => setToast(null), 3500);
  }

  // 进入游戏页计一次游玩
  useEffect(() => {
    if (playCounted.current) return;
    playCounted.current = true;
    fetch(`/api/games/${slug}/play`, { method: "POST" }).catch(() => {});
  }, [slug]);

  // 键盘适配：聚焦 iframe 后方向键才会进游戏（否则只会滚动页面）
  // 载入后自动聚焦；鼠标移入/点击游戏区时重新聚焦
  const focusFrame = () => frameRef.current?.focus();
  useEffect(() => {
    const t = window.setTimeout(focusFrame, 300);
    return () => window.clearTimeout(t);
  }, [frameKey]);
  useEffect(() => {
    const onFocus = () => frameRef.current?.focus();
    document.addEventListener("fullscreenchange", onFocus);
    return () => document.removeEventListener("fullscreenchange", onFocus);
  }, []);

  // 接收站内游戏上报的成绩
  useEffect(() => {
    async function onMessage(e: MessageEvent) {
      const data = e.data;
      if (!data || data.type !== "arcade:score" || typeof data.score !== "number") return;
      try {
        const res = await fetch(`/api/games/${slug}/scores`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score: Math.round(data.score) }),
        });
        if (res.status === 401) {
          showToast("登录后才能上榜哦", "warn");
          return;
        }
        const d = await res.json();
        if (!res.ok) return;
        if (d.isNewBest) {
          setBest(d.score ?? data.score);
          showToast(`🎉 新纪录 ${data.score}！当前第 ${d.rank} 名`, "success");
        } else {
          showToast(`成绩 ${data.score}（最高 ${d.previousBest}）`, "info");
        }
        router.refresh();
      } catch {
        /* 忽略网络抖动 */
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [slug, router]);

  function goFullscreen() {
    const el = wrapRef.current;
    if (el) {
      if (document.fullscreenElement) document.exitFullscreen();
      else el.requestFullscreen?.();
    }
  }

  return (
    <div className="card overflow-hidden relative scanlines">
      <div
        ref={wrapRef}
        className="relative w-full aspect-[4/3] sm:aspect-video bg-black"
        onMouseEnter={focusFrame}
        onMouseDown={focusFrame}
      >
        <iframe
          key={frameKey}
          ref={frameRef}
          src={src}
          title={title}
          aria-label={`${title} 游戏区域`}
          className="absolute inset-0 w-full h-full outline-none"
          sandbox={
            sandbox ??
            "allow-scripts allow-same-origin allow-pointer-lock allow-popups allow-forms"
          }
          allow="autoplay; fullscreen; gamepad *; microphone; clipboard-write"
          allowFullScreen
        />
        {toast && (
          <div
            className={`absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-sm font-medium shadow-lg backdrop-blur border z-10 ${
              toast.kind === "success"
                ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-100"
                : toast.kind === "warn"
                  ? "bg-amber-500/20 border-amber-400/50 text-amber-100"
                  : "bg-cyan-500/20 border-cyan-400/50 text-cyan-100"
            }`}
          >
        {toast.kind === "warn" ? (
          <>
            {toast.text}{" "}
            <Link
              href={`/login?next=${encodeURIComponent(`/game/${slug}`)}`}
              className="underline"
            >
              去登录
            </Link>
          </>
        ) : (
          <>
            {toast.text}{" "}
            <Link href="/leaderboard" className="underline font-medium">
              看排行榜 →
            </Link>
          </>
        )}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between px-3 py-2 border-t border-white/10 text-sm">
        <div className="text-slate-400">
          {best !== null ? (
            <span>
              本次会话最高：<span className="text-neon-yellow font-semibold">{best}</span>
            </span>
          ) : (
            <span>游戏结束会自动上报成绩参与排行</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFrameKey((k) => k + 1)}
            className="px-3 py-1.5 rounded-lg btn-neon text-xs"
          >
            ↻ 重新开始
          </button>
          <button
            onClick={goFullscreen}
            className="px-3 py-1.5 rounded-lg btn-neon-pink text-xs"
          >
            ⛶ 全屏
          </button>
        </div>
      </div>
    </div>
  );
}
