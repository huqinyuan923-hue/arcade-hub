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
  const lastScoreRef = useRef<{ score: number; at: number }>({ score: -1, at: 0 });
  // iframe 的 load 事件可能早于 React 水合挂上监听（SSR 场景必然如此），
  // React 的 onLoad 属性因此收不到回调——必须用 ref 回调挂原生监听并检查 readyState。
  function attachFrame(el: HTMLIFrameElement | null) {
    frameRef.current = el;
    if (!el) return;
    const markLoaded = () => {
      setLoading(false);
      el.focus();
    };
    try {
      if (el.contentDocument?.readyState === "complete") {
        markLoaded();
        return;
      }
    } catch {
      /* 不可能：本站 iframe 同源 */
    }
    el.addEventListener("load", markLoaded, { once: true });
  }
  const [frameKey, setFrameKey] = useState(0);
  const [toast, setToast] = useState<Toast>(null);
  const [best, setBest] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
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
  // 按键转发由下方内联脚本负责——它在 HTML 解析阶段就生效，不依赖 React 水合
  // 时机（水合前的按键 otherwise 会丢失，这正是「游戏没反应」的根因）。
  const focusFrame = () => frameRef.current?.focus();
  useEffect(() => {
    setLoading(true);
    const t = window.setTimeout(focusFrame, 300);
    return () => window.clearTimeout(t);
  }, [frameKey]);
  // 兜底：无论 load 事件是否被错过，遮罩最多显示 4 秒
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 4000);
    return () => window.clearTimeout(t);
  }, [frameKey]);
  useEffect(() => {
    const onFocus = () => frameRef.current?.focus();
    document.addEventListener("fullscreenchange", onFocus);
    return () => document.removeEventListener("fullscreenchange", onFocus);
  }, []);

  // 内联键盘转发脚本：SSR 输出，解析即生效。
  // 逻辑：父页面收到按键 = iframe 没焦点 → 聚焦 iframe 并把这次按键原样转发进游戏。
  const keyForwardScript = `
(function () {
  if (window.__arcadeKeyForward) return;
  window.__arcadeKeyForward = true;
  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return; // 放行浏览器快捷键
    var k = e.key;
    var interesting = k.length === 1 || ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter','Escape'].indexOf(k) >= 0;
    if (!interesting) return;
    var frame = document.querySelector('iframe[aria-label$="游戏区域"]');
    if (!frame) return;
    e.preventDefault();
    frame.focus();
    var win = frame.contentWindow;
    if (!win) return;
    win.dispatchEvent(new KeyboardEvent(e.type, {
      key: e.key, code: e.code, location: e.location,
      ctrlKey: e.ctrlKey, shiftKey: e.shiftKey, altKey: e.altKey, metaKey: e.metaKey,
      repeat: e.repeat, bubbles: true, cancelable: true
    }));
  }
  window.addEventListener('keydown', onKey, true);
  window.addEventListener('keyup', onKey, true);
})();
`;

  // 接收站内游戏上报的成绩
  useEffect(() => {
    async function onMessage(e: MessageEvent) {
      const data = e.data;
      if (!data || data.type !== "arcade:score" || typeof data.score !== "number") return;
      // 防抖：3 秒内相同成绩视为重复上报（部分游戏会多次触发 submit）
      const now = Date.now();
      if (lastScoreRef.current.score === Math.round(data.score) && now - lastScoreRef.current.at < 3000) return;
      lastScoreRef.current = { score: Math.round(data.score), at: now };
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
      <script dangerouslySetInnerHTML={{ __html: keyForwardScript }} />
      <div
        ref={wrapRef}
        className="relative w-full aspect-[4/3] sm:aspect-video bg-black"
        onMouseEnter={focusFrame}
        onMouseDown={focusFrame}
      >
        <iframe
          key={frameKey}
          ref={attachFrame}
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
        {loading && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[#0d0b1e] pointer-events-none"
            style={{ animation: "arcade-loading-hide .4s ease 3.6s forwards" }}
          >
            <div className="flex gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-neon-cyan animate-pulse" />
              <span className="w-2.5 h-2.5 rounded-full bg-neon-pink animate-pulse [animation-delay:150ms]" />
              <span className="w-2.5 h-2.5 rounded-full bg-neon-yellow animate-pulse [animation-delay:300ms]" />
            </div>
            <p className="font-arcade text-[9px] text-slate-500 tracking-widest">LOADING…</p>
          </div>
        )}
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
